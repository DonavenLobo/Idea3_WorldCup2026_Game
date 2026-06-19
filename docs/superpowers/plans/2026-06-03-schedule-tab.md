# Schedule Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Schedule tab with a real, timezone-aware World Cup 2026 fixture list backed by static config data, with stadium linking, team flags, filters, and a Supabase results overlay (read-only).

**Architecture:** A generator script transforms `worldcup.json` + `worldcup.stadiums.json` into typed, validated modules in `packages/config` (kickoff times precomputed to UTC; every match gets a canonical number). The mobile `schedule` feature reads those statics, optionally overlays a public-read Supabase `match_results` table via React Query, converts kickoffs to the device timezone, groups by local day, and renders a `SectionList`. The live ingestion Edge Function is **deferred to Phase 2** (documented in the spec, not built here).

**Tech Stack:** pnpm monorepo, TypeScript (strict, `noUncheckedIndexedAccess`), Expo + React Native + Expo Router, `@tanstack/react-query`, Supabase (Postgres + RLS), Vitest (new, for pure-logic unit tests), Node ESM generator script.

**Spec:** `docs/superpowers/specs/2026-06-03-schedule-tab-design.md`

**Conventions to follow:**
- Thin route files; feature logic under `apps/mobile/src/features/<feature>/` (`api/ components/ hooks/ utils.ts types.ts index.ts`), mirroring the `bracket` feature.
- Static reference data + its types live in `packages/config` (like `nations.ts`).
- Supabase tables use `create table if not exists`, `enable row level security`, explicit policies. Clients never write results.
- Theme tokens from `apps/mobile/src/theme/{colors,spacing,radius,typography}`.

---

## File Structure

**New — generator + source data**
- `scripts/schedule-helpers.mjs` — pure ESM helpers (kickoff→UTC, stage map, match numbering, coord parsing, placeholder detection).
- `scripts/schedule-helpers.test.mjs` — Vitest tests for the helpers.
- `scripts/build-schedule.mjs` — reads source JSON, validates, emits the generated config modules.
- `scripts/data/team-flags.json` — hand-authored name→emoji map (48 teams).
- `packages/config/src/data/worldcup.json`, `worldcup.stadiums.json` — already moved here (generator input).

**New — generated config data (committed; `pnpm build:schedule` regenerates)**
- `packages/config/src/schedule.data.ts` — `WORLD_CUP_FIXTURES`.
- `packages/config/src/stadiums.data.ts` — `WORLD_CUP_STADIUMS`.
- `packages/config/src/teamFlags.data.ts` — `TEAM_FLAGS`.

**New — hand-authored config (types + helpers + re-export)**
- `packages/config/src/schedule.ts` — `MatchStage`, `Fixture`, re-export fixtures.
- `packages/config/src/stadiums.ts` — `Stadium`, `getStadiumByCity`, re-export stadiums.
- `packages/config/src/teamFlags.ts` — `TeamFlagMap`, `flagForTeam`, re-export flags.

**New — Supabase**
- `supabase/migrations/000023_match_results.sql` — `match_results` + `match_events`, public-read RLS.

**New — mobile feature `apps/mobile/src/features/schedule/`**
- `types.ts`, `utils.ts`, `utils.test.ts`
- `api/results.ts`
- `hooks/useSchedule.ts`
- `components/{TeamLabel,FixtureRow,FilterChips,DaySectionHeader,StadiumDetailSheet,ScheduleScreen}.tsx`
- `index.ts`

**New — test infra**
- `vitest.config.ts`, root `package.json` script.

**Modified**
- `packages/config/src/index.ts` — export new modules.
- `apps/mobile/app/(tabs)/schedule.tsx` — placeholder → `ScheduleScreen`.
- root `package.json` — `build:schedule`, `test:unit` scripts.
- `.env.example` — documented Phase 2 placeholders.

---

## Task 1: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Modify: root `package.json`

- [ ] **Step 1: Add Vitest dev dependency**

Run: `pnpm add -D -w vitest`
Expected: vitest added to root `devDependencies`, lockfile updated.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const resolvePkg = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@gogaffa/config": resolvePkg("./packages/config/src/index.ts"),
      "@gogaffa/types": resolvePkg("./packages/types/src/index.ts"),
      "@gogaffa/game-engine": resolvePkg("./packages/game-engine/src/index.ts"),
      "@gogaffa/card-renderer": resolvePkg("./packages/card-renderer/src/index.ts"),
      "@gogaffa/ui": resolvePkg("./packages/ui/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: [
      "scripts/**/*.test.mjs",
      "packages/**/*.test.ts",
      "apps/**/src/**/*.test.ts"
    ]
  }
});
```

- [ ] **Step 3: Add root scripts**

In root `package.json` `scripts`, add:

```json
"test:unit": "vitest run --passWithNoTests",
"build:schedule": "node scripts/build-schedule.mjs"
```

- [ ] **Step 4: Verify the runner works with no tests yet**

Run: `pnpm test:unit`
Expected: exits 0, "No test files found ... passWithNoTests".

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore: add vitest for pure-logic unit tests"
```

---

## Task 2: Generator pure helpers (TDD)

**Files:**
- Create: `scripts/schedule-helpers.mjs`
- Test: `scripts/schedule-helpers.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import { describe, expect, it } from "vitest";
import {
  assignMatchNumbers,
  isPlaceholderTeam,
  parseCoords,
  parseKickoffUtc,
  stageForRound
} from "./schedule-helpers.mjs";

describe("parseKickoffUtc", () => {
  it("converts a local kickoff with offset to UTC ISO", () => {
    expect(parseKickoffUtc("2026-06-11", "13:00 UTC-6")).toBe("2026-06-11T19:00:00.000Z");
  });
  it("rolls over to the next day when needed", () => {
    expect(parseKickoffUtc("2026-06-11", "20:00 UTC-6")).toBe("2026-06-12T02:00:00.000Z");
  });
  it("handles UTC-4 venues", () => {
    expect(parseKickoffUtc("2026-06-18", "12:00 UTC-4")).toBe("2026-06-18T16:00:00.000Z");
  });
  it("throws on malformed input", () => {
    expect(() => parseKickoffUtc("2026-06-11", "nope")).toThrow();
  });
});

describe("stageForRound", () => {
  it("maps matchdays to group", () => {
    expect(stageForRound("Matchday 1")).toBe("group");
    expect(stageForRound("Matchday 17")).toBe("group");
  });
  it("maps knockout labels", () => {
    expect(stageForRound("Round of 32")).toBe("r32");
    expect(stageForRound("Round of 16")).toBe("r16");
    expect(stageForRound("Quarter-final")).toBe("qf");
    expect(stageForRound("Semi-final")).toBe("sf");
    expect(stageForRound("Match for third place")).toBe("third");
    expect(stageForRound("Final")).toBe("final");
  });
  it("throws on unknown rounds", () => {
    expect(() => stageForRound("Mystery")).toThrow();
  });
});

describe("isPlaceholderTeam", () => {
  it("treats real nation names as non-placeholders", () => {
    for (const name of ["Mexico", "South Africa", "Bosnia & Herzegovina", "DR Congo", "Curaçao"]) {
      expect(isPlaceholderTeam(name)).toBe(false);
    }
  });
  it("detects knockout slot labels", () => {
    for (const name of ["2A", "1E", "3A/B/C/D/F", "W74", "L101"]) {
      expect(isPlaceholderTeam(name)).toBe(true);
    }
  });
});

describe("assignMatchNumbers", () => {
  it("keeps explicit knockout numbers and numbers group matches by kickoff order", () => {
    const input = [
      { team1: "B", team2: "C", ground: "Z", kickoffUtc: "2026-06-12T00:00:00.000Z" },
      { team1: "A", team2: "D", ground: "Y", kickoffUtc: "2026-06-11T00:00:00.000Z" },
      { num: 73, team1: "W", team2: "X", ground: "Q", kickoffUtc: "2026-06-28T00:00:00.000Z" }
    ];
    const out = assignMatchNumbers(input);
    expect(out.find((m) => m.team1 === "A").num).toBe(1);
    expect(out.find((m) => m.team1 === "B").num).toBe(2);
    expect(out.find((m) => m.team1 === "W").num).toBe(73);
  });
});

describe("parseCoords", () => {
  it("parses DMS coordinates", () => {
    expect(parseCoords("49°16'36\"N 123°6'43\"W")).toEqual({ lat: 49.27667, lng: -123.11194 });
  });
  it("parses decimal coordinates", () => {
    expect(parseCoords("37.403°N 121.970°W")).toEqual({ lat: 37.403, lng: -121.97 });
  });
  it("parses fractional seconds", () => {
    const out = parseCoords("40°48'48.7\"N 74°4'27.7\"W");
    expect(out.lat).toBeCloseTo(40.81353, 4);
    expect(out.lng).toBeCloseTo(-74.07436, 4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run scripts/schedule-helpers.test.mjs`
