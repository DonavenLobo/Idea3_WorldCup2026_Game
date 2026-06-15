/**
 * Hand-rolled tests for computeLoginReward. No framework — run with:
 *   pnpm dlx tsx packages/game-engine/src/login/computeLoginReward.test.ts
 * Throws only if a case fails.
 *
 * Expected values are derived from LOGIN_REWARDS in @world-cup-game/config so
 * the suite survives future tuning of perDay / milestones, as long as the
 * formula shape (perDay + on-exact-day milestone) stays the same.
 */

import { LOGIN_REWARDS } from "@world-cup-game/config";
import { computeLoginReward } from "./computeLoginReward";

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

function eqMilestone(
  name: string,
  actual: { atStreak: number; bonus: number } | null,
  expected: { atStreak: number; bonus: number } | null
): void {
  if (actual === null && expected === null) {
    passed += 1;
    console.log(`PASS  ${name}`);
    return;
  }
  if (
    actual !== null &&
    expected !== null &&
    actual.atStreak === expected.atStreak &&
    actual.bonus === expected.bonus
  ) {
    passed += 1;
    console.log(`PASS  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL  ${name}`);
  console.error(`        expected: ${JSON.stringify(expected)}`);
  console.error(`        actual:   ${JSON.stringify(actual)}`);
}

// ---------- Constants derived from LOGIN_REWARDS (no magic numbers) ----------
const PER_DAY = LOGIN_REWARDS.perDay;
function milestoneFor(atStreak: number): { atStreak: number; bonus: number } {
  const m = LOGIN_REWARDS.milestones.find((x) => x.atStreak === atStreak);
  if (!m) {
    throw new Error(
      `Test bug: no milestone configured at streak ${atStreak}; available: ${
        LOGIN_REWARDS.milestones.map((x) => x.atStreak).join(",")
      }`
    );
  }
  return { atStreak: m.atStreak, bonus: m.bonus };
}
const M7 = milestoneFor(7);
const M14 = milestoneFor(14);
const M30 = milestoneFor(30);
const M60 = milestoneFor(60);

// ---------- Test 1: First-ever login ----------
{
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: null,
    currentStreak: 0,
    longestStreak: 0,
  });
  eq("01 first-ever — shouldClaim", out.shouldClaim, true);
  eq("01 first-ever — awarded", out.awarded, PER_DAY);
  eq("01 first-ever — awarded value 25", PER_DAY, 25);
  eq("01 first-ever — newStreak", out.newStreak, 1);
  eq("01 first-ever — newLongestStreak", out.newLongestStreak, 1);
  eqMilestone("01 first-ever — milestoneHit", out.milestoneHit, null);
  eq("01 first-ever — newLastLoginDateKey", out.newLastLoginDateKey, "2026-06-15");
}

// ---------- Test 2: Same-day re-call ----------
{
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-15",
    currentStreak: 3,
    longestStreak: 9,
  });
  eq("02 same-day — shouldClaim", out.shouldClaim, false);
  eq("02 same-day — awarded", out.awarded, 0);
  eq("02 same-day — newStreak (unchanged)", out.newStreak, 3);
  eq("02 same-day — newLongestStreak (unchanged)", out.newLongestStreak, 9);
  eqMilestone("02 same-day — milestoneHit", out.milestoneHit, null);
  eq("02 same-day — newLastLoginDateKey", out.newLastLoginDateKey, "2026-06-15");
}

// ---------- Test 3: Yesterday login, streak 1 → 2 ----------
{
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-14",
    currentStreak: 1,
    longestStreak: 1,
  });
  eq("03 yesterday +1 — shouldClaim", out.shouldClaim, true);
  eq("03 yesterday +1 — awarded", out.awarded, PER_DAY);
  eq("03 yesterday +1 — newStreak", out.newStreak, 2);
  eq("03 yesterday +1 — newLongestStreak", out.newLongestStreak, 2);
  eqMilestone("03 yesterday +1 — milestoneHit", out.milestoneHit, null);
  eq("03 yesterday +1 — newLastLoginDateKey", out.newLastLoginDateKey, "2026-06-15");
}

