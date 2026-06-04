# Bracket Phased Lockout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-03-bracket-phased-lockout-design.md`

**Goal:** Split the bracket flow into Phase 1 (group rankings, locks per-group at first kickoff) and Phase 2 (knockouts, locks per-match at kickoff) so users get two rounds of engagement instead of one, with proper lockout enforcement and late-joiner handling.

**Architecture:** Lock state is derived at runtime from a static fixture file + server clock — no persisted lock columns. Enforcement lives in the existing `submit-bracket` Supabase **edge function** (not a new SQL RPC — see "Architecture deviation from spec" below). The client surfaces lock state via two hooks (`useTournamentClock`, `useBracketLockState`), shows a Phase Hero card, and lets users either save group picks early or set knockouts speculatively.

**Tech Stack:** React Native + Expo SDK 54, Expo Router, Supabase (PostgreSQL + Edge Functions in Deno), pnpm monorepo, TypeScript strict, `expo-notifications`, `react-native-async-storage`.

**Branch:** `feature/bracket-phased-lockout` (already created off `main`, commit `403e948` has the spec)

**Deadline:** Land before **June 11, 2026** (first World Cup kickoff). Today is June 3. **8 days.**

---

## Architecture deviation from spec

The spec assumed direct table writes gated by RLS + a new SQL `update_bracket` RPC for fixture validation. Reading the existing `apps/mobile/src/features/bracket/api/brackets.ts`, the actual save path already goes through a Supabase Edge Function at `supabase/functions/submit-bracket/index.ts`. **Approved pivot (June 3):** add fixture validation inside that existing edge function instead of building a parallel RPC. Trade-off accepted: ~100–500ms cold-start latency vs. PL/pgSQL, in exchange for a single fixture source of truth and 30%+ less code.

Concretely:
- **No new SQL RPC.** Migration only drops the binary `locked_at IS NULL` RLS policy and adds the `(user_id, group_id) NULLS NOT DISTINCT` unique index.
- **Fixture data:** lives in TS at `packages/config/src/fixtures.ts` (client) AND `supabase/functions/submit-bracket/fixtures.ts` (edge function copy). A `pnpm verify:fixtures` script asserts they match.
- **Group membership check** for group brackets is added inside the edge function (uses existing `public.group_members` table).

---

## File structure

### New files

| Path | Purpose | Owner |
|---|---|---|
| `packages/config/src/fixtures.ts` | Fixture types + 44 UTC kickoffs | Task 1 |
| `packages/config/test/fixtures.test.ts` | Fixture shape + parseability tests | Task 2 |
| `apps/mobile/src/features/bracket/lib/computeBracketLockState.ts` | Pure derivation: `(now, fixtures) → BracketLockState` | Task 3 |
| `apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts` | Unit tests for the pure function | Task 4 |
| `apps/mobile/src/features/bracket/hooks/useTournamentClock.ts` | Server-time hook with device fallback | Task 5 |
| `apps/mobile/src/features/bracket/hooks/useBracketLockState.ts` | Reactive lock-state hook (thin wrapper) | Task 6 |
| `supabase/migrations/000020_bracket_phased_locks.sql` | Drop binary RLS, add unique index | Task 7 |
| `supabase/functions/submit-bracket/fixtures.ts` | Copy of fixtures for the edge function | Task 8 |
| `scripts/verify-fixtures.ts` | Parity check between TS and edge function copies | Task 8 |
| `supabase/functions/submit-bracket/validateFixtures.ts` | Fixture-lockout validation logic | Task 9 |
| `supabase/functions/submit-bracket/validateFixtures.test.ts` | Deno tests for validation | Task 10 |
| `apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx` | Top-of-page phase status card | Task 13 |
| `apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx` | Dismissible "joined late" banner | Task 14 |
| `apps/mobile/src/features/bracket/notifications.ts` | June 27 reminder scheduler | Task 20 |

### Modified files

| Path | Change | Owner |
|---|---|---|
| `packages/config/src/index.ts` | Re-export fixture types/constants | Task 1 |
| `packages/config/package.json` | Add `test` script | Task 2 |
| `package.json` (root) | Add `verify:fixtures` script | Task 8 |
| `supabase/functions/submit-bracket/index.ts` | Plug in fixture validation + groupId support + partial-save error shape | Task 9 |
| `supabase/functions/submit-bracket/schema.ts` | (no change expected — verify only) | Task 9 |
| `apps/mobile/src/features/bracket/api/brackets.ts` | Surface `PICK_PAST_LOCKOUT` as a typed error; accept `groupId` arg | Task 11 |
| `apps/mobile/src/features/bracket/types.ts` | Add lock-state types + PickPastLockoutError | Task 11 |
| `apps/mobile/src/features/bracket/BracketContext.tsx` | Expose `isGroupLocked`/`isMatchLocked`; partial-save retry; `groupId` plumbing | Task 12 |
| `apps/mobile/src/features/bracket/components/SubTabBar.tsx` | Lock icons + Phase 2 eyebrow | Task 15 |
| `apps/mobile/src/features/bracket/components/GroupPicker.tsx` | Locked-state rendering + dual CTA on last group | Task 16 |
| `apps/mobile/src/features/bracket/components/KnockoutRound.tsx` | Locked-state rendering | Task 17 |
| `apps/mobile/src/features/bracket/components/BracketSummary.tsx` | Phase-aware copy + partial-save warning | Task 18 |
| `apps/mobile/app/(tabs)/bracket.tsx` | Mount `PhaseHeroCard` + `LateJoinerBanner` | Task 19 |

---

## Task 0: Verify branch state

- [ ] **Step 1: Confirm we're on the right branch**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
git status
git log --oneline -3
```

Expected: branch `feature/bracket-phased-lockout`, two commits at the tip (`403e948` and `597fa85`) adding the spec doc. Working tree clean.

- [ ] **Step 2: Make sure deps are installed**

```bash
pnpm install
```

Expected: completes without errors. (We installed earlier this session but a fresh agent should re-run.)

- [ ] **Step 3: Typecheck baseline**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors. (If you see errors about `expo-auth-session`, `@react-native-async-storage/async-storage`, etc. → `pnpm install` again — those exist in package.json but `node_modules` may be stale.)

---

## Task 1: Fixture data + types in @world-cup-game/config

**Files:**
- Create: `packages/config/src/fixtures.ts`
- Modify: `packages/config/src/index.ts`

- [ ] **Step 1: Create the fixtures file**

```ts
// packages/config/src/fixtures.ts
import type { GroupId } from "./groups";

export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export interface KnockoutFixture {
  /** Which knockout round this match belongs to. */
  round: KnockoutRoundId;
  /** Position within the round's match array (0-indexed). */
  index: number;
  /** ISO 8601 UTC string — never local time. */
  kickoff: string;
}

// All 44 timestamps sourced June 3, 2026 from:
//   - ESPN:     https://www.espn.com/soccer/story/_/id/48939282/...
//   - Wikipedia: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
// ET kickoff times (EDT = UTC-4 in June/July) → UTC.
// ⚠️ Sources disagreed on Final (3pm ET vs 7pm ET) and 3rd-place; we used Wikipedia.
// Re-verify against fifa.com before merging this PR.

export const GROUP_FIRST_KICKOFF_UTC: Record<GroupId, string> = {
  A: "2026-06-11T19:00:00Z", // Mexico vs South Africa, 3pm ET
  B: "2026-06-12T19:00:00Z", // Canada vs Bosnia, 3pm ET
  C: "2026-06-13T22:00:00Z", // Brazil vs Morocco, 6pm ET
  D: "2026-06-13T01:00:00Z", // USA vs Paraguay, June 12 9pm ET
  E: "2026-06-14T17:00:00Z", // Germany vs Curaçao, 1pm ET
  F: "2026-06-14T20:00:00Z", // Netherlands vs Japan, 4pm ET
  G: "2026-06-15T22:00:00Z", // Belgium vs Egypt, 6pm ET
  H: "2026-06-15T17:00:00Z", // Spain vs Cape Verde, 1pm ET
  I: "2026-06-16T19:00:00Z", // France vs Senegal, 3pm ET
  J: "2026-06-17T01:00:00Z", // Argentina vs Algeria, June 16 9pm ET
  K: "2026-06-17T17:00:00Z", // Portugal vs DR Congo, 1pm ET
  L: "2026-06-17T20:00:00Z"  // England vs Croatia, 4pm ET
};

