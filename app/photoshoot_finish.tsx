import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";
// import { PHOTO_CAMERA_IMAGES, PHOTO_FRAME_IMAGES } from "@/constants/assets";

import ThemedButton from "@/components/ThemedButton";
import ThemedText from "@/components/ThemedText";
import { ContainerView, ScreenView } from "@/components/view";
import { PRINTER } from "@/constants/printer";
import { Colors } from "@/constants/theme";
import type { PhotoFrameSettings } from "@/types/photo_frame";
import { printPhoto } from "@/util/print";

type PhotoPrintSettings = {
  isPrinting: boolean;
  savedPhotoUri: string;
  printerUri: string;
  printerName: string;
};

export default function PhotoshootFinish() {
  const { selectedFrameSettings, photoUri } = useLocalSearchParams<{
    selectedFrameSettings: string;
    photoUri: string;
  }>();
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  const [photoFrameSettings] = useState<PhotoFrameSettings>(
    JSON.parse(selectedFrameSettings)
  );
  const [printSettings, setPrintSettings] = useState<PhotoPrintSettings>({
    isPrinting: false,
    savedPhotoUri: "",
    printerUri: PRINTER.canon_selphy_cp1500.url,
    printerName: PRINTER.canon_selphy_cp1500.name,
  });

  const previewRef = useRef(null);

  useEffect(() => {
    const handleSaveAndPrint = async () => {
      const photoUri = await savePhoto();
      await printPhoto(photoUri, PRINTER.canon_selphy_cp1500);
      setPrintSettings((prev) => ({
        ...prev,
        savedPhotoUri: photoUri,
        isPrinting: false,
      }));
    };

    if (printSettings.isPrinting) {
      handleSaveAndPrint();
    }
  }, [printSettings.isPrinting]);

  const savePhoto = async (): Promise<string> => {
    let photoUri = "";

    if (previewRef.current) {
      try {
        photoUri = await captureRef(previewRef.current, {
          format: "png",
          quality: 1,
          width: 1200,
          height: 1800,
        });
        console.log("✅ Merged image saved:", photoUri);
      } catch (err) {
        console.error("❌ Capture error:", err);
      }
    }
    return photoUri;
  };

  return (
    <ScreenView>
      <ContainerView
        color="pink"
        style={{
          paddingHorizontal: Math.min(40, width * 0.06),
          paddingVertical: Math.min(48, height * 0.06),
          justifyContent: "space-between",
        }}
      >
        <ThemedText type="title" color="black">
          Enjoy!
        </ThemedText>
        <View
          ref={previewRef}
          collapsable={false}
          style={[
            styles.previewContainer,
            {
              aspectRatio: 2 / 3,
              maxHeight: height * 0.7,
            },
          ]}
        >
          <Image source={{ uri: photoUri }} style={styles.capturedImage} />
          <Image
            source={photoFrameSettings.frameOverlay}
            style={styles.frameOverlay}
            contentFit="contain"
          />
        </View>
        <View style={{ flexDirection: "row", gap: 30 }}>
          <ThemedButton
            title="Print!"
            variant="secondary"
            onPress={() => {
              setPrintSettings((prev) => ({ ...prev, isPrinting: true }));
            }}
            loading={printSettings.isPrinting}
          />
          <ThemedButton
            title="Start Over!"
            variant="secondary"
            // onPress={() => router.push("/select_frame")} - for now go directly to template select
            onPress={() =>
              router.push({
                pathname: "/",
              })
            }
            disabled={printSettings.isPrinting}
          />
        </View>
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
