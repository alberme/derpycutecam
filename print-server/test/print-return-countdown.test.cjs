const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-typescript.cjs");

function countdown() {
  let now = 0, state = 10, effect, cleanup;
  let nextTimer = 0;
  const timers = new Map();
  const navigations = [];
  const { default: Countdown } = loadTs("src/components/PrintReturnCountdown.tsx", {
    "expo-router": { router: { dismissTo: path => navigations.push(path) } },
    react: {
      useState: () => [state, next => { state = next; }],
      useEffect: setup => { effect = setup; },
    },
    "./ThemedText": { __esModule: true, default: "Text" },
    "react/jsx-runtime": { jsxs: (type, props) => ({ type, props }) },
  }, {
    Date: { now: () => now },
    setInterval: (fn, delay) => {
      assert.equal(delay, 1000);
      const id = ++nextTimer;
      timers.set(id, fn);
      return id;
    },
    clearInterval: id => timers.delete(id),
  });
  const text = () => Countdown().props.children.join("");
  const initialText = text();
  cleanup = effect();
  return {
    initialText, text, navigations, timers,
    tick(ms = 1000) { now += ms; [...timers.values()].forEach(fn => fn()); return text(); },
    replayEffect() { cleanup(); cleanup = effect(); },
    unmount() { cleanup(); },
  };
}

test("starts at 10 and returns home only after the full countdown", () => {
  const timer = countdown();
  assert.equal(timer.initialText, "Returning to the main screen in 10 seconds…");
  for (let remaining = 9; remaining >= 1; remaining--) {
    assert.match(timer.tick(), new RegExp(`in ${remaining} second`));
    assert.equal(timer.navigations.length, 0);
  }
  timer.tick();
  assert.deepEqual(timer.navigations, ["/"]);
  assert.equal(timer.timers.size, 0);
  timer.tick();
  assert.equal(timer.navigations.length, 1);
});

test("unmounting before completion cancels automatic navigation", () => {
  const timer = countdown();
  timer.tick();
  timer.unmount();
  timer.tick(20000);
  assert.equal(timer.timers.size, 0);
  assert.equal(timer.navigations.length, 0);
});

test("effect replay leaves one timer and delayed callbacks respect elapsed time", () => {
  const timer = countdown();
  timer.replayEffect();
  assert.equal(timer.timers.size, 1);
  assert.match(timer.tick(5500), /in 5 seconds/);
  assert.equal(timer.navigations.length, 0);
  timer.tick(4500);
  assert.deepEqual(timer.navigations, ["/"]);
});

test("the print screen mounts the countdown only for finished_in_cups", () => {
  const types = loadTs("src/types/printer.ts");
  const Countdown = "ReturnCountdown";
  const jsx = (type, props) => ({ type, props });
  for (const status of ["queued", "waiting_for_printer", "submitted", "failed", "cancelled", "finished_in_cups"]) {
    const { default: Screen } = loadTs("src/app/print.tsx", {
      "expo-image": { Image: "Image" },
      "expo-router": { router: {}, useLocalSearchParams: () => ({ jobId: "job-1" }) },
      react: { useEffect: () => {} },
      "react-native": { View: "View", StyleSheet: { create: value => value } },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "@/src/components": { PrintStatus: "Status", ThemedText: "Text", ThemedButton: "Button" },
      "@/src/components/PrintReturnCountdown": { __esModule: true, default: Countdown },
      "@/src/components/view": { ScreenView: "Screen", ContainerView: "Container" },
      "@/src/hooks/usePrintJob": { usePrintJob: () => ({ job: { id: "job-1", status }, isPolling: false }) },
      "@/src/hooks/usePrintSubmission": { usePrintSubmission: () => ({ job: null, error: null }) },
      "@/src/services/printer": { PrinterError: Error },
      "@/src/types/printer": types,
      "@/assets/images/printer/printer.png": "printer-image",
    });
    const flow = Screen();
    const tree = flow.type(flow.props);
    const containsCountdown = node => !!node && typeof node === "object" &&
      (node.type === Countdown || [node.props?.children].flat(Infinity).some(containsCountdown));
    assert.equal(containsCountdown(tree), status === "finished_in_cups", status);
  }
});
