import type { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import type { PlayerCardRenderTemplate } from "../types";
import { CARD_RENDERER_COLORS } from "../utils/colors";

export interface PlayerCardTemplateProps {
  template: PlayerCardRenderTemplate;
  children: ReactNode;
}

export function PlayerCardTemplate({ template, children }: PlayerCardTemplateProps) {
  const style = {
    aspectRatio: template.metadata.width / template.metadata.height
  };

  if (template.baseImageUrl) {
    return (
      <ImageBackground source={{ uri: template.baseImageUrl }} style={[styles.card, style]}>
        {children}
      </ImageBackground>
    );
  }

  return <View style={[styles.card, styles.fallback, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  fallback: {
    backgroundColor: CARD_RENDERER_COLORS.fallbackBackground,
    borderRadius: 32
  }
});
