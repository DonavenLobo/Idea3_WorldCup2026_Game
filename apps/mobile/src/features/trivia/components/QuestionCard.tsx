import { Pressable, StyleSheet, Text, View } from "react-native";
import { TRIVIA_MAX_POINTS_PER_QUESTION } from "@world-cup-game/config";
import type { DailyTriviaQuestion } from "../types";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface QuestionCardProps {
  disabled?: boolean;
  question: DailyTriviaQuestion;
  questionNumber: number;
  selectedIndex: number | null;
  totalQuestions: number;
  onSelect: (index: number) => void;
}

export function QuestionCard({
  disabled = false,
  question,
  questionNumber,
  selectedIndex,
  totalQuestions,
  onSelect
}: QuestionCardProps) {
  const isLockedIn = selectedIndex !== null;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>
        Q{questionNumber} of {totalQuestions}  •  UP TO {TRIVIA_MAX_POINTS_PER_QUESTION} PTS
      </Text>
      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.options}>
        {question.answerOptions.map((option, idx) => {
          const isSelected = selectedIndex === idx;

          return (
            <Pressable
              key={option.key}
              disabled={disabled || isLockedIn}
              onPress={() => onSelect(idx)}
              style={[
                styles.option,
                isSelected ? styles.optionSelected : null,
                disabled ? styles.optionDisabled : null
              ]}
            >
              <View style={[styles.letterBadge, isSelected ? styles.letterBadgeSelected : null]}>
                <Text style={[styles.letterText, isSelected ? styles.letterTextSelected : null]}>
                  {option.key}
                </Text>
              </View>
              <Text style={styles.optionText}>{option.label}</Text>
              {isSelected ? <Text style={styles.lockedText}>Locked</Text> : null}
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
  letterBadgeSelected: {
    backgroundColor: colors.gold
  },
  letterText: {
    color: colors.pitch,
    fontSize: 14,
    fontWeight: "900"
  },
  letterTextSelected: {
    color: colors.pitch
  },
  lockedText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
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
  optionDisabled: {
    opacity: 0.7
  },
  optionSelected: {
    backgroundColor: "rgba(214, 161, 30, 0.12)",
    borderColor: colors.gold
  },
  optionText: {
    color: colors.pitch,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  options: {
    marginTop: spacing.sm
  },
  question: {
    color: colors.pitch,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  }
});
