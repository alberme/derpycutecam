import { type ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface GridProps {
  children: ReactNode;
  columns?: number; // how many columns
  gap?: number; // spacing between items
  style?: ViewStyle;
}

export default function Grid({
  children,
  columns = 2,
  gap = 10,
  style,
}: GridProps) {
  return (
    <View
      style={[
        styles.container,
        {
          gap, // only works on Web — safe fallback below
          // marginHorizontal: -gap / 2,
        },
        style,
      ]}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <View
              key={i}
              style={
                {
                  // width: `${100 / columns}%`,
                  // paddingHorizontal: gap / 2,
                  // marginBottom: gap,
                }
              }
            >
              {child}
            </View>
          ))
        : children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
});
