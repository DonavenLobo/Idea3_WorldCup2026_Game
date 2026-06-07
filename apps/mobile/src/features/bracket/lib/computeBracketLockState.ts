// apps/mobile/src/features/bracket/lib/computeBracketLockState.ts
import { GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";

export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export type TournamentPhase =
  | "pre"             // No group has kicked off yet
  | "phase1-closing"  // Some groups locked, some open
  | "between"         // All groups locked, no knockout match kicked off
  | "phase2-closing"  // Some knockouts locked, some open
  | "complete";       // Everything locked

/** Lockout-relevant fixture data. Produced by useFixtures() at runtime. */
export interface FixtureData {
  /** First-kickoff per group, as a Date. */
  groupFirstKickoffs: Record<GroupId, Date>;
  /** Every knockout match, with its kickoff and bracket position. */
  knockouts: Array<{ round: KnockoutRoundId; index: number; kickoff: Date }>;
}

export interface BracketLockState {
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  phase: TournamentPhase;
  nextLockAt: Date | null;
  nextLockLabel: string | null;
}

function roundLabel(round: KnockoutRoundId): string {
  switch (round) {
    case "r32":   return "R32";
    case "r16":   return "R16";
    case "qf":    return "QF";
    case "sf":    return "SF";
    case "final": return "Final";
    case "third": return "3rd-place";
  }
}

/** Pure: derive BracketLockState from (now, fixtures). */
export function computeBracketLockState(
  now: Date,
  fixtures: FixtureData
): BracketLockState {
  const nowMs = now.getTime();

  const groupKickoffMs = new Map<GroupId, number>();
  for (const g of GROUP_IDS) {
    const d = fixtures.groupFirstKickoffs[g];
    if (d) groupKickoffMs.set(g, d.getTime());
  }

  const knockoutKickoffMs = new Map<string, number>();
  for (const k of fixtures.knockouts) {
    knockoutKickoffMs.set(`${k.round}:${k.index}`, k.kickoff.getTime());
  }

  const isGroupLocked = (group: GroupId): boolean => {
    const k = groupKickoffMs.get(group);
    return k !== undefined && nowMs >= k;
  };

  const isMatchLocked = (round: KnockoutRoundId, index: number): boolean => {
    const k = knockoutKickoffMs.get(`${round}:${index}`);
    return k !== undefined && nowMs >= k;
  };

  // Find the next lockable unit (soonest future kickoff, group or knockout)
  let soonestGroupKickoff = Infinity;
  let soonestGroupId: GroupId | null = null;
  for (const g of GROUP_IDS) {
    const k = groupKickoffMs.get(g);
    if (k !== undefined && nowMs < k && k < soonestGroupKickoff) {
      soonestGroupKickoff = k;
      soonestGroupId = g;
    }
  }

  let soonestKnockoutKickoff = Infinity;
  let soonestKnockoutLabel: string | null = null;
  for (const k of fixtures.knockouts) {
    const ms = k.kickoff.getTime();
    if (nowMs < ms && ms < soonestKnockoutKickoff) {
      soonestKnockoutKickoff = ms;
      soonestKnockoutLabel = `${roundLabel(k.round)} #${k.index + 1}`;
    }
  }

  let nextLockAt: Date | null = null;
  let nextLockLabel: string | null = null;
  if (soonestGroupKickoff < Infinity && soonestGroupKickoff < soonestKnockoutKickoff) {
    nextLockAt = new Date(soonestGroupKickoff);
    nextLockLabel = `Group ${soonestGroupId}`;
  } else if (soonestKnockoutKickoff < Infinity) {
    nextLockAt = new Date(soonestKnockoutKickoff);
    nextLockLabel = soonestKnockoutLabel;
  }

  const anyGroupLocked = GROUP_IDS.some(isGroupLocked);
  const allGroupsLocked = GROUP_IDS.every(isGroupLocked);
  const anyKnockoutLocked = fixtures.knockouts.some((k) =>
    isMatchLocked(k.round, k.index)
  );
  const allKnockoutsLocked =
    fixtures.knockouts.length > 0 &&
    fixtures.knockouts.every((k) => isMatchLocked(k.round, k.index));

  let phase: TournamentPhase;
  if (!anyGroupLocked) {
    phase = "pre";
  } else if (!allGroupsLocked) {
    phase = "phase1-closing";
  } else if (!anyKnockoutLocked) {
    phase = "between";
  } else if (!allKnockoutsLocked) {
    phase = "phase2-closing";
  } else {
    phase = "complete";
  }

  return { isGroupLocked, isMatchLocked, phase, nextLockAt, nextLockLabel };
}

export type { GroupId };