export const KNOCKOUT_FIXTURES: readonly KnockoutFixture[] = [
  // Round of 32 (16 matches)
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

  // Round of 16 (8 matches)
  { round: "r16", index: 0, kickoff: "2026-07-04T19:00:00Z" }, // 3pm ET
  { round: "r16", index: 1, kickoff: "2026-07-05T00:00:00Z" }, // July 4 8pm ET
  { round: "r16", index: 2, kickoff: "2026-07-05T23:00:00Z" }, // 7pm ET
  { round: "r16", index: 3, kickoff: "2026-07-06T00:00:00Z" }, // July 5 8pm ET
  { round: "r16", index: 4, kickoff: "2026-07-06T23:00:00Z" }, // 7pm ET
  { round: "r16", index: 5, kickoff: "2026-07-07T00:00:00Z" }, // July 6 8pm ET
  { round: "r16", index: 6, kickoff: "2026-07-07T20:00:00Z" }, // 4pm ET
  { round: "r16", index: 7, kickoff: "2026-07-07T20:00:00Z" }, // 4pm ET (parallel)

  // Quarterfinals (4 matches)
  { round: "qf",  index: 0, kickoff: "2026-07-10T00:00:00Z" }, // July 9 8pm ET
  { round: "qf",  index: 1, kickoff: "2026-07-10T19:00:00Z" }, // 3pm ET
  { round: "qf",  index: 2, kickoff: "2026-07-12T01:00:00Z" }, // July 11 9pm ET
  { round: "qf",  index: 3, kickoff: "2026-07-12T01:00:00Z" }, // July 11 9pm ET (parallel)

  // Semifinals (2 matches)
  { round: "sf",  index: 0, kickoff: "2026-07-14T23:00:00Z" }, // 7pm ET
  { round: "sf",  index: 1, kickoff: "2026-07-15T23:00:00Z" }, // 7pm ET

  // Third + Final
  { round: "third", index: 0, kickoff: "2026-07-19T01:00:00Z" }, // July 18 9pm ET
  { round: "final", index: 0, kickoff: "2026-07-19T23:00:00Z" }  // 7pm ET
];

/** Helper: look up a knockout fixture by (round, index). Returns null if not found. */
export function findKnockoutFixture(
  round: KnockoutRoundId,
  index: number
): KnockoutFixture | null {
  return (
    KNOCKOUT_FIXTURES.find((f) => f.round === round && f.index === index) ?? null
  );
}
```

- [ ] **Step 2: Re-export from index.ts**

Open `packages/config/src/index.ts`. Add the new export line at the end (after the existing exports):

```ts
export * from "./fixtures";
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @world-cup-game/config typecheck
```

Expected: 0 errors. If `typecheck` script doesn't exist on the config package, run `pnpm --filter mobile typecheck` instead — it'll resolve and check the import.

- [ ] **Step 4: Commit**

```bash
git add packages/config/src/fixtures.ts packages/config/src/index.ts
git commit -m "feat(config): add 2026 WC fixture data (12 group first-kickoffs + 32 knockouts)"
```

---

## Task 2: Tests for fixture data shape

**Files:**
- Create: `packages/config/test/fixtures.test.ts`
- Modify: `packages/config/package.json`

- [ ] **Step 1: Write the test file**

```ts
// packages/config/test/fixtures.test.ts
//
// Run with: pnpm dlx tsx packages/config/test/fixtures.test.ts
// Throws on failure, prints "OK" on success.

import {
  GROUP_FIRST_KICKOFF_UTC,
  KNOCKOUT_FIXTURES,
  GROUP_IDS,
  findKnockoutFixture
} from "../src";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// 1) Every group has a kickoff
for (const g of GROUP_IDS) {
  assert(g in GROUP_FIRST_KICKOFF_UTC, `Missing kickoff for Group ${g}`);
}
assert(
  Object.keys(GROUP_FIRST_KICKOFF_UTC).length === GROUP_IDS.length,
  `Got ${Object.keys(GROUP_FIRST_KICKOFF_UTC).length} kickoffs, expected ${GROUP_IDS.length}`
);

// 2) Every group kickoff is a valid ISO UTC date
for (const [g, iso] of Object.entries(GROUP_FIRST_KICKOFF_UTC)) {
  const d = new Date(iso);
  assert(!Number.isNaN(d.getTime()), `Group ${g} kickoff is not a valid date: ${iso}`);
  assert(iso.endsWith("Z"), `Group ${g} kickoff is not UTC (must end with Z): ${iso}`);
}

// 3) Knockout count is exactly 32
assert(
  KNOCKOUT_FIXTURES.length === 32,
  `Knockout count is ${KNOCKOUT_FIXTURES.length}, expected 32`
);

// 4) Per-round counts are right
const expectedCounts = { r32: 16, r16: 8, qf: 4, sf: 2, third: 1, final: 1 };
const actual: Record<string, number> = {};
for (const f of KNOCKOUT_FIXTURES) {
  actual[f.round] = (actual[f.round] ?? 0) + 1;
}
for (const [r, n] of Object.entries(expectedCounts)) {
  assert(actual[r] === n, `Round ${r}: ${actual[r] ?? 0} fixtures, expected ${n}`);
}

// 5) Per-round indices are 0..N-1 and unique
const byRound: Record<string, number[]> = {};
for (const f of KNOCKOUT_FIXTURES) {
  (byRound[f.round] ??= []).push(f.index);
}
for (const [r, indices] of Object.entries(byRound)) {
  const sorted = [...indices].sort((a, b) => a - b);
  const expected = sorted.map((_, i) => i);
  assert(
    JSON.stringify(sorted) === JSON.stringify(expected),
    `Round ${r} indices not 0..N-1: got ${sorted.join(",")}`
  );
}

// 6) Every kickoff is a valid date
for (const f of KNOCKOUT_FIXTURES) {
  const d = new Date(f.kickoff);
  assert(
    !Number.isNaN(d.getTime()),
    `${f.round} #${f.index} kickoff invalid: ${f.kickoff}`
  );
}

// 7) findKnockoutFixture works
const fixture = findKnockoutFixture("final", 0);
assert(fixture !== null, "findKnockoutFixture('final', 0) returned null");
assert(fixture.kickoff === "2026-07-19T23:00:00Z", `final kickoff mismatch: ${fixture?.kickoff}`);

const missing = findKnockoutFixture("r32", 99);
assert(missing === null, "findKnockoutFixture('r32', 99) should be null");

console.log("OK: all fixture assertions passed");
```

- [ ] **Step 2: Add the test script to config's package.json**

Open `packages/config/package.json`. Replace the existing `"test"` line with:

```json
"test": "tsx test/fixtures.test.ts"
```

If `tsx` isn't already a devDep in this package, add it at the workspace root instead so it's available everywhere:

```bash
pnpm add -D -w tsx
```

- [ ] **Step 3: Run the test**

```bash
pnpm --filter @world-cup-game/config test
```

Expected output: `OK: all fixture assertions passed`. If you see assertion failures, fix the underlying fixture data in `fixtures.ts`.

- [ ] **Step 4: Commit**

```bash
git add packages/config/test/fixtures.test.ts packages/config/package.json pnpm-lock.yaml package.json
git commit -m "test(config): assert fixture file shape, counts, and date validity"
```

---

## Task 3: Pure derivation function `computeBracketLockState`

This is the heart of the lockout system. **Pure function** — easy to test, no React, no side effects.

**Files:**
- Create: `apps/mobile/src/features/bracket/lib/computeBracketLockState.ts`

- [ ] **Step 1: Write the function**

```ts
// apps/mobile/src/features/bracket/lib/computeBracketLockState.ts
import {
  GROUP_FIRST_KICKOFF_UTC,
  KNOCKOUT_FIXTURES,
  GROUP_IDS,
  findKnockoutFixture
} from "@world-cup-game/config";
import type { GroupId, KnockoutRoundId } from "@world-cup-game/config";

export type TournamentPhase =
  | "pre"             // No group has kicked off yet
  | "phase1-closing"  // Some groups locked, some open
  | "between"         // All groups locked, no knockout match kicked off
  | "phase2-closing"  // Some knockouts locked, some open
  | "complete";       // Everything locked

