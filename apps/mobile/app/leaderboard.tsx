import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LEADERBOARD_STAGES, SUPPORTED_NATIONS } from "@gogaffa/config";
import type { LeaderboardStage } from "@gogaffa/config";
import {
  COUNTRY_ALL,
  FilterDropdown,
  LeaderboardRow,
  filterLeaderboardRows,
  getLeaderboardRows,
  leaderboardRowMetrics,
  uniqueCountryCodes,
} from "../src/features/leaderboard";
import type { CountryFilter, FilterOption } from "../src/features/leaderboard";
import { useSession } from "../src/features/auth";
import { useBlockedUsers } from "../src/features/moderation";
import { colors, opacity } from "../src/theme/colors";
import { radius } from "../src/theme/radius";
import { spacing } from "../src/theme/spacing";
import { typography } from "../src/theme/typography";
import { getErrorMessage } from "../src/utils/errors";

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  const [stage, setStage] = useState<LeaderboardStage>("overall");
  const [country, setCountry] = useState<CountryFilter>(COUNTRY_ALL);
  const { blockedSet } = useBlockedUsers();

  const stageOptions: FilterOption<LeaderboardStage>[] = useMemo(
    () => LEADERBOARD_STAGES.map((s) => ({ id: s.id, label: s.label })),
    []
  );

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", "global", stage, user?.id ?? null],
    enabled: Boolean(user),
    queryFn: () => getLeaderboardRows({
      currentUserId: user?.id ?? null,
      groupId: null,
      stage,
    }),
  });

  const allRows = leaderboardQuery.data ?? [];

  const countryOptions: FilterOption<CountryFilter>[] = useMemo(() => {
    const codes = uniqueCountryCodes(allRows);
    const opts: FilterOption<CountryFilter>[] = [{ id: COUNTRY_ALL, label: "All" }];
    for (const code of codes) {
      const nationConfig = SUPPORTED_NATIONS.find((n) => n.code === code);
      opts.push({
        id: code,
        label: nationConfig?.name ?? code,
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
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Leaderboard
          </Text>
          <View style={styles.backSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.filterRow}>
        <FilterDropdown<CountryFilter>
          label="Country of Residence"
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

      <View style={styles.tableHeaderWrap}>
        <View style={styles.tableHeader}>
          <Text style={styles.colRank}>Rank</Text>
          <View style={styles.colFlagSpacer} />
          <Text style={styles.colName}>Display Name</Text>
          <Text style={styles.colScore}>Total Pts</Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl },
        ]}
      >
        {leaderboardQuery.isLoading ? (
          <Text style={styles.status}>Loading leaderboard...</Text>
        ) : leaderboardQuery.error ? (
          <Text style={styles.status}>
            {getErrorMessage(leaderboardQuery.error, "Could not load leaderboard.")}
          </Text>
        ) : rows.length === 0 ? (
          <Text style={styles.status}>No leaderboard rows yet.</Text>
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
      </ScrollView>
    </View>
  );
}

const { rankWidth, flagSize, scoreWidth, horizontalMargin } = leaderboardRowMetrics;

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  backSpacer: {
    width: 36,
  },
  backText: {
    ...typography.label,
    color: colors.ink,
    fontSize: 20,
  },
  colFlagSpacer: {
    marginLeft: spacing.sm,
    width: flagSize,
  },
  colName: {
    ...typography.caption,
    color: opacity.ink70,
    flex: 1,
    fontFamily: typography.label.fontFamily,
    marginLeft: spacing.sm,
  },
  colRank: {
    ...typography.caption,
    color: opacity.ink70,
    fontFamily: typography.label.fontFamily,
    width: rankWidth,
  },
  colScore: {
    ...typography.caption,
    color: opacity.ink70,
    fontFamily: typography.label.fontFamily,
    marginLeft: spacing.sm,
    textAlign: "right",
    width: scoreWidth,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerSafeArea: {
    backgroundColor: colors.cream,
  },
  headerTitle: {
    ...typography.titleScreen,
    color: colors.ink,
    flex: 1,
    textAlign: "center",
  },
  list: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.xs,
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  status: {
    ...typography.bodySmall,
    color: colors.ink,
    fontFamily: typography.label.fontFamily,
    padding: spacing.lg,
    textAlign: "center",
  },
  tableHeader: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: radius.button,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tableHeaderWrap: {
    marginBottom: spacing.sm,
    marginHorizontal: horizontalMargin,
  },
});
