import * as ImageManipulator from "expo-image-manipulator";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";
// import { PHOTO_CAMERA_IMAGES, PHOTO_FRAME_IMAGES } from "@/constants/assets";

import ThemedButton from "@/src/components/ThemedButton";
import ThemedText from "@/src/components/ThemedText";
import { ContainerView, ScreenView } from "@/src/components/view";
import {
  createPhotoPrintHtml,
  PHOTO_FRAME_ASPECT_RATIO,
} from "@/src/constants/photo_frame_layout";
import { Colors } from "@/src/constants/theme";
import { useLayoutSize } from "@/src/hooks/useLayoutSize";
import type {
  PhotoFrameSettings,
  PhotoSnappedSet,
} from "@/src/types/photo_frame";
import PhotoCard from "../components/PhotoCard";

type PhotoPrintSettings = {
  isPrinting: boolean;
  savedPhotoUri: string;
  printerUri: string;
  printerName: string;
};

export default function PhotoshootFinish() {
  const { selectedFrameSettings, photoUris } = useLocalSearchParams<{
    selectedFrameSettings: string;
    photoUris: string;
  }>();
  const { width, height } = useWindowDimensions();
  const router = useRouter();

  const [photoFrameSettings] = useState<PhotoFrameSettings>(
    JSON.parse(selectedFrameSettings),
  );
  const photoUriSet = JSON.parse(photoUris) as PhotoSnappedSet;
  const { size: previewSize, onLayout: onPreviewLayout } = useLayoutSize();
  const compositionWidth = Math.min(
    previewSize.width,
    previewSize.height * PHOTO_FRAME_ASPECT_RATIO,
  );
  const [printSettings, setPrintSettings] = useState<PhotoPrintSettings>({
    isPrinting: false,
    savedPhotoUri: "",
    printerUri: "",
    printerName: "",
  });

  const previewRef = useRef(null);

  useEffect(() => {
    const handleSaveAndPrint = async () => {
      // iOS only {"name": "Canon SELPHY CP1500", "url": "ipps://CP15005dba73.local.:443/ipp/print"}
      // const printer = await Print.selectPrinterAsync();
      const printer = {
        name: "Canon SELPHY CP1500",
        url: "ipps://CP15005dba73.local.:443/ipp/print",
      };

      // console.log("Selected printer:", printer);
      const photoUri = await savePhoto();
      await printPhoto(photoUri, printer);
      setPrintSettings((prev) => ({
        ...prev,
        printerUri: printer.url || "",
        printerName: printer.name || "",
        savedPhotoUri: photoUri,
        isPrinting: false,
      }));
    };

    if (printSettings.isPrinting) {
      handleSaveAndPrint();
    }
  }, [printSettings.isPrinting]);

  async function createPrintableImage(photoUri: string, overlayUri: string) {
    // Step 1: get the base image dimensions
    const targetWidth = 1800; // 6in * 300dpi
    const targetHeight = 1200; // 4in * 300dpi (landscape)

    // Step 2: start with a solid black base (blank PNG)
    // expo-image-manipulator doesn’t support “fill color,”
    // so we just start with a transparent base and overlay black via a rect.

    // Step 3: resize your photo proportionally to fit
    const resizedPhoto = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG },
    );

    return resizedPhoto.uri;
  }

  const savePhoto = async (): Promise<string> => {
    let photoUri = "";

    if (previewRef.current) {
      try {
        photoUri = await captureRef(previewRef.current, {
          format: "png",
          quality: 1,
          width: 1200,
          height: Math.round(1200 / PHOTO_FRAME_ASPECT_RATIO),
        });
        console.log("✅ Merged image saved:", photoUri);
      } catch (err) {
        console.error("❌ Capture error:", err);
      }
    }
    return photoUri;
  };

  const printPhoto = async (photoUri: string, printer: Print.Printer) => {
    // On iOS/android prints the given html. On web prints the HTML from the current page.
    console.log("printing...");
    await Print.printAsync({
      html: createPhotoPrintHtml(photoUri),
      width: 1200,
      height: 1800,
      margins: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      printerUrl: printer.url, // iOS only
    });
    // const { uri } = await Print.printToFileAsync({
    //   html,
    //   width: 1200,
    //   height: 1800,
    //   margins: {
    //     top: 0,
    //     left: 0,
    //     right: 0,
    //     bottom: 0,
    //   },
    // });
    // await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };

  // const selectPrinter = async () => {
  //   const printer = await Print.selectPrinterAsync(); // iOS only
  //   setSelectedPrinter(printer);
  // };

  return (
    <ScreenView>
      <ContainerView
        gradient
        style={{
          paddingHorizontal: Math.min(40, width * 0.06),
          paddingVertical: Math.min(48, height * 0.06),
          justifyContent: "space-between",
        }}
      >
        <ThemedText type="xxl" color="white" font="fredoka">
          Enjoy!
        </ThemedText>
        <View style={styles.previewArea} onLayout={onPreviewLayout}>
          {compositionWidth > 0 && (
            <View
              ref={previewRef}
              collapsable={false}
              style={[
                styles.previewContainer,
                {
                  width: compositionWidth,
                  aspectRatio: PHOTO_FRAME_ASPECT_RATIO,
                },
              ]}
            >
              <PhotoCard
                photoUriSet={photoUriSet}
                photoFrameSettings={photoFrameSettings}
              />
            </View>
          )}
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
                pathname: "./",
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
  capturedSlotImage: {
    position: "absolute",
  },
  takePictureOverlay: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
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
  previewArea: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 0,
    marginVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    position: "relative",
    overflow: "hidden",
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
