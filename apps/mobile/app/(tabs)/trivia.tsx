import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TRIVIA_MAX_POINTS_PER_QUESTION, TRIVIA_QUESTIONS_PER_DAY } from "@world-cup-game/config";
import { BrandButton, Eyebrow } from "../../src/components/brand";
import { Screen, ScreenHeader } from "../../src/components/layout";
import {
  CompletedView,
  QuestionCard,
  TriviaStatChip,
  useTrivia
} from "../../src/features/trivia";
import { colors, opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";

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
      <Screen
        scroll
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.emptyContent}
      >
        <ScreenHeader
          eyebrow="DAILY TRIVIA"
          title="Loading Today's Quiz"
          subtitle="Checking today's fixed question set."
        />
      </Screen>
    );
  }

  if (!hasDailyQuestions) {
    return (
      <Screen
        scroll
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.emptyContent}
      >
        <ScreenHeader
          eyebrow="DAILY TRIVIA"
          title="Trivia Is Not Ready"
          subtitle={`Today needs exactly ${TRIVIA_QUESTIONS_PER_DAY} configured questions before players can start.`}
        />
        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        <BrandButton
          label="Reload Trivia"
          onPress={() => void reloadToday()}
          style={styles.cta}
        />
      </Screen>
    );
  }

  if (completedAttempt) {
    return (
      <Screen scroll={false} edges={["left", "right"]} bottomInset={32}>
        <CompletedView attempt={completedAttempt} questions={questions} />
      </Screen>
    );
  }

  if (!isStarted) {
    return (
      <Screen
        scroll
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.emptyContent}
      >
        <ScreenHeader
          eyebrow="DAILY TRIVIA"
          title="5 Questions. 1 Shot."
          subtitle="Today's trivia is the same for everyone. Your first attempt counts, with points for correctness plus speed."
        />

        <View style={styles.scoringRow}>
          <TriviaStatChip label="Questions" value={`${TRIVIA_QUESTIONS_PER_DAY}`} />
          <TriviaStatChip label="Options" value="4" />
          <TriviaStatChip label="Max/Q" value={`+${TRIVIA_MAX_POINTS_PER_QUESTION}`} />
        </View>

        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

        <BrandButton
          label="Start Today's Trivia"
          onPress={startToday}
          style={styles.cta}
        />
      </Screen>
    );
  }

  if (!currentQuestion) {
    return (
      <Screen
        scroll
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.emptyContent}
      >
        <ScreenHeader
          eyebrow="DAILY TRIVIA"
          title={isSubmitting ? "Scoring Your Attempt" : "Saving Your Result"}
          subtitle={
            isSubmitting
              ? "Your answers are being checked server-side."
              : "Waiting for today's result."
          }
        />
        {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      ref={scrollRef}
      edges={["left", "right"]}
      bottomInset={32}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <Eyebrow label="DAILY TRIVIA" />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingHorizontal: spacing.lg
  },
  cta: {
    alignSelf: "stretch",
    marginTop: spacing.xl
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center"
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
  },
  headerPoints: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  scoringRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: "100%"
  },
  statusText: {
    color: opacity.ink60,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
  }
});
