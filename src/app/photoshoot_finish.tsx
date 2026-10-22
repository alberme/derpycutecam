import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { shareAsync } from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
  PixelRatio,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";

import ThemedButton from "@/src/components/ThemedButton";
import ThemedText from "@/src/components/ThemedText";
import { ContainerView, ScreenView } from "@/src/components/view";
import {
  PHOTO_FRAME_ASPECT_RATIO,
  PHOTO_FRAME_HEIGHT,
  PHOTO_FRAME_WIDTH,
} from "@/src/constants/photo_frame_layout";
import { useLayoutSize } from "@/src/hooks/useLayoutSize";
import { usePhotoExport } from "@/src/hooks/usePhotoExport";
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
  const { addPrintBorder, exportView } = usePhotoExport();

  // saves photo card and sends print job
  useEffect(() => {
    const handleSaveAndPrint = async () => {
      const printer = {
        name: "Canon SELPHY CP1500",
        url: "ipps://CP15005dba73.local.:443/ipp/print",
      };

      const photoUri = await savePhoto();
      await printPhoto(photoUri, printer);
      // dev test function to save the photo card locally
      await sharePhoto(photoUri);
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

  const savePhoto = async (): Promise<string> => {
    let photoUri = "";
    let photoCardURI = "";

    if (previewRef.current) {
      // iOS multiplies dimensions by device scale.
      const captureScale = Platform.OS === "ios" ? PixelRatio.get() : 1;
      try {
        photoCardURI = await captureRef(previewRef.current, {
          format: "jpg",
          quality: 1,
          width: PHOTO_FRAME_WIDTH / captureScale,
          height: PHOTO_FRAME_HEIGHT / captureScale,
        });
        console.log("✅ Photocard saved:", photoUri);

        // add 12px white border around image to compensate the image overflow issue
        photoUri = await addPrintBorder(photoCardURI);
        /** implement qr code functionality here */
        releaseCapture(photoCardURI);
      } catch (err) {
        console.error("❌ Capture error:", err);
      }
    }
    return photoUri;
  };

  // a tester function that allows us to save the photo locally
  const sharePhoto = async (photoUri: string) => {
    await shareAsync(photoUri, {
      UTI: "public.jpeg",
      mimeType: "image/jpeg",
    });
  };

  /** TODO: 1. send POST request with photoCardURI payload to the printer server 2. await status from printer */
  const printPhoto = async (photoUri: string, printer: Print.Printer) => {
    console.log("printing...");
  };

  return (
    <ScreenView>
      {exportView}
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
});
