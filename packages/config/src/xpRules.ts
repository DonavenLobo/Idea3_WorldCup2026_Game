/**
 * Per-question base points for Q1, Q2, Q3.
 *
 * The daily scorer adds a speed bonus up to the question's base value, then
 * applies the all-three combo bonus and any streak multiplier.
 */
export const TRIVIA_QUESTION_TIERS = [50, 100, 200] as const;

/** Default per-question timer for speed bonus calculations. */
export const TRIVIA_TIMER_SECONDS = 30;

/** Bonus when all 3 daily questions are correct. */
export const TRIVIA_ALL_THREE_COMBO_BONUS = 100;

/**
 * Display/helper metadata derived from the canonical numeric tiers above.
 * Keep scoring code on TRIVIA_QUESTION_TIERS so the mobile app and edge
 * function do not drift.
 */
export const TRIVIA_QUESTION_TIER_DETAILS = [
  {
    difficulty: "easy",
    basePoints: TRIVIA_QUESTION_TIERS[0],
    maxSpeedBonus: TRIVIA_QUESTION_TIERS[0],
    timeLimitMs: TRIVIA_TIMER_SECONDS * 1000
  },
  {
    difficulty: "medium",
    basePoints: TRIVIA_QUESTION_TIERS[1],
    maxSpeedBonus: TRIVIA_QUESTION_TIERS[1],
    timeLimitMs: TRIVIA_TIMER_SECONDS * 1000
  },
  {
    difficulty: "hard",
    basePoints: TRIVIA_QUESTION_TIERS[2],
    maxSpeedBonus: TRIVIA_QUESTION_TIERS[2],
    timeLimitMs: TRIVIA_TIMER_SECONDS * 1000
  }
] as const;

export type TriviaDifficulty = (typeof TRIVIA_QUESTION_TIER_DETAILS)[number]["difficulty"];

/**
 * Look up the tier config for a question by its 1-indexed question_order.
 * Returns the easy tier if order is out of range (defensive fallback).
 */
export function getTriviaTierForOrder(questionOrder: number) {
  const idx = Math.max(
    0,
    Math.min(TRIVIA_QUESTION_TIER_DETAILS.length - 1, questionOrder - 1)
  );
  return TRIVIA_QUESTION_TIER_DETAILS[idx]!;
}

export const TRIVIA_RULES = {
  questionsPerDay: 3,
  answerOptionsPerQuestion: 4,
  tiers: TRIVIA_QUESTION_TIER_DETAILS,
  correctAnswerCardXp: 25,
  completedDailyTriviaCardXp: 50,
  correctAnswerCompetitivePoints: TRIVIA_QUESTION_TIERS[0],
  maxSpeedBonusPerQuestion: TRIVIA_QUESTION_TIERS[0]
} as const;

export const BOUNTY_RULES = {
  awardsCompetitivePoints: false,
  revealRewardOnOpen: true
} as const;

export const ECONOMY_RULES = {
  purchasesAffectCompetitivePoints: false,
  cardsCanDowngrade: false
} as const;

/** Streak multiplier ramp on the day's total. */
export const TRIVIA_STREAK_MULTIPLIER_STEPS = [
  { minStreak: 3, multiplier: 1.10 },
  { minStreak: 5, multiplier: 1.20 },
  { minStreak: 10, multiplier: 1.30 },
] as const;

/** Returns the multiplier for a given current streak count. */
export function getTriviaStreakMultiplier(currentStreak: number): number {
  let mult = 1;
  for (const step of TRIVIA_STREAK_MULTIPLIER_STEPS) {
    if (currentStreak >= step.minStreak) mult = step.multiplier;
  }
  return mult;
}

/** Perfect daily run bonus; reserved for future use. */
export const PERFECT_TRIVIA_RUN_BONUS = 0;

export const BRACKET_SCORING = {
  group: {
    correctQualifier: 30,
    exactRank: 120,
    correctNonQualifier: 25,
  },
  knockout: {
    r32: 40,
    r16: 80,
    qf: 160,
    sf: 320,
    final: 640,
    champion: 800,
    upsetBonusMultiplier: 0.5,
  },
} as const;

/** Perfect-knockout-bracket bonus. */
export const PERFECT_KNOCKOUT_RUN_BONUS = 1000;

export const LOGIN_REWARDS = {
  perDay: 25,
  milestones: [
    { atStreak: 7, bonus: 100 },
    { atStreak: 14, bonus: 300 },
    { atStreak: 30, bonus: 600 },
    { atStreak: 60, bonus: 1000 },
  ],
} as const;
