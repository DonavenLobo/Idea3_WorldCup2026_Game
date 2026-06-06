import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { pressableFeedback } from "../../theme/pressable";
import { typography } from "../../theme/typography";

export interface AuthOptionRowProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accent?: boolean;
}

export function AuthOptionRow({
  label,
  onPress,
  disabled = false,
  loading = false,
  accent = false,
}: AuthOptionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        accent && styles.rowAccent,
        pressed && !disabled && !loading && pressableFeedback(true),
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={accent ? colors.cream : colors.ink} size="small" />
      ) : (
        <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      )}
      {!loading && !accent ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chevron: {
    color: opacity.ink35,
    fontSize: 22,
    lineHeight: 26,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    fontSize: 17,
  },
  labelAccent: {
    ...typography.label,
    color: colors.cream,
    textAlign: "center",
  },
  row: {
    alignItems: "center",
    borderBottomColor: opacity.ink12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingVertical: spacing.md,
  },
  rowAccent: {
    backgroundColor: colors.red,
    borderBottomWidth: 0,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
