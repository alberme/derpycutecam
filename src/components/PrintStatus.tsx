import {
  isPrintJobTerminal,
  type PrintJob,
  type PrinterStatus,
} from "@/src/types/printer";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import ThemedText from "./ThemedText";

function getAttentionMessage(
  job: PrintJob | null,
  printer: PrinterStatus | null,
): string | null {
  if (job && isPrintJobTerminal(job.status)) return null;

  const reasons = [
    job?.error ?? "",
    ...(printer?.reasons ?? []),
    ...(printer?.errors ?? []),
  ].join(", ");
  if (reasons.includes("input-tray-missing"))
    return "Please ask Melinda to insert the paper cassette!";
  if (reasons.includes("media-jam"))
    return "Paper is jammed. Please ask Melinda for help!";
  if (reasons.includes("media-empty"))
    return "Printer is out of paper. Please ask Melinda for help!";
  if (reasons.includes("marker-supply-empty"))
    return "Printer needs a new ink cassette. Please ask Melinda for help!";
  if (reasons.includes("cover-open"))
    return "Please ask Melinda to close the printer cover!";
  if (reasons.includes("printer-unreachable"))
    return "Printer disconnected. Please ask Melinda to check its connection!";
  if (
    job?.status === "waiting_for_printer" ||
    printer?.hasError ||
    (printer && ["stopped", "unknown", "unavailable"].includes(printer.state))
  ) {
    return "Printer needs attention. Please ask Melinda for help.";
  }
  return null;
}

function getStatusMessage(job: PrintJob): string {
  switch (job.status) {
    case "queued":
      return "Your photo is in the print queue";
    case "waiting_for_printer":
      return "Waiting for the printer to be ready…";
    case "submitting":
      return "Sending your photo to the printer…";
    case "submitted":
      return "The printer is working on your photo…";
    case "finished_in_cups":
      return "Printing complete! Pls grab your photo when it is ready!";
    case "failed":
      return "Your photo failed to print! Please ask Melinda for help!";
    case "cancelled":
      return "Your photo print was cancelled.";
  }
}

type PrintStatusProps = {
  job: PrintJob | null;
  printerStatus?: PrinterStatus | null;
  isSubmitting?: boolean;
  submitError?: string | null;
  pollingError?: string | null;
  isPolling?: boolean;
};

export default function PrintStatus({
  job,
  printerStatus = null,
  isSubmitting = false,
  submitError,
  pollingError,
  isPolling = false,
}: PrintStatusProps) {
  const attention = submitError
    ? null
    : getAttentionMessage(job, printerStatus);
  const message =
    submitError ??
    attention ??
    (job
      ? getStatusMessage(job)
      : isSubmitting
        ? "Uploading your photo…"
        : "Checking print status…");
  // Polling continues during printer faults, but the UI needs an action message
  // rather than an indefinite progress animation.
  const busy =
    !submitError &&
    !attention &&
    !pollingError &&
    (isSubmitting || (isPolling && (!job || !isPrintJobTerminal(job.status))));

  return (
    <View style={styles.container}>
      {/* {attention && (
        <ThemedText
          type="subtitle"
          font="fredoka"
          accessibilityRole="alert"
          style={styles.text}
        >
          Printer needs attention
        </ThemedText>
      )} */}
      {busy && (
        <ActivityIndicator
          size="large"
          color="#fff"
          accessibilityLabel="Print in progress"
        />
      )}
      <ThemedText font="fredoka" type="xxl" style={styles.text}>
        {message}
      </ThemedText>
      {/* {attention && isPolling && (
        <ThemedText font="fredoka" style={styles.text}>
          Your pending photo print will continue when the printer is ready!
        </ThemedText>
      )} */}
      {pollingError && (
        <ThemedText font="fredoka" style={styles.text}>
          {pollingError}
          {"\n"}
          {isPolling
            ? "Reconnecting automatically. Your print job is still being tracked."
            : "Status updates stopped. Please ask the host to check your existing job."}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", width: "100%" },
  text: { textAlign: "center" },
});
