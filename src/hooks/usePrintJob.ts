import { getPrinterStatus, getPrintJob, PrinterError } from "@/src/services/printer";
import { isPrintJobTerminal, type PrintJob, type PrinterStatus } from "@/src/types/printer";
import { useEffect, useState } from "react";

const POLL_INTERVAL = 3000;

type JobState = {
  jobId: string;
  job: PrintJob | null;
  printerStatus: PrinterStatus | null;
  error: string | null;
  stopped: boolean;
};

export function usePrintJob(jobId: string | null) {
  const [state, setState] = useState<JobState | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const poll = async () => {
      controller = new AbortController();
      // CUPS can keep a job "submitted" while the physical printer is blocked.
      // Read both endpoints; neither request is allowed to submit another job.
      const [jobResult, printerResult] = await Promise.allSettled([
        getPrintJob(jobId, controller.signal),
        getPrinterStatus(controller.signal),
      ]);
      if (!active) return;

      const stopped = jobResult.status === "fulfilled"
        ? isPrintJobTerminal(jobResult.value.status)
        : jobResult.reason instanceof PrinterError && !jobResult.reason.retryable;
      const message = (error: unknown) => error instanceof Error ? error.message : "Unable to reach print server";

      setState((previous) => {
        const current = previous?.jobId === jobId ? previous : null;
        return {
          jobId,
          job: jobResult.status === "fulfilled" ? jobResult.value : current?.job ?? null,
          printerStatus: printerResult.status === "fulfilled" ? printerResult.value : current?.printerStatus ?? null,
          error: jobResult.status === "rejected" ? message(jobResult.reason)
            : !stopped && printerResult.status === "rejected"
              ? `Unable to check the printer: ${message(printerResult.reason)}` : null,
          stopped,
        };
      });
      if (!stopped) timer = setTimeout(poll, POLL_INTERVAL);
    };

    void poll();
    return () => {
      active = false;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  const current = state?.jobId === jobId ? state : null;
  return {
    job: current?.job ?? null,
    printerStatus: current?.printerStatus ?? null,
    error: current?.error ?? null,
    isPolling: !!jobId && !current?.stopped,
  };
}
