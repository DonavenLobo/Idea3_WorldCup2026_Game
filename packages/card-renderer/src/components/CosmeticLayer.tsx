import { Image, StyleSheet } from "react-native";

export interface CosmeticLayerProps {
  imageUrl?: string;
}

export function CosmeticLayer({ imageUrl }: CosmeticLayerProps) {
  if (!imageUrl) {
    return null;
  }

  return <Image source={{ uri: imageUrl }} style={styles.overlay} />;
}

const styles = StyleSheet.create({
  overlay: {
    height: "100%",
    left: 0,
    position: "absolute",
    resizeMode: "stretch",
    top: 0,
    width: "100%"
  }
});
