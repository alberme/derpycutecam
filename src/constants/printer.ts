import { PrintJobStatus } from "@/src/types/printer";

// regex removes trailing slashes
export const PRINT_SERVER = (
  process.env.EXPO_PUBLIC_PRINT_SERVER_URL ?? ""
).replace(/\/+$/, "");

export const PRINT_REQUEST_TIMEOUT = 30_000;
export const JOB_STATUSES: PrintJobStatus[] = [
  "queued",
  "waiting_for_printer",
  "submitting",
  "submitted",
  "finished_in_cups",
  "failed",
  "cancelled",
];
