import { StyleSheet, Text, View } from "react-native";
import { formatTeamName } from "@world-cup-game/config";
import { TeamLogo, teamLogoSourceForName } from "../../../components/team";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function TeamLabel({ name, align }: { name: string; align: "left" | "right" }) {
  const displayName = formatTeamName(name);
  const logo = teamLogoSourceForName(name);
  const marker = logo ? (
    <TeamLogo name={name} size={24} />
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
