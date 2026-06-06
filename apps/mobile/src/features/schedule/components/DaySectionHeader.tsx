import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

export function DaySectionHeader({
  title,
  isFirst = false,
}: {
  title: string;
  isFirst?: boolean;
}) {
  return (
    <View style={[styles.wrap, isFirst ? styles.wrapFirst : null]}>
      <Text style={styles.header}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.label,
    color: colors.red,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  wrap: {
    backgroundColor: colors.cream,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  wrapFirst: {
    paddingTop: spacing.md,
  },
});
