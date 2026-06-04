# Bracket Phased Lockout — Implementation Plan (Revised June 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-03-bracket-phased-lockout-design.md` (see the **Revision Note — June 4** at the top of that doc; it supersedes contradictory sections below it)

**Goal:** Split the bracket flow into Phase 1 (group rankings, locks per-group at first kickoff) and Phase 2 (knockouts, locks per-match at kickoff) so users get two rounds of engagement instead of one, with proper lockout enforcement and late-joiner handling.

**Architecture (post-revision):** A new Supabase `public.matches` table is the single source of truth for fixture data. The client fetches it once per session via `useFixtures()` and caches in memory. The `submit-bracket` edge function queries the same table directly to validate writes. Lock state is *derived* at runtime from fixtures + server clock — no persisted lock columns, no TS-vs-SQL fixture duplication, no parity script.

**Tech Stack:** React Native + Expo SDK 54, Expo Router, Supabase (PostgreSQL + Edge Functions in Deno), pnpm monorepo, TypeScript strict, `expo-notifications`, `react-native-async-storage`.

**Branch:** `feature/bracket-phased-lockout` (already created off `main`, with spec commits `597fa85`, `403e948` and prior-plan commit `c6a57fe` to be superseded by this revision)

**Deadline:** Land before **June 11, 2026** (first World Cup kickoff). Today is June 4. **7 days.**

---

## What changed from the prior plan (commit c6a57fe)

| Prior plan | This revised plan |
|---|---|
| `packages/config/src/fixtures.ts` (44 timestamps as TS constants) | Dropped — fixtures live in Supabase |
| `supabase/functions/submit-bracket/fixtures.ts` (mirror copy) | Dropped — edge function queries DB |
| `scripts/verify-fixtures.ts` (parity check) | Dropped — no duplication to verify |
| Migration `000020_bracket_phased_locks.sql` | Renumbered `000021`; new `000020` creates+seeds `matches` |
| `useBracketLockState` derives from imported constants | Now derives from `useFixtures()` async data |
| (no new hook) | NEW: `useFixtures()` Supabase fetch + memory cache |
| (no schedule UI work) | NEW: minimal schedule tab list view (bonus) |

The fixture data we ship to seed `matches` covers the 44 lockable units (12 group first kickoffs + 32 knockout kickoffs) — exactly what the bracket lockout needs. The remaining 60 group games (matchdays 2 and 3 across all 12 groups) are deferred to a separate PR that backfills the seed; they do not affect lockout and are not required for the schedule tab's MVP list view to work (it just shows fewer rows until the backfill ships).

---

## File structure

### New files

| Path | Purpose | Owner |
|---|---|---|
| `supabase/migrations/000020_matches_table.sql` | Create `public.matches` + seed 44 lockable kickoffs | Task 1 |
| `supabase/migrations/000021_bracket_phased_locks.sql` | Drop binary RLS, add unique index, expose `get_server_time()` | Task 8 |
| `apps/mobile/src/features/bracket/lib/computeBracketLockState.ts` | Pure derivation: `(now, fixtures) → BracketLockState` | Task 3 |
| `apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts` | Unit tests for the pure function | Task 4 |
| `apps/mobile/src/features/bracket/hooks/useTournamentClock.ts` | Server-time hook with device fallback | Task 5 |
| `apps/mobile/src/features/bracket/hooks/useFixtures.ts` | Supabase fetch + cache for `matches` rows | Task 6 |
| `apps/mobile/src/features/bracket/hooks/useBracketLockState.ts` | Reactive lock-state hook (composes the above) | Task 7 |
| `supabase/functions/submit-bracket/validateFixtures.ts` | Pull kickoffs from `matches`; reject locked-pick changes | Task 9 |
| `supabase/functions/submit-bracket/validateFixtures.test.ts` | Deno tests for validation logic | Task 10 |
| `apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx` | Top-of-page phase status card | Task 13 |
| `apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx` | Dismissible "joined late" banner | Task 14 |
| `apps/mobile/src/features/bracket/notifications.ts` | June 27 reminder scheduler | Task 21 |

### Modified files

| Path | Change | Owner |
|---|---|---|
| `supabase/functions/submit-bracket/index.ts` | Plug in fixture validation + groupId support + partial-save error shape | Task 9 |
| `apps/mobile/src/features/bracket/api/brackets.ts` | Surface `PICK_PAST_LOCKOUT` as a typed error; accept `groupId` arg | Task 11 |
| `apps/mobile/src/features/bracket/types.ts` | Add lock-state types + `PickPastLockoutError` | Task 11 |
| `apps/mobile/src/features/bracket/BracketContext.tsx` | Expose `isGroupLocked`/`isMatchLocked`; partial-save retry; `groupId` plumbing; schedule reminder | Tasks 12, 22 |
| `apps/mobile/src/features/bracket/components/SubTabBar.tsx` | Lock icons + Phase 2 eyebrow | Task 15 |
| `apps/mobile/src/features/bracket/components/GroupPicker.tsx` | Locked-state rendering + dual CTA on last group | Task 16 |
| `apps/mobile/src/features/bracket/components/KnockoutRound.tsx` | Locked-state rendering | Task 17 |
| `apps/mobile/src/features/bracket/components/BracketSummary.tsx` | Phase-aware copy + partial-save warning | Task 18 |
| `apps/mobile/app/(tabs)/bracket.tsx` | Mount `PhaseHeroCard` + `LateJoinerBanner` | Task 19 |
| `apps/mobile/app/(tabs)/schedule.tsx` | Replace placeholder with minimal match list | Task 20 |

---

## Task 0: Verify branch state

- [ ] **Step 1: Confirm we're on the right branch with a clean tree**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
git status
git log --oneline -4
```

Expected: branch `feature/bracket-phased-lockout`, three docs commits at the tip (the spec + revision + prior plan). Working tree clean (the orphan `fixtures.ts` and `index.ts` change should already have been removed/reverted by the controller before kicking off this plan).

- [ ] **Step 2: Make sure deps are installed**

```bash
pnpm install
```

Expected: completes without errors.

- [ ] **Step 3: Typecheck baseline**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

---

## Task 1: Migration `000020_matches_table.sql` — create + seed `matches`

**Files:**
- Create: `supabase/migrations/000020_matches_table.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/000020_matches_table.sql
-- Canonical World Cup match data. Source of truth for bracket lockout and
-- the schedule tab. This PR seeds the 44 LOCKABLE units (12 group first
-- kickoffs + 32 knockout matches). Remaining 60 group games (matchdays
-- 2 and 3 across all 12 groups) come in a follow-up PR.
--
-- All kickoffs sourced June 3, 2026 from:
--   - ESPN:     https://www.espn.com/soccer/story/_/id/48939282/...
--   - Wikipedia: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
-- ET kickoff times (EDT = UTC-4 in June/July) converted to UTC.
-- ⚠️ Sources disagreed on the Final (3pm vs 7pm ET) and 3rd-place;
-- we used Wikipedia. Re-verify against fifa.com before merging.

create table if not exists public.matches (
  id text primary key,                              -- "M01"..."M104"
  round text not null check (round in ('group','r32','r16','qf','sf','third','final')),
  group_id text check (group_id ~ '^[A-L]$'),       -- NULL for knockouts
  bracket_index integer check (bracket_index >= 0), -- NULL for group; 0..N-1 for knockouts within a round
  home_team_code text,                              -- NULL until known (knockouts depend on group results)
  away_team_code text,
  kickoff timestamptz not null,
  venue text,
  status text not null default 'scheduled'
    check (status in ('scheduled','live','completed')),
  home_score integer,
  away_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Per-row consistency: group rows have group_id but no bracket_index;
  -- knockout rows have bracket_index but no group_id.
  constraint matches_round_keys check (
    (round = 'group' and group_id is not null and bracket_index is null)
    or (round <> 'group' and group_id is null and bracket_index is not null)
  )
);

-- Helpful indices for the access patterns we use
create index if not exists matches_round_kickoff_idx on public.matches (round, kickoff);
create index if not exists matches_group_kickoff_idx on public.matches (group_id, kickoff) where group_id is not null;

alter table public.matches enable row level security;

-- Everyone authenticated can read. No write policy — only the service role
-- (used by edge functions) can mutate. Future PRs that ingest live scores
-- will go through an admin edge function or a scheduled job.
create policy "Authenticated read matches"
  on public.matches for select
  to authenticated
  using (true);

-- Seed: 12 group first kickoffs.
-- We synthesize a stable id per group ("G-A-1" = Group A first match) so the
-- backfill PR can add G-A-2 and G-A-3 without touching the row primary key.
insert into public.matches (id, round, group_id, bracket_index, home_team_code, away_team_code, kickoff, venue, status)
values
  ('G-A-1', 'group', 'A', null, 'MEX', 'RSA', '2026-06-11T19:00:00Z', 'Estadio Azteca, Mexico City', 'scheduled'),
  ('G-B-1', 'group', 'B', null, 'CAN', 'BIH', '2026-06-12T19:00:00Z', 'BMO Field, Toronto',         'scheduled'),
  ('G-C-1', 'group', 'C', null, 'BRA', 'MAR', '2026-06-13T22:00:00Z', 'MetLife Stadium, NY/NJ',     'scheduled'),
  ('G-D-1', 'group', 'D', null, 'USA', 'PAR', '2026-06-13T01:00:00Z', 'SoFi Stadium, Los Angeles',  'scheduled'),
  ('G-E-1', 'group', 'E', null, 'GER', 'CUW', '2026-06-14T17:00:00Z', 'TBD',                        'scheduled'),
  ('G-F-1', 'group', 'F', null, 'NED', 'JPN', '2026-06-14T20:00:00Z', 'TBD',                        'scheduled'),
  ('G-G-1', 'group', 'G', null, 'BEL', 'EGY', '2026-06-15T22:00:00Z', 'TBD',                        'scheduled'),
  ('G-H-1', 'group', 'H', null, 'ESP', 'CPV', '2026-06-15T17:00:00Z', 'TBD',                        'scheduled'),
  ('G-I-1', 'group', 'I', null, 'FRA', 'SEN', '2026-06-16T19:00:00Z', 'TBD',                        'scheduled'),
  ('G-J-1', 'group', 'J', null, 'ARG', 'ALG', '2026-06-17T01:00:00Z', 'TBD',                        'scheduled'),
  ('G-K-1', 'group', 'K', null, 'POR', 'COD', '2026-06-17T17:00:00Z', 'TBD',                        'scheduled'),
  ('G-L-1', 'group', 'L', null, 'ENG', 'CRO', '2026-06-17T20:00:00Z', 'TBD',                        'scheduled')