export interface BracketLockState {
  /** True if the given group's first match has already kicked off. */
  isGroupLocked: (group: GroupId) => boolean;
  /** True if the given knockout match has already kicked off. */
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  /** High-level phase derived from how many units are locked. */
  phase: TournamentPhase;
  /** When the next lockable unit locks, or null if everything is locked. */
  nextLockAt: Date | null;
  /** Human label for the next lockable unit, e.g. "Group E" or "R32 #5". */
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

/** Pure: turn a moment in time + fixture constants into a BracketLockState. */
export function computeBracketLockState(now: Date): BracketLockState {
  const nowMs = now.getTime();

  // Pre-compute parsed kickoff times once for speed
  const groupKickoffs = new Map<GroupId, number>();
  for (const g of GROUP_IDS) {
    groupKickoffs.set(g, new Date(GROUP_FIRST_KICKOFF_UTC[g]).getTime());
  }

  const knockoutKickoffs = new Map<string, number>();
  const knockoutOrder: Array<{
    round: KnockoutRoundId;
    index: number;
    kickoffMs: number;
  }> = [];
  for (const f of KNOCKOUT_FIXTURES) {
    const key = `${f.round}:${f.index}`;
    const kickoffMs = new Date(f.kickoff).getTime();
    knockoutKickoffs.set(key, kickoffMs);
    knockoutOrder.push({ round: f.round, index: f.index, kickoffMs });
  }

  const isGroupLocked = (group: GroupId): boolean => {
    const k = groupKickoffs.get(group);
    return k !== undefined && nowMs >= k;
  };

  const isMatchLocked = (round: KnockoutRoundId, index: number): boolean => {
    const k = knockoutKickoffs.get(`${round}:${index}`);
    return k !== undefined && nowMs >= k;
  };

  // Find the next lockable unit (groups first, then knockouts in chronological order)
  let nextLockAt: Date | null = null;
  let nextLockLabel: string | null = null;

  // Soonest group not yet locked
  let soonestGroupKickoff = Infinity;
  let soonestGroupId: GroupId | null = null;
  for (const g of GROUP_IDS) {
    const k = groupKickoffs.get(g)!;
    if (nowMs < k && k < soonestGroupKickoff) {
      soonestGroupKickoff = k;
      soonestGroupId = g;
    }
  }

  // Soonest knockout not yet locked
  let soonestKnockoutKickoff = Infinity;
  let soonestKnockoutLabel: string | null = null;
  for (const f of knockoutOrder) {
    if (nowMs < f.kickoffMs && f.kickoffMs < soonestKnockoutKickoff) {
      soonestKnockoutKickoff = f.kickoffMs;
      soonestKnockoutLabel = `${roundLabel(f.round)} #${f.index + 1}`;
    }
  }

  if (soonestGroupKickoff < Infinity && soonestGroupKickoff < soonestKnockoutKickoff) {
    nextLockAt = new Date(soonestGroupKickoff);
    nextLockLabel = `Group ${soonestGroupId}`;
  } else if (soonestKnockoutKickoff < Infinity) {
    nextLockAt = new Date(soonestKnockoutKickoff);
    nextLockLabel = soonestKnockoutLabel;
  }

  // Derive the phase
  const anyGroupLocked = GROUP_IDS.some(isGroupLocked);
  const allGroupsLocked = GROUP_IDS.every(isGroupLocked);
  const anyKnockoutLocked = KNOCKOUT_FIXTURES.some((f) =>
    isMatchLocked(f.round, f.index)
  );
  const allKnockoutsLocked = KNOCKOUT_FIXTURES.every((f) =>
    isMatchLocked(f.round, f.index)
  );

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

  return {
    isGroupLocked,
    isMatchLocked,
    phase,
    nextLockAt,
    nextLockLabel
  };
}

// Re-export the type so callers can import it from this file
export type { GroupId, KnockoutRoundId };
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

import { computeBracketLockState } from "./computeBracketLockState";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// Helper to build a Date from an ISO string
const at = (iso: string) => new Date(iso);

// --- Phase: "pre" (before any group kickoff) ---
{
  const s = computeBracketLockState(at("2026-06-01T00:00:00Z"));
  assert(s.phase === "pre", `expected pre, got ${s.phase}`);
  assert(!s.isGroupLocked("A"), "Group A should be unlocked");
  assert(!s.isMatchLocked("r32", 0), "R32 #0 should be unlocked");
  assert(s.nextLockLabel === "Group A", `nextLockLabel was ${s.nextLockLabel}`);
  assert(
    s.nextLockAt?.toISOString() === "2026-06-11T19:00:00Z",
    `nextLockAt was ${s.nextLockAt?.toISOString()}`
  );
}

// --- Phase: "phase1-closing" (some groups locked, some not) ---
{
  // June 14, 6pm UTC — A, B, D, E should be locked; C and the rest not.
  // (Group C kickoff is June 13 22:00 UTC. June 14 18:00 > June 13 22:00, so C IS locked too.)
  // Let's pick a time after A's kickoff but before all 12. Actually:
  //   - A locks June 11 19:00 UTC  ← past
  //   - B locks June 12 19:00 UTC  ← past
  //   - D locks June 13 01:00 UTC  ← past
  //   - C locks June 13 22:00 UTC  ← past
  //   - E locks June 14 17:00 UTC  ← past
  //   - F locks June 14 20:00 UTC  ← future
  // So at June 14 18:00 UTC: 5 of 12 locked.
  const s = computeBracketLockState(at("2026-06-14T18:00:00Z"));
  assert(s.phase === "phase1-closing", `expected phase1-closing, got ${s.phase}`);
  assert(s.isGroupLocked("A"), "Group A should be locked");
  assert(s.isGroupLocked("E"), "Group E should be locked");
  assert(!s.isGroupLocked("F"), "Group F should NOT be locked");
  assert(!s.isMatchLocked("r32", 0), "R32 #0 should still be unlocked");
  assert(s.nextLockLabel === "Group F", `nextLockLabel was ${s.nextLockLabel}`);
}

// --- Phase: "between" (all groups locked, no knockout kickoff yet) ---
{
  // June 27 23:59 UTC — all 12 groups locked (last group L kickoff June 17), no knockout yet
  // (First knockout R32 #0 kickoff: June 28 19:00 UTC)
  const s = computeBracketLockState(at("2026-06-27T23:59:00Z"));
  assert(s.phase === "between", `expected between, got ${s.phase}`);
  for (const g of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const) {
    assert(s.isGroupLocked(g), `Group ${g} should be locked`);
  }
  assert(!s.isMatchLocked("r32", 0), "R32 #0 should not be locked yet");
  assert(s.nextLockLabel === "R32 #1", `nextLockLabel was ${s.nextLockLabel}`);
  assert(
    s.nextLockAt?.toISOString() === "2026-06-28T19:00:00Z",
    `nextLockAt was ${s.nextLockAt?.toISOString()}`
  );
}

// --- Phase: "phase2-closing" (some knockouts locked) ---
{
  // July 1 12:00 UTC — first ~7 R32 matches locked
  const s = computeBracketLockState(at("2026-07-01T12:00:00Z"));
  assert(s.phase === "phase2-closing", `expected phase2-closing, got ${s.phase}`);
  assert(s.isMatchLocked("r32", 0), "R32 #0 should be locked");
  assert(s.isMatchLocked("r32", 6), "R32 #6 should be locked");
  assert(!s.isMatchLocked("r32", 7), "R32 #7 should NOT be locked");
  assert(!s.isMatchLocked("final", 0), "Final should NOT be locked");
}

// --- Phase: "complete" (everything locked) ---
{
  const s = computeBracketLockState(at("2026-08-01T00:00:00Z"));
  assert(s.phase === "complete", `expected complete, got ${s.phase}`);
  assert(s.isGroupLocked("A"), "Group A should be locked");
  assert(s.isMatchLocked("final", 0), "Final should be locked");
  assert(s.nextLockAt === null, "nextLockAt should be null when everything locked");
  assert(s.nextLockLabel === null, "nextLockLabel should be null when everything locked");
}

// --- Boundary: exactly at a kickoff ---
{
  // At exactly Group A's kickoff (19:00:00.000Z) — should be locked (>=, not >).
  const s = computeBracketLockState(at("2026-06-11T19:00:00Z"));
  assert(s.isGroupLocked("A"), "Group A should be locked at exact kickoff moment");
}

// --- Boundary: 1ms before kickoff ---
{
  const s = computeBracketLockState(at("2026-06-11T18:59:59.999Z"));
  assert(!s.isGroupLocked("A"), "Group A should NOT be locked 1ms before kickoff");
}

console.log("OK: all computeBracketLockState assertions passed");
```

- [ ] **Step 2: Run the test**

```bash
pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
```

Expected: `OK: all computeBracketLockState assertions passed`.

If any assertion fails, fix `computeBracketLockState.ts` and re-run. Do NOT rewrite the test to match buggy code.

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
 * Fetches server time from Supabase periodically and exposes a derived "now".
 * Falls back to device clock + last-known-offset on repeated failures.
 *
 * We compute an offset between server time and the device's `Date.now()` after
 * each successful fetch. Render-time `now` is then derived as
 * `Date.now() + offset` so the clock advances smoothly between polls without
 * needing a 1Hz interval.
 */
export function useTournamentClock(): TournamentClock {
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const failureCountRef = useRef(0);
  // Force a re-render every 60s so countdowns tick down without each consumer
  // needing its own interval. The value itself is unused.
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchServerNow = async () => {
      try {
        const { data, error } = await supabase.rpc("get_server_time");
        if (error) throw error;
        const serverMs = typeof data === "number" ? data * 1000 : new Date(String(data)).getTime();
        if (cancelled || !Number.isFinite(serverMs)) return;
        setOffsetMs(serverMs - Date.now());
        setIsUsingFallback(false);
        failureCountRef.current = 0;
      } catch {
        // Fallback path: try a lightweight query as a sanity check, but we
        // ultimately just use device clock + last known offset.
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

- [ ] **Step 2: Add the `get_server_time` SQL function so the hook has something to call**

This is tiny — add it to the same migration we'll create in Task 7. For now, the hook will gracefully fall back to device clock until the migration ships.

(No file edit this step — just a mental bookmark. Task 7 wires it up.)

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/bracket/hooks/useTournamentClock.ts
git commit -m "feat(bracket): useTournamentClock hook with server-time fetch + device fallback"
```

---

## Task 6: `useBracketLockState` hook

Thin reactive wrapper around `useTournamentClock` + `computeBracketLockState`.

**Files:**
- Create: `apps/mobile/src/features/bracket/hooks/useBracketLockState.ts`

- [ ] **Step 1: Write the hook**

```ts
// apps/mobile/src/features/bracket/hooks/useBracketLockState.ts
import { useMemo } from "react";
import {
  computeBracketLockState,
  type BracketLockState
} from "../lib/computeBracketLockState";
import { useTournamentClock } from "./useTournamentClock";

export interface UseBracketLockState extends BracketLockState {
  /** True when the server clock is unreachable — surface a warning banner. */
  isClockFallback: boolean;
}

export function useBracketLockState(): UseBracketLockState {
  const { now, isUsingFallback } = useTournamentClock();

  // Memoize so the helper functions retain reference stability between renders
  // when `now` hasn't crossed a fixture boundary. (For consumers that pass
  // these to React.memo'd children.) We bucket `now` to 5-second granularity
  // since sub-second precision doesn't matter for hour-scale countdowns.
  const bucketedNowMs = Math.floor(now.getTime() / 5000) * 5000;

  const lockState = useMemo(
    () => computeBracketLockState(new Date(bucketedNowMs)),
    [bucketedNowMs]
  );

  return { ...lockState, isClockFallback: isUsingFallback };
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
git commit -m "feat(bracket): useBracketLockState hook"
```

---

## Task 7: SQL migration — drop binary RLS + add unique index + `get_server_time`

**Files:**
- Create: `supabase/migrations/000020_bracket_phased_locks.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/000020_bracket_phased_locks.sql
-- Phased bracket lockout: drop the binary `locked_at IS NULL` RLS rule, force
-- writes through the submit-bracket edge function (which now validates each
-- pick against its fixture's kickoff). Add a unique constraint so the edge
-- function can rely on at-most-one (user_id, group_id) bracket row.

-- 1. Drop the binary lock policy.
--    The `locked_at` COLUMN stays (nullable, unused). Future PRs may repurpose.
drop policy if exists "Users can update unlocked own brackets" on public.brackets;

-- 2. Block ALL direct UPDATEs to brackets. Both personal and group brackets
--    must now route through the submit-bracket edge function, which uses the
--    service role to write past RLS.
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
--    Lets useTournamentClock derive an offset and present trustworthy
--    countdowns even if the device clock drifts.
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

- [ ] **Step 2: Apply the migration to your local Supabase**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
supabase db reset  # if you have a local Supabase running
```

If you don't have a local Supabase instance, defer this step until Task 23 (manual smoke test) and rely on typecheck + the parity script for confidence.

- [ ] **Step 3: Verify in psql (optional, if local Supabase available)**

```bash
supabase db psql -c "select public.get_server_time();"
```

Expected: a single row with the current server timestamp.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/000020_bracket_phased_locks.sql
git commit -m "feat(supabase): migration 000020 — drop binary lock RLS, add bracket unique index, expose get_server_time RPC"
```

---

## Task 8: Mirror fixtures into the edge function + parity script

**Files:**
- Create: `supabase/functions/submit-bracket/fixtures.ts`
- Create: `scripts/verify-fixtures.ts`
- Modify: `package.json` (root)

- [ ] **Step 1: Copy fixture data into the edge function**

Edge functions run in Deno; they can't `import` from `@world-cup-game/config` (workspace alias). We keep a literal copy here and assert parity with a script in CI.

Create `supabase/functions/submit-bracket/fixtures.ts` with EXACTLY the same constants as `packages/config/src/fixtures.ts`, minus the `GroupId` import (Deno can't resolve it). Inline the type instead:

```ts
// supabase/functions/submit-bracket/fixtures.ts
// MIRROR of packages/config/src/fixtures.ts. Kept in sync by scripts/verify-fixtures.ts.

export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export type KnockoutRoundId = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export interface KnockoutFixture {
  round: KnockoutRoundId;
  index: number;
  kickoff: string;
}

export const GROUP_FIRST_KICKOFF_UTC: Record<GroupId, string> = {
  A: "2026-06-11T19:00:00Z",
  B: "2026-06-12T19:00:00Z",
  C: "2026-06-13T22:00:00Z",
  D: "2026-06-13T01:00:00Z",
  E: "2026-06-14T17:00:00Z",
  F: "2026-06-14T20:00:00Z",
  G: "2026-06-15T22:00:00Z",
  H: "2026-06-15T17:00:00Z",
  I: "2026-06-16T19:00:00Z",
  J: "2026-06-17T01:00:00Z",
  K: "2026-06-17T17:00:00Z",
  L: "2026-06-17T20:00:00Z"
};

export const KNOCKOUT_FIXTURES: readonly KnockoutFixture[] = [
  { round: "r32", index:  0, kickoff: "2026-06-28T19:00:00Z" },
  { round: "r32", index:  1, kickoff: "2026-06-29T17:00:00Z" },
  { round: "r32", index:  2, kickoff: "2026-06-29T20:30:00Z" },
  { round: "r32", index:  3, kickoff: "2026-06-30T01:00:00Z" },
  { round: "r32", index:  4, kickoff: "2026-06-30T17:00:00Z" },
  { round: "r32", index:  5, kickoff: "2026-06-30T21:00:00Z" },
  { round: "r32", index:  6, kickoff: "2026-07-01T01:00:00Z" },
  { round: "r32", index:  7, kickoff: "2026-07-01T16:00:00Z" },
  { round: "r32", index:  8, kickoff: "2026-07-01T20:00:00Z" },
  { round: "r32", index:  9, kickoff: "2026-07-02T00:00:00Z" },
  { round: "r32", index: 10, kickoff: "2026-07-02T19:00:00Z" },
  { round: "r32", index: 11, kickoff: "2026-07-02T23:00:00Z" },
  { round: "r32", index: 12, kickoff: "2026-07-03T03:00:00Z" },
  { round: "r32", index: 13, kickoff: "2026-07-03T18:00:00Z" },
  { round: "r32", index: 14, kickoff: "2026-07-03T22:00:00Z" },
  { round: "r32", index: 15, kickoff: "2026-07-04T01:30:00Z" },
  { round: "r16", index:  0, kickoff: "2026-07-04T19:00:00Z" },
  { round: "r16", index:  1, kickoff: "2026-07-05T00:00:00Z" },
  { round: "r16", index:  2, kickoff: "2026-07-05T23:00:00Z" },
  { round: "r16", index:  3, kickoff: "2026-07-06T00:00:00Z" },
  { round: "r16", index:  4, kickoff: "2026-07-06T23:00:00Z" },
  { round: "r16", index:  5, kickoff: "2026-07-07T00:00:00Z" },
  { round: "r16", index:  6, kickoff: "2026-07-07T20:00:00Z" },
  { round: "r16", index:  7, kickoff: "2026-07-07T20:00:00Z" },
  { round: "qf",  index:  0, kickoff: "2026-07-10T00:00:00Z" },
  { round: "qf",  index:  1, kickoff: "2026-07-10T19:00:00Z" },
  { round: "qf",  index:  2, kickoff: "2026-07-12T01:00:00Z" },
  { round: "qf",  index:  3, kickoff: "2026-07-12T01:00:00Z" },
  { round: "sf",  index:  0, kickoff: "2026-07-14T23:00:00Z" },
  { round: "sf",  index:  1, kickoff: "2026-07-15T23:00:00Z" },
  { round: "third", index: 0, kickoff: "2026-07-19T01:00:00Z" },
  { round: "final", index: 0, kickoff: "2026-07-19T23:00:00Z" }
];
```

- [ ] **Step 2: Write the parity script**

Create `scripts/verify-fixtures.ts`:

```ts
// scripts/verify-fixtures.ts
//
// Asserts the fixture constants in packages/config/src/fixtures.ts and
// supabase/functions/submit-bracket/fixtures.ts are byte-for-byte aligned
// on the actual data values. Run via `pnpm verify:fixtures`.
//
// We compare by parsing both files' exported constants — not raw text — so
// formatting differences (comments, whitespace) don't cause spurious failures.

import {
  GROUP_FIRST_KICKOFF_UTC as appGroups,
  KNOCKOUT_FIXTURES as appKnockouts
} from "../packages/config/src/fixtures";
import {
  GROUP_FIRST_KICKOFF_UTC as edgeGroups,
  KNOCKOUT_FIXTURES as edgeKnockouts
} from "../supabase/functions/submit-bracket/fixtures";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// Compare groups
const appKeys = Object.keys(appGroups).sort();
const edgeKeys = Object.keys(edgeGroups).sort();
if (JSON.stringify(appKeys) !== JSON.stringify(edgeKeys)) {
  fail(`Group keys differ:\n  app:  ${appKeys.join(",")}\n  edge: ${edgeKeys.join(",")}`);
}
for (const k of appKeys) {
  const a = (appGroups as Record<string, string>)[k];
  const e = (edgeGroups as Record<string, string>)[k];
  if (a !== e) fail(`Group ${k} kickoff differs: app=${a} edge=${e}`);
}

// Compare knockouts
if (appKnockouts.length !== edgeKnockouts.length) {
  fail(`Knockout count differs: app=${appKnockouts.length} edge=${edgeKnockouts.length}`);
}
const serialize = (f: { round: string; index: number; kickoff: string }) =>
  `${f.round}:${f.index}=${f.kickoff}`;
const appSorted = [...appKnockouts].map(serialize).sort();
const edgeSorted = [...edgeKnockouts].map(serialize).sort();
for (let i = 0; i < appSorted.length; i++) {
  if (appSorted[i] !== edgeSorted[i]) {
    fail(`Knockout mismatch at index ${i}:\n  app:  ${appSorted[i]}\n  edge: ${edgeSorted[i]}`);
  }
}

console.log("✓ fixtures.ts files are in sync");
```

- [ ] **Step 3: Add the `verify:fixtures` script to root package.json**

Open `package.json` (root). Add to the `scripts` object:

```json
"verify:fixtures": "tsx scripts/verify-fixtures.ts"
```

- [ ] **Step 4: Run the parity check**

```bash
pnpm verify:fixtures
```

Expected: `✓ fixtures.ts files are in sync`. If you see a mismatch, fix whichever file is wrong (the canonical source is `packages/config/src/fixtures.ts`).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/submit-bracket/fixtures.ts scripts/verify-fixtures.ts package.json
git commit -m "feat: mirror fixtures into submit-bracket edge function + parity script"
```

---

## Task 9: Add fixture validation to `submit-bracket` edge function

This is the largest backend change. The edge function now:
1. Imports fixtures from the local copy
2. Reads existing saved picks (to determine which differ from the new payload)
3. For each pick that differs from existing AND has a passed kickoff → mark invalid
4. If any invalid → return `{ ok: false, code: "PICK_PAST_LOCKOUT", invalidGroups, invalidMatches }` with HTTP 200 (structured error, not 4xx)
5. Otherwise → upsert and return `{ ok: true, bracket }`
6. Also: drop the `existingBracket?.locked_at` binary check (the new model doesn't use it)

**Files:**
- Create: `supabase/functions/submit-bracket/validateFixtures.ts`
- Modify: `supabase/functions/submit-bracket/index.ts`

- [ ] **Step 1: Create the validation module**

```ts
// supabase/functions/submit-bracket/validateFixtures.ts
import {
  GROUP_FIRST_KICKOFF_UTC,
  KNOCKOUT_FIXTURES,
  type GroupId,
  type KnockoutRoundId
} from "./fixtures.ts";

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

const KNOCKOUT_KICKOFF_MAP: Map<string, number> = new Map(
  KNOCKOUT_FIXTURES.map((f) => [`${f.round}:${f.index}`, new Date(f.kickoff).getTime()])
);

const GROUP_KICKOFF_MAP: Map<string, number> = new Map(
  Object.entries(GROUP_FIRST_KICKOFF_UTC).map(([g, iso]) => [g, new Date(iso).getTime()])
);

/**
 * Compare `next` picks against `existing` (if any). Any pick whose value
 * CHANGES and whose corresponding fixture has already kicked off is invalid.
 *
 * Picks that match existing values (or pre-existing entries the user didn't
 * touch) pass validation even if their kickoff has passed — we're only
 * blocking CHANGES to locked units.
 */
export function validateBracketAgainstFixtures(
  nowMs: number,
  next: BracketPicksPayload,
  existing: BracketPicksPayload | null
): FixtureValidationResult {
  const invalidGroups: string[] = [];
  const invalidMatches: Array<{ round: KnockoutRoundId; index: number }> = [];

  // Group rankings
  for (const [g, ranking] of Object.entries(next.groupRankings)) {
    const kickoffMs = GROUP_KICKOFF_MAP.get(g);
    if (kickoffMs === undefined) continue; // unknown group — ignore (schema parse rejects)
    if (nowMs < kickoffMs) continue; // not locked yet
    const prevRanking = existing?.groupRankings?.[g];
    if (!arraysEqual(prevRanking, ranking)) {
      invalidGroups.push(g);
    }
  }

  // Knockout picks per round
  for (const round of ["r32", "r16", "qf", "sf"] as const) {
    const nextRound = next.picks[round] ?? {};
    const prevRound = existing?.picks?.[round] ?? {};
    for (const [indexStr, teamCode] of Object.entries(nextRound)) {
      const index = Number(indexStr);
      const kickoffMs = KNOCKOUT_KICKOFF_MAP.get(`${round}:${index}`);
      if (kickoffMs === undefined) continue;
      if (nowMs < kickoffMs) continue;
      if (prevRound[indexStr] !== teamCode) {
        invalidMatches.push({ round, index });
      }
    }
  }

  // Final
  if (next.picks.final !== (existing?.picks?.final ?? null)) {
    const k = KNOCKOUT_KICKOFF_MAP.get("final:0");
    if (k !== undefined && nowMs >= k) {
      invalidMatches.push({ round: "final", index: 0 });
    }
  }

  // Third-place
  if (next.picks.third !== (existing?.picks?.third ?? null)) {
    const k = KNOCKOUT_KICKOFF_MAP.get("third:0");
    if (k !== undefined && nowMs >= k) {
      invalidMatches.push({ round: "third", index: 0 });
    }
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

**a) Add the import near the top** (after the existing imports):

```ts
import { validateBracketAgainstFixtures, type BracketPicksPayload } from "./validateFixtures.ts";
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

**c) Inside the `Deno.serve` handler, RIGHT AFTER the existing-bracket fetch and BEFORE the `existingBracket?.locked_at` check**, insert:

```ts
    // Group bracket: confirm membership before allowing the write.
    if (input.groupId) {
      const isMember = await isGroupMember(supabase, input.groupId, userData.user.id);
      if (!isMember) {
        return jsonResponse(
          { ok: false, code: "NOT_GROUP_MEMBER" },
          200 // structured client-handleable error, not 4xx
        );
      }
    }

    // Fixture validation: any CHANGED pick on a passed-kickoff unit is rejected.
    const existingPicks =
      existingBracket
        ? await fetchExistingPicks(supabase, existingBracket.id)
        : null;

    const validation = validateBracketAgainstFixtures(
      Date.now(),
      input.picks as BracketPicksPayload,
      existingPicks
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

**d) Remove the binary `existingBracket?.locked_at` check** entirely — replace this block:

```ts
    if (existingBracket?.locked_at) {
      return jsonResponse({ error: "This bracket is locked and can no longer be changed." }, 409);
    }
```

…with just a comment:

```ts
    // (Binary `locked_at` check removed — phased lockout is enforced by
    // validateBracketAgainstFixtures above. The locked_at column remains
    // nullable on the table but is no longer consulted.)
```

**e) Add the `fetchExistingPicks` helper above `Deno.serve`:**

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

**f) Wrap the final success response** so callers always get `{ ok, bracket }`:

Find:
```ts
    return jsonResponse({ bracket: mapBracket(savedBracket) });
```

Replace with:
```ts
    return jsonResponse({ ok: true, bracket: mapBracket(savedBracket) });
```

- [ ] **Step 3: Local syntax check (optional, requires Deno)**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
deno check supabase/functions/submit-bracket/index.ts
```

Expected: no errors. If Deno isn't installed, skip this — the deploy step will surface errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/submit-bracket/validateFixtures.ts \
        supabase/functions/submit-bracket/index.ts
git commit -m "feat(edge): submit-bracket validates picks against fixture kickoffs"
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
import { validateBracketAgainstFixtures, type BracketPicksPayload } from "./validateFixtures.ts";

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

const beforeAnyKickoff = new Date("2026-06-01T00:00:00Z").getTime();
const afterGroupA = new Date("2026-06-12T00:00:00Z").getTime(); // A kicked off June 11 19:00
const afterAllGroups = new Date("2026-06-28T00:00:00Z").getTime();
const afterFirstR32 = new Date("2026-06-29T00:00:00Z").getTime();

Deno.test("before any kickoff: all changes accepted", () => {
  const result = validateBracketAgainstFixtures(
    beforeAnyKickoff,
    picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } }),
    null
  );
  assertEquals(result.invalidGroups, []);
  assertEquals(result.invalidMatches, []);
});

