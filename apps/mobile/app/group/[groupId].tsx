import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import { BackButton } from "../../src/components/common/BackButton";
import { useGroups } from "../../src/features/groups";
import {
  COUNTRY_ALL,
  LeaderboardRow,
  buildLeaderboardRows
} from "../../src/features/leaderboard";
import { useOnboarding } from "../../src/features/onboarding";
import { useTrivia } from "../../src/features/trivia";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = typeof params.groupId === "string" ? params.groupId : "";

  const { getGroupById, leaveGroup, isJoined } = useGroups();
  const { displayName, nation } = useOnboarding();
  const { totalPoints } = useTrivia();
  const group = getGroupById(groupId);
  const joined = isJoined(groupId);

  const rows = useMemo(() => {
    const name = displayName.trim() || "You";
    const countryCode = nation?.code ?? "USA";
    return buildLeaderboardRows("overall", COUNTRY_ALL, {
      id: "me",
      displayName: name,
      countryCode,
      scores: {
        overall: totalPoints,
        trivia: totalPoints,
        prediction: 0,
        showcase: 0,
        bracket: 0
      }
    }).slice(0, 8);
  }, [displayName, nation, totalPoints]);

  if (!group) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <BackButton tint="light" />
        <View style={styles.centered}>
          <Text style={styles.missingTitle}>Group not found</Text>
          <Text style={styles.missingBody}>
            This group may have been removed.
          </Text>
          <Pressable style={styles.primary} onPress={() => router.back()}>
            <Text style={styles.primaryText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleShareInvite = async () => {
    if (!group.inviteCode) {
      Alert.alert("No invite code", "This group has no shareable invite code yet.");
      return;
    }
    try {
      await Share.share({
        message: `Join my group "${group.name}" with invite code ${group.inviteCode}`
      });
    } catch {
      // user cancelled
    }
  };

  const handleLeave = () => {
    Alert.alert(
      "Leave group?",
      `You'll need an invite to rejoin "${group.name}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            leaveGroup(group.id);
            router.back();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <BackButton tint="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroName} numberOfLines={2}>
            {group.name}
          </Text>
          <Text style={styles.heroMeta}>
            {group.memberCount} members  ·  {group.visibility === "private" ? "Private" : "Public"}
          </Text>
          {group.isFeatured ? <Text style={styles.featured}>★ FEATURED</Text> : null}
        </View>

        {group.inviteCode ? (
          <View style={styles.inviteCard}>
            <Text style={styles.inviteLabel}>INVITE CODE</Text>
            <Text style={styles.inviteCode}>{group.inviteCode}</Text>
            <Pressable style={styles.shareButton} onPress={handleShareInvite}>
              <Text style={styles.shareButtonText}>📤  Share invite</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Leaderboard</Text>
          <Text style={styles.sectionBody}>
            Mock — same data as the global leaderboard for now. Real version scopes to group members.
          </Text>
          <View style={styles.list}>
            {rows.map((row) => {
              const nationConfig = SUPPORTED_NATIONS.find(
                (n) => n.code === row.countryCode
              );
              return (
                <LeaderboardRow
                  key={row.id}
                  rank={row.rank}
                  displayName={row.displayName}
                  countryCode={row.countryCode}
                  score={row.score}
                  isCurrentUser={row.isCurrentUser}
                />
              );
            })}
          </View>
        </View>

        {joined ? (
          <Pressable style={styles.leaveButton} onPress={handleLeave}>
            <Text style={styles.leaveText}>Leave group</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  content: {
    padding: spacing.lg,
    paddingTop: 64
  },
  featured: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: spacing.xs
  },
  heroAvatar: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    width: 84
  },
  heroAvatarText: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: "900"
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg
  },
  heroMeta: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  heroName: {
    color: colors.cream,
    fontSize: 24,
    fontWeight: "900",
    marginTop: spacing.md,
    textAlign: "center"
  },
  inviteCard: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.14)",
    borderColor: colors.gold,
    borderRadius: radius.lg,
    borderWidth: 2,
    marginTop: spacing.md,
    padding: spacing.lg
  },
  inviteCode: {
    color: colors.cream,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: spacing.xs
  },
  inviteLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  leaveButton: {
    marginTop: spacing.lg,
    padding: spacing.sm
  },
  leaveText: {
    color: "#FF7B6B",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  list: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    overflow: "hidden"
  },
  missingBody: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  missingTitle: {
    color: colors.cream,
    fontSize: 22,
    fontWeight: "900"
  },
  primary: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md
  },
  primaryText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  section: {
    marginTop: spacing.lg
  },
  sectionBody: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  shareButton: {
    backgroundColor: colors.pitch,
    borderRadius: 999,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm
  },
  shareButtonText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: "900"
  }
});
