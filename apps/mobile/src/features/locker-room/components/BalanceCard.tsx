import { StyleSheet, Text, View } from "react-native";
import { LOCKER_TIERS } from "@world-cup-game/config";
import type { LockerProgress } from "../types";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface BalanceCardProps {
  balance: number;
  progress: LockerProgress;
}

export function BalanceCard({ balance, progress }: BalanceCardProps) {
  const tierConfig = LOCKER_TIERS.find((t) => t.id === progress.tier);
  const badgeColor = tierConfig?.badgeColor ?? colors.gold;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.balanceCol}>
          <Text style={styles.label}>YOUR CREDITS</Text>
          <Text style={styles.balance}>{balance.toLocaleString()}</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.tierLabel}>{tierConfig?.label.toUpperCase() ?? "BRONZE"}</Text>
          <Text style={styles.tierSub}>+{tierConfig?.ovrBonus ?? 0} OVR</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress.progressPercent * 100}%` }]} />
      </View>

      <Text style={styles.progressLabel}>
        {progress.nextTierLabel
          ? `${progress.ownedToNextTier} more items to ${progress.nextTierLabel}`
          : "Max tier reached"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: {
    color: colors.cream,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 2
  },
  balanceCol: {
    flex: 1
  },
  card: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    marginVertical: spacing.md,
    padding: spacing.lg
  },
  label: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  progressFill: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    height: "100%"
  },
  progressLabel: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.sm
  },
  progressTrack: {
    backgroundColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: 999,
    height: 8,
    marginTop: spacing.md,
    overflow: "hidden"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  tierBadge: {
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  tierLabel: {
    color: colors.pitch,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1
  },
  tierSub: {
    color: "rgba(12, 59, 46, 0.7)",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2
  }
});