on conflict (id) do update set
  round = excluded.round, group_id = excluded.group_id, bracket_index = excluded.bracket_index,
  home_team_code = excluded.home_team_code, away_team_code = excluded.away_team_code,
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status,
  updated_at = now();

-- Seed: 16 Round of 32 matches
insert into public.matches (id, round, group_id, bracket_index, home_team_code, away_team_code, kickoff, venue, status)
values
  ('K-R32-1',  'r32', null,  0, null, null, '2026-06-28T19:00:00Z', 'SoFi Stadium, Los Angeles',      'scheduled'),
  ('K-R32-2',  'r32', null,  1, null, null, '2026-06-29T17:00:00Z', 'NRG Stadium, Houston',           'scheduled'),
  ('K-R32-3',  'r32', null,  2, null, null, '2026-06-29T20:30:00Z', 'Gillette Stadium, Boston',       'scheduled'),
  ('K-R32-4',  'r32', null,  3, null, null, '2026-06-30T01:00:00Z', 'Estadio BBVA, Monterrey',        'scheduled'),
  ('K-R32-5',  'r32', null,  4, null, null, '2026-06-30T17:00:00Z', 'AT&T Stadium, Dallas',           'scheduled'),
  ('K-R32-6',  'r32', null,  5, null, null, '2026-06-30T21:00:00Z', 'MetLife Stadium, NY/NJ',         'scheduled'),
  ('K-R32-7',  'r32', null,  6, null, null, '2026-07-01T01:00:00Z', 'Estadio Azteca, Mexico City',    'scheduled'),
  ('K-R32-8',  'r32', null,  7, null, null, '2026-07-01T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'),
  ('K-R32-9',  'r32', null,  8, null, null, '2026-07-01T20:00:00Z', 'Lumen Field, Seattle',           'scheduled'),
  ('K-R32-10', 'r32', null,  9, null, null, '2026-07-02T00:00:00Z', "Levi's Stadium, San Francisco",  'scheduled'),
  ('K-R32-11', 'r32', null, 10, null, null, '2026-07-02T19:00:00Z', 'SoFi Stadium, Los Angeles',      'scheduled'),
  ('K-R32-12', 'r32', null, 11, null, null, '2026-07-02T23:00:00Z', 'BMO Field, Toronto',             'scheduled'),
  ('K-R32-13', 'r32', null, 12, null, null, '2026-07-03T03:00:00Z', 'BC Place, Vancouver',            'scheduled'),
  ('K-R32-14', 'r32', null, 13, null, null, '2026-07-03T18:00:00Z', 'AT&T Stadium, Dallas',           'scheduled'),
  ('K-R32-15', 'r32', null, 14, null, null, '2026-07-03T22:00:00Z', 'Hard Rock Stadium, Miami',       'scheduled'),
  ('K-R32-16', 'r32', null, 15, null, null, '2026-07-04T01:30:00Z', 'Arrowhead Stadium, Kansas City', 'scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: 8 Round of 16 matches
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-R16-1', 'r16', null, 0, '2026-07-04T19:00:00Z', 'NRG Stadium, Houston',                 'scheduled'),
  ('K-R16-2', 'r16', null, 1, '2026-07-05T00:00:00Z', 'Lincoln Financial Field, Philadelphia','scheduled'),
  ('K-R16-3', 'r16', null, 2, '2026-07-05T23:00:00Z', 'Estadio Azteca, Mexico City',          'scheduled'),
  ('K-R16-4', 'r16', null, 3, '2026-07-06T00:00:00Z', 'MetLife Stadium, NY/NJ',               'scheduled'),
  ('K-R16-5', 'r16', null, 4, '2026-07-06T23:00:00Z', 'AT&T Stadium, Dallas',                 'scheduled'),
  ('K-R16-6', 'r16', null, 5, '2026-07-07T00:00:00Z', 'Lumen Field, Seattle',                 'scheduled'),
  ('K-R16-7', 'r16', null, 6, '2026-07-07T20:00:00Z', 'Mercedes-Benz Stadium, Atlanta',       'scheduled'),
  ('K-R16-8', 'r16', null, 7, '2026-07-07T20:00:00Z', 'BC Place, Vancouver',                  'scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: 4 Quarterfinals
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-QF-1', 'qf', null, 0, '2026-07-10T00:00:00Z', 'Gillette Stadium, Foxborough',  'scheduled'),
  ('K-QF-2', 'qf', null, 1, '2026-07-10T19:00:00Z', 'SoFi Stadium, Inglewood',       'scheduled'),
  ('K-QF-3', 'qf', null, 2, '2026-07-12T01:00:00Z', 'Hard Rock Stadium, Miami',      'scheduled'),
  ('K-QF-4', 'qf', null, 3, '2026-07-12T01:00:00Z', 'Arrowhead Stadium, Kansas City','scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: 2 Semifinals
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-SF-1', 'sf', null, 0, '2026-07-14T23:00:00Z', 'AT&T Stadium, Dallas',         'scheduled'),
  ('K-SF-2', 'sf', null, 1, '2026-07-15T23:00:00Z', 'Mercedes-Benz Stadium, Atlanta','scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: Third + Final
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-3RD-1',   'third', null, 0, '2026-07-19T01:00:00Z', 'Hard Rock Stadium, Miami', 'scheduled'),
  ('K-FINAL-1', 'final', null, 0, '2026-07-19T23:00:00Z', 'MetLife Stadium, NY/NJ',   'scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();
```

- [ ] **Step 2: Apply locally (if you have a local Supabase running)**

```bash
supabase db reset
```

Expected: migration runs without errors.

If you do NOT have a local Supabase instance, skip this step. The CI/staging deploy will surface any errors. Move to the test step.

- [ ] **Step 3: Sanity-query (optional, if local Supabase available)**

```bash
supabase db psql -c "select round, count(*) from public.matches group by round order by round;"
```

Expected:
```
 round | count
-------+-------
 final |     1
 group |    12
 qf    |     4
 r16   |     8
 r32   |    16
 sf    |     2
 third |     1
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/000020_matches_table.sql
git commit -m "feat(supabase): add public.matches table + seed 44 lockable kickoffs"
```

---

## Task 2: Migration smoke test — verify the seeded counts

**Files:**
- Create: `supabase/tests/matches_counts.sql`

- [ ] **Step 1: Write a small SQL assertion script**

```sql
-- supabase/tests/matches_counts.sql
-- Run with: supabase db psql -f supabase/tests/matches_counts.sql
-- Exits non-zero if any assertion fails.

do $$
declare
  total int;
  groups int;
  r32 int;
  r16 int;
  qf int;
  sf int;
  third int;
  final int;
begin
  select count(*) into total from public.matches;
  if total <> 44 then
    raise exception 'Expected 44 total matches, got %', total;
  end if;

  select count(*) into groups from public.matches where round = 'group';
  if groups <> 12 then
    raise exception 'Expected 12 group first kickoffs, got %', groups;
  end if;

  select count(*) into r32 from public.matches where round = 'r32';
  if r32 <> 16 then
    raise exception 'Expected 16 R32 matches, got %', r32;
  end if;

  select count(*) into r16 from public.matches where round = 'r16';
  if r16 <> 8 then
    raise exception 'Expected 8 R16 matches, got %', r16;
  end if;

  select count(*) into qf from public.matches where round = 'qf';
  if qf <> 4 then
    raise exception 'Expected 4 QF matches, got %', qf;
  end if;

  select count(*) into sf from public.matches where round = 'sf';
  if sf <> 2 then
    raise exception 'Expected 2 SF matches, got %', sf;
  end if;

  select count(*) into third from public.matches where round = 'third';
  if third <> 1 then
    raise exception 'Expected 1 third-place match, got %', third;
  end if;

  select count(*) into final from public.matches where round = 'final';
  if final <> 1 then
    raise exception 'Expected 1 final, got %', final;
  end if;

  -- bracket_index uniqueness within a knockout round
  if exists (
    select 1 from public.matches
     where round <> 'group'
     group by round, bracket_index
     having count(*) > 1
  ) then
    raise exception 'Duplicate bracket_index within a knockout round';
  end if;

  -- every group has exactly one first-kickoff row
  if exists (
    select 1 from public.matches
     where round = 'group'
     group by group_id
     having count(*) <> 1
  ) then
    raise exception 'Some group has zero or multiple first-kickoff rows';
  end if;

  raise notice '✓ matches table: all assertions passed';
end$$;
```

- [ ] **Step 2: Run it (if local Supabase available)**

```bash
supabase db psql -f supabase/tests/matches_counts.sql
```

Expected: `NOTICE: ✓ matches table: all assertions passed`.

If you don't have local Supabase, defer — this is documentation for the staging deploy + manual smoke test.

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/matches_counts.sql
git commit -m "test(supabase): assert public.matches seed counts after migration 000020"
```

---

## Task 3: Pure derivation function `computeBracketLockState`

Pure function. Takes `now` and the fixture data the client already loaded. No async, no React, no global imports of fixture constants.

**Files:**
- Create: `apps/mobile/src/features/bracket/lib/computeBracketLockState.ts`

- [ ] **Step 1: Write the function**

```ts
// apps/mobile/src/features/bracket/lib/computeBracketLockState.ts
import { GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";

export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export type TournamentPhase =
  | "pre"             // No group has kicked off yet
  | "phase1-closing"  // Some groups locked, some open
  | "between"         // All groups locked, no knockout match kicked off
  | "phase2-closing"  // Some knockouts locked, some open
  | "complete";       // Everything locked

/** Lockout-relevant fixture data. Produced by useFixtures() at runtime. */
export interface FixtureData {
  /** First-kickoff per group, as a Date. */
  groupFirstKickoffs: Record<GroupId, Date>;
  /** Every knockout match, with its kickoff and bracket position. */
  knockouts: Array<{ round: KnockoutRoundId; index: number; kickoff: Date }>;
}

export interface BracketLockState {
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  phase: TournamentPhase;
  nextLockAt: Date | null;
  nextLockLabel: string | null;
}

function roundLabel(round: KnockoutRoundId): string {
  switch (round) {
    case "r32":   return "R32";
    case "r16":   return "R16";
    case "qf":    return "QF";
    case "sf":    return "SF";
    case "final": return "Final";
    case "third": return "3rd-place";
  }
}

/** Pure: derive BracketLockState from (now, fixtures). */
export function computeBracketLockState(
  now: Date,
  fixtures: FixtureData
): BracketLockState {
  const nowMs = now.getTime();

  const groupKickoffMs = new Map<GroupId, number>();
  for (const g of GROUP_IDS) {
    const d = fixtures.groupFirstKickoffs[g];
    if (d) groupKickoffMs.set(g, d.getTime());
  }

  const knockoutKickoffMs = new Map<string, number>();
  for (const k of fixtures.knockouts) {
    knockoutKickoffMs.set(`${k.round}:${k.index}`, k.kickoff.getTime());
  }

  const isGroupLocked = (group: GroupId): boolean => {
    const k = groupKickoffMs.get(group);
    return k !== undefined && nowMs >= k;
  };

  const isMatchLocked = (round: KnockoutRoundId, index: number): boolean => {
    const k = knockoutKickoffMs.get(`${round}:${index}`);
    return k !== undefined && nowMs >= k;
  };

  // Find the next lockable unit (soonest future kickoff, group or knockout)
  let soonestGroupKickoff = Infinity;
  let soonestGroupId: GroupId | null = null;
  for (const g of GROUP_IDS) {
    const k = groupKickoffMs.get(g);
    if (k !== undefined && nowMs < k && k < soonestGroupKickoff) {
      soonestGroupKickoff = k;
      soonestGroupId = g;
    }
  }

  let soonestKnockoutKickoff = Infinity;
  let soonestKnockoutLabel: string | null = null;
  for (const k of fixtures.knockouts) {
    const ms = k.kickoff.getTime();
    if (nowMs < ms && ms < soonestKnockoutKickoff) {
      soonestKnockoutKickoff = ms;
      soonestKnockoutLabel = `${roundLabel(k.round)} #${k.index + 1}`;
    }
  }

  let nextLockAt: Date | null = null;
  let nextLockLabel: string | null = null;
  if (soonestGroupKickoff < Infinity && soonestGroupKickoff < soonestKnockoutKickoff) {
    nextLockAt = new Date(soonestGroupKickoff);
    nextLockLabel = `Group ${soonestGroupId}`;
  } else if (soonestKnockoutKickoff < Infinity) {
    nextLockAt = new Date(soonestKnockoutKickoff);
    nextLockLabel = soonestKnockoutLabel;
  }

  const anyGroupLocked = GROUP_IDS.some(isGroupLocked);
  const allGroupsLocked = GROUP_IDS.every(isGroupLocked);
  const anyKnockoutLocked = fixtures.knockouts.some((k) =>
    isMatchLocked(k.round, k.index)
  );
  const allKnockoutsLocked =
    fixtures.knockouts.length > 0 &&
    fixtures.knockouts.every((k) => isMatchLocked(k.round, k.index));

  let phase: TournamentPhase;
  if (!anyGroupLocked) {
    phase = "pre";
  } else if (!allGroupsLocked) {
    phase = "phase1-closing";
  } else if (!anyKnockoutLocked) {
    phase = "between";
  } else if (!allKnockoutsLocked) {
    phase = "phase2-closing";
  } else {
    phase = "complete";
  }

  return { isGroupLocked, isMatchLocked, phase, nextLockAt, nextLockLabel };
}

export type { GroupId };
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/lib/computeBracketLockState.ts
git commit -m "feat(bracket): pure computeBracketLockState derivation function"
```

---

## Task 4: Tests for `computeBracketLockState`

**Files:**
- Create: `apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts`

- [ ] **Step 1: Write the test file**

```ts
// apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
//
// Run with: pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
// Throws on failure, prints "OK" on success.

import { computeBracketLockState, type FixtureData } from "./computeBracketLockState";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const at = (iso: string) => new Date(iso);

// A reasonable subset of real World Cup kickoffs for testing
const fixtures: FixtureData = {
  groupFirstKickoffs: {
    A: at("2026-06-11T19:00:00Z"),
    B: at("2026-06-12T19:00:00Z"),
    C: at("2026-06-13T22:00:00Z"),
    D: at("2026-06-13T01:00:00Z"),
    E: at("2026-06-14T17:00:00Z"),
    F: at("2026-06-14T20:00:00Z"),
    G: at("2026-06-15T22:00:00Z"),
    H: at("2026-06-15T17:00:00Z"),
    I: at("2026-06-16T19:00:00Z"),
    J: at("2026-06-17T01:00:00Z"),
    K: at("2026-06-17T17:00:00Z"),
    L: at("2026-06-17T20:00:00Z")
  },
  knockouts: [
    { round: "r32",   index: 0,  kickoff: at("2026-06-28T19:00:00Z") },
    { round: "r32",   index: 1,  kickoff: at("2026-06-29T17:00:00Z") },
    { round: "r32",   index: 6,  kickoff: at("2026-07-01T01:00:00Z") },
    { round: "r32",   index: 7,  kickoff: at("2026-07-01T16:00:00Z") },
    { round: "r16",   index: 0,  kickoff: at("2026-07-04T19:00:00Z") },
    { round: "qf",    index: 0,  kickoff: at("2026-07-10T00:00:00Z") },
    { round: "sf",    index: 0,  kickoff: at("2026-07-14T23:00:00Z") },
    { round: "third", index: 0,  kickoff: at("2026-07-19T01:00:00Z") },
    { round: "final", index: 0,  kickoff: at("2026-07-19T23:00:00Z") }
  ]
};

// --- Phase: "pre" (before any group kickoff) ---
{
  const s = computeBracketLockState(at("2026-06-01T00:00:00Z"), fixtures);
  assert(s.phase === "pre", `expected pre, got ${s.phase}`);
  assert(!s.isGroupLocked("A"), "Group A should be unlocked");
  assert(!s.isMatchLocked("r32", 0), "R32 #0 should be unlocked");
  assert(s.nextLockLabel === "Group A", `nextLockLabel was ${s.nextLockLabel}`);
}

// --- Phase: "phase1-closing" (some groups locked, some not) ---
{
  // June 14 18:00 UTC: A, B, D, C, E locked; F and later not.
  const s = computeBracketLockState(at("2026-06-14T18:00:00Z"), fixtures);
  assert(s.phase === "phase1-closing", `expected phase1-closing, got ${s.phase}`);
  assert(s.isGroupLocked("A"), "Group A should be locked");
  assert(s.isGroupLocked("E"), "Group E should be locked");
  assert(!s.isGroupLocked("F"), "Group F should NOT be locked");
  assert(!s.isMatchLocked("r32", 0), "R32 #0 should still be unlocked");
  assert(s.nextLockLabel === "Group F", `nextLockLabel was ${s.nextLockLabel}`);
}

// --- Phase: "between" (all groups locked, no knockout kickoff yet) ---
{
  const s = computeBracketLockState(at("2026-06-27T23:59:00Z"), fixtures);
  assert(s.phase === "between", `expected between, got ${s.phase}`);
  for (const g of ["A","B","C","D","E","F","G","H","I","J","K","L"] as const) {
    assert(s.isGroupLocked(g), `Group ${g} should be locked`);
  }
  assert(!s.isMatchLocked("r32", 0), "R32 #0 should not be locked yet");
  assert(s.nextLockLabel === "R32 #1", `nextLockLabel was ${s.nextLockLabel}`);
}

// --- Phase: "phase2-closing" (some knockouts locked) ---
{
  // July 1 12:00 UTC: r32 #0, #1, #6 locked; #7 (16:00) not.
  const s = computeBracketLockState(at("2026-07-01T12:00:00Z"), fixtures);
  assert(s.phase === "phase2-closing", `expected phase2-closing, got ${s.phase}`);
  assert(s.isMatchLocked("r32", 0), "R32 #0 should be locked");
  assert(s.isMatchLocked("r32", 6), "R32 #6 should be locked");
  assert(!s.isMatchLocked("r32", 7), "R32 #7 should NOT be locked");
  assert(!s.isMatchLocked("final", 0), "Final should NOT be locked");
}

// --- Phase: "complete" (everything locked) ---
{
  const s = computeBracketLockState(at("2026-08-01T00:00:00Z"), fixtures);
  assert(s.phase === "complete", `expected complete, got ${s.phase}`);
  assert(s.isGroupLocked("A"), "Group A should be locked");
  assert(s.isMatchLocked("final", 0), "Final should be locked");
  assert(s.nextLockAt === null, "nextLockAt should be null when everything locked");
}

// --- Boundary: exactly at kickoff ---
{
  const s = computeBracketLockState(at("2026-06-11T19:00:00Z"), fixtures);
  assert(s.isGroupLocked("A"), "Group A should be locked at exact kickoff moment");
}

// --- Boundary: 1ms before kickoff ---
{
  const s = computeBracketLockState(at("2026-06-11T18:59:59.999Z"), fixtures);
  assert(!s.isGroupLocked("A"), "Group A should NOT be locked 1ms before kickoff");
}

// --- Empty knockouts (still loading): degenerates gracefully ---
{
  const empty: FixtureData = { groupFirstKickoffs: fixtures.groupFirstKickoffs, knockouts: [] };
  const s = computeBracketLockState(at("2026-08-01T00:00:00Z"), empty);
  // All groups locked + no knockouts → "between" (we never reach phase2-closing or complete without knockouts)
  assert(s.phase === "between", `expected between when knockouts empty, got ${s.phase}`);
  assert(!s.isMatchLocked("r32", 0), "isMatchLocked returns false for absent fixture");
}

console.log("OK: all computeBracketLockState assertions passed");
```

- [ ] **Step 2: Run the test**

```bash
pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
```

Expected: `OK: all computeBracketLockState assertions passed`. If any assertion fails, fix the source — never the test.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
git commit -m "test(bracket): phase-by-phase coverage for computeBracketLockState"
```

---

## Task 5: `useTournamentClock` hook

Reads server time from Supabase, falls back to device clock if the call fails.

**Files:**
- Create: `apps/mobile/src/features/bracket/hooks/useTournamentClock.ts`

- [ ] **Step 1: Write the hook**

```ts
// apps/mobile/src/features/bracket/hooks/useTournamentClock.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

const POLL_INTERVAL_MS = 60_000;
const MAX_FAILURES = 2;

export interface TournamentClock {
  /** Best estimate of server "now". Reactive — re-emitted every 60s. */
  now: Date;
  /** True if we're falling back to device clock. */
  isUsingFallback: boolean;
}

/**
 * Fetch server time from Supabase periodically. Derive `now` as
 * `Date.now() + offset` so the clock advances smoothly between polls without
 * needing a 1Hz timer.
 *
 * `get_server_time()` RPC is added in migration 000021. Until that ships,
 * the hook stays in fallback mode silently.
 */
export function useTournamentClock(): TournamentClock {
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const failureCountRef = useRef(0);
  // Force re-renders so countdowns tick down without each consumer wiring a 1Hz timer.
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchServerNow = async () => {
      try {
        const { data, error } = await supabase.rpc("get_server_time");
        if (error) throw error;
        const serverMs =
          typeof data === "number"
            ? data * 1000
            : new Date(String(data)).getTime();
        if (cancelled || !Number.isFinite(serverMs)) return;
        setOffsetMs(serverMs - Date.now());
        setIsUsingFallback(false);
        failureCountRef.current = 0;
      } catch {
        failureCountRef.current += 1;
        if (failureCountRef.current >= MAX_FAILURES && !cancelled) {
          setIsUsingFallback(true);
        }
      }
    };

    void fetchServerNow();
    const interval = setInterval(() => {
      void fetchServerNow();
      setTick((t) => t + 1);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    now: new Date(Date.now() + offsetMs),
    isUsingFallback
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/hooks/useTournamentClock.ts
git commit -m "feat(bracket): useTournamentClock hook with server-time fetch + device fallback"
```

---

## Task 6: `useFixtures` hook — fetch `matches` and cache

Async hook that fetches the matches table once per session, derives the lockout-shaped data, and caches in module-level memory so re-renders don't re-fetch.

**Files:**
- Create: `apps/mobile/src/features/bracket/hooks/useFixtures.ts`

- [ ] **Step 1: Write the hook**

```ts
// apps/mobile/src/features/bracket/hooks/useFixtures.ts
import { useEffect, useState } from "react";
import { GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { supabase } from "../../../lib/supabase";
import type {
  FixtureData,
  KnockoutRoundId
} from "../lib/computeBracketLockState";

interface UseFixturesResult {
  fixtures: FixtureData | null;
  isLoading: boolean;
  error: Error | null;
}

interface MatchRow {
  id: string;
  round: string;
  group_id: string | null;
  bracket_index: number | null;
  kickoff: string;
}

// Module-level cache. Reset only on app restart. The fixture data is static
// for the duration of the tournament — no need to invalidate.
let cachedFixtures: FixtureData | null = null;
let cachedFetchPromise: Promise<FixtureData> | null = null;

const KNOCKOUT_ROUNDS: ReadonlySet<KnockoutRoundId> = new Set([
  "r32", "r16", "qf", "sf", "final", "third"
]);

function isKnockoutRound(r: string): r is KnockoutRoundId {
  return KNOCKOUT_ROUNDS.has(r as KnockoutRoundId);
}

function isGroupId(g: string): g is GroupId {
  return (GROUP_IDS as readonly string[]).includes(g);
}

async function fetchFixturesFromSupabase(): Promise<FixtureData> {
  const { data, error } = await supabase
    .from("matches")
    .select("id,round,group_id,bracket_index,kickoff");

  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];

  const groupFirstKickoffs: Partial<Record<GroupId, Date>> = {};
  const knockouts: FixtureData["knockouts"] = [];

  for (const row of rows) {
    if (row.round === "group") {
      if (!row.group_id || !isGroupId(row.group_id)) continue;
      const candidate = new Date(row.kickoff);
      const existing = groupFirstKickoffs[row.group_id];
      // If there are multiple group rows per group (backfill PR), keep the earliest
      if (!existing || candidate.getTime() < existing.getTime()) {
        groupFirstKickoffs[row.group_id] = candidate;
      }
    } else if (isKnockoutRound(row.round) && row.bracket_index !== null) {
      knockouts.push({
        round: row.round,
        index: row.bracket_index,
        kickoff: new Date(row.kickoff)
      });
    }
  }

  // Sanity: every group must have a first kickoff
  for (const g of GROUP_IDS) {
    if (!groupFirstKickoffs[g]) {
      throw new Error(`Missing fixture for Group ${g}. Seed migration may be out of date.`);
    }
  }

  return {
    groupFirstKickoffs: groupFirstKickoffs as Record<GroupId, Date>,
    knockouts
  };
}

export function useFixtures(): UseFixturesResult {
  const [fixtures, setFixtures] = useState<FixtureData | null>(cachedFixtures);
  const [isLoading, setIsLoading] = useState<boolean>(cachedFixtures === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedFixtures) {
      setFixtures(cachedFixtures);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    if (!cachedFetchPromise) {
      cachedFetchPromise = fetchFixturesFromSupabase()
        .then((result) => {
          cachedFixtures = result;
          return result;
        })
        .catch((err) => {
          cachedFetchPromise = null; // allow retry next mount
          throw err;
        });
    }

    cachedFetchPromise
      .then((result) => {
        if (cancelled) return;
        setFixtures(result);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { fixtures, isLoading, error };
}

/** Test helper — reset the module cache between tests. Not exported in production. */
export function __resetFixturesCacheForTesting(): void {
  cachedFixtures = null;
  cachedFetchPromise = null;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/hooks/useFixtures.ts
git commit -m "feat(bracket): useFixtures hook fetches matches table and caches"
```

---

## Task 7: `useBracketLockState` hook — compose clock + fixtures

**Files:**
- Create: `apps/mobile/src/features/bracket/hooks/useBracketLockState.ts`

- [ ] **Step 1: Write the hook**

```ts
// apps/mobile/src/features/bracket/hooks/useBracketLockState.ts
import { useMemo } from "react";
import { computeBracketLockState, type BracketLockState } from "../lib/computeBracketLockState";
import { useTournamentClock } from "./useTournamentClock";
import { useFixtures } from "./useFixtures";

export interface UseBracketLockState extends BracketLockState {
  /** True until the matches table finishes loading. UI should treat as "all unlocked". */
  isLoading: boolean;
  /** True when the server clock is unreachable. Surface a warning banner. */
  isClockFallback: boolean;
  /** Error from the fixtures fetch, if any. */
  error: Error | null;
}

const PERMISSIVE_PRE_LOAD_STATE: BracketLockState = {
  isGroupLocked: () => false,
  isMatchLocked: () => false,
  phase: "pre",
  nextLockAt: null,
  nextLockLabel: null
};

export function useBracketLockState(): UseBracketLockState {
  const { now, isUsingFallback } = useTournamentClock();
  const { fixtures, isLoading, error } = useFixtures();

  // Bucket `now` to 5-second granularity so the memo key changes at most every
  // 5s instead of every render. Sub-5s precision doesn't matter for hour-scale countdowns.
  const bucketedNowMs = Math.floor(now.getTime() / 5000) * 5000;

  const lockState = useMemo(() => {
    if (!fixtures) return PERMISSIVE_PRE_LOAD_STATE;
    return computeBracketLockState(new Date(bucketedNowMs), fixtures);
  }, [bucketedNowMs, fixtures]);

  return { ...lockState, isLoading, isClockFallback: isUsingFallback, error };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/hooks/useBracketLockState.ts
git commit -m "feat(bracket): useBracketLockState composes clock + fixtures"
```

---

## Task 8: Migration `000021_bracket_phased_locks.sql`

**Files:**
- Create: `supabase/migrations/000021_bracket_phased_locks.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/000021_bracket_phased_locks.sql
-- Phased bracket lockout enforcement. Writes go through the submit-bracket
-- edge function (which validates each pick against public.matches kickoffs).
-- Add a unique constraint so the edge function can rely on at-most-one
-- (user_id, group_id) bracket row. Expose a tiny get_server_time() RPC.

-- 1. Drop the binary lock policy. The `locked_at` COLUMN stays (nullable, unused).
drop policy if exists "Users can update unlocked own brackets" on public.brackets;

-- 2. Block all direct UPDATEs to brackets. Force everything through the edge
--    function, which uses the service role to write past RLS.
create policy "No direct bracket updates"
  on public.brackets for update
  to authenticated
  using (false);

-- 3. Unique constraint on (user_id, group_id) with NULLS NOT DISTINCT so the
--    edge function can rely on "one personal bracket + one bracket per group"
--    per user. Postgres 15+ syntax (Supabase uses 15+).
create unique index if not exists brackets_user_group_unique
  on public.brackets (user_id, group_id)
  nulls not distinct;

-- 4. Tiny RPC so the client can fetch a single authoritative timestamp.
create or replace function public.get_server_time()
  returns timestamptz
  language sql
  stable
  security definer
  set search_path = public
as $$
  select now();
$$;

grant execute on function public.get_server_time() to anon, authenticated;
```

- [ ] **Step 2: Apply locally (if available)**

```bash
supabase db reset
supabase db psql -c "select public.get_server_time();"
```

Expected: a single timestamp row.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/000021_bracket_phased_locks.sql
git commit -m "feat(supabase): migration 000021 — drop binary lock, add bracket unique index, expose get_server_time"
```

---

## Task 9: Add fixture validation to `submit-bracket` edge function

The edge function now queries `public.matches` directly (no fixture mirror file), compares saved picks vs new payload, and rejects changes to picks whose kickoff has passed.

**Files:**
- Create: `supabase/functions/submit-bracket/validateFixtures.ts`
- Modify: `supabase/functions/submit-bracket/index.ts`

- [ ] **Step 1: Create the validation module**

```ts
// supabase/functions/submit-bracket/validateFixtures.ts
//
// Loads kickoff data on demand from public.matches and validates that
// every CHANGED pick targets a unit whose kickoff is still in the future.

import { createClient } from "npm:@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient>;

export type GroupId = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L";
export type KnockoutRoundId = "r32"|"r16"|"qf"|"sf"|"final"|"third";

export interface BracketPicksPayload {
  groupRankings: Record<string, string[]>;
  picks: {
    r32: Record<string, string>;
    r16: Record<string, string>;
    qf: Record<string, string>;
    sf: Record<string, string>;
    final: string | null;
    third: string | null;
  };
}

export interface FixtureValidationResult {
  invalidGroups: string[];
  invalidMatches: Array<{ round: KnockoutRoundId; index: number }>;
}

interface MatchRow {
  round: string;
  group_id: string | null;
  bracket_index: number | null;
  kickoff: string;
}

/** Pull just the kickoff data we need from public.matches. */
export async function loadKickoffMaps(supabase: SupabaseClient): Promise<{
  groupKickoffMs: Map<string, number>;
  knockoutKickoffMs: Map<string, number>;
}> {
  const { data, error } = await supabase
    .from("matches")
    .select("round,group_id,bracket_index,kickoff");

  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];
  const groupKickoffMs = new Map<string, number>();
  const knockoutKickoffMs = new Map<string, number>();

  for (const r of rows) {
    const ms = new Date(r.kickoff).getTime();
    if (r.round === "group" && r.group_id) {
      const existing = groupKickoffMs.get(r.group_id);
      if (existing === undefined || ms < existing) {
        groupKickoffMs.set(r.group_id, ms);
      }
    } else if (r.bracket_index !== null) {
      knockoutKickoffMs.set(`${r.round}:${r.bracket_index}`, ms);
    }
  }

  return { groupKickoffMs, knockoutKickoffMs };
}

/**
 * Compare `next` picks against `existing`. Any pick whose value CHANGES and
 * whose corresponding fixture has already kicked off is invalid.
 * Untouched picks pass even on locked units.
 */
export function validateBracketAgainstFixtures(
  nowMs: number,
  next: BracketPicksPayload,
  existing: BracketPicksPayload | null,
  groupKickoffMs: Map<string, number>,
  knockoutKickoffMs: Map<string, number>
): FixtureValidationResult {
  const invalidGroups: string[] = [];
  const invalidMatches: Array<{ round: KnockoutRoundId; index: number }> = [];

  for (const [g, ranking] of Object.entries(next.groupRankings)) {
    const kickoff = groupKickoffMs.get(g);
    if (kickoff === undefined) continue;
    if (nowMs < kickoff) continue;
    const prev = existing?.groupRankings?.[g];
    if (!arraysEqual(prev, ranking)) {
      invalidGroups.push(g);
    }
  }

  for (const round of ["r32", "r16", "qf", "sf"] as const) {
    const nextRound = next.picks[round] ?? {};
    const prevRound = existing?.picks?.[round] ?? {};
    for (const [indexStr, teamCode] of Object.entries(nextRound)) {
      const index = Number(indexStr);
      const kickoff = knockoutKickoffMs.get(`${round}:${index}`);
      if (kickoff === undefined) continue;
      if (nowMs < kickoff) continue;
      if (prevRound[indexStr] !== teamCode) {
        invalidMatches.push({ round, index });
      }
    }
  }

  if (next.picks.final !== (existing?.picks?.final ?? null)) {
    const k = knockoutKickoffMs.get("final:0");
    if (k !== undefined && nowMs >= k) invalidMatches.push({ round: "final", index: 0 });
  }

  if (next.picks.third !== (existing?.picks?.third ?? null)) {
    const k = knockoutKickoffMs.get("third:0");
    if (k !== undefined && nowMs >= k) invalidMatches.push({ round: "third", index: 0 });
  }

  return { invalidGroups, invalidMatches };
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
```

- [ ] **Step 2: Plug validation into the edge function**

Open `supabase/functions/submit-bracket/index.ts`. Apply these changes:

**a) Add imports near the top** (after the existing imports):

```ts
import {
  loadKickoffMaps,
  validateBracketAgainstFixtures,
  type BracketPicksPayload
} from "./validateFixtures.ts";
```

**b) Add a group-membership check helper after `mapBracket`:**

```ts
async function isGroupMember(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
```

**c) Add the existing-picks fetcher helper above `Deno.serve`:**

```ts
async function fetchExistingPicks(
  supabase: ReturnType<typeof createClient>,
  bracketId: string
): Promise<BracketPicksPayload | null> {
  const { data, error } = await supabase
    .from("brackets")
    .select("picks")
    .eq("id", bracketId)
    .maybeSingle<{ picks: unknown }>();
  if (error) throw error;
  if (!data) return null;
  return data.picks as BracketPicksPayload;
}
```

**d) Inside the `Deno.serve` handler, AFTER the existing-bracket fetch and BEFORE the existing `existingBracket?.locked_at` check**, insert:

```ts
    // Group bracket: confirm membership before allowing the write.
    if (input.groupId) {
      const isMember = await isGroupMember(supabase, input.groupId, userData.user.id);
      if (!isMember) {
        return jsonResponse({ ok: false, code: "NOT_GROUP_MEMBER" });
      }
    }

    // Fixture validation: any CHANGED pick on a passed-kickoff unit is rejected.
    const [existingPicks, kickoffMaps] = await Promise.all([
      existingBracket ? fetchExistingPicks(supabase, existingBracket.id) : Promise.resolve(null),
      loadKickoffMaps(supabase)
    ]);

    const validation = validateBracketAgainstFixtures(
      Date.now(),
      input.picks as BracketPicksPayload,
      existingPicks,
      kickoffMaps.groupKickoffMs,
      kickoffMaps.knockoutKickoffMs
    );

    if (validation.invalidGroups.length > 0 || validation.invalidMatches.length > 0) {
      return jsonResponse({
        ok: false,
        code: "PICK_PAST_LOCKOUT",
        invalidGroups: validation.invalidGroups,
        invalidMatches: validation.invalidMatches
      });
    }
```

**e) Remove the binary `existingBracket?.locked_at` check** — replace:

```ts
    if (existingBracket?.locked_at) {
      return jsonResponse({ error: "This bracket is locked and can no longer be changed." }, 409);
    }
```

with a comment:

```ts
    // (Binary `locked_at` check removed — phased lockout is enforced by
    // validateBracketAgainstFixtures above. The locked_at column remains
    // nullable on the table but is no longer consulted.)
```

**f) Wrap the final success response.** Find:

```ts
    return jsonResponse({ bracket: mapBracket(savedBracket) });
```

Replace with:

```ts
    return jsonResponse({ ok: true, bracket: mapBracket(savedBracket) });
```

- [ ] **Step 3: Local syntax check (requires Deno)**

```bash
deno check supabase/functions/submit-bracket/index.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/submit-bracket/validateFixtures.ts \
        supabase/functions/submit-bracket/index.ts
git commit -m "feat(edge): submit-bracket validates picks against public.matches kickoffs"
```

---

## Task 10: Tests for edge function validation logic

**Files:**
- Create: `supabase/functions/submit-bracket/validateFixtures.test.ts`

- [ ] **Step 1: Write the test file**

```ts
// supabase/functions/submit-bracket/validateFixtures.test.ts
// Run with: deno test supabase/functions/submit-bracket/validateFixtures.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateBracketAgainstFixtures,
  type BracketPicksPayload
} from "./validateFixtures.ts";

const emptyPicks: BracketPicksPayload = {
  groupRankings: {},
  picks: { r32: {}, r16: {}, qf: {}, sf: {}, final: null, third: null }
};

function picks(overrides: Partial<BracketPicksPayload>): BracketPicksPayload {
  return {
    groupRankings: { ...emptyPicks.groupRankings, ...overrides.groupRankings },
    picks: { ...emptyPicks.picks, ...overrides.picks }
  };
}

// Fixture kickoffs that mirror the seed migration (subset for test)
const groupKickoffMs = new Map<string, number>([
  ["A", new Date("2026-06-11T19:00:00Z").getTime()],
  ["F", new Date("2026-06-14T20:00:00Z").getTime()]
]);

const knockoutKickoffMs = new Map<string, number>([
  ["r32:0",   new Date("2026-06-28T19:00:00Z").getTime()],
  ["final:0", new Date("2026-07-19T23:00:00Z").getTime()]
]);

const beforeAnyKickoff = new Date("2026-06-01T00:00:00Z").getTime();
const afterGroupA = new Date("2026-06-12T00:00:00Z").getTime();
const afterFirstR32 = new Date("2026-06-29T00:00:00Z").getTime();
const afterFinal = new Date("2026-07-20T00:00:00Z").getTime();

Deno.test("before any kickoff: all changes accepted", () => {
  const result = validateBracketAgainstFixtures(
    beforeAnyKickoff,
    picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } }),
    null,
    groupKickoffMs,
    knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, []);
  assertEquals(result.invalidMatches, []);
});

