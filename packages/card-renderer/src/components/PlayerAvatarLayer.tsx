import { Image, StyleSheet } from "react-native";
import type { CardTemplateLayerMetadata } from "@gogaffa/types";

export interface PlayerAvatarLayerProps {
  imageUrl?: string;
  layer: CardTemplateLayerMetadata;
  onReady?: () => void;
}

export function PlayerAvatarLayer({ imageUrl, layer, onReady }: PlayerAvatarLayerProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <Image
      onLoadEnd={onReady}
      source={{ uri: imageUrl }}
      style={[
        styles.avatar,
        {
          height: layer.height,
          left: layer.x,
          resizeMode: layer.fit ?? "contain",
          top: layer.y,
          width: layer.width
        }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: "absolute"
  }
});
