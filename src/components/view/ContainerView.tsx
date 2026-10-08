import { Colors, type ColorsKey } from "@/src/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewProps } from "react-native";

import { type GradientColors } from "@/src/types";

export type ContainerViewProps = ViewProps & {
  color?: keyof ColorsKey["background"];
  noFlex?: boolean;
  gradient?: boolean;
  gradientColors?: GradientColors;
};

export default function ContainerView({
  style,
  color,
  noFlex = false,
  gradient = false,
  gradientColors = Colors.gradient.blackpinkGradient,
  ...otherProps
}: ContainerViewProps) {
  const ThemedView = (
    <View
      style={[
        noFlex ? {} : styles.flexContainer,
        {
          backgroundColor: gradient
            ? "transparent"
            : (color && Colors.background[color]) || Colors.background.black,
        },
        style,
      ]}
      {...otherProps}
    />
  );
  return gradient ? (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{ flex: 1 }}
    >
      {ThemedView}
    </LinearGradient>
  ) : (
    ThemedView
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
