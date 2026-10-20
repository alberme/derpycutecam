import { PHOTO_CAMERA_IMAGES, PHOTO_FRAME_CARDS } from "@/src/constants/assets";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useLayoutSize } from "../hooks/useLayoutSize";

import { ContainerView, ScreenView } from "@/src/components/view";
import { Colors } from "@/src/constants/theme";
import type {
  PhotoFrameColor,
  PhotoFrameCount,
  PhotoFrameSettings,
  PhotoSnappedSet,
} from "@/src/types/photo_frame";

import ThemedText from "@/src/components/ThemedText";
import { PHOTO_FRAME_ASPECT_RATIO } from "@/src/constants/photo_frame_layout";
import PhotoCard from "../components/PhotoCard";

import type { PhotoCardTransition } from "@/src/types/photo_frame";

export default function CameraScreen() {
  const router = useRouter();
  const { selectedFrameCount, selectedTemplateColor } = useLocalSearchParams<{
    selectedFrameCount: string;
    selectedTemplateColor: string;
  }>();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();

  const { size: previewSize, onLayout: onPreviewLayout } = useLayoutSize();
  const compositionWidth = Math.min(
    previewSize.width,
    previewSize.height * PHOTO_FRAME_ASPECT_RATIO,
  );

  const [selectedFrameSettings] = useState<PhotoFrameSettings>({
    frameOverlay:
      PHOTO_FRAME_CARDS[Number(selectedFrameCount) as PhotoFrameCount][
        selectedTemplateColor as PhotoFrameColor
      ],
    selectedFrameCount: Number(selectedFrameCount),
    selectedTemplateColor: selectedTemplateColor as PhotoFrameColor,
    totalFramePhotos: Number(selectedFrameCount),
  });
  const [facing, setFacing] = useState<CameraType>("front");
  const [currentPhotoCount, setCurrentPhotoCount] = useState<number>(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTakePictureImage, setShowTakePictureImage] =
    useState<boolean>(false);
  const [photoShootFinished, setPhotoShootFinished] = useState<boolean>(false);
  const [photoShootReady, setPhotoShootReady] = useState<boolean>(false);
  const [photoUriSet, setPhotoUriSet] = useState<PhotoSnappedSet>(
    {} as PhotoSnappedSet,
  );

  const cameraRef = useRef<CameraView>(null);
  const cameraOpacity = useRef(new Animated.Value(0)).current;
  const cardWidth = useRef(new Animated.Value(0)).current;
  const cardSizeInitialized = useRef(false);

  useEffect(() => {
    if (compositionWidth <= 0) return;
    const targetWidth = compositionWidth * (photoShootReady ? 0.96 : 1);

    if (!cardSizeInitialized.current) {
      cardWidth.setValue(targetWidth);
      cardSizeInitialized.current = true;
      return;
    }

    const animation = Animated.timing(cardWidth, {
      toValue: targetWidth,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      // Width changes layout so the complete card stays aligned with its slots.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [compositionWidth, photoShootReady, cardWidth]);

  const photoAnimation: PhotoCardTransition = {
    duration: 3000,
    effect: "cross-dissolve",
    timing: "ease-in",
    fadeFromColor: Colors.background.white,
    onAnimationFinish: () => {
      console.log(`animation finish: slot ${currentPhotoCount - 1}`);
      if (currentPhotoCount > selectedFrameSettings.totalFramePhotos) {
        setPhotoShootFinished(true);
      } else {
        setPhotoShootReady(true);
      }
    },
  };

  // Fade in live camera slot when permission is granted and before running photo shoot
  useEffect(() => {
    if (permission && permission.granted && !photoShootReady) {
      Animated.timing(cameraOpacity, {
        toValue: 1,
        duration: 5000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        // only run on init photoshoot
        if (currentPhotoCount === 1) {
          console.log("camera_screen init:");
          setPhotoShootReady(true);
        }
      });
    }
  }, [permission, cameraOpacity, currentPhotoCount]);

  // display finished photo shoot in photo card
  useEffect(() => {
    if (photoShootFinished) {
      router.push({
        pathname: "./photoshoot_finish",
        params: {
          selectedFrameSettings: JSON.stringify(selectedFrameSettings),
          photoUris: JSON.stringify(photoUriSet),
        },
      });
    }
  }, [photoShootFinished, router]);

  // waits 2 seconds, take picture
  useEffect(() => {
    if (!showTakePictureImage) return;

    const id = setTimeout(async () => {
      try {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        setPhotoUriSet((previous) => ({
          ...previous,
          [currentPhotoCount]: photo.uri,
        }));
        setCurrentPhotoCount((count) => count + 1);
      } catch (error) {
        console.error("Could not capture photo:", error);
      } finally {
        setShowTakePictureImage(false);
        setPhotoShootReady(false);
      }
    }, 2000);

    return () => clearTimeout(id);
  }, [currentPhotoCount, showTakePictureImage]);

  // Start each countdown and cancel it on unmount or when the photoshoot changes.
  useEffect(() => {
    if (!photoShootReady || photoShootFinished) return;

    if (currentPhotoCount > selectedFrameSettings.totalFramePhotos) {
      // delay here or show the pumpkins after the condition above is true
      setPhotoShootFinished(true);
      return;
    }

    let count = 5;
    setCountdown(count);

    const countdownId = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(countdownId);
        setCountdown(null);
        setShowTakePictureImage(true);
      } else {
        setCountdown(count);
      }
    }, 1000);

    return () => clearInterval(countdownId);
  }, [currentPhotoCount, photoShootFinished, photoShootReady]);

  if (!permission) {
    return (
      <ContainerView>
        <ThemedText type="xxl" font="fredoka">
          Requesting camera permissions...
        </ThemedText>
      </ContainerView>
    );
  }

  if (!permission.granted) {
    return (
      <ContainerView>
        <ThemedText
          type="xxl"
          font="fredoka"
          style={{ textAlign: "center", marginBottom: 10 }}
        >
          Camera access is required to use derpycutecam!
        </ThemedText>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <ThemedText type="default" font="fredoka" style={styles.buttonText}>
            Grant Permission
          </ThemedText>
        </TouchableOpacity>
      </ContainerView>
    );
  }

  return (
    <ScreenView>
      <ContainerView
        gradient
        style={{
          paddingHorizontal: Math.min(40, width * 0.06),
          paddingVertical: Math.min(48, height * 0.06),
          justifyContent: "space-evenly",
        }}
      >
        <>
          <ThemedText type="xxl" font="fredoka">
            {photoShootReady ? "get ready to pose!" : ""}
          </ThemedText>
          {photoShootReady && (
            <ThemedText type="subtitle" font="fredoka">
              {`Photo ${Math.min(currentPhotoCount, selectedFrameSettings.totalFramePhotos)} of ${selectedFrameSettings.totalFramePhotos}`}
            </ThemedText>
          )}
          <Animated.View
            onLayout={onPreviewLayout}
            style={[styles.cameraStageWrapper, { opacity: cameraOpacity }]}
          >
            {compositionWidth > 0 && (
              <Animated.View style={{ width: cardWidth }}>
                <PhotoCard
                  photoUriSet={photoUriSet}
                  photoFrameSettings={selectedFrameSettings}
                  activeSlot={currentPhotoCount}
                  animationSettings={photoAnimation}
                >
                  <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                    autofocus="on"
                    mirror
                  />
                </PhotoCard>
              </Animated.View>
            )}
          </Animated.View>
          {countdown && (
            <View style={styles.countdownOverlay}>
              <ThemedText type="jumbo" font="fredoka" color="pink">
                {countdown}
              </ThemedText>
            </View>
          )}
          {showTakePictureImage && (
            <View
              style={{
                ...StyleSheet.absoluteFill,
                backgroundColor: "rgba(52, 52, 52, 0.5)",
              }}
            >
              <Image
                source={PHOTO_CAMERA_IMAGES.take_picture}
                contentFit="contain"
                transition={500}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  aspectRatio: 2 / 3,
                  height: "40%",
                  maxHeight: height * 0.5,
                }}
              />
            </View>
          )}
        </>
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  camera: {
    width: "100%",
    height: "100%",
  },
  cameraStageWrapper: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 0,
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraStage: {
    position: "relative",
    overflow: "hidden",
  },
  frameOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  countdownOverlay: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  previewContainer: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.black,
  },
  permissionButton: {
    backgroundColor: "#f472b6",
    padding: 12,
    borderRadius: 8,
  },
});
