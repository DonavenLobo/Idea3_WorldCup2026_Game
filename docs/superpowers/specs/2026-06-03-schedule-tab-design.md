# Schedule Tab — Design

- **Date:** 2026-06-03
- **Status:** Approved (pending spec review)
- **Feature:** World Cup 2026 fixtures + stadiums on the Schedule tab

## Summary

Replace the placeholder Schedule tab with a real tournament schedule built from the
official 2026 fixture list (`worldcup.json`) and venue list (`worldcup.stadiums.json`).

Fixtures render chronologically grouped by the **user's local calendar day**, with
kickoff times converted to the **device timezone**, team flags, filter chips, and a
tappable venue that opens stadium detail. The schedule structure ships as **static,
typed data in `packages/config`** (the canonical source of truth), with a **Supabase
overlay** (`match_results` + `match_events`, read-only to clients) that layers live
scores, status, and resolved knockout teams on top when present.

The live data **feed** (an Edge Function ingesting an external provider) is **deferred
to Phase 2** and documented here, not built now. Phase 1 lays all the groundwork so the
UI is overlay-ready and the feed can be dropped in later.

## Goals

- A polished, offline-capable Schedule tab driven by static config data.
- Kickoff times always shown in the **user's local timezone** (user is in UTC).
- Every fixture's **ground linked to its stadium** (name, capacity, location, map).
- Team flags for the 48-team field; graceful handling of knockout placeholders.
- DB groundwork (tables + RLS + read/merge path) so live overlay data "just shows up"
  when it exists, with **no client writes**.

## Non-goals (Phase 1)

- No real external-provider integration / API key / cron (Phase 2, documented below).
- No Edge Function built in Phase 1 (deferred per decision).
- Fixture rows do **not** deep-link into the existing `match/[matchId]` screen (that
  screen is for predictions/bounties; out of scope here). Only the **venue** is tappable.
- No client-side writes to results/events (clients only read).

## Decisions (locked)

| Question | Decision |
| --- | --- |
| Where does schedule data live? | **Hybrid:** static skeleton in `packages/config`; dynamic overlay in Supabase. |
| Team display | **48-team emoji flag map** in config; knockout slots render as neutral badges. May move to custom per-nation badges later. |
| Layout | **Chronological by local day** + filter chips (All / Group stage / Knockouts / My team). |
| Overlay scope | Scores + status + resolved knockout teams (all nullable). |
| Live feed | **Deferred to Phase 2.** Event-driven (goals, red cards), fires push via existing infra. |
| Edge function in Phase 1? | **No.** Build tables + read path now; document feed design for later. |

## Phasing

- **Phase 1 (build now):** static config data + generator, Schedule tab UI, timezone
  conversion, stadium linking, flags, filters; Supabase `match_results` + `match_events`
  tables with public-read RLS; mobile read/merge path. Fully demoable on static data,
  and overlay rows (if manually inserted) show through.
- **Phase 2 (later):** Edge Function with provider adapter + mock, name-alias map,
  Supabase Cron, and goal/red-card push notifications. Spec'd in "Deferred: Live Feed".

---

## 1. Static data — `packages/config`

### Source + generator

- Move the two source files into the package as canonical input:
  - `packages/config/src/data/worldcup.json`
  - `packages/config/src/data/worldcup.stadiums.json`
- A generator script `scripts/build-schedule.mjs` transforms the JSON into committed,
  typed modules (no runtime build step; the app imports plain `.ts`):
  - `packages/config/src/schedule.ts` → `WORLD_CUP_FIXTURES: Fixture[]`
  - `packages/config/src/stadiums.ts` → `WORLD_CUP_STADIUMS: Stadium[]`
  - `teamFlags.ts` is **hand-authored** (name → emoji); the generator/tests assert
    every non-placeholder team name has a flag.
- Add a `package.json` script (e.g. `build:schedule`) to re-run the generator if the
  source JSON changes. Generated files are committed.

### Generator responsibilities

1. **Kickoff → UTC.** Parse `date` (`2026-06-11`) + `time` (`13:00 UTC-6`): extract
   `HH:MM` and the signed offset, build `2026-06-11T13:00:00-06:00`, convert to a UTC
   ISO string (`kickoffUtc`). Offsets are explicit per match, so DST is already baked in
   — no tz database needed.
2. **Canonical match number (`num`).** Knockout matches already carry `num` (73–104).
   Group matches are assigned **1–72 by `kickoffUtc` order** (stable tie-break on
   venue + teams). This is an **internal** join key only; the Phase 2 provider matches by
   date + teams, never by our `num`, so it need not equal official match numbers.
3. **Stage.** Map `round` → `stage`:
   `Matchday N` → `group`; `Round of 32` → `r32`; `Round of 16` → `r16`;
   `Quarter-final` → `qf`; `Semi-final` → `sf`; `Match for third place` → `third`;
   `Final` → `final`.
