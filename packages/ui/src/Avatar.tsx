import { Image, StyleSheet, View } from "react-native";

export interface AvatarProps {
  imageUrl?: string;
  size?: number;
}

export function Avatar({ imageUrl, size = 56 }: AvatarProps) {
  return (
    <View style={[styles.shell, { borderRadius: size / 2, height: size, width: size }]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%",
  },
  shell: {
    backgroundColor: "rgba(26, 26, 46, 0.08)",
    borderColor: "rgba(26, 26, 46, 0.15)",
    borderWidth: 2,
    overflow: "hidden",
  },
});
