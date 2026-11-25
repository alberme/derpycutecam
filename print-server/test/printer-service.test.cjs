const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadPrinterService } = require("./helpers/load-printer-service.cjs");

const job = {
  id: "job-1", cupsJobId: null, status: "queued", error: null,
  createdAt: "2026-11-24T12:00:00Z", updatedAt: "2026-11-24T12:00:00Z",
};
const status = { state: "idle", hasError: false, reasons: ["none"] };
const unavailable = {
  state: "unavailable", hasError: true, errors: ["printer-unreachable"],
};
const response = (data, code = 200) => ({
  ok: code >= 200 && code < 300, status: code, json: async () => data,
});

class PhotoFile {
  constructor(uri) { this.uri = uri; }
}

class MultipartBody {
  constructor() { this.parts = []; }
  append(...part) { this.parts.push(part); }
}

function setup(t, options = {}) {
  const timers = new Map();
  let timerId = 0;
  const fetch = t.mock.fn(options.fetch ?? (async () => response(job)));
  const clearTimeout = t.mock.fn(id => timers.delete(id));
  const service = loadPrinterService({
    ...options, fetch, File: PhotoFile,
    globals: {
      FormData: MultipartBody,
      setTimeout(callback, delay) {
        timers.set(++timerId, { callback, delay });
        return timerId;
      },
      clearTimeout,
    },
  });
  t.after(() => assert.equal(timers.size, 0, "request timers must be cleaned up"));
  return {
    ...service, fetch, clearTimeout,
    expireRequest() {
      assert.equal(timers.size, 1);
      const [id, timer] = timers.entries().next().value;
      assert.equal(timer.delay, 30_000);
      timers.delete(id);
      timer.callback();
    },
  };
}

function printerError(service, message, retryable) {
  return error => {
    assert(error instanceof service.PrinterError);
    assert.equal(error.name, "PrinterError");
    assert.equal(error.message, message);
    assert.equal(error.retryable, retryable);
    return true;
  };
}

test("PrinterError preserves its message and retry policy", t => {
  const service = setup(t);
  for (const retryable of [true, false]) {
    const error = new service.PrinterError("Printer failed", retryable);
    assert(error instanceof Error);
    assert.equal(error.name, "PrinterError");
    assert.equal(error.message, "Printer failed");
    assert.equal(error.retryable, retryable);
  }
});

test("getPrintJob encodes job IDs and authenticates the request", async t => {
  const service = setup(t);
  assert.strictEqual(await service.getPrintJob("job /?#é"), job);
  const [url, options] = service.fetch.mock.calls[0].arguments;
  assert.equal(url, "http://booth:3000/jobs/job%20%2F%3F%23%C3%A9");
  assert.equal(options.headers["x-api-key"], "test-key");
  assert(options.signal instanceof AbortSignal);
  assert.equal(options.signal.aborted, false);
  assert.equal(service.clearTimeout.mock.callCount(), 1);
});

test("getPrinterStatus returns validated physical printer status", async t => {
  const service = setup(t, { fetch: async () => response(status) });
  assert.strictEqual(await service.getPrinterStatus(), status);
  assert.equal(service.fetch.mock.calls[0].arguments[0], "http://booth:3000/status");
});

for (const server of ["", "not a URL", "ftp://booth:3000"]) {
  test(`invalid server ${JSON.stringify(server)} fails before fetching`, async t => {
    const service = setup(t, { server });
    await assert.rejects(service.getPrinterStatus(), printerError(service,
      "The print server URL is invalid. Please contact the booth host.", false));
    assert.equal(service.fetch.mock.callCount(), 0);
  });
}

for (const constants of [
  {}, { expoConfig: null }, { expoConfig: {} }, { expoConfig: { extra: {} } },
  ...[null, "", " \t ", 123].map(printerApiKey => ({ expoConfig: { extra: { printerApiKey } } })),
]) {
  test(`missing or invalid API key: ${JSON.stringify(constants)}`, async t => {
    const service = setup(t, { constants });
    await assert.rejects(service.getPrintJob("job-1"), printerError(service,
      "Printer API key is missing. Please contact the booth host.", false));
    assert.equal(service.fetch.mock.callCount(), 0);
  });
}

for (const code of [400, 401, 403, 404, 408, 429, 500, 503]) {
  test(`HTTP ${code} preserves the correct message and retry policy`, async t => {
    const service = setup(t, { fetch: async () => response({ error: "Server detail" }, code) });
    const message = code === 401
      ? "Printer authentication failed. Please contact the booth host."
      : "Server detail";
    await assert.rejects(service.getPrintJob("job-1"), printerError(service,
      `${message} (HTTP ${code})`, code >= 500 || [408, 429].includes(code)));
  });
}