Expected: FAIL — cannot resolve `./schedule-helpers.mjs`.

- [ ] **Step 3: Implement the helpers**

```js
// scripts/schedule-helpers.mjs
// Pure helpers for building the static schedule config. No I/O here.

const round5 = (value) => Math.round(value * 1e5) / 1e5;

export function parseKickoffUtc(date, time) {
  const [clock, tz] = String(time).trim().split(/\s+/);
  if (!clock || !tz) throw new Error(`Bad time string: "${time}"`);
  const offset = tz.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!offset) throw new Error(`Bad UTC offset: "${tz}"`);
  const [hh, mm] = clock.split(":");
  if (hh === undefined || mm === undefined) throw new Error(`Bad clock: "${clock}"`);
  const sign = offset[1];
  const offHours = offset[2].padStart(2, "0");
  const offMins = (offset[3] ?? "00").padStart(2, "0");
  const iso = `${date}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00${sign}${offHours}:${offMins}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Bad datetime: "${iso}"`);
  return parsed.toISOString();
}

export function stageForRound(round) {
  if (String(round).startsWith("Matchday")) return "group";
  switch (round) {
    case "Round of 32": return "r32";
    case "Round of 16": return "r16";
    case "Quarter-final": return "qf";
    case "Semi-final": return "sf";
    case "Match for third place": return "third";
    case "Final": return "final";
    default: throw new Error(`Unknown round: "${round}"`);
  }
}

export function isPlaceholderTeam(name) {
  return /\//.test(name) || /^\d/.test(name) || /^[WL]\d/.test(name);
}

export function assignMatchNumbers(matches) {
  const sortKey = (m) => `${m.kickoffUtc}|${m.ground}|${m.team1}|${m.team2}`;
  const groupMatches = matches.filter((m) => m.num === undefined || m.num === null);
  const ordered = [...groupMatches].sort((a, b) =>
    sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0
  );
  const numByMatch = new Map();
  ordered.forEach((m, index) => numByMatch.set(m, index + 1));
  return matches.map((m) => ({ ...m, num: m.num ?? numByMatch.get(m) }));
}

export function parseCoords(input) {
  const component = /(\d+(?:\.\d+)?)°(?:\s*(\d+(?:\.\d+)?)['′])?(?:\s*(\d+(?:\.\d+)?)["″])?\s*([NSEW])/g;
  const parts = [];
  let match;
  while ((match = component.exec(input)) !== null) {
    const deg = parseFloat(match[1]);
    const min = match[2] ? parseFloat(match[2]) : 0;
    const sec = match[3] ? parseFloat(match[3]) : 0;
    let value = deg + min / 60 + sec / 3600;
    if (match[4] === "S" || match[4] === "W") value = -value;
    parts.push({ dir: match[4], value });
  }
  const lat = parts.find((p) => p.dir === "N" || p.dir === "S");
  const lng = parts.find((p) => p.dir === "E" || p.dir === "W");
  if (!lat || !lng) throw new Error(`Bad coords: "${input}"`);
  return { lat: round5(lat.value), lng: round5(lng.value) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run scripts/schedule-helpers.test.mjs`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add scripts/schedule-helpers.mjs scripts/schedule-helpers.test.mjs
git commit -m "feat: schedule generator pure helpers"
```

---

## Task 3: Team flag source data

**Files:**
- Create: `scripts/data/team-flags.json`

- [ ] **Step 1: Create the 48-team flag map**

```json
{
  "Mexico": "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  "Czech Republic": "🇨🇿",
  "Canada": "🇨🇦",
  "Bosnia & Herzegovina": "🇧🇦",
  "Qatar": "🇶🇦",
  "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷",
  "Morocco": "🇲🇦",
  "Haiti": "🇭🇹",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA": "🇺🇸",
  "Paraguay": "🇵🇾",
  "Australia": "🇦🇺",
  "Turkey": "🇹🇷",
  "Germany": "🇩🇪",
  "Curaçao": "🇨🇼",
  "Ivory Coast": "🇨🇮",
  "Ecuador": "🇪🇨",
  "Netherlands": "🇳🇱",
  "Japan": "🇯🇵",
  "Sweden": "🇸🇪",
  "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪",
  "Egypt": "🇪🇬",
  "Iran": "🇮🇷",
  "New Zealand": "🇳🇿",
  "Spain": "🇪🇸",
  "Cape Verde": "🇨🇻",
  "Saudi Arabia": "🇸🇦",
  "Uruguay": "🇺🇾",
  "France": "🇫🇷",
  "Senegal": "🇸🇳",
  "Iraq": "🇮🇶",
  "Norway": "🇳🇴",
  "Argentina": "🇦🇷",
  "Algeria": "🇩🇿",
  "Austria": "🇦🇹",
  "Jordan": "🇯🇴",
  "Portugal": "🇵🇹",
  "DR Congo": "🇨🇩",
  "Uzbekistan": "🇺🇿",
  "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croatia": "🇭🇷",
  "Ghana": "🇬🇭",
  "Panama": "🇵🇦"
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/data/team-flags.json
git commit -m "feat: world cup 2026 team flag map"
```

---

## Task 4: Config types + helpers (hand-authored)

**Files:**
- Create: `packages/config/src/schedule.ts`, `stadiums.ts`, `teamFlags.ts`
- Modify: `packages/config/src/index.ts`

> Note: these re-export from generated `*.data.ts` files that don't exist until Task 5. After this task `typecheck` will fail on the missing modules — that's expected and is resolved at the end of Task 5. Do not run config typecheck until Task 5 Step 4.

- [ ] **Step 1: Create `schedule.ts`**

```ts
export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface Fixture {
  /** Canonical match number: knockouts 73-104; group matches 1-72 by kickoff order. */
  num: number;
  /** Raw round label, e.g. "Matchday 1", "Round of 32", "Final". */
  round: string;
  stage: MatchStage;
  /** "Group A".."Group L" for the group stage; null for knockouts. */
  group: string | null;
  /** Kickoff as a UTC ISO string (precomputed from the source local time + offset). */
  kickoffUtc: string;
  /** Nation name, or a knockout placeholder like "2A" / "W74" / "3A/B/C/D/F". */
  team1: string;
  team2: string;
  /** Host city; exact join key to Stadium.city. */
  venueCity: string;
}

export { WORLD_CUP_FIXTURES } from "./schedule.data";
```

- [ ] **Step 2: Create `stadiums.ts`**

```ts
export interface Stadium {
  /** Host city; exact join key to Fixture.venueCity. */
  city: string;
  name: string;
  capacity: number;
  /** ISO country code of the host country (for a venue flag). */
  cc: string;
  /** Display-only venue timezone label, e.g. "UTC-7". */
  timezone: string;
  lat: number;
  lng: number;
}

import { WORLD_CUP_STADIUMS } from "./stadiums.data";

export { WORLD_CUP_STADIUMS };

const STADIUM_BY_CITY = new Map<string, Stadium>(
  WORLD_CUP_STADIUMS.map((stadium) => [stadium.city, stadium])
);

export function getStadiumByCity(city: string): Stadium | undefined {
  return STADIUM_BY_CITY.get(city);
}
```

- [ ] **Step 3: Create `teamFlags.ts`**

```ts
export type TeamFlagMap = Record<string, string>;

import { TEAM_FLAGS } from "./teamFlags.data";

export { TEAM_FLAGS };

/** Emoji flag for a nation name, or undefined for knockout placeholder slots. */
export function flagForTeam(name: string): string | undefined {
  return TEAM_FLAGS[name];
}
```

- [ ] **Step 4: Export from config index**

In `packages/config/src/index.ts`, add (keep alphabetical with the existing list):

```ts
export * from "./schedule";
export * from "./stadiums";
export * from "./teamFlags";
```

- [ ] **Step 5: Commit**

```bash
git add packages/config/src/schedule.ts packages/config/src/stadiums.ts packages/config/src/teamFlags.ts packages/config/src/index.ts
git commit -m "feat: schedule/stadium/flag config types and helpers"
```

---

## Task 5: Generator script + emit generated data

**Files:**
- Create: `scripts/build-schedule.mjs`
- Generates: `packages/config/src/schedule.data.ts`, `stadiums.data.ts`, `teamFlags.data.ts`

- [ ] **Step 1: Write the generator**

```js
// scripts/build-schedule.mjs
// Transforms the source World Cup JSON into typed, validated config modules.
// Run with: pnpm build:schedule
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  assignMatchNumbers,
  isPlaceholderTeam,
  parseCoords,
  parseKickoffUtc,
  stageForRound
} from "./schedule-helpers.mjs";