// ---------- Test 4: Streak hits 7 (milestone) ----------
{
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-14",
    currentStreak: 6,
    longestStreak: 6,
  });
  eq("04 hits 7 — shouldClaim", out.shouldClaim, true);
  eq("04 hits 7 — awarded", out.awarded, PER_DAY + M7.bonus);
  eq("04 hits 7 — awarded value 125", PER_DAY + M7.bonus, 125);
  eq("04 hits 7 — newStreak", out.newStreak, 7);
  eq("04 hits 7 — newLongestStreak", out.newLongestStreak, 7);
  eqMilestone("04 hits 7 — milestoneHit", out.milestoneHit, M7);
}

// ---------- Test 5: Streak hits 14 ----------
{
  const out = computeLoginReward({
    today: "2026-06-22",
    lastLoginDateKey: "2026-06-21",
    currentStreak: 13,
    longestStreak: 13,
  });
  eq("05 hits 14 — awarded", out.awarded, PER_DAY + M14.bonus);
  eq("05 hits 14 — awarded value 325", PER_DAY + M14.bonus, 325);
  eq("05 hits 14 — newStreak", out.newStreak, 14);
  eqMilestone("05 hits 14 — milestoneHit", out.milestoneHit, M14);
}

// ---------- Test 6: Streak hits 30 ----------
{
  const out = computeLoginReward({
    today: "2026-07-08",
    lastLoginDateKey: "2026-07-07",
    currentStreak: 29,
    longestStreak: 29,
  });
  eq("06 hits 30 — awarded", out.awarded, PER_DAY + M30.bonus);
  eq("06 hits 30 — awarded value 625", PER_DAY + M30.bonus, 625);
  eq("06 hits 30 — newStreak", out.newStreak, 30);
  eqMilestone("06 hits 30 — milestoneHit", out.milestoneHit, M30);
}

// ---------- Test 7: Streak hits 60 ----------
{
  const out = computeLoginReward({
    today: "2026-08-07",
    lastLoginDateKey: "2026-08-06",
    currentStreak: 59,
    longestStreak: 59,
  });
  eq("07 hits 60 — awarded", out.awarded, PER_DAY + M60.bonus);
  eq("07 hits 60 — awarded value 1025", PER_DAY + M60.bonus, 1025);
  eq("07 hits 60 — newStreak", out.newStreak, 60);
  eqMilestone("07 hits 60 — milestoneHit", out.milestoneHit, M60);
}

// ---------- Test 8: Past 60, no further milestones ----------
{
  const out = computeLoginReward({
    today: "2026-08-08",
    lastLoginDateKey: "2026-08-07",
    currentStreak: 60,
    longestStreak: 60,
  });
  eq("08 past 60 — awarded", out.awarded, PER_DAY);
  eq("08 past 60 — newStreak", out.newStreak, 61);
  eq("08 past 60 — newLongestStreak", out.newLongestStreak, 61);
  eqMilestone("08 past 60 — milestoneHit", out.milestoneHit, null);
}

// ---------- Test 9: 3-day gap → reset to 1, longestStreak preserved ----------
{
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-12",
    currentStreak: 9,
    longestStreak: 9,
  });
  eq("09 3-day gap — awarded", out.awarded, PER_DAY);
  eq("09 3-day gap — newStreak", out.newStreak, 1);
  eq("09 3-day gap — newLongestStreak (preserved)", out.newLongestStreak, 9);
  eqMilestone("09 3-day gap — milestoneHit", out.milestoneHit, null);
}

// ---------- Test 10: Late-joiner forfeit confirmation ----------
{
  const out = computeLoginReward({
    today: "2026-07-20",
    lastLoginDateKey: null,
    currentStreak: 0,
    longestStreak: 0,
  });
  eq("10 late-joiner — shouldClaim", out.shouldClaim, true);
  eq("10 late-joiner — awarded", out.awarded, PER_DAY);
  eq("10 late-joiner — newStreak", out.newStreak, 1);
  eq("10 late-joiner — newLongestStreak", out.newLongestStreak, 1);
  eqMilestone("10 late-joiner — milestoneHit (no backpay)", out.milestoneHit, null);
}

// ---------- Test 11 (bonus): Malformed today throws ----------
{
  let threw = false;
  let message = "";
  try {
    computeLoginReward({
      today: "2026-6-15",
      lastLoginDateKey: null,
      currentStreak: 0,
      longestStreak: 0,
    });
  } catch (err) {
    threw = true;
    message = err instanceof Error ? err.message : String(err);
  }
  eq("11 malformed today — threw", threw, true);
  eq(
    "11 malformed today — message mentions YYYY-MM-DD",
    message.includes("YYYY-MM-DD"),
    true
  );
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
