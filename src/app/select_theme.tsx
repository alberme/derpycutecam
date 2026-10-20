import ThemedButton from "@/src/components/ThemedButton";
import ThemedText from "@/src/components/ThemedText";
import { ContainerView, ScreenView } from "@/src/components/view";
import {
  PHOTO_FRAME_CARDS,
  PHOTO_FRAME_CARD_COLORS,
} from "@/src/constants/assets";
import { Colors } from "@/src/constants/theme";
import { useLayoutSize } from "@/src/hooks/useLayoutSize";
import type { PhotoFrameCount } from "@/src/types/photo_frame";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const TEMPLATE_COUNT = PHOTO_FRAME_CARD_COLORS.length;
const CAROUSEL_COLORS = [
  PHOTO_FRAME_CARD_COLORS[TEMPLATE_COUNT - 1],
  ...PHOTO_FRAME_CARD_COLORS,
  PHOTO_FRAME_CARD_COLORS[0],
];
const templateIndexForPage = (page: number) =>
  (((page - 1) % TEMPLATE_COUNT) + TEMPLATE_COUNT) % TEMPLATE_COUNT;

export default function SelectTheme() {
  const { selectedFrameCount } = useLocalSearchParams<{
    selectedFrameCount: string;
  }>();
  const templates =
    PHOTO_FRAME_CARDS[Number(selectedFrameCount) as PhotoFrameCount];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const indexRef = useRef(0);
  const pageRef = useRef(1);
  const carouselRef = useRef<ScrollView>(null);
  const { size, onLayout } = useLayoutSize();
  const router = useRouter();
  const pageWidth = size.width;
  const imageWidth = Math.min(pageWidth, size.height * (2 / 3));

  // Sentinel slides at either end allow swipes to continue in both directions.
  const recenter = () => {
    const page = templateIndexForPage(pageRef.current) + 1;
    pageRef.current = page;
    carouselRef.current?.scrollTo({ x: page * pageWidth, animated: false });
  };

  useEffect(() => {
    pageRef.current = indexRef.current + 1;
    carouselRef.current?.scrollTo({
      x: pageRef.current * pageWidth,
      animated: false,
    });
  }, [pageWidth]);

  const moveBy = (direction: number) => {
    // Normalize an end clone first, including when arrows are tapped rapidly.
    if (pageRef.current === 0 || pageRef.current === TEMPLATE_COUNT + 1)
      recenter();
    const nextPage = pageRef.current + direction;
    pageRef.current = nextPage;
    indexRef.current = templateIndexForPage(nextPage);
    setSelectedIndex(indexRef.current);
    carouselRef.current?.scrollTo({ x: nextPage * pageWidth, animated: true });
  };

  return (
    <ScreenView>
      <ContainerView gradient style={styles.screen}>
        <ThemedText font="fredoka" type="xxl" style={styles.heading}>
          select a template!
        </ThemedText>
        <View style={styles.carouselRow}>
          <TouchableOpacity
            style={styles.arrowButton}
            accessibilityRole="button"
            accessibilityLabel="Previous template"
            onPress={() => moveBy(-1)}
          >
            <ThemedText color="pink" type="xxl">
              ◀
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.viewport} onLayout={onLayout}>
            {pageWidth > 0 && size.height > 0 && (
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={16}
                style={styles.carousel}
                contentOffset={{ x: pageWidth, y: 0 }}
                onContentSizeChange={() => {
                  carouselRef.current?.scrollTo({
                    x: pageRef.current * pageWidth,
                    animated: false,
                  });
                }}
                onMomentumScrollEnd={({ nativeEvent }) => {
                  pageRef.current = Math.round(
                    nativeEvent.contentOffset.x / pageWidth,
                  );
                  recenter();
                }}
                onScroll={({ nativeEvent }) => {
                  const page = Math.max(
                    0,
                    Math.min(
                      TEMPLATE_COUNT + 1,
                      Math.round(nativeEvent.contentOffset.x / pageWidth),
                    ),
                  );
                  pageRef.current = page;
                  const index = templateIndexForPage(page);
                  indexRef.current = index;
                  setSelectedIndex(index);
                }}
              >
                {CAROUSEL_COLORS.map((color, page) => (
                  <View
                    key={`${color}-${page}`}
                    style={[styles.page, { width: pageWidth }]}
                  >
                    <Image
                      source={templates[color]}
                      style={{ width: imageWidth, aspectRatio: 2 / 3 }}
                      contentFit="contain"
                      accessibilityLabel={`${color} frame template`}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          <TouchableOpacity
            style={styles.arrowButton}
            accessibilityRole="button"
            accessibilityLabel="Next template"
            onPress={() => moveBy(1)}
          >
            <ThemedText color="pink" type="xxl">
              ▶
            </ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedButton
          title="Gooo!"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "./camera_screen",
              params: {
                selectedFrameCount,
                selectedTemplateColor: PHOTO_FRAME_CARD_COLORS[selectedIndex],
              },
            })
          }
        />
      </ContainerView>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 24,
    paddingVertical: 24,
  },
  heading: {
    textAlign: "center",
    paddingHorizontal: 16,
  },
  carouselRow: {
    flex: 1,
    minHeight: 0,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  arrowButton: {
    width: 48,
    minHeight: 48,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.background.pink,
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  arrowText: {
    fontSize: 32,
    lineHeight: 44,
    textAlign: "center",
  },
  viewport: {
    flex: 1,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  carousel: {
    flex: 1,
  },
  page: {
    alignItems: "center",
    justifyContent: "center",
  },
});
