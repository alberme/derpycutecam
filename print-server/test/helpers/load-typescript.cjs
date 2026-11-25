const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { cwd } = require("node:process");
const vm = require("node:vm");
const ts = require("typescript");

// Load the actual app/Expo source without requiring a native UI runtime.
function loadTs(file, modules = {}, globals = {}) {
  const exports = {};
  const source = readFileSync(path.join(cwd(), file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    },
    Blob, Uint8Array, TextEncoder, AbortController, Error, setTimeout, clearTimeout,
    ...globals,
  }, { filename: file });
  return exports;
}

module.exports = { loadTs };
