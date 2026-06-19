import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CosmeticItem } from "@gogaffa/config";
import { colors, opacity } from "../../../theme/colors";
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
      disabled={isOwned}
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
    borderColor: opacity.ink12,
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
    backgroundColor: opacity.red18,
    borderColor: colors.red
  },
  locked: {
    color: opacity.ink55,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  mark: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    marginBottom: 4,
    minWidth: 34,
    paddingHorizontal: spacing.xs
  },
  markText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  name: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  owned: {
    color: colors.red,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  price: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  }
});
