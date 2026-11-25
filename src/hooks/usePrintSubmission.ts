import { submitPrint } from "@/src/services/printer";
import type { PrintJob } from "@/src/types/printer";
import { useCallback, useEffect, useRef, useState } from "react";

/** One print intent, including effect replays and explicit submission retries. */
export function usePrintSubmission(
  photoUri: string,
  requestId: string,
  existingJobId: string | null,
) {
  const submission = useRef<Promise<PrintJob> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [job, setJob] = useState<PrintJob | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (existingJobId) return;
    let active = true;

    // Keep the promise through Strict Mode's effect replay. An unmount may
    // happen after the server accepts the upload, so never invent a new key.
    submission.current ??= submitPrint(photoUri, requestId);
    void submission.current.then(
      (result) => {
        if (!active) return;
        setJob(result);
      },
      (reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason : new Error("Failed to submit photo."));
      },
    );
    return () => { active = false; };
  }, [photoUri, requestId, existingJobId, attempt]);

  const retry = useCallback(() => {
    if (existingJobId || job) return;
    submission.current = null;
    setError(null);
    setAttempt((value) => value + 1);
  }, [existingJobId, job]);

  return { job, error, isSubmitting: !existingJobId && !job && !error, retry };
}
