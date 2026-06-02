import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TRIVIA_MAX_POINTS_PER_QUESTION, TRIVIA_QUESTIONS_PER_DAY } from "@world-cup-game/config";
import { CompletedView, QuestionCard, useTrivia } from "../../src/features/trivia";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const LOCKED_IN_MS = 700;

export default function TriviaScreen() {
  const {
    answers,
    completedAttempt,
    currentIndex,
    error,
    isLoading,
    isStarted,
    isSubmitting,
    questions,
    advance,
    reloadToday,
    startToday,
    submitAnswer
  } = useTrivia();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const advanceRef = useRef(advance);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const currentQuestion = questions[currentIndex];
  const hasDailyQuestions = questions.length === TRIVIA_QUESTIONS_PER_DAY;

  const handleSelect = (idx: number) => {
    if (selectedIndex !== null || isSubmitting) return;

    const result = submitAnswer(idx);
    if (!result) return;

    setSelectedIndex(idx);
    timerRef.current = setTimeout(() => {
      void advanceRef.current();
    }, LOCKED_IN_MS);
  };

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEyebrow}>DAILY TRIVIA</Text>
        <Text style={styles.emptyTitle}>Loading Today&apos;s Quiz</Text>
        <Text style={styles.emptyBody}>Checking today&apos;s fixed question set.</Text>
      </View>
    );
  }

  if (!hasDailyQuestions) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEyebrow}>DAILY TRIVIA</Text>
        <Text style={styles.emptyTitle}>Trivia Is Not Ready</Text>
        <Text style={styles.emptyBody}>
          Today needs exactly {TRIVIA_QUESTIONS_PER_DAY} configured questions before players can start.
        </Text>
        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        <Pressable style={styles.cta} onPress={() => void reloadToday()}>
          <Text style={styles.ctaText}>Reload Trivia</Text>
        </Pressable>
      </View>
    );
  }

  if (completedAttempt) {
    return (
      <View style={styles.root}>
        <CompletedView attempt={completedAttempt} questions={questions} />
      </View>
    );
  }

  if (!isStarted) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEyebrow}>DAILY TRIVIA</Text>
        <Text style={styles.emptyTitle}>5 Questions. 1 Shot.</Text>
        <Text style={styles.emptyBody}>
          Today&apos;s trivia is the same for everyone. Your first attempt counts, with points for
          correctness plus speed.
        </Text>

        <View style={styles.scoringRow}>
          <ScoringChip label="QUESTIONS" value={`${TRIVIA_QUESTIONS_PER_DAY}`} />
          <ScoringChip label="OPTIONS" value="4" />
          <ScoringChip label="MAX/Q" value={`+${TRIVIA_MAX_POINTS_PER_QUESTION}`} />
        </View>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        <Pressable style={styles.cta} onPress={startToday}>
          <Text style={styles.ctaText}>Start Today&apos;s Trivia</Text>
        </Pressable>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEyebrow}>DAILY TRIVIA</Text>
        <Text style={styles.emptyTitle}>
          {isSubmitting ? "Scoring Your Attempt" : "Saving Your Result"}
        </Text>
        <Text style={styles.emptyBody}>
          {isSubmitting
            ? "Your answers are being checked server-side."
            : "Waiting for today's result."}
        </Text>
        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerEyebrow}>DAILY TRIVIA</Text>
          <Text style={styles.headerPoints}>
            {answers.length}/{questions.length} locked
          </Text>
        </View>

        <QuestionCard
          disabled={isSubmitting}
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        {isSubmitting ? <Text style={styles.statusText}>Scoring attempt...</Text> : null}
      </ScrollView>
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
  errorText: {
    color: "#FFB4A8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
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
  statusText: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
  }
});
