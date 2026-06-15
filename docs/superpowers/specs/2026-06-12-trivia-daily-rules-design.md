# Daily Trivia Rules — Design

**Date:** 2026-06-12
**Status:** Approved (design)
**Branch:** `feature/trivia-daily-rules` off `feature/points-system-rewrite`.

## Goal

Enforce four product rules on GoGaffa's daily trivia:
1. **3 questions per day** (currently 5 in config; scoring engine is already 3-based).
2. **The 3 daily questions must each be about a different nation** (no two share a `nation_code`).
3. **Only nations in the 2026 World Cup** may appear.
4. **Randomize** which questions appear each day (deterministic per date, shared by all users), and **regenerate any day after today** that violates the rules.

Plus: a **coverage report** that lists any future day that cannot be filled with 3
distinct WC-2026 nations, and **drafted new questions** to close those gaps.

## Current-state facts (confirmed 2026-06-12)
- `trivia_questions` schema already has `nation_code text references nations(code)` and
  `unique(active_date, question_order)`. The pilot seed sets `nation_code = null` for all
  questions and repeats the **same 5** questions for 30 days via
  `generate_series(current_date, current_date + 29 days)`.
- Scoring is **already 3-based**: `TRIVIA_QUESTION_TIERS = [50,100,200]` (Q1/Q2/Q3),
  `TRIVIA_ALL_THREE_COMBO_BONUS`, and `scoreTriviaDay.ts`. `questionsPerDay: 5` in
  `packages/config/src/xpRules.ts` is **stale legacy**; only `scoreTriviaAttempt.ts`
  (older path) and `trivia_attempts.total_questions` default still imply 5.
- Nations are seeded in `supabase/seed/nations.sql` (code, name, flag_emoji,
  confederation, colors). No "in World Cup" flag exists.
- Client reads `trivia_questions` by `active_date` via
  `apps/mobile/src/features/trivia/api/trivia.ts → getDailyTriviaQuestions`. The edge
  function `score-trivia-attempt` scores a day.

## Decisions (locked in brainstorming)
- **Count:** 3/day, including the scoring internals/defaults that still say 5.
- **Country basis:** each question tagged with its subject `nation_code`; the daily 3
  must have 3 distinct `nation_code`s.
- **WC-2026 set:** add `in_world_cup_2026 boolean` to `nations`; flag the qualified teams.
  The 48-team list is **drafted here and verified by the user** before commit.
- **Randomize:** deterministic daily selection from a tagged pool (same for all users on a
  given date; varies day to day).
- **Architecture:** materialized-seed (keep the client querying `trivia_questions` by
  date; selection happens at generation time). Runtime-RPC selection was rejected as a
  larger, harder-to-test change for no benefit.
- **Unfillable days:** the generator **errors loudly** (strict mode) rather than silently
  relaxing a rule, and emits a coverage report.

## Architecture

A tested TypeScript selector materializes a daily schedule into `trivia_questions`. The
mobile app and edge function are unchanged.

### Components

1. **DB migration** (`supabase/migrations/00000X_trivia_daily_rules.sql`)
   - `alter table public.nations add column in_world_cup_2026 boolean not null default false;`
   - `alter table public.trivia_attempts alter column total_questions set default 3;`
   - `nation_code` stays nullable (back-compat with existing/pilot rows).

2. **WC-2026 flagging** (`supabase/seed/nations.sql` update)
   - Set `in_world_cup_2026 = true` for the 48 qualified nations. The list is drafted in
     this spec's companion (Implementation Task) and **must be user-verified**. Any
     qualified nation not already in `nations` is added.

3. **3/day config**
   - `packages/config/src/xpRules.ts`: `questionsPerDay: 5 → 3`.
   - Align the edge function's `TRIVIA_DAILY_QUESTION_COUNT` to 3 (verify value).
   - The 3-based tiers/combo/streak logic is unchanged.

4. **Question pool** (`packages/game-engine/src/trivia/pool/` data module — reviewable)
   - A structured list of factual questions, each: `{ id, nationCode, question,
     answerOptions[4], correctAnswerKey, explanation, difficulty }`.
   - **WC-2026 nations only**, **no FIFA/World-Cup marks or logos** (per the App Store IP
     fix — factual content about countries is fine).
   - **Drafted as a starter pool here; user reviews.** Sized to field 3 distinct nations
     per day across the generation horizon (see selector + gap report).

