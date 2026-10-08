import { CedarvilleCursive_400Regular } from "@expo-google-fonts/cedarville-cursive";
import { Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { NixieOne_400Regular, useFonts } from "@expo-google-fonts/nixie-one";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NixieOne_400Regular,
    CedarvilleCursive_400Regular,
    Fredoka_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
