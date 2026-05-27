import { Pressable, StyleSheet, Text, View } from "react-native";
import { TRIVIA_POINTS } from "@world-cup-game/config";
import type { TriviaQuestion } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

const LETTERS = ["A", "B", "C", "D"] as const;

interface QuestionCardProps {
  question: TriviaQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  onSelect
}: QuestionCardProps) {
  const isRevealed = selectedIndex !== null;
  const points = TRIVIA_POINTS[question.difficulty];

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>
        Q{questionNumber} of {totalQuestions}  •  {question.difficulty.toUpperCase()}  •  {points} PTS
      </Text>
      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.options}>
        {question.options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === question.correctIndex;
          const showAsCorrect = isRevealed && isCorrect;
          const showAsWrong = isRevealed && isSelected && !isCorrect;

          const letter = LETTERS[idx] ?? "?";

          return (
            <Pressable
              key={idx}
              disabled={isRevealed}
              onPress={() => onSelect(idx)}
              style={[
                styles.option,
                showAsCorrect ? styles.optionCorrect : null,
                showAsWrong ? styles.optionWrong : null
              ]}
            >
              <View
                style={[
                  styles.letterBadge,
                  showAsCorrect ? styles.letterBadgeCorrect : null,
                  showAsWrong ? styles.letterBadgeWrong : null
                ]}
              >
                <Text
                  style={[
                    styles.letterText,
                    showAsCorrect || showAsWrong ? styles.letterTextOnColor : null
                  ]}
                >
                  {letter}
                </Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {showAsCorrect ? <Text style={styles.resultIcon}>✓</Text> : null}
              {showAsWrong ? <Text style={styles.resultIconWrong}>✗</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: spacing.sm
  },
  letterBadge: {
    alignItems: "center",
    backgroundColor: "rgba(12, 59, 46, 0.08)",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  letterBadgeCorrect: {
    backgroundColor: "#1F9D55"
  },
  letterBadgeWrong: {
    backgroundColor: "#C8102E"
  },
  letterText: {
    color: colors.pitch,
    fontSize: 14,
    fontWeight: "900"
  },
  letterTextOnColor: {
    color: "#FFFFFF"
  },
  option: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  optionCorrect: {
    backgroundColor: "rgba(31, 157, 85, 0.08)",
    borderColor: "#1F9D55"
  },
  optionText: {
    color: colors.pitch,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  optionWrong: {
    backgroundColor: "rgba(200, 16, 46, 0.06)",
    borderColor: "#C8102E"
  },
  options: {
    marginTop: spacing.sm
  },
  question: {
    color: colors.pitch,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  resultIcon: {
    color: "#1F9D55",
    fontSize: 20,
    fontWeight: "900"
  },
  resultIconWrong: {
    color: "#C8102E",
    fontSize: 20,
    fontWeight: "900"
  }
});