Deno.test("changing locked group is rejected", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["RSA", "MEX", "X", "Y"] } }); // swap top 2

  const result = validateBracketAgainstFixtures(afterGroupA, next, existing);
  assertEquals(result.invalidGroups, ["A"]);
});

Deno.test("identical pick on locked group is accepted (no-op)", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(afterGroupA, next, existing);
  assertEquals(result.invalidGroups, []);
});

Deno.test("changing unlocked group is accepted even after another group locked", () => {
  const existing = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"], F: ["NED", "JPN", "X", "Y"] }
  });
  const next = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"], F: ["JPN", "NED", "X", "Y"] } // swap F
  });

  // After Group A but before Group F kicks off
  const result = validateBracketAgainstFixtures(afterGroupA, next, existing);
  assertEquals(result.invalidGroups, []);
});

Deno.test("changing locked knockout match is rejected", () => {
  const existing = picks({ picks: { ...emptyPicks.picks, r32: { 0: "BRA" } } });
  const next = picks({ picks: { ...emptyPicks.picks, r32: { 0: "ARG" } } });

  const result = validateBracketAgainstFixtures(afterFirstR32, next, existing);
  assertEquals(result.invalidMatches, [{ round: "r32", index: 0 }]);
});

Deno.test("first-time save of a locked unit IS rejected (no existing value)", () => {
  // User never set Group A. Now after kickoff they try to save it for the first time.
  const next = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(afterGroupA, next, null);
  // No existing → prevRanking is undefined → arraysEqual returns false → invalid.
  assertEquals(result.invalidGroups, ["A"]);
});

