import type { PhotoFrameColor, PhotoFrameCount } from "@/types/template";
import { Asset } from "expo-asset";
// Define valid template keys and color variants

// Preload static requires (these must remain static for Metro)
const PHOTO_FRAME_MODULES: Record<
  PhotoFrameCount,
  Record<PhotoFrameColor, any>
> = {
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

// Build typed Asset map
export const PHOTO_FRAME_IMAGES: Record<PhotoFrameCount, Asset[]> = {
  1: [],
  3: [],
  6: [],
};

for (const count of [1, 3, 6] as const) {
  PHOTO_FRAME_IMAGES[count] = (
    Object.values(PHOTO_FRAME_MODULES[count]) as any[]
  ).map((mod) => Asset.fromModule(mod));
}
