import { PHOTO_FRAME_IMAGES } from "@/constants/assets";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router"; // get frame index from previous screen
import { captureRef } from "react-native-view-shot";

import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { PhotoFrameColor, PhotoFrameCount } from "@/types/photo_frame";
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

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mergedUri, setMergedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const previewRef = useRef<View>(null);

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

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            autofocus="on"
            mirror={true}
          />
          {countdown && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
          {!countdown && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={startCountdown}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
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
            style={styles.previewContainer}
          >
            <Image source={{ uri: photoUri }} style={styles.capturedImage} />
            <Image
              source={selectedFrameImage}
              style={styles.frameOverlay}
              contentFit="contain"
            />
          </View>
          <TouchableOpacity style={styles.captureButton} onPress={saveMerged}>
            <Text style={styles.buttonText}>Save with Frame</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    position: "absolute",
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
    flex: 1,
    width: "100%",
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