Deno.test("changing locked group is rejected", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["RSA", "MEX", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(
    afterGroupA, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, ["A"]);
});

Deno.test("identical pick on locked group is accepted (no-op)", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(
    afterGroupA, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, []);
});

Deno.test("changing unlocked group is accepted even after another group locked", () => {
  const existing = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"], F: ["NED", "JPN", "X", "Y"] }
  });
  const next = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"], F: ["JPN", "NED", "X", "Y"] }
  });

  const result = validateBracketAgainstFixtures(
    afterGroupA, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, []);
});

Deno.test("changing locked knockout match is rejected", () => {
  const existing = picks({ picks: { ...emptyPicks.picks, r32: { 0: "BRA" } } });
  const next = picks({ picks: { ...emptyPicks.picks, r32: { 0: "ARG" } } });

  const result = validateBracketAgainstFixtures(
    afterFirstR32, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidMatches, [{ round: "r32", index: 0 }]);
});

Deno.test("first-time save of a locked unit IS rejected (no existing value)", () => {
  const next = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(
    afterGroupA, next, null, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, ["A"]);
});

Deno.test("changing locked final pick is rejected", () => {
  const existing = picks({ picks: { ...emptyPicks.picks, final: "BRA" } });
  const next = picks({ picks: { ...emptyPicks.picks, final: "ARG" } });

  const result = validateBracketAgainstFixtures(
    afterFinal, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidMatches, [{ round: "final", index: 0 }]);
});