Deno.test("changing locked final pick is rejected", () => {
  const existing = picks({ picks: { ...emptyPicks.picks, final: "BRA" } });
  const next = picks({ picks: { ...emptyPicks.picks, final: "ARG" } });
  // Final kicks off July 19. Use a time after final kickoff.
  const afterFinal = new Date("2026-07-20T00:00:00Z").getTime();

  const result = validateBracketAgainstFixtures(afterFinal, next, existing);
  assertEquals(result.invalidMatches, [{ round: "final", index: 0 }]);
});

Deno.test("all groups locked, all knockouts unlocked: phase-between behavior", () => {
  const existing = null;
  const next = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"] }, // change to locked group
    picks: { ...emptyPicks.picks, r32: { 0: "BRA" } } // new R32 pick (knockout unlocked)
  });

  const result = validateBracketAgainstFixtures(afterAllGroups, next, existing);
  assertEquals(result.invalidGroups, ["A"]);
  assertEquals(result.invalidMatches, []); // R32 #0 hasn't kicked off yet at June 28 00:00
});
```

- [ ] **Step 2: Run the tests (requires Deno)**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
deno test supabase/functions/submit-bracket/validateFixtures.test.ts
```

Expected: all 8 tests pass.

If Deno isn't installed locally: `brew install deno` (Mac) or `curl -fsSL https://deno.land/install.sh | sh`.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/submit-bracket/validateFixtures.test.ts
git commit -m "test(edge): cover validateBracketAgainstFixtures lock semantics"
```

---

## Task 11: Update brackets API to surface `PICK_PAST_LOCKOUT`

The client now needs to call the edge function with optional `groupId` and parse the new response shape.

**Files:**
- Modify: `apps/mobile/src/features/bracket/api/brackets.ts`
- Modify: `apps/mobile/src/features/bracket/types.ts`

- [ ] **Step 1: Add the error type to `types.ts`**

Open `apps/mobile/src/features/bracket/types.ts`. Append at the bottom:

```ts
import type { KnockoutRoundId } from "@world-cup-game/config";

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

