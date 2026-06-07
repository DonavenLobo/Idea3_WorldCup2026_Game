import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../common/BackButton";
import { FixedFooter } from "../layout/FixedFooter";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  keyboard?: boolean;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showBack = true,
  keyboard = false,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();
  const scrollPadding = footer ? spacing.lg : insets.bottom + spacing.xxl;

  const content = (
    <>
      {showBack ? <BackButton variant="dark" /> : <View style={styles.backSpacer} />}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </>
  );

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={keyboard && Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
        {footer ? <FixedFooter>{footer}</FixedFooter> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backSpacer: {
    height: 32,
  },
  body: {
    marginTop: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  subtitle: {
    ...typography.body,
    color: opacity.ink60,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    marginTop: spacing.md,
  },
});
