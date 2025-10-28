import { PHOTO_FRAME_IMAGES } from "@/constants/assets";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router"; // get frame index from previous screen
import { captureRef } from "react-native-view-shot";

import { useEffect, useRef, useState } from "react";
import {
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mergedUri, setMergedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const previewRef = useRef<View>(null);

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        takePhoto();
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
      console.log("Captured photo:", photo.uri);
    }
  };

  useEffect(() => {
    console.log("starting countdown");
    const id = setTimeout(startCountdown, 3000);
    return () => {
      clearTimeout(id);
      console.log("unmounted!");
    };
  }, []);

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
          },
        ]}
      >
        {!photoUri ? (
          <>
            <ThemedText type="title" color="black" style={{ marginBottom: 40 }}>
              Get Ready To Pose!
            </ThemedText>
            <CameraView
              ref={cameraRef}
              style={[
                styles.camera,
                { aspectRatio: 9 / 16, maxHeight: height * 0.68 },
              ]}
              facing={facing}
              autofocus="on"
              mirror={true}
            />
            {countdown && (
              <View style={styles.countdownOverlay}>
                <Text style={styles.countdownText}>{countdown}</Text>
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
                  maxHeight: height * 0.68,
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
            {/* <TouchableOpacity style={styles.captureButton} onPress={saveMerged}>
              <Text style={styles.buttonText}>Save with Frame</Text>
            </TouchableOpacity> */}
          </>
        )}
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    paddingHorizontal: 100,
    paddingVertical: 100,
  },
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
