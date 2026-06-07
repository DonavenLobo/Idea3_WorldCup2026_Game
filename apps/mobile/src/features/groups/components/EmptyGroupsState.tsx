import { StyleSheet, Text, View } from "react-native";
import { BrandButton } from "../../../components/brand";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

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

      <BrandButton
        label="#  Join by Code"
        onPress={onJoinByCode}
        style={styles.primaryCta}
      />

      <BrandButton
        label="🔍  Browse Public Groups"
        onPress={onBrowse}
        variant="secondary"
        style={styles.cta}
      />

      <BrandButton
        label="+  Create Group"
        onPress={onCreate}
        variant="ghost"
        style={styles.ghostCta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typography.body,
    color: opacity.ink60,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    margin: spacing.lg,
    padding: spacing.xl,
  },
  cta: {
    marginTop: spacing.sm,
    width: "100%",
  },
  primaryCta: {
    marginTop: spacing.lg,
    width: "100%",
  },
  ghostCta: {
    marginTop: spacing.md,
    width: "100%",
  },
  icon: {
    fontSize: 44,
  },
  title: {
    ...typography.headingCard,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
