import ThemedButton from "@/components/ThemedButton";
import { ContainerView, ScreenView } from "@/components/view";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import { Directory, Paths } from "expo-file-system";
import { useEffect } from "react";

async function clearCacheDirectory() {
  const cacheDir = new Directory(Paths.cache);

  try {
    const entries = await cacheDir.list(); // list all files/folders

    for (const entry of entries) {
      // Each entry is a File or Directory object
      await entry.delete();
    }

    console.log(`✅ Cleared ${entries.length} entries from cache.`);
  } catch (err) {
    console.error("Error clearing cache directory:", err);
  }
}

export default function Index() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

  useEffect(() => {
    if (Platform.OS !== "web") {
      clearCacheDirectory();
    }
  }, []);
  return (
    <ScreenView>
      <ContainerView>
        <View style={styles.pinkBar} />
        <ContainerView>
          <Image
            source={require("@/assets/images/logo.png")}
            // placeholder={{ blurhash }}
            contentFit="scale-down"
            style={[styles.image, { height: windowWidth <= 375 ? 200 : 450 }]}
            transition={1000}
          />
          <ThemedButton
            title="Start!"
            variant="secondary"
            // onPress={() => router.push("/select_frame")} - for now go directly to template select
            onPress={() =>
              router.push({
                pathname: "/select_template",
                params: { selectedFrameCount: 1 },
              })
            }
          />
        </ContainerView>
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  pinkBar: {
    width: 24,
    position: "absolute",
    left: 40,
    top: 0,
    bottom: 0,
    height: "100%",
    backgroundColor: Colors.background.pink,
    zIndex: 100,
  },
  image: {
    height: "100%",
    aspectRatio: 1,
    // maxWidth: ,
    // maxHeight: 200,
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 24,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  buttonPressed: {
    backgroundColor: "#4338CA", // darker shade when pressed
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
