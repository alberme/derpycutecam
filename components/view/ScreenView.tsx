import { Colors, type ColorsKey } from "@/constants/theme";
import React, { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BaseViewProps {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  color?: keyof ColorsKey["background"];
}

/**
 * BaseView
 * - Full-screen wrapper with optional scroll
 * - Handles safe area and consistent background
 */
export default function ScreenView({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  color = "black",
}: BaseViewProps) {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: Colors.background[color] }]}
    >
      <Container
        style={[
          styles.container,
          { backgroundColor: Colors.background[color] },
          style,
        ]}
        {...(scrollable
          ? {
              contentContainerStyle: [
                styles.scrollContent,
                contentContainerStyle,
              ],
            }
          : {})}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
