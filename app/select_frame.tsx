import ContainerView from "@/components/ContainerView";
import Grid from "@/components/Grid";
import ScreenView from "@/components/ScreenView";
import Text from "@/components/ThemedText";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import PhotoTemplateCard, {
  type TemplateType,
} from "@/components/PhotoTemplateCard";
import ThemedButton from "@/components/ThemedButton";

export default function Select() {
  const router = useRouter();
  const templateTypes: TemplateType[] = [1, 3, 6];
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const handleCardPress = (type: TemplateType) => {
    setSelectedTemplateIndex(type);
  };

  return (
    <ScreenView>
      <ContainerView style={{ gap: 80 }}>
        <Text type="title">Select How Many Pictures!</Text>
        <Grid columns={3} gap={60} style={{ flexDirection: "row" }}>
          {templateTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={selectedTemplateIndex === type && styles.selectedTemplate}
              activeOpacity={0.8}
              onPress={() => handleCardPress(type)}
            >
              <PhotoTemplateCard key={type} type={type} />
            </TouchableOpacity>
          ))}
          {/* <PhotoTemplateCard type={6} /> */}
        </Grid>
        <ThemedButton
          title="Gooo!"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/select_template",
              params: { type: selectedTemplateIndex },
            })
          }
        />
      </ContainerView>
    </ScreenView>
  );
}

// const Card = () => {
//   return <View style={styles.card}></View>;
// };

const styles = StyleSheet.create({
  selectedTemplate: {
    borderColor: "white",
    borderWidth: 10,
    borderRadius: 30,
  },
  // card: {
  //   backgroundColor: Colors.pink,
  //   width: 200,
  //   height: 300,
  //   borderWidth: 1,
  //   borderRadius: 20,
  //   paddingVertical: 20,
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
});