Deno.test("empty maps: nothing is rejected", () => {
  const next = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const result = validateBracketAgainstFixtures(
    afterGroupA, next, null, new Map(), new Map()
  );
  assertEquals(result.invalidGroups, []);
  assertEquals(result.invalidMatches, []);
});
```

- [ ] **Step 2: Run the tests (requires Deno)**

```bash
deno test supabase/functions/submit-bracket/validateFixtures.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/submit-bracket/validateFixtures.test.ts
git commit -m "test(edge): cover validateBracketAgainstFixtures lock semantics"
```

---

## Task 11: Update brackets API to surface `PICK_PAST_LOCKOUT`

**Files:**
- Modify: `apps/mobile/src/features/bracket/api/brackets.ts`
- Modify: `apps/mobile/src/features/bracket/types.ts`

- [ ] **Step 1: Add the error type to `types.ts`**

Open `apps/mobile/src/features/bracket/types.ts`. Append at the bottom:

```ts
import type { KnockoutRoundId } from "../lib/computeBracketLockState";

export interface PickPastLockoutDetails {
  invalidGroups: string[];
  invalidMatches: Array<{ round: KnockoutRoundId; index: number }>;
}

export class PickPastLockoutError extends Error {
  public readonly invalidGroups: string[];
  public readonly invalidMatches: Array<{ round: KnockoutRoundId; index: number }>;

