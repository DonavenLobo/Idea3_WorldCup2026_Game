# Points System Rewrite — PR-A Design

Status: **Approved verbally — finalizing for plan-writing**
Author: Denver (with Claude)
Last updated: June 8, 2026
Target branch: `feature/points-system-rewrite` (off `app_build/version_0`)
Companion PRD: `Football Project/GoGaffa Points System for Lockerroom & Leaderboard.pdf`
Sister PR (deferred): PR-B will implement Card Stat Progression per `Football Project/Footballer Card Stat Progression.pdf` after this lands.

## Why

The existing point economy mixes 5-question trivia with a binary correct/speed-bonus scheme. The new PRD reshapes it around three pillars:

1. **Trivia** as the daily habit — rebalanced DOWN with a streak multiplier to reward repeat play
2. **Bracket** as the high-stakes marquee — doubling-ladder + champion bonus + per-upset bonus
3. **Login + milestones** as the floor — small but real, plus rare big chests for sticking around the full tournament

Total expected point budgets (per PRD):
- Casual (~50% acc, 40–50% seconds): ~4,350
- Moderate (daily, ~70%): ~14,000–15,400
- Max-engaged (all 39 days): ~24,000–25,500

## Sequencing constraint

PR #20 (trivia content seed + tier scoring at Q1=100/Q2=150/Q3=200) must merge **first**. This PR then rebalances trivia DOWN to PRD values (Q1=50/Q2=100/Q3=200, timers 15s/20s/30s, all-3 combo, streak multiplier).

If PR #20 hasn't merged when this PR is ready, rebase after.

## Locked design decisions

1. **Scope split**: this PR ships the points economy ONLY. Card stat earning + display + multipliers ship in PR-B.
2. **`profiles.competitive_points` not stored** — total is derived from `SUM(trivia_attempts.competitive_points) + SUM(brackets.score)`. Leaderboards read the sum at query time. No denormalized cache column.
3. **Login claim timing**: first foreground per **calendar day** (UTC). Subsequent foregrounds the same day no-op.
4. **Late-joiner forfeit**: milestone chests (day 7/14/30/39) are tied to actually completing those days. Joining on day 25 doesn't backpay days 7 and 14. PRD explicit: "calibrated for fairness."
5. **Streak reset on any missed calendar day**. No "streak freeze" (paid revival) in v1.
6. **Login streak ≠ Trivia streak** — two independent counters:
   - `login_streak`: advances on any daily login. Powers Hype gains in PR-B (display only here).
   - `trivia_streak`: advances only on **all-3-correct days** (per PRD "Perfect Trivia Run"). Powers the trivia × multiplier.
7. **Upset definition**: picking the lower-FIFA-ranked team in a knockout match where they win. FIFA rankings frozen at first kickoff (June 11). Stored once in a seed/config; the per-match upset eligibility evaluated server-side.
8. **Milestone chest claim**: auto-claimed at the next login that crosses the threshold. No manual claim button v1.
9. **Trophy Room cosmetic** (Perfect Knockout): boolean flag on profile, no visual yet. Visual lands in a separate cosmetics PR.

## Scoring spec (the locked values)

### Trivia (per day, replaces current scoring)

| Position | Difficulty | Base pts | Timer | Max speed multiplier | Max single-q |
|---|---|---|---|---|---|
| Q1 | Easy | 50 | 15s | × time-bonus | up to **~100** |
| Q2 | Medium | 100 | 20s | × time-bonus | up to **~200** |
| Q3 | Hard | 200 | 30s | × time-bonus | up to **~400** |
| **All-3 combo** | — | +60 | — | — | +60 |

**Speed bonus formula** — ⚠️ PRD ambiguity to resolve at plan-writing time:
- PRD literal: `multiplier = 1 − response_time / (timer × 2)` → range 1.0 (instant) to 0.0 (very slow). Floor = 0.5 at exactly `timer`.
- PRD "max single-q ~100 for Q1=50" implies a 2× ceiling, contradicting the formula above.
- **Resolution proposed**: total = `base × (2 − response_time / (timer × 2))` — range 2.0 (instant) to 1.0 (exactly at `timer`) to 0 (after `2 × timer`). This satisfies the "max ~100" claim while preserving the formula shape. Plan will lock this in and add unit tests.
- Clamp `response_time > timer * 2` to 0 multiplier (no negative scoring).

