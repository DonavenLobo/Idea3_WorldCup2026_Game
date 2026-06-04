import { useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useSchedule } from "../hooks/useSchedule";
import type { ScheduleFilter } from "../types";
import { deviceTimeZone } from "../utils";
import { DaySectionHeader } from "./DaySectionHeader";
import { FilterChips } from "./FilterChips";
import { FixtureRow } from "./FixtureRow";
import { StadiumDetailSheet } from "./StadiumDetailSheet";

export function ScheduleScreen() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const [venueCity, setVenueCity] = useState<string | null>(null);
  const { sections, showMyTeam } = useSchedule(filter);
  const timeZone = deviceTimeZone();

  return (
    <View style={styles.root}>
      <FilterChips value={filter} onChange={setFilter} showMyTeam={showMyTeam} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.num)}
        renderItem={({ item }) => (
          <FixtureRow fixture={item} timeZone={timeZone} onVenuePress={setVenueCity} />
        )}
        renderSectionHeader={({ section }) => <DaySectionHeader title={section.title} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No matches for this filter.</Text>}
      />
      <StadiumDetailSheet city={venueCity} onClose={() => setVenueCity(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl
  },
  empty: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 14,
    padding: spacing.xl,
    textAlign: "center"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  }
});