  constructor(details: PickPastLockoutDetails) {
    super("Some picks are past lockout");
    this.name = "PickPastLockoutError";
    this.invalidGroups = details.invalidGroups;
    this.invalidMatches = details.invalidMatches;
  }
}

export class NotGroupMemberError extends Error {
  constructor() {
    super("Not a member of this group");
    this.name = "NotGroupMemberError";
  }
}
```

- [ ] **Step 2: Update the API to parse the new shape**

Open `apps/mobile/src/features/bracket/api/brackets.ts`. Replace the entire `submitCurrentBracket` function with:

```ts
import {
  PickPastLockoutError,
  NotGroupMemberError,
  type PickPastLockoutDetails
} from "../types";

interface SubmitBracketResponse {
  ok?: boolean;
  bracket?: SavedBracket;
  code?: "PICK_PAST_LOCKOUT" | "NOT_GROUP_MEMBER";
  invalidGroups?: string[];
  invalidMatches?: Array<{ round: string; index: number }>;
  error?: string;
}

export async function submitCurrentBracket(
  picks: PersistedBracketPicks,
  groupId: string | null = null
): Promise<SavedBracket> {
  const { data, error } = await supabase.functions.invoke<SubmitBracketResponse>(
    "submit-bracket",
    { body: { groupId, picks } }
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Bracket save returned no data.");
  }

  if (data.code === "PICK_PAST_LOCKOUT") {
    throw new PickPastLockoutError({
      invalidGroups: data.invalidGroups ?? [],
      invalidMatches: (data.invalidMatches ?? []) as PickPastLockoutDetails["invalidMatches"]
    });
  }

  if (data.code === "NOT_GROUP_MEMBER") {
    throw new NotGroupMemberError();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.bracket) {
    throw new Error("Bracket save did not return a saved bracket.");
  }

  return data.bracket;
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/bracket/api/brackets.ts \
        apps/mobile/src/features/bracket/types.ts
git commit -m "feat(bracket): brackets API surfaces PICK_PAST_LOCKOUT + groupId support"
```

---

## Task 12: Extend `BracketContext` — lock helpers + partial-save retry + groupId

**Files:**
- Modify: `apps/mobile/src/features/bracket/BracketContext.tsx`

- [ ] **Step 1: Wire in the lock-state hook, groupId prop, helpers, and retry**

Apply these changes to `BracketContext.tsx`:

**a) Add imports near the top:**

```ts
import { useBracketLockState } from "./hooks/useBracketLockState";
import type { GroupId, KnockoutRoundId } from "./lib/computeBracketLockState";
import { PickPastLockoutError } from "./types";
```

**b) Extend `BracketProvider` props to accept an optional `groupId`:**

```tsx
interface BracketProviderProps {
  groupId?: string | null;
  children: React.ReactNode;
}

export function BracketProvider({ groupId = null, children }: BracketProviderProps) {
```

**c) Inside the provider body, call the hook:**

```ts
  const lockState = useBracketLockState();
```

**d) Extend the `BracketContextValue` interface:**

```ts
interface BracketContextValue extends BracketState {
  // ...existing fields...
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  isClockFallback: boolean;
  phase: ReturnType<typeof useBracketLockState>["phase"];
  nextLockAt: Date | null;
  nextLockLabel: string | null;
  fixturesLoading: boolean;
}
```

**e) Replace `saveBracket` with the partial-save-aware version:**

```ts
  const saveBracket = useCallback(async () => {
    if (!user) {
      setSaveError(new Error("Sign in to save your bracket."));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const persisted: PersistedBracketPicks = { groupRankings, picks };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setLastSavedAt(saved.updatedAt);
    } catch (err) {
      if (err instanceof PickPastLockoutError) {
        const fresh = await getCurrentBracket();
        const revertedRankings = { ...groupRankings };
        for (const g of err.invalidGroups as GroupId[]) {
          if (fresh?.picks.groupRankings[g]) {
            revertedRankings[g] = fresh.picks.groupRankings[g];
          }
        }
        const revertedPicks: BracketPicks = { ...picks };
        for (const m of err.invalidMatches) {
          if (m.round === "final") {
            revertedPicks.final = fresh?.picks.picks.final ?? null;
          } else if (m.round === "third") {
            revertedPicks.third = fresh?.picks.picks.third ?? null;
          } else {
            const round = m.round as PickRound;
            const prev = fresh?.picks.picks[round]?.[m.index];
            if (prev !== undefined) {
              revertedPicks[round] = { ...revertedPicks[round], [m.index]: prev };
            } else {
              const next = { ...revertedPicks[round] };
              delete next[m.index];
              revertedPicks[round] = next;
            }
          }
        }

        setGroupRankings(revertedRankings);
        setPicks(revertedPicks);

        try {
          const retried = await submitCurrentBracket(
            { groupRankings: revertedRankings, picks: revertedPicks },
            groupId
          );
          setLastSavedAt(retried.updatedAt);
          setSaveError(
            new Error("Some picks were locked while editing — your other picks saved.")
          );
        } catch (retryErr) {
          setSaveError(retryErr instanceof Error ? retryErr : new Error(String(retryErr)));
        }
      } else {
        setSaveError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsSaving(false);
    }
  }, [groupRankings, picks, user, groupId]);
```

**f) Extend the `value` object passed to `<BracketContext.Provider>`:**

```ts
  const value: BracketContextValue = {
    // ...existing fields...
    isGroupLocked: lockState.isGroupLocked,
    isMatchLocked: lockState.isMatchLocked,
    isClockFallback: lockState.isClockFallback,
    phase: lockState.phase,
    nextLockAt: lockState.nextLockAt,
    nextLockLabel: lockState.nextLockLabel,
    fixturesLoading: lockState.isLoading
  };
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/BracketContext.tsx
git commit -m "feat(bracket): BracketContext exposes lock helpers, partial-save retry, groupId"
```

---

## Task 13: `PhaseHeroCard` component

**Files:**
- Create: `apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx
import { StyleSheet, Text, View } from "react-native";
import type { TournamentPhase } from "../lib/computeBracketLockState";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface PhaseHeroCardProps {
  phase: TournamentPhase;
  nextLockAt: Date | null;
  nextLockLabel: string | null;
  now: Date;
}

function formatRelative(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remM = minutes - hours * 60;
    return remM > 0 ? `${hours}h ${remM}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function PhaseHeroCard({ phase, nextLockAt, nextLockLabel, now }: PhaseHeroCardProps) {
  let eyebrow = "";
  let title = "";
  let body = "";
  let tone: "green" | "amber" | "neutral" = "green";

  switch (phase) {
    case "pre":
      eyebrow = "PHASE 1";
      title = "Group Stage";
      body = nextLockAt
        ? `Predict the group standings. First lock in ${formatRelative(nextLockAt, now)}.`
        : "Predict the group standings.";
      tone = "green";
      break;
    case "phase1-closing":
      eyebrow = "PHASE 1 CLOSING";
      title = nextLockLabel ? `${nextLockLabel} locks soon` : "Groups closing";
      body = nextLockAt
        ? `Next lock: ${nextLockLabel ?? "soon"} in ${formatRelative(nextLockAt, now)}.`
        : "Some groups already locked.";
      tone = "amber";
      break;
    case "between":
      eyebrow = "PHASE 2";
      title = "Knockouts unlocked";
      body = "Group stage is in the books. Time to pick the bracket.";
      tone = "green";
      break;
    case "phase2-closing":
      eyebrow = "PHASE 2 CLOSING";
      title = nextLockLabel ? `${nextLockLabel} locks soon` : "Knockouts closing";
      body = nextLockAt
        ? `Next match locks in ${formatRelative(nextLockAt, now)}.`
        : "Some matches already locked.";
      tone = "amber";
      break;
    case "complete":
      eyebrow = "TOURNAMENT COMPLETE";
      title = "🏁 The final whistle";
      body = "See your final score on the leaderboard.";
      tone = "neutral";
      break;
  }

  const borderColor =
    tone === "green" ? colors.gold : tone === "amber" ? "#D97706" : "rgba(255, 248, 234, 0.25)";

  return (
    <View style={[styles.card, { borderColor }]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "rgba(255, 248, 234, 0.75)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6
  },
  card: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderRadius: radius.lg,
    borderWidth: 2,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  title: {
    color: colors.cream,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4
  }
});
```

- [ ] **Step 2: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx
git commit -m "feat(bracket): PhaseHeroCard component (5 phase states)"
```

---

## Task 14: `LateJoinerBanner` component

**Files:**
- Create: `apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

const STORAGE_KEY = "bracket.lateJoinerBannerDismissed";

interface LateJoinerBannerProps {
  lockedGroupCount: number;
  lockedMatchCount: number;
}

export function LateJoinerBanner({ lockedGroupCount, lockedMatchCount }: LateJoinerBannerProps) {
  const [dismissedKnown, setDismissedKnown] = useState<boolean | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      setDismissedKnown(value === "1");
    });
  }, []);

  if (dismissedKnown === null) return null;
  if (dismissedKnown) return null;
  if (lockedGroupCount === 0 && lockedMatchCount === 0) return null;

  const handleDismiss = () => {
    setDismissedKnown(true);
    void AsyncStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.body}>
        🕒 <Text style={styles.bold}>You're joining after some games started.</Text>{" "}
        {lockedGroupCount > 0
          ? `${lockedGroupCount} group${lockedGroupCount === 1 ? "" : "s"} already locked. `
          : ""}
        {lockedMatchCount > 0
          ? `${lockedMatchCount} knockout match${lockedMatchCount === 1 ? "" : "es"} already played. `
          : ""}
        You can still play the rest.
      </Text>
      <Pressable onPress={handleDismiss} hitSlop={12} style={styles.dismiss}>
        <Text style={styles.dismissText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  body: {
    color: colors.cream,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  bold: { fontWeight: "900" },
  dismiss: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  dismissText: {
    color: colors.pitch,
    fontSize: 12,
    fontWeight: "900"
  }
});
```

- [ ] **Step 2: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx
git commit -m "feat(bracket): LateJoinerBanner with AsyncStorage dismiss memory"
```

---

## Task 15: `SubTabBar` — lock icons + Phase 2 eyebrows

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/SubTabBar.tsx`
- Modify: caller in `apps/mobile/app/(tabs)/bracket.tsx` (Task 19 also touches this)

- [ ] **Step 1: Read the existing file** to understand the props shape:

```bash
cat apps/mobile/src/features/bracket/components/SubTabBar.tsx
```

- [ ] **Step 2: Extend the items interface to support `isLocked?: boolean` and `phase2Hint?: boolean`**

Edit the file so the items it iterates over accept those two optional flags. Where each tab label is rendered:
- If `isLocked`, append `🔒` next to the label.
- If `phase2Hint`, render a tiny eyebrow above the label that says `PHASE 2`.

Pattern:

```tsx
{item.phase2Hint ? <Text style={styles.eyebrow}>PHASE 2</Text> : null}
<Text style={styles.label}>
  {item.label}
  {item.isLocked ? <Text style={styles.lockIcon}>  🔒</Text> : null}
</Text>
```

Add styles:

```ts
eyebrow: {
  color: colors.gold,
  fontSize: 9,
  fontWeight: "900",
  letterSpacing: 1
},
lockIcon: {
  fontSize: 11
}
```

- [ ] **Step 3: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/components/SubTabBar.tsx
git commit -m "feat(bracket): SubTabBar accepts isLocked + phase2Hint per item"
```

---

## Task 16: `GroupPicker` — locked state + dual CTA

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/GroupPicker.tsx`

- [ ] **Step 1: Pull lock helpers + saveBracket from context**

At the top of `GroupPicker`, add to the destructured `useBracket()` call:

```ts
const {
  groupRankings, moveTeamUp, moveTeamDown, resetGroup,
  isGroupLocked, saveBracket
} = useBracket();
const locked = isGroupLocked(groupId);
```

- [ ] **Step 2: Render locked state in the group card**

When `locked` is true:
- Show a 🔒 chip in the group title
- Hide up/down arrows (render the disabled style without `Pressable`)
- Hide the "Reset group" link

```tsx
<Text style={styles.groupTitle}>
  GROUP {groupId}
  {locked ? <Text style={styles.lockChip}>  🔒 LOCKED</Text> : null}
</Text>
```

In the row loop, gate the arrows:

```tsx
{!locked ? (
  <View style={styles.arrows}>
    <Pressable
      style={[styles.arrowButton, upDisabled ? styles.arrowDisabled : null]}
      disabled={upDisabled}
      onPress={() => moveTeamUp(groupId, i)}
    >
      <Text style={styles.arrowText}>▲</Text>
    </Pressable>
    <Pressable
      style={[styles.arrowButton, downDisabled ? styles.arrowDisabled : null]}
      disabled={downDisabled}
      onPress={() => moveTeamDown(groupId, i)}
    >
      <Text style={styles.arrowText}>▼</Text>
    </Pressable>
  </View>
) : null}
```

Gate the reset button:

```tsx
{!locked ? (
  <Pressable style={styles.resetButton} onPress={() => resetGroup(groupId)}>
    <Text style={styles.resetText}>Reset group</Text>
  </Pressable>
) : null}
```

Add the lock chip style:

```ts
lockChip: {
  color: "rgba(12, 59, 46, 0.6)",
  fontSize: 12,
  fontWeight: "900",
  letterSpacing: 0.8
}
```

- [ ] **Step 3: Replace the last-group "Pick Knockouts →" with the dual CTA**

Find the bottom nav row and adjust the `isLast` branch:

```tsx
{isLast ? (
  <View style={styles.dualCtaRow}>
    <Pressable
      style={styles.saveButton}
      onPress={async () => {
        await saveBracket();
        Alert.alert(
          "Group picks saved",
          "Come back June 28 to pick the knockouts — or set them now.",
          [
            { text: "Set Knockouts Now", onPress: () => onComplete?.() },
            { text: "Back to Bracket", style: "cancel" }
          ]
        );
      }}
    >
      <Text style={styles.saveButtonText}>Save Group Stage</Text>
    </Pressable>
    <Pressable
      style={styles.navButtonPrimary}
      onPress={async () => {
        await saveBracket();
        onComplete?.();
      }}
    >
      <Text style={styles.navTextPrimary}>Set Knockouts Now →</Text>
    </Pressable>
  </View>
) : (
  <Pressable style={styles.navButtonPrimary} onPress={handleNext}>
    <Text style={styles.navTextPrimary}>Next →</Text>
  </Pressable>
)}
```

Add `Alert` to the `react-native` imports. Add styles:

```ts
dualCtaRow: {
  flexDirection: "row",
  flex: 1,
  gap: spacing.sm
},
saveButton: {
  borderColor: colors.gold,
  borderRadius: radius.pill,
  borderWidth: 2,
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingVertical: 10
},
saveButtonText: {
  color: colors.gold,
  fontSize: 14,
  fontWeight: "900",
  textAlign: "center"
}
```

- [ ] **Step 4: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/components/GroupPicker.tsx
git commit -m "feat(bracket): GroupPicker locked-state + dual Save/Continue CTA"
```

---

## Task 17: `KnockoutRound` — locked state

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/KnockoutRound.tsx`

- [ ] **Step 1: Pull `isMatchLocked` from context**

```ts
const { isMatchLocked } = useBracket();
```

- [ ] **Step 2: For each match, gate team-pick buttons**

Where each matchup is rendered, compute `const locked = isMatchLocked(round, matchIndex);`.

When `locked`, render team buttons in a non-interactive style and show a lock chip:

```tsx
{locked ? (
  <Text style={styles.lockChip}>🔒 LOCKED</Text>
) : null}
```

Add the style:

```ts
lockChip: {
  color: "rgba(255, 248, 234, 0.6)",
  fontSize: 11,
  fontWeight: "900"
}
```

For the team-pick `Pressable` components: add `disabled={locked}` and optionally style them to look inert (`opacity: 0.5`).

- [ ] **Step 3: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/components/KnockoutRound.tsx
git commit -m "feat(bracket): KnockoutRound shows locked-match state"
```

---

## Task 18: `BracketSummary` — phase-aware copy + clock-fallback banner

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/BracketSummary.tsx`

- [ ] **Step 1: Pull phase + flags from context**

```ts
const {
  /* existing fields */,
  phase,
  saveError,
  isClockFallback
} = useBracket();
```

- [ ] **Step 2: Render a clock-fallback warning at the top of the summary view**

```tsx
{isClockFallback ? (
  <Text style={styles.clockBanner}>
    ⚠️ Couldn't reach server clock — lock times may drift slightly.
  </Text>
) : null}
```

Style:

```ts
clockBanner: {
  color: "#F0A500",
  fontSize: 12,
  fontWeight: "800",
  marginBottom: spacing.sm,
  textAlign: "center"
}
```

- [ ] **Step 3: Make the Save button label phase-aware**

Find the primary save button and compute its label:

```ts
const saveButtonLabel = (() => {
  switch (phase) {
    case "pre":
    case "phase1-closing":
      return isSaving ? "Saving..." : "Save Group Picks";
    case "between":
    case "phase2-closing":
      return isSaving ? "Saving..." : "Save My Bracket";
    case "complete":
      return "Tournament Complete";
  }
})();
```

Disable the button when `phase === "complete"`.

- [ ] **Step 4: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/components/BracketSummary.tsx
git commit -m "feat(bracket): BracketSummary phase-aware copy + clock-fallback banner"
```

---

## Task 19: Mount `PhaseHeroCard` + `LateJoinerBanner` + lock-icon SubTabBar in the bracket tab

**Files:**
- Modify: `apps/mobile/app/(tabs)/bracket.tsx`

- [ ] **Step 1: Add imports**

```ts
import { PhaseHeroCard } from "../../src/features/bracket/components/PhaseHeroCard";
import { LateJoinerBanner } from "../../src/features/bracket/components/LateJoinerBanner";
import { useTournamentClock } from "../../src/features/bracket/hooks/useTournamentClock";
import { useFixtures } from "../../src/features/bracket/hooks/useFixtures";
import { GROUP_IDS } from "@world-cup-game/config";
```

- [ ] **Step 2: Render hero + banner above existing content**

Inside the bracket tab component:

```tsx
const { phase, nextLockAt, nextLockLabel, isGroupLocked, isMatchLocked } = useBracket();
const { now } = useTournamentClock();
const { fixtures } = useFixtures();

const lockedGroupCount = GROUP_IDS.filter(isGroupLocked).length;
const lockedMatchCount = fixtures
  ? fixtures.knockouts.filter((k) => isMatchLocked(k.round, k.index)).length
  : 0;

const isPhase2HintActive = phase === "pre" || phase === "phase1-closing";

const allGroupsLocked = GROUP_IDS.every(isGroupLocked);
const allR32Locked = fixtures
  ? fixtures.knockouts.filter((k) => k.round === "r32").every((k) => isMatchLocked("r32", k.index))
  : false;
// (similar booleans for r16/qf/sf if needed by SubTabBar items)

// Inside the JSX, above the SubTabBar:
return (
  <View style={styles.root}>
    <PhaseHeroCard
      phase={phase}
      nextLockAt={nextLockAt}
      nextLockLabel={nextLockLabel}
      now={now}
    />
    <LateJoinerBanner
      lockedGroupCount={lockedGroupCount}
      lockedMatchCount={lockedMatchCount}
    />
    {/* SubTabBar — pass new isLocked / phase2Hint flags per item */}
    {/* existing tab content below */}
  </View>
);
```

Where SubTabBar items are constructed, pass the new flags (Task 15 added the prop support):

```ts
const items = [
  { key: "groups", label: "Groups", isLocked: allGroupsLocked },
  { key: "r32",    label: "R32",    isLocked: allR32Locked,    phase2Hint: isPhase2HintActive },
  // ... r16, qf, sf similarly
  { key: "summary", label: "Summary" }
];
```

- [ ] **Step 3: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/app/\(tabs\)/bracket.tsx
git commit -m "feat(bracket): mount PhaseHeroCard + LateJoinerBanner; wire SubTabBar lock flags"
```

---

## Task 20: Schedule tab — minimal list UI

**Files:**
- Modify: `apps/mobile/app/(tabs)/schedule.tsx`

- [ ] **Step 1: Replace the placeholder with a list view**

```tsx
// apps/mobile/app/(tabs)/schedule.tsx
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import { useFixtures } from "../../src/features/bracket/hooks/useFixtures";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { supabase } from "../../src/lib/supabase";

// Schedule tab queries the matches table directly for the full row data
// (home/away teams + venue) on top of what useFixtures normalizes for lockout.

interface ScheduleMatch {
  id: string;
  round: string;
  group_id: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  kickoff: string;
  venue: string | null;
}

function teamLabel(code: string | null): string {
  if (!code) return "TBD";
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  return nation ? `${nation.flagEmoji} ${nation.name}` : code;
}

function roundLabel(round: string): string {
  switch (round) {
    case "group": return "Group Stage";
    case "r32":   return "Round of 32";
    case "r16":   return "Round of 16";
    case "qf":    return "Quarterfinals";
    case "sf":    return "Semifinals";
    case "third": return "3rd Place";
    case "final": return "Final";
    default:      return round.toUpperCase();
  }
}

function formatDateHeader(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

function formatKickoff(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

import { useEffect, useState } from "react";

function useScheduleMatches() {
  const [matches, setMatches] = useState<ScheduleMatch[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id,round,group_id,home_team_code,away_team_code,kickoff,venue")
        .order("kickoff", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error as Error);
        return;
      }
      setMatches((data ?? []) as ScheduleMatch[]);
    })();
    return () => { cancelled = true; };
  }, []);

  return { matches, error };
}

