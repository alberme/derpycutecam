import { Colors } from "@/src/constants/theme";
import type { PhotoFrameCount } from "@/src/types/photo_frame";
import { StyleSheet, View, type ViewStyle } from "react-native";
import ContainerView from "./view/ContainerView";
interface PhotoTemplateCardProps {
  frameCount: PhotoFrameCount;
}

interface PhotoSlotProps {
  style?: ViewStyle;
  noFlex?: boolean;
}

function PhotoSlot({ style, noFlex = false }: PhotoSlotProps) {
  return <ContainerView color="blackPink" noFlex={noFlex} style={style} />;
}

function ThreePhotoLayout() {
  return (
    <View style={styles.threeLayout}>
      <View style={styles.twoColumnRow}>
        <PhotoSlot />
        <PhotoSlot />
      </View>
      <PhotoSlot />
    </View>
  );
}

function SixPhotoLayout() {
  return (
    <View style={styles.sixLayout}>
      {Array.from({ length: 6 }, (_, index) => (
        <PhotoSlot key={index} noFlex style={styles.sixSlot} />
      ))}
    </View>
  );
}

// add slot color prop
export default function PhotoTemplateCard({
  frameCount,
}: PhotoTemplateCardProps) {
  const photoLayout = (frames: PhotoFrameCount) => {
    switch (frames) {
      case 1:
        return <PhotoSlot />;
      case 3:
        return <ThreePhotoLayout />;
      case 6:
        return <SixPhotoLayout />;
    }
  };
  return (
    <ContainerView noFlex style={styles.card}>
      {photoLayout(frameCount)}
    </ContainerView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 147,
    height: 178,
    padding: 14,
    paddingBottom: 40,
    backgroundColor: Colors.background.pink,
  },

  threeLayout: {
    flex: 1,
    gap: 10,
  },
  twoColumnRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  sixLayout: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  sixSlot: {
    width: "47%",
    height: "31%",
  },
});
