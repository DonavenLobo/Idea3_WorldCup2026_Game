# Daily Trivia Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GoGaffa's daily trivia serve 3 randomized questions per day, each about a different 2026-World-Cup nation, regenerating every day after today, and report any day that can't be filled plus draft questions to fill it.

**Architecture:** A tested, pure TypeScript selector + generator in `@gogaffa/game-engine` deterministically picks 3 distinct-nation, WC-2026-only questions per date from a reviewable question pool, and materializes them into `supabase/seed/trivia_questions.sql`. The mobile app and the `score-trivia-attempt` edge function (already 3-based) are unchanged. A DB migration adds the WC flag and fixes the attempts default.

**Tech Stack:** TypeScript (ESM, pnpm workspaces, turbo), Supabase Postgres (SQL migrations + seed). Game-engine tests are hand-rolled and run with `pnpm dlx tsx <file>` (matching the existing `scoreTriviaDay.test.ts`).

**Branch:** `feature/trivia-daily-rules` (already created off `feature/points-system-rewrite`; the design spec is committed at `docs/superpowers/specs/2026-06-12-trivia-daily-rules-design.md`).

---

## Confirmed current state
- Edge function already enforces 3: `supabase/functions/score-trivia-attempt/schema.ts:55` `TRIVIA_DAILY_QUESTION_COUNT = 3`. Scoring engine (`scoreTriviaDay.ts`, `TRIVIA_QUESTION_TIERS=[50,100,200]`, `TRIVIA_ALL_THREE_COMBO_BONUS`) is 3-based. Only `xpRules.questionsPerDay: 5` and `trivia_attempts.total_questions default 5` are stale.
- `nations` has 48 rows in `supabase/seed/nations.sql` (the 2026 field). No WC flag column yet.
- `trivia_questions(active_date, question_order, question, answer_options jsonb, correct_answer_key, explanation, difficulty, nation_code)`, `unique(active_date, question_order)`. Pilot seed repeats the same 5 questions/day for 30 days with `nation_code = null`.
- Client reads by date: `getDailyTriviaQuestions(activeDate)` in `apps/mobile/src/features/trivia/api/trivia.ts`.

## File Structure
| File | Responsibility |
|------|----------------|
| `supabase/migrations/000032_trivia_daily_rules.sql` (Create) | `nations.in_world_cup_2026` column; `trivia_attempts.total_questions` default → 3 |
| `supabase/seed/nations.sql` (Modify) | Flag the 48 WC-2026 nations |
| `packages/config/src/xpRules.ts` (Modify) | `questionsPerDay: 5 → 3` |
| `packages/types/src/trivia.ts` (Modify) | `PooledTriviaQuestion` type |
| `packages/game-engine/src/trivia/worldCup2026.ts` (Create) | `WORLD_CUP_2026_NATION_CODES` constant |
| `packages/game-engine/src/trivia/seededRandom.ts` (Create) | Deterministic PRNG + shuffle |
| `packages/game-engine/src/trivia/selectDailyQuestions.ts` (Create) | Per-date distinct-nation WC selector + `InsufficientPoolError` |
| `packages/game-engine/src/trivia/generateTriviaSchedule.ts` (Create) | Multi-day generator + `renderScheduleSql` + `addDays` |
| `packages/game-engine/src/trivia/pool/worldCupTriviaPool.ts` (Create) | Reviewable question pool (content) |
| `packages/game-engine/scripts/generateTriviaSeed.ts` (Create) | Wires pool+dates → coverage report + writes seed |
| `packages/game-engine/src/trivia/*.test.ts` (Create) | Hand-rolled tsx tests |
| `docs/superpowers/specs/trivia-gap-fill-suggestions.md` (Create, Task 9) | Drafted gap-fill questions for review |

Note on "after today": past days (`< today`) are never generated or modified. The generator's `startDate` is **today inclusive**, because the seed file must populate today and today currently has 5 questions (which the 3-question scorer rejects). This is flagged in the coverage report.

---

## Task 1: DB migration + WC-2026 flag

