import { BRACKET_SCORING } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";

/**
 * Knockout round identifier. Mirrored here (rather than imported from
 * apps/mobile) so the game-engine package stays free of any app-side
 * dependencies. Keep in sync with the app-side `KnockoutRoundId` in
 * apps/mobile/src/features/bracket/lib/computeBracketLockState.ts.
 */
export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface BracketKnockoutPrediction {
  round: KnockoutRoundId;
  /** Bracket position within the round (0..N-1). */
  index: number;
  /** Nation code the user predicted to win this match. */
  winnerCode: string;
}

export interface BracketKnockoutResult {
  round: KnockoutRoundId;
  index: number;
  /** Actual winning nation code. */
  winnerCode: string;
  /** Actual losing nation code. Needed to evaluate the upset bonus. */
  loserCode: string;
}

export interface BracketScoreInput {
  predictions: {
    /** Per group: ranked nation codes (length 4 — 1st..4th). */
    groups: Partial<Record<GroupId, readonly string[]>>;
    knockouts: readonly BracketKnockoutPrediction[];
  };
  results: {
    /** Per group: actual final standings (length 4 — 1st..4th). */
    groups: Partial<Record<GroupId, readonly string[]>>;
    knockouts: readonly BracketKnockoutResult[];
  };
  /** FIFA seeds keyed by nation code (lower = better). Used for upset bonus. */
  fifaSeeds: Readonly<Record<string, number>>;
}

export interface BracketScoreBreakdownItem {
  kind: "group" | "knockout";
  /** Stable label: "group:A:rank0", "group:A:rank2", "ko:r16:3", etc. */
  key: string;
  points: number;
  reason: string;
}

export interface BracketScoreResult {
  groupPoints: number;
  knockoutPoints: number;
  total: number;
  breakdown: BracketScoreBreakdownItem[];
}

/**
 * Knockout base points by round. Source: BRACKET_SCORING.knockout.
 * Third-place match is not given an explicit value in the PRD/PDF —
 * treat it the same tier as `final` (640) for scoring purposes.
 */
function knockoutBasePoints(round: KnockoutRoundId): number {
  switch (round) {
    case "r32":   return BRACKET_SCORING.knockout.r32;
    case "r16":   return BRACKET_SCORING.knockout.r16;
    case "qf":    return BRACKET_SCORING.knockout.qf;
    case "sf":    return BRACKET_SCORING.knockout.sf;
    case "final": return BRACKET_SCORING.knockout.final;
    // Third-place is intentionally scored at the same tier as the final.
    // The PRD doesn't assign an explicit value; this keeps it a meaningful
    // pick without inventing a brand-new constant.
    case "third": return BRACKET_SCORING.knockout.final;
  }
}

/**
 * Score a user's bracket predictions against actual results.
 *
 * Pure function — no I/O, no Date.now(). Deterministic for a given input.
 *
 * Note: the perfect-knockout-bracket bonus (PERFECT_KNOCKOUT_RUN_BONUS) is
 * NOT applied here.
 * // Perfect-bracket bonus is awarded by the edge function, not here.
 */
export function scoreBracket(input: BracketScoreInput): BracketScoreResult {
  const breakdown: BracketScoreBreakdownItem[] = [];
  let groupPoints = 0;
  let knockoutPoints = 0;

  // ---------- Group stage ----------
  // Iterate groups present in predictions (predictions drive scoring; a missing
  // prediction = 0 for that group). We don't iterate GROUP_IDS to keep this
  // function fully driven by the input.
  const predictedGroupIds = Object.keys(input.predictions.groups) as GroupId[];
  for (const g of predictedGroupIds) {
    const predicted = input.predictions.groups[g];
    const actual = input.results.groups[g];
    if (!predicted || !actual) continue;

    const actualTop2 = new Set<string>();
    if (actual[0]) actualTop2.add(actual[0]);
    if (actual[1]) actualTop2.add(actual[1]);

    const actualBottom2 = new Set<string>();
    if (actual[2]) actualBottom2.add(actual[2]);
    if (actual[3]) actualBottom2.add(actual[3]);

    for (let rank = 0; rank < predicted.length; rank++) {
      const pick = predicted[rank];
      if (!pick) continue;
      const actualAtRank = actual[rank];

      if (rank === 0 || rank === 1) {
        // Top-2 slot: full exactRank if exact match, partial correctQualifier
        // if the nation is still a top-2 qualifier in the OTHER position.
        if (pick === actualAtRank) {
          groupPoints += BRACKET_SCORING.group.exactRank;
          breakdown.push({
            kind: "group",
            key: `group:${g}:rank${rank}`,
            points: BRACKET_SCORING.group.exactRank,
            reason: `Exact rank ${rank + 1} in Group ${g}`,
          });
        } else if (actualTop2.has(pick)) {
          groupPoints += BRACKET_SCORING.group.correctQualifier;
          breakdown.push({
            kind: "group",
            key: `group:${g}:rank${rank}`,
            points: BRACKET_SCORING.group.correctQualifier,
            reason: `Correct qualifier (wrong rank) in Group ${g}`,
          });
        }
      } else {
        // 3rd/4th slot: position-agnostic credit for picking either
        // bottom-2 nation in either bottom-2 slot.
        if (actualBottom2.has(pick)) {
          groupPoints += BRACKET_SCORING.group.correctNonQualifier;
          breakdown.push({
            kind: "group",
            key: `group:${g}:rank${rank}`,
            points: BRACKET_SCORING.group.correctNonQualifier,
            reason: `Correct non-qualifier in Group ${g}`,
          });
        }
      }
    }
  }

  // ---------- Knockout stage ----------
  // Build a result lookup keyed by `${round}:${index}` for O(1) joins.
  const resultByKey = new Map<string, BracketKnockoutResult>();
  for (const r of input.results.knockouts) {
    resultByKey.set(`${r.round}:${r.index}`, r);
  }

  for (const pred of input.predictions.knockouts) {
    const key = `${pred.round}:${pred.index}`;
    const actual = resultByKey.get(key);
    if (!actual) continue;
    if (pred.winnerCode !== actual.winnerCode) continue;

    const base = knockoutBasePoints(pred.round);
    const predSeed = input.fifaSeeds[pred.winnerCode];
    const loserSeed = input.fifaSeeds[actual.loserCode];

    let points = base;
    let reason = `Correct ${pred.round} winner`;
    if (
      typeof predSeed === "number" &&
      typeof loserSeed === "number" &&
      predSeed > loserSeed
    ) {
      // Upset: the predicted winner was a worse seed than the loser.
      const bonus = base * BRACKET_SCORING.knockout.upsetBonusMultiplier;
      points = base + bonus;
      reason = `Correct ${pred.round} winner + upset bonus (seed ${predSeed} beat seed ${loserSeed})`;
    }

    knockoutPoints += points;
    breakdown.push({
      kind: "knockout",
      key: `ko:${pred.round}:${pred.index}`,
      points,
      reason,
    });
  }

  return {
    groupPoints,
    knockoutPoints,
    total: groupPoints + knockoutPoints,
    breakdown,
  };
}