5. **Selector** (`packages/game-engine/src/trivia/selectDailyQuestions.ts`, pure + tested)
   - `selectDailyQuestions(pool, isoDate, count = 3): PooledQuestion[]`
   - Deterministic: seed a PRNG from `isoDate` so the pick is reproducible and identical
     for all users that day.
   - Guarantees (hard rules — never relaxed): exactly `count` questions; all distinct
     `nationCode`; all `nationCode` flagged WC-2026.
   - Variety preference (soft): avoid reusing a question already scheduled earlier in the
     same horizon; spread nation coverage.
   - On inability to satisfy the hard rules for a date → throws a typed
     `InsufficientPoolError` carrying the date and the reason (e.g. "only 2 distinct
     WC-2026 nations with an unused question available").

6. **Schedule generator** (`packages/game-engine/.../generateTriviaSchedule.ts` + a runnable
   script, e.g. `pnpm trivia:generate`)
   - Inputs: the pool, the WC-2026 nation set, a horizon (default **30 days**, matching the
     current seed), and `today`.
   - For each date in `(today, today + horizon]` it calls the selector, accumulating used
     questions for the variety constraint.
   - **Leaves `active_date <= today` untouched** (rule 4 "after today"; also protects FK
     references from any existing `trivia_attempt_answers`).
   - **Report mode:** instead of throwing on the first gap, collects ALL unfillable days
     and prints a **coverage report**: per under-supplied date, the reason and which
     nations are short; plus a summary (total days, fillable, gap count, thin nations).
   - **Strict mode:** if any gap exists, exits non-zero (so a rule-violating schedule is
     never committed).
   - **Emit:** on success, writes the materialized schedule to
     `supabase/seed/trivia_questions.sql` (regenerated for future days), upserting on
     `(active_date, question_order)`.

7. **Gap-fill question suggestions** (deliverable, not committed to the seed unreviewed)
   - When the report finds thin nations/days, **draft new candidate questions** for those
     nations (same format as the pool) in a review file
     `docs/superpowers/specs/trivia-gap-fill-suggestions.md`, for the user to approve and
     fold into the pool.

## Data flow
```
nations.in_world_cup_2026  ─┐
question pool (TS data) ────┤→ selectDailyQuestions(date) ─→ generateTriviaSchedule
                            │        (deterministic, distinct-nation, WC-only)
today ──────────────────────┘                    │
                                                  ├─ report: unfillable days + thin nations
                                                  └─ emit: trivia_questions.sql (active_date > today)
                                                            │
                            mobile app getDailyTriviaQuestions(active_date)  ◀── unchanged
```

## Error handling
- Selector throws `InsufficientPoolError(date, reason)` when hard rules can't be met.
- Generator strict mode aborts (non-zero) if any gap exists; report mode lists all gaps.
- A pool question referencing a non-WC or unknown `nationCode` → generation error (fail fast).
- Past/today schedule rows are never modified.

## Testing (TDD)
- **Selector unit tests:** distinct `nationCode` in the 3 picks; all picks WC-2026;
  deterministic for a fixed date (same input → same output); count honored;
  `InsufficientPoolError` thrown when <3 distinct WC nations are available; variety
  (no within-horizon repeat while supply allows).
- **Generator tests:** future-only materialization (today/past untouched); full coverage
  report lists exactly the unfillable days for a deliberately thin pool; strict mode exits
  non-zero on a gap.
- **Scoring regression:** existing `scoreTriviaDay` tests pass at 3; `scoreTriviaAttempt`
  "completed daily" XP uses 3.
- **Seed validation:** generated `trivia_questions.sql` has, for every future day, exactly
  3 rows with 3 distinct WC-2026 `nation_code`s and orders 1–3.

## Out of scope
- Per-user randomization (breaks shared daily leaderboard/streak).
- Runtime RPC/edge selection (materialized-seed chosen).
- A full content library (starter pool + gap-fill suggestions only).
- The App Store IP cleanup (separate `feature/ip-cleanup` effort).
- Windows tooling.

## Open items the user must confirm
1. The **48-team WC-2026 list** (drafted at implementation; user verifies).
2. The **generation horizon** (default 30 days — matches current seed).
