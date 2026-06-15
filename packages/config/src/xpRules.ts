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

// === PR-A additions ===

// === NEW — drives Task 3 (scoreTriviaDay) ===

/** Per-question base points (Q1, Q2, Q3) — PDF p.1 */
export const TRIVIA_QUESTION_TIERS = [50, 100, 200] as const;

/** Default per-question timer for speed bonus */
export const TRIVIA_TIMER_SECONDS = 30;

/** Bonus when all 3 daily questions are correct — PDF p.1 */
export const TRIVIA_ALL_THREE_COMBO_BONUS = 100;

/** Streak multiplier ramp on the day's total — PDF p.2 */
export const TRIVIA_STREAK_MULTIPLIER_STEPS = [
  { minStreak: 3,  multiplier: 1.10 },
  { minStreak: 5,  multiplier: 1.20 },
  { minStreak: 10, multiplier: 1.30 },
] as const;

/** Helper — returns the multiplier for a given current streak count (>=1). */
export function getTriviaStreakMultiplier(currentStreak: number): number {
  let mult = 1;
  for (const step of TRIVIA_STREAK_MULTIPLIER_STEPS) {
    if (currentStreak >= step.minStreak) mult = step.multiplier;
  }
  return mult;
}

/** Perfect daily run bonus — PDF p.1 */
export const PERFECT_TRIVIA_RUN_BONUS = 0; // PRD has this folded into the all-three bonus; reserved for future use

// === NEW — drives Task 2 (scoreBracket) ===

export const BRACKET_SCORING = {
  group: {
    correctQualifier: 30,        // top-2 nation correct, wrong rank
    exactRank: 120,              // top-2 nation correct AND correct position (1st/2nd)
    correctNonQualifier: 25,     // 3rd/4th place correct nation (any rank)
  },
  knockout: {
    // PDF p.3-4 — doubling progression
    r32: 40,
    r16: 80,
    qf:  160,
    sf:  320,
    final: 640,
    champion: 800,
    /** Multiplier applied on top of the base round points when the predicted nation
     *  was a lower FIFA seed than the loser (an "upset" pick that came true). */
    upsetBonusMultiplier: 0.5,
  },
} as const;

/** Perfect-knockout-bracket bonus — PDF p.4 */
export const PERFECT_KNOCKOUT_RUN_BONUS = 1000;

// === NEW — drives Task 4 (computeLoginReward) ===

export const LOGIN_REWARDS = {
  perDay: 25,
  milestones: [
    { atStreak: 7,  bonus: 100 },
    { atStreak: 14, bonus: 300 },
    { atStreak: 30, bonus: 600 },
    { atStreak: 60, bonus: 1000 },
  ],
} as const;
