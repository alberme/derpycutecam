export type PrintJobStatus =
  | "queued"
  | "waiting_for_printer"
  | "submitting"
  | "submitted"
  | "finished_in_cups"
  | "failed"
  | "cancelled";

export interface PrintJob {
  id: string;
  cupsJobId: string | null;
  status: PrintJobStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterStatus {
  state: string;
  hasError: boolean;
  reasons?: string[];
  errors?: string[];
  checkedAt?: string;
}

export function isPrintJobTerminal(status: PrintJobStatus): boolean {
  return ["finished_in_cups", "failed", "cancelled"].includes(status);
}
