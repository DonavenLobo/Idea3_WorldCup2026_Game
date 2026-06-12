import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { opacity } from "../../theme/colors";
import { teamFlagForCode, teamFlagForName } from "./teamFlags";

interface TeamLogoProps {
  code?: string | null;
  name?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}

function TeamLogoComponent({ code, name, size, style }: TeamLogoProps) {
  const Flag = teamFlagForCode(code) ?? teamFlagForName(name);
  const flagHeight = Math.max(1, Math.round(size * 0.75));

  return (
    <View
      accessibilityLabel={`${name ?? code ?? "Team"} flag`}
      accessibilityRole="image"
      style={[styles.wrap, { height: size, width: size }, style]}
    >
      {Flag ? (
        <Flag
          height={flagHeight}
          preserveAspectRatio="xMidYMid meet"
          width={size}
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
  wrap: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
  },
});
