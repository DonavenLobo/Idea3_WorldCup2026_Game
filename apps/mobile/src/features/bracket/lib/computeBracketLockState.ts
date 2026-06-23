// apps/mobile/src/features/bracket/lib/computeBracketLockState.ts
//
// Lock-on-save model: a group is locked the moment it's finalized (saved);
// a knockout match is locked the moment its entire round is finalized.
// There is no time-based lock — no per-match kickoff gate, no
// tournament-wide group-stage deadline.
import { GROUP_IDS } from "@gogaffa/config";
import type { GroupId } from "@gogaffa/config";

export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export const KNOCKOUT_ROUND_IDS: readonly KnockoutRoundId[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final"
] as const;

/**
 * Tournament phase, driven purely by which groups and knockout rounds the
 * user has finalized.
 */
export type TournamentPhase =
  | "groups-open"        // No groups finalized yet
  | "groups-partial"     // Some groups finalized
  | "groups-done"        // All groups finalized; no knockout round finalized yet
  | "knockouts-active"   // At least one knockout round finalized
  | "complete";          // All knockout rounds finalized (incl. third + final)

/**
 * Lockout-relevant fixture data. Consumed by `useFixtures` to render the
 * schedule UI; the lock-on-save model itself ignores fixtures.
 */
export interface FixtureData {
  /** First-kickoff per group, as a Date. */
  groupFirstKickoffs: Record<GroupId, Date>;
  /** Every knockout match, with its kickoff and bracket position. */
  knockouts: Array<{ round: KnockoutRoundId; index: number; kickoff: Date }>;
}

/**
 * Finalized-state snapshot. Owned by BracketContext and passed into
 * `computeBracketLockStateFromFinalized` to derive lock state.
 */
export interface FinalizedState {
  isGroupFinalized: (group: GroupId) => boolean;
  isKnockoutRoundFinalized: (round: KnockoutRoundId) => boolean;
}

export interface BracketLockState {
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  phase: TournamentPhase;
}

/**
 * Pure: derive BracketLockState from finalized state.
 *
 *  - A group is locked iff the user has finalized (saved) it.
 *  - A knockout match is locked iff its round has been finalized — locking
 *    is per-round, not per-match. Once you've saved an R32 sheet, every
 *    R32 pick is frozen.
 */
export function computeBracketLockStateFromFinalized(
  finalized: FinalizedState
): BracketLockState {
  const isGroupLocked = (group: GroupId): boolean =>
    finalized.isGroupFinalized(group);

  const isMatchLocked = (round: KnockoutRoundId, _index: number): boolean =>
    finalized.isKnockoutRoundFinalized(round);

  const finalizedGroupCount = GROUP_IDS.reduce(
    (n, g) => (finalized.isGroupFinalized(g) ? n + 1 : n),
    0
  );
  const allGroupsFinalized = finalizedGroupCount === GROUP_IDS.length;

  const finalizedRoundCount = KNOCKOUT_ROUND_IDS.reduce(
    (n, r) => (finalized.isKnockoutRoundFinalized(r) ? n + 1 : n),
    0
  );
  const anyKnockoutRoundFinalized = finalizedRoundCount > 0;
  const allKnockoutRoundsFinalized =
    finalizedRoundCount === KNOCKOUT_ROUND_IDS.length;

  let phase: TournamentPhase;
  if (allKnockoutRoundsFinalized) {
    phase = "complete";
  } else if (anyKnockoutRoundFinalized) {
    phase = "knockouts-active";
  } else if (allGroupsFinalized) {
    phase = "groups-done";
  } else if (finalizedGroupCount > 0) {
    phase = "groups-partial";
  } else {
    phase = "groups-open";
  }

  return {
    isGroupLocked,
    isMatchLocked,
    phase
  };
}

export type { GroupId };
