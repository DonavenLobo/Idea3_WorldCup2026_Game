import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CREDIT_PACKS,
  LOCKER_TIERS
} from "@world-cup-game/config";
import type { CosmeticCategory, CreditPack } from "@world-cup-game/config";
import type { PlayerCard as PlayerCardData } from "@world-cup-game/types";
import { RenderedPlayerCard } from "../../src/features/card";
import {
  BalanceCard,
  CosmeticItemCard,
  CreditPackButton,
  useLockerRoom
} from "../../src/features/locker-room";
import type { LockerItem, LockerProgress, LockerWallet } from "../../src/features/locker-room";
import { useCard } from "../../src/hooks/useCard";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";

type CardSubTab = "card" | "locker";

const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  frame: "Card Frames",
  badge: "Badges",
  background: "Backgrounds"
};

const CATEGORY_ORDER: CosmeticCategory[] = ["frame", "badge", "background"];

function messageFromError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export default function CardScreen() {
  const { card, error: cardError, isLoading: isCardLoading } = useCard();
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
                  messageFromError(redeemError, "Try again in a moment.")
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

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
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
      </ScrollView>
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
      <Text style={styles.eyebrow}>YOUR CARD</Text>
      {isLoading ? (
        <Text style={styles.statusText}>Loading your card...</Text>
      ) : error ? (
        <Text style={styles.statusText}>
          {messageFromError(error, "Could not load your card.")}
        </Text>
      ) : card ? (
        <RenderedPlayerCard card={card} />
      ) : (
        <Text style={styles.statusText}>Create your card during onboarding to manage it here.</Text>
      )}

      <View style={styles.tierCard}>
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: tierConfig?.badgeColor ?? colors.gold }
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

      <Pressable style={styles.lockerCta} onPress={onOpenLocker}>
        <Text style={styles.lockerCtaText}>Open Locker Room -&gt;</Text>
      </Pressable>

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
          <Text style={styles.sectionTitle}>{CATEGORY_LABELS[category]}</Text>
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
        <Text style={styles.sectionTitle}>Get More Credits</Text>
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
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  lockerCta: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  lockerCtaText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  note: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center"
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
    backgroundColor: colors.pitch,
    flex: 1
  },
  section: {
    marginTop: spacing.md
  },
  sectionBody: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 13,
    marginTop: 4
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  statusText: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    fontWeight: "700",
    padding: spacing.lg,
    textAlign: "center"
  },
  subTab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.sm
  },
  subTabActive: {
    backgroundColor: "rgba(255, 248, 234, 0.12)",
    borderColor: "rgba(255, 248, 234, 0.25)",
    borderWidth: 1
  },
  subTabRow: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: 4
  },
  subTabText: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 15,
    fontWeight: "900"
  },
  subTabTextActive: {
    color: colors.cream
  },
  tierBadge: {
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  tierBadgeText: {
    color: colors.pitch,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1
  },
  tierCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  tierProgress: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4
  },
  tierStat: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  tierTextCol: {
    flex: 1
  },
  tierTitle: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900"
  }
});
