import ContainerView from "@/components/ContainerView";
import ScreenView from "@/components/ScreenView";
import ThemedText from "@/components/ThemedText";

import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

type slideDirectionType = "left" | "right";
type TemplateKey = keyof typeof TEMPLATE_IMAGES; // "1" | "3" | "6"
type TemplateImages = (typeof TEMPLATE_IMAGES)[TemplateKey][number]; // individual image type

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const TEMPLATE_IMAGES = {
  1: [
    require("@/assets/images/templates/1/black_1.png"),
    require("@/assets/images/templates/1/purple_1.png"),
    require("@/assets/images/templates/1/green_1.png"),
  ],
  3: [
    require("@/assets/images/templates/3/black_3.png"),
    require("@/assets/images/templates/3/purple_3.png"),
    require("@/assets/images/templates/3/green_3.png"),
  ],
  6: [
    require("@/assets/images/templates/6/black_6.png"),
    require("@/assets/images/templates/6/purple_6.png"),
    require("@/assets/images/templates/6/green_6.png"),
  ],
} as const;

export default function SelectTemplate() {
  const { type: selectedTemplateIndex } = useLocalSearchParams();
  const [currentFrameIndex, setCurrentTemplateIndex] = useState(0);
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
    const templateImages =
      TEMPLATE_IMAGES[selectedTemplateIndex as unknown as TemplateKey];

    Animated.timing(translateX, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentTemplateIndex((prev) =>
        direction === "left"
          ? (prev - 1 + templateImages.length) % templateImages.length
          : (prev + 1) % templateImages.length
      );
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
  }, [currentFrameIndex, translateX]);

  return (
    <ScreenView>
      <ContainerView style={styles.themedScreen}>
        <ThemedText style={styles.text} type="title">
          Select A Template! {selectedTemplateIndex}
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
              source={
                TEMPLATE_IMAGES[
                  selectedTemplateIndex as unknown as TemplateKey
                ][currentFrameIndex]
              }
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