for (const payload of [null, { error: 123 }]) {
  test(`HTTP errors without a string message use a fallback: ${JSON.stringify(payload)}`, async t => {
    const service = setup(t, { fetch: async () => response(payload, 502) });
    await assert.rejects(service.getPrinterStatus(), printerError(service,
      "The print server could not complete the request. (HTTP 502)", true));
  });
}

test("only the status endpoint accepts valid unavailable data with HTTP 503", async t => {
  const service = setup(t, { fetch: async () => response(unavailable, 503) });
  assert.strictEqual(await service.getPrinterStatus(), unavailable);
  await assert.rejects(service.getPrintJob("job-1"), printerError(service,
    "The print server could not complete the request. (HTTP 503)", true));
  await assert.rejects(service.submitPrint("file:///photo.jpg", "request-1"), printerError(service,
    "The print server could not complete the request. (HTTP 503)", true));
});

test("unavailable status does not bypass authentication or other HTTP failures", async t => {
  for (const code of [401, 500]) {
    const service = setup(t, { fetch: async () => response(unavailable, code) });
    await assert.rejects(service.getPrinterStatus(), printerError(service,
      code === 401
        ? "Printer authentication failed. Please contact the booth host. (HTTP 401)"
        : "The print server could not complete the request. (HTTP 500)", code >= 500));
  }
});

test("malformed unavailable status remains an HTTP failure", async t => {
  const service = setup(t, { fetch: async () => response({ state: "unavailable" }, 503) });
  await assert.rejects(service.getPrinterStatus(), printerError(service,
    "The print server could not complete the request. (HTTP 503)", true));
});

for (const [method, args, payloads] of [
  ["getPrintJob", ["job-1"], [null, {}, { id: "", status: "queued" }, { id: "job-1", status: "unknown" }]],
  ["getPrinterStatus", [], [null, {}, { state: "idle" }, { state: "idle", hasError: false, reasons: [1] },
    { state: "idle", hasError: false, errors: "offline" }]],
  ["submitPrint", ["file:///photo.jpg", "request-1"], [{ id: "job-1", status: "unknown" }]],
]) {
  test(`${method} rejects malformed successful responses`, async t => {
    for (const payload of payloads) {
      const service = setup(t, { fetch: async () => response(payload) });
      await assert.rejects(service[method](...args), printerError(service,
        "The print server returned an invalid response.", true));
    }
  });
}

for (const code of [200, 500]) {
  test(`invalid JSON on HTTP ${code} becomes a PrinterError`, async t => {
    const service = setup(t, {
      fetch: async () => ({ ...response(null, code), json: async () => { throw new SyntaxError("Invalid JSON"); } }),
    });
    await assert.rejects(service.getPrinterStatus(), printerError(service, code === 200
      ? "The print server returned an invalid response."
      : "The print server could not complete the request. (HTTP 500)", true));
  });
}

test("network failures become retryable connection errors", async t => {
  const service = setup(t, { fetch: async () => { throw new TypeError("Network down"); } });
  await assert.rejects(service.getPrintJob("job-1"), printerError(service,
    "Unable to reach the print server. Check the booth Wi-Fi connection.", true));
});

test("existing PrinterErrors retain their identity", async t => {
  const service = setup(t, { fetch: async () => { throw original; } });
  const original = new service.PrinterError("Specific failure", false);
  await assert.rejects(service.getPrinterStatus(), error => error === original);
});

// Model fetch cancellation without network I/O or waiting for a real deadline.
function abortableFetch(url, { signal }) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

test("request timeout aborts fetch and reports a retryable timeout", async t => {
  const service = setup(t, { fetch: abortableFetch });
  const pending = service.getPrinterStatus();
  const rejected = assert.rejects(pending, printerError(service,
    "The print server took too long to respond.", true));
  service.expireRequest();
  await rejected;
  assert.equal(service.fetch.mock.calls[0].arguments[1].signal.aborted, true);
  assert.equal(service.clearTimeout.mock.callCount(), 1);
});

