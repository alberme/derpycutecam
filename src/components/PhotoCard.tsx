import { Image } from "expo-image";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

import { ContainerView } from "@/src/components/view";
import {
  PHOTO_FRAME_ASPECT_RATIO,
  PHOTO_SLOT_BOUNDS,
} from "@/src/constants/photo_frame_layout";
import type {
  PhotoCardProps,
  PhotoCardTransition,
  PhotoFrameCount,
} from "@/src/types/photo_frame";
import { useCallback, useEffect, useRef } from "react";
import { Colors } from "../constants/theme";

function CapturedPhoto({
  uri,
  settings,
  onFinish,
}: {
  uri: string;
  settings: PhotoCardTransition;
  onFinish: () => void;
}) {
  const flashOpacity = useRef(new Animated.Value(1)).current;
  const started = useRef(false);
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => () => animation.current?.stop(), []);

  return (
    <View style={styles.slotImage}>
      <Image
        source={{ uri }}
        style={styles.slotImage}
        contentFit="cover"
        transition={0}
        onDisplay={() => {
          if (started.current) return;
          started.current = true;
          const easing =
            settings.timing === "ease-in"
              ? Easing.in(Easing.cubic)
              : settings.timing === "ease-out"
                ? Easing.out(Easing.cubic)
                : settings.timing === "linear"
                  ? Easing.linear
                  : Easing.inOut(Easing.cubic);
          animation.current = Animated.timing(flashOpacity, {
            toValue: 0,
            duration: settings.duration ?? 0,
            easing,
            useNativeDriver: Platform.OS !== "web",
          });
          animation.current.start(({ finished }) => {
            if (finished) onFinish();
          });
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: settings.fadeFromColor ?? "transparent",
            opacity: flashOpacity,
          },
        ]}
      />
    </View>
  );
}

export default function PhotoCard({
  photoUriSet,
  photoFrameSettings,
  activeSlot,
  children,
  animationSettings = {},
  style,
}: PhotoCardProps) {
  const cameraViewOpacity = useRef(new Animated.Value(1)).current;
  const totalSlots = photoFrameSettings.selectedFrameCount as PhotoFrameCount;
  const slots = PHOTO_SLOT_BOUNDS[totalSlots];
  // active slot means there should be a child component to render
  const activeBounds = activeSlot ? slots[activeSlot - 1] : null;

  const {
    onAnimationFinish,
    duration = 0,
    fadeFromColor = Colors.background.transparent,
  } = animationSettings;

  // Compare URI values rather than the object identity, which may change on render.
  const photoKey = JSON.stringify(
    Object.entries(photoUriSet).sort(([a], [b]) => Number(a) - Number(b)),
  );
  const previousPhotoKey = useRef(photoKey);
  const animationOptions = useRef({ onAnimationFinish, duration });

  useEffect(() => {
    animationOptions.current = { onAnimationFinish, duration };
  }, [onAnimationFinish, duration]);

  useEffect(() => {
    if (previousPhotoKey.current === photoKey) return;
    previousPhotoKey.current = photoKey;
    cameraViewOpacity.stopAnimation();
    cameraViewOpacity.setValue(0);
  }, [photoKey, cameraViewOpacity]);

  const handlePhotoFinish = useCallback(() => {
    animationOptions.current.onAnimationFinish?.();
    Animated.timing(cameraViewOpacity, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [cameraViewOpacity]);

  useEffect(() => () => cameraViewOpacity.stopAnimation(), [cameraViewOpacity]);

  return (
    <ContainerView
      color="blackPink"
      noFlex
      collapsable={false}
      style={[styles.previewContainer, style]}
    >
      {slots.map((bounds, index) => {
        const uri = photoUriSet[index + 1];
        return uri ? (
          <View
            key={index}
            style={[
              styles.containerSlot,
              bounds,
              { backgroundColor: fadeFromColor },
            ]}
          >
            <CapturedPhoto
              key={uri}
              uri={uri}
              settings={animationSettings}
              onFinish={handlePhotoFinish}
            />
          </View>
        ) : (
          <View key={index} style={[styles.containerSlot, bounds]} />
        );
      })}
      {activeBounds && children && (
        <Animated.View
          style={[styles.slotImage, { opacity: cameraViewOpacity }]}
        >
          <View style={[styles.activeSlot, activeBounds]}>{children}</View>
        </Animated.View>
      )}
      <Image
        pointerEvents="none"
        source={photoFrameSettings.frameOverlay}
        style={styles.frameOverlay}
        contentFit="fill"
      />
    </ContainerView>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    width: "100%",
    aspectRatio: PHOTO_FRAME_ASPECT_RATIO,
    overflow: "hidden",
  },
  frameOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  activeSlot: {
    position: "absolute",
    overflow: "hidden",
  },
  containerSlot: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: Colors.background.transparent,
  },
  whiteSlot: {
    backgroundColor: "#fff",
  },
  slotImage: {
    width: "100%",
    height: "100%",
  },
});
