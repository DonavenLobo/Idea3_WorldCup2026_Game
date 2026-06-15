import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useSchedule } from "../hooks/useSchedule";
import type { ScheduledFixture, ScheduleFilter } from "../types";
import { DaySectionHeader } from "../components/DaySectionHeader";
import { FilterChips } from "../components/FilterChips";
import { FixtureRow } from "../components/FixtureRow";
import { StadiumDetailSheet } from "../components/StadiumDetailSheet";
import {
  findDefaultScheduleScrollTarget,
  type ScheduleScrollTarget
} from "../utils";

const AUTO_SCROLL_DELAY_MS = 250;
const INITIAL_ITEMS_TO_RENDER = 120;

export function ScheduleScreen() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const [venueCity, setVenueCity] = useState<string | null>(null);
  const listRef = useRef<SectionList<ScheduledFixture> | null>(null);
  const lastAutoScrollKeyRef = useRef<string | null>(null);
  const userHasScrolledRef = useRef(false);
  const { isLoadingScores, refreshScores, sections, showMyTeam, timeZone } =
    useSchedule(filter);

  const defaultScrollTarget = useMemo(
    () => findDefaultScheduleScrollTarget(sections),
    [sections]
  );

  const defaultScrollKey = defaultScrollTarget
    ? `${filter}:${defaultScrollTarget.reason}:${defaultScrollTarget.matchNum}:${defaultScrollTarget.sectionIndex}:${defaultScrollTarget.itemIndex}`
    : `${filter}:empty`;

  useEffect(() => {
    if (!showMyTeam && filter === "myTeam") {
      setFilter("all");
    }
  }, [showMyTeam, filter]);

  useEffect(() => {
    userHasScrolledRef.current = false;
    lastAutoScrollKeyRef.current = null;
  }, [filter]);

  const scrollToTarget = useCallback((target: ScheduleScrollTarget) => {
    listRef.current?.scrollToLocation({
      animated: false,
      itemIndex: target.itemIndex,
      sectionIndex: target.sectionIndex,
      viewOffset: spacing.sm,
      viewPosition: 0.08
    });
  }, []);

  useEffect(() => {
    if (!defaultScrollTarget || sections.length === 0 || userHasScrolledRef.current) {
      return;
    }

    if (lastAutoScrollKeyRef.current === defaultScrollKey) {
      return;
    }

    lastAutoScrollKeyRef.current = defaultScrollKey;
    const timeoutId = setTimeout(() => {
      scrollToTarget(defaultScrollTarget);
    }, AUTO_SCROLL_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [defaultScrollKey, defaultScrollTarget, scrollToTarget, sections.length]);

  return (
    <View style={styles.root}>
      <FilterChips value={filter} onChange={setFilter} showMyTeam={showMyTeam} />
      <SectionList
        ref={listRef}
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
        initialNumToRender={INITIAL_ITEMS_TO_RENDER}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No matches for this filter.</Text>}
        onScrollBeginDrag={() => {
          userHasScrolledRef.current = true;
        }}
        onScrollToIndexFailed={() => {
          if (defaultScrollTarget && !userHasScrolledRef.current) {
            setTimeout(() => scrollToTarget(defaultScrollTarget), AUTO_SCROLL_DELAY_MS);
          }
        }}
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
