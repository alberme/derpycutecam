const assert = require("node:assert/strict");
const { setImmediate } = require("node:timers/promises");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-typescript.cjs");

const types = loadTs("src/types/printer.ts");
class PrinterError extends Error {
  constructor(message, retryable) { super(message); this.retryable = retryable; }
}

// Control React's state/effect boundary and timers, while running the actual
// polling hook. Every network response is supplied by the test; no jobs print.
function pollingHook(service) {
  let state = null, dependencies, cleanup, pendingEffect, watchedId = "job-1";
  let timerId = 0;
  const timers = new Map();
  const { usePrintJob } = loadTs("src/hooks/usePrintJob.ts", {
    "@/src/services/printer": { PrinterError, ...service },
    "@/src/types/printer": types,
    react: {
      useState: () => [state, update => { state = typeof update === "function" ? update(state) : update; }],
      useEffect(setup, deps) {
        if (!dependencies || deps.some((value, i) => value !== dependencies[i])) {
          dependencies = deps;
          pendingEffect = setup;
        }
      },
    },
  }, {
    setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const HookProbe = () => {
    const result = usePrintJob(watchedId);
    if (pendingEffect) {
      cleanup?.();
      const setup = pendingEffect;
      pendingEffect = null;
      cleanup = setup();
    }
    return result;
  };
  return {
    async start() { HookProbe(); await setImmediate(); return HookProbe(); },
    async tick() {
      assert.equal(timers.size, 1, "only one poll can be scheduled");
      const [id, fn] = timers.entries().next().value;
      timers.delete(id);
      await fn();
      return HookProbe();
    },
    render: HookProbe,
    changeJob(id) { watchedId = id; return HookProbe(); },
    unmount() { cleanup?.(); },
    timers,
  };
}
const job = { id: "job-1", status: "submitted", error: null };
const missing = { state: "stopped", hasError: true, reasons: ["input-tray-missing"] };
const ready = { state: "processing", hasError: false, reasons: ["none"] };

test("polls physical status while a job is submitted, recovers, and stops at completion", async () => {
  let reads = 0, statusReads = 0;
  const hook = pollingHook({
    getPrintJob: async () => { reads++; return { ...job, status: reads === 4 ? "finished_in_cups" : "submitted" }; },
    getPrinterStatus: async () => { statusReads++; return statusReads < 3 ? missing : ready; },
    submitPrint: () => assert.fail("polling must not submit another print"),
  });
  let state = await hook.start();
  assert.equal(state.job.status, "submitted");
  assert.equal(state.printerStatus.reasons[0], "input-tray-missing");
  assert.equal(state.isPolling, true);
  state = await hook.tick();
  assert.equal(state.isPolling, true, "missing tray does not stop polling");
  state = await hook.tick();
  assert.equal(state.printerStatus.state, "processing");
  assert.equal(state.job.id, "job-1");
  state = await hook.tick();
  assert.equal(state.job.status, "finished_in_cups");
  assert.equal(state.isPolling, false);
  assert.equal(hook.timers.size, 0);
  assert.equal(reads, 4);
  assert.equal(statusReads, 4);
  hook.unmount();
});

test("transient status errors preserve the existing job and recover on the next poll", async () => {
  let reads = 0;
  const hook = pollingHook({
    getPrintJob: async () => job,
    getPrinterStatus: async () => {
      reads++;
      if (reads === 2) throw new PrinterError("Connection lost", true);
      return reads === 1 ? missing : ready;
    },
  });
  await hook.start();
  let state = await hook.tick();
  assert.equal(state.job.id, "job-1");
  assert.match(state.error, /Connection lost/);
  assert.equal(state.isPolling, true);
  state = await hook.tick();
  assert.equal(state.error, null);
  assert.equal(state.printerStatus.state, "processing");
  const reset = hook.changeJob(null);
  assert.equal(reset.job, null);
  assert.equal(reset.printerStatus, null);
  assert.equal(reset.isPolling, false);
  assert.equal(hook.timers.size, 0);
  hook.unmount();
});

test("unmount aborts both requests and ignores their late results", async () => {
  const signals = [];
  const complete = [];
  const hook = pollingHook({
    getPrintJob: (id, signal) => { signals.push(signal); return new Promise(resolve => complete.push(() => resolve(job))); },
    getPrinterStatus: signal => { signals.push(signal); return new Promise(resolve => complete.push(() => resolve(missing))); },
  });
  hook.render();
  hook.unmount();
  assert.equal(signals.length, 2);
  assert(signals.every(signal => signal.aborted));
  complete.forEach(resolve => resolve());
  await setImmediate();
  assert.equal(hook.render().job, null);
  assert.equal(hook.timers.size, 0);
});
