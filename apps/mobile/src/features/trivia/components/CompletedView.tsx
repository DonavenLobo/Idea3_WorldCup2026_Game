import { useRouter } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
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
  const router = useRouter();
  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));

  const handleShare = async () => {
    // Spoiler-safe Wordle-like format per MVP decision #17 — never leaks answers.
    const grid = attempt.answers.map((a) => (a.isCorrect ? "🟩" : "⬛")).join("");
    const message = [
      "GoGaffa Daily Trivia",
      `${grid} ${attempt.correctAnswers}/${attempt.totalQuestions}`,
      `+${attempt.competitivePoints} pts`
    ].join("\n");
    try {
      await Share.share({ message });
    } catch {
      // user cancelled or share failed — no-op
    }
  };

  const handleViewLeaderboard = () => {
    router.push("/leaderboard");
  };

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

      <Pressable style={styles.primaryCta} onPress={handleShare}>
        <Text style={styles.primaryCtaText}>📤  Share my score</Text>
      </Pressable>

      <Pressable style={styles.secondaryCta} onPress={handleViewLeaderboard}>
        <Text style={styles.secondaryCtaText}>🏆  View Leaderboard</Text>
      </Pressable>

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
  primaryCta: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    padding: spacing.md
  },
  primaryCtaText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
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
  secondaryCta: {
    alignItems: "center",
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 2,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  secondaryCtaText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "900"
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
