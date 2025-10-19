import ContainerView from "@/components/ContainerView";
import Grid from "@/components/Grid";
import ScreenView from "@/components/ScreenView";
import Text from "@/components/ThemedText";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import PhotoTemplateCard from "@/components/PhotoTemplateCard";
import ThemedButton from "@/components/ThemedButton";

import type { PhotoFrameCount } from "@/types/photo_frame";
const FRAME_COUNTS: PhotoFrameCount[] = [1, 3, 6];

export default function Select() {
  const router = useRouter();
  const [selectedFrameCount, setSelectedFrameCount] =
    useState<PhotoFrameCount>(1);

  const handleCardPress = (type: PhotoFrameCount) => {
    setSelectedFrameCount(type);
  };

  return (
    <ScreenView>
      <ContainerView style={{ gap: 80 }}>
        <Text type="title">Select How Many Frames!</Text>
        <Grid columns={3} gap={60} style={{ flexDirection: "row" }}>
          {FRAME_COUNTS.map((count) => (
            <TouchableOpacity
              key={count}
              style={selectedFrameCount === count && styles.selectedTemplate}
              activeOpacity={0.8}
              onPress={() => handleCardPress(count)}
            >
              <PhotoTemplateCard key={count} frameCount={count} />
            </TouchableOpacity>
          ))}
          {/* <PhotoTemplateCard type={6} /> */}
        </Grid>
        <ThemedButton
          title="Gooo!"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/select_template",
              params: { selectedFrameCount },
            })
          }
        />
      </ContainerView>
    </ScreenView>
  );
}

// const Card = () => {
//   return <View style={styles.card}></View>;
// };

const styles = StyleSheet.create({
  selectedTemplate: {
    borderColor: "white",
    borderWidth: 10,
    borderRadius: 30,
  },
  // card: {
  //   backgroundColor: Colors.pink,
  //   width: 200,
  //   height: 300,
  //   borderWidth: 1,
  //   borderRadius: 20,
  //   paddingVertical: 20,
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
});
