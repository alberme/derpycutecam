import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { Pressable, StyleSheet } from "react-native";

import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ThemedView style={{ alignItems: "center", flexDirection: "column" }}>
        <ThemedText type="title">derpycutecam</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/")}
        >
          <ThemedText style={styles.buttonText}>Go to Next Screen</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4F46E5", // Indigo-600
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  buttonPressed: {
    backgroundColor: "#4338CA", // darker shade when pressed
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
