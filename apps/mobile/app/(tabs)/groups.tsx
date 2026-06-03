import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { LEADERBOARD_STAGES, PUBLIC_GROUPS, SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { LeaderboardStage } from "@world-cup-game/config";
import {
  CreateGroupSheet,
  EmptyGroupsState,
  GroupListItem,
  JoinByCodeSheet,
  useGroups
} from "../../src/features/groups";
import type { GroupsSubTab, JoinedGroup, PublicGroup } from "../../src/features/groups";
import {
  COUNTRY_ALL,
  FilterDropdown,
  LeaderboardRow,
  buildLeaderboardRows,
  uniqueCountryCodes
} from "../../src/features/leaderboard";
import type { CountryFilter, FilterOption } from "../../src/features/leaderboard";
import { useOnboarding } from "../../src/features/onboarding";
import { useTrivia } from "../../src/features/trivia";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";

type SheetState = "none" | "join" | "create";

export default function GroupsScreen() {
  const router = useRouter();
  const { joinedGroups, isJoined, joinPublicGroup, leaveGroup, joinByCode, createGroup } = useGroups();
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
    if (term.length === 0) return PUBLIC_GROUPS;
    return PUBLIC_GROUPS.filter((g) => g.name.toLowerCase().includes(term));
  }, [search]);

  const featured = filteredPublic.filter((g) => g.isFeatured);
  const standard = filteredPublic.filter((g) => !g.isFeatured);

  const handleJoinByCode = (code: string) => {
    const group = joinByCode(code);
    setSheet("none");
    if (group) {
      Alert.alert("Joined!", `You're in "${group.name}".`);
      setSubTab("my");
    }
  };

  const handleCreate = (input: { name: string; visibility: "public" | "private" }) => {
    const group = createGroup(input);
    setSheet("none");
    setSubTab("my");
    if (group.inviteCode) {
      Alert.alert(
        "Group created!",
        `"${group.name}" is ready.\n\nInvite code: ${group.inviteCode}\n\nShare it with friends so they can join.`,
        [
          { text: "Done", style: "cancel" },
          {
            text: "Share invite",
            onPress: async () => {
              try {
                await Share.share({
                  message: `Join my group "${group.name}" with invite code ${group.inviteCode}`
                });
              } catch {
                // user cancelled
              }
            }
          }
        ]
      );
    } else {
      Alert.alert("Group created", `"${group.name}" is ready.`);
    }
  };

  const handlePublicJoin = (g: PublicGroup) => {
    joinPublicGroup(g.id);
    Alert.alert("Joined!", `You're in "${g.name}".`);
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

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {subTab === "my" &&
          (joinedGroups.length === 0 ? (
            <EmptyGroupsState
              onJoinByCode={() => setSheet("join")}
              onBrowse={() => setSubTab("discover")}
              onCreate={() => setSheet("create")}
            />
          ) : (
            <MyGroupsList
              groups={joinedGroups}
              onOpenDetail={(id) => router.push(`/group/${id}`)}
              onJoinByCode={() => setSheet("join")}
              onCreate={() => setSheet("create")}
            />
          ))}

        {subTab === "discover" && (
          <DiscoverPanel
            featured={featured}
            standard={standard}
            search={search}
            onSearch={setSearch}
            isJoined={isJoined}
            onJoinPublic={handlePublicJoin}
            onLeave={(id) => leaveGroup(id)}
            onCreate={() => setSheet("create")}
            onCode={() => setSheet("join")}
          />
        )}

        {subTab === "leaderboard" && <LeaderboardPanel />}
      </ScrollView>

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
  onOpenDetail,
  onJoinByCode,
  onCreate
}: {
  groups: JoinedGroup[];
  onOpenDetail: (id: string) => void;
  onJoinByCode: () => void;
  onCreate: () => void;
}) {
  return (
    <View style={styles.padded}>
      <Text style={styles.sectionTitle}>Joined ({groups.length})</Text>
      {groups.map((g) => (
        <Pressable key={g.id} onPress={() => onOpenDetail(g.id)}>
          <GroupListItem
            name={g.name}
            memberCount={g.memberCount}
            isFeatured={g.isFeatured}
            isJoined
            onPressJoin={() => undefined}
          />
        </Pressable>
      ))}

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionPrimary} onPress={onJoinByCode}>
          <Text style={styles.actionPrimaryText}>#  Join by Code</Text>
        </Pressable>
        <Pressable style={styles.actionSecondary} onPress={onCreate}>
          <Text style={styles.actionSecondaryText}>＋  Create Group</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DiscoverPanel({
  featured,
  standard,
  search,
  onSearch,
  isJoined,
  onJoinPublic,
  onLeave,
  onCreate,
  onCode
}: {
  featured: readonly PublicGroup[];
  standard: readonly PublicGroup[];
  search: string;
  onSearch: (v: string) => void;
  isJoined: (id: string) => boolean;
  onJoinPublic: (g: PublicGroup) => void;
  onLeave: (id: string) => void;
  onCreate: () => void;
  onCode: () => void;
}) {
  return (
    <View style={styles.padded}>
      <View style={styles.shortcutRow}>
        <Pressable style={styles.shortcutPrimary} onPress={onCode}>
          <Text style={styles.shortcutPrimaryText}>#  Join by Code</Text>
        </Pressable>
        <Pressable style={styles.shortcutSecondary} onPress={onCreate}>
          <Text style={styles.shortcutSecondaryText}>＋  Create</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search public groups"
        placeholderTextColor="rgba(255, 248, 234, 0.4)"
        value={search}
        onChangeText={onSearch}
        autoCorrect={false}
      />

      {featured.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>★ Featured</Text>
          {featured.map((g) => (
            <GroupListItem
              key={g.id}
              name={g.name}
              memberCount={g.memberCount}
              isFeatured
              isJoined={isJoined(g.id)}
              onPressJoin={() => onJoinPublic(g)}
              onPressLeave={() => onLeave(g.id)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Groups</Text>
        {standard.length === 0 ? (
          <Text style={styles.empty}>No groups match that search.</Text>
        ) : (
          standard.map((g) => (
            <GroupListItem
              key={g.id}
              name={g.name}
              memberCount={g.memberCount}
              isJoined={isJoined(g.id)}
              onPressJoin={() => onJoinPublic(g)}
              onPressLeave={() => onLeave(g.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

function LeaderboardPanel() {
  const { displayName, nation } = useOnboarding();
  const { totalPoints } = useTrivia();
  const [stage, setStage] = useState<LeaderboardStage>("overall");
  const [country, setCountry] = useState<CountryFilter>(COUNTRY_ALL);

  const stageOptions: FilterOption<LeaderboardStage>[] = useMemo(
    () => LEADERBOARD_STAGES.map((s) => ({ id: s.id, label: s.label })),
    []
  );

  const countryOptions: FilterOption<CountryFilter>[] = useMemo(() => {
    const codes = uniqueCountryCodes();
    const opts: FilterOption<CountryFilter>[] = [{ id: COUNTRY_ALL, label: "All" }];
    for (const code of codes) {
      const nationConfig = SUPPORTED_NATIONS.find((n) => n.code === code);
      opts.push({
        id: code,
        label: nationConfig ? `${nationConfig.flagEmoji} ${nationConfig.name}` : code
      });
    }
    return opts;
  }, []);

  const rows = useMemo(() => {
    const name = displayName.trim() || "You";
    const countryCode = nation?.code ?? "USA";
    return buildLeaderboardRows(stage, country, {
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
    });
  }, [displayName, nation, totalPoints, stage, country]);

  return (
    <View style={styles.padded}>
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
        {rows.map((row) => (
          <LeaderboardRow
            key={row.id}
            rank={row.rank}
            displayName={row.displayName}
            countryCode={row.countryCode}
            score={row.score}
            isCurrentUser={row.isCurrentUser}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionPrimary: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.md
  },
  actionPrimaryText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "900"
  },
  actionSecondary: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderColor: "rgba(255, 248, 234, 0.18)",
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.md
  },
  actionSecondaryText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "900"
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  content: {
    paddingBottom: spacing.xl
  },
  empty: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  padded: {
    padding: spacing.lg
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  search: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.18)",
    borderRadius: radius.pill,
    borderWidth: 1,
    color: colors.cream,
    fontSize: 15,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  section: {
    marginTop: spacing.lg
  },
  sectionTitle: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  shortcutPrimary: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    flex: 2,
    paddingVertical: spacing.md
  },
  shortcutPrimaryText: {
    color: colors.pitch,
    fontSize: 15,
    fontWeight: "900"
  },
  shortcutRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  shortcutSecondary: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderColor: "rgba(255, 248, 234, 0.18)",
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.md
  },
  shortcutSecondaryText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "900"
  },
  subTab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.sm
  },
  subTabActive: {
    backgroundColor: "rgba(255, 248, 234, 0.12)",
    borderColor: "rgba(255, 248, 234, 0.25)",
    borderWidth: 1
  },
  subTabRow: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: 4
  },
  subTabText: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 13,
    fontWeight: "900"
  },
  subTabTextActive: {
    color: colors.cream
  }
});

const lbStyles = StyleSheet.create({
  colName: {
    color: "rgba(12, 59, 46, 0.7)",
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: spacing.md + 44
  },
  colRank: {
    color: "rgba(12, 59, 46, 0.7)",
    fontSize: 13,
    fontWeight: "900",
    minWidth: 28,
    textAlign: "center"
  },
  colScore: {
    color: "rgba(12, 59, 46, 0.7)",
    fontSize: 13,
    fontWeight: "900",
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
    overflow: "hidden"
  },
  tableHeader: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.85)",
    borderRadius: radius.sm,
    flexDirection: "row",
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
