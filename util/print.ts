import * as ImageManipulator from "expo-image-manipulator";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { Alert } from "react-native";

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
    { compress: 1, format: ImageManipulator.SaveFormat.PNG }
  );

  return resizedPhoto.uri;
}

export const printPhoto = async (photoUri: string, printer: Print.Printer) => {
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: 4in 6in;
          margin: 0;
          padding: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: black;
        }

        img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      </style>
    </head>
    <body>
      <img src="${photoUri}" />
    </body>
  </html>
  `;

  // lets try saving the photo locally and testing this out in browser
  // Use a small bleed so printed output can be edge-to-edge on printers
  // Note: some printers still force hardware margins; bleed reduces visible white lines
  // const BLEED_PX = 0; // pixels to extend beyond page (adjust as needed)

  // const html = `
  //     <!doctype html>
  //     <html>
  //       <head>
  //         <meta charset="utf-8">
  //         <meta name="viewport" content="width=device-width, initial-scale=1" />
  //         <style>
  //           /* Request no margins on the generated PDF */
  //           @page { size: 4in 6in; margin: 0; }

  //           html, body {
  //             width: 100%;
  //             height: 100%;
  //             margin: 0;
  //             padding: 0;
  //             background: transparent;
  //           }

  //           /* Make the image fill the page exactly and remove any gaps */
  //           img {
  //             display: block;
  //             /* extend the image slightly beyond the page to create a bleed */
  //             width: calc(100% + ${BLEED_PX}px);
  //             height: calc(100% + ${BLEED_PX}px);
  //             margin: -${Math.floor(BLEED_PX / 2)}px 0 0 -${Math.floor(
  //   BLEED_PX / 2
  // )}px;
  //             object-fit: cover; /* cover avoids white gaps */
  //             padding: 0;
  //             -webkit-print-color-adjust: exact;
  //           }
  //         </style>
  //       </head>
  //       <body>
  //         <img src="${photoUri}" />
  //       </body>
  //     </html>
  //   `;

  // On iOS/Android prints the given html. On web prints the HTML from the current page.
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      width: 1200,
      height: 1800,
      margins: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    });
    await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    Alert.alert("Print", `Print with ${printer.name}?`, [
      {
        text: "Yes",
        onPress: async () => {
          await Print.printAsync({
            printerUrl: printer.url,
            uri,
            margins: {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          });
        },
      },
      {
        text: "No",
        style: "cancel",
        onPress: () => {
          console.log("Print cancelled");
        },
      },
    ]);
  } catch (error) {
    console.error(
      `printPhoto error: ${error instanceof Error ? error.message : error}`
    );
  }
};
