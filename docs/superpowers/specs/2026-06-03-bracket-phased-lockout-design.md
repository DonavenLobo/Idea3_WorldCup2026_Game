# Bracket: Phased Lockout Design

Status: **Spec — awaiting review**
Author: Denver (with Claude)
Last updated: June 3, 2026
Target branch: `feature/bracket-phased-lockout`

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
4. **Source of truth**: static `fixtures.ts` in `packages/config`. No external API. Mirrored as SQL constants in the validating RPC.
5. **Server clock**: read from Supabase `now()`, fall back to device clock if the call fails (with a one-time warning banner).
6. **Lock state is derived, not stored.** No new columns or tables. The RPC validates each save against fixture kickoffs.
7. **Lock enforcement**: drop binary `locked_at is null` RLS; route all updates through `update_bracket(jsonb)` RPC that validates per-pick.
8. **Times in UI**: countdowns are relative ("locks in 2h 14m"); absolute times use device local timezone.
9. **Default rankings count as valid picks** — no "are you sure" friction on save.
10. **Last-save-wins** for concurrent edits across devices. Realtime sync is out of scope.
11. **Scope: personal brackets only.** The `brackets` table supports both personal (`group_id IS NULL`) and shared group brackets (`group_id` set). This PR applies the phased lockout only to personal brackets. Group brackets keep the existing behavior and are revisited in a later PR.

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
| `apps/mobile/src/features/bracket/BracketContext.tsx` | Add lock helpers; route `saveBracket` through RPC; handle `PICK_PAST_LOCKOUT` partial save |
| `apps/mobile/src/features/bracket/api/brackets.ts` | New `updateBracket(picks)` calling the RPC |
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

export const GROUP_FIRST_KICKOFF_UTC: Record<GroupId, string> = {
  A: "2026-06-11T20:00:00Z",
  // ... 11 more, sourced from the official FIFA schedule
};

export const KNOCKOUT_FIXTURES: readonly KnockoutFixture[] = [
  { round: "r32", index: 0, kickoff: "2026-06-28T16:00:00Z" },
  // ... 31 more
];

/** Convenience for the RPC: flat list of every lockable unit. */
export const ALL_LOCKABLE_UNITS = {
  groups: GROUP_FIRST_KICKOFF_UTC,
  knockouts: KNOCKOUT_FIXTURES,
} as const;
```

**Filling in real dates:** Denver pulls the FIFA-published schedule and pastes the 44 ISO timestamps before opening the PR. The dates are public and never change.

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

-- 2. Block direct UPDATEs to personal brackets (force through RPC).
--    Group brackets (group_id IS NOT NULL) keep existing UPDATE behavior — they
--    are out of scope for the phased lockout in this PR.
create policy "No direct personal-bracket updates"
  on public.brackets for update
  to authenticated
  using (group_id is not null and auth.uid() = user_id)
  with check (group_id is not null and auth.uid() = user_id);

-- 3. Partial unique index so RPC `on conflict (user_id)` works for personal brackets.
create unique index if not exists brackets_personal_user_unique
  on public.brackets (user_id)
  where group_id is null;

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

-- 5. Validating upsert RPC (personal brackets only — group_id IS NULL)
create or replace function public.update_bracket(new_picks jsonb)
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
  -- Validate group rankings: any group whose first kickoff has passed cannot change
  for group_key in select jsonb_object_keys(new_picks->'groupRankings') loop
    if current_ts >= private.group_first_kickoff(group_key) then
      -- Only flag if this differs from the existing saved value
      if not exists (
        select 1 from public.brackets
         where user_id = auth.uid()
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

  -- Personal bracket only (group_id IS NULL). Relies on the partial unique index above.
  insert into public.brackets (user_id, group_id, picks)
       values (auth.uid(), null, new_picks)
       on conflict (user_id) where group_id is null do update
         set picks = excluded.picks,
             updated_at = now()
       returning * into saved_bracket;

  return jsonb_build_object('ok', true, 'bracket', to_jsonb(saved_bracket));
end;
$$;

grant execute on function public.update_bracket(jsonb) to authenticated;
```

**Note:** the existing `brackets` table doesn't currently have a unique constraint on `user_id` alone (it includes `group_id`). The migration adds a partial unique index for personal brackets (`group_id IS NULL`) — included in the SQL block above — so the `on conflict` clause works. Group brackets (multi-tenant in a Supabase group) stay as-is; this PR doesn't touch the group bracket flow.

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
  > ⚽ Phase 2 is open! Group stage is locked. Pick your knockouts before R32 kicks off tomorrow.
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
