// MIRROR of packages/game-engine/src/trivia/scoreTriviaDay.ts (commit eebbbc4).
// Edge functions run in Deno and cannot import from workspace packages.
// Keep this file in sync manually when scoring rules change. The canonical
// source of truth for the constants below is:
//   packages/config/src/xpRules.ts
//     - TRIVIA_QUESTION_TIERS
//     - TRIVIA_TIMER_SECONDS
//     - TRIVIA_ALL_THREE_COMBO_BONUS
//     - TRIVIA_STREAK_MULTIPLIER_STEPS / getTriviaStreakMultiplier

/** Per-question base points for Q1, Q2, Q3. Mirrors TRIVIA_QUESTION_TIERS. */
export const TRIVIA_QUESTION_TIERS = [50, 100, 200] as const;

/** Default per-question timer for speed bonus. Mirrors TRIVIA_TIMER_SECONDS. */
export const TRIVIA_TIMER_SECONDS = 30;

/** Bonus when all 3 daily questions are correct. Mirrors TRIVIA_ALL_THREE_COMBO_BONUS. */
export const TRIVIA_ALL_THREE_COMBO_BONUS = 100;

/** Streak multiplier ramp. Mirrors TRIVIA_STREAK_MULTIPLIER_STEPS. */
export const TRIVIA_STREAK_MULTIPLIER_STEPS = [
  { minStreak: 3, multiplier: 1.10 },
  { minStreak: 5, multiplier: 1.20 },
  { minStreak: 10, multiplier: 1.30 },
] as const;

/** Returns the multiplier for a given streak count (>= 0). */
export function getTriviaStreakMultiplier(currentStreak: number): number {
  let mult = 1;
  for (const step of TRIVIA_STREAK_MULTIPLIER_STEPS) {
    if (currentStreak >= step.minStreak) mult = step.multiplier;
  }
  return mult;
}

export interface TriviaQuestionResult {
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface ScoreTriviaDayPerQuestion {
  questionId: string;
  basePoints: number;
  speedBonus: number;
  total: number;
}

export interface ScoreTriviaDayResult {
  perQuestion: [
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
  ];
  baseSum: number;
  comboBonusApplied: number;
  streakMultiplier: number;
  newStreak: number;
  competitivePoints: number;
}

const TIMER_MS = TRIVIA_TIMER_SECONDS * 1000;

/**
 * Per-question scoring:
 *   incorrect = 0
 *   correct   = round(base + base * max(0, 1 - rt / (2 * T)))
 * rt is clamped to [0, T].
 */
function scoreQuestion(
  answer: TriviaQuestionResult,
  base: number
): ScoreTriviaDayPerQuestion {
  if (!answer.isCorrect) {
    return {
      questionId: answer.questionId,
      basePoints: 0,
      speedBonus: 0,
      total: 0,
    };
  }

  const rtMs = Math.max(0, Math.min(answer.responseTimeMs, TIMER_MS));
  const remainingRatio = Math.max(0, 1 - rtMs / (2 * TIMER_MS));
  const speedBonusRaw = base * remainingRatio;
  const speedBonus = Math.round(speedBonusRaw);
  // Round the total from the un-rounded sum to avoid double-rounding drift.
  const total = Math.round(base + speedBonusRaw);

  return {
    questionId: answer.questionId,
    basePoints: base,
    speedBonus,
    total,
  };
}

/**
 * Pure day-scoped trivia scorer. Mirrors the canonical
 * packages/game-engine `scoreTriviaDay` function.
 *
 * Answers MUST be passed in Q1/Q2/Q3 order — the caller is responsible for
 * sorting by `question_order` before invoking this.
 */
export function computeDayScore(
  answers: [TriviaQuestionResult, TriviaQuestionResult, TriviaQuestionResult],
  currentStreak: number
): ScoreTriviaDayResult {
  const perQuestion: [
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
  ] = [
    scoreQuestion(answers[0], TRIVIA_QUESTION_TIERS[0]),
    scoreQuestion(answers[1], TRIVIA_QUESTION_TIERS[1]),
    scoreQuestion(answers[2], TRIVIA_QUESTION_TIERS[2]),
  ];

  const baseSum = perQuestion.reduce((sum, q) => sum + q.total, 0);

  const allCorrect =
    answers[0].isCorrect && answers[1].isCorrect && answers[2].isCorrect;

  const comboBonusApplied = allCorrect ? TRIVIA_ALL_THREE_COMBO_BONUS : 0;

  const safeCurrentStreak = Math.max(0, currentStreak);
  const newStreak = allCorrect ? safeCurrentStreak + 1 : 0;

  // Multiplier kicks in on the day the milestone is HIT (uses NEW streak).
  const streakMultiplier = getTriviaStreakMultiplier(newStreak);

  const competitivePoints = Math.round(
    (baseSum + comboBonusApplied) * streakMultiplier
  );

  return {
    perQuestion,
    baseSum,
    comboBonusApplied,
    streakMultiplier,
    newStreak,
    competitivePoints,
  };
}
