import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { DailyTriviaQuestion, ScoredTriviaAttempt } from "../types";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { formatResponseTime } from "../../../utils/formatters";

interface CompletedViewProps {
  attempt: ScoredTriviaAttempt;
  questions: DailyTriviaQuestion[];
}

export function CompletedView({ attempt, questions }: CompletedViewProps) {
  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>TODAY&apos;S TRIVIA COMPLETE</Text>
        <Text style={styles.heroValue}>+{attempt.competitivePoints}</Text>
        <Text style={styles.heroSub}>
          {attempt.correctAnswers} of {attempt.totalQuestions} correct
        </Text>
        <Text style={styles.heroMeta}>
          {formatResponseTime(attempt.totalResponseTimeMs)} total response time
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>Your first attempt</Text>
        {attempt.answers.map((answer, i) => {
          const question = questionsById[answer.questionId];
          const correct = answer.isCorrect ?? false;

          return (
            <View key={`${answer.questionId}-${i}`} style={styles.summaryRow}>
              <View
                style={[
                  styles.resultBadge,
                  correct ? styles.resultBadgeCorrect : styles.resultBadgeWrong
                ]}
              >
                <Text style={styles.resultBadgeText}>{correct ? "✓" : "x"}</Text>
              </View>
              <View style={styles.summaryText}>
                <Text style={styles.summaryQ} numberOfLines={2}>
                  {question?.question ?? `Question ${i + 1}`}
                </Text>
                <Text style={styles.summaryMeta}>
                  Picked {answer.selectedAnswerKey}  •  +{answer.points ?? 0} pts  •  {" "}
                  {formatResponseTime(answer.responseTimeMs)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>CARD XP EARNED</Text>
        <Text style={styles.totalValue}>+{attempt.earnedCardXp}</Text>
      </View>

      <Text style={styles.comeBack}>Come back tomorrow for fresh questions.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  comeBack: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: spacing.lg,
    textAlign: "center"
  },
  content: {
    padding: spacing.lg
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    borderWidth: 3,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  heroEyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  heroMeta: {
    color: "rgba(12, 59, 46, 0.55)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  heroSub: {
    color: "rgba(12, 59, 46, 0.7)",
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  heroValue: {
    color: colors.pitch,
    fontSize: 56,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  resultBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  resultBadgeCorrect: {
    backgroundColor: "#1F9D55"
  },
  resultBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  resultBadgeWrong: {
    backgroundColor: "#C8102E"
  },
  summaryCard: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg
  },
  summaryHeader: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  summaryMeta: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  summaryQ: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: "700"
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  summaryText: {
    flex: 1
  },
  totalCard: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.12)",
    borderColor: colors.gold,
    borderRadius: radius.lg,
    borderWidth: 2,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  totalLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  totalValue: {
    color: colors.cream,
    fontSize: 40,
    fontWeight: "900",
    marginTop: spacing.xs
  }
});
