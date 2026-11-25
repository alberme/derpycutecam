import { router } from "expo-router";
import { useEffect, useState } from "react";
import ThemedText from "./ThemedText";

const COUNTDOWN_SECONDS = 10;

/** Mounted only after a job reaches finished_in_cups. */
export default function PrintReturnCountdown() {
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const deadline = Date.now() + COUNTDOWN_SECONDS * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        router.dismissTo("/");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ThemedText font="fredoka" style={{ textAlign: "center" }}>
      Starting over in {seconds} {seconds === 1 ? "second" : "seconds"}…
    </ThemedText>
  );
}
