import { Colors } from "@/constants/theme";
import { StyleSheet, View } from "react-native";

export type TemplateType = 0 | 1 | 3 | 6;

interface PhotoTemplateProps {
  type: TemplateType;
}

export default function PhotoTemplateCard({ type }: PhotoTemplateProps) {
  const renderSlot = () => {
    switch (type) {
      case 1:
        return <View style={[styles.slot, styles.single]} />;

      case 3:
        return (
          <View style={styles.grid3}>
            {/* Top row */}
            <View style={styles.row}>
              <View style={[styles.slot, styles.half]} />
              <View style={[styles.slot, styles.half]} />
            </View>
            {/* Bottom full-width slot */}
            <View style={[styles.slot, styles.full]} />
          </View>
        );

      case 6:
        return (
          <View style={styles.grid6}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.slot} />
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={styles.template}>{renderSlot()}</View>;
}

const styles = StyleSheet.create({
  template: {
    backgroundColor: Colors.pink,
    borderRadius: 18,
    padding: 8,
    aspectRatio: 3 / 4,
    width: 220,
    height: 300,
    // justifyContent: "center",
  },
  slot: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    flexBasis: "45%", // two per row
    aspectRatio: 1, // keeps squares
    marginBottom: 6,
    // width: "48%",
  },
  single: {
    flex: 1,
    aspectRatio: 0,
    justifyContent: "flex-start",
    marginTop: 10,
    marginBottom: 30,
    marginHorizontal: 10,
  },
  // 3-photo layout
  grid3: {
    flex: 1,
    justifyContent: "flex-start",
    marginTop: 10,
    marginHorizontal: 10,
  },
  row: {
    gap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  half: {
    // width: "1%",
    // aspectRatio: 1,
  },
  full: {
    width: "100%",
    // flexBasis: "90%", // override the half flex basis in slot
    aspectRatio: 0,
  },
  // 6-photo layout
  grid6: {
    flexDirection: "row",
    flexWrap: "wrap",
    // justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 30,
    marginHorizontal: 10,
    flexBasis: "42%",
    gap: 10,
    // flex: 1,
  },
});