for (const method of ["getPrintJob", "getPrinterStatus"]) {
  for (const alreadyAborted of [false, true]) {
    test(`${method} forwards ${alreadyAborted ? "existing" : "in-flight"} cancellation and preserves the error`, async t => {
      const service = setup(t, { fetch: abortableFetch });
      const controller = new AbortController();
      const remove = t.mock.method(controller.signal, "removeEventListener");
      if (alreadyAborted) controller.abort();
      const pending = method === "getPrintJob"
        ? service.getPrintJob("job-1", controller.signal)
        : service.getPrinterStatus(controller.signal);
      const internalSignal = service.fetch.mock.calls[0].arguments[1].signal;
      assert.notStrictEqual(internalSignal, controller.signal);
      const rejected = assert.rejects(pending, error => error === internalSignal.reason);
      if (!alreadyAborted) controller.abort();
      await rejected;
      assert.equal(internalSignal.aborted, true);
      assert.equal(remove.mock.callCount(), 1);
      assert.equal(remove.mock.calls[0].arguments[0], "abort");
    });
  }
}

test("successful requests detach the caller's abort listener", async t => {
  const service = setup(t);
  const controller = new AbortController();
  const add = t.mock.method(controller.signal, "addEventListener");
  const remove = t.mock.method(controller.signal, "removeEventListener");
  await service.getPrintJob("job-1", controller.signal);
  assert.equal(add.mock.callCount(), 1);
  assert.equal(remove.mock.callCount(), 1);
  assert.equal(remove.mock.calls[0].arguments[1], add.mock.calls[0].arguments[1]);
  controller.abort();
  assert.equal(service.fetch.mock.calls[0].arguments[1].signal.aborted, false);
});

for (const [photo, requestId] of [["", "id"], [" \t", "id"], ["file:///photo.jpg", ""], ["file:///photo.jpg", " \n"]]) {
  test(`submitPrint rejects blank input: ${JSON.stringify([photo, requestId])}`, async t => {
    const service = setup(t);
    await assert.rejects(service.submitPrint(photo, requestId), printerError(service,
      "A photo and print request ID are required.", false));
    assert.equal(service.fetch.mock.callCount(), 0);
  });
}

for (const platform of ["ios", "android"]) {
  test(`${platform} submissions upload an Expo File and retain the retry key`, async t => {
    const service = setup(t, { platform });
    const photo = "file:///photo.jpg";
    assert.strictEqual(await service.submitPrint(photo, "same-request"), job);
    await service.submitPrint(photo, "same-request");
    assert.equal(service.fetch.mock.callCount(), 2);
    for (const { arguments: [url, options] } of service.fetch.mock.calls) {
      assert.equal(url, "http://booth:3000/print");
      assert.equal(options.method, "POST");
      assert.equal(options.headers["x-api-key"], "test-key");
      assert.equal(options.headers["Idempotency-Key"], "same-request");
      assert.equal(Object.keys(options.headers).some(key => key.toLowerCase() === "content-type"), false);
      assert(options.body instanceof MultipartBody);
      const [name, file] = options.body.parts[0];
      assert.equal(options.body.parts.length, 1);
      assert.equal(name, "photo");
      assert(file instanceof PhotoFile);
      assert.equal(file.uri, photo);
    }
  });
}

test("web submissions load the photo Blob before posting multipart data", async t => {
  const photo = new Blob(["jpeg"], { type: "image/jpeg" });
  const service = setup(t, {
    platform: "web",
    fetch: async url => url === "blob:photo"
      ? { ok: true, blob: async () => photo } : response(job, 202),
  });
  assert.strictEqual(await service.submitPrint("blob:photo", "web-request"), job);
  assert.equal(service.fetch.mock.callCount(), 2);
  assert.equal(service.fetch.mock.calls[0].arguments[0], "blob:photo");
  assert.equal(service.fetch.mock.calls[0].arguments[1], undefined);
  const [url, options] = service.fetch.mock.calls[1].arguments;
  assert.equal(url, "http://booth:3000/print");
  assert.equal(options.method, "POST");
  assert.equal(options.headers["Idempotency-Key"], "web-request");
  assert.equal(options.headers["x-api-key"], "test-key");
  assert.deepEqual(options.body.parts, [["photo", photo, "photobooth.jpg"]]);
  assert.equal(Object.keys(options.headers).some(key => key.toLowerCase() === "content-type"), false);
});

test("web photo HTTP failure prevents submitting the print", async t => {
  const service = setup(t, { platform: "web", fetch: async () => ({ ok: false }) });
  await assert.rejects(service.submitPrint("blob:missing", "request-1"), printerError(service,
    "Unable to load the photo for printing.", false));
  assert.equal(service.fetch.mock.callCount(), 1);
});