const fromRoot = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

const readJson = (path) => JSON.parse(readFileSync(fromRoot(path), "utf8"));

const GENERATED_HEADER = (source) =>
  `// AUTO-GENERATED by scripts/build-schedule.mjs. Do not edit by hand.\n` +
  `// Regenerate with: pnpm build:schedule (source: ${source})\n`;

function buildFixtures(rawMatches) {
  const withUtc = rawMatches.map((m) => ({
    num: m.num,
    round: m.round,
    stage: stageForRound(m.round),
    group: m.group ?? null,
    kickoffUtc: parseKickoffUtc(m.date, m.time),
    team1: m.team1,
    team2: m.team2,
    ground: m.ground
  }));

  const numbered = assignMatchNumbers(withUtc).map((m) => ({
    num: m.num,
    round: m.round,
    stage: m.stage,
    group: m.group,
    kickoffUtc: m.kickoffUtc,
    team1: m.team1,
    team2: m.team2,
    venueCity: m.ground
  }));

  return numbered.sort((a, b) =>
    a.kickoffUtc < b.kickoffUtc ? -1 : a.kickoffUtc > b.kickoffUtc ? 1 : a.num - b.num
  );
}

function buildStadiums(rawStadiums) {
  return rawStadiums.map((s) => {
    const { lat, lng } = parseCoords(s.coords);
    return {
      city: s.city,
      name: s.name,
      capacity: s.capacity,
      cc: s.cc,
      timezone: s.timezone,
      lat,
      lng
    };
  });
}

function validate(fixtures, stadiums, flags) {
  const cities = new Set(stadiums.map((s) => s.city));
  const missingVenues = [...new Set(fixtures.map((f) => f.venueCity))].filter((c) => !cities.has(c));
  if (missingVenues.length > 0) {
    throw new Error(`Fixtures reference unknown stadium cities: ${missingVenues.join(", ")}`);
  }

  const nums = fixtures.map((f) => f.num);
  if (new Set(nums).size !== nums.length) throw new Error("Duplicate match numbers detected.");
  if (nums.some((n) => typeof n !== "number")) throw new Error("Some fixtures have no match number.");

  const groupCount = fixtures.filter((f) => f.stage === "group").length;
  const knockoutCount = fixtures.length - groupCount;
  if (groupCount !== 72) throw new Error(`Expected 72 group matches, got ${groupCount}.`);
  if (knockoutCount !== 32) throw new Error(`Expected 32 knockout matches, got ${knockoutCount}.`);

  const realTeams = new Set();
  for (const f of fixtures) {
    for (const team of [f.team1, f.team2]) {
      if (!isPlaceholderTeam(team)) realTeams.add(team);
    }
  }
  const missingFlags = [...realTeams].filter((team) => !(team in flags));
  if (missingFlags.length > 0) {
    throw new Error(`Teams missing a flag in team-flags.json: ${missingFlags.join(", ")}`);
  }
}

function emit(relativePath, header, exportLine) {
  writeFileSync(fromRoot(relativePath), `${header}\n${exportLine}\n`, "utf8");
}

function main() {
  const schedule = readJson("packages/config/src/data/worldcup.json");
  const stadiumsRaw = readJson("packages/config/src/data/worldcup.stadiums.json");
  const flags = readJson("scripts/data/team-flags.json");

  const fixtures = buildFixtures(schedule.matches);
  const stadiums = buildStadiums(stadiumsRaw.stadiums);

  validate(fixtures, stadiums, flags);

  emit(
    "packages/config/src/schedule.data.ts",
    GENERATED_HEADER("src/data/worldcup.json"),
    `import type { Fixture } from "./schedule";\n\n` +
      `export const WORLD_CUP_FIXTURES: Fixture[] = ${JSON.stringify(fixtures, null, 2)};`
  );

  emit(
    "packages/config/src/stadiums.data.ts",
    GENERATED_HEADER("src/data/worldcup.stadiums.json"),
    `import type { Stadium } from "./stadiums";\n\n` +
      `export const WORLD_CUP_STADIUMS: Stadium[] = ${JSON.stringify(stadiums, null, 2)};`
  );

  emit(
    "packages/config/src/teamFlags.data.ts",
    GENERATED_HEADER("scripts/data/team-flags.json"),
    `import type { TeamFlagMap } from "./teamFlags";\n\n` +
      `export const TEAM_FLAGS: TeamFlagMap = ${JSON.stringify(flags, null, 2)};`
  );

  console.log(
    `Generated ${fixtures.length} fixtures, ${stadiums.length} stadiums, ${Object.keys(flags).length} flags.`
  );
}

main();
```

- [ ] **Step 2: Run the generator**

Run: `pnpm build:schedule`
Expected: prints `Generated 104 fixtures, 16 stadiums, 48 flags.` and writes the three `*.data.ts` files. If it throws a validation error, fix the source data / flags before continuing.

- [ ] **Step 3: Sanity-check generated output**

Run: `node -e "const {WORLD_CUP_FIXTURES}=require('@gogaffa/config'); " 2>/dev/null || true`
Then inspect: open `packages/config/src/schedule.data.ts` and confirm the first fixture has `"num": 1`, a `"kickoffUtc"` ending in `Z`, and `"venueCity"` set. Confirm `stadiums.data.ts` has decimal `lat`/`lng`.

- [ ] **Step 4: Typecheck the config package**

Run: `pnpm --filter @gogaffa/config typecheck`
Expected: PASS (hand files from Task 4 now resolve their generated `*.data.ts`).

- [ ] **Step 4b: Flag drift guard test**

The onboarding nation picker uses `SUPPORTED_NATIONS` (in `nations.ts`, keyed by 3-letter code, with a `flagEmoji` field) while the schedule uses `TEAM_FLAGS` (keyed by the full team name from `worldcup.json`). These are intentionally separate sources, but where a nation appears in BOTH, the emoji must not drift. The generator is plain Node ESM and cannot reliably import the TypeScript `nations.ts` across the supported Node range, so this guard lives as a Vitest test (runs in `pnpm test:unit`).

Create `packages/config/src/teamFlags.drift.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SUPPORTED_NATIONS } from "./nations";
import { TEAM_FLAGS } from "./teamFlags";

