import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatTeamName, GROUP_IDS, SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { BrandButton } from "../../../components/brand";
import { TeamLogo } from "../../../components/team";
import { useBracket } from "../BracketContext";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

function nationByTeam(team: string) {
  return SUPPORTED_NATIONS.find((n) => n.code === team || n.name === team);
}

function MoveChevron({ direction }: { direction: "up" | "down" }) {
  return (
    <View style={[styles.moveTriangle, direction === "up" ? styles.moveTriangleUp : styles.moveTriangleDown]} />
  );
}

interface GroupStatusTabsProps {
  index: number;
  isGroupFinalized: (group: GroupId) => boolean;
  onIndexChange: (next: number) => void;
}

function GroupStatusTabs({ index, isGroupFinalized, onIndexChange }: GroupStatusTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.groupTabsScroll}
      contentContainerStyle={styles.groupTabsContent}
    >
      {GROUP_IDS.map((group, groupIndex) => {
        const selected = groupIndex === index;
        const saved = isGroupFinalized(group);

        return (
          <Pressable
            accessibilityLabel={`Open Group ${group}${saved ? ", saved" : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={group}
            onPress={() => onIndexChange(groupIndex)}
            style={[
              styles.groupTab,
              saved ? styles.groupTabSaved : styles.groupTabUnsaved,
              selected ? styles.groupTabSelected : null
            ]}
          >
            <Text
              style={[
                styles.groupTabText,
                saved ? styles.groupTabTextSaved : styles.groupTabTextUnsaved,
                selected ? styles.groupTabTextSelected : null
              ]}
            >
              {group}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface GroupPickerProps {
  index: number;
  onIndexChange: (next: number) => void;
  onComplete?: () => void;
}

export function GroupPicker({ index, onIndexChange, onComplete }: GroupPickerProps) {
  const {
    groupRankings, moveTeamUp, moveTeamDown, resetGroup,
    areAllGroupsFinalized, isGroupLocked, isGroupFinalized,
    saveAllGroups, isSaving, lastSavedAt, saveError
  } = useBracket();

  const groupId = GROUP_IDS[index];
  if (!groupId) return null;
  const finalized = isGroupFinalized(groupId);
  const locked = isGroupLocked(groupId) || finalized;
  const teams = groupRankings[groupId] ?? [];

  const isFirst = index === 0;
  const isLast = index === GROUP_IDS.length - 1;

  const handlePrev = () => onIndexChange(Math.max(0, index - 1));
  const handleNext = () => {
    if (isLast) return;
    onIndexChange(Math.min(GROUP_IDS.length - 1, index + 1));
  };

  // Group-stage save is one-shot: finalize all 12 groups in a single round-trip.
  // Triggered from the last group via "Save Group Stage" (or by tapping "My Bracket"
  // before finalization, which also auto-saves).
  const handleSaveGroupStage = async () => {
    const ok = await saveAllGroups();
    if (ok) {
      onComplete?.();
    }
  };

  return (
    <View style={styles.root}>
      <GroupStatusTabs
        index={index}
        isGroupFinalized={isGroupFinalized}
        onIndexChange={onIndexChange}
      />

      <View style={styles.card}>
        <Text style={styles.groupTitle}>
          GROUP {groupId}
          {finalized ? <Text style={styles.lockChip}>  SAVED</Text> : null}
          {!finalized && locked ? <Text style={styles.lockChip}>  LOCKED</Text> : null}
        </Text>

        {teams.map((team, i) => {
          const nation = nationByTeam(team);
          const upDisabled = i === 0;
          const downDisabled = i === teams.length - 1;
          return (
            <View key={team} style={styles.row}>
              <Text style={styles.position}>{i + 1}</Text>
              <TeamLogo code={nation?.code} name={nation?.name ?? team} size={30} />
              <Text style={styles.nationName} numberOfLines={1}>
                {formatTeamName(nation?.name ?? team)}
              </Text>
              {!locked ? (
                <View style={styles.arrows}>
                  <Pressable
                    accessibilityLabel={`Move ${formatTeamName(nation?.name ?? team)} up`}
                    accessibilityRole="button"
                    style={[styles.arrowButton, upDisabled ? styles.arrowDisabled : null]}
                    disabled={upDisabled}
                    onPress={() => moveTeamUp(groupId, i)}
                  >
                    <MoveChevron direction="up" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Move ${formatTeamName(nation?.name ?? team)} down`}
                    accessibilityRole="button"
                    style={[styles.arrowButton, downDisabled ? styles.arrowDisabled : null]}
                    disabled={downDisabled}
                    onPress={() => moveTeamDown(groupId, i)}
                  >
                    <MoveChevron direction="down" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}

        {!locked ? (
          <View style={styles.groupActionRow}>
            <Pressable style={styles.resetButton} onPress={() => resetGroup(groupId)}>
              <Text style={styles.resetText}>Reset group</Text>
            </Pressable>
          </View>
        ) : finalized ? (
          <Text style={styles.lockedHint}>
            All group picks saved. Reset the complete bracket to change them.
          </Text>
        ) : (
          <Text style={styles.lockedHint}>This group has locked and can no longer be edited.</Text>
        )}

        {/* One-shot Save Group Stage CTA — only on Group L, only if not yet finalized. */}
        {isLast && !areAllGroupsFinalized ? (
          <View style={styles.saveAllRow}>
            <BrandButton
              label="Save Group Stage"
              onPress={() => void handleSaveGroupStage()}
              disabled={isSaving}
              loading={isSaving}
              style={styles.saveAllCta}
            />
            <Text style={styles.saveAllHint}>
              Locks in your picks for all 12 groups. You won&apos;t be able to change them after.
            </Text>
          </View>
        ) : null}

        {lastSavedAt && areAllGroupsFinalized ? (
          <Text style={styles.saveStatus}>Saved {new Date(lastSavedAt).toLocaleTimeString()}</Text>
        ) : null}
        {saveError ? <Text style={styles.saveError}>{saveError.message}</Text> : null}
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navButton, isFirst ? styles.navDisabled : null]}
          disabled={isFirst}
          onPress={handlePrev}
        >
          <Text style={styles.navText}>Prev</Text>
        </Pressable>
        <Text style={styles.indicator}>
          {index + 1} of {GROUP_IDS.length}
        </Text>
        {isLast ? (
          <Pressable
            disabled={!areAllGroupsFinalized}
            style={[styles.navButtonPrimary, !areAllGroupsFinalized ? styles.navDisabled : null]}
            onPress={onComplete}
          >
            <Text style={styles.navTextPrimary}>My Bracket</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.navButtonPrimary} onPress={handleNext}>
            <Text style={styles.navTextPrimary}>Next</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  groupActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    marginTop: spacing.md
  },
  groupTab: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 38,
    justifyContent: "center",
    minWidth: 44,
    paddingHorizontal: spacing.sm
  },
  groupTabSaved: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  groupTabSelected: {
    borderColor: colors.red
  },
  groupTabsContent: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  groupTabsScroll: {
    flexGrow: 0,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.sm
  },
  groupTabText: {
    fontSize: 13,
    fontWeight: "900"
  },
  groupTabTextSaved: {
    color: colors.cream
  },
  groupTabTextSelected: {
    color: colors.ink
  },
  groupTabTextUnsaved: {
    color: opacity.ink60
  },
  groupTabUnsaved: {
    backgroundColor: opacity.ink12,
    borderColor: "transparent"
  },
  lockChip: {
    color: opacity.ink60,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  lockedHint: {
    color: opacity.ink55,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
  },
  saveAllCta: {
    alignSelf: "stretch",
    width: "100%"
  },
  saveAllHint: {
    color: opacity.ink55,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  saveAllRow: {
    marginTop: spacing.lg
  },
  saveError: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  saveStatus: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  arrowButton: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  arrowDisabled: {
    opacity: 0.25
  },
  arrows: {
    flexDirection: "row",
    gap: spacing.xs
  },
  moveTriangle: {
    borderLeftColor: "transparent",
    borderLeftWidth: 6,
    borderRightColor: "transparent",
    borderRightWidth: 6,
    height: 0,
    width: 0
  },
  moveTriangleDown: {
    borderTopColor: colors.ink,
    borderTopWidth: 9
  },
  moveTriangleUp: {
    borderBottomColor: colors.ink,
    borderBottomWidth: 9
  },
  groupTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.md
  },
  indicator: {
    color: opacity.ink60,
    fontSize: 13,
    fontWeight: "700"
  },
  nationName: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: "700"
  },
  navButton: {
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  navButtonPrimary: {
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  navDisabled: {
    opacity: 0.35
  },
  navRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg
  },
  navText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  navTextPrimary: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: "700"
  },
  position: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    width: 22
  },
  resetButton: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderRadius: radius.button,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  resetText: {
    color: opacity.ink55,
    fontSize: 13,
    fontWeight: "700"
  },
  root: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  row: {
    alignItems: "center",
    borderTopColor: opacity.ink12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm
  }
});
