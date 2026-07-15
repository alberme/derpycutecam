import type { Asset } from "expo-asset";

export type PhotoFrameCount = 1 | 3 | 6;
export type PhotoFrameColor = "black" | "purple" | "green";
export type PhotoTemplateByColor = Record<PhotoFrameColor, Asset>;

export type PhotoFrameSettings = {
  frameOverlay: Asset;
  selectedFrameCount: number;
  selectedTemplateColor: PhotoFrameColor;
  totalFramePhotos: number;
};
export type PhotoSnappedSet = Record<number, string>;
