import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LEADERBOARD_STAGES, SUPPORTED_NATIONS } from "@gogaffa/config";
import type { LeaderboardStage } from "@gogaffa/config";
import { BrandButton, Eyebrow } from "../../../components/brand";
import { Screen } from "../../../components/layout";
import { useSession } from "../../auth/hooks/useSession";
import {
  COUNTRY_ALL,
  FilterDropdown,
  LeaderboardRow,
  filterLeaderboardRows,
  getLeaderboardRows,
  uniqueCountryCodes
} from "../../leaderboard";
import type { CountryFilter, FilterOption } from "../../leaderboard";
import { CreateGroupSheet } from "../components/CreateGroupSheet";
import { EmptyGroupsState } from "../components/EmptyGroupsState";
import { GroupListItem } from "../components/GroupListItem";
import { JoinByCodeSheet } from "../components/JoinByCodeSheet";
import { useGroups } from "../GroupsContext";
import type { CreateGroupInput } from "../api/groups";
import type { GroupsSubTab, JoinedGroup, PublicGroup } from "../types";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { getErrorMessage } from "../../../utils/errors";

type SheetState = "none" | "join" | "create";

export function GroupsScreen() {
  const {
    joinedGroups,
    publicGroups,
    error,
    isLoading,
    isJoined,
    joinPublicGroup,
    leaveGroup,
    joinByCode,
    createGroup
  } = useGroups();
  const [subTab, setSubTab] = useState<GroupsSubTab>("my");
  const [sheet, setSheet] = useState<SheetState>("none");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const filteredPublic = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return publicGroups;
    return publicGroups.filter((g) => g.name.toLowerCase().includes(term));
  }, [publicGroups, search]);

  const featured = filteredPublic.filter((g) => g.isFeatured);
  const standard = filteredPublic.filter((g) => !g.isFeatured);

  const handleJoinByCode = async (code: string) => {
    try {
      const group = await joinByCode(code);
      setSheet("none");
      Alert.alert("Joined!", `You're in "${group.name}".`);
      setSubTab("my");
    } catch (joinError) {
      Alert.alert(
        "Could not join group",
        getErrorMessage(joinError, "Check the invite code and try again.")
      );
    }
  };

  const handleCreate = async (input: CreateGroupInput) => {
    try {
      const group = await createGroup(input);
      setSheet("none");
      Alert.alert(
        "Group created",
        group.inviteCode
          ? `"${group.name}" is ready.\n\nInvite code: ${group.inviteCode}`
          : `"${group.name}" is ready. Share the invite code to add friends.`
      );
      setSubTab("my");
    } catch (createError) {
      Alert.alert(
        "Could not create group",
        getErrorMessage(createError, "Try again in a moment.")
      );
    }
  };

  const handlePublicJoin = async (g: PublicGroup) => {
    try {
      const group = await joinPublicGroup(g.id);
      Alert.alert("Joined!", `You're in "${group.name}".`);
    } catch (joinError) {
      Alert.alert(
        "Could not join group",
        getErrorMessage(joinError, "Try again in a moment.")
      );
    }
  };

  const handleLeaveGroup = (groupId: string) => {
    Alert.alert(
      "Leave group?",
      "If you own this group, leaving deletes it for everyone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            void leaveGroup(groupId).catch((leaveError) => {
              Alert.alert(
                "Could not leave group",
                getErrorMessage(leaveError, "Try again in a moment.")
              );
            });
          }
        }
      ]
    );
  };

  const handleOpenGroup = (groupId: string) => {
    router.push(`/group/${groupId}`);
  };

  return (
    <View style={styles.root}>
      <View style={styles.subTabRow}>
        <Pressable
          style={[styles.subTab, subTab === "my" ? styles.subTabActive : null]}
          onPress={() => setSubTab("my")}
        >
          <Text style={[styles.subTabText, subTab === "my" ? styles.subTabTextActive : null]}>
            My Groups
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, subTab === "discover" ? styles.subTabActive : null]}
          onPress={() => setSubTab("discover")}
        >
          <Text style={[styles.subTabText, subTab === "discover" ? styles.subTabTextActive : null]}>
            Discover
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, subTab === "leaderboard" ? styles.subTabActive : null]}
          onPress={() => setSubTab("leaderboard")}
        >
          <Text style={[styles.subTabText, subTab === "leaderboard" ? styles.subTabTextActive : null]}>
            Leaderboard
          </Text>
        </Pressable>
      </View>

      <Screen
        scroll
        ref={scrollRef}
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.content}
      >
        {error ? (
          <Text style={styles.errorText}>{error.message}</Text>
        ) : null}
        {subTab === "my" &&
          (isLoading && joinedGroups.length === 0 ? (
            <Text style={styles.statusText}>Loading your groups...</Text>
          ) : joinedGroups.length === 0 ? (
            <EmptyGroupsState
              onJoinByCode={() => setSheet("join")}
              onBrowse={() => setSubTab("discover")}
              onCreate={() => setSheet("create")}
            />
          ) : (
            <MyGroupsList
              groups={joinedGroups}
              onLeave={handleLeaveGroup}
              onOpenGroup={handleOpenGroup}
              onJoinByCode={() => setSheet("join")}
              onCreate={() => setSheet("create")}
            />
          ))}

        {subTab === "discover" && (
          <DiscoverPanel
            featured={featured}
            standard={standard}
            isLoading={isLoading}
            search={search}
            onSearch={setSearch}
            isJoined={isJoined}
            onJoinPublic={handlePublicJoin}
            onLeave={handleLeaveGroup}
            onOpenGroup={handleOpenGroup}
            onCreate={() => setSheet("create")}
            onCode={() => setSheet("join")}
          />
        )}

        {subTab === "leaderboard" && <LeaderboardPanel group={joinedGroups[0] ?? null} />}
      </Screen>

      <JoinByCodeSheet
        visible={sheet === "join"}
        onDismiss={() => setSheet("none")}
        onSubmit={handleJoinByCode}
      />
      <CreateGroupSheet
        visible={sheet === "create"}
        onDismiss={() => setSheet("none")}
        onSubmit={handleCreate}
      />
    </View>
  );
}

