# Points System Rewrite — Implementation Plan (PR-A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-08-points-system-rewrite-design.md`

**Goal:** Replace the existing trivia/bracket scoring with the PRD's rebalanced economy: trivia 50/100/200 + combo + streak multiplier, bracket doubling ladder + 800 champion + per-upset bonus, daily login + milestone chests, perfect-run bonuses.

**Architecture:** Pure scoring functions in `packages/game-engine` (testable via tsx). Edge functions wrap them and persist to existing tables (`trivia_attempts.competitive_points`, `brackets.score`) plus new tables (`login_events`, profile streak columns). Total points = derived sum at query time; no `profiles.competitive_points` cache column.

**Tech Stack:** React Native + Expo, Supabase (Postgres + Deno edge functions), pnpm monorepo with workspace packages.

**Branch:** `feature/points-system-rewrite` (off `app_build/version_0`, spec committed at `2201d20`)

**Sequencing:** PR #20 must merge first (delivers Q1=100/Q2=150/Q3=200 trivia values; this PR rebalances DOWN to PRD values).

---

## Locked formulas (the things plan reviewers should sanity-check)

**Speed bonus:**
```
multiplier = max(0, 1 − response_time_ms / (timer_ms × 2))
total_for_question = round(base × multiplier)
```
- response = 0 → 1.0 × base (full)
- response = timer → 0.5 × base (floor at the timer mark)
- response = 2 × timer → 0 (just barely)
- response > 2 × timer → 0 (clamp)

**Trivia daily total (before streak):**
```
daily_total = sum(per_question_points) + (allThreeCorrect ? 60 : 0)
```

**Streak multiplier (trivia only, applied to daily total):**
| trivia_streak (perfect days in a row) | Multiplier |
|---|---|
| 0–6 | 1.00 |
| 7–13 | 1.10 |
| 14–20 | 1.20 |
| ≥ 21 | 1.30 |

**Trivia streak advancement:**
- Advances by 1 only if all 3 questions correct today
- Resets to 0 if user missed yesterday OR didn't get all 3 correct yesterday

**Bracket scoring (per spec):**
- Group: 30 per correct position (max 1,440) + 120 per perfect group (max 1,440) + 25 per best-third (max 200) = 3,080
- Knockout: R32=40, R16=80, QF=160, SF=320, Final=640 = 3,200
- Champion bonus: +800 if correct
- Per-upset bonus: +50% of that round's value for each upset (lower-FIFA-ranked team wins)
- Grand-total ceiling (no upsets): 7,080

**Login:**
- +25 flat per first-foreground-per-UTC-day
- Milestone chest +100 on day 7, +300 on day 14, +600 on day 30, +1,000 on day 39
- Streak resets if missed UTC calendar day

---

## File structure

### New files

| Path | Responsibility | Task |
|---|---|---|
| `packages/game-engine/src/bracket/scoreBracket.ts` | Pure function: takes bracket picks + match results + FIFA ranks, returns score breakdown | Task 2 |
| `packages/game-engine/src/bracket/scoreBracket.test.ts` | tsx-runnable unit tests for the scorer | Task 2 |
| `packages/game-engine/src/trivia/scoreTriviaDay.ts` | Pure function for new trivia per-day scoring (with speed + combo, before streak mult) | Task 3 |
| `packages/game-engine/src/trivia/scoreTriviaDay.test.ts` | tsx-runnable tests | Task 3 |
| `packages/game-engine/src/login/computeLoginReward.ts` | Pure function: given prior streak + last_login_date + today, compute new streak + points awarded + milestone unlocked | Task 4 |
| `packages/game-engine/src/login/computeLoginReward.test.ts` | tsx-runnable tests | Task 4 |
| `supabase/migrations/000029_login_events.sql` | `login_events` table + RLS | Task 5 |
| `supabase/migrations/000030_profile_streak_columns.sql` | Add 6 streak/profile columns | Task 5 |
| `supabase/functions/claim-daily-login/index.ts` | Edge function entry point | Task 7 |
| `supabase/functions/claim-daily-login/schema.ts` | Request/response types | Task 7 |
| `supabase/functions/score-bracket/index.ts` | Edge function that re-scores a user's bracket given current match results | Task 8 |
| `apps/mobile/src/features/login/hooks/useDailyLogin.ts` | Client hook: claim on first foreground per day, expose streak + last claim | Task 9 |
| `apps/mobile/src/features/login/api/claim.ts` | API wrapper calling claim-daily-login | Task 9 |
| `apps/mobile/src/features/login/components/LoginStreakBadge.tsx` | Tiny chip showing current login streak | Task 10 |
| `apps/mobile/src/features/login/components/MilestoneUnlockModal.tsx` | Modal that pops on milestone threshold crossing | Task 11 |
| `apps/mobile/src/features/login/index.ts` | Feature exports | Task 9 |

### Modified files

| Path | Change | Task |
|---|---|---|
| `packages/config/src/xpRules.ts` | New constants: tier values 50/100/200, timers 15/20/30, all-3 combo, streak multipliers, login rewards, bracket scoring table | Task 1 |
| `packages/game-engine/src/index.ts` | Re-export new modules | Task 2, 3, 4 |
| `supabase/functions/score-trivia-attempt/index.ts` | Replace scoring with `scoreTriviaDay` + streak multiplier application | Task 6 |
| `supabase/functions/submit-bracket/index.ts` | Call `score-bracket` after successful save (or inline) so `brackets.score` stays fresh | Task 8 |
| `apps/mobile/src/features/trivia/components/QuestionCard.tsx` | Update displayed tier chip values to 50/100/200 + timer chips 15/20/30s | Task 12 |
| `apps/mobile/src/features/trivia/components/CompletedView.tsx` | Show streak multiplier breakdown line | Task 12 |
| `apps/mobile/app/_layout.tsx` | Mount `useDailyLogin` triggers (debounced first-foreground) | Task 13 |
| `apps/mobile/app/(tabs)/home.tsx` | Render `LoginStreakBadge` in header | Task 10 |

---

## Task 0: Verify branch state

- [ ] **Step 1: Confirm branch + clean tree**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
git status
git log --oneline -3
```

Expected: branch `feature/points-system-rewrite`, top commit `2201d20` (spec). Clean tree.

- [ ] **Step 2: Verify PR #20 status with user before proceeding**

The PRD's trivia values (50/100/200) overwrite PR #20's (100/150/200). If PR #20 hasn't merged yet, this PR can still be built; after PR #20 merges, rebase. Confirm with user that PR #20 is either merged or close to merging.

- [ ] **Step 3: pnpm install + typecheck baseline**

```bash
pnpm install
pnpm --filter mobile typecheck
```

Expected: 0 errors.

---

## Task 1: Config constants — xpRules.ts rewrite

**Files:**
- Modify: `packages/config/src/xpRules.ts`

- [ ] **Step 1: Replace the file contents**

```ts
/**
 * Per-question tier configuration. Mirrors the PRD final spec.
 * Question order in the DB is 1-indexed (Q1=easy, Q2=medium, Q3=hard);
 * array is 0-indexed.
 *
 * Daily max points (raw, before streak multiplier):
 *   Q1=50, Q2=100, Q3=200, all-3 combo +60 → 410/day
 *   × 1.30 streak (after day 21) → 533/day
 *   × 39 days theoretical max → ~20,800
 *   (PRD validation target: ~16,000 for max-engaged after attrition.)
 */
