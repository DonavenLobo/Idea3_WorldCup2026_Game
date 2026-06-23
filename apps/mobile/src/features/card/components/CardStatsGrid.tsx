import { CARD_STATS } from "@gogaffa/config";
import { StatBlock } from "@gogaffa/ui";
import type { CardStats } from "@gogaffa/types";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme/spacing";

export interface CardStatsGridProps {
  stats: CardStats;
}

export function CardStatsGrid({ stats }: CardStatsGridProps) {
  return (
    <View style={styles.grid}>
      {CARD_STATS.map((stat) => (
        <StatBlock key={stat.key} label={stat.label} style={styles.cell} value={stats[stat.key]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minWidth: 0,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
