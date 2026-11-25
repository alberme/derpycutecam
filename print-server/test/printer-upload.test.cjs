const assert = require("node:assert/strict");
const { Buffer } = require("node:buffer");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-typescript.cjs");
const { loadPrinterService } = require("./helpers/load-printer-service.cjs");

// Run the installed Expo serializer, stubbing only native modules. A mock of
// fetch alone would accept the old URI object and miss this SDK regression.

class NativeFormData {
  constructor() { this._parts = []; }
}
const { installFormDataPatch } = loadTs("node_modules/expo/src/winter/FormData.ts");
const ExpoFormData = installFormDataPatch(NativeFormData);
const { convertFormDataAsync } = loadTs("node_modules/expo/src/winter/fetch/convertFormData.ts", {
  "../../utils/blobUtils": { blobToArrayBufferAsync: blob => blob.arrayBuffer() },
});
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
class NativeFile {
  constructor(uri) { this.uri = uri; }
  get name() { return this.uri.split("/").pop(); }
  get type() { return "image/jpeg"; }
  async bytes() { return jpeg; }
}

function printerService(platform, fetch) {
  return loadPrinterService({
    platform, fetch, File: NativeFile, globals: { FormData: ExpoFormData },
  });
}

async function serializePhoto(options) {
  const { body, boundary } = await convertFormDataAsync(options.body);
  assert(boundary);
  const headerEnd = new TextEncoder().encode("\r\n\r\n");
  const buffer = Buffer.from(body);
  const contentStart = buffer.indexOf(headerEnd) + headerEnd.length;
  assert(contentStart >= headerEnd.length);
  assert.match(buffer.subarray(0, contentStart).toString(), /name="photo"; filename="[^\r\n]+\.jpg"/);
  assert.match(buffer.subarray(0, contentStart).toString(), /content-type: image\/jpeg/);
  assert.deepEqual(buffer.subarray(contentStart, contentStart + jpeg.length), Buffer.from(jpeg));
  assert.equal(options.headers["Content-Type"], undefined);
}

function response(job) {
  return { ok: true, status: 202, json: async () => job };
}

test("Expo's installed serializer reproduces the unsupported URI descriptor error", async () => {
  const form = new ExpoFormData();
  form.append("photo", { uri: "file:///photo.jpg", name: "photo.jpg", type: "image/jpeg" });
  await assert.rejects(convertFormDataAsync(form), /Unsupported FormDataPart implementation/);
});

test("native uploads serialize JPEG bytes and retries preserve the idempotency key", async () => {
  const jobs = new Map();
  let calls = 0;
  const { submitPrint } = printerService("ios", async (url, options) => {
    calls++;
    assert.equal(url, "http://booth:3000/print");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["x-api-key"], "test-key");
    assert(options.body._parts[0][1] instanceof NativeFile);
    await serializePhoto(options);
    const key = options.headers["Idempotency-Key"];
    assert.equal(key, "same-print-intent");
    if (!jobs.has(key)) jobs.set(key, { id: "job-1", status: "queued" });
    // Simulate acceptance followed by loss of the HTTP response.
    if (calls === 1) throw new Error("Response lost");
    return response(jobs.get(key));
  });
  await assert.rejects(submitPrint("file:///photo.jpg", "same-print-intent"), /Unable to reach/);
  const job = await submitPrint("file:///photo.jpg", "same-print-intent");
  assert.equal(job.id, "job-1");
  assert.equal(calls, 2);
  assert.equal(jobs.size, 1);
});

test("browser uploads still serialize a JPEG Blob", async () => {
  const uri = "blob:photo-preview";
  const { submitPrint } = printerService("web", async (url, options) => {
    if (url === uri) return { ok: true, blob: async () => new Blob([jpeg], { type: "image/jpeg" }) };
    assert(options.body._parts[0][1] instanceof Blob);
    await serializePhoto(options);
    return response({ id: "web-job", status: "queued" });
  });
  assert.equal((await submitPrint(uri, "web-intent")).id, "web-job");
});

test("physical printer status is separate from the submitted job status", async () => {
  const { getPrintJob, getPrinterStatus } = printerService("ios", async (url) => response(
    url.endsWith("/status")
      ? { state: "stopped", hasError: true, reasons: ["input-tray-missing"], errors: ["input-tray-missing"] }
      : { id: "job-1", status: "submitted", error: null },
  ));
  const [job, printer] = await Promise.all([getPrintJob("job-1"), getPrinterStatus()]);
  assert.equal(job.status, "submitted");
  assert.equal(job.error, null);
  assert.equal(printer.reasons[0], "input-tray-missing");
});

test("HTTP 503 with a printer-unreachable payload remains usable status data", async () => {
  const { getPrinterStatus } = printerService("ios", async () => ({
    ok: false, status: 503,
    json: async () => ({ state: "unavailable", hasError: true, errors: ["printer-unreachable"] }),
  }));
  assert.equal((await getPrinterStatus()).errors[0], "printer-unreachable");
});

test("malformed status responses are rejected, and authentication errors remain errors", async () => {
  for (const [status, payload] of [[200, { state: "stopped" }], [503, { error: "offline" }],
    [401, { state: "unavailable", hasError: true, errors: ["printer-unreachable"] }]]) {
    const { getPrinterStatus, PrinterError } = printerService("ios", async () => ({
      ok: status === 200, status, json: async () => payload,
    }));
    await assert.rejects(getPrinterStatus(), error => error instanceof PrinterError);
  }
});