## Task 12: Extend `BracketContext` with lock helpers + partial-save retry

**Files:**
- Modify: `apps/mobile/src/features/bracket/BracketContext.tsx`

- [ ] **Step 1: Wire in the lock-state hook + helpers + retry**

Open `apps/mobile/src/features/bracket/BracketContext.tsx`. Apply these changes:

**a) Add imports near the top (after existing imports):**

```ts
import { useBracketLockState } from "./hooks/useBracketLockState";
import type { GroupId, KnockoutRoundId } from "@world-cup-game/config";
import { PickPastLockoutError } from "./types";
```

**b) Extend the `BracketContextValue` interface** (find the existing one and add):

```ts
interface BracketContextValue extends BracketState {
  // ... existing fields ...
  /** True if Group X is past kickoff (picks frozen). */
  isGroupLocked: (group: GroupId) => boolean;
  /** True if a specific knockout match is past kickoff (pick frozen). */
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  /** True if useBracketLockState reports it can't reach the server clock. */
  isClockFallback: boolean;
  /** "pre" | "phase1-closing" | "between" | "phase2-closing" | "complete" */
  phase: ReturnType<typeof useBracketLockState>["phase"];
  /** When the next unit locks (null if everything's locked). */
  nextLockAt: Date | null;
  /** Human label for the next-locking unit. */
  nextLockLabel: string | null;
}
```

**c) Inside `BracketProvider`, call the hook:**

```ts
  const lockState = useBracketLockState();
```

