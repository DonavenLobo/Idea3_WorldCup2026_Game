// MIRROR of packages/game-engine/src/bracket/scoreBracket.ts (commit dcf5c83).
// Edge functions run in Deno and cannot import from workspace packages.
// Keep this file in sync manually when scoring rules change. The canonical
// source of truth for the constants below is:
//   packages/config/src/xpRules.ts
//     - BRACKET_SCORING
//     - PERFECT_KNOCKOUT_RUN_BONUS (intentionally NOT applied in this pure fn —
//       awarded by the edge function caller, if at all)

/** Bracket scoring constants. Mirrors BRACKET_SCORING from xpRules.ts. */
export const BRACKET_SCORING = {
  group: {
    correctQualifier: 30,        // top-2 nation correct, wrong rank
    exactRank: 120,              // top-2 nation correct AND correct position (1st/2nd)
    correctNonQualifier: 25,     // 3rd/4th place correct nation (any rank)
  },
  knockout: {
    r32: 40,
    r16: 80,
    qf: 160,
    sf: 320,
    final: 640,
    champion: 800,
    /** Multiplier applied on top of the base round points when the predicted nation
     *  was a lower FIFA seed than the loser (an "upset" pick that came true). */
    upsetBonusMultiplier: 0.5,
  },
} as const;

export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

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
    case "third": return BRACKET_SCORING.knockout.final;
  }
}

/**
 * Score a user's bracket predictions against actual results.
 *
 * Pure function — no I/O, no Date.now(). Deterministic for a given input.
 *
 * Note: the perfect-knockout-bracket bonus (PERFECT_KNOCKOUT_RUN_BONUS) is
 * NOT applied here. The edge function caller is responsible for adding it
 * once the entire knockout round resolves.
 */
export function scoreBracket(input: BracketScoreInput): BracketScoreResult {
  const breakdown: BracketScoreBreakdownItem[] = [];
  let groupPoints = 0;
  let knockoutPoints = 0;

  // ---------- Group stage ----------
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
