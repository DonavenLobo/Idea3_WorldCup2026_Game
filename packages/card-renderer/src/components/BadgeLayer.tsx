import { StyleSheet, Text, View } from "react-native";
import type { CardTemplateLayerMetadata } from "@world-cup-game/types";

const DEFAULT_BADGE_BACKGROUND = "rgba(255, 248, 234, 0.84)";
const DEFAULT_BADGE_COLOR = "#3A2A05";
const DEFAULT_BADGE_FONT_SIZE = 16;
const DEFAULT_BADGE_FONT_WEIGHT = "900";
const DEFAULT_BADGE_RADIUS = 999;

export interface BadgeLayerProps {
  label: string;
  layer?: CardTemplateLayerMetadata;
}

export function BadgeLayer({ label, layer }: BadgeLayerProps) {
  if (!layer) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: layer.backgroundColor ?? DEFAULT_BADGE_BACKGROUND,
          borderRadius: layer.borderRadius ?? DEFAULT_BADGE_RADIUS,
          height: layer.height,
          left: layer.x,
          top: layer.y,
          width: layer.width
        }
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: layer.color ?? DEFAULT_BADGE_COLOR,
            fontSize: layer.fontSize ?? DEFAULT_BADGE_FONT_SIZE,
            fontWeight: (layer.fontWeight ?? DEFAULT_BADGE_FONT_WEIGHT) as "900"
          }
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: DEFAULT_BADGE_BACKGROUND,
    borderRadius: DEFAULT_BADGE_RADIUS,
    justifyContent: "center",
    position: "absolute"
  },
  label: {
    color: DEFAULT_BADGE_COLOR,
    fontSize: DEFAULT_BADGE_FONT_SIZE,
    fontWeight: DEFAULT_BADGE_FONT_WEIGHT
  }
});
