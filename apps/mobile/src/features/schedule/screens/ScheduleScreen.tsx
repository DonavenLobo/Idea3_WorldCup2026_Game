import { useEffect, useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useSchedule } from "../hooks/useSchedule";
import type { ScheduleFilter } from "../types";
import { DaySectionHeader } from "../components/DaySectionHeader";
import { FilterChips } from "../components/FilterChips";
import { FixtureRow } from "../components/FixtureRow";
import { StadiumDetailSheet } from "../components/StadiumDetailSheet";

export function ScheduleScreen() {
  const [filter, setFilter] = useState<ScheduleFilter>("today");
  const [venueCity, setVenueCity] = useState<string | null>(null);
  const { isLoadingScores, refreshScores, sections, showMyTeam, showToday, timeZone } =
    useSchedule(filter);

  useEffect(() => {
    if (!showToday && filter === "today") {
      setFilter("all");
    }
  }, [showToday, filter]);

  useEffect(() => {
    if (!showMyTeam && filter === "myTeam") {
      setFilter("all");
    }
  }, [showMyTeam, filter]);

  return (
    <View style={styles.root}>
      <FilterChips
        value={filter}
        onChange={setFilter}
        showMyTeam={showMyTeam}
        showToday={showToday}
      />
      <SectionList
        key={filter}
        style={styles.list}
        sections={sections}
        keyExtractor={(item) => String(item.num)}
        renderItem={({ item }) => (
          <FixtureRow fixture={item} timeZone={timeZone} onVenuePress={setVenueCity} />
        )}
        renderSectionHeader={({ section }) => (
          <DaySectionHeader
            title={section.title}
            isFirst={sections[0]?.title === section.title}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No matches for this filter.</Text>}
        onRefresh={() => {
          void refreshScores();
        }}
        refreshing={isLoadingScores}
      />
      <StadiumDetailSheet city={venueCity} onClose={() => setVenueCity(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  itemSeparator: {
    height: spacing.sm,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  empty: {
    color: opacity.ink55,
    fontSize: 14,
    padding: spacing.xl,
    textAlign: "center"
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  }
});
