import ContainerView from "@/components/ContainerView";
import ScreenView from "@/components/ScreenView";
import ThemedButton from "@/components/ThemedButton";
import ThemedText from "@/components/ThemedText";

import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { PHOTO_FRAME_IMAGES } from "@/constants/assets";
import type {
  PhotoFrameColor,
  PhotoFrameCount,
  PhotoTemplateByColor,
} from "@/types/photo_frame";
type slideDirectionType = "left" | "right";

const { width: WINDOW_WIDTH } = Dimensions.get("window");

export default function SelectTemplate() {
  const { selectedFrameCount } = useLocalSearchParams<{
    selectedFrameCount: string;
  }>();
  const [selectedPhotoTemplates] = useState<PhotoTemplateByColor>(
    PHOTO_FRAME_IMAGES[Number(selectedFrameCount) as PhotoFrameCount]
  );
  const [currentTemplateViewColor, setCurrentTemplateViewColor] =
    useState<PhotoFrameColor>("black");
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (e, gesture) => {
        translateX.setValue(gesture.dx);
      },
      onPanResponderRelease: (e, gesture) => {
        const swipeThreshold = 100;
        if (gesture.dx > swipeThreshold) {
          slideTo("right");
        } else if (gesture.dx < -swipeThreshold) {
          slideTo("left");
        } else {
          // snap back to center
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  const slideTo = (direction: slideDirectionType) => {
    const toValue = direction === "left" ? -WINDOW_WIDTH : WINDOW_WIDTH;
    const templatesByColor =
      PHOTO_FRAME_IMAGES[Number(selectedFrameCount) as PhotoFrameCount];
    const templateColors = Object.keys(templatesByColor) as PhotoFrameColor[];

    Animated.timing(translateX, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentTemplateViewColor((prev) => {
        const templateColorIndex = templateColors.indexOf(prev);
        return direction === "left"
          ? templateColors[
              (templateColorIndex - 1 + templateColors.length) %
                templateColors.length
            ]
          : templateColors[(templateColorIndex + 1) % templateColors.length];
      });
    });
  };
  const handlePrev = () => slideTo("left");
  const handleNext = () => slideTo("right");

  useEffect(() => {
    // run on next frame after the new template has rendered
    const raf = requestAnimationFrame(() => {
      translateX.setValue(0);
    });
    return () => cancelAnimationFrame(raf);
  }, [currentTemplateViewColor, translateX]);

  return (
    <ScreenView>
      <ContainerView style={styles.themedScreen}>
        <ThemedText style={styles.text} type="title">
          Select A Template!
        </ThemedText>
        <ContainerView style={[styles.themedScreen, styles.frameContainer]}>
          <TouchableOpacity style={styles.arrowButton} onPress={handlePrev}>
            <ThemedText style={styles.text} type="xxl">
              ◀
            </ThemedText>
          </TouchableOpacity>

          <Animated.View
            {...panResponder.panHandlers}
            style={{ transform: [{ translateX }] }}
          >
            <Image
              source={selectedPhotoTemplates[currentTemplateViewColor]}
              style={styles.frameImage}
              contentFit="scale-down"
            />
          </Animated.View>

          <TouchableOpacity style={styles.arrowButton} onPress={handleNext}>
            <ThemedText style={styles.text} type="xxl">
              ▶
            </ThemedText>
          </TouchableOpacity>
        </ContainerView>
        <ThemedButton
          title="Gooo!"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/camera_screen",
              params: {
                selectedFrameCount,
                selectedTemplateColor: currentTemplateViewColor,
              },
            })
          }
        />
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  themedScreen: {
    backgroundColor: Colors.pink,
    paddingHorizontal: 0,
  },
  frameContainer: {
    flex: 0,
    flexBasis: "auto",
    width: WINDOW_WIDTH * 0.9,
    overflow: "hidden",
    flexDirection: "row",
    gap: 20,
  },
  arrowButton: {
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  frameImage: {
    width: WINDOW_WIDTH * 0.6,
    aspectRatio: 9 / 16,
  },
  text: {
    color: Colors.blackText,
  },
});
