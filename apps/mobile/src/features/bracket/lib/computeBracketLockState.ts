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

/**
 * Group-stage editing window: 7 days from the earliest group kickoff.
 * After this deadline, ALL group rankings are locked regardless of which
 * specific group games are still upcoming — this is intentional so that
 * late joiners can't game the system by waiting for groups to play out.
 */
const GROUP_STAGE_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

  // Tournament-wide group-stage deadline: earliest group kickoff + 7 days.
  // If no group fixtures are loaded yet, fall back to never-locked.
  const earliestGroupKickoff = Math.min(...Array.from(groupKickoffMs.values()));
  const groupStageDeadlineMs =
    Number.isFinite(earliestGroupKickoff)
      ? earliestGroupKickoff + GROUP_STAGE_EDIT_WINDOW_MS
      : Infinity;

  const knockoutKickoffMs = new Map<string, number>();
  for (const k of fixtures.knockouts) {
    knockoutKickoffMs.set(`${k.round}:${k.index}`, k.kickoff.getTime());
  }

  /**
   * Tournament-wide group lock. All 12 groups lock at the same moment —
   * once `now` passes the (earliest-kickoff + 7d) deadline.
   * Per-group kickoff times no longer gate individual groups.
   */
  const isGroupLocked = (_group: GroupId): boolean => {
    return nowMs >= groupStageDeadlineMs;
  };

  /**
   * Per-match lock for knockouts. Once a knockout match has kicked off,
   * its pick can no longer be changed. (Spec: "no edit after a game has
   * already been played" — kickoff is the closest authoritative signal
   * we have without a live results feed.)
   */
  const isMatchLocked = (round: KnockoutRoundId, index: number): boolean => {
    const k = knockoutKickoffMs.get(`${round}:${index}`);
    return k !== undefined && nowMs >= k;
  };

  // Next lock to display: group-stage deadline (if still in the future),
  // otherwise the soonest upcoming knockout kickoff.
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
  if (
    Number.isFinite(groupStageDeadlineMs) &&
    nowMs < groupStageDeadlineMs &&
    groupStageDeadlineMs < soonestKnockoutKickoff
  ) {
    nextLockAt = new Date(groupStageDeadlineMs);
    nextLockLabel = "Group Stage";
  } else if (soonestKnockoutKickoff < Infinity) {
    nextLockAt = new Date(soonestKnockoutKickoff);
    nextLockLabel = soonestKnockoutLabel;
  }

  // Group lock is now all-or-nothing (a single tournament-wide deadline).
  const groupsLocked = nowMs >= groupStageDeadlineMs;
  const anyKnockoutLocked = fixtures.knockouts.some((k) =>
    isMatchLocked(k.round, k.index)
  );
  const allKnockoutsLocked =
    fixtures.knockouts.length > 0 &&
    fixtures.knockouts.every((k) => isMatchLocked(k.round, k.index));

  // Phase derivation under the new model:
  //   - pre:             tournament hasn't started + groups still editable
  //   - phase1-closing:  tournament started, groups still editable (within 7d window)
  //   - between:         group stage locked, no knockouts started yet
  //   - phase2-closing:  some knockouts locked
  //   - complete:        all knockouts locked
  let phase: TournamentPhase;
  const earliestGroupHasStarted =
    Number.isFinite(earliestGroupKickoff) && nowMs >= earliestGroupKickoff;
  if (!earliestGroupHasStarted) {
    phase = "pre";
  } else if (!groupsLocked) {
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
