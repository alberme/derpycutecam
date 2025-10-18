import type { PhotoFrameColor, PhotoFrameCount } from "./photo_frame";

export type AppRouterParams = {
  "/": undefined;
  "/select_frame": undefined;
  "/select_template": { frameCount: PhotoFrameCount };
  "/camera_screen": {
    frameCount: PhotoFrameCount;
    frameColor: PhotoFrameColor;
  };
};
