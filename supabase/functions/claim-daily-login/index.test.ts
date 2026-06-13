// Tests for the pure helper inside computeLoginReward.ts (Deno mirror of
// packages/game-engine/src/login/computeLoginReward.ts). Mirrors the 10 main +
// 1 defensive logic cases from
// packages/game-engine/src/login/computeLoginReward.test.ts.
//
// Run with: deno test supabase/functions/claim-daily-login/index.test.ts

import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  computeLoginReward,
  LOGIN_REWARDS,
} from "./computeLoginReward.ts";

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

Deno.test("01 first-ever login → award perDay, newStreak=1", () => {
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: null,
    currentStreak: 0,
    longestStreak: 0,
  });
  assertEquals(out.shouldClaim, true);
  assertEquals(out.awarded, PER_DAY);
  assertEquals(PER_DAY, 25);
  assertEquals(out.newStreak, 1);
  assertEquals(out.newLongestStreak, 1);
  assertEquals(out.milestoneHit, null);
  assertEquals(out.newLastLoginDateKey, "2026-06-15");
});

Deno.test("02 same-day re-call → shouldClaim=false, awarded=0, unchanged", () => {
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-15",
    currentStreak: 3,
    longestStreak: 9,
  });
  assertEquals(out.shouldClaim, false);
  assertEquals(out.awarded, 0);
  assertEquals(out.newStreak, 3);
  assertEquals(out.newLongestStreak, 9);
  assertEquals(out.milestoneHit, null);
  assertEquals(out.newLastLoginDateKey, "2026-06-15");
});

Deno.test("03 yesterday login → streak +1", () => {
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-14",
    currentStreak: 1,
    longestStreak: 1,
  });
  assertEquals(out.shouldClaim, true);
  assertEquals(out.awarded, PER_DAY);
  assertEquals(out.newStreak, 2);
  assertEquals(out.newLongestStreak, 2);
  assertEquals(out.milestoneHit, null);
  assertEquals(out.newLastLoginDateKey, "2026-06-15");
});

Deno.test("04 streak hits 7 → award 125, milestone {7, 100}", () => {
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-14",
    currentStreak: 6,
    longestStreak: 6,
  });
  assertEquals(out.shouldClaim, true);
  assertEquals(out.awarded, PER_DAY + M7.bonus);
  assertEquals(PER_DAY + M7.bonus, 125);
  assertEquals(out.newStreak, 7);
  assertEquals(out.newLongestStreak, 7);
  assertEquals(out.milestoneHit, M7);
});

Deno.test("05 streak hits 14 → award 325, milestone {14, 300}", () => {
  const out = computeLoginReward({
    today: "2026-06-22",
    lastLoginDateKey: "2026-06-21",
    currentStreak: 13,
    longestStreak: 13,
  });
  assertEquals(out.awarded, PER_DAY + M14.bonus);
  assertEquals(PER_DAY + M14.bonus, 325);
  assertEquals(out.newStreak, 14);
  assertEquals(out.milestoneHit, M14);
});

Deno.test("06 streak hits 30 → award 625, milestone {30, 600}", () => {
  const out = computeLoginReward({
    today: "2026-07-08",
    lastLoginDateKey: "2026-07-07",
    currentStreak: 29,
    longestStreak: 29,
  });
  assertEquals(out.awarded, PER_DAY + M30.bonus);
  assertEquals(PER_DAY + M30.bonus, 625);
  assertEquals(out.newStreak, 30);
  assertEquals(out.milestoneHit, M30);
});

Deno.test("07 streak hits 60 → award 1025, milestone {60, 1000}", () => {
  const out = computeLoginReward({
    today: "2026-08-07",
    lastLoginDateKey: "2026-08-06",
    currentStreak: 59,
    longestStreak: 59,
  });
  assertEquals(out.awarded, PER_DAY + M60.bonus);
  assertEquals(PER_DAY + M60.bonus, 1025);
  assertEquals(out.newStreak, 60);
  assertEquals(out.milestoneHit, M60);
});

Deno.test("08 past 60 (60→61) → just perDay, no milestone", () => {
  const out = computeLoginReward({
    today: "2026-08-08",
    lastLoginDateKey: "2026-08-07",
    currentStreak: 60,
    longestStreak: 60,
  });
  assertEquals(out.awarded, PER_DAY);
  assertEquals(out.newStreak, 61);
  assertEquals(out.newLongestStreak, 61);
  assertEquals(out.milestoneHit, null);
});

Deno.test("09 3-day gap → reset to 1, longestStreak preserved", () => {
  const out = computeLoginReward({
    today: "2026-06-15",
    lastLoginDateKey: "2026-06-12",
    currentStreak: 9,
    longestStreak: 9,
  });
  assertEquals(out.awarded, PER_DAY);
  assertEquals(out.newStreak, 1);
  assertEquals(out.newLongestStreak, 9);
  assertEquals(out.milestoneHit, null);
});

Deno.test("10 late-joiner forfeit → identical to first-ever, no backpay", () => {
  const out = computeLoginReward({
    today: "2026-07-20",
    lastLoginDateKey: null,
    currentStreak: 0,
    longestStreak: 0,
  });
  assertEquals(out.shouldClaim, true);
  assertEquals(out.awarded, PER_DAY);
  assertEquals(out.newStreak, 1);
  assertEquals(out.newLongestStreak, 1);
  assertEquals(out.milestoneHit, null);
});

Deno.test("11 malformed today key throws (mentions YYYY-MM-DD)", () => {
  assertThrows(
    () =>
      computeLoginReward({
        today: "2026-6-15",
        lastLoginDateKey: null,
        currentStreak: 0,
        longestStreak: 0,
      }),
    Error,
    "YYYY-MM-DD"
  );
});
