// CANON SELPHY CP1500
// iOS only {"name": "Canon SELPHY CP1500", "url": "ipps://CP15005dba73.local.:443/ipp/print"}
// const selectPrinter = async () => {
//   const printer = await Print.selectPrinterAsync(); // iOS only
// };

import type { Printer } from "expo-print";

export const PRINTER: Record<string, Printer> = {
  canon_selphy_cp1500: {
    name: "Canon SELPHY CP1500",
    url: "ipps://CP15005dba73.local.:443/ipp/print",
  },
};
