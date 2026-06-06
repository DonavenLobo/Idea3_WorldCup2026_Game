import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";

export interface PanelCardProps {
  children: ReactNode;
  padding?: "default" | "compact";
  style?: StyleProp<ViewStyle>;
}

export function PanelCard({ children, padding = "default", style }: PanelCardProps) {
  return (
    <View
      style={[
        styles.card,
        shadows.contentPanel,
        padding === "compact" ? styles.compact : styles.default,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: opacity.cream75,
    borderColor: opacity.ink15,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  compact: {
    padding: spacing.md,
  },
  default: {
    padding: spacing.lg,
  },
});
