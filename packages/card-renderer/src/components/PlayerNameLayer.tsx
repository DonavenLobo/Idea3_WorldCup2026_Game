import { StyleSheet, Text } from "react-native";
import type { CardTemplateLayerMetadata } from "@world-cup-game/types";
import { clampText } from "../utils/fitText";
import { resolveLayerFontStyle } from "../utils/layerTextStyle";

export interface PlayerNameLayerProps {
  displayName: string;
  layer: CardTemplateLayerMetadata;
}

export function PlayerNameLayer({ displayName, layer }: PlayerNameLayerProps) {
  return (
    <Text
      numberOfLines={1}
      style={[
        styles.name,
        {
          color: layer.color,
          fontSize: layer.fontSize,
          height: layer.height,
          left: layer.x,
          textAlign: layer.align,
          top: layer.y,
          width: layer.width,
          ...resolveLayerFontStyle(layer),
        }
      ]}
    >
      {clampText(displayName.toUpperCase(), 16)}
    </Text>
  );
}

const styles = StyleSheet.create({
  name: {
    position: "absolute"
  }
});
