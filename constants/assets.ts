import type {
  PhotoFrameColor,
  PhotoFrameCount,
  PhotoTemplateByColor,
} from "@/types/photo_frame";
import { Asset } from "expo-asset";

export const PHOTO_FRAME_COUNTS: PhotoFrameCount[] = [1, 3, 6];
export const PHOTO_FRAME_COLORS: PhotoFrameColor[] = [
  "black",
  "purple",
  "green",
];

const PHOTO_FRAME_MODULES = {
  1: {
    black: require("@/assets/images/templates/1/black_1.png"),
    purple: require("@/assets/images/templates/1/purple_1.png"),
    green: require("@/assets/images/templates/1/green_1.png"),
  },
  3: {
    black: require("@/assets/images/templates/3/black_3.png"),
    purple: require("@/assets/images/templates/3/purple_3.png"),
    green: require("@/assets/images/templates/3/green_3.png"),
  },
  6: {
    black: require("@/assets/images/templates/6/black_6.png"),
    purple: require("@/assets/images/templates/6/purple_6.png"),
    green: require("@/assets/images/templates/6/green_6.png"),
  },
};

export const PHOTO_FRAME_IMAGES = Object.fromEntries(
  Object.entries(PHOTO_FRAME_MODULES).map(([count, colorMap]) => [
    Number(count),
    Object.fromEntries(
      Object.entries(colorMap).map(([color, mod]) => [
        color,
        Asset.fromModule(mod),
      ])
    ),
  ])
) as Record<PhotoFrameCount, PhotoTemplateByColor>;
