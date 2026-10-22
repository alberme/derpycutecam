import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { PixelRatio, Platform, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { PHOTO_FRAME_HEIGHT, PHOTO_FRAME_WIDTH } from "@/src/constants/photo_frame_layout";

type ExportRequest = {
  uri: string;
  resolve: (uri: string) => void;
  reject: (error: Error) => void;
};

/** Adds the printer margin to a captured image independently of preview layout. */
export function usePhotoExport() {
  const [request, setRequest] = useState<ExportRequest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const exportRef = useRef<View>(null);
  const pending = useRef<ExportRequest | null>(null);
  const scale = PixelRatio.get();
  const padding = 12;

  const addPrintBorder = useCallback((uri: string) => {
    if (pending.current) return Promise.reject(new Error("An export is already running."));
    return new Promise<string>((resolve, reject) => {
      const next = { uri, resolve, reject };
      pending.current = next;
      setLoaded(false);
      setLaidOut(false);
      setRequest(next);
    });
  }, []);

  useEffect(() => () => {
    pending.current?.reject(new Error("Photo export cancelled."));
    pending.current = null;
  }, []);

  useEffect(() => {
    if (!request || !loaded || !laidOut) return;
    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      try {
        const outputScale = Platform.OS === "ios" ? scale : 1;
        const uri = await captureRef(exportRef, {
          format: "jpg",
          quality: 1,
          width: PHOTO_FRAME_WIDTH / outputScale,
          height: PHOTO_FRAME_HEIGHT / outputScale,
          useRenderInContext: true,
        });
        if (!cancelled) request.resolve(uri);
      } catch (error) {
        if (!cancelled) request.reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        if (!cancelled) {
          pending.current = null;
          setRequest(null);
        }
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [request, loaded, laidOut, scale]);

  const exportView = request && (
    <View
      ref={exportRef}
      collapsable={false}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={() => setLaidOut(true)}
      style={{
        position: "absolute",
        left: -10000,
        top: 0,
        width: PHOTO_FRAME_WIDTH / scale,
        height: PHOTO_FRAME_HEIGHT / scale,
        backgroundColor: "#fff",
      }}
    >
      <Image
        source={{ uri: request.uri }}
        transition={0}
        contentFit="fill"
        onDisplay={() => setLoaded(true)}
        onError={({ error }) => {
          request.reject(new Error(error));
          pending.current = null;
          setRequest(null);
        }}
        style={{
          position: "absolute",
          left: padding / scale,
          top: padding / scale,
          width: (PHOTO_FRAME_WIDTH - 2 * padding) / scale,
          height: (PHOTO_FRAME_HEIGHT - 2 * padding) / scale,
        }}
      />
    </View>
  );

  return { addPrintBorder, exportView };
}
