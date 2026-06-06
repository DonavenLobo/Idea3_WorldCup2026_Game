import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "../common/BackButton";
import { FixedFooter } from "../layout/FixedFooter";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export interface OnboardingShellProps {
  step: 1 | 2 | 3 | 4;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
}

export function OnboardingShell({
  step,
  totalSteps = 3,
  title,
  subtitle,
  children,
  footer,
  showBack = false,
}: OnboardingShellProps) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        {showBack ? <BackButton variant="dark" /> : <View style={styles.backSpacer} />}
        <StepIndicator current={step} total={totalSteps} />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.body}>{children}</View>

      {footer ? <FixedFooter>{footer}</FixedFooter> : null}
    </SafeAreaView>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.steps}>
      {Array.from({ length: total }, (_, i) => {
        const stepNumber = i + 1;
        const active = stepNumber === current;
        const done = stepNumber < current;
        return (
          <View key={stepNumber} style={styles.stepWrap}>
            <View
              style={[
                styles.stepDot,
                active && styles.stepDotActive,
                done && styles.stepDotDone,
              ]}
            />
            {stepNumber < total ? <View style={styles.stepLine} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  backSpacer: {
    height: 32,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  stepDot: {
    backgroundColor: opacity.ink15,
    borderRadius: 4,
    height: 4,
    width: 24,
  },
  stepDotActive: {
    backgroundColor: colors.red,
    width: 32,
  },
  stepDotDone: {
    backgroundColor: opacity.ink30,
  },
  stepLine: {
    backgroundColor: opacity.ink12,
    height: 1,
    width: 8,
  },
  stepWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  steps: {
    flexDirection: "row",
    gap: 4,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: opacity.ink60,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    marginTop: spacing.xs,
  },
});
