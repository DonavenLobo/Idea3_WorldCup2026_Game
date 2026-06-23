// supabase/functions/submit-bracket/validateFixtures.test.ts
// Run with: deno test supabase/functions/submit-bracket/validateFixtures.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateBracketWriteAgainstFinalized,
  type BracketPicksPayload
} from "./validateFixtures.ts";

const emptyPicks: BracketPicksPayload = {
  groupRankings: {},
  finalizedGroups: [],
  knockoutFinalized: {},
  picks: { r32: {}, r16: {}, qf: {}, sf: {}, final: null, third: null }
};

function picks(overrides: Partial<BracketPicksPayload>): BracketPicksPayload {
  return {
    groupRankings: { ...emptyPicks.groupRankings, ...overrides.groupRankings },
    finalizedGroups: overrides.finalizedGroups ?? [],
    knockoutFinalized: overrides.knockoutFinalized ?? {},
    picks: { ...emptyPicks.picks, ...overrides.picks }
  };
}

Deno.test("empty existing + empty incoming: ok", () => {
  const result = validateBracketWriteAgainstFinalized(null, picks({}));
  assertEquals(result.ok, true);
  assertEquals(result.invalidGroups, []);
  assertEquals(result.invalidRounds, []);
});

Deno.test("finalized group A: changing A rejects with invalidGroups=['A']", () => {
  const existing = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"] },
    finalizedGroups: ["A"]
  });
  const incoming = picks({
    groupRankings: { A: ["RSA", "MEX", "X", "Y"] },
    finalizedGroups: ["A"]
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, false);
  assertEquals(result.invalidGroups, ["A"]);
  assertEquals(result.invalidRounds, []);
});

Deno.test("finalized group A: identical ordering is a no-op, ok=true", () => {
  const existing = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"] },
    finalizedGroups: ["A"]
  });
  const incoming = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"] },
    finalizedGroups: ["A"]
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, true);
  assertEquals(result.invalidGroups, []);
});

Deno.test("unfinalized group A: changing A is allowed", () => {
  const existing = picks({
    groupRankings: { A: ["MEX", "RSA", "X", "Y"] },
    finalizedGroups: []
  });
  const incoming = picks({
    groupRankings: { A: ["RSA", "MEX", "X", "Y"] },
    finalizedGroups: []
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, true);
  assertEquals(result.invalidGroups, []);
});

Deno.test("finalized r32: changing an r32 pick rejects with invalidRounds=['r32']", () => {
  const existing = picks({
    picks: { ...emptyPicks.picks, r32: { "0": "BRA" } },
    knockoutFinalized: { r32: true }
  });
  const incoming = picks({
    picks: { ...emptyPicks.picks, r32: { "0": "ARG" } },
    knockoutFinalized: { r32: true }
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, false);
  assertEquals(result.invalidRounds, ["r32"]);
  assertEquals(result.invalidGroups, []);
});

Deno.test("finalized r32: identical r32 picks → ok=true", () => {
  const existing = picks({
    picks: { ...emptyPicks.picks, r32: { "0": "BRA", "1": "FRA" } },
    knockoutFinalized: { r32: true }
  });
  const incoming = picks({
    picks: { ...emptyPicks.picks, r32: { "0": "BRA", "1": "FRA" } },
    knockoutFinalized: { r32: true }
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, true);
  assertEquals(result.invalidRounds, []);
});

Deno.test("unfinalized r32: changing an r32 pick is allowed", () => {
  const existing = picks({
    picks: { ...emptyPicks.picks, r32: { "0": "BRA" } },
    knockoutFinalized: {}
  });
  const incoming = picks({
    picks: { ...emptyPicks.picks, r32: { "0": "ARG" } },
    knockoutFinalized: {}
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, true);
  assertEquals(result.invalidRounds, []);
});

Deno.test("mixed: finalized group B changed + finalized sf changed → both lists populated", () => {
  const existing = picks({
    groupRankings: { B: ["BRA", "ARG", "X", "Y"] },
    finalizedGroups: ["B"],
    picks: { ...emptyPicks.picks, sf: { "0": "BRA" } },
    knockoutFinalized: { sf: true }
  });
  const incoming = picks({
    groupRankings: { B: ["ARG", "BRA", "X", "Y"] },
    finalizedGroups: ["B"],
    picks: { ...emptyPicks.picks, sf: { "0": "ARG" } },
    knockoutFinalized: { sf: true }
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, false);
  assertEquals(result.invalidGroups, ["B"]);
  assertEquals(result.invalidRounds, ["sf"]);
});

Deno.test("finalized final.winner: changing final winner → invalidRounds=['final']", () => {
  const existing = picks({
    picks: { ...emptyPicks.picks, final: "BRA" },
    knockoutFinalized: { final: true }
  });
  const incoming = picks({
    picks: { ...emptyPicks.picks, final: "ARG" },
    knockoutFinalized: { final: true }
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, false);
  assertEquals(result.invalidRounds, ["final"]);
});

Deno.test("adding NEW picks to a non-finalized round (empty existing) → ok=true", () => {
  const existing = picks({});
  const incoming = picks({
    picks: { ...emptyPicks.picks, r16: { "0": "FRA", "1": "GER" } }
  });

  const result = validateBracketWriteAgainstFinalized(existing, incoming);
  assertEquals(result.ok, true);
  assertEquals(result.invalidGroups, []);
  assertEquals(result.invalidRounds, []);
});
