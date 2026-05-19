import { StyleSheet, Text, View } from "react-native";
import type { CardTemplateLayerMetadata } from "@world-cup-game/types";

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
          height: layer.height,
          left: layer.x,
          top: layer.y,
          width: layer.width
        }
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.84)",
    borderRadius: 999,
    justifyContent: "center",
    position: "absolute"
  },
  label: {
    color: "#3A2A05",
    fontSize: 16,
    fontWeight: "900"
  }
});
