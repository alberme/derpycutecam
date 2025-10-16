import ContainerView from "@/components/ContainerView";
import ScreenView from "@/components/ScreenView";
import ThemedButton from "@/components/ThemedButton";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

  return (
    <ScreenView>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={styles.pinkBar} />
        <ContainerView>
          <Image
            source={require("@/assets/images/logo.png")}
            // placeholder={{ blurhash }}
            contentFit="scale-down"
            style={styles.image}
            transition={1000}
          />
          <ThemedButton
            title="hoiiiiiiiiii"
            variant="secondary"
            onPress={() => router.push("/select_frame")}
          />
        </ContainerView>
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pinkBar: {
    width: 24,
    position: "absolute",
    left: 40,
    top: 0,
    bottom: 0,
    height: "100%",
    backgroundColor: "#FFCEEE",
    zIndex: 100,
  },
  image: {
    width: "50%",
    height: "50%",
    minWidth: 250,
    maxHeight: 250,
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
