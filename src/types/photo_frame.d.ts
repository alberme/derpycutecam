import type { Asset } from "expo-asset";
import type { ImageTransition } from "expo-image";
import type { ReactNode } from "react";
import type { ColorValue } from "react-native";

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
/** Animation settings for animating photo card  */
export interface PhotoCardTransition extends ImageTransition {
  /** Background color to fade out from */
  fadeFromColor?: ColorValue;
  /** Runs when a displayed photo finishes its fade; skipped if the animation is cancelled. */
  onAnimationFinish?: () => void;
}
export interface PhotoCardProps {
  photoUriSet: PhotoSnappedSet;
  photoFrameSettings: PhotoFrameSettings;
  /** The slot number that should display an active photo or view, such as a live camera preview. */
  activeSlot?: number;
  children?: ReactNode;
  /** Animate the photo at active slot their source loads or changes. */
  animationSettings?: PhotoCardTransition;
}
