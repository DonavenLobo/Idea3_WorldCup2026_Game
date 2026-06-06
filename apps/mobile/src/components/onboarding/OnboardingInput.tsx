import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export const OnboardingInput = forwardRef<TextInput, TextInputProps>(function OnboardingInput(
  { style, placeholderTextColor = opacity.ink35, ...props },
  ref
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor}
      style={[styles.input, style]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    ...typography.input,
    backgroundColor: "transparent",
    borderBottomColor: opacity.ink15,
    borderBottomWidth: 1,
    borderWidth: 0,
    color: colors.ink,
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
  },
});
