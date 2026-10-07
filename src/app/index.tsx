import ThemedButton from "@/src/components/ThemedButton";
import ThemedText from "@/src/components/ThemedText";
import { ContainerView, ScreenView } from "@/src/components/view";
import { Colors } from "@/src/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, useWindowDimensions, type ViewStyle } from "react-native";

import { Directory, Paths } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
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
    clearCacheDirectory();
  }, []);
  ``;
  return (
    <ScreenView>
      <LinearGradient
        colors={["#FFCEF0", "#121212"]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ flex: 1 }}
      >
        <ContainerView color="transparent">
          <ContainerView noFlex style={styles.header}>
            <ThemedText
              type="title"
              font="nixieOne"
              bold
              style={{
                color: Colors.text.darkPink,
              }}
            >
              derpycuteclub presents...
            </ThemedText>
          </ContainerView>
          <ContainerView color="transparent" style={{ gap: 24 }}>
            <Image
              source={require("@/assets/images/logo.png")}
              // placeholder={{ blurhash }}
              contentFit="contain"
              style={[styles.splashLogo]}
              transition={1000}
            />
            <ThemedText
              font="cedarvilleCursive"
              style={{
                fontSize: 40,
                color: Colors.text.pink,
                textAlign: "center",
                lineHeight: 60,
              }}
            >
              lets remember this night together!
            </ThemedText>

            <ThemedButton
              title="Start!"
              variant="secondary"
              // onPress={() => router.push("/select_frame")} - for now go directly to theme select
              onPress={() =>
                router.push({
                  pathname: "./select_theme",
                  params: { selectedFrameCount: 1 },
                })
              }
            />
          </ContainerView>
          <ContainerView noFlex color="transparent" style={[styles.footer]}>
            <ThemedText
              font="nixieOne"
              bold
              style={{
                color: Colors.text.darkPink,
                alignSelf: "center",
                fontSize: 24,
              }}
            >
              created by Albert Martinez 💓 Melinda Morales
            </ThemedText>
          </ContainerView>
        </ContainerView>
      </LinearGradient>
    </ScreenView>
  );
}

const headerFooterStyle: ViewStyle = {
  height: "6%",
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
};

const styles = StyleSheet.create({
  header: {
    ...headerFooterStyle,
    backgroundColor: Colors.background.pink,
  },
  footer: {
    ...headerFooterStyle,
  },
  splashLogo: {
    width: "100%",
    aspectRatio: 3780 / 1772,
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
