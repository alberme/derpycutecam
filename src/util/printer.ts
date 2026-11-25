import { JOB_STATUSES } from "@/src/constants/printer";
import type { PrintJob, PrinterStatus } from "@/src/types/printer";

/**
 * Checks if response is undefined or an array of strings
 * @param response response to check
 * @returns
 */
export function isReasons(response: unknown) {
  return (
    response === undefined ||
    (Array.isArray(response) &&
      response.every((reason) => typeof reason === "string"))
  );
}

/**
 * TYPE VALIDATORS
 */

export function isPrintJob(data: unknown): data is PrintJob {
  if (!data || typeof data !== "object") return false;
  const job = data as Partial<PrintJob>;
  return (
    typeof job.id === "string" &&
    !!job.id &&
    !!job.status &&
    JOB_STATUSES.includes(job.status)
  );
}

export function isPrinterStatus(data: unknown): data is PrinterStatus {
  if (!data || typeof data !== "object") return false;
  const status = data as Partial<PrinterStatus>;
  return (
    typeof status.state === "string" &&
    typeof status.hasError === "boolean" &&
    isReasons(status.reasons) &&
    isReasons(status.errors)
  );
}
