import { Colors } from "@/constants/theme";
import { StyleSheet, View, type ViewProps } from "react-native";

export type ContainerViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export default function ContainerView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ContainerViewProps) {
  return <View style={[styles.container, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: Colors.background,
  },
});
