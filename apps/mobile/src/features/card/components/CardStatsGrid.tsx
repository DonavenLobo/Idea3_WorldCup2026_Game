import { CARD_STATS } from "@world-cup-game/config";
import { StatBlock } from "@world-cup-game/ui";
import type { CardStats } from "@world-cup-game/types";
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
