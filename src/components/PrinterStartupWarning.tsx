import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThemedText from "@/src/components/ThemedText";
import { Colors } from "@/src/constants/theme";

type PrinterStartupWarningProps = {
  message: string;
  onDismiss: () => void;
};

export default function PrinterStartupWarning({
  message,
  onDismiss,
}: PrinterStartupWarningProps) {
  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.container}>
      <ThemedText color="black">{message}</ThemedText>
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
      >
        <ThemedText color="black" type="defaultSemiBold">
          Dismiss
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.pink,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  dismiss: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pressed: { backgroundColor: Colors.text.darkPink },
});
