import { Colors, type ColorsKey } from "@/src/constants/theme";
import { StyleSheet, View, type ViewProps } from "react-native";

export type ContainerViewProps = ViewProps & {
  color?: keyof ColorsKey["background"];
  noFlex?: boolean;
};

export default function ContainerView({
  style,
  color,
  noFlex = false,
  ...otherProps
}: ContainerViewProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (color && Colors.background[color]) || Colors.background.black,
          flex: noFlex ? 0 : 1,
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