function MyGroupsList({
  groups,
  onLeave,
  onOpenGroup,
  onJoinByCode,
  onCreate
}: {
  groups: JoinedGroup[];
  onLeave: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onJoinByCode: () => void;
  onCreate: () => void;
}) {
  return (
    <View style={styles.padded}>
      <View style={styles.sectionEyebrow}>
        <Eyebrow label={`Joined (${groups.length})`} />
      </View>
      {groups.map((g) => (
        <GroupListItem
          key={g.id}
          name={g.name}
          memberCount={g.memberCount}
          inviteCode={g.inviteCode}
          isFeatured={g.isFeatured}
          isJoined
          onPressJoin={() => undefined}
          onPressLeave={() => onLeave(g.id)}
          onPress={() => onOpenGroup(g.id)}
        />
      ))}

      <View style={[styles.shortcutRow, styles.shortcutRowSpaced]}>
        <BrandButton label="#  Join by Code" onPress={onJoinByCode} />
        <BrandButton
          label="+  Create Group"
          variant="secondary"
          onPress={onCreate}
        />
      </View>
    </View>
  );
}

function DiscoverPanel({
  featured,
  standard,
  isLoading,
  search,
  onSearch,
  isJoined,
  onJoinPublic,
  onLeave,
  onOpenGroup,
  onCreate,
  onCode
}: {
  featured: readonly PublicGroup[];
  standard: readonly PublicGroup[];
  isLoading: boolean;
  search: string;
  onSearch: (v: string) => void;
  isJoined: (id: string) => boolean;
  onJoinPublic: (g: PublicGroup) => void;
  onLeave: (id: string) => void;
  onOpenGroup: (id: string) => void;
  onCreate: () => void;
  onCode: () => void;
}) {
  return (
    <View style={styles.padded}>
      <View style={styles.shortcutRow}>
        <BrandButton label="#  Join by Code" onPress={onCode} />
        <BrandButton
          label="+  Create Group"
          variant="secondary"
          onPress={onCreate}
        />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search public groups"
        placeholderTextColor={opacity.ink35}
        value={search}
        onChangeText={onSearch}
        autoCorrect={false}
      />

      {featured.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionEyebrow}>
            <Eyebrow label="★ Featured" />
          </View>
          {featured.map((g) => (
            <GroupListItem
              key={g.id}
              name={g.name}
              memberCount={g.memberCount}
              isFeatured
              isJoined={isJoined(g.id)}
              onPressJoin={() => onJoinPublic(g)}
              onPressLeave={() => onLeave(g.id)}
              onPress={isJoined(g.id) ? () => onOpenGroup(g.id) : undefined}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionEyebrow}>
          <Eyebrow label="Public Groups" />
        </View>
        {standard.length === 0 ? (
          <Text style={styles.empty}>
            {isLoading ? "Loading public groups..." : "No groups match that search."}
          </Text>
        ) : (
          standard.map((g) => (
            <GroupListItem
              key={g.id}
              name={g.name}
              memberCount={g.memberCount}
              isJoined={isJoined(g.id)}
              onPressJoin={() => onJoinPublic(g)}
              onPressLeave={() => onLeave(g.id)}
              onPress={isJoined(g.id) ? () => onOpenGroup(g.id) : undefined}
            />
          ))
        )}
      </View>
    </View>
  );
}

function LeaderboardPanel({ group }: { group: JoinedGroup | null }) {
  const { user } = useSession();
  const [stage, setStage] = useState<LeaderboardStage>("overall");
  const [country, setCountry] = useState<CountryFilter>(COUNTRY_ALL);
  const groupId = group?.id ?? null;

  const stageOptions: FilterOption<LeaderboardStage>[] = useMemo(
    () => LEADERBOARD_STAGES.map((s) => ({ id: s.id, label: s.label })),
    []
  );

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", groupId, stage, user?.id ?? null],
    enabled: Boolean(user),
    queryFn: () => getLeaderboardRows({
      currentUserId: user?.id ?? null,
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
    () => filterLeaderboardRows(allRows, country),
    [allRows, country]
  );

  return (
    <View style={styles.padded}>
      <View style={styles.sectionEyebrow}>
        <Eyebrow label={group ? `${group.name} leaderboard` : "Global leaderboard"} />
      </View>
      <View style={lbStyles.filterRow}>
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

      <View style={lbStyles.tableHeader}>
        <Text style={lbStyles.colRank}>Rank</Text>
        <Text style={lbStyles.colName}>Display Name</Text>
        <Text style={lbStyles.colScore}>Total Pts</Text>
      </View>

      <View style={lbStyles.table}>
        {leaderboardQuery.isLoading ? (
          <Text style={styles.tableStatus}>Loading leaderboard...</Text>
        ) : leaderboardQuery.error ? (
          <Text style={styles.tableStatus}>
            {getErrorMessage(leaderboardQuery.error, "Could not load leaderboard.")}
          </Text>
        ) : rows.length === 0 ? (
          <Text style={styles.tableStatus}>No leaderboard rows yet.</Text>
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
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: 0
  },
  empty: {
    color: opacity.ink35,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  errorText: {
    backgroundColor: opacity.red18,
    borderColor: opacity.ink12,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.red,
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md
  },
  padded: {
    padding: spacing.lg
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  search: {
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  section: {
    marginTop: spacing.lg
  },
  sectionEyebrow: {
    marginBottom: spacing.sm
  },
  shortcutRow: {
    gap: spacing.sm,
  },
  shortcutRowSpaced: {
    marginTop: spacing.lg,
  },
  statusText: {
    color: opacity.ink70,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    fontWeight: "700",
    padding: spacing.lg,
    textAlign: "center"
  },
  subTab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.sm
  },
  subTabActive: {
    backgroundColor: colors.cream,
    borderColor: opacity.ink15,
    borderWidth: 1
  },
  subTabRow: {
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: 4
  },
  subTabText: {
    color: opacity.ink60,
    fontSize: 13,
    fontWeight: "700"
  },
  subTabTextActive: {
    color: colors.ink
  },
  tableStatus: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    padding: spacing.lg,
    textAlign: "center"
  }
});

const lbStyles = StyleSheet.create({
  colName: {
    color: opacity.ink70,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: spacing.md + 44
  },
  colRank: {
    color: opacity.ink70,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center"
  },
  colScore: {
    color: opacity.ink70,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 70,
    textAlign: "right"
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  table: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    overflow: "hidden",
    paddingBottom: spacing.xs,
    paddingTop: spacing.md
  },
  tableHeader: {
    alignItems: "center",
    backgroundColor: opacity.cream80,
    borderRadius: radius.sm,
    flexDirection: "row",
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
