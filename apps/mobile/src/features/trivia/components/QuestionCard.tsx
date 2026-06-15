import { Pressable, StyleSheet, Text, View } from "react-native";
import { ContentCard } from "../../../components/brand";
import { triggerLightImpact } from "../../../lib/haptics";
import { pressableFeedback } from "../../../theme/pressable";
import type { DailyTriviaQuestion } from "../types";
import { TierChip, type TierChipQuestionIndex } from "./TierChip";
import { colors, opacity } from "../../../theme/colors";
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
  // QuestionCard receives a 1-indexed questionNumber; TierChip wants 0-based.
  // Guard clamp so a malformed prop can't blow up the tier lookup.
  const tierIndex = Math.max(0, Math.min(2, questionNumber - 1)) as TierChipQuestionIndex;

  return (
    <ContentCard style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>
          Q{questionNumber} of {totalQuestions}
        </Text>
        <TierChip questionIndex={tierIndex} emphasized />
      </View>
      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.options}>
        {question.answerOptions.map((option, idx) => {
          const isSelected = selectedIndex === idx;

          return (
            <Pressable
              key={option.key}
              disabled={disabled || isLockedIn}
              onPress={() => {
                triggerLightImpact();
                onSelect(idx);
              }}
              style={({ pressed }) => [
                styles.option,
                isSelected ? styles.optionSelected : null,
                disabled ? styles.optionDisabled : null,
                pressed && !disabled && !isLockedIn && pressableFeedback(true),
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
    </ContentCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
  },
  eyebrow: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginBottom: spacing.sm
  },
  letterBadge: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  letterBadgeSelected: {
    backgroundColor: colors.ink
  },
  letterText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  letterTextSelected: {
    color: colors.cream
  },
  lockedText: {
    color: opacity.ink70,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: opacity.ink12,
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
    backgroundColor: opacity.ink10,
    borderColor: opacity.ink55
  },
  optionText: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  options: {
    marginTop: spacing.sm
  },
  question: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26
  }
});
