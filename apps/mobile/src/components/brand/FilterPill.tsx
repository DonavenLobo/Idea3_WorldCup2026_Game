import type { LayoutChangeEvent } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { triggerLightImpact } from "../../lib/haptics";
import { colors } from "../../theme/colors";
import { pressableFeedback } from "../../theme/pressable";
import { typography } from "../../theme/typography";

export interface FilterPillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function FilterPill({ label, selected = false, onPress, onLayout }: FilterPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onLayout={onLayout}
      onPress={() => {
        triggerLightImpact();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.pill,
        selected ? styles.pillSelected : styles.pillUnselected,
        pressed && pressableFeedback(true),
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
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
  pillSelected: {
    backgroundColor: colors.red,
  },
  pillUnselected: {
    backgroundColor: colors.pillMuted,
  },
});
