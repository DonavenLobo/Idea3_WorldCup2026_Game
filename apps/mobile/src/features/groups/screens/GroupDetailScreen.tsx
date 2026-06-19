import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEADERBOARD_STAGES, SUPPORTED_NATIONS } from "@gogaffa/config";
import { TeamLogo } from "../../../components/team";
import type { LeaderboardStage } from "@gogaffa/config";
import { useSession } from "../../auth/hooks/useSession";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { useGroups } from "../GroupsContext";
import {
  getGroupDetail,
  listGroupMembers,
  type GroupMember
} from "../api/groups";
import type { JoinedGroup } from "../types";
import {
  COUNTRY_ALL,
  FilterDropdown,
  LeaderboardRow,
  filterLeaderboardRows,
  getLeaderboardRows,
  uniqueCountryCodes
} from "../../leaderboard";
import type { CountryFilter, FilterOption } from "../../leaderboard";
import { MemberActions, useBlockedUsers } from "../../moderation";
import { getErrorMessage } from "../../../utils/errors";

type DetailTab = "leaderboard" | "members";

function roleLabel(role: GroupMember["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function nationName(code: string): string {
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  return nation?.name ?? code;
}

function formatJoinedDate(value: string): string {
  const joinedAt = new Date(value);
  if (Number.isNaN(joinedAt.getTime())) return "Joined recently";
  return `Joined ${joinedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  })}`;
}

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groupId = paramValue(params.groupId);
  const { user } = useSession();
  const { joinedGroups } = useGroups();
  const [tab, setTab] = useState<DetailTab>("leaderboard");

  const cachedGroup = useMemo(
    () => joinedGroups.find((group) => group.id === groupId) ?? null,
    [groupId, joinedGroups]
  );

  const detailQuery = useQuery({
    queryKey: ["groups", "detail", groupId, user?.id ?? null],
    enabled: Boolean(groupId && user),
    queryFn: () => getGroupDetail(groupId)
  });

  const membersQuery = useQuery({
    queryKey: ["groups", "members", groupId, user?.id ?? null],
    enabled: Boolean(groupId && user),
    queryFn: () => listGroupMembers(groupId)
  });

  const group = cachedGroup ?? detailQuery.data ?? null;
  const inviteCode = group?.inviteCode ?? "";

  const copyInviteCode = async () => {
    if (!inviteCode) return;

    try {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert("Copied", "Invite code copied to your clipboard.");
    } catch {
      Alert.alert("Invite code", inviteCode);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backText}>{"<"}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Group</Text>
          <View style={styles.backSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {detailQuery.error ? (
          <Text style={styles.errorText}>
            {getErrorMessage(detailQuery.error, "Could not load this group.")}
          </Text>
        ) : null}

        {!groupId ? (
          <Text style={styles.statusText}>Missing group ID.</Text>
        ) : !group && detailQuery.isLoading ? (
          <Text style={styles.statusText}>Loading group...</Text>
        ) : !group ? (
          <Text style={styles.statusText}>Group not found, or you are not a member.</Text>
        ) : (
          <>
            <GroupHero group={group} inviteCode={inviteCode} onCopyInviteCode={copyInviteCode} />

            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segment, tab === "leaderboard" ? styles.segmentActive : null]}
                onPress={() => setTab("leaderboard")}
                accessibilityLabel="Show group leaderboard"
                accessibilityRole="button"
              >
                <Text style={[styles.segmentText, tab === "leaderboard" ? styles.segmentTextActive : null]}>
                  Leaderboard
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segment, tab === "members" ? styles.segmentActive : null]}
                onPress={() => setTab("members")}
                accessibilityLabel="Show group members"
                accessibilityRole="button"
              >
                <Text style={[styles.segmentText, tab === "members" ? styles.segmentTextActive : null]}>
                  Members
                </Text>
              </Pressable>
            </View>

            {tab === "leaderboard" ? (
              <GroupLeaderboard groupId={group.id} currentUserId={user?.id ?? null} />
            ) : (
              <MembersPanel
                members={membersQuery.data ?? []}
                currentUserId={user?.id ?? null}
                groupId={group.id}
                isLoading={membersQuery.isLoading}
                error={membersQuery.error}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function GroupHero({
  group,
  inviteCode,
  onCopyInviteCode
}: {
  group: JoinedGroup;
  inviteCode: string;
  onCopyInviteCode: () => void;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.kicker}>{group.visibility === "public" ? "Public group" : "Private group"}</Text>
      <Text style={styles.groupName}>{group.name}</Text>
      <Text style={styles.groupMeta}>
        {group.memberCount} members - {group.role ? roleLabel(group.role) : "Member"}
      </Text>

      <View style={styles.inviteCard}>
        <View>
          <Text style={styles.inviteLabel}>Invite code</Text>
          <Text style={styles.inviteCode}>{inviteCode || "Unavailable"}</Text>
        </View>
        <Pressable
          style={[styles.copyButton, !inviteCode ? styles.copyButtonDisabled : null]}
          onPress={onCopyInviteCode}
          disabled={!inviteCode}
          accessibilityLabel="Copy invite code"
          accessibilityRole="button"
        >
          <Text style={styles.copyButtonText}>Copy</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MembersPanel({
  members,
  currentUserId,
  groupId,
  isLoading,
  error
}: {
  members: GroupMember[];
  currentUserId: string | null;
  groupId: string;
  isLoading: boolean;
  error: unknown;
}) {
  const { blockedSet } = useBlockedUsers();
  const visibleMembers = members.filter(
    (member) => member.userId === currentUserId || !blockedSet.has(member.userId)
  );

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.sectionTitle}>Members</Text>
        <Text style={styles.sectionCount}>{visibleMembers.length}</Text>
      </View>

      {isLoading ? (
        <Text style={styles.panelStatus}>Loading members...</Text>
      ) : error ? (
        <Text style={styles.panelStatus}>
          {getErrorMessage(error, "Could not load members.")}
        </Text>
      ) : visibleMembers.length === 0 ? (
        <Text style={styles.panelStatus}>No members found yet.</Text>
      ) : (
        <View style={styles.memberList}>
          {visibleMembers.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              groupId={groupId}
              isCurrentUser={member.userId === currentUserId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  groupId
}: {
  member: GroupMember;
  isCurrentUser: boolean;
  groupId: string;
}) {
  return (
    <View style={[styles.memberRow, isCurrentUser ? styles.memberRowCurrent : null]}>
      <View style={styles.memberAvatar}>
        <TeamLogo code={member.countryCode} size={34} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {member.displayName}{isCurrentUser ? " (You)" : ""}
        </Text>
        <Text style={styles.memberMeta} numberOfLines={1}>
          {nationName(member.countryCode)} - {formatJoinedDate(member.joinedAt)}
        </Text>
      </View>
      <View style={styles.rolePill}>
        <Text style={styles.roleText}>{roleLabel(member.role)}</Text>
      </View>
      {isCurrentUser ? null : (
        <MemberActions
          context="group_member"
          contextId={groupId}
          displayName={member.displayName}
          userId={member.userId}
        />
      )}
    </View>
  );
}

function GroupLeaderboard({
  groupId,
  currentUserId
}: {
  groupId: string;
  currentUserId: string | null;
}) {
  const [stage, setStage] = useState<LeaderboardStage>("overall");
  const [country, setCountry] = useState<CountryFilter>(COUNTRY_ALL);
  const { blockedSet } = useBlockedUsers();

  const stageOptions: FilterOption<LeaderboardStage>[] = useMemo(
    () => LEADERBOARD_STAGES.map((s) => ({ id: s.id, label: s.label })),
    []
  );

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", "group", groupId, stage, currentUserId],
    enabled: Boolean(currentUserId),
    queryFn: () => getLeaderboardRows({
      currentUserId,
      groupId,
      stage
    })
  });

  const allRows = leaderboardQuery.data ?? [];

  const countryOptions: FilterOption<CountryFilter>[] = useMemo(() => {
    const codes = uniqueCountryCodes(allRows);
    const opts: FilterOption<CountryFilter>[] = [{ id: COUNTRY_ALL, label: "All" }];
    for (const code of codes) {
      const nationConfig = SUPPORTED_NATIONS.find((n) => n.code === code);
      opts.push({
        id: code,
        label: nationConfig?.name ?? code
      });
    }
    return opts;
  }, [allRows]);

  const rows = useMemo(
    () =>
      filterLeaderboardRows(allRows, country).filter(
        (row) => row.isCurrentUser || !blockedSet.has(row.id)
      ),
    [allRows, blockedSet, country]
  );

  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      <View style={styles.filterRow}>
        <FilterDropdown<CountryFilter>
          label="Country"
          value={country}
          options={countryOptions}
          onSelect={setCountry}
        />
        <FilterDropdown<LeaderboardStage>
          label="Stage"
          value={stage}
          options={stageOptions}
          onSelect={setStage}
        />
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.colRank}>Rank</Text>
        <Text style={styles.colName}>Display Name</Text>
        <Text style={styles.colScore}>Total Pts</Text>
      </View>

      <View style={styles.table}>
        {leaderboardQuery.isLoading ? (
          <Text style={styles.panelStatus}>Loading leaderboard...</Text>
        ) : leaderboardQuery.error ? (
          <Text style={styles.panelStatus}>
            {getErrorMessage(leaderboardQuery.error, "Could not load leaderboard.")}
          </Text>
        ) : rows.length === 0 ? (
          <Text style={styles.panelStatus}>No leaderboard rows yet.</Text>
        ) : (
          rows.map((row) => (
            <LeaderboardRow
              key={row.id}
              rank={row.rank}
              displayName={row.displayName}
              countryCode={row.countryCode}
              score={row.score}
              isCurrentUser={row.isCurrentUser}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  backSpacer: {
    width: 36
  },
  backText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  colName: {
    color: opacity.ink60,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: spacing.md + 44
  },
  colRank: {
    color: opacity.ink60,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center"
  },
  colScore: {
    color: opacity.ink60,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 70,
    textAlign: "right"
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  copyButton: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  copyButtonDisabled: {
    opacity: 0.5
  },
  copyButtonText: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: "700"
  },
  errorText: {
    backgroundColor: opacity.red18,
    borderColor: opacity.ink15,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: spacing.md,
    padding: spacing.md
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  groupMeta: {
    color: opacity.ink60,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  groupName: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginTop: spacing.sm
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  headerSafeArea: {
    backgroundColor: colors.cream
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  hero: {
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg
  },
  inviteCard: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    padding: spacing.md
  },
  inviteCode: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2
  },
  inviteLabel: {
    color: opacity.ink55,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  kicker: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  memberAvatar: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  memberInfo: {
    flex: 1
  },
  memberList: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    overflow: "hidden"
  },
  memberMeta: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  memberName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  memberRow: {
    alignItems: "center",
    borderBottomColor: opacity.ink12,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  memberRowCurrent: {
    backgroundColor: opacity.red18
  },
  panel: {
    marginTop: spacing.lg
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  panelStatus: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    padding: spacing.lg,
    textAlign: "center"
  },
  rolePill: {
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  roleText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  sectionCount: {
    color: opacity.ink55,
    fontSize: 13,
    fontWeight: "700"
  },
  sectionTitle: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.sm
  },
  segmentActive: {
    backgroundColor: colors.red
  },
  segmentRow: {
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: 4
  },
  segmentText: {
    color: opacity.ink55,
    fontSize: 13,
    fontWeight: "700"
  },
  segmentTextActive: {
    color: colors.cream
  },
  statusText: {
    color: opacity.ink60,
    fontSize: 14,
    fontWeight: "700",
    padding: spacing.lg,
    textAlign: "center"
  },
  table: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    overflow: "hidden",
    paddingBottom: spacing.xs,
    paddingTop: spacing.md
  },
  tableHeader: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: radius.sm,
    flexDirection: "row",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
