// packages/config/src/cardStatRules.ts
//
// v1 stat-earning rules per PRD #1. Display-only (multipliers not applied in v1).
// All bumps clamp to CARD_STAT_CAP=100; stat keys are hyp / frm / atk / ast / wal / lck.

export type CardStatKey = "hyp" | "frm" | "atk" | "ast" | "wal" | "lck";

export const CARD_STAT_BASE = 50;
export const CARD_STAT_CAP = 100;

/** Per-correct trivia stat bump, applied via catch-up rule (+amount to currently-lowest stat). */
export const TRIVIA_CATCH_UP_AMOUNT = 2;

/** Daily login: applied on every successful login claim. */
export const LOGIN_DAILY_BUMP: Partial<Record<CardStatKey, number>> = { hyp: 1 };

/**
 * Streak milestones: applied IN ADDITION to LOGIN_DAILY_BUMP on the day the streak hits the threshold.
 * Day 30 awards +3 Hype as the v1 default (the PRD's "user's choice" UI is deferred to a follow-up).
 */
export const LOGIN_STREAK_MILESTONE_BUMPS: Record<number, Partial<Record<CardStatKey, number>>> = {
  7:  { hyp: 3 },
  14: { frm: 3 },
  30: { hyp: 3 },
};

/**
 * Bracket-resolve bumps: applied when matches complete and reveal whether the user's pick was correct.
 * Awarded via score-bracket edge fn, idempotent via brackets.awarded_stat_bumps column.
 *
 * Top-scorer / assist-leader / clean-sheet routings from the PRD are intentionally OMITTED because
 * the bracket data model does not yet have those pick types. Reserved for a follow-up.
 */
export const BRACKET_RESOLVE_BUMPS: {
  championCorrect: Partial<Record<CardStatKey, number>>;
  finalistCorrect: Partial<Record<CardStatKey, number>>;
  upsetCorrect: Partial<Record<CardStatKey, number>>;
} = {
  championCorrect: { hyp: 5 },
  finalistCorrect: { frm: 3 },
  upsetCorrect: { lck: 4 },
};
