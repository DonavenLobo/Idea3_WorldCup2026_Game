// apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
//
// Run with: pnpm dlx tsx apps/mobile/src/features/bracket/lib/computeBracketLockState.test.ts
// Throws on failure, prints "OK" on success.

import {
  computeBracketLockStateFromFinalized,
  type FinalizedState,
  type KnockoutRoundId
} from "./computeBracketLockState";
import { GROUP_IDS } from "@gogaffa/config";
import type { GroupId } from "@gogaffa/config";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

/** Build a FinalizedState from explicit sets of finalized ids. */
function finalized(
  groups: readonly GroupId[],
  rounds: readonly KnockoutRoundId[]
): FinalizedState {
  const groupSet = new Set<GroupId>(groups);
  const roundSet = new Set<KnockoutRoundId>(rounds);
  return {
    isGroupFinalized: (g) => groupSet.has(g),
    isKnockoutRoundFinalized: (r) => roundSet.has(r)
  };
}

const ALL_GROUPS = GROUP_IDS;
const ALL_ROUNDS: readonly KnockoutRoundId[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final"
];

// --- Phase: "groups-open" (no groups finalized) ---
{
  const s = computeBracketLockStateFromFinalized(finalized([], []));
  assert(s.phase === "groups-open", `expected groups-open, got ${s.phase}`);
  for (const g of ALL_GROUPS) {
    assert(!s.isGroupLocked(g), `Group ${g} should be unlocked`);
  }
  for (const r of ALL_ROUNDS) {
    assert(!s.isMatchLocked(r, 0), `${r} #0 should be unlocked`);
    assert(!s.isMatchLocked(r, 5), `${r} #5 should be unlocked`);
  }
}

// --- Phase: "groups-partial" (some groups finalized) ---
{
  const s = computeBracketLockStateFromFinalized(finalized(["A", "C", "E"], []));
  assert(s.phase === "groups-partial", `expected groups-partial, got ${s.phase}`);
  assert(s.isGroupLocked("A"), "Group A should be locked");
  assert(s.isGroupLocked("C"), "Group C should be locked");
  assert(s.isGroupLocked("E"), "Group E should be locked");
  assert(!s.isGroupLocked("B"), "Group B should NOT be locked");
  assert(!s.isGroupLocked("L"), "Group L should NOT be locked");
  for (const r of ALL_ROUNDS) {
    assert(!s.isMatchLocked(r, 0), `${r} #0 should be unlocked when no rounds finalized`);
  }
}

// --- Phase: "groups-done" (all groups finalized, no KO round finalized) ---
{
  const s = computeBracketLockStateFromFinalized(finalized(ALL_GROUPS, []));
  assert(s.phase === "groups-done", `expected groups-done, got ${s.phase}`);
  for (const g of ALL_GROUPS) {
    assert(s.isGroupLocked(g), `Group ${g} should be locked`);
  }
  for (const r of ALL_ROUNDS) {
    assert(!s.isMatchLocked(r, 0), `${r} #0 should be unlocked when round not finalized`);
  }
}

// --- Phase: "knockouts-active" (r32 finalized, rest open) ---
{
  const s = computeBracketLockStateFromFinalized(finalized(ALL_GROUPS, ["r32"]));
  assert(s.phase === "knockouts-active", `expected knockouts-active, got ${s.phase}`);
  // r32 locked per-round — every index
  for (let i = 0; i < 16; i++) {
    assert(s.isMatchLocked("r32", i), `R32 #${i} should be locked once round finalized`);
  }
  // Other rounds untouched
  for (const r of ["r16", "qf", "sf", "third", "final"] as const) {
    assert(!s.isMatchLocked(r, 0), `${r} #0 should NOT be locked`);
  }
  // Groups remain locked
  for (const g of ALL_GROUPS) {
    assert(s.isGroupLocked(g), `Group ${g} should still be locked`);
  }
}

// --- Phase: "knockouts-active" (r32 + r16 + qf finalized) ---
{
  const s = computeBracketLockStateFromFinalized(
    finalized(ALL_GROUPS, ["r32", "r16", "qf"])
  );
  assert(s.phase === "knockouts-active", `expected knockouts-active, got ${s.phase}`);
  for (const r of ["r32", "r16", "qf"] as const) {
    assert(s.isMatchLocked(r, 0), `${r} #0 should be locked`);
    assert(s.isMatchLocked(r, 3), `${r} #3 should be locked`);
  }
  for (const r of ["sf", "third", "final"] as const) {
    assert(!s.isMatchLocked(r, 0), `${r} #0 should NOT be locked yet`);
  }
}

// --- Phase: "complete" (all KO rounds finalized) ---
{
  const s = computeBracketLockStateFromFinalized(finalized(ALL_GROUPS, ALL_ROUNDS));
  assert(s.phase === "complete", `expected complete, got ${s.phase}`);
  for (const g of ALL_GROUPS) {
    assert(s.isGroupLocked(g), `Group ${g} should be locked`);
  }
  for (const r of ALL_ROUNDS) {
    assert(s.isMatchLocked(r, 0), `${r} #0 should be locked`);
  }
}

// --- Edge: complete requires ALL rounds, including third + final ---
{
  // Everything except `third` is finalized → still knockouts-active, not complete.
  const s = computeBracketLockStateFromFinalized(
    finalized(ALL_GROUPS, ["r32", "r16", "qf", "sf", "final"])
  );
  assert(
    s.phase === "knockouts-active",
    `expected knockouts-active when 'third' is unfinished, got ${s.phase}`
  );
  assert(!s.isMatchLocked("third", 0), "Third place match should be unlocked");
  assert(s.isMatchLocked("final", 0), "Final should be locked");
}

// --- Edge: empty FinalizedState predicates are exhaustively false ---
{
  const empty: FinalizedState = {
    isGroupFinalized: () => false,
    isKnockoutRoundFinalized: () => false
  };
  const s = computeBracketLockStateFromFinalized(empty);
  assert(s.phase === "groups-open", `expected groups-open, got ${s.phase}`);
}

console.log("OK: all computeBracketLockState assertions passed");
