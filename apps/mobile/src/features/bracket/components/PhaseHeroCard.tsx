// apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx
import { StyleSheet, Text, View } from "react-native";
import type { TournamentPhase } from "../lib/computeBracketLockState";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface PhaseHeroCardProps {
  phase: TournamentPhase;
  nextLockAt: Date | null;
  nextLockLabel: string | null;
  now: Date;
}

function formatRelative(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remM = minutes - hours * 60;
    return remM > 0 ? `${hours}h ${remM}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function PhaseHeroCard({ phase, nextLockAt, nextLockLabel, now }: PhaseHeroCardProps) {
  let eyebrow = "";
  let title = "";
  let body = "";
  let tone: "green" | "amber" | "neutral" = "green";

  switch (phase) {
    case "pre":
      eyebrow = "PHASE 1";
      title = "Group Stage";
      body = nextLockAt
        ? `Predict the group standings. First lock in ${formatRelative(nextLockAt, now)}.`
        : "Predict the group standings.";
      tone = "green";
      break;
    case "phase1-closing":
      eyebrow = "PHASE 1 CLOSING";
      title = nextLockLabel ? `${nextLockLabel} locks soon` : "Groups closing";
      body = nextLockAt
        ? `Next lock: ${nextLockLabel ?? "soon"} in ${formatRelative(nextLockAt, now)}.`
        : "Some groups already locked.";
      tone = "amber";
      break;
    case "between":
      eyebrow = "PHASE 2";
      title = "Knockouts unlocked";
      body = "Group stage is in the books. Time to pick the bracket.";
      tone = "green";
      break;
    case "phase2-closing":
      eyebrow = "PHASE 2 CLOSING";
      title = nextLockLabel ? `${nextLockLabel} locks soon` : "Knockouts closing";
      body = nextLockAt
        ? `Next match locks in ${formatRelative(nextLockAt, now)}.`
        : "Some matches already locked.";
      tone = "amber";
      break;
    case "complete":
      eyebrow = "TOURNAMENT COMPLETE";
      title = "🏁 The final whistle";
      body = "See your final score on the leaderboard.";
      tone = "neutral";
      break;
  }

  const borderColor =
    tone === "green" ? colors.success : tone === "amber" ? colors.red : opacity.ink15;

  return (
    <View style={[styles.card, { borderColor }]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: opacity.ink70,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6
  },
  card: {
    backgroundColor: opacity.ink10,
    borderRadius: radius.lg,
    borderWidth: 2,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4
  }
});