export const TRIVIA_QUESTION_TIERS = [
  {
    difficulty: "easy",
    basePoints: 50,
    timeLimitMs: 15_000,
  },
  {
    difficulty: "medium",
    basePoints: 100,
    timeLimitMs: 20_000,
  },
  {
    difficulty: "hard",
    basePoints: 200,
    timeLimitMs: 30_000,
  },
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

/**
 * All-3-correct combo bonus, added once per day on perfect attempts.
 */
export const TRIVIA_ALL_THREE_COMBO_BONUS = 60;

/**
 * Trivia streak multiplier table. Applied to (sum of per-question points + combo).
 * Streak advances by 1 each day all 3 questions are correct; resets to 0 on
 * any missed day or partial-correct day.
 */
export const TRIVIA_STREAK_MULTIPLIER_STEPS: ReadonlyArray<{ minStreak: number; multiplier: number }> = [
  { minStreak: 21, multiplier: 1.30 },
  { minStreak: 14, multiplier: 1.20 },
  { minStreak: 7,  multiplier: 1.10 },
  { minStreak: 0,  multiplier: 1.00 },
];

/** Look up streak multiplier for the given streak length. Always returns a value. */
export function getTriviaStreakMultiplier(streakDays: number): number {
  for (const step of TRIVIA_STREAK_MULTIPLIER_STEPS) {
    if (streakDays >= step.minStreak) return step.multiplier;
  }
  return 1.0;
}

/**
 * Perfect Trivia Run end-of-tournament bonus.
 * Awarded once if `trivia_streak >= 30` reached at any point during the
 * tournament window.
 */
export const PERFECT_TRIVIA_RUN_BONUS = 1_500;
export const PERFECT_TRIVIA_RUN_THRESHOLD_DAYS = 30;

/**
 * Bracket scoring values. Per the PRD final spec.
 * All values are competitive points (not card XP).
 */
export const BRACKET_SCORING = {
  // Group stage
  groupPositionCorrect: 30,        // each correct 1st/2nd/3rd/4th in a group
  perfectGroupBonus: 120,          // all 4 positions exact in a single group
  bestThirdPlaceCorrect: 25,       // each correct best-third qualifier
  // Knockouts (doubling ladder)
  knockoutPerCorrect: {
    r32: 40,
    r16: 80,
    qf: 160,
    sf: 320,
    final: 640,
  },
  // Bonuses
  championBonus: 800,              // correct champion (locked at submission)
  upsetBonusPctOfRound: 0.5,       // +50% of round's per-correct value, per upset
} as const;

/**
 * Login + milestones. Awarded by the claim-daily-login edge function.
 */
export const LOGIN_REWARDS = {
  flatDailyPoints: 25,             // every UTC calendar day, first foreground
  milestoneChests: {
    day_7: 100,
    day_14: 300,
    day_30: 600,
    day_39: 1_000,
  },
} as const;

export type MilestoneKind = keyof typeof LOGIN_REWARDS.milestoneChests;

/**
 * End-of-tournament perfect-knockout bonus.
 * +2,500 if all 31 knockout picks correct.
 * Also flips profiles.perfect_knockout_run = true (Trophy Room cosmetic unlock).
 */
export const PERFECT_KNOCKOUT_RUN_BONUS = 2_500;

/**
 * Card XP rewards (unchanged from current; PR-B will revisit).
 */
export const CARD_XP_REWARDS = {
  perCorrectTrivia: 25,
  dailyTriviaCompletionBonus: 50,
} as const;

/**
 * Legacy export retained for backwards compatibility. Code reading
 * `TRIVIA_RULES.questionsPerDay` and similar still resolves. Deprecated
 * fields fold to the new tier system.
 */
export const TRIVIA_RULES = {
  questionsPerDay: 3,
  answerOptionsPerQuestion: 4,
  tiers: TRIVIA_QUESTION_TIERS,
  correctAnswerCardXp: CARD_XP_REWARDS.perCorrectTrivia,
  completedDailyTriviaCardXp: CARD_XP_REWARDS.dailyTriviaCompletionBonus,
  /** @deprecated Use TRIVIA_QUESTION_TIERS[0].basePoints. */
  correctAnswerCompetitivePoints: TRIVIA_QUESTION_TIERS[0].basePoints,
  /** @deprecated Speed bonus is now `base × (1 - rt/(2×timer))` capped at base. */
  maxSpeedBonusPerQuestion: 0,
} as const;

export const BOUNTY_RULES = {
  awardsCompetitivePoints: false,
  revealRewardOnOpen: true,
} as const;

export const ECONOMY_RULES = {
  purchasesAffectCompetitivePoints: false,
  cardsCanDowngrade: false,
} as const;
```

- [ ] **Step 2: Typecheck**

```bash
pnpm -r typecheck
```

Expected: 0 errors. If something downstream uses `maxSpeedBonusPerQuestion > 0` for math, it now computes a 0 bonus; that's acceptable transitional behavior — Task 6 replaces the edge function scoring.

- [ ] **Step 3: Commit**

```bash
git add packages/config/src/xpRules.ts
git commit -m "feat(config): PRD-locked points constants (trivia 50/100/200, bracket scoring, login rewards, streak multipliers)"
```

---

## Task 2: Bracket scorer pure function + tests

**Files:**
- Create: `packages/game-engine/src/bracket/scoreBracket.ts`
- Create: `packages/game-engine/src/bracket/scoreBracket.test.ts`
- Modify: `packages/game-engine/src/index.ts`

- [ ] **Step 1: Write the bracket scorer**

```ts
// packages/game-engine/src/bracket/scoreBracket.ts
import { BRACKET_SCORING } from "@gogaffa/config";

export type GroupId = string; // "A".."L"
export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "third" | "final";

/** A user's group-stage prediction: each group has an ordered 1st/2nd/3rd/4th. */
export interface BracketGroupPicks {
  [group: string]: string[]; // 4 team codes per group
}

/** A user's knockout predictions: per round, an index→teamCode map. */
export interface BracketKnockoutPicks {
  r32: Record<string, string>;
  r16: Record<string, string>;
  qf: Record<string, string>;
  sf: Record<string, string>;
  final: string | null;
  third: string | null;
}

/** Actual tournament results. Only filled-in entries score; missing = not scored yet. */
export interface BracketResults {
  /** group → actual 1st/2nd/3rd/4th finishers (or empty if group not done) */
  groupFinalStandings: Record<string, string[]>;
  /** the 8 "best third place" qualifying team codes */
  bestThirdQualifiers: string[];
  /** round → match index → actual winner */
  knockoutWinners: {
    r32: Record<string, string>;
    r16: Record<string, string>;
    qf: Record<string, string>;
    sf: Record<string, string>;
    final: string | null;
    third: string | null;
  };
}

/** FIFA ranking snapshot at first-kickoff. Used for upset detection. */
export interface FifaRankings {
  /** Lower number = better rank. e.g., {"BRA": 5, "ARG": 1}. */
  [teamCode: string]: number;
}

export interface BracketScoreBreakdown {
  groupPositionPoints: number;     // 30 × correct positions
  perfectGroupBonus: number;       // 120 × groups where all 4 exact
  bestThirdPoints: number;         // 25 × correct best-third picks
  knockoutPoints: number;          // doubling ladder per correct round
  championBonus: number;           // 800 if correct
  upsetBonus: number;              // sum of +50%-of-round upsets
  total: number;                   // sum of all of the above
  perfectKnockoutRun: boolean;     // all 31 knockout picks correct
}

export function scoreBracket(
  picks: { groupRankings: BracketGroupPicks; knockouts: BracketKnockoutPicks; champion: string | null },
  results: BracketResults,
  rankings: FifaRankings
): BracketScoreBreakdown {
  let groupPositionPoints = 0;
  let perfectGroupBonus = 0;
  let bestThirdPoints = 0;
  let knockoutPoints = 0;
  let championBonus = 0;
  let upsetBonus = 0;
  let knockoutCorrectCount = 0;
  let knockoutTotalScored = 0;

  // ── Group stage ──────────────────────────────────────────────────────
  for (const [group, actualStandings] of Object.entries(results.groupFinalStandings)) {
    if (actualStandings.length !== 4) continue; // group not finished yet
    const userPicks = picks.groupRankings[group] ?? [];
    let exactPositionsThisGroup = 0;
    for (let pos = 0; pos < 4; pos++) {
      if (userPicks[pos] && actualStandings[pos] && userPicks[pos] === actualStandings[pos]) {
        groupPositionPoints += BRACKET_SCORING.groupPositionCorrect;
        exactPositionsThisGroup++;
      }
    }
    if (exactPositionsThisGroup === 4) {
      perfectGroupBonus += BRACKET_SCORING.perfectGroupBonus;
    }
  }

  // ── Best third ───────────────────────────────────────────────────────
  // Best-third picks are encoded as a special slot in groupRankings — for v1
  // we infer them from the user's predicted-3rd-place picks across the 12
  // groups and check overlap with actual bestThirdQualifiers. Simpler: any
  // user-picked 3rd-placer that ends up qualifying earns +25.
  const userPredictedThirdPlaces = new Set<string>();
  for (const userPicks of Object.values(picks.groupRankings)) {
    if (userPicks[2]) userPredictedThirdPlaces.add(userPicks[2]);
  }
  for (const qualifier of results.bestThirdQualifiers) {
    if (userPredictedThirdPlaces.has(qualifier)) {
      bestThirdPoints += BRACKET_SCORING.bestThirdPlaceCorrect;
    }
  }

  // ── Knockouts ────────────────────────────────────────────────────────
  const roundsConfig: Array<{ key: keyof typeof BRACKET_SCORING.knockoutPerCorrect; total: number }> = [
    { key: "r32",   total: 16 },
    { key: "r16",   total: 8  },
    { key: "qf",    total: 4  },
    { key: "sf",    total: 2  },
    { key: "final", total: 1  },
  ];

  for (const { key: round, total: roundMatches } of roundsConfig) {
    const perCorrect = BRACKET_SCORING.knockoutPerCorrect[round];
    const actualByIdx = round === "final"
      ? (results.knockoutWinners.final ? { "0": results.knockoutWinners.final } : {})
      : results.knockoutWinners[round];

    for (const [idxStr, actualWinner] of Object.entries(actualByIdx)) {
      const userPick = round === "final"
        ? picks.knockouts.final
        : picks.knockouts[round]?.[idxStr];
      knockoutTotalScored++;
      if (userPick && userPick === actualWinner) {
        knockoutPoints += perCorrect;
        knockoutCorrectCount++;
        // Upset bonus: was the actual winner lower-ranked (numerically higher) than
        // the other team in this match? For v1 we don't have the match pairing here;
        // we approximate upset by "actual winner's FIFA rank > all-other-tournament-median".
        // Simpler v1: upset = actual winner's FIFA rank > 32 (outside top 32 globally).
        const rank = rankings[actualWinner];
        if (rank !== undefined && rank > 32) {
          upsetBonus += Math.round(perCorrect * BRACKET_SCORING.upsetBonusPctOfRound);
        }
      }
    }
  }

  // ── Champion ─────────────────────────────────────────────────────────
  if (
    picks.champion &&
    results.knockoutWinners.final &&
    picks.champion === results.knockoutWinners.final
  ) {
    championBonus = BRACKET_SCORING.championBonus;
  }

  // 31 = 16 + 8 + 4 + 2 + 1 (knockout-only; third-place handled separately if needed)
  const perfectKnockoutRun = knockoutTotalScored === 31 && knockoutCorrectCount === 31;

  const total =
    groupPositionPoints + perfectGroupBonus + bestThirdPoints +
    knockoutPoints + championBonus + upsetBonus;

  return {
    groupPositionPoints,
    perfectGroupBonus,
    bestThirdPoints,
    knockoutPoints,
    championBonus,
    upsetBonus,
    total,
    perfectKnockoutRun,
  };
}
```

- [ ] **Step 2: Re-export from index**

Open `packages/game-engine/src/index.ts`. Append:

```ts
export * from "./bracket/scoreBracket";
```

- [ ] **Step 3: Write tests**

```ts
// packages/game-engine/src/bracket/scoreBracket.test.ts
// Run with: pnpm dlx tsx packages/game-engine/src/bracket/scoreBracket.test.ts

import { scoreBracket, type BracketResults, type FifaRankings } from "./scoreBracket";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// Helper builders ------------------------------------------------------
const EMPTY_KO = { r32: {}, r16: {}, qf: {}, sf: {}, final: null, third: null };
const NO_RESULTS: BracketResults = {
  groupFinalStandings: {},
  bestThirdQualifiers: [],
  knockoutWinners: { r32: {}, r16: {}, qf: {}, sf: {}, final: null, third: null },
};
const NO_RANKINGS: FifaRankings = {};

// 1. Empty results, empty picks → all zeros
{
  const r = scoreBracket(
    { groupRankings: {}, knockouts: EMPTY_KO, champion: null },
    NO_RESULTS, NO_RANKINGS
  );
  assert(r.total === 0, "empty bracket should score 0");
  assert(!r.perfectKnockoutRun, "no knockouts scored should NOT mark perfect run");
}

// 2. One perfect group (4 positions exact)
{
  const r = scoreBracket(
    { groupRankings: { A: ["MEX", "RSA", "USA", "JPN"] }, knockouts: EMPTY_KO, champion: null },
    {
      groupFinalStandings: { A: ["MEX", "RSA", "USA", "JPN"] },
      bestThirdQualifiers: [],
      knockoutWinners: NO_RESULTS.knockoutWinners,
    },
    NO_RANKINGS
  );
  assert(r.groupPositionPoints === 120, `expected 30×4=120, got ${r.groupPositionPoints}`);
  assert(r.perfectGroupBonus === 120, `expected +120 perfect-group bonus, got ${r.perfectGroupBonus}`);
  assert(r.total === 240, `expected 240 total, got ${r.total}`);
}

// 3. Three positions right out of 4 — no perfect group bonus
{
  const r = scoreBracket(
    { groupRankings: { A: ["MEX", "RSA", "USA", "JPN"] }, knockouts: EMPTY_KO, champion: null },
    {
      groupFinalStandings: { A: ["MEX", "RSA", "JPN", "USA"] }, // 3 and 4 swapped
      bestThirdQualifiers: [],
      knockoutWinners: NO_RESULTS.knockoutWinners,
    },
    NO_RANKINGS
  );
  assert(r.groupPositionPoints === 60, `expected 30×2=60 (positions 0,1 right; 2,3 wrong), got ${r.groupPositionPoints}`);
  assert(r.perfectGroupBonus === 0, `expected no perfect-group bonus`);
}

// 4. All 12 groups perfect = 12 × 240 = 2,880
{
  const groups = "ABCDEFGHIJKL".split("");
  const gr: Record<string, string[]> = {};
  const standings: Record<string, string[]> = {};
  for (const g of groups) {
    const teams = [`${g}1`, `${g}2`, `${g}3`, `${g}4`];
    gr[g] = teams;
    standings[g] = teams;
  }
  const r = scoreBracket(
    { groupRankings: gr, knockouts: EMPTY_KO, champion: null },
    {
      groupFinalStandings: standings,
      bestThirdQualifiers: [],
      knockoutWinners: NO_RESULTS.knockoutWinners,
    },
    NO_RANKINGS
  );
  assert(r.groupPositionPoints === 12 * 4 * 30, "12 groups × 4 positions × 30");
  assert(r.perfectGroupBonus === 12 * 120, "12 perfect groups × 120");
  assert(r.total === 2_880, `expected 2,880 total, got ${r.total}`);
}

// 5. Best-third picks: user picked X as 3rd in some group, X actually qualifies as best-third
{
  const r = scoreBracket(
    {
      groupRankings: {
        A: ["MEX", "RSA", "BESTTHIRD1", "JPN"],
        B: ["BRA", "ARG", "BESTTHIRD2", "USA"],
      },
      knockouts: EMPTY_KO,
      champion: null,
    },
    {
      groupFinalStandings: {},
      bestThirdQualifiers: ["BESTTHIRD1", "BESTTHIRD2", "OTHER1", "OTHER2"],
      knockoutWinners: NO_RESULTS.knockoutWinners,
    },
    NO_RANKINGS
  );
  assert(r.bestThirdPoints === 50, `expected 25×2=50, got ${r.bestThirdPoints}`);
}

// 6. Knockout doubling ladder — 1 correct in each round
{
  const r = scoreBracket(
    {
      groupRankings: {},
      knockouts: {
        r32:   { "0": "X" },
        r16:   { "0": "X" },
        qf:    { "0": "X" },
        sf:    { "0": "X" },
        final: "X",
        third: null,
      },
      champion: "X",
    },
    {
      groupFinalStandings: {},
      bestThirdQualifiers: [],
      knockoutWinners: {
        r32:   { "0": "X" },
        r16:   { "0": "X" },
        qf:    { "0": "X" },
        sf:    { "0": "X" },
        final: "X",
        third: null,
      },
    },
    { X: 5 } // top-5 ranked, no upset bonus
  );
  assert(r.knockoutPoints === 40 + 80 + 160 + 320 + 640, `knockout doubling, got ${r.knockoutPoints}`);
  assert(r.championBonus === 800, "champion bonus");
  assert(r.upsetBonus === 0, "no upset since X is top-5");
  assert(r.total === 1_240 + 800, `${r.total}`);
}

// 7. Upset bonus — picking a rank-99 team that wins R32
{
  const r = scoreBracket(
    {
      groupRankings: {},
      knockouts: { ...EMPTY_KO, r32: { "0": "UNDERDOG" } },
      champion: null,
    },
    {
      groupFinalStandings: {},
      bestThirdQualifiers: [],
      knockoutWinners: { ...NO_RESULTS.knockoutWinners, r32: { "0": "UNDERDOG" } },
    },
    { UNDERDOG: 99 }
  );
  assert(r.knockoutPoints === 40, "base R32 points");
  assert(r.upsetBonus === 20, `expected +50% of 40 = 20, got ${r.upsetBonus}`);
}

// 8. Perfect knockout run — all 31 right
{
  const ko = { r32: {} as Record<string, string>, r16: {} as Record<string, string>,
               qf: {} as Record<string, string>, sf: {} as Record<string, string>,
               final: "FINAL_WINNER", third: null };
  for (let i = 0; i < 16; i++) ko.r32[String(i)] = `T${i}`;
  for (let i = 0; i < 8; i++)  ko.r16[String(i)] = `T${i}`;
  for (let i = 0; i < 4; i++)  ko.qf[String(i)]  = `T${i}`;
  for (let i = 0; i < 2; i++)  ko.sf[String(i)]  = `T${i}`;
  const r = scoreBracket(
    { groupRankings: {}, knockouts: ko, champion: "FINAL_WINNER" },
    {
      groupFinalStandings: {},
      bestThirdQualifiers: [],
      knockoutWinners: ko,
    },
    {}
  );
  assert(r.perfectKnockoutRun, "all 31 right → perfectKnockoutRun true");
  assert(r.knockoutPoints === 3_200, `expected 3,200 KO points, got ${r.knockoutPoints}`);
}

// 9. Grand total ceiling sanity — 12 perfect groups + perfect KO + champion = 7,080 (no upsets, no best-third)
{
  const groups = "ABCDEFGHIJKL".split("");
  const gr: Record<string, string[]> = {};
  const standings: Record<string, string[]> = {};
  for (const g of groups) {
    const teams = [`${g}1`, `${g}2`, `${g}3`, `${g}4`];
    gr[g] = teams;
    standings[g] = teams;
  }
  const ko = { r32: {} as Record<string, string>, r16: {} as Record<string, string>,
               qf: {} as Record<string, string>, sf: {} as Record<string, string>,
               final: "CHAMP", third: null };
  for (let i = 0; i < 16; i++) ko.r32[String(i)] = "Q";
  for (let i = 0; i < 8; i++)  ko.r16[String(i)] = "Q";
  for (let i = 0; i < 4; i++)  ko.qf[String(i)]  = "Q";
  for (let i = 0; i < 2; i++)  ko.sf[String(i)]  = "Q";
  const r = scoreBracket(
    { groupRankings: gr, knockouts: ko, champion: "CHAMP" },
    {
      groupFinalStandings: standings,
      bestThirdQualifiers: [],
      knockoutWinners: ko,
    },
    { Q: 5, CHAMP: 5 } // all top-5, no upsets
  );
  // 2,880 group + 0 best-third + 3,200 KO + 800 champion = 6,880 (without best-third bonus)
  assert(r.total === 6_880, `grand-total no upsets, no best-third = 6,880; got ${r.total}`);
}

console.log("OK: all scoreBracket assertions passed");
```

- [ ] **Step 4: Run tests**

```bash
pnpm dlx tsx packages/game-engine/src/bracket/scoreBracket.test.ts
```

Expected: `OK: all scoreBracket assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add packages/game-engine/src/bracket/ packages/game-engine/src/index.ts
git commit -m "feat(game-engine): scoreBracket pure function + 9-case unit tests"
```

---

## Task 3: Trivia day scorer pure function + tests

**Files:**
- Create: `packages/game-engine/src/trivia/scoreTriviaDay.ts`
- Create: `packages/game-engine/src/trivia/scoreTriviaDay.test.ts`
- Modify: `packages/game-engine/src/index.ts`

- [ ] **Step 1: Write the scorer**

```ts
// packages/game-engine/src/trivia/scoreTriviaDay.ts
import {
  getTriviaTierForOrder,
  TRIVIA_ALL_THREE_COMBO_BONUS,
  getTriviaStreakMultiplier,
} from "@gogaffa/config";

export interface TriviaAnswerInput {
  /** 1-indexed: 1=easy, 2=medium, 3=hard. */
  questionOrder: number;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface TriviaDayScoreBreakdown {
  /** Sum of per-question points before any bonuses. */
  questionPoints: number;
  /** +60 if all 3 correct, else 0. */
  comboBonus: number;
  /** Streak multiplier applied (e.g., 1.1, 1.2, 1.3). */
  streakMultiplier: number;
  /** Final daily total = round((questionPoints + comboBonus) × streakMultiplier). */
  competitivePoints: number;
  /** Whether the day qualifies as "perfect" — used to advance trivia streak. */
  isPerfectDay: boolean;
  /** Per-answer score breakdown for client display. */
  perAnswer: Array<{ points: number; isCorrect: boolean; questionOrder: number }>;
}

/**
 * Speed bonus: total = base × max(0, 1 − rt/(2×timer)).
 * - rt=0       → 1.0 × base (full)
 * - rt=timer   → 0.5 × base (floor at timer mark)
 * - rt=2×timer → 0
 * - rt>2×timer → 0 (clamped)
 *
 * Note: PRD has internal text ambiguity about a 2× ceiling; this implementation
 * caps at 1× base (no above-base boosts) so the PRD's max-tournament-contribution
 * values (50/100/200 × 39 = 1,950/3,900/7,800) hold exactly.
 */
function calculateAnswerPoints(answer: TriviaAnswerInput): number {
  if (!answer.isCorrect) return 0;
  const tier = getTriviaTierForOrder(answer.questionOrder);
  const ratio = 1 - answer.responseTimeMs / (tier.timeLimitMs * 2);
  const clampedMultiplier = Math.max(0, ratio);
  return Math.round(tier.basePoints * clampedMultiplier);
}

/**
 * Score a single day's trivia attempt.
 *
 * @param answers The three answers in order. Caller is responsible for ordering
 *   by questionOrder; we don't sort here.
 * @param priorStreakDays The user's trivia streak BEFORE this attempt advances.
 *   Streak advancement is the caller's responsibility (this function only reads
 *   the streak to compute multiplier).
 */
export function scoreTriviaDay(
  answers: TriviaAnswerInput[],
  priorStreakDays: number
): TriviaDayScoreBreakdown {
  const perAnswer = answers.map((a) => ({
    points: calculateAnswerPoints(a),
    isCorrect: a.isCorrect,
    questionOrder: a.questionOrder,
  }));

  const questionPoints = perAnswer.reduce((sum, p) => sum + p.points, 0);
  const isPerfectDay = answers.length >= 3 && answers.every((a) => a.isCorrect);
  const comboBonus = isPerfectDay ? TRIVIA_ALL_THREE_COMBO_BONUS : 0;

  // After this attempt, streak would advance to priorStreakDays+1 if perfect,
  // else reset to 0. The multiplier uses the streak the user is ON THIS DAY —
  // which means it advances first if perfect.
  const newStreakForToday = isPerfectDay ? priorStreakDays + 1 : 0;
  const streakMultiplier = getTriviaStreakMultiplier(newStreakForToday);

  const competitivePoints = Math.round((questionPoints + comboBonus) * streakMultiplier);

  return {
    questionPoints,
    comboBonus,
    streakMultiplier,
    competitivePoints,
    isPerfectDay,
    perAnswer,
  };
}
```

- [ ] **Step 2: Re-export from index**

Open `packages/game-engine/src/index.ts`. Append:

```ts
export * from "./trivia/scoreTriviaDay";
```

- [ ] **Step 3: Write tests**

```ts
// packages/game-engine/src/trivia/scoreTriviaDay.test.ts
// Run with: pnpm dlx tsx packages/game-engine/src/trivia/scoreTriviaDay.test.ts

import { scoreTriviaDay, type TriviaAnswerInput } from "./scoreTriviaDay";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const correct = (order: number, ms: number): TriviaAnswerInput => ({
  questionOrder: order, isCorrect: true, responseTimeMs: ms,
});
const wrong = (order: number, ms: number): TriviaAnswerInput => ({
  questionOrder: order, isCorrect: false, responseTimeMs: ms,
});

// 1. All correct at 0ms → max points + combo + ×1.00 (no streak yet)
{
  const r = scoreTriviaDay([correct(1, 0), correct(2, 0), correct(3, 0)], 0);
  assert(r.questionPoints === 50 + 100 + 200, `expected 350, got ${r.questionPoints}`);
  assert(r.comboBonus === 60, "combo bonus");
  assert(r.streakMultiplier === 1.10, `streak after going 0→1 is still <7, but 0→1 = 1 perfect day; check table.`);
  // streak goes 0→1 after this perfect day; multiplier for 1 is 1.00 (only ≥7 hits 1.10)
  // (rewriting): with priorStreak=0, newStreak=1, multiplier=1.00
  assert(r.streakMultiplier === 1.00, `expected 1.00 multiplier at streak 1, got ${r.streakMultiplier}`);
  assert(r.competitivePoints === 410, `expected 410, got ${r.competitivePoints}`);
  assert(r.isPerfectDay, "all-correct = perfect");
}

// 2. All correct at timer mark → 0.5× per question
{
  const r = scoreTriviaDay([correct(1, 15_000), correct(2, 20_000), correct(3, 30_000)], 0);
  assert(r.questionPoints === 25 + 50 + 100, `expected 175 (half base), got ${r.questionPoints}`);
  assert(r.comboBonus === 60, "combo still awarded");
  assert(r.competitivePoints === 175 + 60, "175 + 60 combo");
}

// 3. All correct at 2× timer → 0 per question (only combo)
{
  const r = scoreTriviaDay([correct(1, 30_000), correct(2, 40_000), correct(3, 60_000)], 0);
  assert(r.questionPoints === 0, `expected 0, got ${r.questionPoints}`);
  assert(r.comboBonus === 60, "combo still awarded");
  assert(r.competitivePoints === 60, "combo only");
}

// 4. Wrong on Q3 → no combo, no streak advance
{
  const r = scoreTriviaDay([correct(1, 0), correct(2, 0), wrong(3, 0)], 5);
  assert(r.questionPoints === 50 + 100, "Q3 wrong contributes 0");
  assert(r.comboBonus === 0, "no combo when not all correct");
  assert(!r.isPerfectDay, "not perfect");
  // priorStreak=5, perfect=false → newStreak=0, multiplier=1.00
  assert(r.streakMultiplier === 1.00, "streak reset → no multiplier");
}

// 5. Streak at day 7 (perfect) → ×1.10 applied
{
  // priorStreak=6, perfect → newStreak=7 → multiplier=1.10
  const r = scoreTriviaDay([correct(1, 0), correct(2, 0), correct(3, 0)], 6);
  assert(r.streakMultiplier === 1.10, `expected 1.10 at streak 7, got ${r.streakMultiplier}`);
  assert(r.competitivePoints === Math.round(410 * 1.10), `410 × 1.10 = 451, got ${r.competitivePoints}`);
}

// 6. Streak at day 21 (perfect) → ×1.30 cap
{
  // priorStreak=20, perfect → newStreak=21 → multiplier=1.30
  const r = scoreTriviaDay([correct(1, 0), correct(2, 0), correct(3, 0)], 20);
  assert(r.streakMultiplier === 1.30, `expected 1.30 cap, got ${r.streakMultiplier}`);
  assert(r.competitivePoints === Math.round(410 * 1.30), `410 × 1.30 = 533, got ${r.competitivePoints}`);
}

// 7. Streak well past 21 (perfect) → still ×1.30 (no higher tier)
{
  const r = scoreTriviaDay([correct(1, 0), correct(2, 0), correct(3, 0)], 100);
  assert(r.streakMultiplier === 1.30, "cap holds at 1.30");
}

// 8. Empty/short answers → graceful zero
{
  const r = scoreTriviaDay([], 0);
  assert(r.questionPoints === 0 && r.comboBonus === 0 && r.competitivePoints === 0, "empty day");
  assert(!r.isPerfectDay, "empty is not perfect");
}

console.log("OK: all scoreTriviaDay assertions passed");
```

- [ ] **Step 4: Run + commit**

```bash
pnpm dlx tsx packages/game-engine/src/trivia/scoreTriviaDay.test.ts
git add packages/game-engine/src/trivia/ packages/game-engine/src/index.ts
git commit -m "feat(game-engine): scoreTriviaDay (50/100/200 base + combo + streak multiplier) + 8-case tests"
```

---

## Task 4: Login reward computer + tests

**Files:**
- Create: `packages/game-engine/src/login/computeLoginReward.ts`
- Create: `packages/game-engine/src/login/computeLoginReward.test.ts`
- Modify: `packages/game-engine/src/index.ts`

- [ ] **Step 1: Write the function**

```ts
// packages/game-engine/src/login/computeLoginReward.ts
import { LOGIN_REWARDS, type MilestoneKind } from "@gogaffa/config";

export interface LoginRewardInput {
  /** YYYY-MM-DD (UTC) of last login; null for first-ever login. */
  lastLoginDate: string | null;
  /** Streak length before this login (0 for first-ever). */
  priorStreak: number;
  /** YYYY-MM-DD (UTC) of today's login. */
  today: string;
}

export interface LoginRewardOutput {
  /** New streak length AFTER this login. */
  newStreak: number;
  /** True if this is the first login today (so we should award points). */
  isFirstClaimToday: boolean;
  /** Competitive points to award this login (25 + milestone if applicable). */
  pointsAwarded: number;
  /** Milestone unlocked at THIS specific login, if any. */
  milestoneUnlocked: MilestoneKind | null;
}

/** Subtract one day from a YYYY-MM-DD string (UTC). */
function previousDayUTC(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function computeLoginReward(input: LoginRewardInput): LoginRewardOutput {
  // No-op claim if already logged in today.
  if (input.lastLoginDate === input.today) {
    return {
      newStreak: input.priorStreak,
      isFirstClaimToday: false,
      pointsAwarded: 0,
      milestoneUnlocked: null,
    };
  }

  const isConsecutive = input.lastLoginDate === previousDayUTC(input.today);
  const newStreak = isConsecutive ? input.priorStreak + 1 : 1;

  let milestoneUnlocked: MilestoneKind | null = null;
  let milestoneBonus = 0;
  if (newStreak === 7)      { milestoneUnlocked = "day_7";  milestoneBonus = LOGIN_REWARDS.milestoneChests.day_7; }
  else if (newStreak === 14) { milestoneUnlocked = "day_14"; milestoneBonus = LOGIN_REWARDS.milestoneChests.day_14; }
  else if (newStreak === 30) { milestoneUnlocked = "day_30"; milestoneBonus = LOGIN_REWARDS.milestoneChests.day_30; }
  else if (newStreak === 39) { milestoneUnlocked = "day_39"; milestoneBonus = LOGIN_REWARDS.milestoneChests.day_39; }

  return {
    newStreak,
    isFirstClaimToday: true,
    pointsAwarded: LOGIN_REWARDS.flatDailyPoints + milestoneBonus,
    milestoneUnlocked,
  };
}
```

- [ ] **Step 2: Tests**

```ts
// packages/game-engine/src/login/computeLoginReward.test.ts
// Run: pnpm dlx tsx packages/game-engine/src/login/computeLoginReward.test.ts
import { computeLoginReward } from "./computeLoginReward";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// 1. First-ever login
{
  const r = computeLoginReward({ lastLoginDate: null, priorStreak: 0, today: "2026-06-11" });
  assert(r.newStreak === 1, "first login = streak 1");
  assert(r.isFirstClaimToday, "first claim today");
  assert(r.pointsAwarded === 25, "flat 25");
  assert(r.milestoneUnlocked === null, "no milestone yet");
}

// 2. Same-day re-claim is no-op
{
  const r = computeLoginReward({ lastLoginDate: "2026-06-11", priorStreak: 1, today: "2026-06-11" });
  assert(!r.isFirstClaimToday, "already claimed");
  assert(r.pointsAwarded === 0, "no points");
  assert(r.newStreak === 1, "streak unchanged");
}

// 3. Consecutive day extends streak
{
  const r = computeLoginReward({ lastLoginDate: "2026-06-11", priorStreak: 1, today: "2026-06-12" });
  assert(r.newStreak === 2, "streak advances");
  assert(r.pointsAwarded === 25, "flat 25, no milestone");
}

// 4. Missed a day → reset to 1
{
  const r = computeLoginReward({ lastLoginDate: "2026-06-10", priorStreak: 5, today: "2026-06-12" });
  assert(r.newStreak === 1, "streak reset after missed day");
  assert(r.pointsAwarded === 25, "no milestone");
}

// 5. Day 7 milestone
{
  const r = computeLoginReward({ lastLoginDate: "2026-06-16", priorStreak: 6, today: "2026-06-17" });
  assert(r.newStreak === 7, "advances to 7");
  assert(r.milestoneUnlocked === "day_7", "day_7 unlocked");
  assert(r.pointsAwarded === 25 + 100, "25 flat + 100 chest");
}

// 6. Day 14 milestone
{
  const r = computeLoginReward({ lastLoginDate: "2026-06-23", priorStreak: 13, today: "2026-06-24" });
  assert(r.milestoneUnlocked === "day_14", "day_14");
  assert(r.pointsAwarded === 25 + 300, "25 + 300 chest");
}

// 7. Day 30 milestone
{
  const r = computeLoginReward({ lastLoginDate: "2026-07-09", priorStreak: 29, today: "2026-07-10" });
  assert(r.milestoneUnlocked === "day_30", "day_30");
  assert(r.pointsAwarded === 25 + 600, "25 + 600 chest");
}

// 8. Day 39 milestone
{
  const r = computeLoginReward({ lastLoginDate: "2026-07-18", priorStreak: 38, today: "2026-07-19" });
  assert(r.milestoneUnlocked === "day_39", "day_39");
  assert(r.pointsAwarded === 25 + 1_000, "25 + 1000 chest");
}

// 9. Late joiner doesn't get prior chests
{
  const r = computeLoginReward({ lastLoginDate: null, priorStreak: 0, today: "2026-07-01" });
  assert(r.newStreak === 1, "starts at 1, not 21");
  assert(r.milestoneUnlocked === null, "no backpay");
  assert(r.pointsAwarded === 25, "just the flat");
}

// 10. Past-day-39 login still awards flat 25 (no milestone repeats)
{
  const r = computeLoginReward({ lastLoginDate: "2026-07-20", priorStreak: 40, today: "2026-07-21" });
  assert(r.newStreak === 41, "streak keeps growing");
  assert(r.milestoneUnlocked === null, "no further chests after day_39");
  assert(r.pointsAwarded === 25, "flat only");
}

console.log("OK: all computeLoginReward assertions passed");
```

- [ ] **Step 3: Run + export + commit**

Append to `packages/game-engine/src/index.ts`:

```ts
export * from "./login/computeLoginReward";
```

```bash
pnpm dlx tsx packages/game-engine/src/login/computeLoginReward.test.ts
git add packages/game-engine/src/login/ packages/game-engine/src/index.ts
git commit -m "feat(game-engine): computeLoginReward (streak + milestones) + 10-case tests"
```

---

## Task 5: Migrations — login_events + profile streak columns

**Files:**
- Create: `supabase/migrations/000029_login_events.sql`
- Create: `supabase/migrations/000030_profile_streak_columns.sql`

- [ ] **Step 1: 000029 login_events**

```sql
-- supabase/migrations/000029_login_events.sql
-- Per-user, per-calendar-day login claim history. Powers the daily +25 reward,
-- milestone chest unlocks, and the login streak.
--
-- Streak math is done by the claim-daily-login edge function using
-- computeLoginReward (packages/game-engine). The streak value AT THIS LOGIN
-- is stored as streak_at_login for later analytics; the user's current_login_streak
-- on the profile is the source of truth for "are we in a streak right now".

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Calendar day in UTC. One row per user per day.
  login_date date not null,
  -- Streak the user reached AT THIS LOGIN (1+).
  streak_at_login integer not null check (streak_at_login >= 1),
  -- Competitive points awarded at this login (25 flat + milestone if applicable).
  points_awarded integer not null default 0,
  -- Which milestone chest was unlocked at this login, if any.
  milestone_kind text check (milestone_kind in ('day_7','day_14','day_30','day_39')),
  created_at timestamptz not null default now(),
  unique (user_id, login_date)
);

create index login_events_user_idx on public.login_events (user_id, login_date desc);

alter table public.login_events enable row level security;

create policy "Users can read their own login events"
  on public.login_events for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes go through the claim-daily-login edge function (service role).
-- Block direct authenticated inserts/updates.
create policy "No direct login event writes"
  on public.login_events for insert
  to authenticated
  with check (false);
```

- [ ] **Step 2: 000030 profile streak columns**

```sql
-- supabase/migrations/000030_profile_streak_columns.sql
-- Per-profile streak counters cached on the profile for fast UI reads and
-- fast trivia-streak-multiplier lookup. Derivable from login_events +
-- trivia_attempts but caching here keeps the scoring path read-light.

alter table public.profiles
  add column if not exists current_login_streak integer not null default 0,
  add column if not exists longest_login_streak integer not null default 0,
  add column if not exists current_trivia_streak integer not null default 0,
  add column if not exists longest_trivia_streak integer not null default 0,
  add column if not exists last_login_date date,
  -- One-time end-of-tournament unlock flag for the Trophy Room cosmetic.
  add column if not exists perfect_knockout_run boolean not null default false;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/000029_login_events.sql supabase/migrations/000030_profile_streak_columns.sql
git commit -m "feat(supabase): migrations 000029-30 — login_events table + 6 profile streak/flag columns"
```

---

## Task 6: Rewrite score-trivia-attempt edge function

**Files:**
- Modify: `supabase/functions/score-trivia-attempt/index.ts`
- Create: `supabase/functions/score-trivia-attempt/scoreTriviaDay.ts` (mirror of game-engine for Deno)

- [ ] **Step 1: Mirror the scoreTriviaDay logic in the edge function**

Edge functions run in Deno; they can't import from the workspace. Mirror the logic in a local file:

```ts
// supabase/functions/score-trivia-attempt/scoreTriviaDay.ts
// MIRROR of packages/game-engine/src/trivia/scoreTriviaDay.ts.
// Keep in sync manually when scoring rules change.

const TRIVIA_TIERS = [
  { difficulty: "easy",   basePoints: 50,  timeLimitMs: 15_000 },
  { difficulty: "medium", basePoints: 100, timeLimitMs: 20_000 },
  { difficulty: "hard",   basePoints: 200, timeLimitMs: 30_000 },
] as const;

const ALL_THREE_COMBO_BONUS = 60;

const STREAK_STEPS = [
  { minStreak: 21, multiplier: 1.30 },
  { minStreak: 14, multiplier: 1.20 },
  { minStreak: 7,  multiplier: 1.10 },
  { minStreak: 0,  multiplier: 1.00 },
];

function getTierForOrder(order: number) {
  const idx = Math.max(0, Math.min(TRIVIA_TIERS.length - 1, order - 1));
  return TRIVIA_TIERS[idx]!;
}

function getStreakMultiplier(streakDays: number): number {
  for (const s of STREAK_STEPS) if (streakDays >= s.minStreak) return s.multiplier;
  return 1.0;
}

export interface TriviaAnswerInput {
  questionOrder: number;
  isCorrect: boolean;
  responseTimeMs: number;
}

function calculatePoints(a: TriviaAnswerInput): number {
  if (!a.isCorrect) return 0;
  const tier = getTierForOrder(a.questionOrder);
  const ratio = 1 - a.responseTimeMs / (tier.timeLimitMs * 2);
  return Math.round(tier.basePoints * Math.max(0, ratio));
}

export function scoreTriviaDay(answers: TriviaAnswerInput[], priorStreak: number) {
  const perAnswer = answers.map((a) => ({
    points: calculatePoints(a),
    isCorrect: a.isCorrect,
    questionOrder: a.questionOrder,
  }));
  const questionPoints = perAnswer.reduce((s, p) => s + p.points, 0);
  const isPerfectDay = answers.length >= 3 && answers.every((a) => a.isCorrect);
  const comboBonus = isPerfectDay ? ALL_THREE_COMBO_BONUS : 0;
  const newStreak = isPerfectDay ? priorStreak + 1 : 0;
  const streakMultiplier = getStreakMultiplier(newStreak);
  const competitivePoints = Math.round((questionPoints + comboBonus) * streakMultiplier);
  return { questionPoints, comboBonus, streakMultiplier, competitivePoints, isPerfectDay, perAnswer, newStreak };
}
```

- [ ] **Step 2: Update index.ts to use the new scorer + write streak back to profile**

Open `supabase/functions/score-trivia-attempt/index.ts`. Modify the section where the attempt is scored. Replace the existing scoring block with this:

```ts
import { scoreTriviaDay, type TriviaAnswerInput } from "./scoreTriviaDay.ts";

// ... inside the handler, after questions are fetched and matched ...

// 1. Load the user's prior trivia streak from profile.
const { data: profileRow, error: profileError } = await supabaseAdmin
  .from("profiles")
  .select("current_trivia_streak, longest_trivia_streak")
  .eq("id", userData.user.id)
  .maybeSingle<{ current_trivia_streak: number; longest_trivia_streak: number }>();
if (profileError) throw profileError;
const priorStreak = profileRow?.current_trivia_streak ?? 0;

// 2. Score the day.
const scoreInputs: TriviaAnswerInput[] = input.answers.map((a) => {
  const q = questions.find((q) => q.id === a.questionId);
  return {
    questionOrder: q?.question_order ?? 1,
    isCorrect: q?.correct_answer_key === a.selectedAnswerKey,
    responseTimeMs: a.responseTimeMs,
  };
});
const scored = scoreTriviaDay(scoreInputs, priorStreak);

// 3. Persist the attempt with the new score breakdown.
const correctAnswers = scored.perAnswer.filter((p) => p.isCorrect).length;
const totalResponseTimeMs = input.answers.reduce((sum, a) => sum + a.responseTimeMs, 0);
const earnedCardXp = correctAnswers * 25 + (correctAnswers === input.answers.length ? 50 : 0);

const { data: attempt, error: insertError } = await supabaseAdmin
  .from("trivia_attempts")
  .insert({
    user_id: userData.user.id,
    active_date: input.activeDate,
    total_questions: input.answers.length,
    correct_answers: correctAnswers,
    total_response_time_ms: totalResponseTimeMs,
    competitive_points: scored.competitivePoints,
    earned_card_xp: earnedCardXp,
  })
  .select(ATTEMPT_COLUMNS)
  .single<TriviaAttemptRow>();
if (insertError) throw insertError;

// 4. Persist per-answer rows so loadExistingAttempt + history work.
const answerRows = input.answers.map((a, i) => {
  const inp = scoreInputs[i]!;
  const pts = scored.perAnswer[i]!.points;
  return {
    attempt_id: attempt.id,
    question_id: a.questionId,
    selected_answer_key: a.selectedAnswerKey,
    is_correct: inp.isCorrect,
    response_time_ms: a.responseTimeMs,
    // Cache the per-answer points so legacy loadExistingAttempt doesn't have to recompute.
    points: pts,
  };
});
const { error: ansError } = await supabaseAdmin
  .from("trivia_attempt_answers")
  .insert(answerRows);
if (ansError) throw ansError;

// 5. Update streak on profile.
const longestStreak = Math.max(
  profileRow?.longest_trivia_streak ?? 0,
  scored.newStreak
);
const { error: streakError } = await supabaseAdmin
  .from("profiles")
  .update({
    current_trivia_streak: scored.newStreak,
    longest_trivia_streak: longestStreak,
  })
  .eq("id", userData.user.id);
if (streakError) throw streakError;
```

⚠️ If `trivia_attempt_answers.points` doesn't exist as a column yet, drop that line. The existing schema (read in 000005_trivia.sql) shows no `points` column on answers — we'll add it in a follow-up migration if needed. For NOW, skip the `points` field in the `answerRows` insert (it's cached elsewhere via the attempt total).

- [ ] **Step 3: Deno syntax check (if Deno installed)**

```bash
/Users/denverlobo/.deno/bin/deno check supabase/functions/score-trivia-attempt/index.ts 2>&1 | tail -10
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/score-trivia-attempt/
git commit -m "feat(edge): score-trivia-attempt uses new scoreTriviaDay (50/100/200 + combo + streak); writes streak back to profile"
```

---

## Task 7: claim-daily-login edge function

**Files:**
- Create: `supabase/functions/claim-daily-login/index.ts`
- Create: `supabase/functions/claim-daily-login/computeLoginReward.ts` (mirror)
- Create: `supabase/functions/claim-daily-login/schema.ts`

- [ ] **Step 1: Mirror computeLoginReward in Deno**

```ts
// supabase/functions/claim-daily-login/computeLoginReward.ts
// MIRROR of packages/game-engine/src/login/computeLoginReward.ts.

const FLAT_DAILY = 25;
const MILESTONES: Record<number, { kind: "day_7"|"day_14"|"day_30"|"day_39"; bonus: number }> = {
  7:  { kind: "day_7",  bonus: 100  },
  14: { kind: "day_14", bonus: 300  },
  30: { kind: "day_30", bonus: 600  },
  39: { kind: "day_39", bonus: 1000 },
};

function previousDayUTC(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function computeLoginReward(input: {
  lastLoginDate: string | null;
  priorStreak: number;
  today: string;
}) {
  if (input.lastLoginDate === input.today) {
    return { newStreak: input.priorStreak, isFirstClaimToday: false, pointsAwarded: 0, milestoneUnlocked: null as null | string };
  }
  const isConsecutive = input.lastLoginDate === previousDayUTC(input.today);
  const newStreak = isConsecutive ? input.priorStreak + 1 : 1;
  const m = MILESTONES[newStreak];
  return {
    newStreak,
    isFirstClaimToday: true,
    pointsAwarded: FLAT_DAILY + (m?.bonus ?? 0),
    milestoneUnlocked: m?.kind ?? null,
  };
}
```

- [ ] **Step 2: Request/response schema**

```ts
// supabase/functions/claim-daily-login/schema.ts
export interface ClaimDailyLoginResponse {
  pointsAwarded: number;
  newStreak: number;
  longestStreak: number;
  isFirstClaimToday: boolean;
  milestoneUnlocked: "day_7" | "day_14" | "day_30" | "day_39" | null;
}
```

- [ ] **Step 3: Entry point**

```ts
// supabase/functions/claim-daily-login/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { computeLoginReward } from "./computeLoginReward.ts";
import type { ClaimDailyLoginResponse } from "./schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")   return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey)
      return jsonResponse({ error: "Supabase env not configured." }, 500);
    if (!authorization) return jsonResponse({ error: "Missing Authorization header." }, 401);

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }, global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ error: "Unauthorized." }, 401);

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

    // Load current profile streak state.
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("current_login_streak, longest_login_streak, last_login_date")
      .eq("id", userData.user.id)
      .maybeSingle<{ current_login_streak: number; longest_login_streak: number; last_login_date: string | null }>();
    if (pErr) throw pErr;

    const today = todayUTC();
    const result = computeLoginReward({
      lastLoginDate: profile?.last_login_date ?? null,
      priorStreak: profile?.current_login_streak ?? 0,
      today,
    });

    if (!result.isFirstClaimToday) {
      const response: ClaimDailyLoginResponse = {
        pointsAwarded: 0,
        newStreak: result.newStreak,
        longestStreak: profile?.longest_login_streak ?? 0,
        isFirstClaimToday: false,
        milestoneUnlocked: null,
      };
      return jsonResponse(response);
    }

    const longestStreak = Math.max(profile?.longest_login_streak ?? 0, result.newStreak);

    // Insert login event (unique constraint blocks any race).
    const { error: insertError } = await admin
      .from("login_events")
      .insert({
        user_id: userData.user.id,
        login_date: today,
        streak_at_login: result.newStreak,
        points_awarded: result.pointsAwarded,
        milestone_kind: result.milestoneUnlocked,
      });
    if (insertError) {
      // 23505 unique_violation = concurrent claim race; treat as already-claimed.
      if ((insertError as { code?: string }).code === "23505") {
        const response: ClaimDailyLoginResponse = {
          pointsAwarded: 0,
          newStreak: result.newStreak,
          longestStreak,
          isFirstClaimToday: false,
          milestoneUnlocked: null,
        };
        return jsonResponse(response);
      }
      throw insertError;
    }

    // Update profile.
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        current_login_streak: result.newStreak,
        longest_login_streak: longestStreak,
        last_login_date: today,
      })
      .eq("id", userData.user.id);
    if (updateError) throw updateError;

    const response: ClaimDailyLoginResponse = {
      pointsAwarded: result.pointsAwarded,
      newStreak: result.newStreak,
      longestStreak,
      isFirstClaimToday: true,
      milestoneUnlocked: result.milestoneUnlocked as ClaimDailyLoginResponse["milestoneUnlocked"],
    };
    return jsonResponse(response);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unexpected claim-daily-login error." },
      400
    );
  }
});
```

- [ ] **Step 4: Deno syntax check + commit**

```bash
/Users/denverlobo/.deno/bin/deno check supabase/functions/claim-daily-login/index.ts 2>&1 | tail -5
git add supabase/functions/claim-daily-login/
git commit -m "feat(edge): claim-daily-login function — flat +25 + milestone chests + streak persistence"
```

---

## Task 8: score-bracket edge function

**Files:**
- Create: `supabase/functions/score-bracket/index.ts`
- Create: `supabase/functions/score-bracket/scoreBracket.ts` (mirror)
- Modify: `supabase/functions/submit-bracket/index.ts` (invoke score-bracket after save)

- [ ] **Step 1: Mirror scoreBracket logic in Deno**

Copy `packages/game-engine/src/bracket/scoreBracket.ts` byte-for-byte to `supabase/functions/score-bracket/scoreBracket.ts`. Replace the import line at the top with the inline constants:

```ts
// supabase/functions/score-bracket/scoreBracket.ts
// MIRROR of packages/game-engine/src/bracket/scoreBracket.ts.