// The onboarding nation picker (SUPPORTED_NATIONS, keyed by code) and the
// schedule flag map (TEAM_FLAGS, keyed by full team name from worldcup.json)
// are intentionally separate sources. This guards against silent drift:
// wherever a nation name appears in BOTH, the emoji MUST be identical.
describe("flag consistency between nations.ts and team-flags.json", () => {
  it("uses the same emoji for nation names present in both sources", () => {
    const mismatches: string[] = [];
    for (const nation of SUPPORTED_NATIONS) {
      const scheduleFlag = TEAM_FLAGS[nation.name];
      if (scheduleFlag !== undefined && scheduleFlag !== nation.flagEmoji) {
        mismatches.push(
          `${nation.name}: nations.ts=${nation.flagEmoji} team-flags.json=${scheduleFlag}`
        );
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("overlaps on at least a dozen nations (sanity: the check is actually running)", () => {
    const overlap = SUPPORTED_NATIONS.filter((n) => n.name in TEAM_FLAGS);
    expect(overlap.length).toBeGreaterThanOrEqual(12);
  });
});
```

Run: `pnpm vitest run packages/config/src/teamFlags.drift.test.ts`
Expected: PASS (both cases). The second case guards against the name-keying ever silently diverging so far that nothing overlaps (which would make the first check vacuously pass).

- [ ] **Step 5: Commit**

```bash
git add scripts/build-schedule.mjs packages/config/src/schedule.data.ts packages/config/src/stadiums.data.ts packages/config/src/teamFlags.data.ts packages/config/src/teamFlags.drift.test.ts packages/config/src/data/worldcup.json packages/config/src/data/worldcup.stadiums.json
git commit -m "feat: generate static world cup schedule + stadium config"
```

---

## SCOPE REVISION — 2026-06-04: Phase 1 is static-only

Per product direction, **Phase 1 ships a purely static schedule** — users open the app and see all 104 fixtures (local kickoff times, grouped by day, tap for stadium details). **No live results, no Supabase results overlay, no React Query for the schedule.**

- **Task 6 (results overlay migration)** and **Task 8 (results read API)** are **DEFERRED to Phase 2 — NOT built now.** Their code below is retained as the documented reference implementation for when the live feed is wired up (see also the design spec's Phase 2 section).
- **Tasks 7, 9, 10, 11** are executed in their **static variants** (defined inline in each task below under "STATIC VARIANT"), which supersede the results-coupled code. The static variants drop `MatchResult`/`MatchStatus`/`ScheduledMatch`, `mergeFixturesWithResults`, `getMatchResults`, and all score/LIVE/FT UI. Components operate directly on `Fixture`.
- **Task 12** keeps the `.env.example` Phase 2 placeholders (they document the deferral) and adds a one-line in-code pointer to where results will merge in later.

---

## Task 6: Supabase results overlay migration — ⛔ DEFERRED to Phase 2 (do not build now)

> Phase 2 reference implementation only. Do not create this migration file in Phase 1.

**Files (Phase 2):**
- Create: `supabase/migrations/000023_match_results.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Global, admin-maintained World Cup results overlay. Public read; clients never write
-- (only the service role / Phase 2 Edge Function writes). Keyed by the canonical match
-- number from packages/config (WORLD_CUP_FIXTURES.num).

create table if not exists public.match_results (
  match_num integer primary key,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'final')),
  home_score integer,
  away_score integer,
  team1_resolved text,
  team2_resolved text,
  updated_at timestamptz not null default now()
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_num integer not null,
  minute integer,
  type text not null check (type in ('goal', 'red_card')),
  side text not null check (side in ('home', 'away')),
  player text,
  created_at timestamptz not null default now()
);

create index if not exists match_events_match_num_idx
  on public.match_events (match_num);

alter table public.match_results enable row level security;
alter table public.match_events enable row level security;

-- Public read-only. No insert/update/delete policies => clients cannot write;
-- the service role bypasses RLS for the Phase 2 ingestion function.
create policy "Anyone can read match results"
  on public.match_results for select
  to anon, authenticated
  using (true);

create policy "Anyone can read match events"
  on public.match_events for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Apply locally (if Supabase env is available)**

Run: `supabase db reset`
Expected: all migrations apply cleanly, including `000023`. If Docker/Supabase is unavailable, skip and note the blocker — the migration is still committed for CI/remote apply.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/000023_match_results.sql
git commit -m "feat: match_results + match_events overlay tables (public read RLS)"
```

---

## Task 7: Feature types + pure utils (TDD)

**Files:**
- Create: `apps/mobile/src/features/schedule/types.ts`
- Create: `apps/mobile/src/features/schedule/utils.ts`
- Test: `apps/mobile/src/features/schedule/utils.test.ts`

### STATIC VARIANT (Phase 1 — BUILD THIS; supersedes the results-coupled steps below)

TDD: write `utils.test.ts` first (it will fail to resolve `./utils`), then `types.ts` + `utils.ts`, then run `pnpm vitest run apps/mobile/src/features/schedule/utils.test.ts` until green. No `MatchResult`/`ScheduledMatch`/`mergeFixturesWithResults` — utils operate directly on `Fixture`.

`types.ts`:
```ts
import type { Fixture } from "@gogaffa/config";

export type ScheduleFilter = "all" | "group" | "knockouts" | "myTeam";

export interface ScheduleSection {
  title: string;
  data: Fixture[];
}
```

`utils.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { Fixture } from "@gogaffa/config";
import {
  filterMatches,
  groupByLocalDay,
  localDayKey,
  mapsUrl,
  matchesMyTeam,
  myTeamNamesForCode
} from "./utils";

function fixture(partial: Partial<Fixture> & Pick<Fixture, "num">): Fixture {
  return {
    num: partial.num,
    round: partial.round ?? "Matchday 1",
    stage: partial.stage ?? "group",
    group: partial.group ?? "Group A",
    kickoffUtc: partial.kickoffUtc ?? "2026-06-11T19:00:00.000Z",
    team1: partial.team1 ?? "Mexico",
    team2: partial.team2 ?? "South Africa",
    venueCity: partial.venueCity ?? "Mexico City"
  };
}

describe("localDayKey", () => {
  it("uses the supplied timezone to compute the local day", () => {
    expect(localDayKey("2026-06-12T02:00:00.000Z", "America/Los_Angeles")).toBe("2026-06-11");
    expect(localDayKey("2026-06-12T02:00:00.000Z", "UTC")).toBe("2026-06-12");
  });
});

describe("filterMatches / matchesMyTeam / myTeamNamesForCode", () => {
  const matches: Fixture[] = [
    fixture({ num: 1, stage: "group", team1: "USA", team2: "Paraguay" }),
    fixture({ num: 73, stage: "r32", group: null, team1: "2A", team2: "2B" })
  ];
  it("filters group vs knockouts", () => {
    expect(filterMatches(matches, "group", new Set()).map((m) => m.num)).toEqual([1]);
    expect(filterMatches(matches, "knockouts", new Set()).map((m) => m.num)).toEqual([73]);
  });
  it("returns everything for the 'all' filter", () => {
    expect(filterMatches(matches, "all", new Set()).map((m) => m.num)).toEqual([1, 73]);
  });
  it("matches my team by nation code", () => {
    const names = myTeamNamesForCode("USA");
    expect(matchesMyTeam(matches[0]!, names)).toBe(true);
    expect(matchesMyTeam(matches[1]!, names)).toBe(false);
  });
  it("matches my team by nation name when codes differ", () => {
    const names = myTeamNamesForCode("KOR");
    const korea = fixture({ num: 2, team1: "South Korea", team2: "Czech Republic" });
    expect(matchesMyTeam(korea, names)).toBe(true);
  });
});

describe("groupByLocalDay", () => {
  it("groups chronologically by local day", () => {
    const matches: Fixture[] = [
      fixture({ num: 2, kickoffUtc: "2026-06-12T19:00:00.000Z" }),
      fixture({ num: 1, kickoffUtc: "2026-06-11T19:00:00.000Z" })
    ];
    const sections = groupByLocalDay(matches, "UTC");
    expect(sections).toHaveLength(2);
    expect(sections[0]!.data[0]!.num).toBe(1);
  });
});

describe("mapsUrl", () => {
  it("builds a universal maps query", () => {
    expect(mapsUrl(49.27667, -123.11194)).toBe(
      "https://www.google.com/maps/search/?api=1&query=49.27667,-123.11194"
    );
  });
});
```

`utils.ts`:
```ts
import { SUPPORTED_NATIONS } from "@gogaffa/config";
import type { Fixture } from "@gogaffa/config";
import type { ScheduleFilter, ScheduleSection } from "./types";

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function localDayKey(kickoffUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(kickoffUtc));
}

export function formatDayHeader(kickoffUtc: string, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(kickoffUtc));
}

