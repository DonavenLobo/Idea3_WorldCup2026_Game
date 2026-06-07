import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { pressableFeedback } from "../../theme/pressable";
import { typography } from "../../theme/typography";

export interface OnboardingButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function OnboardingButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: OnboardingButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && pressableFeedback(true),
        style,
      ]}
    >
      <Text style={[styles.label, variant === "ghost" && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.4,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  ghostLabel: {
    ...typography.label,
    color: opacity.ink60,
  },
  label: {
    ...typography.label,
    color: colors.cream,
  },
  primary: {
    backgroundColor: colors.red,
  },
});
