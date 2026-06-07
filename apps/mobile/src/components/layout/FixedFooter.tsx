import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export interface FixedFooterProps {
  children: ReactNode;
  bordered?: boolean;
}

export function FixedFooter({ children, bordered = false }: FixedFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        bordered && styles.bordered,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bordered: {
    borderTopColor: "rgba(26, 26, 46, 0.06)",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  root: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
