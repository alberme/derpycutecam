import { Colors, Fonts, type ColorsKey } from "@/constants/theme";
import { StyleSheet, Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  color?: keyof ColorsKey["text"];
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "link"
    | "xl"
    | "xxl";
};

export default function ThemedText({
  style,
  color,
  type = "default",
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        {
          color: (color && Colors.text[color]) || Colors.text.white,
          fontFamily: Fonts.sans,
        },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        type === "xl" ? styles.xl : undefined,
        type === "xxl" ? styles.xxl : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    // lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
  xl: {
    fontSize: 40,
    fontWeight: "bold",
    lineHeight: 40,
  },
  xxl: {
    fontSize: 60,
    fontWeight: "bold",
    lineHeight: 60,
  },
});
