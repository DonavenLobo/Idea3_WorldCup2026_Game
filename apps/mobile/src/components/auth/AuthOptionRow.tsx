import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";
import { pressableFeedback } from "../../theme/pressable";
import { typography } from "../../theme/typography";

type AuthOptionVariant = "primary" | "secondary";

export interface AuthOptionRowProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: AuthOptionVariant;
  /** @deprecated Use variant="primary". */
  accent?: boolean;
}

export function AuthOptionRow({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant,
  accent = false,
}: AuthOptionRowProps) {
  const resolvedVariant: AuthOptionVariant = variant ?? (accent ? "primary" : "secondary");
  const isPrimary = resolvedVariant === "primary";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        !isDisabled && isPrimary ? shadows.buttonCta : null,
        pressed && !isDisabled && pressableFeedback(true),
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.cream : colors.ink} size="small" />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.label,
    textAlign: "center",
  },
  labelPrimary: {
    color: colors.cream,
  },
  labelSecondary: {
    color: colors.ink,
  },
  primary: {
    backgroundColor: colors.red,
    borderColor: colors.ink,
  },
  secondary: {
    backgroundColor: colors.cream,
    borderColor: opacity.ink35,
  },
});
