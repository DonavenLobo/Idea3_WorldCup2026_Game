// Tests for the pure scoring helper inside scoreTriviaDay.ts (Deno mirror of
// packages/game-engine/src/trivia/scoreTriviaDay.ts). Mirrors the 8 logic
// cases from packages/game-engine/src/trivia/scoreTriviaDay.test.ts.
//
// Run with: deno test supabase/functions/score-trivia-attempt/index.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  computeDayScore,
  getTriviaStreakMultiplier,
  TRIVIA_ALL_THREE_COMBO_BONUS,
  TRIVIA_QUESTION_TIERS,
  TRIVIA_TIMER_SECONDS,
  type TriviaQuestionResult,
} from "./scoreTriviaDay.ts";

const TIMER_MS = TRIVIA_TIMER_SECONDS * 1000;
const [BASE_Q1, BASE_Q2, BASE_Q3] = TRIVIA_QUESTION_TIERS;

/** Mirror of the per-question formula used in computeDayScore. */
function expectedQ(base: number, rtMs: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  const clamped = Math.max(0, Math.min(rtMs, TIMER_MS));
  const remaining = Math.max(0, 1 - clamped / (2 * TIMER_MS));
  return Math.round(base + base * remaining);
}

function mk(
  questionId: string,
  isCorrect: boolean,
  responseTimeMs: number,
): TriviaQuestionResult {
  return { questionId, isCorrect, responseTimeMs };
}

function approxEquals(actual: number, expected: number, eps = 1e-9) {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`expected ${expected}, got ${actual}`);
  }
}

Deno.test("01 all wrong, streak=0 → 0 points, newStreak=0, mult=1.0", () => {
  const out = computeDayScore(
    [mk("q1", false, 0), mk("q2", false, 15000), mk("q3", false, 30000)],
    0,
  );
  assertEquals(out.competitivePoints, 0);
  assertEquals(out.newStreak, 0);
  assertEquals(out.comboBonusApplied, 0);
  assertEquals(out.baseSum, 0);
  approxEquals(out.streakMultiplier, 1.0);
});

Deno.test("02 Q1 correct instant only, streak=0 → 100", () => {
  const out = computeDayScore(
    [mk("q1", true, 0), mk("q2", false, 5000), mk("q3", false, 8000)],
    0,
  );
  const eq1 = expectedQ(BASE_Q1, 0, true);
  assertEquals(eq1, 100);
  assertEquals(out.perQuestion[0].total, eq1);
  assertEquals(out.perQuestion[1].total, 0);
  assertEquals(out.perQuestion[2].total, 0);
  assertEquals(out.baseSum, eq1);
  assertEquals(out.comboBonusApplied, 0);
  assertEquals(out.newStreak, 0);
  approxEquals(out.streakMultiplier, 1.0);
  assertEquals(out.competitivePoints, eq1);
});

Deno.test("03 all 3 correct full timer, streak=0 → 625, newStreak=1, mult=1.0", () => {
  const out = computeDayScore(
    [mk("q1", true, 30000), mk("q2", true, 30000), mk("q3", true, 30000)],
    0,
  );
  const eq1 = expectedQ(BASE_Q1, 30000, true); // 75
  const eq2 = expectedQ(BASE_Q2, 30000, true); // 150
  const eq3 = expectedQ(BASE_Q3, 30000, true); // 300
  const baseSum = eq1 + eq2 + eq3; // 525
  const mult = getTriviaStreakMultiplier(1); // 1.0
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  assertEquals(eq1, 75);
  assertEquals(eq2, 150);
  assertEquals(eq3, 300);
  assertEquals(out.perQuestion[0].total, eq1);
  assertEquals(out.perQuestion[1].total, eq2);
  assertEquals(out.perQuestion[2].total, eq3);
  assertEquals(out.baseSum, baseSum);
  assertEquals(baseSum, 525);
  assertEquals(out.comboBonusApplied, TRIVIA_ALL_THREE_COMBO_BONUS);
  assertEquals(out.newStreak, 1);
  approxEquals(out.streakMultiplier, 1.0);
  assertEquals(out.competitivePoints, expectedTotal);
  assertEquals(expectedTotal, 625);
});

