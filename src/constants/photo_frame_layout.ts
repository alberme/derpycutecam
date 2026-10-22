// the estimated dimensions for 100mm 148mm photo card at 300dpi
export const PHOTO_FRAME_WIDTH = 1181;
export const PHOTO_FRAME_HEIGHT = 1748;
export const PHOTO_FRAME_ASPECT_RATIO = PHOTO_FRAME_WIDTH / PHOTO_FRAME_HEIGHT;

// Bounds cover the transparent openings in the three-slot (1024 × 1533)
// and six-slot (1200 × 1800) templates,
// with a small overlap beneath the opaque edges to avoid rounding gaps.
// Keep the live preview and finished composition aligned.
export const PHOTO_SLOT_BOUNDS = {
  "1": [{ left: "0%", top: "0%", width: "100%", height: "100%" }],
  "3": [
    { left: "4.4%", top: "8.0%", width: "43.3%", height: "40.7%" },
    { left: "52.2%", top: "8.0%", width: "43.3%", height: "40.7%" },
    { left: "4.6%", top: "52.0%", width: "90.6%", height: "26.6%" },
  ],
  "6": [
    { left: "3.7%", top: "3.2%", width: "46.1%", height: "25.3%" },
    { left: "50.4%", top: "3.2%", width: "46.2%", height: "25.3%" },
    { left: "3.7%", top: "30.4%", width: "46.1%", height: "26.3%" },
    { left: "50.4%", top: "30.4%", width: "46.2%", height: "26.3%" },
    { left: "3.5%", top: "57.8%", width: "46.2%", height: "26.6%" },
    { left: "50.3%", top: "57.8%", width: "46.3%", height: "26.6%" },
  ],
} as const;

export const createPhotoPrintHtml = (photoUri: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page {
          size: 100mm 148mm;
          margin: 0;
        }

        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill;
        }
      </style>
    </head>
    <body>
      <img src="${photoUri}" />
    </body>
  </html>
`;
};

// const oldhtml = `<html><body><img src="${photoUri}" style="width:100%;height:auto;"/></body></html>`
// const html = `
// <html>
//   <head>
//   <meta charset="utf-8">
//   <style>
//     @page {
//       size: 4in 6in;
//       margin: 0;
//       padding: 0;
//     }

//     html, body {
//       margin: 0;
//       padding: 0;
//     }

//     img {
//       width: 100%;
//       height: auto;
//     }
//   </style>
//   </head>
//   <body>
//     <img src="${photoUri}" />
//   </body>
// </html>
// `;
