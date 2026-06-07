import { StyleSheet, Text, View } from "react-native";
import { flagForTeam, formatTeamName } from "@world-cup-game/config";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function TeamLabel({ name, align }: { name: string; align: "left" | "right" }) {
  const displayName = formatTeamName(name);
  const flag = flagForTeam(name);
  const marker = flag ? (
    <Text style={styles.flag}>{flag}</Text>
  ) : (
    <View style={styles.placeholder} />
  );

  return (
    <View style={[styles.root, align === "right" ? styles.rowReverse : null]}>
      {marker}
      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flag: {
    flexShrink: 0,
    fontSize: 20,
  },
  name: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 0,
  },
  placeholder: {
    backgroundColor: opacity.ink15,
    borderRadius: 4,
    flexShrink: 0,
    height: 16,
    width: 20,
  },
  root: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 0,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
});
