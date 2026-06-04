import { StyleSheet, Text, View } from "react-native";
import { flagForTeam } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function TeamLabel({ name, align }: { name: string; align: "left" | "right" }) {
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
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flag: {
    fontSize: 22
  },
  name: {
    color: colors.cream,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  placeholder: {
    backgroundColor: "rgba(255, 248, 234, 0.18)",
    borderRadius: 4,
    height: 16,
    width: 22
  },
  root: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm
  },
  rowReverse: {
    flexDirection: "row-reverse"
  }
});
