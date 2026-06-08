import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { opacity } from "../../theme/colors";
import { teamLogoSourceForCode, teamLogoSourceForName } from "./teamLogos";

interface TeamLogoProps {
  code?: string | null;
  name?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}

function TeamLogoComponent({ code, name, size, style }: TeamLogoProps) {
  const source = teamLogoSourceForCode(code) ?? teamLogoSourceForName(name);

  return (
    <View
      accessibilityLabel={name ?? code ?? "Team logo"}
      accessibilityRole="image"
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      {source ? (
        <Image
          resizeMode="contain"
          source={source}
          style={styles.image}
        />
      ) : (
        <Text style={[styles.fallback, { fontSize: Math.max(10, size * 0.38) }]}>
          {code?.slice(0, 3) ?? "TBD"}
        </Text>
      )}
    </View>
  );
}

export const TeamLogo = memo(
  TeamLogoComponent,
  (prev, next) =>
    prev.code === next.code
    && prev.name === next.name
    && prev.size === next.size
    && prev.style === next.style
);

const styles = StyleSheet.create({
  fallback: {
    color: opacity.ink55,
    fontWeight: "900",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  wrap: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
  },
});