**d) Modify `saveBracket` to handle partial-save races.** Replace the existing `saveBracket` implementation with:

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
      const saved = await submitCurrentBracket(persisted, null /* personal */);
      setLastSavedAt(saved.updatedAt);
    } catch (err) {
      if (err instanceof PickPastLockoutError) {
        // Drop invalid picks from local state, reverting them to whatever was
        // last saved (re-fetch via getCurrentBracket). Then retry ONCE with the
        // cleaned picks so the still-valid ones land.
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

        // Retry once with the cleaned picks
        try {
          const retried = await submitCurrentBracket(
            { groupRankings: revertedRankings, picks: revertedPicks },
            null
          );
          setLastSavedAt(retried.updatedAt);
          setSaveError(
            new Error(
              `Some picks were locked while editing — your other picks saved.`
            )
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
  }, [groupRankings, picks, user]);
```

**e) Add the helpers and lock-state pass-throughs to the context value:**

Find the existing `value` object passed to `<BracketContext.Provider value={...}>` and extend it:

```ts
  const value: BracketContextValue = {
    // ... existing fields ...
    isGroupLocked: lockState.isGroupLocked,
    isMatchLocked: lockState.isMatchLocked,
    isClockFallback: lockState.isClockFallback,
    phase: lockState.phase,
    nextLockAt: lockState.nextLockAt,
    nextLockLabel: lockState.nextLockLabel
  };
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors. If you see "Property 'isGroupLocked' does not exist on type BracketContextValue" — the interface extension didn't land; re-check step (b).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/BracketContext.tsx
git commit -m "feat(bracket): expose lock helpers + partial-save retry from BracketContext"
```

---

## Task 13: `PhaseHeroCard` component

5-state status card sitting at the top of the bracket tab.

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

export function PhaseHeroCard({
  phase,
  nextLockAt,
  nextLockLabel,
  now
}: PhaseHeroCardProps) {
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

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/components/PhaseHeroCard.tsx
git commit -m "feat(bracket): PhaseHeroCard component (5 phase states)"
```

---

## Task 14: `LateJoinerBanner` component

Dismissible banner shown if user opens the bracket tab after some units are already locked.

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
  /** Number of groups already locked at first open. */
  lockedGroupCount: number;
  /** Number of knockout matches already locked at first open. */
  lockedMatchCount: number;
}

export function LateJoinerBanner({
  lockedGroupCount,
  lockedMatchCount
}: LateJoinerBannerProps) {
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
  bold: {
    fontWeight: "900"
  },
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

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx
git commit -m "feat(bracket): LateJoinerBanner with AsyncStorage dismiss memory"
```

---

## Task 15: Update `SubTabBar` with lock icons + Phase 2 eyebrows

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/SubTabBar.tsx`

- [ ] **Step 1: Read the existing file**

```bash
cat apps/mobile/src/features/bracket/components/SubTabBar.tsx
```

Note its prop interface and structure.

- [ ] **Step 2: Add `isLocked?: boolean` and `phase2Hint?: boolean` props per tab**

Edit `SubTabBar.tsx`. Wherever a tab is rendered:

- When `isLocked` is true, append a `🔒` next to the tab label
- When `phase2Hint` is true (R32/R16/QF/SF tabs while phase is "pre" or "phase1-closing"), render a tiny eyebrow above the label: `PHASE 2`

Exact diff depends on the file's current shape. After the edit, the tab row should accept:

```ts
interface SubTabBarItem {
  key: SubTab;
  label: string;
  isLocked?: boolean;
  phase2Hint?: boolean;
}
```

And the caller (`bracket.tsx` tab page) computes `isLocked` per tab from `BracketContext.isGroupLocked`/`isMatchLocked` aggregated across all units that tab covers.

- [ ] **Step 3: Update the caller to pass new props**

In `apps/mobile/app/(tabs)/bracket.tsx`, where `<SubTabBar />` is rendered, derive locked state for each tab:

```ts
const { isGroupLocked, isMatchLocked, phase } = useBracket();
const allGroupsLocked = GROUP_IDS.every(isGroupLocked);
const isPhase2HintActive = phase === "pre" || phase === "phase1-closing";

const items: SubTabBarItem[] = [
  { key: "groups", label: "Groups", isLocked: allGroupsLocked },
  { key: "r32",    label: "R32",    isLocked: KNOCKOUT_FIXTURES.filter(f=>f.round==="r32").every(f=>isMatchLocked("r32", f.index)), phase2Hint: isPhase2HintActive },
  // ... r16, qf, sf similarly ...
  { key: "summary", label: "Summary" }
];
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/bracket/components/SubTabBar.tsx \
        apps/mobile/app/\(tabs\)/bracket.tsx
git commit -m "feat(bracket): SubTabBar shows lock icons + Phase 2 eyebrows"
```

---

## Task 16: Update `GroupPicker` — locked state + dual CTA

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/GroupPicker.tsx`

- [ ] **Step 1: Add locked-state rendering**

Edit `GroupPicker.tsx`. Pull `isGroupLocked` from `useBracket()`:

```ts
const { groupRankings, moveTeamUp, moveTeamDown, resetGroup, isGroupLocked, saveBracket } = useBracket();
const locked = isGroupLocked(groupId);
```

In the JSX, when `locked` is true:
- Render arrows as `<View style={[styles.arrowButton, styles.arrowDisabled]} />` with no `Pressable`
- Hide the "Reset group" link
- Add a small lock chip next to the group title

```tsx
<Text style={styles.groupTitle}>
  GROUP {groupId}
  {locked ? <Text style={styles.lockChip}>  🔒 LOCKED</Text> : null}
</Text>
```

Add the style:
```ts
lockChip: {
  color: "rgba(12, 59, 46, 0.6)",
  fontSize: 12,
  fontWeight: "900",
  letterSpacing: 0.8
}
```

- [ ] **Step 2: Replace single "Pick Knockouts →" with dual CTA on the LAST group**

Find the `handleNext` and the nav button at the bottom. Replace the `isLast` branch's single button with two buttons:

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

Add `Alert` to the imports from `react-native`. Add the styles:

```ts
dualCtaRow: {
  flexDirection: "row",
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

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/bracket/components/GroupPicker.tsx
git commit -m "feat(bracket): GroupPicker locked-state + dual Save/Continue CTA"
```

---

## Task 17: Update `KnockoutRound` — locked state

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/KnockoutRound.tsx`

- [ ] **Step 1: Add locked-state rendering**

Read the existing `KnockoutRound.tsx`. Pull `isMatchLocked` from `useBracket()`:

```ts
const { isMatchLocked } = useBracket();
```

For each match render, when `isMatchLocked(round, matchIndex)` is true:
- Wrap team-pick buttons in a non-pressable `View` (or `Pressable` with `disabled`)
- Add a lock chip on the matchup

The exact JSX depends on the file's current shape. The chip pattern:

```tsx
{isMatchLocked(round, matchIndex) ? (
  <Text style={styles.lockChip}>🔒 LOCKED</Text>
) : null}
```

Style:
```ts
lockChip: {
  color: "rgba(255, 248, 234, 0.6)",
  fontSize: 11,
  fontWeight: "900"
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/components/KnockoutRound.tsx
git commit -m "feat(bracket): KnockoutRound shows locked-match state"
```

---

## Task 18: Update `BracketSummary` — phase-aware copy + partial-save warning

**Files:**
- Modify: `apps/mobile/src/features/bracket/components/BracketSummary.tsx`

- [ ] **Step 1: Pull phase + saveError from context**

```ts
const { /* ...existing... */ phase, saveError, isClockFallback } = useBracket();
```

- [ ] **Step 2: Surface a clock-fallback banner**

Near the top of the JSX, conditionally render:

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

- [ ] **Step 3: Make Save button label phase-aware**

Find the primary "Save My Bracket" / "Save Bracket" button. Make its label react to `phase`:

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

Disable the button entirely when `phase === "complete"`.

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter mobile typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/bracket/components/BracketSummary.tsx
git commit -m "feat(bracket): BracketSummary phase-aware copy + clock-fallback banner"
```

---

## Task 19: Mount `PhaseHeroCard` + `LateJoinerBanner` in the bracket tab

**Files:**
- Modify: `apps/mobile/app/(tabs)/bracket.tsx`

- [ ] **Step 1: Add imports**

```ts
import { PhaseHeroCard } from "../../src/features/bracket/components/PhaseHeroCard";
import { LateJoinerBanner } from "../../src/features/bracket/components/LateJoinerBanner";
import { useTournamentClock } from "../../src/features/bracket/hooks/useTournamentClock";
import { GROUP_IDS, KNOCKOUT_FIXTURES } from "@world-cup-game/config";
```

- [ ] **Step 2: Add the hero + banner at the top of the bracket screen JSX**

Above the SubTabBar and tab content, insert:

```tsx
const { phase, nextLockAt, nextLockLabel, isGroupLocked, isMatchLocked } = useBracket();
const { now } = useTournamentClock();

const lockedGroupCount = GROUP_IDS.filter(isGroupLocked).length;
const lockedMatchCount = KNOCKOUT_FIXTURES.filter((f) => isMatchLocked(f.round, f.index)).length;

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
    {/* existing SubTabBar + tab content below */}
  </View>
);
```

(Adapt to the file's current structure. The key is: hero + banner render ABOVE existing content.)

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter mobile typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\)/bracket.tsx
git commit -m "feat(bracket): mount PhaseHeroCard + LateJoinerBanner in bracket tab"
```

---

## Task 20: Notifications module — June 27 reminder

**Files:**
- Create: `apps/mobile/src/features/bracket/notifications.ts`

- [ ] **Step 1: Write the scheduler**

```ts
// apps/mobile/src/features/bracket/notifications.ts
import * as Notifications from "expo-notifications";

const NOTIFICATION_IDENTIFIER = "bracket-phase2-open";

// 2026-06-27 21:00 local time. We schedule by Date (local), not UTC.
const PHASE_2_REMINDER_DATE = new Date("2026-06-27T21:00:00");

/**
 * Idempotently schedule a single local notification reminding the user that
 * Phase 2 has opened. No-op if:
 *   - User has already received OR has scheduled this notification
 *   - User denied notification permission
 *   - The reminder date has already passed
 */
export async function scheduleKnockoutReminder(): Promise<void> {
  // Don't schedule a date that's already passed
  if (PHASE_2_REMINDER_DATE.getTime() <= Date.now()) return;

  // Check permission — bail silently if denied
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") return;

  // Idempotent: don't schedule twice
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  if (existing.some((n) => n.identifier === NOTIFICATION_IDENTIFIER)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIER,
    content: {
      title: "⚽ Phase 2 is open!",
      body: "Group stage is locked. Pick your knockouts before R32 kicks off tomorrow."
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: PHASE_2_REMINDER_DATE }
  });
}

/** Test helper: cancel any pre-existing scheduled phase-2 reminder. */
export async function cancelKnockoutReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/notifications.ts
git commit -m "feat(bracket): idempotent June 27 knockout reminder scheduler"
```

---

## Task 21: Wire notifications into `BracketProvider`

**Files:**
- Modify: `apps/mobile/src/features/bracket/BracketContext.tsx`

- [ ] **Step 1: Schedule on bracket load**

In `BracketProvider`, inside the `useEffect` that fetches the current bracket on auth, add (after the `getCurrentBracket()` resolves successfully):

```ts
import { scheduleKnockoutReminder } from "./notifications";

// inside the useEffect:
void scheduleKnockoutReminder().catch(() => {
  // ignore — best-effort
});
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter mobile typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/bracket/BracketContext.tsx
git commit -m "feat(bracket): wire knockout reminder scheduling into BracketProvider"
```

---

## Task 22: Group bracket audit + integration

**Files:**
- Investigate: `apps/mobile/src/features/groups/`
- Modify: any group-bracket entry point that calls `submitCurrentBracket(picks)` without `groupId`

- [ ] **Step 1: Find every caller of `submitCurrentBracket`**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
grep -rn "submitCurrentBracket\|saveBracket" apps/mobile/src apps/mobile/app
```

For each caller, determine:
- Is this the personal bracket flow? → already correct (groupId omitted = null)
- Is this a group bracket flow? → must pass `groupId`

- [ ] **Step 2: Audit `BracketProvider` props**

Does `BracketProvider` currently accept a `groupId` prop? Check the file's signature:

```bash
grep -n "BracketProvider\|interface.*Props" apps/mobile/src/features/bracket/BracketContext.tsx
```

If NO `groupId` prop exists, add one:

```ts
interface BracketProviderProps {
  groupId?: string | null;
  children: React.ReactNode;
}

export function BracketProvider({ groupId = null, children }: BracketProviderProps) {
  // ... pass groupId into submitCurrentBracket in saveBracket() ...
}
```

Then update `saveBracket` (in Task 12 you wrote `null` literally — change to use the prop):

```ts
const saved = await submitCurrentBracket(persisted, groupId);
```

- [ ] **Step 3: Update group bracket entry point(s) to pass `groupId`**

Wherever a group bracket screen mounts `BracketProvider`, pass the group ID:

```tsx
<BracketProvider groupId={groupId}>
  {/* ... */}
</BracketProvider>
```

If no group bracket UI exists yet, document that in the PR description: "Server-side enforcement covers group brackets. UI surface to expose group-bracket editing is a separate PR."

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter mobile typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/bracket/BracketContext.tsx
# also any group-bracket entry points you modified
git commit -m "feat(bracket): plumb groupId through BracketProvider for group brackets"
```

---

## Task 23: Manual smoke test plan

No automated UI tests. Walk through these scenarios in Expo Go (browser preview via `pnpm --filter mobile start` then `w`):

- [ ] **Step 1: Run Metro**

```bash
cd "/Users/denverlobo/Desktop/Football Project/Idea3_WorldCup2026_Game"
pnpm --filter mobile start
```

Press `w` once Metro is up to open the web preview.

- [ ] **Step 2: Walk the bracket tab in each phase**

To simulate phases, temporarily override `useTournamentClock`'s `now` return value at the top of the hook. Comment in:

```ts
// TEMP: phase simulation
return { now: new Date("2026-06-14T18:00:00Z"), isUsingFallback: false };
```

For each target phase, confirm:
- Hero card shows the right copy + color
- Groups locked at that time render with 🔒 + no arrows
- Knockouts locked at that time render with 🔒 + inert buttons
- SubTabBar lock icons match
- Late-joiner banner appears once (if applicable), dismisses, and stays dismissed

Phases to test (paste each `new Date(...)` in order):
- `"2026-06-05T00:00:00Z"` → expect `pre`
- `"2026-06-14T18:00:00Z"` → expect `phase1-closing` (Group F still unlocked)
- `"2026-06-27T23:59:00Z"` → expect `between`
- `"2026-07-01T12:00:00Z"` → expect `phase2-closing`
- `"2026-08-01T00:00:00Z"` → expect `complete`

- [ ] **Step 3: Test the dual CTA flow**

In `pre` mode:
1. Navigate to Groups tab
2. Click through to Group L
3. Tap "Save Group Stage"
4. Confirm alert appears with "Set Knockouts Now" + "Back to Bracket" options
5. Tap "Set Knockouts Now" → should advance to R32

- [ ] **Step 4: Test partial-save retry**

This is hard to simulate without backend. Defer to integration testing on staging Supabase.

- [ ] **Step 5: REMOVE the simulation overrides**

Delete the `TEMP: phase simulation` lines from `useTournamentClock.ts` before committing/pushing.

- [ ] **Step 6: Sanity commit** (in case any inline tweaks were committed)

```bash
git status
# if any unintentional diffs, revert with git checkout
```

---

## Task 24: Run the full test + typecheck suite

- [ ] **Step 1: Fixture tests**

```bash
pnpm --filter @world-cup-game/config test
```

Expected: `OK: all fixture assertions passed`.

- [ ] **Step 2: Pure logic tests**

```bash
pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
```

Expected: `OK: all computeBracketLockState assertions passed`.

- [ ] **Step 3: Edge function tests (Deno)**

```bash
deno test supabase/functions/submit-bracket/validateFixtures.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 4: Parity check**

```bash
pnpm verify:fixtures
```

Expected: `✓ fixtures.ts files are in sync`.

- [ ] **Step 5: Full mobile typecheck**

```bash
pnpm --filter mobile typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Deploy the edge function to your Supabase dev project (optional pre-PR sanity)**

```bash
supabase functions deploy submit-bracket
```

Then exercise it from the Expo client — confirm a save round-trip works and a known-locked pick returns `PICK_PAST_LOCKOUT`.

---

## Task 25: Open the PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feature/bracket-phased-lockout
```

- [ ] **Step 2: Open PR via the GitHub URL** (since `gh` CLI isn't available locally)

Visit the URL printed by `git push` (something like `https://github.com/DonavenLobo/Idea3_WorldCup2026_Game/pull/new/feature/bracket-phased-lockout`).

- [ ] **Step 3: PR title**

```
feat: phased bracket lockout (Phase 1 groups + Phase 2 knockouts)
```

- [ ] **Step 4: PR body**

```markdown
## Summary
Splits the bracket flow into Phase 1 (group rankings) and Phase 2 (knockouts) per the design doc at `docs/superpowers/specs/2026-06-03-bracket-phased-lockout-design.md`. Lockout enforcement lives in the existing `submit-bracket` edge function (not a new SQL RPC — see "Architecture deviation from spec" in the design doc).

⚠️ **Deadline: June 11, 2026** — first World Cup kickoff. Anything not merged by then loses Phase 1 entirely.

⚠️ **Coordination ask:** confirm migration number `000020` doesn't collide with anything Donaven has in flight.

### What's in
- Fixture data file (`packages/config/src/fixtures.ts`) + mirror in `supabase/functions/submit-bracket/fixtures.ts` + parity check script (`pnpm verify:fixtures`)
- Migration `000020_bracket_phased_locks.sql`: drops binary lock RLS, adds `(user_id, group_id) NULLS NOT DISTINCT` unique index, exposes `get_server_time()` RPC
- `submit-bracket` edge function validates each pick against its fixture's kickoff; structured `PICK_PAST_LOCKOUT` error for partial-save races
- `useTournamentClock` + `useBracketLockState` hooks (server time with device fallback, pure derivation)
- `PhaseHeroCard` (5 phase states) + `LateJoinerBanner` (dismissible, AsyncStorage memory)
- Locked-state rendering in `GroupPicker` + `KnockoutRound`
- Dual CTA on the last group: "Save Group Stage" / "Set Knockouts Now"
- Phase-aware copy in `BracketSummary`
- June 27 9pm local push reminder (idempotent, permission-gated)
- Group bracket: same enforcement via `BracketProvider`'s new `groupId` prop

### Out of scope (deferred)
- Game results ingestion / scoring against actual outcomes
- Auto-filling R32 matchups from group results
- Per-phase leaderboard splits
- Realtime bracket sync across devices

## Test plan
- [ ] `pnpm --filter @world-cup-game/config test` passes
- [ ] `pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts` passes
- [ ] `deno test supabase/functions/submit-bracket/validateFixtures.test.ts` passes (8 cases)
- [ ] `pnpm verify:fixtures` passes
- [ ] `pnpm --filter mobile typecheck` passes
- [ ] Manual: walk through each of 5 phase states by mocking `useTournamentClock`, confirm hero card, lock icons, dual CTA, late-joiner banner behave correctly
- [ ] Deploy edge function to staging Supabase, confirm `PICK_PAST_LOCKOUT` response with mismatched picks

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 5: After PR is opened, return the URL to Denver**

---

## Notes for the executing agent

- **Stop and ask** if any step's prerequisites aren't met. The plan assumes you're on `feature/bracket-phased-lockout` with a clean working tree.
- **Don't refactor unrelated code.** Stay inside the listed files. If you find a real bug nearby, flag it (e.g. via `mcp__ccd_session__spawn_task`) and keep moving.
- **Run the typecheck after each task.** If it breaks, fix BEFORE committing. The `pnpm --filter mobile typecheck` is fast (~5 seconds).
- **Commit per task.** Frequent commits = easier review + safer to abort.
