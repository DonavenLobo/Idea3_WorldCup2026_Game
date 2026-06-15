import { Modal, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BrandButton } from "../../../components/brand/BrandButton";
import { Eyebrow } from "../../../components/brand/Eyebrow";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

export interface MilestoneUnlockModalProps {
  /** When set, the modal opens. Null hides it. */
  milestone: { atStreak: number; bonus: number } | null;
  /** Called when the user dismisses (Claim or hardware back). */
  onDismiss: () => void;
}

const CARD_MAX_WIDTH = 360;
const CARD_HORIZONTAL_MARGIN = 48;

/**
 * Celebration modal shown when a user crosses a daily-login streak milestone
 * (e.g., 7/14/30/60 days). Mount once at the root layout; pass the
 * milestoneHit payload from `useDailyLogin().lastResult` and clear it when
 * dismissed.
 */
export function MilestoneUnlockModal({ milestone, onDismiss }: MilestoneUnlockModalProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(CARD_MAX_WIDTH, screenWidth - CARD_HORIZONTAL_MARGIN);
  const visible = milestone !== null;
  const atStreak = milestone?.atStreak ?? 0;
  const bonus = milestone?.bonus ?? 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { width: cardWidth }]}>
          <Eyebrow label="Milestone Unlocked" accent="red" />
          <Text style={styles.title}>{atStreak}-day streak!</Text>
          <Text style={styles.bonusValue}>+{bonus}</Text>
          <Text style={styles.bonusLabel}>Bonus Points</Text>
          <BrandButton label="Claim" onPress={onDismiss} style={styles.cta} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: opacity.ink60,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  bonusLabel: {
    ...typography.eyebrow,
    color: opacity.ink70,
    marginTop: spacing.xs,
  },
  bonusValue: {
    ...typography.displayLarge,
    color: colors.red,
    fontVariant: ["tabular-nums"],
    marginTop: spacing.lg,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  cta: {
    marginTop: spacing.xl,
  },
  title: {
    ...typography.titleScreen,
    color: colors.ink,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
