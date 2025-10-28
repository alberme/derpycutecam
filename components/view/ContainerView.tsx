import { Colors, type ColorsKey } from "@/constants/theme";
import { StyleSheet, View, type ViewProps } from "react-native";

export type ContainerViewProps = ViewProps & {
  color?: keyof ColorsKey["background"];
};

export default function ContainerView({
  style,
  color,
  ...otherProps
}: ContainerViewProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (color && Colors.background[color]) || Colors.background.black,
        },
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
