import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CelebrationOverlay,
  CompletedView,
  QuestionCard,
  dateKey,
  useTrivia
} from "../../src/features/trivia";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const REVEAL_MS = 2500;

export default function TriviaScreen() {
  const {
    totalPoints,
    todayDateKey,
    todayQuestions,
    todayAttempts,
    todayCurrentIndex,
    startToday,
    submitAnswer,
    advance
  } = useTrivia();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{ key: number; points: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state when current question changes.
  useEffect(() => {
    setSelectedIndex(null);
  }, [todayCurrentIndex]);

  // Cleanup any pending reveal timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Reset scroll to top when this tab regains focus.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const today = dateKey();
  const isStarted = todayDateKey === today;
  const isComplete = isStarted && todayCurrentIndex >= todayQuestions.length;

  // Empty state - daily trivia not started yet
  if (!isStarted) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEyebrow}>DAILY TRIVIA</Text>
        <Text style={styles.emptyTitle}>3 Questions. 1 Shot.</Text>
        <Text style={styles.emptyBody}>
          Today&apos;s trivia is the same for everyone. Get them right to bank points toward your card.
        </Text>

        <View style={styles.scoringRow}>
          <ScoringChip label="EASY" value="+10" />
          <ScoringChip label="MEDIUM" value="+25" />
          <ScoringChip label="HARD" value="+50" />
        </View>

        {totalPoints > 0 ? (
          <Text style={styles.totalSoFar}>
            Lifetime trivia: <Text style={styles.totalSoFarValue}>{totalPoints}</Text> PTS
          </Text>
        ) : null}

        <Pressable style={styles.cta} onPress={startToday}>
          <Text style={styles.ctaText}>Start Today&apos;s Trivia</Text>
        </Pressable>
      </View>
    );
  }

  // Completed state - bracket of the day is done
  if (isComplete) {
    return (
      <View style={styles.root}>
        <CompletedView
          totalPoints={totalPoints}
          questions={todayQuestions}
          attempts={todayAttempts}
        />
      </View>
    );
  }

  // Answering state
  const currentQuestion = todayQuestions[todayCurrentIndex];
  if (!currentQuestion) return null;

  const handleSelect = (idx: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
    const result = submitAnswer(idx);
    if (result.correct) {
      setCelebration({ key: todayCurrentIndex, points: result.points });
    }
    timerRef.current = setTimeout(() => {
      setCelebration(null);
      advance();
    }, REVEAL_MS);
  };

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerEyebrow}>DAILY TRIVIA</Text>
          <Text style={styles.headerPoints}>{totalPoints} PTS</Text>
        </View>

        <QuestionCard
          question={currentQuestion}
          questionNumber={todayCurrentIndex + 1}
          totalQuestions={todayQuestions.length}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
      </ScrollView>

      {celebration ? (
        <CelebrationOverlay key={celebration.key} points={celebration.points} />
      ) : null}
    </View>
  );
}

function ScoringChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.14)",
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.sm
  },
  chipLabel: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1
  },
  chipValue: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2
  },
  content: {
    padding: spacing.lg
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
  headerEyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  headerPoints: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: "900"
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  scoringRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: "100%"
  },
  totalSoFar: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.lg
  },
  totalSoFarValue: {
    color: colors.gold,
    fontWeight: "900"
  }
});