export function formatKickoffTime(kickoffUtc: string, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(kickoffUtc));
}

export function myTeamNamesForCode(code: string | null | undefined): Set<string> {
  const names = new Set<string>();
  if (!code) return names;
  names.add(code.toLowerCase());
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  if (nation) names.add(nation.name.toLowerCase());
  return names;
}

export function matchesMyTeam(fixture: Fixture, names: Set<string>): boolean {
  if (names.size === 0) return false;
  return names.has(fixture.team1.toLowerCase()) || names.has(fixture.team2.toLowerCase());
}

export function filterMatches(
  fixtures: Fixture[],
  filter: ScheduleFilter,
  myTeamNames: Set<string>
): Fixture[] {
  switch (filter) {
    case "group":
      return fixtures.filter((f) => f.stage === "group");
    case "knockouts":
      return fixtures.filter((f) => f.stage !== "group");
    case "myTeam":
      return fixtures.filter((f) => matchesMyTeam(f, myTeamNames));
    case "all":
    default:
      return fixtures;
  }
}

export function groupByLocalDay(fixtures: Fixture[], timeZone: string): ScheduleSection[] {
  const sorted = [...fixtures].sort((a, b) =>
    a.kickoffUtc < b.kickoffUtc ? -1 : a.kickoffUtc > b.kickoffUtc ? 1 : a.num - b.num
  );

  const sections: ScheduleSection[] = [];
  const indexByKey = new Map<string, number>();

  for (const fixture of sorted) {
    const key = localDayKey(fixture.kickoffUtc, timeZone);
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = sections.length;
      indexByKey.set(key, index);
      sections.push({ title: formatDayHeader(fixture.kickoffUtc, timeZone), data: [] });
    }
    sections[index]!.data.push(fixture);
  }

  return sections;
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
```

Commit: `git add apps/mobile/src/features/schedule/types.ts apps/mobile/src/features/schedule/utils.ts apps/mobile/src/features/schedule/utils.test.ts && git commit -m "feat: schedule feature types and pure utils"`

---

### ORIGINAL (Phase 2 reference — superseded by the static variant above; do NOT build now)

- [ ] **Step 1: Create `types.ts`**

```ts
import type { Fixture } from "@gogaffa/config";

export type MatchStatus = "upcoming" | "live" | "final";

export interface MatchResult {
  matchNum: number;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  team1Resolved: string | null;
  team2Resolved: string | null;
}

export interface ScheduledMatch {
  fixture: Fixture;
  result?: MatchResult;
  team1Display: string;
  team2Display: string;
}

export type ScheduleFilter = "all" | "group" | "knockouts" | "myTeam";

export interface ScheduleSection {
  title: string;
  data: ScheduledMatch[];
}
```

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import type { Fixture } from "@gogaffa/config";
import type { MatchResult, ScheduledMatch } from "./types";
import {
  filterMatches,
  groupByLocalDay,
  localDayKey,
  mapsUrl,
  matchesMyTeam,
  mergeFixturesWithResults,
  myTeamNamesForCode
} from "./utils";

function fixture(partial: Partial<Fixture> & Pick<Fixture, "num">): Fixture {
  return {
    num: partial.num,
    round: partial.round ?? "Matchday 1",
    stage: partial.stage ?? "group",
    group: partial.group ?? "Group A",
    kickoffUtc: partial.kickoffUtc ?? "2026-06-11T19:00:00.000Z",
    team1: partial.team1 ?? "Mexico",
    team2: partial.team2 ?? "South Africa",
    venueCity: partial.venueCity ?? "Mexico City"
  };
}

describe("localDayKey", () => {
  it("uses the supplied timezone to compute the local day", () => {
    expect(localDayKey("2026-06-12T02:00:00.000Z", "America/Los_Angeles")).toBe("2026-06-11");
    expect(localDayKey("2026-06-12T02:00:00.000Z", "UTC")).toBe("2026-06-12");
  });
});

describe("mergeFixturesWithResults", () => {
  it("overlays resolved team names and keeps the result", () => {
    const f = fixture({ num: 73, stage: "r32", group: null, team1: "2A", team2: "2B" });
    const result: MatchResult = {
      matchNum: 73, status: "final", homeScore: 1, awayScore: 0,
      team1Resolved: "Mexico", team2Resolved: "Canada"
    };
    const [merged] = mergeFixturesWithResults([f], [result]);
    expect(merged.team1Display).toBe("Mexico");
    expect(merged.team2Display).toBe("Canada");
    expect(merged.result?.status).toBe("final");
  });
  it("falls back to fixture team labels with no result", () => {
    const [merged] = mergeFixturesWithResults([fixture({ num: 1 })], []);
    expect(merged.team1Display).toBe("Mexico");
    expect(merged.result).toBeUndefined();
  });
});

describe("filterMatches / matchesMyTeam / myTeamNamesForCode", () => {
  const matches: ScheduledMatch[] = [
    { fixture: fixture({ num: 1, stage: "group", team1: "USA", team2: "Paraguay" }), team1Display: "USA", team2Display: "Paraguay" },
    { fixture: fixture({ num: 73, stage: "r32", group: null, team1: "2A", team2: "2B" }), team1Display: "2A", team2Display: "2B" }
  ];
  it("filters group vs knockouts", () => {
    expect(filterMatches(matches, "group", new Set()).map((m) => m.fixture.num)).toEqual([1]);
    expect(filterMatches(matches, "knockouts", new Set()).map((m) => m.fixture.num)).toEqual([73]);
  });
  it("matches my team by nation code", () => {
    const names = myTeamNamesForCode("USA");
    expect(matchesMyTeam(matches[0]!.fixture, names)).toBe(true);
    expect(matchesMyTeam(matches[1]!.fixture, names)).toBe(false);
  });
  it("matches my team by nation name when codes differ", () => {
    // KOR -> nation name "South Korea" should match a fixture team "South Korea"
    const names = myTeamNamesForCode("KOR");
    const korea = fixture({ num: 2, team1: "South Korea", team2: "Czech Republic" });
    expect(matchesMyTeam(korea, names)).toBe(true);
  });
});

describe("groupByLocalDay", () => {
  it("groups chronologically by local day", () => {
    const matches: ScheduledMatch[] = [
      { fixture: fixture({ num: 2, kickoffUtc: "2026-06-12T19:00:00.000Z" }), team1Display: "A", team2Display: "B" },
      { fixture: fixture({ num: 1, kickoffUtc: "2026-06-11T19:00:00.000Z" }), team1Display: "C", team2Display: "D" }
    ];
    const sections = groupByLocalDay(matches, "UTC");
    expect(sections).toHaveLength(2);
    expect(sections[0]!.data[0]!.fixture.num).toBe(1);
  });
});

describe("mapsUrl", () => {
  it("builds a universal maps query", () => {
    expect(mapsUrl(49.27667, -123.11194)).toBe(
      "https://www.google.com/maps/search/?api=1&query=49.27667,-123.11194"
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run apps/mobile/src/features/schedule/utils.test.ts`
Expected: FAIL — cannot resolve `./utils`.

- [ ] **Step 4: Implement `utils.ts`**

