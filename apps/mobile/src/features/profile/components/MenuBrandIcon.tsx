import { Image, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { colors } from "../../../theme/colors";
import { fontFamily } from "../../../theme/typography";

const ICON_SIZE = 24;

interface MenuBrandIconProps {
  glyph?: string;
  source?: ImageSourcePropType;
  tintColor?: string;
}

export function MenuBrandIcon({
  glyph,
  source,
  tintColor = colors.ink,
}: MenuBrandIconProps) {
  if (source) {
    return (
      <Image
        resizeMode="contain"
        source={source}
        style={[styles.image, { tintColor }]}
      />
    );
  }

  return (
    <View style={styles.glyphWrap}>
      <Text style={[styles.glyph, { color: tintColor }]}>{glyph ?? "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontFamily: fontFamily.caveatBold,
    fontSize: 18,
    lineHeight: 22,
  },
  glyphWrap: {
    alignItems: "center",
    height: ICON_SIZE,
    justifyContent: "center",
    width: ICON_SIZE,
  },
  image: {
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
});
