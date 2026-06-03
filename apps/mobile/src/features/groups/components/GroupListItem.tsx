import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

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
          <Text style={styles.name} numberOfLines={1}>
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

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  avatarText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "900"
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  cardInteractive: {
    borderColor: "rgba(214, 161, 30, 0.45)",
    borderWidth: 1
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  detailHint: {
    color: "rgba(12, 59, 46, 0.5)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  featured: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800"
  },
  joinButton: {
    backgroundColor: colors.pitch,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  joinText: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: "900"
  },
  inviteCode: {
    color: colors.pitch,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.6
  },
  inviteLabel: {
    color: "rgba(12, 59, 46, 0.55)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  inviteRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(12, 59, 46, 0.08)",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  joinedButton: {
    backgroundColor: "rgba(12, 59, 46, 0.1)",
    borderColor: colors.pitch,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  joinedText: {
    color: colors.pitch,
    fontSize: 13,
    fontWeight: "900"
  },
  meta: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 13,
    fontWeight: "700"
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2
  },
  name: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  text: {
    flex: 1
  }
});
