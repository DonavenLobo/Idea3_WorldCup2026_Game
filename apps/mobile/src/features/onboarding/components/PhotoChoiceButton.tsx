import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { pressableFeedback } from "../../../theme/pressable";
import { typography } from "../../../theme/typography";

interface PhotoChoiceButtonProps {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function PhotoChoiceButton({ emoji, title, subtitle, onPress }: PhotoChoiceButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && pressableFeedback(true)]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderBottomColor: opacity.ink12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  chevron: {
    color: opacity.ink35,
    fontFamily: typography.label.fontFamily,
    fontSize: 20,
    lineHeight: 24,
  },
  emoji: {
    fontSize: 28,
  },
  subtitle: {
    ...typography.caption,
    color: opacity.ink55,
    marginTop: 2,
  },
  text: {
    flex: 1,
  },
  title: {
    ...typography.sectionHeading,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 24,
  },
});
