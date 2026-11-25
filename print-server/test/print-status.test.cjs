const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadTs } = require("./helpers/load-typescript.cjs");

const types = loadTs("src/types/printer.ts");
const jsx = (type, props) => ({ type, props });
const { default: PrintStatus } = loadTs("src/components/PrintStatus.tsx", {
  "@/src/types/printer": types,
  "react-native": { ActivityIndicator: "Spinner", View: "View", StyleSheet: { create: value => value } },
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "./ThemedText": { __esModule: true, default: "Text" },
});
const submitted = { id: "job-1", status: "submitted", error: null };
const missingTray = {
  state: "stopped", hasError: true,
  reasons: ["input-tray-missing"], errors: ["input-tray-missing"],
};
function nodes(node) {
  if (!node || typeof node !== "object") return [node];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
function inspect(props) {
  const tree = nodes(PrintStatus(props));
  return {
    text: tree.filter(node => typeof node === "string").join(" "),
    spinner: tree.some(node => node?.type === "Spinner"),
  };
}

test("a submitted CUPS job shows the missing-tray instruction without a spinner", () => {
  const result = inspect({ job: submitted, printerStatus: missingTray, isPolling: true });
  assert.match(result.text, /Printer needs attention/);
  assert.match(result.text, /insert the paper cassette/);
  assert.match(result.text, /No need to submit it again/);
  assert.equal(result.spinner, false);
});

test("a queued job with a tray error also requests attention while polling continues", () => {
  const result = inspect({ job: { ...submitted, status: "waiting_for_printer", error: "input-tray-missing-error" }, isPolling: true });
  assert.match(result.text, /insert the paper cassette/);
  assert.equal(result.spinner, false);
});

test("normal progress returns after the tray is reinserted", () => {
  const result = inspect({ job: submitted, printerStatus: { state: "processing", hasError: false, reasons: ["none"] }, isPolling: true });
  assert.doesNotMatch(result.text, /Printer needs attention/);
  assert.match(result.text, /working on your photo/);
  assert.equal(result.spinner, true);
});

test("finished jobs are not overridden by a later physical printer fault", () => {
  for (const status of ["finished_in_cups", "failed", "cancelled"]) {
    const result = inspect({ job: { ...submitted, status }, printerStatus: missingTray, isPolling: false });
    assert.doesNotMatch(result.text, /insert the paper cassette|Printer needs attention/);
    assert.equal(result.spinner, false);
  }
});