**Files:**
- Create: `supabase/migrations/000032_trivia_daily_rules.sql`
- Modify: `supabase/seed/nations.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/000032_trivia_daily_rules.sql`:
```sql
-- Daily trivia rules: WC-2026 flag on nations + 3-question default.
alter table public.nations
  add column if not exists in_world_cup_2026 boolean not null default false;

alter table public.trivia_attempts
  alter column total_questions set default 3;
```

- [ ] **Step 2: Flag the WC-2026 nations in the seed**

At the END of `supabase/seed/nations.sql`, append (these are the 48 codes already seeded — the 2026 field; user verifies):
```sql

-- Mark the 2026 World Cup field. Verified against the seeded nations (48 teams).
update public.nations set in_world_cup_2026 = true
where code in (
  'USA','MEX','CAN','CRC','PAN','JAM','HON',
  'BRA','ARG','URU','COL','ECU','PER','PAR',
  'ENG','FRA','ESP','GER','POR','NED','BEL','ITA','CRO','SUI','DEN','POL','NOR','SWE','AUT','SRB',
  'JPN','KOR','AUS','IRN','KSA','QAT','UZB','IRQ',
  'MAR','SEN','EGY','NGA','CMR','GHA','TUN','ALG','CIV',
  'NZL'
);
```

- [ ] **Step 3: Apply locally and verify (if Supabase is running)**

Run: `cd ~/Desktop/Football\ Project/Idea3_WorldCup2026_Game && supabase db reset 2>&1 | tail -5 || echo "supabase not running — verify on next db push"`
Expected: reset succeeds, or a clear note. Then, if running:
`supabase db execute --query "select count(*) filter (where in_world_cup_2026) as wc, count(*) as total from public.nations;"`
Expected: `wc = 48, total = 48`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/000032_trivia_daily_rules.sql supabase/seed/nations.sql
git commit -m "feat(db): add in_world_cup_2026 flag and 3-question attempts default"
```

---

## Task 2: Flip questions-per-day to 3

**Files:**
- Modify: `packages/config/src/xpRules.ts`

- [ ] **Step 1: Change the config**

In `packages/config/src/xpRules.ts`, in `TRIVIA_RULES`, change:
```ts
  questionsPerDay: 5,
```
to:
```ts
  questionsPerDay: 3,
```

- [ ] **Step 2: Confirm the scoring suite still passes at 3**

Run: `cd ~/Desktop/Football\ Project/Idea3_WorldCup2026_Game && pnpm dlx tsx packages/game-engine/src/trivia/scoreTriviaDay.test.ts`
Expected: exits 0 (the 3-based tiers/combo were already correct).

- [ ] **Step 3: Typecheck the affected packages**

Run: `pnpm --filter @gogaffa/config --filter @gogaffa/game-engine typecheck 2>&1 | tail -5`
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/config/src/xpRules.ts
git commit -m "feat(config): set trivia questionsPerDay to 3 (aligns with 3-based scorer)"
```

---

## Task 3: Pool type + WC-2026 constant

**Files:**
- Modify: `packages/types/src/trivia.ts`
- Create: `packages/game-engine/src/trivia/worldCup2026.ts`

- [ ] **Step 1: Add the pool type**

Append to `packages/types/src/trivia.ts`:
```ts
export interface PooledTriviaQuestion {
  /** Stable unique id within the pool. */
  id: string;
  /** Subject nation (FK code into public.nations). */
  nationCode: string;
  question: string;
  /** Exactly four options, keys A–D. */
  answerOptions: TriviaAnswerOption[];
  correctAnswerKey: AnswerKey;
  explanation: string;
  difficulty: string;
}
```

- [ ] **Step 2: Add the WC-2026 constant**

