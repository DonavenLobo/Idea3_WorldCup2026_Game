// apps/mobile/src/features/bracket/lib/computeBracketLockState.ts
//
// Lock-on-save model: a group is locked the moment it's finalized (saved);
// a knockout match is locked the moment its entire round is finalized.
// There is no longer any time-based lock — no per-match kickoff gate, no
// tournament-wide 7-day group-stage deadline.
//
// The pure derivation function is `computeBracketLockStateFromFinalized`,
// which depends only on finalized state owned by BracketContext.
//
// `computeBracketLockState(now, fixtures)` is retained as a temporary
// backwards-compatible shim — it always returns "everything unlocked" so
// callers (BracketContext) keep typechecking until Task 17 swaps them
// over to the finalized-aware function.
import { GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";

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
 * Tournament phase under the lock-on-save model. Driven purely by which
 * groups / knockout rounds the user has finalized — no clock involved.
 *
 * The legacy time-driven phase names ("pre", "phase1-closing", "between",
 * "phase2-closing") are retained as deprecated members of this union for
 * one task cycle so downstream UI consumers (PhaseHeroCard, etc.) keep
 * typechecking. Task 17 will migrate them to the new phase names and
 * the deprecated literals can be removed.
 */
export type TournamentPhase =
  | "groups-open"        // No groups finalized yet
  | "groups-partial"     // Some groups finalized
  | "groups-done"        // All groups finalized; no knockout round finalized yet
  | "knockouts-active"   // At least one knockout round finalized
  | "complete"           // All knockout rounds finalized (incl. third + final)
  // --- Deprecated (Task 17 will drop these) ---
  | "pre"
  | "phase1-closing"
  | "between"
  | "phase2-closing";

/**
 * Lockout-relevant fixture data. Retained only for the backwards-compatible
 * `computeBracketLockState(now, fixtures)` shim — the new finalized-aware
 * function ignores fixtures entirely.
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
  /**
   * @deprecated There is no future-time lock in the lock-on-save model.
   * Always `null`; retained on the return shape so legacy UI consumers
   * keep typechecking. Task 17 will remove this field.
   */
  nextLockAt: Date | null;
  /**
   * @deprecated See `nextLockAt`. Always `null` in the new model.
   */
  nextLockLabel: string | null;
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
    phase,
    nextLockAt: null,
    nextLockLabel: null
  };
}

/**
 * Backwards-compatible shim for BracketContext / useBracketLockState.
 *
 * The lock-on-save model has no time-based locking, so this shim ignores
 * `now` and `fixtures` and returns "everything unlocked, no groups
 * finalized". Task 17 will replace call sites with
 * `computeBracketLockStateFromFinalized` driven by real finalized state.
 *
 * @deprecated Call `computeBracketLockStateFromFinalized` instead.
 */
export function computeBracketLockState(
  _now: Date,
  _fixtures: FixtureData
): BracketLockState {
  return {
    isGroupLocked: () => false,
    isMatchLocked: () => false,
    phase: "groups-open",
    nextLockAt: null,
    nextLockLabel: null
  };
}

export type { GroupId };
