import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CosmeticItem } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface CosmeticItemCardProps {
  item: CosmeticItem;
  isOwned: boolean;
  canRedeem: boolean;
  onPress: () => void;
}

export function CosmeticItemCard({
  item,
  isOwned,
  canRedeem,
  onPress
}: CosmeticItemCardProps) {
  const locked = !isOwned && !canRedeem;

  return (
    <Pressable
      style={[
        styles.card,
        isOwned ? styles.cardOwned : null,
        locked ? styles.cardLocked : null
      ]}
      disabled={isOwned || locked}
      onPress={onPress}
    >
      <View style={styles.mark}>
        <Text style={styles.markText}>{item.emoji}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      {isOwned ? (
        <Text style={styles.owned}>OWNED</Text>
      ) : locked ? (
        <Text style={styles.locked}>
          {item.requiredTier ? `${item.requiredTier.toUpperCase()}+` : "LOCKED"}
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
  cardLocked: {
    opacity: 0.5
  },
  cardOwned: {
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold
  },
  locked: {
    color: "rgba(12, 59, 46, 0.55)",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2
  },
  mark: {
    alignItems: "center",
    backgroundColor: "rgba(12, 59, 46, 0.08)",
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    marginBottom: 4,
    minWidth: 34,
    paddingHorizontal: spacing.xs
  },
  markText: {
    color: colors.pitch,
    fontSize: 13,
    fontWeight: "900"
  },
  name: {
    color: colors.pitch,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  owned: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2
  },
  price: {
    color: colors.pitch,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2
  }
});
