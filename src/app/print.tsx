import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { PrintStatus, ThemedButton, ThemedText } from "@/src/components";
import PrintReturnCountdown from "@/src/components/PrintReturnCountdown";
import { ContainerView, ScreenView } from "@/src/components/view";
import { usePrintJob } from "@/src/hooks/usePrintJob";
import { usePrintSubmission } from "@/src/hooks/usePrintSubmission";
import { PrinterError } from "@/src/services/printer";
import { isPrintJobTerminal } from "@/src/types/printer";

type PrintParams = {
  photoUri?: string | string[];
  requestId?: string | string[];
  jobId?: string | string[];
};

export default function PrintScreen() {
  const { photoUri, requestId, jobId } = useLocalSearchParams<PrintParams>();
  const validPhoto =
    typeof photoUri === "string" && photoUri.trim() ? photoUri : null;
  const validRequest =
    typeof requestId === "string" && requestId.trim() ? requestId : null;
  const validJob = typeof jobId === "string" && jobId.trim() ? jobId : null;

  if ((!validPhoto || !validRequest) && !validJob) {
    return (
      <ScreenView>
        <ContainerView gradient style={styles.container}>
          <ThemedText font="fredoka" style={styles.text}>
            No photo is ready to print. Please return to your photoshoot.
          </ThemedText>
          <ThemedButton
            title="Go back"
            variant="secondary"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
          />
        </ContainerView>
      </ScreenView>
    );
  }

  return (
    <PrintFlow
      key={validRequest ?? validJob}
      photoUri={validPhoto ?? ""}
      requestId={validRequest ?? ""}
      existingJobId={validJob}
    />
  );
}

function PrintFlow({
  photoUri,
  requestId,
  existingJobId,
}: {
  photoUri: string;
  requestId: string;
  existingJobId: string | null;
}) {
  const submission = usePrintSubmission(photoUri, requestId, existingJobId);
  const jobId = existingJobId ?? submission.job?.id ?? null;
  const {
    job: polledJob,
    printerStatus,
    error,
    isPolling,
  } = usePrintJob(jobId);
  const job = polledJob ?? submission.job;
  const isFinished = !!job && isPrintJobTerminal(job.status);
  const canRetry =
    !!submission.error &&
    !jobId &&
    (!(submission.error instanceof PrinterError) || submission.error.retryable);

  useEffect(() => {
    if (submission.job && !existingJobId) {
      // Preserve the accepted job across route remounts. Status errors must
      // never fall back to creating a replacement print.
      router.setParams({ jobId: submission.job.id });
    }
  }, [submission.job, existingJobId]);
  // console.log(error);
  return (
    <ScreenView>
      <ContainerView gradient style={styles.container}>
        <ThemedText font="fredoka" type="xxl" style={styles.title}>
          {!error && job?.status === "finished_in_cups"
            ? "thanks for waiting!"
            : "please wait for print!"}
        </ThemedText>
        <Image
          source={require("@/assets/images/printer/printer.png")}
          style={styles.printerImage}
          contentFit="contain"
          transition={300}
          accessibilityLabel="Photo printer"
        />
        <PrintStatus
          job={job}
          printerStatus={printerStatus}
          isSubmitting={submission.isSubmitting}
          submitError={submission.error?.message}
          pollingError={error}
          isPolling={isPolling}
        />
        {job?.status === "finished_in_cups" && <PrintReturnCountdown />}
        {jobId && (
          <ThemedText style={styles.text}>Job reference: {jobId}</ThemedText>
        )}
        <ThemedText font="cedarvilleCursive" style={styles.help}>
          if issues arrive pls contact Melinda for help!
        </ThemedText>
        <View style={styles.actions}>
          {canRetry && (
            <>
              <ThemedText font="fredoka" style={styles.text}>
                An error has occured! Retry print?
              </ThemedText>
              <ThemedButton
                title="Retry"
                variant="secondary"
                onPress={submission.retry}
              />
            </>
          )}
          {(isFinished ||
            (error && !isPolling) ||
            (submission.error && !canRetry)) && (
            <ThemedButton
              title="Start Over!"
              variant="secondary"
              onPress={() => router.dismissTo("/")}
            />
          )}
        </View>
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center", padding: 24, gap: 24 },
  title: { lineHeight: 44, textAlign: "center" },
  text: { textAlign: "center" },
  help: { fontSize: 32, lineHeight: 40, textAlign: "center" },
  printerImage: { width: "60%", maxWidth: 300, aspectRatio: 834 / 758 },
  actions: { alignItems: "center", gap: 16 },
});