```ts
import { SUPPORTED_NATIONS } from "@gogaffa/config";
import type { Fixture } from "@gogaffa/config";
import type { MatchResult, ScheduledMatch, ScheduleFilter, ScheduleSection } from "./types";

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function localDayKey(kickoffUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(kickoffUtc));
}

export function formatDayHeader(kickoffUtc: string, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(kickoffUtc));
}

export function formatKickoffTime(kickoffUtc: string, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(kickoffUtc));
}

export function mergeFixturesWithResults(
  fixtures: readonly Fixture[],
  results: readonly MatchResult[]
): ScheduledMatch[] {
  const byNum = new Map(results.map((r) => [r.matchNum, r]));
  return fixtures.map((fixture) => {
    const result = byNum.get(fixture.num);
    return {
      fixture,
      result,
      team1Display: result?.team1Resolved ?? fixture.team1,
      team2Display: result?.team2Resolved ?? fixture.team2
    };
  });
}

export function myTeamNamesForCode(code: string | null | undefined): Set<string> {
  const names = new Set<string>();
  if (!code) return names;
  names.add(code.toLowerCase());
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  if (nation) names.add(nation.name.toLowerCase());
  return names;
}

export function matchesMyTeam(fixture: Fixture, names: Set<string>): boolean {
  if (names.size === 0) return false;
  return names.has(fixture.team1.toLowerCase()) || names.has(fixture.team2.toLowerCase());
}

export function filterMatches(
  matches: ScheduledMatch[],
  filter: ScheduleFilter,
  myTeamNames: Set<string>
): ScheduledMatch[] {
  switch (filter) {
    case "group":
      return matches.filter((m) => m.fixture.stage === "group");
    case "knockouts":
      return matches.filter((m) => m.fixture.stage !== "group");
    case "myTeam":
      return matches.filter((m) => matchesMyTeam(m.fixture, myTeamNames));
    case "all":
    default:
      return matches;
  }
}

export function groupByLocalDay(matches: ScheduledMatch[], timeZone: string): ScheduleSection[] {
  const sorted = [...matches].sort((a, b) =>
    a.fixture.kickoffUtc < b.fixture.kickoffUtc
      ? -1
      : a.fixture.kickoffUtc > b.fixture.kickoffUtc
        ? 1
        : a.fixture.num - b.fixture.num
  );

  const sections: ScheduleSection[] = [];
  const indexByKey = new Map<string, number>();

  for (const match of sorted) {
    const key = localDayKey(match.fixture.kickoffUtc, timeZone);
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = sections.length;
      indexByKey.set(key, index);
      sections.push({ title: formatDayHeader(match.fixture.kickoffUtc, timeZone), data: [] });
    }
    sections[index]!.data.push(match);
  }

  return sections;
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run apps/mobile/src/features/schedule/utils.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/schedule/types.ts apps/mobile/src/features/schedule/utils.ts apps/mobile/src/features/schedule/utils.test.ts
git commit -m "feat: schedule feature types and pure utils"
```

---

## Task 8: Results API (Supabase read) — ⛔ DEFERRED to Phase 2 (do not build now)

> Phase 2 reference implementation only. Do not create this file in Phase 1.

**Files (Phase 2):**
- Create: `apps/mobile/src/features/schedule/api/results.ts`

- [ ] **Step 1: Implement the read API**

```ts
import { supabase } from "../../../lib/supabase";
import type { MatchResult, MatchStatus } from "../types";

interface MatchResultRow {
  match_num: number;
  status: string;
  home_score: number | null;
  away_score: number | null;
  team1_resolved: string | null;
  team2_resolved: string | null;
}

const COLUMNS = "match_num, status, home_score, away_score, team1_resolved, team2_resolved";

function toStatus(value: string): MatchStatus {
  return value === "live" || value === "final" ? value : "upcoming";
}

export async function getMatchResults(): Promise<MatchResult[]> {
  const { data, error } = await supabase.from("match_results").select(COLUMNS);
  if (error) throw error;
  const rows = (data ?? []) as MatchResultRow[];
  return rows.map((row) => ({
    matchNum: row.match_num,
    status: toStatus(row.status),
    homeScore: row.home_score,
    awayScore: row.away_score,
    team1Resolved: row.team1_resolved,
    team2Resolved: row.team2_resolved
  }));
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/schedule/api/results.ts
git commit -m "feat: read match_results overlay from supabase"
```

---

## Task 9: useSchedule hook

**Files:**
- Create: `apps/mobile/src/features/schedule/hooks/useSchedule.ts`

### STATIC VARIANT (Phase 1 — BUILD THIS; supersedes the results-coupled step below)

No React Query, no `getMatchResults`, no merge. Reads static fixtures from config, derives the "My team" availability from the signed-in profile's nation, and groups by local day. The Phase-2-hookup pointer lives as a comment.

`useSchedule.ts`:
```ts
import { useMemo } from "react";
import { WORLD_CUP_FIXTURES } from "@gogaffa/config";
import { useProfile } from "../../../hooks/useProfile";
import type { ScheduleFilter, ScheduleSection } from "../types";
import {
  deviceTimeZone,
  filterMatches,
  groupByLocalDay,
  matchesMyTeam,
  myTeamNamesForCode
} from "../utils";

interface UseScheduleResult {
  sections: ScheduleSection[];
  showMyTeam: boolean;
}

export function useSchedule(filter: ScheduleFilter): UseScheduleResult {
  // Phase 1 is static: fixtures come straight from @gogaffa/config.
  // TODO(Phase 2): fetch the live results overlay here (see deferred Task 8)
  // and merge resolved teams / scores before grouping.
  const { profile } = useProfile();
  const timeZone = deviceTimeZone();

  const myTeamNames = useMemo(
    () => myTeamNamesForCode(profile?.selectedNationCode),
    [profile?.selectedNationCode]
  );

  const showMyTeam = useMemo(
    () => WORLD_CUP_FIXTURES.some((fixture) => matchesMyTeam(fixture, myTeamNames)),
    [myTeamNames]
  );

  const sections = useMemo(
    () => groupByLocalDay(filterMatches(WORLD_CUP_FIXTURES, filter, myTeamNames), timeZone),
    [filter, myTeamNames, timeZone]
  );

  return { sections, showMyTeam };
}
```

Commit: `git add apps/mobile/src/features/schedule/hooks/useSchedule.ts && git commit -m "feat: static useSchedule hook"`

---

### ORIGINAL (Phase 2 reference — superseded; do NOT build now)

- [ ] **Step 1: Implement the hook**

```ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { WORLD_CUP_FIXTURES } from "@gogaffa/config";
import { useProfile } from "../../../hooks/useProfile";
import { getMatchResults } from "../api/results";
import type { ScheduleFilter, ScheduleSection } from "../types";
import {
  deviceTimeZone,
  filterMatches,
  groupByLocalDay,
  matchesMyTeam,
  mergeFixturesWithResults,
  myTeamNamesForCode
} from "../utils";

interface UseScheduleResult {
  sections: ScheduleSection[];
  showMyTeam: boolean;
  isRefetching: boolean;
  refetch: () => void;
}

export function useSchedule(filter: ScheduleFilter): UseScheduleResult {
  const { profile } = useProfile();
  const {
    data: results = [],
    isRefetching,
    refetch
  } = useQuery({
    queryKey: ["match-results"],
    queryFn: getMatchResults
  });

  const timeZone = deviceTimeZone();

  const myTeamNames = useMemo(
    () => myTeamNamesForCode(profile?.selectedNationCode),
    [profile?.selectedNationCode]
  );

  const merged = useMemo(
    () => mergeFixturesWithResults(WORLD_CUP_FIXTURES, results),
    [results]
  );

  const showMyTeam = useMemo(
    () => merged.some((match) => matchesMyTeam(match.fixture, myTeamNames)),
    [merged, myTeamNames]
  );

  const sections = useMemo(
    () => groupByLocalDay(filterMatches(merged, filter, myTeamNames), timeZone),
    [merged, filter, myTeamNames, timeZone]
  );

  return {
    sections,
    showMyTeam,
    isRefetching,
    refetch: () => {
      void refetch();
    }
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter mobile typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/schedule/hooks/useSchedule.ts
git commit -m "feat: useSchedule hook merging fixtures with overlay"
```

---

## Task 10: Presentational components

**Files:**
- Create: `apps/mobile/src/features/schedule/components/TeamLabel.tsx`
- Create: `apps/mobile/src/features/schedule/components/FilterChips.tsx`
- Create: `apps/mobile/src/features/schedule/components/FixtureRow.tsx`
- Create: `apps/mobile/src/features/schedule/components/StadiumDetailSheet.tsx`

### STATIC VARIANT NOTE (Phase 1)