Deno.test("04 all 3 correct instant, streak=0 → 800, newStreak=1, mult=1.0", () => {
  const out = computeDayScore(
    [mk("q1", true, 0), mk("q2", true, 0), mk("q3", true, 0)],
    0,
  );
  const eq1 = expectedQ(BASE_Q1, 0, true); // 100
  const eq2 = expectedQ(BASE_Q2, 0, true); // 200
  const eq3 = expectedQ(BASE_Q3, 0, true); // 400
  const baseSum = eq1 + eq2 + eq3; // 700
  const mult = getTriviaStreakMultiplier(1);
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  assertEquals(out.baseSum, baseSum);
  assertEquals(baseSum, 700);
  assertEquals(out.comboBonusApplied, TRIVIA_ALL_THREE_COMBO_BONUS);
  assertEquals(out.newStreak, 1);
  approxEquals(out.streakMultiplier, 1.0);
  assertEquals(out.competitivePoints, expectedTotal);
  assertEquals(expectedTotal, 800);
});

Deno.test("05 all 3 instant, currentStreak=2 → newStreak=3, mult=1.10, 880", () => {
  const out = computeDayScore(
    [mk("q1", true, 0), mk("q2", true, 0), mk("q3", true, 0)],
    2,
  );
  const baseSum =
    expectedQ(BASE_Q1, 0, true) +
    expectedQ(BASE_Q2, 0, true) +
    expectedQ(BASE_Q3, 0, true);
  const mult = getTriviaStreakMultiplier(3);
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  assertEquals(out.newStreak, 3);
  approxEquals(out.streakMultiplier, 1.10);
  approxEquals(mult, 1.10);
  assertEquals(out.competitivePoints, expectedTotal);
  assertEquals(expectedTotal, 880);
});

Deno.test("06 all 3 full timer, currentStreak=4 → newStreak=5, mult=1.20, 750", () => {
  const out = computeDayScore(
    [mk("q1", true, 30000), mk("q2", true, 30000), mk("q3", true, 30000)],
    4,
  );
  const baseSum =
    expectedQ(BASE_Q1, 30000, true) +
    expectedQ(BASE_Q2, 30000, true) +
    expectedQ(BASE_Q3, 30000, true);
  const mult = getTriviaStreakMultiplier(5);
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  assertEquals(out.newStreak, 5);
  approxEquals(out.streakMultiplier, 1.20);
  approxEquals(mult, 1.20);
  assertEquals(out.competitivePoints, expectedTotal);
  assertEquals(expectedTotal, 750);
});

Deno.test("07 all 3 instant, currentStreak=9 → newStreak=10, mult=1.30, 1040", () => {
  const out = computeDayScore(
    [mk("q1", true, 0), mk("q2", true, 0), mk("q3", true, 0)],
    9,
  );
  const baseSum =
    expectedQ(BASE_Q1, 0, true) +
    expectedQ(BASE_Q2, 0, true) +
    expectedQ(BASE_Q3, 0, true);
  const mult = getTriviaStreakMultiplier(10);
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  assertEquals(out.newStreak, 10);
  approxEquals(out.streakMultiplier, 1.30);
  approxEquals(mult, 1.30);
  assertEquals(out.competitivePoints, expectedTotal);
  assertEquals(expectedTotal, 1040);
});

Deno.test("08 Q1+Q3 correct, Q2 wrong, currentStreak=8 → newStreak=0, 500", () => {
  const out = computeDayScore(
    [mk("q1", true, 0), mk("q2", false, 12345), mk("q3", true, 0)],
    8,
  );
  const eq1 = expectedQ(BASE_Q1, 0, true); // 100
  const eq3 = expectedQ(BASE_Q3, 0, true); // 400
  const baseSum = eq1 + 0 + eq3; // 500
  const mult = getTriviaStreakMultiplier(0);
  const expectedTotal = Math.round(baseSum * mult);

  assertEquals(out.perQuestion[0].total, eq1);
  assertEquals(out.perQuestion[1].total, 0);
  assertEquals(out.perQuestion[2].total, eq3);
  assertEquals(out.baseSum, baseSum);
  assertEquals(baseSum, 500);
  assertEquals(out.comboBonusApplied, 0);
  assertEquals(out.newStreak, 0);
  approxEquals(out.streakMultiplier, 1.0);
  assertEquals(out.competitivePoints, expectedTotal);
  assertEquals(expectedTotal, 500);
});
