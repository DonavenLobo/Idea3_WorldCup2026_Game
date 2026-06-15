/**
 * Hand-rolled tests for scoreTriviaDay. No framework — run with:
 *   pnpm dlx tsx packages/game-engine/src/trivia/scoreTriviaDay.test.ts
 * Throws only if a case fails.
 *
 * Expected values are derived from the constants in @world-cup-game/config so
 * the suite survives future tuning of TRIVIA_QUESTION_TIERS / TIMER / combo /
 * streak multipliers, as long as the formula shape stays the same.
 */

import {
  TRIVIA_QUESTION_TIERS,
  TRIVIA_TIMER_SECONDS,
  TRIVIA_ALL_THREE_COMBO_BONUS,
  getTriviaStreakMultiplier,
} from "@world-cup-game/config";
import { scoreTriviaDay } from "./scoreTriviaDay";
import type { TriviaQuestionResult } from "./scoreTriviaDay";

// ---------- Tiny test harness ----------
let failed = 0;
let passed = 0;

function eq<T>(name: string, actual: T, expected: T): void {
  if (actual === expected) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(`        expected: ${String(expected)}`);
    console.error(`        actual:   ${String(actual)}`);
  }
}

function approxEq(name: string, actual: number, expected: number, eps = 1e-9): void {
  if (Math.abs(actual - expected) <= eps) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(`        expected: ${expected}`);
    console.error(`        actual:   ${actual}`);
  }
}

// ---------- Helpers / constants ----------
const TIMER_MS = TRIVIA_TIMER_SECONDS * 1000;
const [BASE_Q1, BASE_Q2, BASE_Q3] = TRIVIA_QUESTION_TIERS;

/** Mirror of the per-question formula in scoreTriviaDay. */
function expectedQ(base: number, rtMs: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  const clamped = Math.max(0, Math.min(rtMs, TIMER_MS));
  const remaining = Math.max(0, 1 - clamped / (2 * TIMER_MS));
  return Math.round(base + base * remaining);
}

function mk(
  questionId: string,
  isCorrect: boolean,
  responseTimeMs: number
): TriviaQuestionResult {
  return { questionId, isCorrect, responseTimeMs };
}

// ---------- Test 1: All wrong, streak=0 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", false, 0),
      mk("q2", false, 15000),
      mk("q3", false, 30000),
    ],
    currentStreak: 0,
  });
  eq("01 all wrong — competitivePoints", out.competitivePoints, 0);
  eq("01 all wrong — newStreak", out.newStreak, 0);
  eq("01 all wrong — comboBonusApplied", out.comboBonusApplied, 0);
  approxEq("01 all wrong — multiplier", out.streakMultiplier, 1.0);
  eq("01 all wrong — baseSum", out.baseSum, 0);
}

// ---------- Test 2: Q1 correct only, instant, streak=0 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true, 0),
      mk("q2", false, 5000),
      mk("q3", false, 8000),
    ],
    currentStreak: 0,
  });
  const expectedQ1 = expectedQ(BASE_Q1, 0, true); // 100
  eq("02 Q1 only — Q1 total", out.perQuestion[0].total, expectedQ1);
  eq("02 Q1 only — Q1 expected 100", expectedQ1, 100);
  eq("02 Q1 only — Q2 total", out.perQuestion[1].total, 0);
  eq("02 Q1 only — Q3 total", out.perQuestion[2].total, 0);
  eq("02 Q1 only — baseSum", out.baseSum, expectedQ1);
  eq("02 Q1 only — comboBonusApplied", out.comboBonusApplied, 0);
  eq("02 Q1 only — newStreak", out.newStreak, 0);
  approxEq("02 Q1 only — multiplier", out.streakMultiplier, 1.0);
  eq("02 Q1 only — competitivePoints", out.competitivePoints, expectedQ1);
}

// ---------- Test 3: All 3 correct, full timer (rt=30000), streak 0→1 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true, 30000),
      mk("q2", true, 30000),
      mk("q3", true, 30000),
    ],
    currentStreak: 0,
  });
  const eq1 = expectedQ(BASE_Q1, 30000, true); // 75
  const eq2 = expectedQ(BASE_Q2, 30000, true); // 150
  const eq3 = expectedQ(BASE_Q3, 30000, true); // 300
  const baseSum = eq1 + eq2 + eq3;             // 525
  const mult = getTriviaStreakMultiplier(1);   // 1.0
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  eq("03 all 3 full-timer — Q1 total", out.perQuestion[0].total, eq1);
  eq("03 all 3 full-timer — Q2 total", out.perQuestion[1].total, eq2);
  eq("03 all 3 full-timer — Q3 total", out.perQuestion[2].total, eq3);
  eq("03 all 3 full-timer — Q1 expected 75", eq1, 75);
  eq("03 all 3 full-timer — Q2 expected 150", eq2, 150);
  eq("03 all 3 full-timer — Q3 expected 300", eq3, 300);
  eq("03 all 3 full-timer — baseSum", out.baseSum, baseSum);
  eq("03 all 3 full-timer — baseSum expected 525", baseSum, 525);
  eq("03 all 3 full-timer — comboBonusApplied", out.comboBonusApplied, TRIVIA_ALL_THREE_COMBO_BONUS);
  eq("03 all 3 full-timer — newStreak", out.newStreak, 1);
  approxEq("03 all 3 full-timer — multiplier", out.streakMultiplier, mult);
  eq("03 all 3 full-timer — competitivePoints", out.competitivePoints, expectedTotal);
  eq("03 all 3 full-timer — expected total 625", expectedTotal, 625);
}