`TeamLabel.tsx` (Step 1), `FilterChips.tsx` (Step 2), and `StadiumDetailSheet.tsx` (Step 4) are built **exactly as specified below**. Only `FixtureRow.tsx` changes: build the STATIC VARIANT here instead of Step 3 — it has no `result`/score/LIVE/FT and takes a `Fixture` directly.

`FixtureRow.tsx` (STATIC VARIANT — build this, not Step 3):
```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Fixture } from "@gogaffa/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { formatKickoffTime } from "../utils";
import { TeamLabel } from "./TeamLabel";

interface FixtureRowProps {
  fixture: Fixture;
  timeZone: string;
  onVenuePress: (city: string) => void;
}

export function FixtureRow({ fixture, timeZone, onVenuePress }: FixtureRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.teams}>
        <TeamLabel name={fixture.team1} align="left" />
        <View style={styles.center}>
          <Text style={styles.time}>{formatKickoffTime(fixture.kickoffUtc, timeZone)}</Text>
        </View>
        <TeamLabel name={fixture.team2} align="right" />
      </View>
      <Pressable onPress={() => onVenuePress(fixture.venueCity)} hitSlop={6}>
        <Text style={styles.venue} numberOfLines={1}>
          {fixture.group ? `${fixture.group} · ` : ""}
          {fixture.venueCity} ›
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    minWidth: 64
  },
  row: {
    backgroundColor: "rgba(255, 248, 234, 0.05)",
    borderRadius: radius.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md
  },
  teams: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  time: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "800"
  },
  venue: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  }
});
```

Commit all four components together at the end of the task: `git commit -m "feat: schedule presentational components"`.

---

- [ ] **Step 1: `TeamLabel.tsx`**

```tsx
import { StyleSheet, Text, View } from "react-native";
import { flagForTeam } from "@gogaffa/config";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function TeamLabel({ name, align }: { name: string; align: "left" | "right" }) {
  const flag = flagForTeam(name);
  const marker = flag ? (
    <Text style={styles.flag}>{flag}</Text>
  ) : (
    <View style={styles.placeholder} />
  );

  return (
    <View style={[styles.root, align === "right" ? styles.rowReverse : null]}>
      {marker}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flag: {
    fontSize: 22
  },
  name: {
    color: colors.cream,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  placeholder: {
    backgroundColor: "rgba(255, 248, 234, 0.18)",
    borderRadius: 4,
    height: 16,
    width: 22
  },
  root: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm
  },
  rowReverse: {
    flexDirection: "row-reverse"
  }
});
```

- [ ] **Step 2: `FilterChips.tsx`**

```tsx
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import type { ScheduleFilter } from "../types";

const BASE_CHIPS: { key: ScheduleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "group", label: "Group stage" },
  { key: "knockouts", label: "Knockouts" }
];

interface FilterChipsProps {
  value: ScheduleFilter;
  onChange: (filter: ScheduleFilter) => void;
  showMyTeam: boolean;
}

export function FilterChips({ value, onChange, showMyTeam }: FilterChipsProps) {
  const chips = showMyTeam
    ? [...BASE_CHIPS, { key: "myTeam" as ScheduleFilter, label: "My team" }]
    : BASE_CHIPS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onChange(chip.key)}
            style={[styles.chip, active ? styles.chipActive : null]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipActive: {
    backgroundColor: colors.gold
  },
  label: {
    color: "rgba(255, 248, 234, 0.75)",
    fontSize: 13,
    fontWeight: "800"
  },
  labelActive: {
    color: colors.pitch
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  }
});
```

- [ ] **Step 3: `FixtureRow.tsx`**

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import type { ScheduledMatch } from "../types";
import { formatKickoffTime } from "../utils";
import { TeamLabel } from "./TeamLabel";

interface FixtureRowProps {
  match: ScheduledMatch;
  timeZone: string;
  onVenuePress: (city: string) => void;
}

export function FixtureRow({ match, timeZone, onVenuePress }: FixtureRowProps) {
  const { fixture, result, team1Display, team2Display } = match;
  const hasScore =
    result !== undefined &&
    result.status !== "upcoming" &&
    result.homeScore !== null &&
    result.awayScore !== null;
  const showPill = result !== undefined && result.status !== "upcoming";

  return (
    <View style={styles.row}>
      <View style={styles.teams}>
        <TeamLabel name={team1Display} align="left" />
        <View style={styles.center}>
          {hasScore ? (
            <Text style={styles.score}>
              {result.homeScore} - {result.awayScore}
            </Text>
          ) : (
            <Text style={styles.time}>{formatKickoffTime(fixture.kickoffUtc, timeZone)}</Text>
          )}
          {showPill ? (
            <Text style={[styles.pill, result.status === "live" ? styles.live : styles.ft]}>
              {result.status === "live" ? "LIVE" : "FT"}
            </Text>
          ) : null}
        </View>
        <TeamLabel name={team2Display} align="right" />
      </View>
      <Pressable onPress={() => onVenuePress(fixture.venueCity)} hitSlop={6}>
        <Text style={styles.venue} numberOfLines={1}>
          {fixture.group ? `${fixture.group} · ` : ""}
          {fixture.venueCity} ›
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    minWidth: 64
  },
  ft: {
    color: "rgba(255, 248, 234, 0.7)"
  },
  live: {
    color: colors.clay
  },
  pill: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2
  },
  row: {
    backgroundColor: "rgba(255, 248, 234, 0.05)",
    borderRadius: radius.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md
  },
  score: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "900"
  },
  teams: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  time: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "800"
  },
  venue: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  }
});
```

- [ ] **Step 4: `StadiumDetailSheet.tsx`**

```tsx
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { getStadiumByCity } from "@gogaffa/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { mapsUrl } from "../utils";

interface StadiumDetailSheetProps {
  city: string | null;
  onClose: () => void;
}

export function StadiumDetailSheet({ city, onClose }: StadiumDetailSheetProps) {
  const stadium = city ? getStadiumByCity(city) : undefined;

  return (
    <Modal visible={city !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          {stadium ? (
            <>
              <Text style={styles.name}>{stadium.name}</Text>
              <Text style={styles.city}>{stadium.city}</Text>
              <View style={styles.metaRow}>
                <Meta label="Capacity" value={stadium.capacity.toLocaleString()} />
                <Meta label="Local time" value={stadium.timezone} />
              </View>
              <Pressable
                style={styles.mapsButton}
                onPress={() => void Linking.openURL(mapsUrl(stadium.lat, stadium.lng))}
              >
                <Text style={styles.mapsLabel}>Open in Maps</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.city}>Venue details unavailable.</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end"
  },
  city: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  mapsButton: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingVertical: spacing.md
  },
  mapsLabel: {
    color: colors.pitch,
    fontSize: 15,
    fontWeight: "900"
  },
  meta: {
    flex: 1
  },
  metaLabel: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  metaValue: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2
  },
  name: {
    color: colors.cream,
    fontSize: 22,
    fontWeight: "900"
  },
  sheet: {
    backgroundColor: colors.pitch,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl
  }
});
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter mobile typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/schedule/components/TeamLabel.tsx apps/mobile/src/features/schedule/components/FilterChips.tsx apps/mobile/src/features/schedule/components/FixtureRow.tsx apps/mobile/src/features/schedule/components/StadiumDetailSheet.tsx
git commit -m "feat: schedule presentational components"
```

---

## Task 11: ScheduleScreen + route wiring + barrel

**Files:**
- Create: `apps/mobile/src/features/schedule/components/DaySectionHeader.tsx`
- Create: `apps/mobile/src/features/schedule/components/ScheduleScreen.tsx`
- Create: `apps/mobile/src/features/schedule/index.ts`
- Modify: `apps/mobile/app/(tabs)/schedule.tsx`

### STATIC VARIANT NOTE (Phase 1)

`DaySectionHeader.tsx` (Step 1) and the route wiring (Step 4) are built **exactly as specified below**. `ScheduleScreen.tsx` and the barrel `index.ts` use the STATIC VARIANTS here (no `isRefetching`/`refetch`/pull-to-refresh; `FixtureRow` takes `fixture`; barrel exports only the static types).

`ScheduleScreen.tsx` (STATIC VARIANT — build this, not Step 2):
```tsx
import { useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useSchedule } from "../hooks/useSchedule";
import type { ScheduleFilter } from "../types";
import { deviceTimeZone } from "../utils";
import { DaySectionHeader } from "./DaySectionHeader";
import { FilterChips } from "./FilterChips";
import { FixtureRow } from "./FixtureRow";
import { StadiumDetailSheet } from "./StadiumDetailSheet";

