import { useRouter } from "expo-router";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { BrandButton } from "../../../components/brand";
import { Eyebrow } from "../../../components/brand/Eyebrow";
import { ScoreDisplay } from "./TriviaScore";
import type { DailyTriviaQuestion, ScoredTriviaAttempt } from "../types";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { formatResponseTime } from "../../../utils/formatters";

interface CompletedViewProps {
  attempt: ScoredTriviaAttempt;
  questions: DailyTriviaQuestion[];
}

export function CompletedView({ attempt, questions }: CompletedViewProps) {
  const router = useRouter();
  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));

  const handleShare = async () => {
    const grid = attempt.answers.map((a) => (a.isCorrect ? "🟩" : "⬛")).join("");
    const message = [
      "GoGaffa Daily Trivia",
      `${grid} ${attempt.correctAnswers}/${attempt.totalQuestions}`,
      `+${attempt.competitivePoints} pts`,
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
    <View style={styles.root}>
      <View style={styles.fold}>
        <Eyebrow label="Done for today" accent="purple" />

        <View style={styles.resultGrid}>
          {attempt.answers.map((answer, index) => {
            const correct = answer.isCorrect ?? false;
            return (
              <View
                key={`${answer.questionId}-${index}`}
                style={[styles.resultCell, correct ? styles.resultCellCorrect : styles.resultCellWrong]}
              />
            );
          })}
        </View>

        <ScoreDisplay
          framed={false}
          size="hero"
          value={attempt.competitivePoints}
        />

        <Text style={styles.summaryLine}>
          {attempt.correctAnswers}/{attempt.totalQuestions} correct
          {"  ·  "}
          {formatResponseTime(attempt.totalResponseTimeMs)}
        </Text>

        {attempt.earnedCardXp > 0 ? (
          <View style={styles.xpPill}>
            <Text style={styles.xpPillText}>+{attempt.earnedCardXp} card XP</Text>
          </View>
        ) : null}

        <BrandButton
          label="Share my score"
          onPress={() => void handleShare()}
          style={styles.shareCta}
        />

        <BrandButton
          label="View leaderboard"
          variant="ghost"
          onPress={handleViewLeaderboard}
          style={styles.leaderboardCta}
        />
      </View>

      <View style={styles.detailsDivider} />

      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={styles.detailsContent}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow label="Breakdown" />
        {attempt.answers.map((answer, index) => {
          const question = questionsById[answer.questionId];
          const correct = answer.isCorrect ?? false;

          return (
            <View key={`${answer.questionId}-${index}`} style={styles.breakdownRow}>
              <View
                style={[
                  styles.breakdownBadge,
                  correct ? styles.breakdownBadgeCorrect : styles.breakdownBadgeWrong,
                ]}
              >
                <Text style={styles.breakdownBadgeText}>{correct ? "✓" : "x"}</Text>
              </View>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownTitle} numberOfLines={1}>
                  Q{index + 1}
                  {question ? ` · ${question.question}` : ""}
                </Text>
                <Text style={styles.breakdownMeta}>
                  {answer.selectedAnswerKey} · +{answer.points ?? 0} pts ·{" "}
                  {formatResponseTime(answer.responseTimeMs)}
                </Text>
              </View>
            </View>
          );
        })}
        <Text style={styles.comeBack}>Come back tomorrow for fresh questions.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  breakdownBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  breakdownBadgeCorrect: {
    backgroundColor: colors.success,
  },
  breakdownBadgeText: {
    color: colors.cream,
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
  },
  breakdownBadgeWrong: {
    backgroundColor: colors.red,
  },
  breakdownMeta: {
    ...typography.caption,
    color: opacity.ink55,
    marginTop: 2,
  },
  breakdownRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  breakdownText: {
    flex: 1,
    minWidth: 0,
  },
  breakdownTitle: {
    ...typography.label,
    color: colors.ink,
    fontSize: 14,
  },
  comeBack: {
    ...typography.caption,
    color: opacity.ink55,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center",
  },
  detailsContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  detailsDivider: {
    alignSelf: "stretch",
    backgroundColor: opacity.ink10,
    height: 1,
    marginTop: spacing.md,
  },
  detailsScroll: {
    flex: 1,
  },
  fold: {
    alignItems: "center",
  },
  leaderboardCta: {
    marginTop: spacing.xs,
  },
  resultCell: {
    borderColor: colors.ink,
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 44,
    width: 44,
  },
  resultCellCorrect: {
    backgroundColor: colors.success,
  },
  resultCellWrong: {
    backgroundColor: opacity.ink12,
  },
  resultGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  root: {
    flex: 1,
  },
  shareCta: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
    width: "100%",
  },
  summaryLine: {
    ...typography.caption,
    color: opacity.ink60,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.4,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  xpPill: {
    backgroundColor: opacity.red18,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  xpPillText: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
