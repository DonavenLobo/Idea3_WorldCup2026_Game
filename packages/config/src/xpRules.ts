export const TRIVIA_RULES = {
  questionsPerDay: 5,
  answerOptionsPerQuestion: 4,
  correctAnswerCompetitivePoints: 100,
  maxSpeedBonusPerQuestion: 20,
  correctAnswerCardXp: 25,
  completedDailyTriviaCardXp: 50
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
