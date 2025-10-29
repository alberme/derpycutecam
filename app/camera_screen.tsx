import { PHOTO_CAMERA_IMAGES, PHOTO_FRAME_IMAGES } from "@/constants/assets";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router"; // get frame index from previous screen
import { captureRef } from "react-native-view-shot";

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
import type { PhotoFrameColor, PhotoFrameCount } from "@/types/photo_frame";

import ThemedText from "@/components/ThemedText";
import type { Asset } from "expo-asset";

export default function CameraScreen() {
  const { selectedFrameCount, selectedTemplateColor } = useLocalSearchParams<{
    selectedFrameCount: string;
    selectedTemplateColor: string;
  }>();
  const [selectedFrameImage] = useState<Asset>(
    PHOTO_FRAME_IMAGES[Number(selectedFrameCount) as PhotoFrameCount][
      selectedTemplateColor as PhotoFrameColor
    ]
  );

  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState<CameraType>("front");
  const [photoCount, setPhotoCount] = useState<number>(
    Math.ceil(Number(selectedFrameCount) / 2)
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTakePictureImage, setShowTakePictureImage] =
    useState<boolean>(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mergedUri, setMergedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const previewRef = useRef<View>(null);
  const cameraOpacity = useRef(new Animated.Value(0)).current;

  const startCountdown = () => {
    let count = 3;
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

  const saveMerged = async () => {
    if (!previewRef.current) return;
    try {
      const uri = await captureRef(previewRef.current, {
        format: "png",
        quality: 1,
      });
      console.log("✅ Merged image saved:", uri);
      setMergedUri(uri);
    } catch (err) {
      console.error("❌ Capture error:", err);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setPhotoUri(photo.uri);
    }
  };

  const renderTakePictureOverlay = () => {};

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
        startCountdown();
      });
    }
  }, [permission, cameraOpacity]);

  useEffect(() => {
    if (showTakePictureImage) {
      const id = setTimeout(() => {
        takePhoto();
        setShowTakePictureImage(false);
      }, 2000);
      return () => clearTimeout(id);
    }
  }, [showTakePictureImage]);

  if (!permission) {
    // Permissions are still loading
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Permission denied
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
        style={[
          styles.cameraContainer,
          {
            paddingHorizontal: Math.min(40, width * 0.06),
            paddingVertical: Math.min(48, height * 0.06),
            justifyContent: "space-evenly",
          },
        ]}
      >
        {!photoUri ? (
          <>
            <ThemedText type="title" color="black">
              Get Ready To Pose!
            </ThemedText>
            <ThemedText type="subtitle" color="black">
              {photoCount} photo{photoCount <= 1 ? "" : "s"} to snap!
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
                  { aspectRatio: 2 / 3, maxHeight: height * 0.7 },
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
        ) : mergedUri ? (
          <>
            <Image source={{ uri: mergedUri }} style={styles.capturedImage} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setPhotoUri(null);
                setMergedUri(null);
              }}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View
              ref={previewRef}
              collapsable={false}
              style={[
                styles.previewContainer,
                {
                  aspectRatio: 2 / 3,
                  maxHeight: height * 0.7,
                  // width: width * 0.8,
                },
              ]}
            >
              <Image source={{ uri: photoUri }} style={styles.capturedImage} />
              <Image
                source={selectedFrameImage}
                style={styles.frameOverlay}
                contentFit="contain"
              />
            </View>
          </>
        )}
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {},
  header: {
    backgroundColor: Colors.background.pink,
  },
  camera: {
    // position: "absolute",
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
    // flex: 1,
    // width: WIDTH * 0.8,
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