// ---------- Test 4: All 3 correct, instant, streak 0→1 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true, 0),
      mk("q2", true, 0),
      mk("q3", true, 0),
    ],
    currentStreak: 0,
  });
  const eq1 = expectedQ(BASE_Q1, 0, true); // 100
  const eq2 = expectedQ(BASE_Q2, 0, true); // 200
  const eq3 = expectedQ(BASE_Q3, 0, true); // 400
  const baseSum = eq1 + eq2 + eq3;         // 700
  const mult = getTriviaStreakMultiplier(1); // 1.0
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  eq("04 all 3 instant — baseSum", out.baseSum, baseSum);
  eq("04 all 3 instant — baseSum expected 700", baseSum, 700);
  eq("04 all 3 instant — comboBonusApplied", out.comboBonusApplied, TRIVIA_ALL_THREE_COMBO_BONUS);
  eq("04 all 3 instant — newStreak", out.newStreak, 1);
  approxEq("04 all 3 instant — multiplier", out.streakMultiplier, 1.0);
  eq("04 all 3 instant — competitivePoints", out.competitivePoints, expectedTotal);
  eq("04 all 3 instant — expected total 800", expectedTotal, 800);
}

// ---------- Test 5: All 3 correct, instant, currentStreak=2 → newStreak=3, mult=1.10 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true, 0),
      mk("q2", true, 0),
      mk("q3", true, 0),
    ],
    currentStreak: 2,
  });
  const baseSum = expectedQ(BASE_Q1, 0, true) + expectedQ(BASE_Q2, 0, true) + expectedQ(BASE_Q3, 0, true);
  const mult = getTriviaStreakMultiplier(3); // 1.10
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  eq("05 streak hits 3 — newStreak", out.newStreak, 3);
  approxEq("05 streak hits 3 — multiplier", out.streakMultiplier, 1.10);
  approxEq("05 streak hits 3 — multiplier from helper", mult, 1.10);
  eq("05 streak hits 3 — competitivePoints", out.competitivePoints, expectedTotal);
  eq("05 streak hits 3 — expected total 880", expectedTotal, 880);
}

// ---------- Test 6: All 3 correct, full timer, currentStreak=4 → newStreak=5, mult=1.20 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true, 30000),
      mk("q2", true, 30000),
      mk("q3", true, 30000),
    ],
    currentStreak: 4,
  });
  const baseSum =
    expectedQ(BASE_Q1, 30000, true) +
    expectedQ(BASE_Q2, 30000, true) +
    expectedQ(BASE_Q3, 30000, true);
  const mult = getTriviaStreakMultiplier(5); // 1.20
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  eq("06 streak hits 5 — newStreak", out.newStreak, 5);
  approxEq("06 streak hits 5 — multiplier", out.streakMultiplier, 1.20);
  approxEq("06 streak hits 5 — multiplier from helper", mult, 1.20);
  eq("06 streak hits 5 — competitivePoints", out.competitivePoints, expectedTotal);
  eq("06 streak hits 5 — expected total 750", expectedTotal, 750);
}

// ---------- Test 7: All 3 correct, instant, currentStreak=9 → newStreak=10, mult=1.30 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true, 0),
      mk("q2", true, 0),
      mk("q3", true, 0),
    ],
    currentStreak: 9,
  });
  const baseSum =
    expectedQ(BASE_Q1, 0, true) +
    expectedQ(BASE_Q2, 0, true) +
    expectedQ(BASE_Q3, 0, true);
  const mult = getTriviaStreakMultiplier(10); // 1.30
  const expectedTotal = Math.round((baseSum + TRIVIA_ALL_THREE_COMBO_BONUS) * mult);

  eq("07 streak hits 10 — newStreak", out.newStreak, 10);
  approxEq("07 streak hits 10 — multiplier", out.streakMultiplier, 1.30);
  approxEq("07 streak hits 10 — multiplier from helper", mult, 1.30);
  eq("07 streak hits 10 — competitivePoints", out.competitivePoints, expectedTotal);
  eq("07 streak hits 10 — expected total 1040", expectedTotal, 1040);
}

// ---------- Test 8: Q1+Q3 correct, Q2 wrong, currentStreak=8 → resets to 0 ----------
{
  const out = scoreTriviaDay({
    answers: [
      mk("q1", true,  0),
      mk("q2", false, 12345),
      mk("q3", true,  0),
    ],
    currentStreak: 8,
  });
  const eq1 = expectedQ(BASE_Q1, 0, true);     // 100
  const eq2 = 0;
  const eq3 = expectedQ(BASE_Q3, 0, true);     // 400
  const baseSum = eq1 + eq2 + eq3;             // 500
  const mult = getTriviaStreakMultiplier(0);   // 1.0
  const expectedTotal = Math.round(baseSum * mult);

  eq("08 streak resets — Q1 total", out.perQuestion[0].total, eq1);
  eq("08 streak resets — Q2 total", out.perQuestion[1].total, 0);
  eq("08 streak resets — Q3 total", out.perQuestion[2].total, eq3);
  eq("08 streak resets — baseSum", out.baseSum, baseSum);
  eq("08 streak resets — baseSum expected 500", baseSum, 500);
  eq("08 streak resets — comboBonusApplied", out.comboBonusApplied, 0);
  eq("08 streak resets — newStreak", out.newStreak, 0);
  approxEq("08 streak resets — multiplier", out.streakMultiplier, 1.0);
  eq("08 streak resets — competitivePoints", out.competitivePoints, expectedTotal);
  eq("08 streak resets — expected total 500", expectedTotal, 500);
}

// ---------- Summary ----------
const total = passed + failed;
console.log("");
console.log(`Results: ${passed}/${total} passed`);
if (failed > 0) {
  console.error(`${failed} test(s) FAILED`);
  throw new Error(`${failed} test(s) failed`);
}
console.log("All tests PASS");
