import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Eyebrow } from "../brand/Eyebrow";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export interface ScreenHeaderProps {
  eyebrow?: string;
  eyebrowAccent?: "red" | "blue" | "purple";
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function ScreenHeader({
  eyebrow,
  eyebrowAccent = "red",
  title,
  subtitle,
  children,
}: ScreenHeaderProps) {
  return (
    <View style={styles.root}>
      {eyebrow ? <Eyebrow label={eyebrow} accent={eyebrowAccent} /> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: opacity.ink70,
  },
  title: {
    ...typography.display,
    color: colors.ink,
  },
});
