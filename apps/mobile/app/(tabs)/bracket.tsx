import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GROUP_IDS } from "@world-cup-game/config";
import {
  BracketSummary,
  GroupPicker,
  KnockoutRound,
  SubTabBar,
  useBracket
} from "../../src/features/bracket";
import type { SubTab } from "../../src/features/bracket";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function BracketScreen() {
  const { isCreated, start, picks } = useBracket();
  const [subTab, setSubTab] = useState<SubTab>("groups");
  const [groupIndex, setGroupIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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
  // (so coming back from another bottom tab lands at the top).
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  if (!isCreated) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEyebrow}>BRACKET CHALLENGE</Text>
        <Text style={styles.emptyTitle}>Step 1: Create Your Bracket</Text>
        <Text style={styles.emptyBody}>
          Predict the group winners, then call every knockout from the Round of 32 to the Final.
        </Text>
        <Pressable style={styles.cta} onPress={start}>
          <Text style={styles.ctaText}>Create Your Bracket</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SubTabBar value={subTab} onChange={setSubTab} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  ctaText: {
    color: colors.pitch,
    fontSize: 17,
    fontWeight: "900"
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  emptyBody: {
    color: "rgba(255, 248, 234, 0.7)",
    marginTop: spacing.sm,
    textAlign: "center",
    ...typography.body
  },
  emptyEyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  emptyTitle: {
    color: colors.cream,
    marginTop: spacing.xs,
    textAlign: "center",
    ...typography.display
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  }
});
