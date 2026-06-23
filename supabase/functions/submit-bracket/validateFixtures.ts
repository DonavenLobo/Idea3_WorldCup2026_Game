// supabase/functions/submit-bracket/validateFixtures.ts
//
// Lock-on-save validation: a write is rejected only when it tries to CHANGE
// a unit (group or knockout round) that the user previously finalized. The
// source of truth is the existing bracket's `picks` JSONB column — the same
// place `finalizedGroups` already lives. The per-round boolean columns added
// in migration 000033 are NOT consulted here so this validator stays
// consistent with how `finalizedGroups` is read elsewhere.
//
// No time gates: kickoff timestamps are irrelevant to the lockout decision.

export type GroupId = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L";
export type KnockoutRoundId = "r32"|"r16"|"qf"|"sf"|"final"|"third";

export interface BracketPicksPayload {
  groupRankings: Record<string, string[]>;
  finalizedGroups?: string[];
  knockoutFinalized?: Partial<Record<KnockoutRoundId, boolean>>;
  picks: {
    r32: Record<string, string>;
    r16: Record<string, string>;
    qf: Record<string, string>;
    sf: Record<string, string>;
    final: string | null;
    third: string | null;
  };
}

export interface ValidationResult {
  ok: boolean;
  invalidGroups: GroupId[];
  invalidRounds: KnockoutRoundId[];
}

const PER_MATCH_ROUNDS: readonly Exclude<KnockoutRoundId, "final" | "third">[] = [
  "r32",
  "r16",
  "qf",
  "sf"
];

/**
 * Reject changes against groups / knockout rounds that the existing bracket
 * already marked finalized. Untouched units pass. New picks on non-finalized
 * units pass. Only mutations of already-finalized state are blocked.
 */
export function validateBracketWriteAgainstFinalized(
  existing: BracketPicksPayload | null,
  incoming: BracketPicksPayload
): ValidationResult {
  const invalidGroups: GroupId[] = [];
  const invalidRounds: KnockoutRoundId[] = [];

  const existingFinalizedGroups = new Set(existing?.finalizedGroups ?? []);
  const existingFinalizedRounds = existing?.knockoutFinalized ?? {};

  // Group rankings: only blocked when the group is finalized AND the incoming
  // ranking differs from what was saved.
  for (const [group, ranking] of Object.entries(incoming.groupRankings)) {
    if (!existingFinalizedGroups.has(group)) continue;
    const prev = existing?.groupRankings?.[group];
    if (!arraysEqual(prev, ranking)) {
      invalidGroups.push(group as GroupId);
    }
  }

  // Per-match knockout rounds (r32 / r16 / qf / sf): blocked when the round
  // is finalized AND any indexed pick changed (added, removed, or replaced).
  for (const round of PER_MATCH_ROUNDS) {
    if (existingFinalizedRounds[round] !== true) continue;
    const prevRound = existing?.picks?.[round] ?? {};
    const nextRound = incoming.picks[round] ?? {};
    if (!roundMapsEqual(prevRound, nextRound)) {
      invalidRounds.push(round);
    }
  }

  // Final / third — compare the winner directly.
  if (existingFinalizedRounds.final === true) {
    const prev = existing?.picks?.final ?? null;
    const next = incoming.picks.final ?? null;
    if (prev !== next) invalidRounds.push("final");
  }

  if (existingFinalizedRounds.third === true) {
    const prev = existing?.picks?.third ?? null;
    const next = incoming.picks.third ?? null;
    if (prev !== next) invalidRounds.push("third");
  }

  return {
    ok: invalidGroups.length === 0 && invalidRounds.length === 0,
    invalidGroups,
    invalidRounds
  };
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function roundMapsEqual(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
