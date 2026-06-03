import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CosmeticItem } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface CosmeticItemCardProps {
  item: CosmeticItem;
  isOwned: boolean;
  isActive: boolean;
  canRedeem: boolean;
  onPress: () => void;
}

export function CosmeticItemCard({
  item,
  isOwned,
  isActive,
  canRedeem,
  onPress
}: CosmeticItemCardProps) {
  const locked = !isOwned && !canRedeem;

  return (
    <Pressable
      style={[
        styles.card,
        isOwned ? styles.cardOwned : null,
        isActive ? styles.cardActive : null,
        locked ? styles.cardLocked : null
      ]}
      onPress={onPress}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      {isActive ? (
        <View style={styles.usingPill}>
          <Text style={styles.usingPillText}>USING</Text>
        </View>
      ) : isOwned ? (
        <View style={styles.usePill}>
          <Text style={styles.usePillText}>USE</Text>
        </View>
      ) : locked ? (
        <Text style={styles.locked}>
          🔒 {item.requiredTier ? `${item.requiredTier.toUpperCase()}+` : ""}
        </Text>
      ) : (
        <Text style={styles.price}>{item.priceCredits} CR</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm
  },
  cardActive: {
    backgroundColor: colors.gold,
    borderColor: colors.pitch
  },
  cardLocked: {
    opacity: 0.5
  },
  cardOwned: {
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold
  },
  emoji: {
    fontSize: 32,
    marginBottom: 2
  },
  locked: {
    color: "rgba(12, 59, 46, 0.55)",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2
  },
  name: {
    color: colors.pitch,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  price: {
    color: colors.pitch,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2
  },
  usePill: {
    backgroundColor: colors.pitch,
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  usePillText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  usingPill: {
    backgroundColor: colors.pitch,
    borderRadius: 999,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  usingPillText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5
  }
});
