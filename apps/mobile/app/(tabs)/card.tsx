import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  COSMETIC_ITEMS,
  CREDIT_PACKS,
  LOCKER_TIERS
} from "@world-cup-game/config";
import type { CosmeticCategory, CosmeticItem } from "@world-cup-game/config";
import { MockPlayerCard, useOnboarding } from "../../src/features/onboarding";
import {
  BalanceCard,
  CosmeticItemCard,
  CreditPackButton,
  useLockerRoom
} from "../../src/features/locker-room";
import type { LockerProgress } from "../../src/features/locker-room";
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

export default function CardScreen() {
  const { nation, displayName, photoSource } = useOnboarding();
  const {
    balance,
    progress,
    active,
    activeFrame,
    activeBadge,
    activeBackground,
    isOwned,
    canRedeem,
    redeem,
    buyCreditPack,
    setActive
  } = useLockerRoom();
  const [subTab, setSubTab] = useState<CardSubTab>("card");
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const grouped = useMemo(() => {
    const map: Record<CosmeticCategory, CosmeticItem[]> = {
      frame: [],
      badge: [],
      background: []
    };
    for (const item of COSMETIC_ITEMS) {
      map[item.category].push(item);
    }
    return map;
  }, []);

  const handleItemPress = (item: CosmeticItem) => {
    const owned = isOwned(item.id);
    if (owned) {
      // Equip / unequip.
      const isCurrentlyActive = active[item.category] === item.id;
      if (isCurrentlyActive) {
        setActive(item.category, null);
      } else {
        setActive(item.category, item.id);
      }
      return;
    }

    // Locked by tier — explain why.
    if (item.requiredTier && !canRedeem(item.id)) {
      const tierIdx = LOCKER_TIERS.findIndex((t) => t.id === item.requiredTier);
      const tierCfg = LOCKER_TIERS[tierIdx];
      if (tierCfg) {
        const itemsToNext = Math.max(0, tierCfg.minItemsOwned - progress.ownedCount);
        Alert.alert(
          "Locked",
          `Reach ${tierCfg.label} tier first. Own ${itemsToNext} more cosmetic${itemsToNext === 1 ? "" : "s"} to unlock this.`
        );
        return;
      }
    }

    // Not enough credits — explain.
    if (!canRedeem(item.id)) {
      Alert.alert(
        "Not enough credits",
        `You need ${item.priceCredits} credits. Earn more via Trivia + Bracket, or buy a credit pack below.`
      );
      return;
    }

    // Affordable + unlocked — confirm redeem.
    Alert.alert(
      `Redeem ${item.name}?`,
      `${item.priceCredits} credits will be deducted. This is permanent.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: () => {
            const result = redeem(item.id);
            if (result.ok) {
              Alert.alert("Unlocked!", `${item.name} is now equipped on your card.`);
            } else if (result.reason) {
              Alert.alert("Can't redeem yet", result.reason);
            }
          }
        }
      ]
    );
  };

  const handleBuyPack = (credits: number, label: string) => {
    Alert.alert(
      "Buy Credit Pack — MOCK",
      `🚧 NO REAL CHARGE — this is a mock.\n\nIn production, "${label}" would charge via Apple/Google IAP (which needs the dev build). The mock will instantly credit ${credits} credits to your balance.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mock Buy",
          onPress: () => {
            buyCreditPack(credits);
            Alert.alert("Credits added", `+${credits} credits (mock — no money charged).`);
          }
        }
      ]
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
            nation={nation}
            displayName={displayName}
            photoSource={photoSource}
            progress={progress}
            ownedCount={progress.ownedCount}
            onOpenLocker={() => setSubTab("locker")}
            activeFrame={activeFrame}
            activeBadge={activeBadge}
            activeBackground={activeBackground}
          />
        ) : (
          <LockerRoomPanel
            balance={balance}
            progress={progress}
            grouped={grouped}
            active={active}
            isOwned={isOwned}
            canRedeem={canRedeem}
            onItemPress={handleItemPress}
            onBuyPack={handleBuyPack}
          />
        )}
      </ScrollView>
    </View>
  );
}

