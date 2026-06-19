import { StyleSheet, Text, View } from "react-native";
import { LOCKER_TIERS } from "@gogaffa/config";
import type { LockerProgress, LockerWallet } from "../types";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface BalanceCardProps {
  progress: LockerProgress;
  wallet: LockerWallet;
}

export function BalanceCard({ progress, wallet }: BalanceCardProps) {
  const tierConfig = LOCKER_TIERS.find((t) => t.id === progress.tier);
  const badgeColor = tierConfig?.badgeColor ?? colors.red;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.balanceCol}>
          <Text style={styles.label}>AVAILABLE CREDITS</Text>
          <Text style={styles.balance}>{wallet.balance.toLocaleString()}</Text>
          <Text style={styles.breakdown}>
            {wallet.lockerCredits.toLocaleString()} earned + {wallet.purchasedCredits.toLocaleString()} purchased
          </Text>
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
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    marginTop: 2
  },
  balanceCol: {
    flex: 1
  },
  breakdown: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  card: {
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginVertical: spacing.md,
    padding: spacing.lg
  },
  label: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  progressFill: {
    backgroundColor: colors.red,
    borderRadius: 999,
    height: "100%"
  },
  progressLabel: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.sm
  },
  progressTrack: {
    backgroundColor: opacity.ink12,
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
    color: colors.cream,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1
  },
  tierSub: {
    color: opacity.cream75,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  }
});
