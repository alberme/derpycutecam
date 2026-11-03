import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const [isPreparing, setIsPreparing] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const preparing = useRef(false);
  const active = useRef(true);
  const preparedPrint = useRef<{ photoUri: string; requestId: string } | null>(null);

  const previewRef = useRef(null);
  const { addPrintBorder, exportView } = usePhotoExport();

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const savePhoto = async (): Promise<string> => {
    if (!previewRef.current) {
      throw new Error("Your photo is still loading. Please try again in a moment.");
    }
    const captureScale = Platform.OS === "ios" ? PixelRatio.get() : 1;
    const photoCardUri = await captureRef(previewRef.current, {
      format: "jpg",
      quality: 1,
      width: PHOTO_FRAME_WIDTH / captureScale,
      height: PHOTO_FRAME_HEIGHT / captureScale,
    });
    // Keep the 12px margin used for this printer's photo overflow.
    try {
      if (!active.current) throw new Error("Photo export cancelled.");
      const photoUri = await addPrintBorder(photoCardUri);
      if (!photoUri) throw new Error("Unable to prepare your photo. Please try again.");
      return photoUri;
    } finally {
      releaseCapture(photoCardUri);
    }
  };

  const handlePrint = async () => {
    // A synchronous guard also blocks taps before React updates the button.
    if (preparing.current) return;
    preparing.current = true;
    setIsPreparing(true);
    setPrintError(null);
    try {
      preparedPrint.current ??= {
        photoUri: await savePhoto(),
        requestId: Crypto.randomUUID(),
      };
      // Returning to this preview resumes the same intended print.
      if (active.current) {
        router.navigate({ pathname: "/print", params: preparedPrint.current });
      }
    } catch (error) {
      if (active.current) {
        setPrintError(error instanceof Error ? error.message : "Unable to prepare your photo.");
      }
    } finally {
      preparing.current = false;
      if (active.current) setIsPreparing(false);
    }
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
        {printError && (
          <ThemedText accessibilityRole="alert" style={{ textAlign: "center", marginBottom: 16 }}>
            {printError}
          </ThemedText>
        )}
        <View style={styles.actions}>
          <ThemedButton
            title="Print!"
            variant="secondary"
            onPress={handlePrint}
            loading={isPreparing}
            disabled={compositionWidth <= 0}
          />
          <ThemedButton
            title="Start Over!"
            variant="secondary"
            onPress={() => router.dismissTo("/")}
            disabled={isPreparing}
          />
        </View>
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
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
});