**Trivia streak multiplier** (applied to trivia per-day TOTAL — sum of 3 Q's + combo bonus):
| Trivia-streak day | Multiplier |
|---|---|
| 1–6 | ×1.00 |
| 7–13 | ×1.10 |
| 14–20 | ×1.20 |
| 21+ | ×1.30 (cap) |

Streak advances **only on all-3-correct days**; partial-correct day keeps the streak from advancing but doesn't reset (the streak counter for trivia is "perfect days in a row").

**Perfect Trivia Run bonus**: ≥30 perfect trivia days → +1,500 (one-time, only redeemable at end-of-tournament).

### Bracket (full rebalance)

Group stage (locked at first kickoff June 11):
- Correct group finishing position (1st–4th, 48 slots): **30 each** → max 1,440
- Perfect group bonus (all 4 positions exact in a single group, 12 groups): **+120 each** → max 1,440
- Correct best-third-place qualifier (8 slots): **+25 each** → max 200
- Group subtotal max: **3,080**

Knockout doubling ladder:
- R32 (16 matches): **40 each** → max 640
- R16 (8 matches): **80 each** → max 640
- QF (4 matches): **160 each** → max 640
- SF (2 matches): **320 each** → max 640
- Final (1 match): **640** → max 640
- Knockout subtotal max: **3,200**

Champion bonus: **+800** for correct champion (single locked pick, big stakes).

Per-upset bonus: **+50% of round value** for each correct upset (lower-FIFA-ranked team wins). E.g., correctly picking a Round of 32 upset = 40 base + 20 bonus = 60.

Bracket grand-total ceiling (no upsets): **7,080**.

### Login + milestones

| Action | Points | Frequency |
|---|---|---|
| Daily login (flat) | +25 | 1× per UTC calendar day |
| Day-7 milestone chest | +100 | once |
| Day-14 milestone chest | +300 | once |
| Day-30 milestone chest | +600 | once |
| Day-39 Full-Tournament Attendance | +1,000 | once |
| **Login subtotal max** | **~3,025** | |

### Perfect runs (end-of-tournament one-shots)

| Bonus | Points | Eligibility |
|---|---|---|
| Perfect Trivia Run | +1,500 | ≥30 perfect-correct trivia days |
| Perfect Knockout Run | +2,500 | All 31 knockout picks correct (also flags Trophy Room cosmetic boolean) |

## Data model changes

### New tables

```sql
-- 000029_login_events.sql
create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- calendar day in UTC; one row per user per day
  login_date date not null,
  -- streak the user was on AFTER recording this login (1, 2, ...)
  streak_at_login integer not null check (streak_at_login >= 1),
  -- competitive points awarded at this login (25 flat + milestone bonus if applicable)
  points_awarded integer not null default 0,
  -- which milestone chest was unlocked at this login, if any
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
```

### Profile extensions

```sql
-- 000030_profile_streak_columns.sql
alter table public.profiles
  add column if not exists current_login_streak integer not null default 0,
  add column if not exists longest_login_streak integer not null default 0,
  add column if not exists current_trivia_streak integer not null default 0,
  add column if not exists longest_trivia_streak integer not null default 0,
  add column if not exists last_login_date date,
  add column if not exists perfect_knockout_run boolean not null default false;
```

Note: trivia streak data is *derivable* from `trivia_attempts` joined per day, but caching on the profile makes the multiplier lookup cheap during scoring (no aggregation query per trivia submission). Same for login_streak (derivable from `login_events` but cached for fast UI display).

### No new bracket scorer table — score lives in `brackets.score`

The PRD assumes the existing `brackets.score` integer column holds the computed total. The edge function that scores brackets (or an SQL function/trigger — to be decided in the plan) updates this column after each save. Leaderboards continue to read it directly.

## Edge functions

### `claim-daily-login` (NEW)

POST endpoint, called by client on first foreground per calendar day.

Logic:
1. Read user's `last_login_date` and `current_login_streak`.
2. Compute `today_utc = current_date in UTC`.
3. If `last_login_date == today_utc`, no-op (already claimed today).
4. If `last_login_date == yesterday_utc`, increment streak by 1.
5. Otherwise, reset streak to 1.
6. Compute points: base 25 + milestone bonus if `streak == 7|14|30|39`.
7. Update profile: `last_login_date`, `current_login_streak`, `longest_login_streak = max(longest, current)`.
8. Insert `login_events` row.
9. Return `{ pointsAwarded, streak, milestoneUnlocked }` for client display.

### `score-trivia-attempt` (MODIFY)

Replace scoring with PRD values + streak multiplier:
1. Compute per-question points = base × time-bonus per the PRD formula.
2. If all 3 correct, add +60 combo.
3. Read `profiles.current_trivia_streak`:
   - If all 3 correct in this attempt, the streak BECOMES `current_trivia_streak + 1` (or 1 if reset).
   - If not all 3 correct, the streak stays where it was (does not reset, does not advance).
4. Apply streak multiplier from the new streak value: ×1.0 / 1.1 / 1.2 / 1.3.
5. Save attempt, update profile streak counters.

### `score-bracket` (NEW or extend existing submit-bracket)

After each `submit-bracket` save (or upon match results landing — but results ingest is not in this PR), recompute `brackets.score` based on the value matrix. v1: scorer runs on every save with whatever match results exist (likely 0 until results PR ships, so score stays 0 for the duration of this PR's life — the structure is in place).

We will write the scorer as a pure function in `packages/game-engine/src/bracket/scoreBracket.ts` so it's testable. The edge function calls it.

## Client changes

| Component | Change |
|---|---|
| `useDailyLogin` hook (NEW) | Calls `claim-daily-login` on app foreground; debounced 1×/day. Exposes streak + last-claimed for UI. |
| `LoginStreakBadge` (NEW) | Tiny chip showing current login streak; lives in profile header or home tab |
| Trivia tier chips | Update displayed base values to 50/100/200 from 100/150/200 |
| Trivia "Done" screen | Add streak multiplier breakdown ("×1.20 = +18 streak bonus") |
| Milestone chest unlock animation | Modal that pops on first foreground after threshold crossed (uses `useDailyLogin` response) |
| Leaderboard | No change needed — already reads the derived sum |

## Open / risk items

- **Match results ingest**: bracket scoring will mostly compute zero until match results are populated in `public.matches` (currently `status='scheduled'` everywhere). The bracket scorer's logic is in place but real values won't materialize until a separate ingest PR. This is fine — the structure ships now, fills with data when results land.
- **Streak edge cases**: time-zone shenanigans. PRD doesn't specify TZ. Choosing UTC for date boundaries means a user in NYC who plays at 11pm ET (4am UTC) crosses days in the middle of an evening. Acceptable but worth noting. Documented in `claim-daily-login` edge function.
- **Migration order vs PR #20**: PR #20 uses 000026–000028. This PR uses 000029+. If PR #20 lands first (expected), order is clean. If this PR somehow lands first, PR #20 needs to bump.

## Out of scope (explicitly deferred)

- Card stat earning (PDF #1, PR-B)
- Stat-based multipliers (PR-B + later)
- Trophy Room cosmetic visual (separate cosmetics PR)
- Match results ingest / live scoring (separate results PR)
- Streak-freeze IAP / paid revival (per PRD, not in MVP)
- Locker Room currency economy validation (PR-B touches stats and locker tiers)

## Rollout

1. PR #20 merges (trivia content + initial 3-tier scoring).
2. Open this PR (`feature/points-system-rewrite`) against `app_build/version_0`.
3. Donaven reviews.
4. On merge: migrations apply (login_events + profile columns), edge functions redeploy.
5. PR-B (Card Stats) starts.
