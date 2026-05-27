import { ScrollView, StyleSheet, Text, View } from "react-native";
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
  const dayPoints = attempts.reduce((acc, a) => acc + a.points, 0);
  const correctCount = attempts.filter((a) => a.correct).length;

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
