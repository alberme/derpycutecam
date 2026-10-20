import { CedarvilleCursive_400Regular } from "@expo-google-fonts/cedarville-cursive";
import { Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { NixieOne_400Regular, useFonts } from "@expo-google-fonts/nixie-one";
import { useAssets } from "expo-asset";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { PRELOAD_ASSETS } from "@/src/constants/assets";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NixieOne_400Regular,
    CedarvilleCursive_400Regular,
    Fredoka_700Bold,
  });
  const [assets, assetsError] = useAssets(PRELOAD_ASSETS);
  const ready = (fontsLoaded || fontError) && (assets || assetsError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
