import { CedarvilleCursive_400Regular } from "@expo-google-fonts/cedarville-cursive";
import { Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { NixieOne_400Regular, useFonts } from "@expo-google-fonts/nixie-one";
import { useAssets } from "expo-asset";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";

import PrinterStartupWarning from "@/src/components/PrinterStartupWarning";
import { PRELOAD_ASSETS } from "@/src/constants/assets";
import { getPrinterStatus } from "@/src/services/printer";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [printerWarning, setPrinterWarning] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    NixieOne_400Regular,
    CedarvilleCursive_400Regular,
    Fredoka_700Bold,
  });
  const [assets, assetsError] = useAssets(PRELOAD_ASSETS);
  const ready = (fontsLoaded || fontError) && (assets || assetsError);

  useEffect(() => {
    const controller = new AbortController();

    async function checkPrinter() {
      try {
        const status = await getPrinterStatus(controller.signal);
        if (controller.signal.aborted) return;
        if (
          status.hasError ||
          ["stopped", "unknown", "unavailable"].includes(status.state)
        ) {
          setPrinterWarning(
            "Printer needs attention. Please ask the booth host for help.",
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setPrinterWarning(
          error instanceof Error
            ? error.message
            : "Unable to check the printer. Please ask the booth host for help.",
        );
      }
    }

    void checkPrinter();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {printerWarning && (
        <PrinterStartupWarning
          message={printerWarning}
          onDismiss={() => setPrinterWarning(null)}
        />
      )}
    </View>
  );
}