4. **Coords → decimal.** Stadium `coords` come in DMS (`49°16'36"N 123°6'43"W`) **and**
   decimal (`37.403°N 121.970°W`) forms — handle both → `{ lat, lng }`.
5. **Validate (fail the build on violation):**
   - every fixture `venueCity` exists in stadium cities;
   - `num` values are unique and cover the expected counts (72 group + 32 knockout);
   - every non-placeholder team name has a flag in `teamFlags.ts`.

### Types (colocated in config, following the `NationConfig` precedent)

```ts
// schedule.ts
export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface Fixture {
  num: number;            // canonical 1..104 (internal join key)
  round: string;          // raw label e.g. "Matchday 1", "Round of 32"
  stage: MatchStage;
  group: string | null;   // "Group A".. or null for knockouts
  kickoffUtc: string;     // ISO UTC, precomputed
  team1: string;          // nation name OR placeholder ("2A", "W74", "3A/B/C/D/F", "L101")
  team2: string;
  venueCity: string;      // exact join key == Stadium.city
}

// stadiums.ts
export interface Stadium {
  city: string;           // join key
  name: string;
  capacity: number;
  cc: string;             // ISO host country (for venue flag)
  timezone: string;       // "UTC-7" (display only)
  lat: number;
  lng: number;
}
```

```ts
// teamFlags.ts
export const TEAM_FLAGS: Record<string, string>; // 48 real teams → emoji flag
export function flagForTeam(name: string): string | undefined; // undefined ⇒ placeholder
```

`flagForTeam` returning `undefined` is the single source of "is this a placeholder slot"
— no separate flag needed on `Fixture`.

---

## 2. Supabase overlay — groundwork now

Migration `supabase/migrations/000023_match_results.sql`. Both tables are **global and
admin-maintained**; **RLS allows public `SELECT` only** (anon + authenticated). No
client insert/update/delete — only the service role (Phase 2 Edge Function) writes.

### `match_results` (per-match summary the UI reads)

| column | type | notes |
| --- | --- | --- |
| `match_num` | `int` PK | canonical fixture number |
| `status` | `text` | `check in ('upcoming','live','final')` |
| `home_score` | `int` null | team1 running score |
| `away_score` | `int` null | team2 running score |
| `team1_resolved` | `text` null | resolved nation for a knockout slot (e.g. `2A` → name) |
| `team2_resolved` | `text` null | resolved nation for a knockout slot |
| `updated_at` | `timestamptz` | default `now()` |

An **absent row** ⇒ the static fixture shows as-is (placeholder labels intact). A present
row overlays whatever fields are non-null.

### `match_events` (event-driven log; drives scores + Phase 2 pushes)

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `match_num` | `int` | FK-ish to fixtures (no fixtures table; plain int) |
| `minute` | `int` null | match minute |
| `type` | `text` | `check in ('goal','red_card')` |
| `side` | `text` | `check in ('home','away')` |
| `player` | `text` null | scorer / carded player |
| `created_at` | `timestamptz` | default `now()` |

Indexed on `match_num`. Read-only to clients via RLS (public `SELECT`).

---

## 3. Mobile feature — `apps/mobile/src/features/schedule/`

Thin route `app/(tabs)/schedule.tsx` imports `ScheduleScreen` from the feature
(mirrors how `bracket.tsx` consumes its feature module).

```
features/schedule/
  api/results.ts        getMatchResults(): React Query fetch + row→MatchResult map
  hooks/useSchedule.ts  merge static fixtures + overlay, apply filter, group by local day
  components/
    ScheduleScreen.tsx  SectionList + FilterChips + StadiumDetailSheet host
    FilterChips.tsx     All / Group stage / Knockouts / My team
    DaySectionHeader.tsx
    FixtureRow.tsx      teams+flags, local kickoff, venue, score/status pill
    TeamLabel.tsx       flag + name, or neutral badge for placeholders
    StadiumDetailSheet.tsx  modal: name, host flag, capacity, venue tz, Open in Maps
  utils.ts              local-day grouping, filtering, maps URL builder (coords are
                        already decimal in config), "my team" name match
  types.ts              MatchResult, MatchStatus, ScheduledMatch (merged), FilterKey
  index.ts              barrel
```

### Data flow

- `getMatchResults()` selects all `match_results` (and, where needed, `match_events`)
  and maps to camelCase `MatchResult[]`. Fetched via React Query; refetch on focus +
  pull-to-refresh. The query degrades to empty on error (schedule still renders static).
- `useSchedule()` builds `ScheduledMatch[]` = `Fixture` + optional `MatchResult`
  (resolved team names override placeholders; score/status attached), applies the active
  filter, then groups into `{ title: localDay, data: ScheduledMatch[] }[]` for the
  `SectionList`.

### Merged view model

```ts
interface ScheduledMatch {
  fixture: Fixture;
  result?: MatchResult;          // overlay if present
  team1Display: string;          // resolved name or original/placeholder
  team2Display: string;
  kickoffLocal: Date;            // from fixture.kickoffUtc
}
```

---

