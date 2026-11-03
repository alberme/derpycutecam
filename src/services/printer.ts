import Constants from "expo-constants";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { Platform } from "react-native";

import { PRINT_REQUEST_TIMEOUT, PRINT_SERVER } from "@/src/constants/printer";
import type { PrintJob, PrintJobStatus, PrinterStatus } from "@/src/types/printer";

export class PrinterError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "PrinterError";
  }
}

const JOB_STATUSES: PrintJobStatus[] = [
  "queued",
  "waiting_for_printer",
  "submitting",
  "submitted",
  "finished_in_cups",
  "failed",
  "cancelled",
];

function isPrintJob(data: unknown): data is PrintJob {
  if (!data || typeof data !== "object") return false;
  const job = data as Partial<PrintJob>;
  return typeof job.id === "string" && !!job.id &&
    !!job.status && JOB_STATUSES.includes(job.status);
}

function isPrinterStatus(data: unknown): data is PrinterStatus {
  if (!data || typeof data !== "object") return false;
  const status = data as Partial<PrinterStatus>;
  const isReasons = (value: unknown) => value === undefined ||
    (Array.isArray(value) && value.every((reason) => typeof reason === "string"));
  return typeof status.state === "string" && typeof status.hasError === "boolean" &&
    isReasons(status.reasons) && isReasons(status.errors);
}

async function requestPrinter<T>(
  path: string,
  isValid: (data: unknown) => data is T,
  options: RequestInit = {},
  signal?: AbortSignal,
  acceptUnavailable = false,
): Promise<T> {
  const apiKey = Constants.expoConfig?.extra?.printerApiKey;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new PrinterError(
      "Printer API key is missing. Please contact the booth host.",
      false,
    );
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  if (signal?.aborted) abort();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PRINT_REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${PRINT_SERVER}${path}`, {
      ...options,
      headers: { ...options.headers, "x-api-key": apiKey },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);

    // /status uses HTTP 503 for a known, unavailable physical printer.
    // This is useful status data, rather than a failed connection to the API.
    if (!response.ok && !(acceptUnavailable && response.status === 503 && isValid(data))) {
      const message =
        response.status === 401
          ? "Printer authentication failed. Please contact the booth host."
          : typeof data?.error === "string"
            ? data.error
            : "The print server could not complete the request.";
      throw new PrinterError(
        `${message} (HTTP ${response.status})`,
        response.status >= 500 || [408, 429].includes(response.status),
      );
    }

    if (!isValid(data)) {
      throw new PrinterError(
        "The print server returned an invalid response.",
        true,
      );
    }

    return data;
  } catch (error) {
    if (signal?.aborted || error instanceof PrinterError) throw error;
    throw new PrinterError(
      timedOut
        ? "The print server took too long to respond."
        : "Unable to reach the print server. Check the booth Wi-Fi connection.",
      true,
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function getPrintJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<PrintJob> {
  return requestPrinter(`/jobs/${encodeURIComponent(jobId)}`, isPrintJob, {}, signal);
}

export function getPrinterStatus(signal?: AbortSignal): Promise<PrinterStatus> {
  return requestPrinter("/status", isPrinterStatus, {}, signal, true);
}

/** The caller owns requestId and must reuse it for every retry of this print. */
export async function submitPrint(
  photoUri: string,
  requestId: string,
): Promise<PrintJob> {
  if (!photoUri.trim() || !requestId.trim()) {
    throw new PrinterError("A photo and print request ID are required.", false);
  }

  const formData = new FormData();
  if (Platform.OS === "web") {
    const photo = await fetch(photoUri);
    if (!photo.ok)
      throw new PrinterError("Unable to load the photo for printing.", false);
    formData.append("photo", await photo.blob(), "photobooth.jpg");
  } else {
    // Expo fetch needs a Blob-compatible File, not React Native's URI object.
    formData.append("photo", new File(photoUri));
  }

  return requestPrinter("/print", isPrintJob, {
    method: "POST",
    headers: { "Idempotency-Key": requestId },
    // fetch supplies the multipart boundary; do not set Content-Type here.
    body: formData,
  });
}
