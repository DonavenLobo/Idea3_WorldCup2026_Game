import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { GROUP_IDS } from "@world-cup-game/config";
import { BrandButton } from "../../src/components/brand";
import { Screen, ScreenHeader } from "../../src/components/layout";
import {
  BracketSummary,
  GroupPicker,
  KnockoutRound,
  SubTabBar,
  useBracket
} from "../../src/features/bracket";
import type { SubTab } from "../../src/features/bracket";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";

export default function BracketScreen() {
  const { isCreated, start, picks, isLoadingSavedBracket, lastSavedAt } = useBracket();
  const [subTab, setSubTab] = useState<SubTab>("groups");
  const [groupIndex, setGroupIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const shouldShowSavedSummary = isCreated && !isLoadingSavedBracket && Boolean(lastSavedAt);

  // Track the previous pick counts so auto-advance only fires on the
  // transition from incomplete -> complete (not every time a complete
  // round is revisited).
  const prevCounts = useRef({
    r32: 0,
    r16: 0,
    qf: 0,
    sf: 0,
    final: false,
    third: false
  });

  // Auto-advance to the next round once the current round just got fully picked.
  useEffect(() => {
    const r32 = Object.keys(picks.r32).length;
    const r16 = Object.keys(picks.r16).length;
    const qf = Object.keys(picks.qf).length;
    const sf = Object.keys(picks.sf).length;
    const finalDone = picks.final !== null;
    const thirdDone = picks.third !== null;

    const prev = prevCounts.current;

    if (subTab === "r32" && r32 === 16 && prev.r32 < 16) {
      setSubTab("r16");
    } else if (subTab === "r16" && r16 === 8 && prev.r16 < 8) {
      setSubTab("qf");
    } else if (subTab === "qf" && qf === 4 && prev.qf < 4) {
      setSubTab("sf");
    } else if (subTab === "sf" && sf === 2 && prev.sf < 2) {
      setSubTab("final");
    } else if (subTab === "final" && finalDone && !prev.final) {
      setSubTab("third");
    } else if (subTab === "third" && thirdDone && !prev.third) {
      setSubTab("summary");
    }

    prevCounts.current = { r32, r16, qf, sf, final: finalDone, third: thirdDone };
  }, [subTab, picks]);

  // Reset the vertical scroll to the top whenever the sub-tab changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [subTab]);

  // Reset the vertical scroll to the top whenever this tab gets focused
  // (so coming back from another bottom tab lands at the top). Saved
  // brackets open to the summary instead of restarting the edit flow.
  useFocusEffect(
    useCallback(() => {
      if (shouldShowSavedSummary) {
        setSubTab("summary");
      }
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [shouldShowSavedSummary])
  );

  useEffect(() => {
    if (shouldShowSavedSummary) {
      setSubTab("summary");
    }
  }, [shouldShowSavedSummary]);

  const handleStart = () => {
    setGroupIndex(0);
    setSubTab("groups");
    start();
  };

  if (isLoadingSavedBracket) {
    return (
      <Screen
        scroll
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.emptyContent}
      >
        <ScreenHeader
          eyebrow="BRACKET CHALLENGE"
          title="Loading Your Bracket"
          subtitle="Checking whether you already saved tournament picks."
        />
      </Screen>
    );
  }

  if (!isCreated) {
    return (
      <Screen
        scroll
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.emptyContent}
      >
        <ScreenHeader
          eyebrow="BRACKET CHALLENGE"
          title="Step 1: Create Your Bracket"
          subtitle="Predict the group winners, then call every knockout from the Round of 32 to the Final."
        />
        <BrandButton
          label="Create Your Bracket"
          onPress={handleStart}
          style={styles.cta}
        />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <SubTabBar value={subTab} onChange={setSubTab} />
      <Screen
        scroll
        ref={scrollRef}
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.content}
      >
        {subTab === "groups" && (
          <GroupPicker
            index={groupIndex}
            onIndexChange={setGroupIndex}
            onComplete={() => setSubTab("r32")}
          />
        )}
        {subTab === "r32" && <KnockoutRound round="r32" />}
        {subTab === "r16" && <KnockoutRound round="r16" />}
        {subTab === "qf" && <KnockoutRound round="qf" />}
        {subTab === "sf" && <KnockoutRound round="sf" />}
        {subTab === "final" && <KnockoutRound round="final" />}
        {subTab === "third" && <KnockoutRound round="third" />}
        {subTab === "summary" && (
          <BracketSummary
            onGroupTap={(g) => {
              const idx = GROUP_IDS.indexOf(g);
              if (idx >= 0) {
                setGroupIndex(idx);
                setSubTab("groups");
              }
            }}
          />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: 0,
    paddingTop: spacing.sm
  },
  cta: {
    alignSelf: "stretch",
    marginTop: spacing.xl
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center"
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  }
});