export default function ScheduleScreen() {
  const { matches, error } = useScheduleMatches();

  const grouped = useMemo(() => {
    if (!matches) return null;
    const byDay = new Map<string, ScheduleMatch[]>();
    for (const m of matches) {
      const day = new Date(m.kickoff).toISOString().slice(0, 10);
      const list = byDay.get(day) ?? [];
      list.push(m);
      byDay.set(day, list);
    }
    return Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [matches]);

  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn't load schedule: {error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!grouped) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>
          All confirmed kickoffs. Group-stage matchdays 2 and 3 are coming.
        </Text>
        {grouped.map(([day, dayMatches]) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayHeader}>{formatDateHeader(new Date(day))}</Text>
            {dayMatches.map((m) => (
              <View key={m.id} style={styles.matchCard}>
                <Text style={styles.matchMeta}>
                  {roundLabel(m.round)}{m.group_id ? ` · Group ${m.group_id}` : ""}  ·  {formatKickoff(new Date(m.kickoff))}
                </Text>
                <Text style={styles.matchTeams}>
                  {teamLabel(m.home_team_code)} vs {teamLabel(m.away_team_code)}
                </Text>
                {m.venue ? <Text style={styles.matchVenue}>{m.venue}</Text> : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  content: {
    padding: spacing.lg
  },
  dayHeader: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  daySection: {
    marginBottom: spacing.lg
  },
  errorText: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    paddingHorizontal: spacing.lg,
    textAlign: "center"
  },
  matchCard: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  matchMeta: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  matchTeams: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4
  },
  matchVenue: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  subtitle: {
    color: "rgba(255, 248, 234, 0.7)",
    marginBottom: spacing.lg,
    ...typography.body
  },
  title: {
    color: colors.cream,
    ...typography.display
  }
});
```

- [ ] **Step 2: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/app/\(tabs\)/schedule.tsx
git commit -m "feat(schedule): minimal list view backed by public.matches"
```

---

## Task 21: Notifications module — June 27 reminder

**Files:**
- Create: `apps/mobile/src/features/bracket/notifications.ts`

- [ ] **Step 1: Write the scheduler**

```ts
// apps/mobile/src/features/bracket/notifications.ts
import * as Notifications from "expo-notifications";

const NOTIFICATION_IDENTIFIER = "bracket-phase2-open";
const PHASE_2_REMINDER_DATE = new Date("2026-06-27T21:00:00");

/**
 * Idempotently schedule a single local notification reminding the user that
 * Phase 2 has opened. No-op if:
 *   - User denied notification permission
 *   - The reminder date has already passed
 *   - We've already scheduled this notification
 */
export async function scheduleKnockoutReminder(): Promise<void> {
  if (PHASE_2_REMINDER_DATE.getTime() <= Date.now()) return;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  if (existing.some((n) => n.identifier === NOTIFICATION_IDENTIFIER)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIER,
    content: {
      title: "⚽ Phase 2 is open!",
      body: "Group stage is locked. Pick your knockouts before R32 kicks off tomorrow."
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: PHASE_2_REMINDER_DATE
    }
  });
}

export async function cancelKnockoutReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
}
```

- [ ] **Step 2: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/notifications.ts
git commit -m "feat(bracket): idempotent June 27 knockout reminder scheduler"
```

---

## Task 22: Wire notifications into `BracketProvider`

**Files:**
- Modify: `apps/mobile/src/features/bracket/BracketContext.tsx`

- [ ] **Step 1: Schedule on bracket load**

Add the import:

```ts
import { scheduleKnockoutReminder } from "./notifications";
```

Inside the `useEffect` that fetches the current bracket on auth, AFTER the `getCurrentBracket()` resolves successfully, add:

```ts
void scheduleKnockoutReminder().catch(() => {
  // best-effort — ignore failures
});
```

- [ ] **Step 2: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/BracketContext.tsx
git commit -m "feat(bracket): wire knockout reminder scheduling into BracketProvider"
```

---

## Task 23: Group bracket audit + integration

**Files:**
- Investigate: `apps/mobile/src/features/groups/`
- Modify: any group-bracket entry point that mounts `BracketProvider`

- [ ] **Step 1: Find every caller of `submitCurrentBracket` and every mount of `BracketProvider`**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
grep -rn "submitCurrentBracket\|BracketProvider" apps/mobile/src apps/mobile/app
```

For each `BracketProvider` mount in a group context, ensure it passes `groupId`.

- [ ] **Step 2: For each group bracket entry, pass the groupId**

```tsx
<BracketProvider groupId={groupId}>
  {/* ... */}
</BracketProvider>
```

If no group-bracket UI exists yet, that's fine — note in the PR description that the server-side enforcement covers group brackets, with UI exposure deferred.

- [ ] **Step 3: Typecheck & commit**

```bash
pnpm --filter mobile typecheck
git add apps/mobile/src/features/bracket/BracketContext.tsx
# also any group-bracket entry points modified
git commit -m "feat(bracket): plumb groupId through group-bracket entry points"
```

---

## Task 24: Manual smoke test plan

- [ ] **Step 1: Start Metro**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
pnpm --filter mobile start
```

Press `w` once Metro is up to open the web preview.

- [ ] **Step 2: Simulate each phase by overriding `useTournamentClock`**

At the top of `useTournamentClock.ts`, temporarily insert:

```ts
// TEMP: phase simulation
return { now: new Date("2026-06-14T18:00:00Z"), isUsingFallback: false };
```

Try each:
- `"2026-06-05T00:00:00Z"` → expect `pre` hero, all groups editable, no lock icons
- `"2026-06-14T18:00:00Z"` → expect `phase1-closing`, Groups A–E locked, F+ editable, late-joiner banner appears (if dismissed once, won't re-appear)
- `"2026-06-27T23:59:00Z"` → expect `between`, all groups locked, all knockouts editable
- `"2026-07-01T12:00:00Z"` → expect `phase2-closing`, some R32 locked
- `"2026-08-01T00:00:00Z"` → expect `complete`, everything locked, save button disabled

- [ ] **Step 3: Walk the dual CTA flow**

In `pre` mode:
1. Navigate to Groups tab
2. Click through to Group L
3. Tap "Save Group Stage"
4. Confirm alert appears with "Set Knockouts Now" + "Back to Bracket"
5. Tap "Set Knockouts Now" → should advance to R32

- [ ] **Step 4: Check the schedule tab**

Navigate to the Schedule tab. Expect:
- Loading spinner briefly
- 44 matches grouped by day in chronological order
- Each row shows round label, group/match number, kickoff time, venue, teams (or "TBD" for knockouts)
- Subtitle says "Group-stage matchdays 2 and 3 are coming."

- [ ] **Step 5: REMOVE the simulation override**

Delete the `TEMP: phase simulation` lines from `useTournamentClock.ts`. Do not commit them.

```bash
git diff apps/mobile/src/features/bracket/hooks/useTournamentClock.ts
# should be empty
```

---

## Task 25: Run the full test + typecheck suite

- [ ] **Step 1: Pure logic tests**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
```

Expected: `OK: all computeBracketLockState assertions passed`.

- [ ] **Step 2: Edge function tests (requires Deno)**

```bash
deno test supabase/functions/submit-bracket/validateFixtures.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 3: Full mobile typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Migration smoke (if local Supabase available)**

```bash
supabase db reset
supabase db psql -f supabase/tests/matches_counts.sql
```

Expected: `✓ matches table: all assertions passed`.

- [ ] **Step 5: Deploy edge function to staging Supabase (optional pre-PR sanity)**

```bash
supabase functions deploy submit-bracket
```

Exercise from Expo: save a bracket → confirm round-trip works; attempt to change a known-locked pick → confirm `PICK_PAST_LOCKOUT` response.

---

## Task 26: Open the PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feature/bracket-phased-lockout
```

- [ ] **Step 2: Open PR** (visit the URL printed by `git push`, since `gh` CLI isn't available)

- [ ] **Step 3: PR title**

```
feat: phased bracket lockout + matches table source of truth
```

- [ ] **Step 4: PR body**

```markdown
## Summary
Splits the bracket flow into Phase 1 (group rankings) and Phase 2 (knockouts) per the design doc at `docs/superpowers/specs/2026-06-03-bracket-phased-lockout-design.md` (see the **Revision Note — June 4** at the top). Lockout enforcement lives in the existing `submit-bracket` edge function. Fixture data lives in a new `public.matches` table — single source of truth for both bracket lockout and the (newly-built-out) schedule tab.

⚠️ **Deadline: June 11, 2026** — first World Cup kickoff. Anything not merged by then loses Phase 1 entirely.

⚠️ **Coordination ask:** confirm migrations `000020` and `000021` don't collide with anything in flight.

### What's in
- **`public.matches` table** + seed for all 44 lockable kickoffs (12 group first-matches + 32 knockout matches). Migration `000020_matches_table.sql`.
- **Migration `000021_bracket_phased_locks.sql`** — drops binary `locked_at IS NULL` RLS, adds `(user_id, group_id) NULLS NOT DISTINCT` unique index, exposes `get_server_time()` RPC.
- **`submit-bracket` edge function** queries `public.matches` directly to validate every pick against its kickoff; returns structured `PICK_PAST_LOCKOUT` errors for partial-save races.
- **`useFixtures` + `useTournamentClock` + `useBracketLockState` hooks** with pure derivation function and 7-case unit tests.
- **`PhaseHeroCard`** (5 phase states) and **`LateJoinerBanner`** (dismissible, AsyncStorage memory).
- **Locked-state rendering** in `GroupPicker` and `KnockoutRound`. Dual-CTA on the last group ("Save Group Stage" / "Set Knockouts Now").
- **`BracketSummary`** phase-aware copy + clock-fallback banner.
- **Schedule tab** finally has content — minimal list of confirmed matches grouped by date.
- **June 27 9pm local push reminder** (idempotent, permission-gated).
- **Group bracket support** — same enforcement via `BracketProvider`'s new `groupId` prop.

### Out of scope (deferred)
- Group-stage matchdays 2 and 3 seed (60 more rows) — separate PR; bracket lockout works fine without them.
- Live match results / scoring against actual outcomes.
- Auto-filling R32 matchups from group results.
- Per-phase leaderboard splits.
- Schedule tab filters ("your nation only", live scores).

## Test plan
- [ ] `pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts` passes
- [ ] `deno test supabase/functions/submit-bracket/validateFixtures.test.ts` passes (8 cases)
- [ ] `pnpm --filter mobile typecheck` passes
- [ ] `supabase db reset && supabase db psql -f supabase/tests/matches_counts.sql` passes (✓ matches table: all assertions passed)
- [ ] Manual: walk through each of 5 phase states by mocking `useTournamentClock`. Confirm hero card, lock icons, dual CTA, late-joiner banner.
- [ ] Manual: schedule tab loads, shows 44 matches grouped by date.
- [ ] Deploy edge function to staging Supabase, confirm `PICK_PAST_LOCKOUT` response with a deliberately mismatched pick.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 5: Return the PR URL to Denver**

---

## Notes for the executing agent

- **Stop and ask** if any step's prerequisites aren't met. The plan assumes you're on `feature/bracket-phased-lockout` with a clean working tree.
- **Don't refactor unrelated code.** Stay inside the listed files. If you find a real bug nearby, flag it via `mcp__ccd_session__spawn_task` and keep moving.
- **Run the typecheck after each task.** If it breaks, fix BEFORE committing.
- **Commit per task.** Frequent commits = easier review + safer to abort.
