# Bracket: Phased Lockout Design

Status: **Spec — REVISED June 4** (see Revision Note below; original sections kept for context)
Author: Denver (with Claude)
Last updated: June 4, 2026
Target branch: `feature/bracket-phased-lockout`

---

## Revision Note — June 4, 2026: Matches Table is the Source of Truth

**This revision supersedes anything contradictory in the sections below.** The original design proposed a static TypeScript `fixtures.ts` file mirrored into the edge function with a parity-check script. We discovered that Donaven had stubbed out `supabase/seed/sample_matches.sql` (orphan — one dummy row, nothing references it). We're promoting that pattern instead.

### Final architecture (after this revision)

- **`public.matches`** is the canonical source of truth. Created and seeded with all 104 World Cup matches (72 group + 32 knockout) by migration `000020_matches_table.sql`. Schema includes `id` (FIFA-style "M01"–"M104"), `round`, `group_id`, `bracket_index`, `home_team_code`, `away_team_code`, `kickoff` (timestamptz), `venue`, `status`, optional `home_score`/`away_score`.
- **Client reads** via a new `useFixtures()` hook that fetches once per session and caches in memory. Returns the same shapes the lockout logic needs (`groupFirstKickoffs: Record<GroupId, Date>`, `knockoutKickoffs: Array<{round, index, kickoff: Date}>`).
- **Edge function reads** via a direct Postgres query inside `submit-bracket`. No fixture file copy. No parity script.
- **Schedule tab** gets a minimal-viable list UI as a bonus (list of matches by date, flags, kickoff time, venue). Drops the `ScreenPlaceholder` stub.
- **`sample_matches` is left alone** — orphan seed, no references. Not worth removing in this PR.
- **Migration order:** `000020_matches_table.sql` (table + seed) precedes `000021_bracket_phased_locks.sql` (RLS changes + unique index + `get_server_time` RPC).

### What this changes vs. the original spec sections

