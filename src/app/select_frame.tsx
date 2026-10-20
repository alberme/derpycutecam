import Grid from "@/src/components/Grid";
import { ContainerView, ScreenView } from "@/src/components/view";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TouchableOpacity } from "react-native";

import PhotoTemplateCard from "@/src/components/PhotoTemplateCard";
import ThemedButton from "@/src/components/ThemedButton";

import ThemedText from "@/src/components/ThemedText";
import type { PhotoFrameCount } from "@/src/types/photo_frame";
const FRAME_COUNTS: PhotoFrameCount[] = [1, 3, 6];

export default function SelectFrame() {
  const router = useRouter();
  const [selectedFrameCount, setSelectedFrameCount] =
    useState<PhotoFrameCount>(1);

  const handleCardPress = (type: PhotoFrameCount) => {
    setSelectedFrameCount(type);
  };

  return (
    <ScreenView>
      <ContainerView gradient style={{ gap: 80 }}>
        <ThemedText type="xxl" font="fredoka">
          select how many frames
        </ThemedText>
        <Grid
          columns={3}
          gap={60}
          style={{ flexDirection: "row", paddingHorizontal: 20 }}
        >
          {FRAME_COUNTS.map((count) => (
            <ContainerView
              noFlex
              color="transparent"
              style={{
                alignItems: "center",
                gap: 60,
              }}
              key={count}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: selectedFrameCount === count }}
                activeOpacity={0.8}
                onPress={() => handleCardPress(count)}
              >
                <PhotoTemplateCard
                  frameCount={count}
                  selected={selectedFrameCount === count}
                />
              </TouchableOpacity>
              <ThemedText font="fredoka" type="xxl">
                {count}
              </ThemedText>
            </ContainerView>
          ))}
        </Grid>
        <ThemedButton
          title="Gooo!"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "./select_theme",
              params: { selectedFrameCount },
            })
          }
        />
      </ContainerView>
    </ScreenView>
  );
}