Create `packages/game-engine/src/trivia/worldCup2026.ts`:
```ts
/** The 2026 World Cup field (mirrors nations.in_world_cup_2026 in the DB). */
export const WORLD_CUP_2026_NATION_CODES: readonly string[] = [
  "USA", "MEX", "CAN", "CRC", "PAN", "JAM", "HON",
  "BRA", "ARG", "URU", "COL", "ECU", "PER", "PAR",
  "ENG", "FRA", "ESP", "GER", "POR", "NED", "BEL", "ITA", "CRO", "SUI",
  "DEN", "POL", "NOR", "SWE", "AUT", "SRB",
  "JPN", "KOR", "AUS", "IRN", "KSA", "QAT", "UZB", "IRQ",
  "MAR", "SEN", "EGY", "NGA", "CMR", "GHA", "TUN", "ALG", "CIV",
  "NZL",
];

export const WORLD_CUP_2026_NATION_SET: ReadonlySet<string> = new Set(
  WORLD_CUP_2026_NATION_CODES,
);
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @gogaffa/types --filter @gogaffa/game-engine typecheck 2>&1 | tail -5`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/trivia.ts packages/game-engine/src/trivia/worldCup2026.ts
git commit -m "feat(trivia): PooledTriviaQuestion type + WC-2026 nation constant"
```

---

## Task 4: Deterministic PRNG + shuffle

**Files:**
- Create: `packages/game-engine/src/trivia/seededRandom.ts`
- Create: `packages/game-engine/src/trivia/seededRandom.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/game-engine/src/trivia/seededRandom.test.ts`:
```ts
/** Run: pnpm dlx tsx packages/game-engine/src/trivia/seededRandom.test.ts */
import { seededRandom, seededShuffle } from "./seededRandom";

declare const process: { exit(code?: number): never };
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log("ok -", name);
  else { failed++; console.error("FAIL -", name); }
}

// Deterministic: same seed → same sequence
const a = seededRandom("2026-06-13");
const b = seededRandom("2026-06-13");
check("same seed same first value", a() === b());

// Different seed → (almost certainly) different first value
const c = seededRandom("2026-06-14")();
const d = seededRandom("2026-06-13")();
check("different seed differs", c !== d);

// Range [0,1)
const r = seededRandom("x");
let inRange = true;
for (let i = 0; i < 100; i++) { const v = r(); if (v < 0 || v >= 1) inRange = false; }
check("values in [0,1)", inRange);

// Shuffle is deterministic and a permutation
const items = [1, 2, 3, 4, 5];
const s1 = seededShuffle(items, seededRandom("d"));
const s2 = seededShuffle(items, seededRandom("d"));
check("shuffle deterministic", JSON.stringify(s1) === JSON.stringify(s2));
check("shuffle is permutation", JSON.stringify([...s1].sort()) === JSON.stringify(items));
check("shuffle does not mutate input", JSON.stringify(items) === JSON.stringify([1,2,3,4,5]));

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm dlx tsx packages/game-engine/src/trivia/seededRandom.test.ts`
Expected: FAIL — cannot find module `./seededRandom`.

- [ ] **Step 3: Implement**

Create `packages/game-engine/src/trivia/seededRandom.ts`:
```ts
/** Deterministic PRNG (xfnv1a hash seed → mulberry32). Pure, dependency-free. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  let a = h >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a new deterministically-shuffled array; does not mutate input. */
export function seededShuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm dlx tsx packages/game-engine/src/trivia/seededRandom.test.ts`
Expected: `ALL PASS`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/game-engine/src/trivia/seededRandom.ts packages/game-engine/src/trivia/seededRandom.test.ts
git commit -m "feat(trivia): deterministic seeded PRNG + shuffle"
```

---

## Task 5: Daily selector (distinct nation, WC-only)

