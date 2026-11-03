export const PRINT_SERVER = (
  process.env.EXPO_PUBLIC_PRINT_SERVER_URL ?? "http://10.10.10.100:3000"
).replace(/\/+$/, "");

export const PRINT_REQUEST_TIMEOUT = 30_000;
