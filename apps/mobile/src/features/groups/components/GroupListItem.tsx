import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface GroupListItemProps {
  name: string;
  memberCount: number;
  isFeatured?: boolean;
  isJoined: boolean;
  onPressJoin: () => void;
  onPressLeave?: () => void;
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
  isFeatured,
  isJoined,
  onPressJoin,
  onPressLeave
}: GroupListItemProps) {
  return (
    <View style={styles.card}>
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
        </View>
        {isJoined ? (
          <Pressable style={styles.joinedButton} onPress={onPressLeave} disabled={!onPressLeave}>
            <Text style={styles.joinedText}>Joined</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.joinButton} onPress={onPressJoin}>
            <Text style={styles.joinText}>+ Join</Text>
          </Pressable>
        )}
      </View>
    </View>
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
