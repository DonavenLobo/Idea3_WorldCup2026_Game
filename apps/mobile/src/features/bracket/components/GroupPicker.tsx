import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatTeamName, GROUP_IDS, SUPPORTED_NATIONS } from "@gogaffa/config";
import type { GroupId } from "@gogaffa/config";
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

/**
 * Group-stage UX rules:
 *   - User picks rankings (drag arrows) within each group.
 *   - Tapping "Next" silently saves the CURRENT group and advances.
 *   - On the last group (Group L), the action button reads "Save" — it
 *     saves Group L, then leaves the group stage if every group is saved.
 *   - A saved group shows a "SAVED" chip and becomes review-only.
 *     Group-level reset is only available before that group is saved.
 *   - Once the tournament-wide group-stage deadline passes (earliest
 *     kickoff + 7 days), `isGroupLocked` returns true for all groups —
 *     arrows hide, and the action button only navigates.
 */
export function GroupPicker({ index, onIndexChange, onComplete }: GroupPickerProps) {
  const {
    groupRankings, moveTeamUp, moveTeamDown, resetGroup,
    areAllGroupsFinalized, isGroupLocked, isGroupFinalized,
    saveGroup, isSaving, saveError
  } = useBracket();

  const groupId = GROUP_IDS[index];
  if (!groupId) return null;
  const finalized = isGroupFinalized(groupId);
  // Locked = tournament-wide group-stage deadline reached.
  const locked = isGroupLocked(groupId);
  const readOnly = finalized || locked;
  const teams = groupRankings[groupId] ?? [];

  const isFirst = index === 0;
  const isLast = index === GROUP_IDS.length - 1;

  const handlePrev = () => onIndexChange(Math.max(0, index - 1));

  const advanceToNextGroup = () => {
    onIndexChange(Math.min(GROUP_IDS.length - 1, index + 1));
  };

  const advanceToNextIncompleteGroup = () => {
    const nextIncompleteIndex = GROUP_IDS.findIndex((group, groupIndex) => (
      groupIndex > index && !isGroupFinalized(group)
    ));
    if (nextIncompleteIndex >= 0) {
      onIndexChange(nextIncompleteIndex);
      return;
    }

    const firstIncompleteIndex = GROUP_IDS.findIndex((group) => !isGroupFinalized(group));
    if (firstIncompleteIndex >= 0) {
      onIndexChange(firstIncompleteIndex);
      return;
    }

    advanceToNextGroup();
  };

  const advanceAfterSave = () => {
    const allGroupsWillBeFinalized =
      areAllGroupsFinalized || GROUP_IDS.every((group) => group === groupId || isGroupFinalized(group));
    if (allGroupsWillBeFinalized) {
      onComplete?.();
      return;
    }

    advanceToNextIncompleteGroup();
  };

  // Tapping the primary action saves unsaved groups. Saved or locked groups
  // are review-only, so the action just navigates.
  const handlePrimaryAction = async () => {
    if (readOnly) {
      if (isLast && areAllGroupsFinalized) {
        onComplete?.();
      } else {
        advanceToNextIncompleteGroup();
      }
      return;
    }

    const ok = await saveGroup(groupId);
    if (!ok) return; // saveError will render below; don't advance on failure
    advanceAfterSave();
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
          {finalized && !locked ? <Text style={styles.savedChip}>  SAVED</Text> : null}
          {locked ? <Text style={styles.lockChip}>  LOCKED</Text> : null}
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
              {!readOnly ? (
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

        {!readOnly ? (
          <View style={styles.groupActionRow}>
            <Pressable style={styles.resetButton} onPress={() => resetGroup(groupId)}>
              <Text style={styles.resetText}>Reset group</Text>
            </Pressable>
          </View>
        ) : locked ? (
          <Text style={styles.lockedHint}>
            Group stage is locked. New picks aren&apos;t accepted after the first week of the tournament.
          </Text>
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
        {isLast && areAllGroupsFinalized ? (
          // After Group L has been saved at least once AND all groups are
          // saved, the primary action becomes "My Bracket" (review).
          <Pressable style={styles.navButtonPrimary} onPress={onComplete}>
            <Text style={styles.navTextPrimary}>My Bracket</Text>
          </Pressable>
        ) : (
          <BrandButton
            label={readOnly ? "Next" : isLast ? "Save" : "Next"}
            onPress={() => void handlePrimaryAction()}
            disabled={isSaving}
            loading={isSaving}
            style={styles.primaryActionCta}
          />
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
  primaryActionCta: {
    minWidth: 110
  },
  savedChip: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  saveError: {
    color: colors.red,
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