function MyCardPanel({
  nation,
  displayName,
  photoSource,
  progress,
  ownedCount,
  onOpenLocker,
  activeFrame,
  activeBadge,
  activeBackground
}: {
  nation: ReturnType<typeof useOnboarding>["nation"];
  displayName: string;
  photoSource: ReturnType<typeof useOnboarding>["photoSource"];
  progress: LockerProgress;
  ownedCount: number;
  onOpenLocker: () => void;
  activeFrame: CosmeticItem | null;
  activeBadge: CosmeticItem | null;
  activeBackground: CosmeticItem | null;
}) {
  const tierConfig = LOCKER_TIERS.find((t) => t.id === progress.tier);
  return (
    <View>
      <Text style={styles.eyebrow}>YOUR CARD</Text>
      <MockPlayerCard
        nation={nation}
        displayName={displayName}
        photoSource={photoSource}
        activeFrame={activeFrame}
        activeBadge={activeBadge}
        activeBackground={activeBackground}
        ovrBonus={tierConfig?.ovrBonus ?? 0}
      />

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
          <Text style={styles.tierTitle}>Current tier</Text>
          <Text style={styles.tierStat}>
            +{tierConfig?.ovrBonus ?? 0} OVR · {ownedCount} cosmetics owned
          </Text>
          <Text style={styles.tierProgress}>
            {progress.nextTierLabel
              ? `${progress.ownedToNextTier} more to ${progress.nextTierLabel}`
              : "Max tier reached"}
          </Text>
        </View>
      </View>

      <Pressable style={styles.lockerCta} onPress={onOpenLocker}>
        <Text style={styles.lockerCtaText}>🔒  Open Locker Room  →</Text>
      </Pressable>

      <Text style={styles.note}>
        Cards never downgrade. Owned items stay yours forever.
      </Text>
    </View>
  );
}

function LockerRoomPanel({
  balance,
  progress,
  grouped,
  active,
  isOwned,
  canRedeem,
  onItemPress,
  onBuyPack
}: {
  balance: number;
  progress: LockerProgress;
  grouped: Record<CosmeticCategory, CosmeticItem[]>;
  active: { frame: string | null; badge: string | null; background: string | null };
  isOwned: (id: string) => boolean;
  canRedeem: (id: string) => boolean;
  onItemPress: (item: CosmeticItem) => void;
  onBuyPack: (credits: number, label: string) => void;
}) {
  return (
    <View>
      <BalanceCard balance={balance} progress={progress} />

      {CATEGORY_ORDER.map((cat) => (
        <View key={cat} style={styles.section}>
          <Text style={styles.sectionTitle}>{CATEGORY_LABELS[cat]}</Text>
          <View style={styles.grid}>
            {grouped[cat].map((item) => (
              <View key={item.id} style={styles.cell}>
                <CosmeticItemCard
                  item={item}
                  isOwned={isOwned(item.id)}
                  isActive={active[cat] === item.id}
                  canRedeem={canRedeem(item.id)}
                  onPress={() => onItemPress(item)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get More Credits</Text>
        <Text style={styles.sectionBody}>
          Stack credits with cash to unlock higher-tier cosmetics faster.
        </Text>
        <View style={styles.packsGrid}>
          {CREDIT_PACKS.map((pack) => (
            <View key={pack.id} style={styles.packCell}>
              <CreditPackButton
                pack={pack}
                onPress={() => onBuyPack(pack.credits, pack.priceUsd)}
              />
            </View>
          ))}
        </View>
        <Text style={styles.iapNote}>
          🚧 MOCK — no real charge. Real IAP needs the development build.
        </Text>
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
  iapNote: {
    color: colors.gold,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: spacing.sm,
    textAlign: "center"
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
