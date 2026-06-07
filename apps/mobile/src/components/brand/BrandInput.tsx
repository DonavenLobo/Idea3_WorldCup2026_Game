import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export const BrandInput = forwardRef<TextInput, TextInputProps>(function BrandInput(
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
    backgroundColor: opacity.cream70,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    borderWidth: 2,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: "center",
  },
});
