import { PHOTO_CAMERA_IMAGES, PHOTO_FRAME_IMAGES } from "@/constants/assets";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { ContainerView, ScreenView } from "@/components/view";
import { Colors } from "@/constants/theme";
import type {
  PhotoFrameColor,
  PhotoFrameCount,
  PhotoFrameSettings,
  PhotoSnappedSet,
} from "@/types/photo_frame";

import ThemedText from "@/components/ThemedText";

export default function CameraScreen() {
  const router = useRouter();
  const { selectedFrameCount, selectedTemplateColor } = useLocalSearchParams<{
    selectedFrameCount: string;
    selectedTemplateColor: string;
  }>();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();

  const [selectedFrameSettings] = useState<PhotoFrameSettings>({
    frameOverlay:
      PHOTO_FRAME_IMAGES[Number(selectedFrameCount) as PhotoFrameCount][
        selectedTemplateColor as PhotoFrameColor
      ],
    selectedFrameCount: Number(selectedFrameCount),
    selectedTemplateColor: selectedTemplateColor as PhotoFrameColor,
    totalFramePhotos: 1,
    // scrapping multi photo shoot for now - Math.ceil(Number(selectedFrameCount) / 2)
  });
  const [facing, setFacing] = useState<CameraType>("front");
  const [currentPhotoCount, setCurrentPhotoCount] = useState<number>(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTakePictureImage, setShowTakePictureImage] =
    useState<boolean>(false);
  const [photoShootFinished, setPhotoShootFinished] = useState<boolean>(false);
  const [photoShootReady, setPhotoShootReady] = useState<boolean>(false);
  const [photoUriSet, setPhotoUriSet] = useState<PhotoSnappedSet>(
    {} as PhotoSnappedSet
  );

  const cameraRef = useRef<CameraView>(null);
  const previewRef = useRef<View>(null);
  const cameraOpacity = useRef(new Animated.Value(0)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;

  const startCountdown = () => {
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
  };

  const goToPhotoFinish = () => {};

  // Fade in camera when permission is granted
  useEffect(() => {
    if (permission && permission.granted) {
      Animated.timing(cameraOpacity, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        console.log("Camera faded in, starting countdown");
        setPhotoShootReady(true);
      });
    }
  }, [permission, cameraOpacity]);

  // display captured photo with frame overlay
  useEffect(() => {
    if (photoShootFinished) {
      Animated.sequence([
        Animated.delay(300), // wait 1 second (1000ms)
        Animated.timing(previewOpacity, {
          toValue: 1,
          duration: 5000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.delay(2000),
      ]).start(() => {
        // maybe add an option to retake photos
        router.push({
          pathname: "/photoshoot_finish",
          params: {
            photoFrameSettings: JSON.stringify(selectedFrameSettings),
            // photoUriSet: JSON.stringify(photoUriSet),
            photoUri: photoUriSet[1], // for now, only single photo
          },
        });
      });
    }
  }, [
    photoShootFinished,
    previewOpacity,
    router,
    selectedFrameSettings,
    photoUriSet,
  ]);

  // will only run after countdown reaches 0
  useEffect(() => {
    const takePhoto = async () => {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });
        setPhotoUriSet((prev) => {
          return {
            ...prev,
            [currentPhotoCount]: photo.uri,
          };
        });
      }
    };
    if (showTakePictureImage) {
      const id = setTimeout(() => {
        takePhoto();
        setShowTakePictureImage(false);
        setCurrentPhotoCount(currentPhotoCount + 1);
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [currentPhotoCount, showTakePictureImage]);

  // thinking we need this to run the photo loop
  useEffect(() => {
    if (photoShootReady) {
      if (
        !photoShootFinished &&
        currentPhotoCount <= selectedFrameSettings.totalFramePhotos
      ) {
        startCountdown();
      } else if (currentPhotoCount >= selectedFrameSettings.totalFramePhotos) {
        setPhotoShootFinished(true);
      }
    }
  }, [
    currentPhotoCount,
    selectedFrameSettings,
    photoShootFinished,
    photoShootReady,
  ]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          Camera access is required to use this feature.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenView>
      <ContainerView
        color="pink"
        style={{
          paddingHorizontal: Math.min(40, width * 0.06),
          paddingVertical: Math.min(48, height * 0.06),
          justifyContent: "space-evenly",
        }}
      >
        {!photoShootFinished ? (
          <>
            <ThemedText type="title" color="black" style={{}}>
              Get Ready To Pose!
            </ThemedText>
            <ThemedText type="subtitle" color="black">
              {selectedFrameSettings.totalFramePhotos - currentPhotoCount + 1}{" "}
              photo
              {currentPhotoCount <= 1 ? "" : "s"} to snap
            </ThemedText>
            <Animated.View
              style={{
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                opacity: cameraOpacity,
              }}
            >
              <CameraView
                ref={cameraRef}
                style={[
                  styles.camera,
                  { aspectRatio: 2 / 3, maxHeight: height * 0.72 },
                ]}
                facing={facing}
                autofocus="on"
                mirror={true}
              />
            </Animated.View>
            {countdown && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
            {showTakePictureImage && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
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
        ) : (
          <>
            <ThemedText type="title" color="black">
              🎃🎃🎃
            </ThemedText>
            <Animated.View
              ref={previewRef}
              collapsable={false}
              style={[
                styles.previewContainer,
                {
                  aspectRatio: 2 / 3,
                  maxHeight: height * 0.7,
                  opacity: previewOpacity,
                },
              ]}
            >
              <Image
                source={{ uri: photoUriSet[currentPhotoCount - 1] }}
                style={styles.capturedImage}
              />
              <Image
                source={selectedFrameSettings.frameOverlay}
                style={styles.frameOverlay}
                contentFit="contain"
              />
            </Animated.View>
          </>
        )}
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.background.pink,
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  capturedImage: {
    width: "100%",
    height: "100%",
  },
  takePictureOverlay: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  frameOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  countdownOverlay: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  countdownText: {
    color: "#fff",
    fontSize: 80,
    fontWeight: "bold",
  },
  captureButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "#f472b6",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  retakeButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "#f472b6",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  previewContainer: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  permissionButton: {
    backgroundColor: "#f472b6",
    padding: 12,
    borderRadius: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
