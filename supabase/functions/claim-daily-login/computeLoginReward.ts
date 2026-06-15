// MIRROR of packages/game-engine/src/login/computeLoginReward.ts (commit ddc659a).
// Edge functions run in Deno and cannot import from workspace packages.
// Keep this file in sync manually when login-reward rules change. The canonical
// source of truth for the constants below is:
//   packages/config/src/xpRules.ts
//     - LOGIN_REWARDS.perDay
//     - LOGIN_REWARDS.milestones
//
// computeLoginReward — pure daily-login reward calculator (PR-A points rewrite).
//
// Operates on date-key strings (YYYY-MM-DD), NOT Date objects. The caller is
// responsible for converting device time → date key in the user's timezone.
// This keeps the function trivially testable and timezone-agnostic.
//
// Semantics (locked):
//   - Same-day re-call: no-op. shouldClaim=false, awarded=0, no streak change.
//   - lastLoginDateKey === yesterday: streak becomes currentStreak + 1.
//   - Otherwise (null or older): streak resets to 1.
//   - Milestone bonuses are paid only on the EXACT day the new streak hits a
//     milestones[].atStreak value. Missed milestones are NEVER backpaid
//     (late-joiner forfeit rule).
//   - longestStreak updates to max(longestStreak, newStreak).

/** Per-day login points. Mirrors LOGIN_REWARDS.perDay. */
export const LOGIN_REWARDS = {
  perDay: 25,
  milestones: [
    { atStreak: 7, bonus: 100 },
    { atStreak: 14, bonus: 300 },
    { atStreak: 30, bonus: 600 },
    { atStreak: 60, bonus: 1000 },
  ],
} as const;

export interface ComputeLoginRewardInput {
  /** Today's date key in user's tz, format YYYY-MM-DD. */
  today: string;
  /** Last login date key, or null if user has never logged in. */
  lastLoginDateKey: string | null;
  /** Current consecutive-day streak (>=0). */
  currentStreak: number;
  /** Longest streak ever (>=0). */
  longestStreak: number;
}

export interface ComputeLoginRewardMilestone {
  atStreak: number;
  bonus: number;
}

export interface ComputeLoginRewardResult {
  /** False if user already claimed today (lastLoginDateKey === today). */
  shouldClaim: boolean;
  /** Points awarded (perDay + any milestone bonus). 0 when shouldClaim=false. */
  awarded: number;
  newStreak: number;
  newLongestStreak: number;
  /** Milestone that was just hit on this login, or null. */
  milestoneHit: ComputeLoginRewardMilestone | null;
  /** What to persist as the new last-login date key (= today when shouldClaim, else unchanged). */
  newLastLoginDateKey: string;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Add `n` days (may be negative) to a YYYY-MM-DD date key and return the
 * resulting YYYY-MM-DD key. Uses UTC arithmetic to avoid host-tz drift.
 */
function addDays(dateKey: string, n: number): string {
  // dateKey is already validated by the caller.
  const [yStr, mStr, dStr] = dateKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  // Date.UTC(year, monthIndex, day) — monthIndex is 0-based.
  const ms = Date.UTC(y, m - 1, d) + n * 86_400_000;
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = dt.getUTCMonth() + 1;
  const dd = dt.getUTCDate();
  const pad = (x: number) => (x < 10 ? `0${x}` : String(x));
  return `${yy}-${pad(mm)}-${pad(dd)}`;
}

function assertDateKey(label: string, value: string): void {
  if (!DATE_KEY_RE.test(value)) {
    throw new Error(
      `computeLoginReward: ${label} must match YYYY-MM-DD, got: ${JSON.stringify(value)}`
    );
  }
}

export function computeLoginReward(
  input: ComputeLoginRewardInput
): ComputeLoginRewardResult {
  const { today, lastLoginDateKey, currentStreak, longestStreak } = input;

  assertDateKey("today", today);
  if (lastLoginDateKey !== null) {
    assertDateKey("lastLoginDateKey", lastLoginDateKey);
  }

  // Same-day re-call → no-op.
  if (lastLoginDateKey === today) {
    return {
      shouldClaim: false,
      awarded: 0,
      newStreak: currentStreak,
      newLongestStreak: longestStreak,
      milestoneHit: null,
      newLastLoginDateKey: today,
    };
  }

  const yesterday = addDays(today, -1);

  // Streak update.
  let newStreak: number;
  if (lastLoginDateKey === yesterday) {
    newStreak = currentStreak + 1;
  } else {
    // null or older than yesterday → reset.
    newStreak = 1;
  }

  // Milestone: only when newStreak EXACTLY matches a configured milestone.
  // Late-joiner forfeit: never backpay milestones the user skipped over.
  let milestoneHit: ComputeLoginRewardMilestone | null = null;
  for (const m of LOGIN_REWARDS.milestones) {
    if (m.atStreak === newStreak) {
      milestoneHit = { atStreak: m.atStreak, bonus: m.bonus };
      break;
    }
  }

  const awarded = LOGIN_REWARDS.perDay + (milestoneHit ? milestoneHit.bonus : 0);
  const newLongestStreak = Math.max(longestStreak, newStreak);

  return {
    shouldClaim: true,
    awarded,
    newStreak,
    newLongestStreak,
    milestoneHit,
    newLastLoginDateKey: today,
  };
}
