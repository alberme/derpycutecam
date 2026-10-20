import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/** Measures a view's size, updating only when its dimensions change. */
export function useLayoutSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  return { size, onLayout };
}
