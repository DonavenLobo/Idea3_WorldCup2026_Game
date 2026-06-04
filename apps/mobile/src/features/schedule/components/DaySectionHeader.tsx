import { StyleSheet, Text } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function DaySectionHeader({ title }: { title: string }) {
  return <Text style={styles.header}>{title}</Text>;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.pitch,
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: "uppercase"
  }
});