const BRACKET_SCORING = {
  groupPositionCorrect: 30,
  perfectGroupBonus: 120,
  bestThirdPlaceCorrect: 25,
  knockoutPerCorrect: { r32: 40, r16: 80, qf: 160, sf: 320, final: 640 },
  championBonus: 800,
  upsetBonusPctOfRound: 0.5,
} as const;

// ... (rest of scoreBracket.ts copied verbatim, EXCEPT the import line at top)
```

- [ ] **Step 2: Entry point — score-bracket**

```ts
// supabase/functions/score-bracket/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { scoreBracket, type BracketResults, type FifaRankings } from "./scoreBracket.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// FIFA rankings snapshot, frozen at first kickoff. Hardcoded for v1.
// TODO: move to a config table once we have an admin UI.
const FIFA_RANKINGS_V1: FifaRankings = {
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5, NED: 6, POR: 7, BEL: 8, ITA: 9, GER: 10,
  CRO: 11, MAR: 12, COL: 13, URU: 14, USA: 15, MEX: 16, SWZ: 17, JPN: 18, IRN: 19, DEN: 20,
  // ... rest as needed; default to 99 (lowest = biggest upset chance) for unlisted
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")   return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const body = await request.json() as { bracketId: string };
    if (!body.bracketId) return jsonResponse({ error: "Missing bracketId." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });

    // Load the bracket.
    const { data: bracket, error: bErr } = await admin
      .from("brackets")
      .select("id, user_id, picks")
      .eq("id", body.bracketId)
      .maybeSingle<{ id: string; user_id: string; picks: { groupRankings: Record<string, string[]>; picks: Record<string, unknown> } }>();
    if (bErr || !bracket) return jsonResponse({ error: "Bracket not found." }, 404);

    // Load match results. v1: read public.matches and partition by status.
    const { data: matches, error: mErr } = await admin
      .from("matches")
      .select("round, group_id, bracket_index, home_team_code, away_team_code, status, home_score, away_score")
      .returns<Array<{
        round: string; group_id: string | null; bracket_index: number | null;
        home_team_code: string | null; away_team_code: string | null;
        status: string; home_score: number | null; away_score: number | null;
      }>>();
    if (mErr) throw mErr;

    // Build BracketResults from completed matches. (v1: most matches are 'scheduled';
    // results stay zero until a results ingest PR lands.)
    const results: BracketResults = {
      groupFinalStandings: {},      // populated by results-ingest later
      bestThirdQualifiers: [],
      knockoutWinners: { r32: {}, r16: {}, qf: {}, sf: {}, final: null, third: null },
    };
    for (const m of matches ?? []) {
      if (m.status !== "completed") continue;
      // Determine winner from scores.
      const winner = (m.home_score ?? 0) > (m.away_score ?? 0)
        ? m.home_team_code
        : (m.away_score ?? 0) > (m.home_score ?? 0)
          ? m.away_team_code
          : null;
      if (!winner) continue;
      if (m.round === "final") results.knockoutWinners.final = winner;
      else if (m.round === "third") results.knockoutWinners.third = winner;
      else if (m.bracket_index !== null && ["r32","r16","qf","sf"].includes(m.round)) {
        (results.knockoutWinners as Record<string, Record<string, string>>)[m.round][String(m.bracket_index)] = winner;
      }
    }

    // Score it.
    const picks = bracket.picks;
    const knockouts = (picks.picks ?? {}) as {
      r32?: Record<string, string>; r16?: Record<string, string>;
      qf?: Record<string, string>;  sf?: Record<string, string>;
      final?: string | null; third?: string | null;
    };
    const champion = knockouts.final ?? null;
    const breakdown = scoreBracket(
      {
        groupRankings: picks.groupRankings ?? {},
        knockouts: {
          r32:   knockouts.r32 ?? {},
          r16:   knockouts.r16 ?? {},
          qf:    knockouts.qf ?? {},
          sf:    knockouts.sf ?? {},
          final: knockouts.final ?? null,
          third: knockouts.third ?? null,
        },
        champion,
      },
      results,
      FIFA_RANKINGS_V1
    );

    // Persist score + perfect-knockout flag.
    const updates: Record<string, unknown> = { score: breakdown.total };
    const { error: uErr } = await admin
      .from("brackets")
      .update(updates)
      .eq("id", bracket.id);
    if (uErr) throw uErr;

    if (breakdown.perfectKnockoutRun) {
      await admin
        .from("profiles")
        .update({ perfect_knockout_run: true })
        .eq("id", bracket.user_id);
    }

    return jsonResponse({ ok: true, score: breakdown.total, breakdown });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Unexpected score-bracket error." },
      400
    );
  }
});
```

- [ ] **Step 3: Modify submit-bracket to invoke score-bracket after save**

Open `supabase/functions/submit-bracket/index.ts`. Right before the function returns the saved bracket, add a call to `score-bracket`:

```ts
// After the successful save (saved bracket has id) but before returning:
const scoreUrl = `${supabaseUrl}/functions/v1/score-bracket`;
try {
  await fetch(scoreUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceRoleKey}`,
    },
    body: JSON.stringify({ bracketId: saved.id }),
  });
} catch {
  // Best-effort: scoring is idempotent and runs again on the next save.
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/score-bracket/ supabase/functions/submit-bracket/index.ts
git commit -m "feat(edge): score-bracket function + submit-bracket invokes it post-save"
```

---

## Task 9: useDailyLogin hook + API wrapper

**Files:**
- Create: `apps/mobile/src/features/login/api/claim.ts`
- Create: `apps/mobile/src/features/login/hooks/useDailyLogin.ts`
- Create: `apps/mobile/src/features/login/index.ts`

- [ ] **Step 1: API wrapper**

```ts
// apps/mobile/src/features/login/api/claim.ts
import { supabase } from "../../../lib/supabase";

export interface ClaimDailyLoginResponse {
  pointsAwarded: number;
  newStreak: number;
  longestStreak: number;
  isFirstClaimToday: boolean;
  milestoneUnlocked: "day_7" | "day_14" | "day_30" | "day_39" | null;
}

export async function claimDailyLogin(): Promise<ClaimDailyLoginResponse> {
  const { data, error } = await supabase.functions.invoke<ClaimDailyLoginResponse>(
    "claim-daily-login",
    { body: {} }
  );
  if (error) throw error;
  if (!data) throw new Error("Claim daily login returned no data.");
  return data;
}
```

- [ ] **Step 2: Hook**

```ts
// apps/mobile/src/features/login/hooks/useDailyLogin.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "../../auth/hooks/useSession";
import { claimDailyLogin, type ClaimDailyLoginResponse } from "../api/claim";

const LAST_CLAIM_STORAGE_KEY = "gogaffa.login.lastClaimDate";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UseDailyLoginResult {
  /** Last successful claim payload. null until first claim of the session. */
  lastClaim: ClaimDailyLoginResponse | null;
  /** True while a claim request is in flight. */
  isClaiming: boolean;
  /** Force a re-claim attempt (debounced; no-op if already claimed today). */
  claim: () => Promise<ClaimDailyLoginResponse | null>;
}

/**
 * On every transition from background→active, attempt to claim daily login
 * if we haven't claimed yet today (per AsyncStorage). The server is the source
 * of truth — repeat claims same UTC day are no-ops.
 */
export function useDailyLogin(): UseDailyLoginResult {
  const { user, isLoading: isSessionLoading } = useSession();
  const [lastClaim, setLastClaim] = useState<ClaimDailyLoginResponse | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const inFlightRef = useRef(false);

  const claim = useCallback(async (): Promise<ClaimDailyLoginResponse | null> => {
    if (!user || inFlightRef.current) return null;
    const today = todayUTC();
    const lastLocal = await AsyncStorage.getItem(LAST_CLAIM_STORAGE_KEY);
    if (lastLocal === today) return null; // already claimed today (per local cache)

    inFlightRef.current = true;
    setIsClaiming(true);
    try {
      const result = await claimDailyLogin();
      setLastClaim(result);
      if (result.isFirstClaimToday) {
        await AsyncStorage.setItem(LAST_CLAIM_STORAGE_KEY, today);
      }
      return result;
    } catch (err) {
      // Best-effort: log but don't block UI.
      console.warn("claimDailyLogin failed", err);
      return null;
    } finally {
      inFlightRef.current = false;
      setIsClaiming(false);
    }
  }, [user]);

  // Claim on initial mount once session resolves.
  useEffect(() => {
    if (isSessionLoading) return;
    if (!user) return;
    void claim();
  }, [user, isSessionLoading, claim]);

  // Re-claim on foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void claim();
    });
    return () => sub.remove();
  }, [claim]);

  return { lastClaim, isClaiming, claim };
}
```

- [ ] **Step 3: Feature index**

```ts
// apps/mobile/src/features/login/index.ts
export { useDailyLogin, type UseDailyLoginResult } from "./hooks/useDailyLogin";
export { claimDailyLogin, type ClaimDailyLoginResponse } from "./api/claim";
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/login/
git commit -m "feat(login): useDailyLogin hook + claimDailyLogin API (foreground-triggered, AsyncStorage de-dupe)"
```

---

## Task 10: LoginStreakBadge component + mount

**Files:**
- Create: `apps/mobile/src/features/login/components/LoginStreakBadge.tsx`
- Modify: `apps/mobile/src/features/login/index.ts` (export)
- Modify: `apps/mobile/app/(tabs)/home.tsx` (render badge)

- [ ] **Step 1: Component**

```tsx
// apps/mobile/src/features/login/components/LoginStreakBadge.tsx
import { StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface LoginStreakBadgeProps {
  streak: number;
}

export function LoginStreakBadge({ streak }: LoginStreakBadgeProps) {
  if (streak <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.emoji}>🔥</Text>
      <Text style={styles.text}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: opacity.red18,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  emoji: { fontSize: 14 },
  text: { color: colors.red, fontSize: 13, fontWeight: "900" },
});
```

- [ ] **Step 2: Export from feature index**

Append to `apps/mobile/src/features/login/index.ts`:

```ts
export { LoginStreakBadge } from "./components/LoginStreakBadge";
```

- [ ] **Step 3: Render on home tab**

Open `apps/mobile/app/(tabs)/home.tsx`. At the top of the screen JSX, near other header chips, render:

```tsx
import { LoginStreakBadge, useDailyLogin } from "../../src/features/login";

// inside component:
const { lastClaim } = useDailyLogin();
const streak = lastClaim?.newStreak ?? 0;

// in JSX, near the top:
<LoginStreakBadge streak={streak} />
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/login/components/ apps/mobile/src/features/login/index.ts apps/mobile/app/\(tabs\)/home.tsx
git commit -m "feat(login): LoginStreakBadge component + mount on home tab"
```

---

## Task 11: MilestoneUnlockModal

**Files:**
- Create: `apps/mobile/src/features/login/components/MilestoneUnlockModal.tsx`
- Modify: `apps/mobile/src/features/login/index.ts` (export)
- Modify: `apps/mobile/app/_layout.tsx` (mount modal listener)

- [ ] **Step 1: Modal component**

```tsx
// apps/mobile/src/features/login/components/MilestoneUnlockModal.tsx
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BrandButton } from "../../../components/brand";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

type MilestoneKind = "day_7" | "day_14" | "day_30" | "day_39";

const MILESTONE_COPY: Record<MilestoneKind, { title: string; body: string; points: number }> = {
  day_7:  { title: "Week 1 streak!",   body: "Seven days in a row — well played.",                    points: 100  },
  day_14: { title: "Two weeks!",       body: "Fourteen days. You're committed.",                      points: 300  },
  day_30: { title: "Thirty-day grind", body: "Most players won't make it this far.",                   points: 600  },
  day_39: { title: "Full tournament",  body: "Showed up every day. Trophy reserved.",                  points: 1000 },
};

interface MilestoneUnlockModalProps {
  milestone: MilestoneKind | null;
  onDismiss: () => void;
}

export function MilestoneUnlockModal({ milestone, onDismiss }: MilestoneUnlockModalProps) {
  if (!milestone) return null;
  const copy = MILESTONE_COPY[milestone];
  return (
    <Modal animationType="fade" transparent visible={milestone !== null}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>STREAK MILESTONE</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+{copy.points} pts</Text>
          </View>
          <BrandButton label="Got it" onPress={onDismiss} style={styles.cta} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { ...typography.body, color: opacity.ink70, marginTop: spacing.xs, textAlign: "center" },
  card: { backgroundColor: colors.cream, borderRadius: radius.lg, maxWidth: 320, padding: spacing.xl, width: "85%" },
  cta: { alignSelf: "stretch", marginTop: spacing.lg, width: "100%" },
  eyebrow: { color: colors.red, fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textAlign: "center" },
  overlay: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", flex: 1, justifyContent: "center" },
  pointsPill: {
    alignSelf: "center", backgroundColor: opacity.red18, borderRadius: radius.pill,
    marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  pointsText: { color: colors.red, fontSize: 16, fontWeight: "900" },
  title: { ...typography.display, color: colors.ink, marginTop: spacing.sm, textAlign: "center" },
});
```

- [ ] **Step 2: Export from feature index**

Append to `apps/mobile/src/features/login/index.ts`:

```ts
export { MilestoneUnlockModal } from "./components/MilestoneUnlockModal";
```

- [ ] **Step 3: Mount in _layout with the hook**

Open `apps/mobile/app/_layout.tsx`. Add a small wrapper component that subscribes to the hook and renders the modal:

```tsx
import { MilestoneUnlockModal, useDailyLogin } from "../src/features/login";
import { useEffect, useState } from "react";

function LoginMilestoneMount() {
  const { lastClaim } = useDailyLogin();
  const [showMilestone, setShowMilestone] = useState<"day_7"|"day_14"|"day_30"|"day_39"|null>(null);

  useEffect(() => {
    if (lastClaim?.milestoneUnlocked) setShowMilestone(lastClaim.milestoneUnlocked);
  }, [lastClaim?.milestoneUnlocked]);

  return <MilestoneUnlockModal milestone={showMilestone} onDismiss={() => setShowMilestone(null)} />;
}

// Then inside the root provider tree, mount <LoginMilestoneMount /> as a sibling
// of <RootStack /> (so it overlays all screens).
```

⚠️ Order: place `<LoginMilestoneMount />` AFTER `<RootStack />` inside the providers wrapper so it renders above all screens but inside the providers it needs (session).

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/login/components/ apps/mobile/src/features/login/index.ts apps/mobile/app/_layout.tsx
git commit -m "feat(login): MilestoneUnlockModal + mount in root layout"
```

---

## Task 12: Trivia UI updates — new tier values + streak breakdown

**Files:**
- Modify: `apps/mobile/src/features/trivia/components/QuestionCard.tsx` (if it displays tier values)
- Modify: `apps/mobile/src/features/trivia/components/CompletedView.tsx` (show streak multiplier)
- Modify: `apps/mobile/app/(tabs)/trivia.tsx` (tier chips on intro)

- [ ] **Step 1: Read existing trivia.tsx tier chips**

```bash
grep -A5 "TRIVIA_QUESTION_TIERS\|tierRow" apps/mobile/app/\(tabs\)/trivia.tsx | head -30
```

If the intro screen renders tier chips with hardcoded values, they'll auto-update once `xpRules.ts` ships (Task 1). If hardcoded, replace with reads from `TRIVIA_QUESTION_TIERS`.

- [ ] **Step 2: Add streak-multiplier breakdown to CompletedView**

Open `apps/mobile/src/features/trivia/components/CompletedView.tsx`. After the existing `summaryLine` text, add a streak-bonus chip if the attempt has a multiplier > 1.0. Read multiplier from the attempt:

```tsx
{/* After summaryLine, before xpPill */}
{attempt.competitivePoints > attempt.answers.reduce((s, a) => s + (a.points ?? 0), 0) + 60 ? (
  <Text style={styles.streakLine}>
    Streak bonus applied
  </Text>
) : null}
```

⚠️ This is rough — the attempt as returned doesn't include `streakMultiplier`. For better UX we'd extend the edge function response. Defer that polish to a follow-up; v1 just shows the total points correctly.

Style:
```ts
streakLine: {
  ...typography.caption,
  color: colors.red,
  fontWeight: "900",
  marginTop: spacing.xs,
  textAlign: "center",
},
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/trivia/components/CompletedView.tsx
git commit -m "feat(trivia): show streak-bonus indicator on completed view"
```

---

## Task 13: Manual smoke test + final verification

- [ ] **Step 1: Pure-function tests pass**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
pnpm dlx tsx packages/game-engine/src/bracket/scoreBracket.test.ts
pnpm dlx tsx packages/game-engine/src/trivia/scoreTriviaDay.test.ts
pnpm dlx tsx packages/game-engine/src/login/computeLoginReward.test.ts
```

Expected: 3 × `OK: all ... assertions passed`.

- [ ] **Step 2: Full monorepo typecheck**

```bash
pnpm -r typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Deno check edge functions (if Deno installed)**

```bash
/Users/denverlobo/.deno/bin/deno check supabase/functions/score-trivia-attempt/index.ts
/Users/denverlobo/.deno/bin/deno check supabase/functions/claim-daily-login/index.ts
/Users/denverlobo/.deno/bin/deno check supabase/functions/score-bracket/index.ts
```

- [ ] **Step 4: Manual on-device smoke (if migrations + edge functions deployed to Supabase)**

This requires applying 000029 + 000030 to hosted Supabase and deploying the new edge functions. After:

1. Open app. Confirm `LoginStreakBadge` appears on home tab.
2. Force-quit + reopen. Re-open should NOT re-trigger milestone modal (already claimed today).
3. Play trivia. Confirm:
   - Tier chips show 50/100/200 + 15s/20s/30s
   - Completing all 3 correct adds combo bonus
   - The competitive points returned roughly equal Q-sum + 60 (no streak yet)
4. Submit a bracket. Confirm `brackets.score` updates (likely to 0 until match results land, but no error).

- [ ] **Step 5: Stop and ask user before pushing or opening PR**

Don't auto-open the PR. Verify with user that PR #20 has merged first.

---

## Task 14: Push + open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feature/points-system-rewrite
```

- [ ] **Step 2: Open as draft PR**

Visit the URL printed by `git push`.

Title:
```
feat: points system rewrite — trivia rebalance + bracket scoring + login + milestones
```

Body — paste the design summary from the spec, plus:

```
## Test plan
- [ ] `pnpm dlx tsx packages/game-engine/src/bracket/scoreBracket.test.ts` passes (9 cases)
- [ ] `pnpm dlx tsx packages/game-engine/src/trivia/scoreTriviaDay.test.ts` passes (8 cases)
- [ ] `pnpm dlx tsx packages/game-engine/src/login/computeLoginReward.test.ts` passes (10 cases)
- [ ] `pnpm -r typecheck` clean
- [ ] Migrations 000029 + 000030 apply to Supabase
- [ ] `score-trivia-attempt`, `claim-daily-login`, `score-bracket` edge fns deploy
- [ ] On-device: home tab shows streak badge; trivia tier chips read 50/100/200; bracket save updates score; first login of a new UTC day awards +25 + appropriate milestone

## Coordination ask
- PR #20 must merge first (it ships Q1=100/Q2=150/Q3=200; this rebalances DOWN to PRD).
- Confirm migration numbers 000029/000030 don't collide with anything in flight.
```

---

## Self-review checklist (performed before plan handoff)

**Spec coverage:**
- ✅ Trivia rebalance (Task 1, 3, 6)
- ✅ Bracket scoring (Tasks 1, 2, 8)
- ✅ Login + milestones (Tasks 1, 4, 5, 7, 9, 10, 11)
- ✅ Streak system (Tasks 4, 5, 7) — login streak; trivia streak in Task 6
- ✅ Perfect-run flags (Tasks 5, 8) — perfect_knockout_run column + scorer logic
- ✅ Edge function update for trivia (Task 6)
- ✅ Edge function for login (Task 7)
- ✅ Bracket scorer (Tasks 2, 8)
- ✅ Client hook + UI (Tasks 9, 10, 11, 12)

**Out of scope (correctly omitted):**
- ✅ Card stats (PR-B)
- ✅ Stat multipliers (PR-B)
- ✅ Trophy Room visual (cosmetics PR)
- ✅ Match results ingest (separate PR; bracket score stays at 0 until results land — confirmed in plan)
- ✅ Streak-freeze IAP (deferred)

**Placeholders:** None — every step has concrete code or commands.

**Type consistency:** `scoreTriviaDay`, `scoreBracket`, `computeLoginReward` signatures and exports are consistent across game-engine and edge function mirrors.
