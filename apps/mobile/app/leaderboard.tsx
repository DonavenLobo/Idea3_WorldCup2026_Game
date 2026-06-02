import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEADERBOARD_STAGES, SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { LeaderboardStage } from "@world-cup-game/config";
import {
  COUNTRY_ALL,
  FilterDropdown,
  LeaderboardRow,
  buildLeaderboardRows,
  uniqueCountryCodes
} from "../src/features/leaderboard";
import type { CountryFilter, FilterOption } from "../src/features/leaderboard";
import { useOnboarding } from "../src/features/onboarding";
import { useTrivia } from "../src/features/trivia";
import { colors } from "../src/theme/colors";
import { radius } from "../src/theme/radius";
import { spacing } from "../src/theme/spacing";

export default function LeaderboardScreen() {
  const router = useRouter();
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
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Leaderboard</Text>
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

      <View style={styles.tableHeader}>
        <Text style={styles.colRank}>Rank</Text>
        <Text style={styles.colName}>Display Name</Text>
        <Text style={styles.colScore}>Total Pts</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  backSpacer: {
    width: 36
  },
  backText: {
    color: colors.cream,
    fontSize: 20,
    fontWeight: "900"
  },
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  headerSafeArea: {
    backgroundColor: colors.pitch
  },
  headerTitle: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "900"
  },
  list: {
    backgroundColor: "#FFFFFF",
    flex: 1
  },
  listContent: {
    paddingBottom: spacing.xl
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  tableHeader: {
    alignItems: "center",
    backgroundColor: "rgba(12, 59, 46, 0.15)",
    borderRadius: radius.sm,
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
