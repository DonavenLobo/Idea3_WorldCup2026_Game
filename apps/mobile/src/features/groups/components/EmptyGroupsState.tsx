import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface EmptyGroupsStateProps {
  onJoinByCode: () => void;
  onBrowse: () => void;
  onCreate: () => void;
}

export function EmptyGroupsState({ onJoinByCode, onBrowse, onCreate }: EmptyGroupsStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>👥</Text>
      <Text style={styles.title}>No groups yet</Text>
      <Text style={styles.body}>
        Got an invite code? Join a private group, browse public groups, or start your own.
      </Text>

      <Pressable style={styles.primary} onPress={onJoinByCode}>
        <Text style={styles.primaryText}>#  Join by Code</Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={onBrowse}>
        <Text style={styles.secondaryText}>🔍  Browse Public Groups</Text>
      </Pressable>

      <Pressable style={styles.tertiary} onPress={onCreate}>
        <Text style={styles.tertiaryText}>＋  Create Group</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "rgba(12, 59, 46, 0.7)",
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    margin: spacing.lg,
    padding: spacing.xl
  },
  icon: {
    fontSize: 44
  },
  primary: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%"
  },
  primaryText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900"
  },
  secondary: {
    alignItems: "center",
    backgroundColor: "rgba(12, 59, 46, 0.06)",
    borderColor: "rgba(12, 59, 46, 0.18)",
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%"
  },
  secondaryText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  tertiary: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.sm
  },
  tertiaryText: {
    color: colors.pitch,
    fontSize: 15,
    fontWeight: "800"
  },
  title: {
    color: colors.pitch,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.md
  }
});
