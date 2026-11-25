import type { ConfigContext } from "expo/config";

export default ({ config }: ConfigContext) => ({
  ...config,
  extra: {
    ...config.extra,
    // Client-side printer credentials are included in the app manifest.
    printerApiKey: process.env.PRINTER_API_KEY,
  },
});
