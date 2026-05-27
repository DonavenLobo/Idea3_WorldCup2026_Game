import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NationConfig } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface NationRowProps {
  nation: NationConfig;
  selected: boolean;
  onPress: () => void;
}

export function NationRow({ nation, selected, onPress }: NationRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        selected ? { borderColor: nation.primaryColor, backgroundColor: colors.cream } : null
      ]}
    >
      <Text style={styles.flag}>{nation.flagEmoji}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {nation.name}
      </Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    color: colors.pitch,
    fontSize: 20,
    fontWeight: "900"
  },
  confederation: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 13
  },
  flag: {
    fontSize: 32
  },
  name: {
    color: colors.pitch,
    flex: 1,
    fontSize: 17,
    fontWeight: "800"
  },
  row: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  text: {
    flex: 1,
    gap: 2
  }
});