**Files:**
- Create: `packages/game-engine/src/trivia/selectDailyQuestions.ts`
- Create: `packages/game-engine/src/trivia/selectDailyQuestions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/game-engine/src/trivia/selectDailyQuestions.test.ts`:
```ts
/** Run: pnpm dlx tsx packages/game-engine/src/trivia/selectDailyQuestions.test.ts */
import type { PooledTriviaQuestion } from "@gogaffa/types";
import { selectDailyQuestions, InsufficientPoolError } from "./selectDailyQuestions";

declare const process: { exit(code?: number): never };
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log("ok -", name);
  else { failed++; console.error("FAIL -", name); }
}

function q(id: string, nation: string): PooledTriviaQuestion {
  return {
    id, nationCode: nation, question: `Q ${id}`,
    answerOptions: [
      { key: "A", label: "a" }, { key: "B", label: "b" },
      { key: "C", label: "c" }, { key: "D", label: "d" },
    ],
    correctAnswerKey: "A", explanation: "because", difficulty: "standard",
  };
}

const wc = new Set(["BRA", "ARG", "FRA", "ENG", "JPN"]);
const pool: PooledTriviaQuestion[] = [
  q("b1", "BRA"), q("b2", "BRA"), q("a1", "ARG"),
  q("f1", "FRA"), q("e1", "ENG"), q("j1", "JPN"),
  q("x1", "XXX"), // not in WC — must never be picked
];

const picks = selectDailyQuestions(pool, "2026-06-13", 3, { wcNationCodes: wc });
check("picks exactly 3", picks.length === 3);
check("distinct nations", new Set(picks.map((p) => p.nationCode)).size === 3);
check("all WC nations", picks.every((p) => wc.has(p.nationCode)));
check("never picks non-WC", picks.every((p) => p.nationCode !== "XXX"));

// Deterministic for a fixed date
const again = selectDailyQuestions(pool, "2026-06-13", 3, { wcNationCodes: wc });
check("deterministic per date", JSON.stringify(picks) === JSON.stringify(again));

// excludeQuestionIds honored
const ex = selectDailyQuestions(pool, "2026-06-13", 3, {
  wcNationCodes: wc, excludeQuestionIds: new Set(picks.map((p) => p.id)),
});
check("exclude avoids reused ids", ex.every((p) => !picks.some((o) => o.id === p.id)) || ex.length === 3);

// Insufficient distinct nations → throws typed error
let threw = false;
try {
  selectDailyQuestions([q("b1", "BRA"), q("b2", "BRA")], "2026-06-13", 3, { wcNationCodes: wc });
} catch (e) {
  threw = e instanceof InsufficientPoolError && (e as InsufficientPoolError).needed === 3;
}
check("throws InsufficientPoolError when <3 nations", threw);

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm dlx tsx packages/game-engine/src/trivia/selectDailyQuestions.test.ts`
Expected: FAIL — cannot find module `./selectDailyQuestions`.

- [ ] **Step 3: Implement**

Create `packages/game-engine/src/trivia/selectDailyQuestions.ts`:
```ts
import type { PooledTriviaQuestion } from "@gogaffa/types";
import { seededRandom, seededShuffle } from "./seededRandom";

export class InsufficientPoolError extends Error {
  constructor(
    public readonly date: string,
    public readonly reason: string,
    public readonly availableNations: number,
    public readonly needed: number,
  ) {
    super(
      `Cannot field ${needed} distinct WC nations for ${date}: ${reason} ` +
        `(have ${availableNations}).`,
    );
    this.name = "InsufficientPoolError";
  }
}

export interface SelectOptions {
  wcNationCodes: ReadonlySet<string>;
  excludeQuestionIds?: ReadonlySet<string>;
}

/**
 * Deterministically pick `count` questions for `isoDate` such that every pick is
 * a distinct WC-2026 nation. Stable for a given (pool contents, date, exclude set)
 * regardless of input order. Throws InsufficientPoolError when impossible.
 */
export function selectDailyQuestions(
  pool: readonly PooledTriviaQuestion[],
  isoDate: string,
  count: number,
  opts: SelectOptions,
): PooledTriviaQuestion[] {
  const exclude = opts.excludeQuestionIds ?? new Set<string>();
  const available = pool
    .filter((q) => opts.wcNationCodes.has(q.nationCode) && !exclude.has(q.id))
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id)); // order-independence

  const byNation = new Map<string, PooledTriviaQuestion[]>();
  for (const q of available) {
    const list = byNation.get(q.nationCode);
    if (list) list.push(q);
    else byNation.set(q.nationCode, [q]);
  }

  const nations = [...byNation.keys()].sort();
  if (nations.length < count) {
    throw new InsufficientPoolError(
      isoDate,
      "not enough distinct WC nations with an unused question",
      nations.length,
      count,
    );
  }

  const rand = seededRandom(isoDate);
  const chosenNations = seededShuffle(nations, rand).slice(0, count);
  return chosenNations.map((nation) => seededShuffle(byNation.get(nation)!, rand)[0]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm dlx tsx packages/game-engine/src/trivia/selectDailyQuestions.test.ts`
