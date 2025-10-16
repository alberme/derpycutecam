import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type TemplateType = 1 | 3 | 6;

interface PhotoTemplateProps {
  type: TemplateType;
  images?: (string | ImageSourcePropType)[];
  onChange?: (images: (string | ImageSourcePropType)[]) => void;
}

export default function PhotoTemplate({
  type,
  images = [],
  onChange,
}: PhotoTemplateProps) {
  const [localImages, setLocalImages] =
    useState<(string | ImageSourcePropType)[]>(images);

  const handleImagePress = async (index: number) => {
    const options = ["Pick from Gallery", "Take Photo", "Cancel"];
    const cancelButtonIndex = 2;

    // On native devices, you could use ActionSheet, but for now let's just pick directly
    const pickFromGallery = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        updateImage(index, result.assets[0].uri);
      }
    };

    const takePhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Camera access is needed to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        updateImage(index, result.assets[0].uri);
      }
    };

    // Simple prompt using Alert for now
    Alert.alert("Add Photo", "Choose an option", [
      { text: "Pick from Gallery", onPress: pickFromGallery },
      { text: "Take Photo", onPress: takePhoto },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const updateImage = (index: number, uri: string) => {
    const updated = [...localImages];
    updated[index] = uri;
    setLocalImages(updated);
    onChange?.(updated);
  };

  const renderSlot = (index: number, style?: any) => {
    const source =
      typeof localImages[index] === "string"
        ? { uri: localImages[index] as string }
        : (localImages[index] as ImageSourcePropType);

    return (
      <TouchableOpacity
        key={index}
        style={[styles.slot, style]}
        activeOpacity={0.7}
        onPress={() => handleImagePress(index)}
      >
        {source ? (
          <Image source={source} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSlots = () => {
    switch (type) {
      case 1:
        return renderSlot(0, styles.single);
      case 3:
        return (
          <View style={styles.grid3}>
            <View style={styles.row}>
              {renderSlot(0, styles.half)}
              {renderSlot(1, styles.half)}
            </View>
            {renderSlot(2, styles.full)}
          </View>
        );
      case 6:
        return (
          <View style={styles.grid6}>
            {Array.from({ length: 6 }).map((_, i) => renderSlot(i))}
          </View>
        );
    }
  };

  return <View style={styles.template}>{renderSlots()}</View>;
}

const styles = StyleSheet.create({
  template: {
    backgroundColor: "#f9a8d4",
    borderRadius: 12,
    padding: 8,
    aspectRatio: 3 / 4,
    width: 120,
    justifyContent: "center",
  },
  slot: {
    backgroundColor: "white",
    borderRadius: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#fce7f3",
  },
  single: {
    width: "100%",
    height: "100%",
  },
  grid3: {
    flex: 1,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  half: {
    width: "48%",
    aspectRatio: 1,
  },
  full: {
    width: "100%",
    aspectRatio: 2,
  },
  grid6: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
    gap: 6,
    flex: 1,
  },
});