export function ScheduleScreen() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const [venueCity, setVenueCity] = useState<string | null>(null);
  const { sections, showMyTeam } = useSchedule(filter);
  const timeZone = deviceTimeZone();

  return (
    <View style={styles.root}>
      <FilterChips value={filter} onChange={setFilter} showMyTeam={showMyTeam} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.num)}
        renderItem={({ item }) => (
          <FixtureRow fixture={item} timeZone={timeZone} onVenuePress={setVenueCity} />
        )}
        renderSectionHeader={({ section }) => <DaySectionHeader title={section.title} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No matches for this filter.</Text>}
      />
      <StadiumDetailSheet city={venueCity} onClose={() => setVenueCity(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl
  },
  empty: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 14,
    padding: spacing.xl,
    textAlign: "center"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  }
});
```

`index.ts` barrel (STATIC VARIANT — build this, not Step 3):
```ts
export { ScheduleScreen } from "./components/ScheduleScreen";
export { useSchedule } from "./hooks/useSchedule";
export type { ScheduleFilter, ScheduleSection } from "./types";
```

---

- [ ] **Step 1: `DaySectionHeader.tsx`**

```tsx
import { StyleSheet, Text } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

export function DaySectionHeader({ title }: { title: string }) {
  return <Text style={styles.header}>{title}</Text>;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.pitch,
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: "uppercase"
  }
});
```

- [ ] **Step 2: `ScheduleScreen.tsx`**

```tsx
import { useState } from "react";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { useSchedule } from "../hooks/useSchedule";
import type { ScheduleFilter } from "../types";
import { deviceTimeZone } from "../utils";
import { DaySectionHeader } from "./DaySectionHeader";
import { FilterChips } from "./FilterChips";
import { FixtureRow } from "./FixtureRow";
import { StadiumDetailSheet } from "./StadiumDetailSheet";

export function ScheduleScreen() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const [venueCity, setVenueCity] = useState<string | null>(null);
  const { sections, showMyTeam, isRefetching, refetch } = useSchedule(filter);
  const timeZone = deviceTimeZone();

  return (
    <View style={styles.root}>
      <FilterChips value={filter} onChange={setFilter} showMyTeam={showMyTeam} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.fixture.num)}
        renderItem={({ item }) => (
          <FixtureRow match={item} timeZone={timeZone} onVenuePress={setVenueCity} />
        )}
        renderSectionHeader={({ section }) => <DaySectionHeader title={section.title} />}
        stickySectionHeadersEnabled={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No matches for this filter.</Text>}
      />
      <StadiumDetailSheet city={venueCity} onClose={() => setVenueCity(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl
  },
  empty: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 14,
    padding: spacing.xl,
    textAlign: "center"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  }
});
```

- [ ] **Step 3: `index.ts` barrel**

```ts
export { ScheduleScreen } from "./components/ScheduleScreen";
export { useSchedule } from "./hooks/useSchedule";
export type {
  MatchResult,
  MatchStatus,
  ScheduledMatch,
  ScheduleFilter,
  ScheduleSection
} from "./types";
```

- [ ] **Step 4: Wire the route**

Replace the entire contents of `apps/mobile/app/(tabs)/schedule.tsx` with:

```tsx
import { ScheduleScreen } from "../../src/features/schedule";

export default function ScheduleRoute() {
  return <ScheduleScreen />;
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter mobile typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/schedule/components/DaySectionHeader.tsx apps/mobile/src/features/schedule/components/ScheduleScreen.tsx apps/mobile/src/features/schedule/index.ts "apps/mobile/app/(tabs)/schedule.tsx"
git commit -m "feat: wire schedule screen into the schedule tab"
```

---

## Task 12: Phase 2 env placeholders + full validation

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Document deferred Phase 2 config**

Append to `.env.example` (the live feed is not wired now; these are placeholders for Phase 2):

```sh
# --- World Cup live results feed (Phase 2 — not wired yet) ---
# The schedule tab works on static data without these. When the Edge Function that
# ingests goal/red-card events is built, set the provider + key here.
MATCH_RESULTS_PROVIDER=
MATCH_RESULTS_API_KEY=
```

- [ ] **Step 2: Run the full unit suite**

Run: `pnpm test:unit`
Expected: PASS (helper + utils tests green).

- [ ] **Step 3: Typecheck the whole workspace**

Run: `pnpm typecheck`
Expected: PASS for all packages.

- [ ] **Step 4: Visual smoke check**

Run: `pnpm test:visual`
Expected: existing Playwright route checks still pass (install browsers first with `pnpm exec playwright install chromium` if needed). If the harness cannot run, manually launch the app (`pnpm dev:mobile`), open the Schedule tab, and confirm: fixtures grouped by day, local kickoff times, flags, filter chips switch correctly, and tapping a venue opens the stadium sheet with an Open-in-Maps link.

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "docs: document deferred phase 2 live-feed env placeholders"
```

---

## Self-Review

**Spec coverage**

| Spec requirement | Task |
| --- | --- |
| Static fixtures/stadiums/flags in `packages/config` | 3, 4, 5 |
| Generator transforms JSON + validates | 2, 5 |
| Canonical match numbering (group 1–72, knockout 73–104) | 2 (`assignMatchNumbers`), 5 |
| Kickoff precomputed to UTC, rendered in device tz | 2 (`parseKickoffUtc`), 7 (`formatKickoffTime`, `deviceTimeZone`) |
| Group by local calendar day | 7 (`localDayKey`, `groupByLocalDay`) |
| Ground↔stadium join + stadium detail + Open in Maps | 4 (`getStadiumByCity`), 10 (`StadiumDetailSheet`, `mapsUrl`) |
| 48-team emoji flags + knockout placeholder badges | 3, 4 (`flagForTeam`), 10 (`TeamLabel`) |
| Chronological layout + filter chips (All/Group/Knockouts/My team) | 7 (`filterMatches`), 10 (`FilterChips`), 11 (`ScheduleScreen`) |
| "My team" appears only when nation is in the field | 7 (`matchesMyTeam`, `myTeamNamesForCode`), 9 (`showMyTeam`) |
| Supabase overlay `match_results` + `match_events`, public-read RLS, no client writes | ⛔ DEFERRED Phase 2 (reference impl retained in Task 6) |
| App reads overlay via React Query, merges, refresh | ⛔ DEFERRED Phase 2 (Task 9 ships a static hook; merge point marked with a TODO comment) |
| Live feed Edge Function + results read deferred + documented | spec + Task 6/8 reference impls + env placeholders in 12 + `useSchedule` TODO |
| Thin route, feature-module structure | 7, 9, 10, 11 |
| TDD on pure logic; typecheck; visual smoke | 1, 2, 7, 12 |

**Placeholder scan:** No `TBD`/`TODO`/"add error handling" left; every code step has complete code. ✅

**Type consistency:** `Fixture`/`Stadium`/`MatchStage` defined in Task 4 and consumed unchanged in Tasks 5/7/9/10/11. `MatchResult`/`MatchStatus`/`ScheduledMatch`/`ScheduleFilter`/`ScheduleSection` defined in Task 7 and used consistently in 8/9/10/11. Helper names (`parseKickoffUtc`, `assignMatchNumbers`, `parseCoords`, `stageForRound`, `isPlaceholderTeam`) match between Task 2 definition and Task 5 usage. `getMatchResults` (8) → `useSchedule` (9). `flagForTeam`/`getStadiumByCity` (4) → components (10). ✅

**Known follow-ups (Phase 2 / future, intentionally out of scope):** Edge Function + provider adapter + name-alias map + cron + goal/red-card push; optional custom per-nation badge assets; optional fixture→`match/[matchId]` deep-link; optional Realtime subscription.
