import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline";
type IconPosition = "left" | "right";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle | ViewStyle[];
  icon?: keyof typeof Ionicons.glyphMap; // Ensures valid Ionicons name
  iconPosition?: IconPosition;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
}

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  style,
  icon,
  iconPosition = "left",
  iconSize = 18,
  loading = false,
  disabled = false,
}: CustomButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles[`${variant}Pressed` as const],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={styles[`${variant}Text` as const].color}
          />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <Ionicons
                name={icon}
                size={iconSize}
                color={styles[`${variant}Text` as const].color}
                style={styles.icon}
              />
            )}
            <Text style={[styles.textBase, styles[`${variant}Text` as const]]}>
              {title}
            </Text>
            {icon && iconPosition === "right" && (
              <Ionicons
                name={icon}
                size={iconSize}
                color={styles[`${variant}Text` as const].color}
                style={styles.icon}
              />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  textBase: {
    fontSize: 16,
    fontWeight: "600",
  },

  // 🔵 Primary
  primary: { backgroundColor: "#4F46E5" },
  primaryPressed: { backgroundColor: "#4338CA" },
  primaryText: { color: "#fff" },

  // ⚪ Secondary
  secondary: { backgroundColor: "#E5E7EB" },
  secondaryPressed: { backgroundColor: "#D1D5DB" },
  secondaryText: { color: "#111827" },

  // ⬜ Outline
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  outlinePressed: { backgroundColor: "#EEF2FF" },
  outlineText: { color: "#4F46E5" },

  // Disabled
  disabled: {
    opacity: 0.6,
  },

  icon: {
    marginHorizontal: 2,
  },
});