## 4. UI / UX

- **Sections:** one per local calendar day (`Jun 11`, `Jun 12`, …) in kickoff order.
- **FixtureRow:** `team1` ▸ `team2` with flags; placeholders (`2A`, `W74`,
  `3A/B/C/D/F`, `L101`) render as a neutral pill instead of a flag. Local kickoff time
  (e.g. `7:00 PM`), venue name, and a `LIVE`/`FT` status pill + score when a result
  exists.
- **Filter chips:** All / Group stage / Knockouts / **My team**. "My team" appears only
  if the user's selected nation (from `profile.selectedNationCode` → `SUPPORTED_NATIONS`
  name) matches a team name in the field; otherwise hidden (provisional dev codes mostly
  won't match the real field — graceful degradation).
- **Stadium detail (tap venue):** a modal / bottom-sheet (avoids encoding
  `"New York/New Jersey (East Rutherford)"` into a route param) showing stadium name,
  host-country flag (`cc`), capacity, venue-local timezone, and **Open in Maps**
  (`https://maps.apple.com/?ll=lat,lng` / geo URL from decimal coords).
- **Theme:** existing tokens (`colors.pitch` background, `colors.gold` accents,
  `spacing`, `radius`, `typography`), consistent with bracket/home/leaderboard.

## 5. Timezone handling

- Source offsets are explicit per match → `kickoffUtc` precomputed at build time.
- Display uses `new Date(kickoffUtc)` + `Intl.DateTimeFormat` / `toLocale*` with the
  **device default timezone** (no new dependency, no tz database).
- **Day grouping** keys on the **local** calendar day, so a late kickoff that falls on a
  different local date groups correctly for the user.

## 6. Team display / flags

- Emoji flags via `flagForTeam(name)` (consistent with `LeaderboardRow`).
- Knockout placeholders → neutral badge.
- **Future:** swap emoji for custom per-nation badge assets (would change only
  `TeamLabel` + the flag source; data model unaffected).

## 7. Testing / validation

- **TDD on pure helpers:** offset→UTC parse, `num` assignment, and DMS→decimal
  (`parseCoords`) live as pure functions the generator imports — unit-tested. App-side
  utils tested: local-day grouping, filtering, "my team" name match.
- Generator self-assertions (ground↔stadium, unique nums, flag coverage).
- `pnpm typecheck`, `pnpm lint`.
- `pnpm test:visual` smoke check on the `/schedule` route.

---

## Deferred: Live Feed (Phase 2 — documented, not built now)

Build later when wiring a real provider. Event-driven (goals, red cards), not polling.

**Edge Function `supabase/functions/sync-match-results/`:**

- `MatchResultsProvider` adapter interface:
  `fetchEvents(sinceIso): Promise<ProviderEvent[]>` (+ fixtures/lineups as needed).
- A **mock provider** (canned goal/red-card events) for fully-offline testing — useful
  to demo the pipe + a push without a vendor key.
- **Name-normalization / alias map** to match a provider fixture → our canonical `num`
  by **date + both team names**: e.g. `USA`→`United States`, `Turkey`→`Türkiye`,
  `South Korea`→`Korea Republic`, `DR Congo`→`Congo DR`, `Curaçao`/`Cape Verde`/
  `Bosnia & Herzegovina` variants, etc.
- On each new goal/red-card event: insert into `match_events`, update the
  `match_results` summary (increment score, set `status='live'`/`'final'`, resolve
  knockout team slots), and call the existing **`send-push-notification`** function
  (reuses `device_push_tokens` from migration `000020`).
- **Scheduling:** Supabase **Cron** (pg_cron) on a configurable interval, plus manual
  invoke for testing. Cron starts **disabled** until the tournament/provider is live.
- **Config:** `.env.example` placeholders `MATCH_RESULTS_PROVIDER`,
  `MATCH_RESULTS_API_KEY` (documented "wire up later"; unused in Phase 1).
- Candidate provider: API-Football (api-sports.io) — WC2026 coverage, free tier — behind
  the adapter so it's swappable.

## Open questions / future

- Custom per-nation badge assets (replacing emoji flags).
- Linking a fixture row into `match/[matchId]` once that screen has content.
- Realtime subscription on `match_results` for live in-app updates (vs fetch/refresh).

## File-change summary (Phase 1)

**New**
- `packages/config/src/data/worldcup.json`, `worldcup.stadiums.json` (moved from root)
- `packages/config/src/schedule.ts`, `stadiums.ts`, `teamFlags.ts` (generated/authored)
- `scripts/build-schedule.mjs`
- `supabase/migrations/000023_match_results.sql`
- `apps/mobile/src/features/schedule/**` (api, hooks, components, utils, types, index)

**Changed**
- `packages/config/src/index.ts` (export new modules)
- `apps/mobile/app/(tabs)/schedule.tsx` (placeholder → `ScheduleScreen`)
- root `package.json` (`build:schedule` script)
- `.env.example` (documented Phase 2 placeholders)
