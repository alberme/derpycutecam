const { loadTs } = require("./load-typescript.cjs");

// Use the real response guards and constants while isolating native and network I/O.
function loadPrinterService({
  fetch,
  platform = "ios",
  constants = { expoConfig: { extra: { printerApiKey: "test-key" } } },
  server = "http://booth:3000",
  File,
  globals = {},
}) {
  const printerConstants = loadTs("src/constants/printer.ts", {}, {
    process: { env: { EXPO_PUBLIC_PRINT_SERVER_URL: server } },
  });
  const guards = loadTs("src/util/printer.ts", {
    "@/src/constants/printer": printerConstants,
  });
  return loadTs("src/services/printer.ts", {
    "expo-constants": constants,
    "expo-file-system": { File },
    "expo/fetch": { fetch },
    "react-native": { Platform: { OS: platform } },
    "@/src/constants/printer": printerConstants,
    "@/src/util/printer": guards,
  }, { URL, ...globals });
}

module.exports = { loadPrinterService };
