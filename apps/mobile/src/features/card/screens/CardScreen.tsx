import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CREDIT_PACKS,
  LOCKER_TIERS
} from "@world-cup-game/config";
import type { CosmeticCategory, CreditPack } from "@world-cup-game/config";
import type { PlayerCard as PlayerCardData } from "@world-cup-game/types";
import { BrandButton, Eyebrow } from "../../../components/brand";
import { Screen } from "../../../components/layout";
import { RenderedPlayerCard } from "../components/RenderedPlayerCard";
import {
  BalanceCard,
  CosmeticItemCard,
  CreditPackButton,
  useLockerRoom
} from "../../locker-room";
import type { LockerItem, LockerProgress, LockerWallet } from "../../locker-room";
import { useCurrentUserCard } from "../hooks/useCurrentUserCard";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { getErrorMessage } from "../../../utils/errors";

type CardSubTab = "card" | "locker";

const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  frame: "Card Frames",
  badge: "Badges",
  background: "Backgrounds"
};

const CATEGORY_ORDER: CosmeticCategory[] = ["frame", "badge", "background"];

export function CardScreen() {
  const { card, error: cardError, isLoading: isCardLoading } = useCurrentUserCard();
  const {
    items,
    wallet,
    progress,
    isLoading: isLockerLoading,
    error: lockerError,
    isOwned,
    canRedeem,
    redeem
  } = useLockerRoom();
  const [subTab, setSubTab] = useState<CardSubTab>("card");
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const grouped = useMemo(() => {
    const map: Record<CosmeticCategory, LockerItem[]> = {
      frame: [],
      badge: [],
      background: []
    };
    for (const item of items) {
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  const handleRedeem = (item: LockerItem) => {
    if (isOwned(item.id)) {
      return;
    }
    if (!canRedeem(item.id)) {
      // Locked by tier requirement — explain how to unlock instead of doing nothing.
      const tierConfig = item.requiredTier
        ? LOCKER_TIERS.find((tier) => tier.id === item.requiredTier)
        : null;
      const tierLabel = tierConfig?.label ?? item.requiredTier ?? "the next tier";
      const remaining = progress.ownedToNextTier ?? 0;
      const remainingHint =
        progress.nextTierLabel === tierLabel && remaining > 0
          ? `Own ${remaining} more cosmetic${remaining === 1 ? "" : "s"} to unlock ${tierLabel}.`
          : `Reach ${tierLabel} to unlock this item.`;
      Alert.alert(
        `${item.name} is locked`,
        `${remainingHint} Locker tier gates cosmetics — it does not affect competitive points.`,
        [{ text: "Got it" }]
      );
      return;
    }
    Alert.alert(
      `Redeem ${item.name}?`,
      `${item.priceCredits} credits will be deducted from your wallet.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: () => {
            void redeem(item.id)
              .then(() => {
                Alert.alert("Unlocked!", `${item.name} is now in your locker.`);
              })
              .catch((redeemError) => {
                Alert.alert(
                  "Could not redeem",
                  getErrorMessage(redeemError, "Try again in a moment.")
                );
              });
          }
        }
      ]
    );
  };

  const handleBuyPack = (pack: CreditPack) => {
    Alert.alert(
      "Payments not connected yet",
      `${pack.credits.toLocaleString()} credits for ${pack.priceUsd} is a display placeholder. We need verified App Store / Play Store IAP before adding credits.`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.subTabRow}>
        <Pressable
          style={[styles.subTab, subTab === "card" ? styles.subTabActive : null]}
          onPress={() => setSubTab("card")}
        >
          <Text style={[styles.subTabText, subTab === "card" ? styles.subTabTextActive : null]}>
            My Card
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, subTab === "locker" ? styles.subTabActive : null]}
          onPress={() => setSubTab("locker")}
        >
          <Text style={[styles.subTabText, subTab === "locker" ? styles.subTabTextActive : null]}>
            Locker Room
          </Text>
        </Pressable>
      </View>

      <Screen
        scroll
        ref={scrollRef}
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.content}
      >
        {subTab === "card" ? (
          <MyCardPanel
            card={card}
            error={cardError}
            isLoading={isCardLoading}
            progress={progress}
            onOpenLocker={() => setSubTab("locker")}
          />
        ) : (
          <LockerRoomPanel
            error={lockerError}
            grouped={grouped}
            isLoading={isLockerLoading}
            isOwned={isOwned}
            canRedeem={canRedeem}
            onRedeem={handleRedeem}
            onBuyPack={handleBuyPack}
            progress={progress}
            wallet={wallet}
          />
        )}
      </Screen>
    </View>
  );
}

function MyCardPanel({
  card,
  error,
  isLoading,
  progress,
  onOpenLocker
}: {
  card: PlayerCardData | null;
  error: unknown;
  isLoading: boolean;
  progress: LockerProgress;
  onOpenLocker: () => void;
}) {
  const tierConfig = LOCKER_TIERS.find((tier) => tier.id === progress.tier);

  return (
    <View>
      <View style={styles.eyebrowWrap}>
        <Eyebrow label="YOUR CARD" />
      </View>
      {isLoading ? (
        <Text style={styles.statusText}>Loading your card...</Text>
      ) : error ? (
        <Text style={styles.statusText}>
          {getErrorMessage(error, "Could not load your card.")}
        </Text>
      ) : card ? (
        <RenderedPlayerCard card={card} style={styles.playerCard} />
      ) : (
        <Text style={styles.statusText}>Create your card during onboarding to manage it here.</Text>
      )}

      <View style={styles.tierCard}>
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: tierConfig?.badgeColor ?? colors.red }
          ]}
        >
          <Text style={styles.tierBadgeText}>
            {tierConfig?.label.toUpperCase() ?? "BRONZE"}
          </Text>
        </View>
        <View style={styles.tierTextCol}>
          <Text style={styles.tierTitle}>Current locker tier</Text>
          <Text style={styles.tierStat}>
            +{tierConfig?.ovrBonus ?? 0} OVR status bonus. {progress.ownedCount} cosmetics owned.
          </Text>
          <Text style={styles.tierProgress}>
            {progress.nextTierLabel
              ? `${progress.ownedToNextTier} more to ${progress.nextTierLabel}`
              : "Max tier reached"}
          </Text>
        </View>
      </View>

      <BrandButton
        label="Open Locker Room ->"
        onPress={onOpenLocker}
        style={styles.lockerCta}
      />

      <Text style={styles.note}>
        Cards never downgrade. Paid cosmetics and status bonuses do not affect competitive points.
      </Text>
    </View>
  );
}

function LockerRoomPanel({
  error,
  grouped,
  isLoading,
  isOwned,
  canRedeem,
  onRedeem,
  onBuyPack,
  progress,
  wallet
}: {
  error: Error | null;
  grouped: Record<CosmeticCategory, LockerItem[]>;
  isLoading: boolean;
  isOwned: (id: string) => boolean;
  canRedeem: (id: string) => boolean;
  onRedeem: (item: LockerItem) => void;
  onBuyPack: (pack: CreditPack) => void;
  progress: LockerProgress;
  wallet: LockerWallet;
}) {
  return (
    <View>
      <BalanceCard wallet={wallet} progress={progress} />

      {error ? (
        <Text style={styles.statusText}>{error.message}</Text>
      ) : null}

      {isLoading && CATEGORY_ORDER.every((category) => grouped[category].length === 0) ? (
        <Text style={styles.statusText}>Loading locker room...</Text>
      ) : null}

      {CATEGORY_ORDER.map((category) => (
        <View key={category} style={styles.section}>
          <Eyebrow label={CATEGORY_LABELS[category]} />
          {grouped[category].length === 0 ? (
            <Text style={styles.sectionBody}>No active items configured yet.</Text>
          ) : (
            <View style={styles.grid}>
              {grouped[category].map((item) => (
                <View key={item.id} style={styles.cell}>
                  <CosmeticItemCard
                    item={item}
                    isOwned={isOwned(item.id)}
                    canRedeem={canRedeem(item.id)}
                    onPress={() => onRedeem(item)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={styles.section}>
        <Eyebrow label="Get More Credits" />
        <Text style={styles.sectionBody}>
          Credit packs are display-only until verified in-app purchases are connected.
        </Text>
        <View style={styles.packsGrid}>
          {CREDIT_PACKS.map((pack) => (
            <View key={pack.id} style={styles.packCell}>
              <CreditPackButton
                pack={pack}
                onPress={() => onBuyPack(pack)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexBasis: "32%",
    flexGrow: 0
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  eyebrowWrap: {
    marginBottom: spacing.xs,
  },
  playerCard: {
    marginTop: -15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  lockerCta: {
    alignSelf: "stretch",
    marginTop: spacing.lg
  },
  note: {
    ...typography.caption,
    color: opacity.ink35,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center",
  },
  packCell: {
    flexBasis: "48%",
    flexGrow: 0
  },
  packsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  section: {
    marginTop: spacing.md
  },
  sectionBody: {
    ...typography.caption,
    color: opacity.ink60,
    marginTop: spacing.xs,
  },
  statusText: {
    ...typography.label,
    color: opacity.ink70,
    padding: spacing.lg,
    textAlign: "center",
  },
  subTab: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingVertical: spacing.sm,
  },
  subTabActive: {
    backgroundColor: colors.cream,
    borderColor: opacity.ink15,
    borderWidth: 1,
  },
  subTabRow: {
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  subTabText: {
    ...typography.label,
    color: opacity.ink55,
  },
  subTabTextActive: {
    color: colors.ink,
  },
  tierBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.button,
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tierBadgeText: {
    ...typography.label,
    color: colors.ink,
    letterSpacing: 1,
  },
  tierCard: {
    alignItems: "flex-start",
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xxl + spacing.sm,
    padding: spacing.md,
  },
  tierProgress: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    marginTop: spacing.xs,
  },
  tierStat: {
    ...typography.caption,
    color: opacity.ink60,
    marginTop: spacing.xs,
  },
  tierTextCol: {
    flex: 1,
    minWidth: 0,
  },
  tierTitle: {
    ...typography.headingCard,
    color: colors.ink,
  },
});
