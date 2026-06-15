import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TRIVIA_QUESTION_TIER_DETAILS, TRIVIA_QUESTIONS_PER_DAY } from "@world-cup-game/config";
import { BrandButton } from "../../src/components/brand";
import { Eyebrow } from "../../src/components/brand/Eyebrow";
import { CompletedView, QuestionCard, useTrivia } from "../../src/features/trivia";
import { colors, opacity } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

/** Brief pause after a tap before advancing — lets the player register their choice. */
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
    submitAnswer,
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
        <Eyebrow label="Daily Trivia" accent="purple" />
        <Text style={styles.emptyTitle}>Loading today&apos;s quiz</Text>
        <Text style={styles.emptyBody}>Checking today&apos;s fixed question set.</Text>
      </View>
    );
  }

  if (!hasDailyQuestions) {
    return (
      <View style={styles.empty}>
        <Eyebrow label="Daily Trivia" accent="purple" />
        <Text style={styles.emptyTitle}>Trivia is warming up</Text>
        <Text style={styles.emptyBody}>
          Today needs exactly {TRIVIA_QUESTIONS_PER_DAY} configured questions before players can start.
        </Text>
        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        <BrandButton
          label="Reload trivia"
          variant="secondary"
          onPress={() => void reloadToday()}
          style={styles.ctaSpacing}
        />
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
        <Eyebrow label="Daily Trivia" accent="purple" />
        <Text style={styles.emptyTitle}>{TRIVIA_QUESTIONS_PER_DAY} questions. 1 shot.</Text>
        <Text style={styles.emptyBody}>
          Today&apos;s trivia is the same for everyone. Your first attempt counts — points for
          correctness plus speed.
        </Text>

        <View style={styles.tierRow}>
          {TRIVIA_QUESTION_TIER_DETAILS.map((tier) => (
            <TierChip
              key={tier.difficulty}
              label={tier.difficulty.toUpperCase()}
              value={`+${tier.basePoints}`}
              timer={`${tier.timeLimitMs / 1000}s`}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        <BrandButton
          label="Start today's trivia"
          onPress={startToday}
          style={styles.ctaSpacing}
        />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.empty}>
        <Eyebrow label="Daily Trivia" accent="purple" />
        <Text style={styles.emptyTitle}>
          {isSubmitting ? "Scoring your attempt" : "Saving your result"}
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
          <Eyebrow label="Daily Trivia" accent="purple" />
          <Text style={styles.headerProgress}>
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
        {isSubmitting ? <Text style={styles.statusText}>Scoring attempt…</Text> : null}
      </ScrollView>
    </View>
  );
}

function TierChip({ label, value, timer }: { label: string; value: string; timer: string }) {
  return (
    <View style={styles.tierChip}>
      <Text style={styles.tierLabel}>{label}</Text>
      <Text style={styles.tierValue}>{value}</Text>
      <Text style={styles.tierTimer}>{timer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  ctaSpacing: {
    marginTop: spacing.xl,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.cream,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyBody: {
    ...typography.body,
    color: opacity.ink60,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  emptyTitle: {
    ...typography.display,
    color: colors.ink,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center",
  },
  headerProgress: {
    color: opacity.ink70,
    fontSize: 13,
    fontWeight: "700",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  statusText: {
    color: opacity.ink55,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center",
  },
  tierChip: {
    alignItems: "center",
    backgroundColor: opacity.ink10,
    borderRadius: radius.md,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  tierLabel: {
    color: opacity.ink60,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tierTimer: {
    color: opacity.ink55,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  tierValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  tierRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: "100%",
  },
});