| Original section | New direction |
|---|---|
| "Source of truth: static fixtures.ts" (Decision #4) | "Source of truth: public.matches table" |
| `packages/config/src/fixtures.ts` (new file) | Dropped — does not exist |
| `supabase/functions/submit-bracket/fixtures.ts` (mirror) | Dropped — edge function queries DB directly |
| `scripts/verify-fixtures.ts` (parity script) | Dropped — no duplication to verify |
| `pnpm verify:fixtures` | Dropped |
| Embedded SQL fixture functions in RPC | Dropped — RPC pivot already removed RPC entirely; edge function uses SQL query |
| Migration `000020_bracket_phased_locks.sql` | Renumbered `000021`; new `000020` creates+seeds matches |
| `useBracketLockState` derives from imported constants | Now derives from `useFixtures()` async data; emits loading state until matches load |

The original brainstorming, error handling, UX flow, and out-of-scope sections still apply as-written.

### Out-of-scope additions to call out

- **Live match results** — `home_score`/`away_score` columns exist on `matches` but stay NULL in this PR. Result ingest is a future PR.
- **Schedule tab filtering** ("only my nation", "today only") — basic chronological list only.
- **Match status transitions** (scheduled → live → completed) — column exists, value stays 'scheduled' for all rows. Manual updates later.

### Decision #4 (revised)

> **Source of truth**: a new Supabase `public.matches` table seeded by migration with all 104 matches (72 group + 32 knockout). Client fetches via `useFixtures()` hook on bracket tab mount and caches in memory. Edge function queries the same table for write validation. **One source of truth — no TS/SQL mirror, no parity script.**

---

## Original spec (June 3) — kept for context

## Why this exists

Today the bracket flow requires the user to fill in **everything in one sitting**: group rankings, R32, R16, QF, SF, final, third place. That's overwhelming, and it forces users to make knockout picks before they have any information about how the group stage played out.

This spec splits the flow into **two phases** keyed off real World Cup dates:

- **Phase 1 — Group Stage**: predict the rankings inside each of 12 groups. Locks per-group as that group's first match kicks off.
- **Phase 2 — Knockouts**: predict R32 → final + third place. Locks per-match as each knockout match kicks off.

Knockouts stay editable until R32 kickoff so power users *can* set everything in one sitting if they want. Patient users get a richer two-rounds experience.

## ⚠️ Timing risk

Today is **June 3, 2026**. The first World Cup match kicks off **June 11**. We have **8 days** to land this. If we miss June 11:
- Every group locks at the first user load
- Users only get to play Phase 2 in v1
- The whole "two rounds" promise is lost for the inaugural tournament

**Coordination ask:** ping Donaven before opening the PR so the migration number `000020` doesn't collide with anything on his branches.

## Locked design decisions (from brainstorming)

1. **Hybrid lockout model**: phase deadlines + grey-out for already-played units.
2. **Phase 2 access**: knockout tabs are always visible and editable up to R32 kickoff; users can speculate early without competitive penalty.
3. **Lockout granularity**:
   - Group rankings → lock per-group at *that group's* first match kickoff.
   - Knockout picks → lock per-match at *that match's* kickoff.
4. **Source of truth**: a new Supabase `public.matches` table seeded by migration with all 104 matches (72 group + 32 knockout). Client fetches via `useFixtures()` hook on bracket tab mount and caches in memory. Edge function queries the same table for write validation. **One source of truth — no TS/SQL mirror, no parity script.**
5. **Server clock**: read from Supabase `now()`, fall back to device clock if the call fails (with a one-time warning banner).
6. **Lock state is derived, not stored.** No new columns or tables. The RPC validates each save against fixture kickoffs.
7. **Lock enforcement**: drop binary `locked_at is null` RLS; route all updates through `update_bracket(jsonb)` RPC that validates per-pick.
8. **Times in UI**: countdowns are relative ("locks in 2h 14m"); absolute times use device local timezone.
9. **Default rankings count as valid picks** — no "are you sure" friction on save.
10. **Last-save-wins** for concurrent edits across devices. Realtime sync is out of scope.
11. **Scope: personal + group brackets.** The `brackets` table supports both personal (`group_id IS NULL`) and shared group brackets (`group_id` set). Phased lockout applies to **both** — a pick on a group bracket goes through the same fixture-validated RPC. The RPC accepts an optional `group_id` argument and upserts on `(user_id, group_id)` with NULLs-not-distinct semantics.

## Architecture

### Data sources

```
┌─────────────────────────────────────────────────────────┐
│  packages/config/src/fixtures.ts                        │
│  Static JSON: 12 group first-kickoffs + 32 knockouts    │
│  (UTC, never mutates during tournament)                 │
└───────────────────┬─────────────────────────────────────┘
                    │ imported by client
                    ▼
┌─────────────────────────────────────────────────────────┐
│  useTournamentClock() ── server now() polled every 60s  │
│        │                                                │
│        ▼                                                │
│  useBracketLockState() ── derived booleans              │
│        │                                                │
│        ▼                                                │
│  BracketContext.isGroupLocked() / .isMatchLocked()      │
└───────────────────┬─────────────────────────────────────┘
                    │ saveBracket()
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase RPC: update_bracket(new_picks jsonb)          │
│  ├ embedded copy of fixture kickoffs                    │
│  ├ validates each pick against now() vs that kickoff    │
│  └ returns {ok, bracket} OR {error, invalidGroups,     │
│             invalidMatches}                             │
└─────────────────────────────────────────────────────────┘
```

### New files

| Path | Purpose |
|---|---|
| `packages/config/src/fixtures.ts` | Fixture data + types |
| `apps/mobile/src/features/bracket/hooks/useTournamentClock.ts` | Server-time hook |
| `apps/mobile/src/features/bracket/hooks/useBracketLockState.ts` | Derived lock-state hook |
| `apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx` | Top-of-page status card |
| `apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx` | Dismissible "joined late" banner |
| `apps/mobile/src/features/bracket/notifications.ts` | June 27 reminder scheduler |
| `supabase/migrations/000020_bracket_phased_locks.sql` | RLS change + RPC |
| `scripts/verify-fixtures.ts` | Parity check between TS file and SQL RPC |

### Modified files

| Path | Change |
|---|---|
| `packages/config/src/index.ts` | Re-export fixture constants and types |
| `apps/mobile/src/features/bracket/BracketContext.tsx` | Add lock helpers; route `saveBracket` through RPC; handle `PICK_PAST_LOCKOUT` partial save; pass `group_id` if context is mounted for a group bracket |
| `apps/mobile/src/features/bracket/api/brackets.ts` | New `updateBracket(picks, groupId?)` calling the RPC |
| `apps/mobile/src/features/groups/` (group bracket entry point, if separate) | Pass current `group_id` into the bracket flow so `saveBracket` targets the group bracket. Audit whether group brackets reuse `BracketContext` or have a parallel one. |
| `apps/mobile/src/features/bracket/components/GroupPicker.tsx` | Read-only state when group locked; dual CTA on last group |
| `apps/mobile/src/features/bracket/components/KnockoutRound.tsx` | Read-only state when match locked |
| `apps/mobile/src/features/bracket/components/SubTabBar.tsx` | Lock icons + Phase 2 eyebrow |
| `apps/mobile/src/features/bracket/components/BracketSummary.tsx` | Surface partial-save warnings; phase-aware copy |
| `apps/mobile/app/(tabs)/bracket.tsx` | Mount `PhaseHeroCard` + `LateJoinerBanner` |
| `package.json` (root) | Add `verify:fixtures` script |

## Data model

### `packages/config/src/fixtures.ts`

```ts
import type { GroupId } from "./groups";

export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export interface KnockoutFixture {
  round: KnockoutRoundId;
  /** Position in the bracket array for that round (0-indexed). */
  index: number;
  /** ISO 8601 UTC string. Never local time. */
  kickoff: string;
}

// Sources (June 3, 2026 — verify before merging the implementation PR):
// ESPN: https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures
// Wikipedia: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
// All times converted ET (EDT, UTC-4) → UTC. ⚠️ ESPN and Wikipedia disagreed on
// final + third-place kickoff; we used Wikipedia (7pm ET final, 9pm ET 3rd).
// Engineer running the impl PR should re-verify against fifa.com day-of.

export const GROUP_FIRST_KICKOFF_UTC: Record<GroupId, string> = {
  A: "2026-06-11T19:00:00Z",  // Mexico vs South Africa, 3pm ET
  B: "2026-06-12T19:00:00Z",  // Canada vs Bosnia, 3pm ET
  C: "2026-06-13T22:00:00Z",  // Brazil vs Morocco, 6pm ET
  D: "2026-06-13T01:00:00Z",  // USA vs Paraguay, June 12 9pm ET
  E: "2026-06-14T17:00:00Z",  // Germany vs Curaçao, 1pm ET
  F: "2026-06-14T20:00:00Z",  // Netherlands vs Japan, 4pm ET
  G: "2026-06-15T22:00:00Z",  // Belgium vs Egypt, 6pm ET
  H: "2026-06-15T17:00:00Z",  // Spain vs Cape Verde, 1pm ET
  I: "2026-06-16T19:00:00Z",  // France vs Senegal, 3pm ET
  J: "2026-06-17T01:00:00Z",  // Argentina vs Algeria, June 16 9pm ET
  K: "2026-06-17T17:00:00Z",  // Portugal vs DR Congo, 1pm ET
  L: "2026-06-17T20:00:00Z",  // England vs Croatia, 4pm ET
};

export const KNOCKOUT_FIXTURES: readonly KnockoutFixture[] = [
  // Round of 32 (16 matches, indices 0-15, in bracket position order)
  { round: "r32", index:  0, kickoff: "2026-06-28T19:00:00Z" }, // M73, 3pm ET
  { round: "r32", index:  1, kickoff: "2026-06-29T17:00:00Z" }, // M76, 1pm ET
  { round: "r32", index:  2, kickoff: "2026-06-29T20:30:00Z" }, // M74, 4:30pm ET
  { round: "r32", index:  3, kickoff: "2026-06-30T01:00:00Z" }, // M75, June 29 9pm ET
  { round: "r32", index:  4, kickoff: "2026-06-30T17:00:00Z" }, // M78, 1pm ET
  { round: "r32", index:  5, kickoff: "2026-06-30T21:00:00Z" }, // M77, 5pm ET
  { round: "r32", index:  6, kickoff: "2026-07-01T01:00:00Z" }, // M79, June 30 9pm ET
  { round: "r32", index:  7, kickoff: "2026-07-01T16:00:00Z" }, // M80, 12pm ET
  { round: "r32", index:  8, kickoff: "2026-07-01T20:00:00Z" }, // M82, 4pm ET
  { round: "r32", index:  9, kickoff: "2026-07-02T00:00:00Z" }, // M81, July 1 8pm ET
  { round: "r32", index: 10, kickoff: "2026-07-02T19:00:00Z" }, // M84, 3pm ET
  { round: "r32", index: 11, kickoff: "2026-07-02T23:00:00Z" }, // M83, 7pm ET
  { round: "r32", index: 12, kickoff: "2026-07-03T03:00:00Z" }, // M85, July 2 11pm ET
  { round: "r32", index: 13, kickoff: "2026-07-03T18:00:00Z" }, // M88, 2pm ET
  { round: "r32", index: 14, kickoff: "2026-07-03T22:00:00Z" }, // M86, 6pm ET
  { round: "r32", index: 15, kickoff: "2026-07-04T01:30:00Z" }, // M87, July 3 9:30pm ET

  // Round of 16 (8 matches, indices 0-7)
  { round: "r16", index: 0, kickoff: "2026-07-04T19:00:00Z" }, // 3pm ET
  { round: "r16", index: 1, kickoff: "2026-07-05T00:00:00Z" }, // July 4 8pm ET
  { round: "r16", index: 2, kickoff: "2026-07-05T23:00:00Z" }, // 7pm ET
  { round: "r16", index: 3, kickoff: "2026-07-06T00:00:00Z" }, // July 5 8pm ET
  { round: "r16", index: 4, kickoff: "2026-07-06T23:00:00Z" }, // 7pm ET
  { round: "r16", index: 5, kickoff: "2026-07-07T00:00:00Z" }, // July 6 8pm ET
  { round: "r16", index: 6, kickoff: "2026-07-07T20:00:00Z" }, // 4pm ET
  { round: "r16", index: 7, kickoff: "2026-07-07T20:00:00Z" }, // 4pm ET (parallel kickoff)

  // Quarterfinals (4 matches, indices 0-3)
  { round: "qf",  index: 0, kickoff: "2026-07-10T00:00:00Z" }, // July 9 8pm ET
  { round: "qf",  index: 1, kickoff: "2026-07-10T19:00:00Z" }, // 3pm ET
  { round: "qf",  index: 2, kickoff: "2026-07-12T01:00:00Z" }, // July 11 9pm ET
  { round: "qf",  index: 3, kickoff: "2026-07-12T01:00:00Z" }, // July 11 9pm ET (parallel)

  // Semifinals (2 matches, indices 0-1)
  { round: "sf",  index: 0, kickoff: "2026-07-14T23:00:00Z" }, // 7pm ET
  { round: "sf",  index: 1, kickoff: "2026-07-15T23:00:00Z" }, // 7pm ET

  // Third-place + Final (each at index 0 of its single-element round)
  { round: "third", index: 0, kickoff: "2026-07-19T01:00:00Z" }, // July 18 9pm ET
  { round: "final", index: 0, kickoff: "2026-07-19T23:00:00Z" }, // 7pm ET
];

/** Convenience for the RPC: flat list of every lockable unit. */
export const ALL_LOCKABLE_UNITS = {
  groups: GROUP_FIRST_KICKOFF_UTC,
  knockouts: KNOCKOUT_FIXTURES,
} as const;
```

**Date provenance:** All 44 UTC timestamps above were sourced June 3, 2026 from ESPN's schedule article and Wikipedia's knockout-stage page (links inline as comments). The engineer running the implementation PR should re-verify the latest from fifa.com — ESPN listed the Final as 3pm ET and Wikipedia as 7pm ET; we used Wikipedia, but the discrepancy is worth a final check before the migration ships. The fixture file ships with the PR and never updates after merge.

### `useTournamentClock()`

```ts
interface TournamentClock {
  /** Best estimate of server "now". Reactive — updates every 60s. */
  now: Date;
  /** True if we're falling back to device clock. */
  isUsingFallback: boolean;
}

export function useTournamentClock(): TournamentClock;
```

- On mount: `select extract(epoch from now()) as ts` against Supabase
- Tracks offset from device clock
- Re-fetches every 60s while the hook is mounted
- After two consecutive failures, flips to `isUsingFallback = true` and uses `Date.now() + lastKnownOffset`
- Components consume `now` directly in render — no manual interval needed

### `useBracketLockState()`

```ts
interface BracketLockState {
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  phase: "pre" | "phase1-closing" | "between" | "phase2-closing" | "complete";
  nextLockAt: Date | null;
  nextLockLabel: string | null;  // e.g. "Group E" or "R32 Match 5"
}

export function useBracketLockState(): BracketLockState;
```

Pure derivation from `useTournamentClock()` + fixture constants. No async, no state of its own.

### Phase derivation

```
pre              = no group has kicked off yet
phase1-closing   = some groups locked, some still open
between          = all groups locked, no knockout match has kicked off
phase2-closing   = some knockout matches locked, some still open
complete         = all 32 knockout matches locked
```

The `PhaseHeroCard` selects copy + color directly from this discriminator.

### Server-side RPC

```sql
-- supabase/migrations/000020_bracket_phased_locks.sql

-- 1. Drop the binary lock policy.
--    The `locked_at` COLUMN stays (nullable, unused). Future PRs may repurpose it.
drop policy if exists "Users can update unlocked own brackets" on public.brackets;

-- 2. Block ALL direct UPDATEs to brackets (force everything through the RPC).
--    Both personal (group_id IS NULL) and group brackets go through update_bracket().
create policy "No direct bracket updates"
  on public.brackets for update
  to authenticated
  using (false);

-- 3. Unique constraint on (user_id, group_id) with NULLS NOT DISTINCT so the RPC's
--    `on conflict` works for both personal (group_id IS NULL) and group brackets.
--    Requires Postgres 15+, which Supabase uses.
create unique index if not exists brackets_user_group_unique
  on public.brackets (user_id, group_id)
  nulls not distinct;

-- 4. Fixture constants embedded in SQL
--    Parity with packages/config/src/fixtures.ts enforced by
--    scripts/verify-fixtures.ts in CI.
create or replace function private.group_first_kickoff(group_id text)
  returns timestamptz language sql immutable as $$
  select case group_id
    when 'A' then '2026-06-11T20:00:00Z'::timestamptz
    -- ... 11 more
  end;
$$;

create or replace function private.knockout_kickoff(round text, idx int)
  returns timestamptz language sql immutable as $$
  select case round || ':' || idx::text
    when 'r32:0' then '2026-06-28T16:00:00Z'::timestamptz
    -- ... 31 more
  end;
$$;

-- 5. Validating upsert RPC (handles both personal AND group brackets).
--    Caller passes target_group_id = NULL for personal, or a groups.id UUID
--    for a shared group bracket.
create or replace function public.update_bracket(
  new_picks jsonb,
  target_group_id uuid default null
)
  returns jsonb
  language plpgsql
  security definer
as $$
declare
  invalid_groups text[] := array[]::text[];
  invalid_matches jsonb := '[]'::jsonb;
  saved_bracket public.brackets;
  group_key text;
  knockout jsonb;
  current_ts timestamptz := now();
begin
  -- If target_group_id is set, confirm caller is a member of that group.
  -- Membership check uses public.group_members(group_id, user_id) — present
  -- in migration 000004_groups.sql.
  if target_group_id is not null then
    if not exists (
      select 1 from public.group_members
       where group_id = target_group_id and user_id = auth.uid()
    ) then
      return jsonb_build_object('ok', false, 'code', 'NOT_GROUP_MEMBER');
    end if;
  end if;
  -- Validate group rankings: any group whose first kickoff has passed cannot change
  for group_key in select jsonb_object_keys(new_picks->'groupRankings') loop
    if current_ts >= private.group_first_kickoff(group_key) then
      -- Only flag if this differs from the existing saved value for this bracket
      if not exists (
        select 1 from public.brackets
         where user_id = auth.uid()
           and group_id is not distinct from target_group_id
           and picks->'groupRankings'->group_key = new_picks->'groupRankings'->group_key
      ) then
        invalid_groups := array_append(invalid_groups, group_key);
      end if;
    end if;
  end loop;

  -- Validate knockout picks: same per-match
  -- ... loop over r32, r16, qf, sf, final, third, build invalid_matches ...

  if array_length(invalid_groups, 1) > 0 or jsonb_array_length(invalid_matches) > 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'PICK_PAST_LOCKOUT',
      'invalidGroups', to_jsonb(invalid_groups),
      'invalidMatches', invalid_matches
    );
  end if;

  -- Upsert on (user_id, group_id). Works for personal (target_group_id NULL) and
  -- group brackets, using the NULLS NOT DISTINCT unique index above.
  insert into public.brackets (user_id, group_id, picks)
       values (auth.uid(), target_group_id, new_picks)
       on conflict (user_id, group_id) do update
         set picks = excluded.picks,
             updated_at = now()
       returning * into saved_bracket;

  return jsonb_build_object('ok', true, 'bracket', to_jsonb(saved_bracket));
end;
$$;

grant execute on function public.update_bracket(jsonb, uuid) to authenticated;
```

**Note:** the existing `brackets` table doesn't currently have a unique constraint on `(user_id, group_id)`. The migration adds one with `NULLS NOT DISTINCT` semantics (Postgres 15+, supported by Supabase) so the `on conflict (user_id, group_id)` upsert works for both personal (`group_id IS NULL`) and shared group brackets. The RPC enforces group membership before allowing a write to a group bracket.

## UX flow

### Phase Hero Card (top of bracket tab)

Single component, copy derived from `useBracketLockState().phase`. Five copy variants — see brainstorming Section 3 table.

### SubTabBar

Existing tabs: `Groups | R32 | R16 | QF | SF | Summary`. We keep all six visible always.

Additions:
- 🔒 icon when every unit in that tab is locked (e.g. all 12 groups → Groups tab shows lock)
- Subtle "PHASE 2" eyebrow on R32 / R16 / QF / SF *before* phase = `between`

### Group flow: dual CTA on Group L (the last group)

Replace single "Pick Knockouts →" button with a button row:

```
[  Save Group Stage  ]   [  Set Knockouts Now  →  ]
   gold border             gold fill (primary)
```

- **Save Group Stage**: calls `saveBracket()`, surfaces a confirmation sheet:
  > ✅ **Group picks saved.**
  > Come back **June 28** to pick the knockouts — or tap below to set them now.
  > **[Set Knockouts Now →]** **[Back to Bracket]**
- **Set Knockouts Now →**: calls `saveBracket()` *and* advances to R32.

The Summary screen keeps its existing "Save My Bracket" button untouched.

### Locked-unit rendering

- **Locked group in `GroupPicker`**: hide up/down arrows, hide "Reset group", show 🔒 chip in title, sub-line "Locked at kickoff, [date in local time]".
- **Locked match in `KnockoutRound`**: team-pick buttons become inert (no `onPress`), matchup gets a lock chip and "Locked at kickoff" sub-line.

### Late-joiner banner

Single dismissible banner at top of bracket tab. Shown when first opening the tab if `useBracketLockState()` reports any unit already locked.

> 🕒 **You're joining after some games started.** 4 groups are already locked. You can still play the other 8 groups + the full knockout round.

Dismiss state stored in AsyncStorage under `bracket.lateJoinerBannerDismissed`. Never shown again.

### June 27 reminder

`apps/mobile/src/features/bracket/notifications.ts` exports `scheduleKnockoutReminder()`:

- Called from `BracketProvider` after the first successful `getCurrentBracket()` resolves
- Schedules a single local notification for **2026-06-27T21:00 local time**:
  > ⚽ Phase 2 is open! Group stage is now locked. Pick your knockouts before R32 kicks off tomorrow.
- Idempotent: checks for existing scheduled notification with the same identifier (`bracket-phase2-open`) before scheduling
- If push permission denied, no-op silently

## Error handling

### Server clock failure
- `useTournamentClock` shows `isUsingFallback: true`
- A persistent banner appears on the bracket tab: ⚠️ "Couldn't reach server clock. Lock times shown may drift slightly."
- The RPC is still authoritative on save

### RPC partial-save race (the user is editing as a kickoff passes)
- RPC returns `{ ok: false, code: "PICK_PAST_LOCKOUT", invalidGroups, invalidMatches }`
- Client:
  1. Drops invalid picks from local state (reverts to previously saved values from `getCurrentBracket()`)
  2. Toast: "Group A locked while you were editing — your other picks were saved."
  3. Force-refresh `useBracketLockState`
  4. **Retries** the save once with the cleaned picks so still-valid changes do land. The retry can't infinite-loop: the cleaned picks no longer include any locked unit, so a second `PICK_PAST_LOCKOUT` is impossible unless another kickoff passes within the same handler tick (in which case the user sees a second toast and we stop).
- Never silent-fails the whole save

### Anonymous user
- Unchanged: bracket tab is browsable, picks held in local state, save prompts sign-up
- No notification scheduled (no user → no `BracketProvider` effect runs)

## Testing strategy

### Unit tests
- `useBracketLockState`: tabular tests across 5 phases. Mocked `useTournamentClock` returns synthetic dates pre / mid / post each fixture
- Fixture file validation: every UTC string parses to a valid Date, knockout indices are unique within their round, group keys cover all 12 groups exactly

### Integration / RPC
- `update_bracket` RPC test cases (Supabase pgTAP or equivalent):
  - All picks before kickoff → succeeds
  - Save with all 12 groups + R32 → succeeds and persists
  - Save where Group A kickoff has passed AND Group A pick differs from existing → rejected with `invalidGroups: ["A"]`
  - Save where Group A pick equals existing → succeeds (no-op for locked unit)
  - Mixed: invalid Group A + valid Group B + valid R32 → rejected as a whole (atomic; client handles partial save by retrying)

### Manual / Expo
- Walk through the 5 phase hero states by mocking `useTournamentClock` to return a fake date
- Verify late-joiner banner appears once and dismisses
- Verify push notification fires (or doesn't, gracefully) under both permission states

### Parity check
- `pnpm verify:fixtures` parses both `fixtures.ts` and the SQL migration's CASE statements, asserts they match exactly. Runs in CI on every PR.

## Open questions resolved during brainstorming

(All resolved — listed here for the implementation plan to inherit context.)

1. Lockout granularity? → per-group + per-match
2. Phase 2 access? → always editable until R32 kickoff
3. Source of truth? → static TS file mirrored in SQL
4. Server clock? → Supabase `now()` with device fallback
5. Enforcement? → RPC with embedded fixture validation, RLS blocks direct updates
6. What happens if user never opens bracket? → treated as late joiner, score 0 for locked units
7. Notification? → single local push on June 27 9pm local
8. Concurrent device edits? → last-save-wins, explicit non-goal

## Out of scope (named, with reasoning)

- Game results ingest / scoring data
- Auto-fill knockout matchups from group results
- Per-phase leaderboard splits
- Scoring rule changes
- Realtime bracket sync across devices
- Email / SMS notification fallback
- A `tournament_fixtures` Supabase table (deferred — TS+SQL duplication is fine for v1)
- Bracket-result reveal animations
- Migrating existing brackets (none exist in production)
- **Phase-locked group bracket UI surface** — phased lockout *enforcement* applies to both personal and group brackets via the RPC, but the UX surface (Phase Hero card, dual CTA, etc.) may live only on the personal bracket tab in this PR if a separate group-bracket UI hasn't been built yet. The implementation PR should audit the current group-bracket entry point in `apps/mobile/src/features/groups/` and either: (a) propagate the same UI components, or (b) explicitly note which UI surfaces don't get the phase treatment in v1, knowing the server enforcement still applies.

## Rollout

1. Open PR against `main` (after pinging Donaven re: migration `000020`)
2. Local smoke test with mocked clock for each phase
3. Apply migration to Supabase dev project; run RPC test cases
4. Merge to `main` before **June 11, 2026**
5. Verify on a real device the day before June 11

## File summary

- **New**: 8 files (~750 LOC estimated)
- **Modified**: 9 files (~300 LOC delta)
- **Migration**: 1 SQL file (~200 LOC including embedded fixture constants)
- **Roughly the size of PR #11 + a small migration.**
