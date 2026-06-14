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
const insideGroupEditWindow = new Date("2026-06-12T00:00:00Z").getTime();
const afterGroupEditWindow = new Date("2026-06-19T00:00:00Z").getTime();
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

Deno.test("changing group during one-week edit window is accepted", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["RSA", "MEX", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(
    insideGroupEditWindow, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, []);
});

Deno.test("changing group after one-week edit window is rejected", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["RSA", "MEX", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(
    afterGroupEditWindow, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, ["A"]);
});

Deno.test("identical pick after group edit window is accepted (no-op)", () => {
  const existing = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });
  const next = picks({ groupRankings: { A: ["MEX", "RSA", "X", "Y"] } });

  const result = validateBracketAgainstFixtures(
    afterGroupEditWindow, next, existing, groupKickoffMs, knockoutKickoffMs
  );
  assertEquals(result.invalidGroups, []);
});

Deno.test("changing any group is accepted during the shared edit window", () => {
  const existing = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"], F: ["NED", "JPN", "X", "Y"] }
  });
  const next = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"], F: ["JPN", "NED", "X", "Y"] }
  });

  const result = validateBracketAgainstFixtures(
    insideGroupEditWindow, next, existing, groupKickoffMs, knockoutKickoffMs
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
    afterGroupEditWindow, next, null, groupKickoffMs, knockoutKickoffMs
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
    afterGroupEditWindow, next, null, new Map(), new Map()
  );
  assertEquals(result.invalidGroups, []);
  assertEquals(result.invalidMatches, []);
});
