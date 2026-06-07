import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { triggerLightImpact } from "../../lib/haptics";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { pressableFeedback } from "../../theme/pressable";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export interface BrandButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BrandButton({
  label,
  onPress,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  icon,
  style,
}: BrandButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  useEffect(() => {
    if (!loading) {
      pulse.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.65, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [loading, pulse]);

  const shadowStyle =
    variant === "ghost"
      ? undefined
      : size === "large"
        ? shadows.buttonCtaLarge
        : shadows.buttonCta;

  const handlePress = () => {
    if (isDisabled) return;
    triggerLightImpact();
    onPress?.();
  };

  return (
    <Animated.View style={[{ alignSelf: "stretch", opacity: loading ? pulse : 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.base,
          size === "large" ? styles.large : styles.default,
          styles[variant],
          styles.fill,
          !isDisabled && shadowStyle,
          isDisabled && styles.disabled,
          pressed && !isDisabled && pressableFeedback(true),
        ]}
      >
        {loading ? <ActivityIndicator color={variant === "primary" ? colors.cream : colors.ink} /> : icon}
        <Text style={[styles.label, variant !== "primary" && styles.labelDark]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderColor: colors.ink,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  default: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.5,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  fill: {
    width: "100%",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  label: {
    ...typography.label,
    color: colors.cream,
  },
  labelDark: {
    color: colors.ink,
  },
  large: {
    borderRadius: radius.button,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.red,
  },
  secondary: {
    backgroundColor: colors.cream,
  },
});
