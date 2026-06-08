import type { LayoutChangeEvent } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { triggerLightImpact } from "../../lib/haptics";
import { colors } from "../../theme/colors";
import { pressableFeedback } from "../../theme/pressable";
import { typography } from "../../theme/typography";

export interface FilterPillProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function FilterPill({
  label,
  selected = false,
  disabled = false,
  onPress,
  onLayout,
}: FilterPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onLayout={onLayout}
      onPress={() => {
        if (disabled) return;
        triggerLightImpact();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.pill,
        selected ? styles.pillSelected : styles.pillUnselected,
        disabled ? styles.pillDisabled : null,
        pressed && !disabled && pressableFeedback(true),
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected, disabled && styles.labelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.ink,
  },
  labelDisabled: {
    color: colors.ink,
  },
  labelSelected: {
    color: colors.cream,
  },
  pill: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pillDisabled: {
    opacity: 0.35,
  },
  pillSelected: {
    backgroundColor: colors.red,
  },
  pillUnselected: {
    backgroundColor: colors.pillMuted,
  },
});
