import ThemedButton from "@/components/ThemedButton";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { StyleSheet} from "react-native";
import {Image} from 'expo-image';
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';


  return (

      <ThemedView style={{ flex: 1, backgroundColor: "black", alignItems: "center", flexDirection: "column", }}>
        <Image
          source={require('@/assets/images/logo.png')}
          placeholder={{blurhash}}
          contentFit="scale-down"
          style={styles.image}
          transition={1000}
        />
        <ThemedButton title="hoiiiiiiiiii" style={styles.button} variant="secondary" onPress={() => router.push("/")} />
      </ThemedView>

  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0553'
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
