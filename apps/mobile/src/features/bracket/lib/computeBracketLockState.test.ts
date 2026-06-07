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