Expected: `ALL PASS`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/game-engine/src/trivia/selectDailyQuestions.ts packages/game-engine/src/trivia/selectDailyQuestions.test.ts
git commit -m "feat(trivia): deterministic distinct-nation WC daily selector"
```

---

## Task 6: Multi-day generator + SQL renderer

**Files:**
- Create: `packages/game-engine/src/trivia/generateTriviaSchedule.ts`
- Create: `packages/game-engine/src/trivia/generateTriviaSchedule.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/game-engine/src/trivia/generateTriviaSchedule.test.ts`:
```ts
/** Run: pnpm dlx tsx packages/game-engine/src/trivia/generateTriviaSchedule.test.ts */
import type { PooledTriviaQuestion } from "@gogaffa/types";
import {
  addDays, generateTriviaSchedule, renderScheduleSql,
} from "./generateTriviaSchedule";

declare const process: { exit(code?: number): never };
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log("ok -", name);
  else { failed++; console.error("FAIL -", name); }
}

function q(id: string, nation: string): PooledTriviaQuestion {
  return {
    id, nationCode: nation, question: `What about ${nation}? (${id})`,
    answerOptions: [
      { key: "A", label: "a" }, { key: "B", label: "b" },
      { key: "C", label: "c" }, { key: "D", label: "d" },
    ],
    correctAnswerKey: "A", explanation: "it's a fact", difficulty: "standard",
  };
}

check("addDays adds UTC days", addDays("2026-06-13", 2) === "2026-06-15");
check("addDays month rollover", addDays("2026-06-30", 1) === "2026-07-01");

const wc = new Set(["BRA", "ARG", "FRA", "ENG", "JPN"]);
const rich: PooledTriviaQuestion[] = [];
for (const n of wc) for (let i = 0; i < 4; i++) rich.push(q(`${n}${i}`, n));

const ok = generateTriviaSchedule({ pool: rich, wcNationCodes: wc, startDate: "2026-06-13", days: 3 });
check("3 days scheduled", ok.schedule.length === 3);
check("no gaps with rich pool", ok.gaps.length === 0);
check("each day 3 distinct nations", ok.schedule.every(
  (d) => d.questions.length === 3 && new Set(d.questions.map((x) => x.nationCode)).size === 3,
));
check("no question reused across horizon", (() => {
  const ids = ok.schedule.flatMap((d) => d.questions.map((x) => x.id));
  return new Set(ids).size === ids.length;
})());

// Thin pool → some days become gaps, generation does not throw (report mode)
const thin: PooledTriviaQuestion[] = [q("b0", "BRA"), q("a0", "ARG"), q("f0", "FRA")];
const thinRes = generateTriviaSchedule({ pool: thin, wcNationCodes: wc, startDate: "2026-06-13", days: 2 });
check("day 1 fills from thin pool", thinRes.schedule.some((d) => d.activeDate === "2026-06-13"));
check("day 2 is a gap (questions exhausted)", thinRes.gaps.some((g) => g.activeDate === "2026-06-14"));

// SQL render: 3 rows per day, correct columns, escaped quotes
const sql = renderScheduleSql(ok.schedule);
check("sql has insert", sql.includes("insert into public.trivia_questions"));
check("sql has on conflict upsert", sql.includes("on conflict (active_date, question_order) do update"));
check("sql row count = days*3", (sql.match(/::jsonb/g) || []).length === 9);

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm dlx tsx packages/game-engine/src/trivia/generateTriviaSchedule.test.ts`
Expected: FAIL — cannot find module `./generateTriviaSchedule`.

- [ ] **Step 3: Implement**

Create `packages/game-engine/src/trivia/generateTriviaSchedule.ts`:
```ts
import type { PooledTriviaQuestion } from "@gogaffa/types";
import { InsufficientPoolError, selectDailyQuestions } from "./selectDailyQuestions";

export interface DayPlan {
  activeDate: string;
  questions: PooledTriviaQuestion[];
}

export interface ScheduleGap {
  activeDate: string;
  reason: string;
  availableNations: number;
  needed: number;
}

export interface ScheduleResult {
  schedule: DayPlan[];
  gaps: ScheduleGap[];
}

