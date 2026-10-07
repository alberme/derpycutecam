/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorDark = "#fff";

export const Colors = {
  background: {
    black: "#151718",
    pink: "#FFCEEE",
    transparent: "transparent",
  },
  text: {
    white: "#ECEDEE",
    black: "#08060A",
    pink: "#FFCEEE",
    darkPink: "#D498C2",
  },
  // text: "#ECEDEE",
  black: "#151718",
  tint: tintColorDark,
  icon: "#9BA1A6",
  tabIconDefault: "#9BA1A6",
  tabIconSelected: tintColorDark,
  // pink: "#FFCEEE",
  // blackText: "#08060A",
};

export const FontStyles = {
  bold: {
    textShadowColor: "#000000",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
};

export type ColorsKey = typeof Colors;

export const Fonts = Platform.select({
  ios: {
    nixieOne: "NixieOne_400Regular",
    cedarvilleCursive: "CedarvilleCursive_400Regular",
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    nixieOne: "NixieOne_400Regular",
    cedarvilleCursive: "CedarvilleCursive_400Regular",
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    nixieOne: "NixieOne_400Regular",
    cedarvilleCursive: "CedarvilleCursive_400Regular",
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
