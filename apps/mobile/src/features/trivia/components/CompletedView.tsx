import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@world-cup-game/config";
import type { TriviaQuestion } from "@world-cup-game/config";
import type { DailyAttempt } from "../types";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface CompletedViewProps {
  totalPoints: number;
  questions: TriviaQuestion[];
  attempts: DailyAttempt[];
}

export function CompletedView({ totalPoints, questions, attempts }: CompletedViewProps) {
  const router = useRouter();
  const dayPoints = attempts.reduce((acc, a) => acc + a.points, 0);
  const correctCount = attempts.filter((a) => a.correct).length;

  const handleShare = async () => {
    const lines = [
      `🎯 Today's trivia: ${correctCount}/${questions.length} correct, +${dayPoints} pts`,
      `Lifetime: ${totalPoints} pts`,
      "",
      "How did you do?"
    ];
    try {
      await Share.share({ message: lines.join("\n") });
    } catch {
      // user cancelled - no-op
    }
  };

  const handleLeaderboard = () => {
    router.push(APP_ROUTES.leaderboard);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>🎉  TODAY&apos;S TRIVIA COMPLETE</Text>
        <Text style={styles.heroValue}>+{dayPoints}</Text>
        <Text style={styles.heroSub}>
          {correctCount} of {questions.length} correct
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeader}>Your answers</Text>
        {questions.map((q, i) => {
          const attempt = attempts[i];
          const correct = attempt?.correct ?? false;
          const points = attempt?.points ?? 0;
          const correctOption = q.options[q.correctIndex] ?? "—";
          return (
            <View key={q.id} style={styles.summaryRow}>
              <View
                style={[
                  styles.resultBadge,
                  correct ? styles.resultBadgeCorrect : styles.resultBadgeWrong
                ]}
              >
                <Text style={styles.resultBadgeText}>{correct ? "✓" : "✗"}</Text>
              </View>
              <View style={styles.summaryText}>
                <Text style={styles.summaryQ} numberOfLines={2}>
                  {q.question}
                </Text>
                <Text style={styles.summaryAnswer} numberOfLines={1}>
                  Answer: {correctOption}
                </Text>
                <Text style={styles.summaryMeta}>
                  {q.difficulty.toUpperCase()}  •  +{points} pts
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>LIFETIME TRIVIA POINTS</Text>
        <Text style={styles.totalValue}>{totalPoints}</Text>
      </View>

      <Text style={styles.nextHeader}>What&apos;s next?</Text>

      <Pressable style={styles.primaryButton} onPress={handleShare}>
        <Text style={styles.primaryButtonText}>📤  Share my score</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleLeaderboard}>
        <Text style={styles.secondaryButtonText}>📊  View Leaderboard</Text>
      </Pressable>

      <Text style={styles.comeBack}>Come back tomorrow for fresh questions.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  comeBack: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: spacing.lg,
    textAlign: "center"
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl
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
  nextHeader: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    textTransform: "uppercase"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    padding: spacing.md
  },
  primaryButtonText: {
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
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 2,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  secondaryButtonText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "900"
  },
  summaryAnswer: {
    color: "#1F9D55",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
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
    marginBottom: spacing.lg,
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