/** Add `n` whole UTC days to an ISO `YYYY-MM-DD` date. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Build a daily schedule from `startDate` (inclusive) for `days` days. Each day
 * gets `count` distinct-nation WC questions. Questions are not reused across the
 * horizon (unless reuseQuestions). Days that cannot be filled are returned as
 * gaps rather than throwing (report mode).
 */
export function generateTriviaSchedule(params: {
  pool: readonly PooledTriviaQuestion[];
  wcNationCodes: ReadonlySet<string>;
  startDate: string;
  days: number;
  count?: number;
  reuseQuestions?: boolean;
}): ScheduleResult {
  const count = params.count ?? 3;
  const reuse = params.reuseQuestions ?? false;
  const used = new Set<string>();
  const schedule: DayPlan[] = [];
  const gaps: ScheduleGap[] = [];

  for (let i = 0; i < params.days; i++) {
    const activeDate = addDays(params.startDate, i);
    try {
      const questions = selectDailyQuestions(params.pool, activeDate, count, {
        wcNationCodes: params.wcNationCodes,
        excludeQuestionIds: reuse ? undefined : used,
      });
      schedule.push({ activeDate, questions });
      if (!reuse) for (const q of questions) used.add(q.id);
    } catch (err) {
      if (err instanceof InsufficientPoolError) {
        gaps.push({
          activeDate,
          reason: err.reason,
          availableNations: err.availableNations,
          needed: err.needed,
        });
      } else {
        throw err;
      }
    }
  }

  return { schedule, gaps };
}

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

