import type { ReactNode } from "react";
import { useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import type { PlayerCardRenderTemplate } from "../types";
import { CARD_RENDERER_COLORS } from "../utils/colors";

export interface PlayerCardTemplateProps {
  template: PlayerCardRenderTemplate;
  children: ReactNode;
}

export function PlayerCardTemplate({ template, children }: PlayerCardTemplateProps) {
  const [renderedWidth, setRenderedWidth] = useState(0);
  const scale = renderedWidth > 0 ? renderedWidth / template.metadata.width : 1;
  const style = {
    height: "100%" as const,
    width: "100%" as const,
  };
  const overlayStyle = {
    height: template.metadata.height,
    left: (scale - 1) * template.metadata.width / 2,
    top: (scale - 1) * template.metadata.height / 2,
    transform: [{ scale }],
    width: template.metadata.width
  };
  const source = template.baseImageSource ?? (
    template.baseImageUrl ? { uri: template.baseImageUrl } : null
  );
  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setRenderedWidth((currentWidth) => (
      Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth
    ));
  };
  const overlay = renderedWidth > 0 ? (
    <View pointerEvents="none" style={[styles.overlayCanvas, overlayStyle]}>
      {children}
    </View>
  ) : null;

  const transparentCanvas = template.metadata.transparentCanvas === true;
  const canvasBlendMode = template.metadata.canvasBlendMode;

  if (source) {
    return (
      <ImageBackground
        source={source}
        resizeMode="cover"
        style={[
          styles.card,
          transparentCanvas ? styles.transparentCard : styles.clippedCard,
          canvasBlendMode ? { mixBlendMode: canvasBlendMode } : null,
          style,
        ]}
        onLayout={handleLayout}
      >
        {overlay}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.card, styles.fallback, style]} onLayout={handleLayout}>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    width: "100%",
  },
  clippedCard: {
    overflow: "hidden",
  },
  transparentCard: {
    backgroundColor: "transparent",
    overflow: "visible",
  },
  fallback: {
    backgroundColor: CARD_RENDERER_COLORS.fallbackBackground,
    borderRadius: 32
  },
  overlayCanvas: {
    position: "absolute"
  }
});
