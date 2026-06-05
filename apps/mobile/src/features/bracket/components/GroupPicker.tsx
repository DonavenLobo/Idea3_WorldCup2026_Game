import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GROUP_IDS, SUPPORTED_NATIONS } from "@world-cup-game/config";
import { useBracket } from "../BracketContext";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

function nationByCode(code: string) {
  return SUPPORTED_NATIONS.find((n) => n.code === code);
}

interface GroupPickerProps {
  index: number;
  onIndexChange: (next: number) => void;
  onComplete?: () => void;
}

export function GroupPicker({ index, onIndexChange, onComplete }: GroupPickerProps) {
  const {
    groupRankings, moveTeamUp, moveTeamDown, resetGroup,
    isGroupLocked, saveBracket
  } = useBracket();

  const groupId = GROUP_IDS[index];
  if (!groupId) return null;
  const locked = isGroupLocked(groupId);
  const teams = groupRankings[groupId] ?? [];

  const isFirst = index === 0;
  const isLast = index === GROUP_IDS.length - 1;

  const handlePrev = () => onIndexChange(Math.max(0, index - 1));
  const handleNext = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    onIndexChange(Math.min(GROUP_IDS.length - 1, index + 1));
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.groupTitle}>
          GROUP {groupId}
          {locked ? <Text style={styles.lockChip}>  🔒 LOCKED</Text> : null}
        </Text>

        {teams.map((code, i) => {
          const nation = nationByCode(code);
          const upDisabled = i === 0;
          const downDisabled = i === teams.length - 1;
          return (
            <View key={code} style={styles.row}>
              <Text style={styles.position}>{i + 1}</Text>
              <Text style={styles.flag}>{nation?.flagEmoji ?? "🏴"}</Text>
              <Text style={styles.nationName} numberOfLines={1}>
                {nation?.name ?? code}
              </Text>
              {!locked ? (
                <View style={styles.arrows}>
                  <Pressable
                    style={[styles.arrowButton, upDisabled ? styles.arrowDisabled : null]}
                    disabled={upDisabled}
                    onPress={() => moveTeamUp(groupId, i)}
                  >
                    <Text style={styles.arrowText}>▲</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.arrowButton, downDisabled ? styles.arrowDisabled : null]}
                    disabled={downDisabled}
                    onPress={() => moveTeamDown(groupId, i)}
                  >
                    <Text style={styles.arrowText}>▼</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}

        {!locked ? (
          <Pressable style={styles.resetButton} onPress={() => resetGroup(groupId)}>
            <Text style={styles.resetText}>Reset group</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navButton, isFirst ? styles.navDisabled : null]}
          disabled={isFirst}
          onPress={handlePrev}
        >
          <Text style={styles.navText}>← Prev</Text>
        </Pressable>
        <Text style={styles.indicator}>
          {index + 1} of {GROUP_IDS.length}
        </Text>
        {isLast ? (
          <View style={styles.dualCtaRow}>
            <Pressable
              style={styles.saveButton}
              onPress={async () => {
                await saveBracket();
                Alert.alert(
                  "Group picks saved",
                  "Come back June 28 to pick the knockouts — or set them now.",
                  [
                    { text: "Set Knockouts Now", onPress: () => onComplete?.() },
                    { text: "Back to Bracket", style: "cancel" }
                  ]
                );
              }}
            >
              <Text style={styles.saveButtonText}>Save Group Stage</Text>
            </Pressable>
            <Pressable
              style={styles.navButtonPrimary}
              onPress={async () => {
                await saveBracket();
                onComplete?.();
              }}
            >
              <Text style={styles.navTextPrimary}>Set Knockouts Now →</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.navButtonPrimary} onPress={handleNext}>
            <Text style={styles.navTextPrimary}>Next →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dualCtaRow: {
    flexDirection: "row",
    flex: 1,
    gap: spacing.sm
  },
  lockChip: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  saveButton: {
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 2,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  saveButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  arrowButton: {
    alignItems: "center",
    backgroundColor: "rgba(12, 59, 46, 0.08)",
    borderRadius: radius.sm,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  arrowDisabled: {
    opacity: 0.25
  },
  arrowText: {
    color: colors.pitch,
    fontSize: 14,
    fontWeight: "900"
  },
  arrows: {
    flexDirection: "row",
    gap: spacing.xs
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  flag: {
    fontSize: 24
  },
  groupTitle: {
    color: colors.pitch,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.md
  },
  indicator: {
    color: "rgba(255, 248, 234, 0.75)",
    fontSize: 13,
    fontWeight: "800"
  },
  nationName: {
    color: colors.pitch,
    flex: 1,
    fontSize: 16,
    fontWeight: "800"
  },
  navButton: {
    backgroundColor: "rgba(255, 248, 234, 0.1)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  navButtonPrimary: {
    backgroundColor: colors.gold,
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
    color: colors.cream,
    fontSize: 14,
    fontWeight: "800"
  },
  navTextPrimary: {
    color: colors.pitch,
    fontSize: 14,
    fontWeight: "900"
  },
  position: {
    color: colors.pitch,
    fontSize: 18,
    fontWeight: "900",
    width: 22
  },
  resetButton: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  resetText: {
    color: "rgba(12, 59, 46, 0.55)",
    fontSize: 13,
    fontWeight: "700"
  },
  root: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  row: {
    alignItems: "center",
    borderTopColor: "rgba(12, 59, 46, 0.08)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm
  }
});
