import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface GroupListItemProps {
  name: string;
  memberCount: number;
  inviteCode?: string;
  isFeatured?: boolean;
  isJoined: boolean;
  onPressJoin: () => void;
  onPressLeave?: () => void;
  onPress?: () => void;
}

function initials(name: string): string {
  const parts = name.replace(/[^\w\s]/g, "").trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + second).toUpperCase().slice(0, 2) || "??";
}

export function GroupListItem({
  name,
  memberCount,
  inviteCode,
  isFeatured,
  isJoined,
  onPressJoin,
  onPressLeave,
  onPress
}: GroupListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        onPress ? styles.cardInteractive : null,
        pressed && onPress ? styles.cardPressed : null
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={onPress ? `Open ${name}` : undefined}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{memberCount} members</Text>
            {isFeatured ? <Text style={styles.featured}>★ Featured</Text> : null}
          </View>
          {isJoined && inviteCode ? (
            <View style={styles.inviteRow}>
              <Text style={styles.inviteLabel}>Invite code</Text>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
            </View>
          ) : null}
          {isJoined && onPress ? (
            <Text style={styles.detailHint}>View members, leaderboard, and invite code</Text>
          ) : null}
        </View>
        {isJoined ? (
          <Pressable
            style={styles.joinedButton}
            onPress={onPressLeave}
            disabled={!onPressLeave}
            accessibilityLabel={`Leave ${name}`}
            accessibilityRole="button"
          >
            <Text style={styles.joinedText}>Joined</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.joinButton}
            onPress={onPressJoin}
            accessibilityLabel={`Join ${name}`}
            accessibilityRole="button"
          >
            <Text style={styles.joinText}>+ Join</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const AVATAR_SIZE = 48;

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: AVATAR_SIZE / 2,
    flexShrink: 0,
    height: AVATAR_SIZE,
    justifyContent: "center",
    width: AVATAR_SIZE,
  },
  avatarText: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  cardInteractive: {
    borderColor: opacity.red50,
    borderWidth: 1
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  detailHint: {
    ...typography.caption,
    color: opacity.ink55,
    marginTop: spacing.xs,
  },
  featured: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
  },
  joinButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    flexShrink: 0,
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  joinText: {
    ...typography.caption,
    color: colors.cream,
    fontFamily: typography.label.fontFamily,
  },
  inviteCode: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.6
  },
  inviteLabel: {
    color: opacity.ink55,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  inviteRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  joinedButton: {
    alignSelf: "flex-start",
    backgroundColor: opacity.ink12,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexShrink: 0,
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  joinedText: {
    ...typography.caption,
    color: colors.ink,
    fontFamily: typography.label.fontFamily,
  },
  meta: {
    ...typography.caption,
    color: opacity.ink60,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2
  },
  name: {
    ...typography.headingCard,
    color: colors.ink,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
});
