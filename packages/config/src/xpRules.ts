/**
 * Per-question tier configuration.
 * Question order in the DB is 1-indexed (Q1, Q2, Q3); this array is 0-indexed.
 *
 * Difficulty ramps within each daily attempt:
 *   - Q1 (easy):   100 base + up to +20 speed = max 120, 20s to answer
 *   - Q2 (medium): 150 base + up to +30 speed = max 180, 30s to answer
 *   - Q3 (hard):   200 base + up to +40 speed = max 240, 45s to answer
 * Daily max (3 correct, all max-speed): 540 competitive points.
 */
export const TRIVIA_QUESTION_TIERS = [
  {
    difficulty: "easy",
    basePoints: 100,
    maxSpeedBonus: 20,
    timeLimitMs: 20_000
  },
  {
    difficulty: "medium",
    basePoints: 150,
    maxSpeedBonus: 30,
    timeLimitMs: 30_000
  },
  {
    difficulty: "hard",
    basePoints: 200,
    maxSpeedBonus: 40,
    timeLimitMs: 45_000
  }
] as const;

export type TriviaDifficulty = (typeof TRIVIA_QUESTION_TIERS)[number]["difficulty"];

/**
 * Look up the tier config for a question by its 1-indexed question_order.
 * Returns the easy tier if order is out of range (defensive fallback).
 */
export function getTriviaTierForOrder(questionOrder: number) {
  const idx = Math.max(0, Math.min(TRIVIA_QUESTION_TIERS.length - 1, questionOrder - 1));
  return TRIVIA_QUESTION_TIERS[idx]!;
}

export const TRIVIA_RULES = {
  questionsPerDay: 3,
  answerOptionsPerQuestion: 4,
  tiers: TRIVIA_QUESTION_TIERS,
  correctAnswerCardXp: 25,
  completedDailyTriviaCardXp: 50,
  /**
   * @deprecated Use `tiers[0].basePoints` or `getTriviaTierForOrder(order).basePoints`.
   * Kept for legacy UI code that displays a generic "per-question" baseline.
   */
  correctAnswerCompetitivePoints: TRIVIA_QUESTION_TIERS[0].basePoints,
  /**
   * @deprecated Use `tiers[N].maxSpeedBonus` for the appropriate tier.
   * Kept for legacy UI code that displays a generic speed-bonus baseline.
   */
  maxSpeedBonusPerQuestion: TRIVIA_QUESTION_TIERS[0].maxSpeedBonus
} as const;

export const BOUNTY_RULES = {
  awardsCompetitivePoints: false,
  revealRewardOnOpen: true
} as const;

export const ECONOMY_RULES = {
  purchasesAffectCompetitivePoints: false,
  cardsCanDowngrade: false
} as const;