/** Render an idempotent upsert seed for the given schedule. */
export function renderScheduleSql(schedule: readonly DayPlan[]): string {
  const rows: string[] = [];
  for (const day of schedule) {
    day.questions.forEach((q, idx) => {
      const order = idx + 1;
      const options = sqlEscape(JSON.stringify(q.answerOptions));
      rows.push(
        `  ('${day.activeDate}', ${order}, '${sqlEscape(q.question)}', ` +
          `'${options}'::jsonb, '${q.correctAnswerKey}', ` +
          `'${sqlEscape(q.explanation)}', '${sqlEscape(q.difficulty)}', '${q.nationCode}')`,
      );
    });
  }
  return [
    "-- GENERATED by generateTriviaSeed — do not edit by hand.",
    "insert into public.trivia_questions (",
    "  active_date, question_order, question, answer_options,",
    "  correct_answer_key, explanation, difficulty, nation_code",
    ") values",
    rows.join(",\n"),
    "on conflict (active_date, question_order) do update set",
    "  question = excluded.question,",
    "  answer_options = excluded.answer_options,",
    "  correct_answer_key = excluded.correct_answer_key,",
    "  explanation = excluded.explanation,",
    "  difficulty = excluded.difficulty,",
    "  nation_code = excluded.nation_code;",
    "",
  ].join("\n");
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm dlx tsx packages/game-engine/src/trivia/generateTriviaSchedule.test.ts`
Expected: `ALL PASS`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/game-engine/src/trivia/generateTriviaSchedule.ts packages/game-engine/src/trivia/generateTriviaSchedule.test.ts
git commit -m "feat(trivia): multi-day schedule generator + SQL renderer"
```

---

## Task 7: Author the starter question pool

**Files:**
- Create: `packages/game-engine/src/trivia/pool/worldCupTriviaPool.ts`

This is content authored by the controller (factual, nation-tagged, WC-2026 only, no FIFA/World-Cup marks per the App Store IP fix). Aim for enough nations and per-nation depth that a 30-day, 3-distinct-nation horizon has few or no gaps (≥ ~10 nations with ≥ several questions each is enough to start; gaps are expected and handled in Task 9).

- [ ] **Step 1: Create the pool module**

Create `packages/game-engine/src/trivia/pool/worldCupTriviaPool.ts` exporting `export const WORLD_CUP_TRIVIA_POOL: PooledTriviaQuestion[] = [ ... ]`. Each entry:
```ts
import type { PooledTriviaQuestion } from "@gogaffa/types";

export const WORLD_CUP_TRIVIA_POOL: PooledTriviaQuestion[] = [
  {
    id: "BRA-001",
    nationCode: "BRA",
    question: "Brazil has won the men's international football World Cup how many times?",
    answerOptions: [
      { key: "A", label: "Three" },
      { key: "B", label: "Four" },
      { key: "C", label: "Five" },
      { key: "D", label: "Six" },
    ],
    correctAnswerKey: "C",
    explanation: "Brazil have lifted the trophy five times (1958, 1962, 1970, 1994, 2002).",
    difficulty: "standard",
  },
  // ... author multiple questions per nation across the WC-2026 field.
];
```
Author at least several questions each for a broad set of WC-2026 nations. Keep facts verifiable and free of trademarked marks/logos. Use `id` format `<NATION>-NNN`.

- [ ] **Step 2: Typecheck the pool**

Run: `pnpm --filter @gogaffa/game-engine typecheck 2>&1 | tail -5`
Expected: no type errors (validates every entry matches `PooledTriviaQuestion`, 4 options, valid key).

- [ ] **Step 3: Commit**

```bash
git add packages/game-engine/src/trivia/pool/worldCupTriviaPool.ts
git commit -m "feat(trivia): starter WC-2026 question pool (nation-tagged, mark-free)"
```

---

## Task 8: Generator script — coverage report + write seed

**Files:**
- Create: `packages/game-engine/scripts/generateTriviaSeed.ts`
- Modify: `packages/game-engine/package.json` (add a `trivia:generate` script)

- [ ] **Step 1: Write the script**

Create `packages/game-engine/scripts/generateTriviaSeed.ts`:
```ts
/**
 * Generate the daily trivia seed for [today .. today+horizon].
 * Run: pnpm dlx tsx packages/game-engine/scripts/generateTriviaSeed.ts [horizonDays]
 * Writes supabase/seed/trivia_questions.sql. Prints a coverage report.
 * Exits non-zero if any day cannot be filled (strict).
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateTriviaSchedule, renderScheduleSql,
} from "../src/trivia/generateTriviaSchedule";
import { WORLD_CUP_2026_NATION_SET } from "../src/trivia/worldCup2026";
import { WORLD_CUP_TRIVIA_POOL } from "../src/trivia/pool/worldCupTriviaPool";

declare const process: {
  argv: string[];
  exit(code?: number): never;
  cwd(): string;
};

const horizon = Number(process.argv[2] ?? "30");
const today = new Date().toISOString().slice(0, 10);

const { schedule, gaps } = generateTriviaSchedule({
  pool: WORLD_CUP_TRIVIA_POOL,
  wcNationCodes: WORLD_CUP_2026_NATION_SET,
  startDate: today, // inclusive; past days are never generated
  days: horizon,
});

console.log(`Trivia schedule: ${today} for ${horizon} days`);
console.log(`  filled: ${schedule.length}  gaps: ${gaps.length}`);
if (gaps.length > 0) {
  console.log("\nDAYS THAT CANNOT FIELD 3 DISTINCT WC NATIONS:");
  for (const g of gaps) {
    console.log(`  ${g.activeDate}: ${g.reason} (have ${g.availableNations}, need ${g.needed})`);
  }
  // Which nations are thin: count remaining pool depth per nation
  console.log("\nRe-run after adding questions for under-supplied nations.");
}

const outPath = resolve(process.cwd(), "supabase/seed/trivia_questions.sql");
writeFileSync(outPath, renderScheduleSql(schedule), "utf8");
console.log(`\nWrote ${schedule.length * 3} rows to ${outPath}`);

process.exit(gaps.length === 0 ? 0 : 1);
```

- [ ] **Step 2: Add the npm script**

In `packages/game-engine/package.json`, add to `scripts`:
```json
    "trivia:generate": "tsx scripts/generateTriviaSeed.ts"
```

- [ ] **Step 3: Run the generator from the repo root**

Run: `cd ~/Desktop/Football\ Project/Idea3_WorldCup2026_Game && pnpm dlx tsx packages/game-engine/scripts/generateTriviaSeed.ts 30`
Expected: prints the filled/gaps summary and writes `supabase/seed/trivia_questions.sql`. If gaps exist, it lists the exact dates and exits non-zero (that's expected until the pool is deep enough).

- [ ] **Step 4: Commit the script (seed regenerated in Task 9 after gaps closed)**

```bash
git add packages/game-engine/scripts/generateTriviaSeed.ts packages/game-engine/package.json
git commit -m "feat(trivia): seed generator script with coverage report"
```

---

## Task 9: Close gaps + regenerate the seed

**Files:**
- Create: `docs/superpowers/specs/trivia-gap-fill-suggestions.md`
- Modify: `packages/game-engine/src/trivia/pool/worldCupTriviaPool.ts`
- Modify (generated): `supabase/seed/trivia_questions.sql`

- [ ] **Step 1: Capture the gap report**

Run the generator (Task 8 Step 3) and record the listed gap dates and under-supplied nations.

- [ ] **Step 2: Draft gap-fill suggestions for review**

Create `docs/superpowers/specs/trivia-gap-fill-suggestions.md` listing proposed NEW questions (same shape as the pool) for the under-supplied nations the report surfaced — grouped by nation, factual, mark-free. This is the user-review deliverable.

- [ ] **Step 3: Add approved questions to the pool**

Append the drafted questions into `WORLD_CUP_TRIVIA_POOL` (after user review during execution).

- [ ] **Step 4: Re-run the generator until zero gaps**

Run: `pnpm dlx tsx packages/game-engine/scripts/generateTriviaSeed.ts 30`
Expected: `gaps: 0`, exit 0, `supabase/seed/trivia_questions.sql` regenerated.

- [ ] **Step 5: Validate the generated seed**

Run:
```bash
cd ~/Desktop/Football\ Project/Idea3_WorldCup2026_Game && python3 - <<'PY'
import re, collections
sql = open("supabase/seed/trivia_questions.sql").read()
rows = re.findall(r"\('(\d{4}-\d{2}-\d{2})', (\d), .*?'([A-Z]{3})'\)", sql)
byday = collections.defaultdict(list)
for date, order, nation in rows:
    byday[date].append((int(order), nation))
bad = []
for date, items in byday.items():
    nations = [n for _, n in items]
    orders = sorted(o for o, _ in items)
    if len(items) != 3 or len(set(nations)) != 3 or orders != [1,2,3]:
        bad.append((date, items))
print("days:", len(byday), "| violations:", len(bad))
for d, items in bad[:10]:
    print("  BAD", d, items)
PY
```
Expected: `violations: 0`.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/trivia-gap-fill-suggestions.md packages/game-engine/src/trivia/pool/worldCupTriviaPool.ts supabase/seed/trivia_questions.sql
git commit -m "feat(trivia): close coverage gaps; regenerate 3/day distinct-nation seed"
```

---

## Task 10: Index exports + final verification

**Files:**
- Modify: `packages/game-engine/src/index.ts` (export the new public API)

- [ ] **Step 1: Export the new modules**

In `packages/game-engine/src/index.ts`, add:
```ts
export * from "./trivia/selectDailyQuestions";
export * from "./trivia/generateTriviaSchedule";
export * from "./trivia/worldCup2026";
```

- [ ] **Step 2: Run all trivia tests + typecheck**

Run:
```bash
cd ~/Desktop/Football\ Project/Idea3_WorldCup2026_Game
for f in seededRandom selectDailyQuestions generateTriviaSchedule scoreTriviaDay; do
  pnpm dlx tsx packages/game-engine/src/trivia/$f.test.ts || exit 1
done
pnpm --filter @gogaffa/game-engine --filter @gogaffa/config --filter @gogaffa/types typecheck 2>&1 | tail -5
echo "ALL TRIVIA TESTS + TYPECHECK PASS"
```
Expected: each test prints `ALL PASS`, typecheck clean, final line prints.

- [ ] **Step 3: Commit**

```bash
git add packages/game-engine/src/index.ts
git commit -m "chore(trivia): export daily-rules selector/generator from game-engine"
```

---

## Notes for follow-up (not in this plan)
- Applying the migration/seed to the remote DB (`supabase db push`) and coordinating the PR with Donaven.
- A weekly/scheduled re-run of the generator so the rolling horizon stays populated.
- Expanding the pool beyond the starter set.
