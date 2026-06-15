// Tests for the pure scoring helper inside scoreBracket.ts (Deno mirror of
// packages/game-engine/src/bracket/scoreBracket.ts). Mirrors logic cases 1–9
// from packages/game-engine/src/bracket/scoreBracket.test.ts.
//
// Run with: deno test supabase/functions/score-bracket/index.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  BRACKET_SCORING,
  scoreBracket,
  type BracketKnockoutPrediction,
  type BracketKnockoutResult,
  type BracketScoreInput,
  type KnockoutRoundId,
} from "./scoreBracket.ts";

// ---------- Shared fixtures ----------
const FIFA_SEEDS: Record<string, number> = {
  BRA: 1,
  ARG: 2,
  FRA: 3,
  ESP: 4,
  ENG: 5,
  GER: 6,
  USA: 16,
  MEX: 17,
  KOR: 22,
  RSA: 28,
  ITA: 9,
  POR: 7,
  NED: 8,
  BEL: 10,
  CAN: 41,
  JPN: 18,
  AUS: 26,
};

function emptyInput(): BracketScoreInput {
  return {
    predictions: { groups: {}, knockouts: [] },
    results: { groups: {}, knockouts: [] },
    fifaSeeds: FIFA_SEEDS,
  };
}

Deno.test("01 empty bracket → 0", () => {
  const out = scoreBracket(emptyInput());
  assertEquals(out.groupPoints, 0);
  assertEquals(out.knockoutPoints, 0);
  assertEquals(out.total, 0);
  assertEquals(out.breakdown.length, 0);
});

Deno.test("02 perfect Group A → 290", () => {
  const input: BracketScoreInput = {
    predictions: {
      groups: { A: ["MEX", "RSA", "KOR", "CZE"] },
      knockouts: [],
    },
    results: {
      groups: { A: ["MEX", "RSA", "KOR", "CZE"] },
      knockouts: [],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const expected =
    BRACKET_SCORING.group.exactRank * 2 +
    BRACKET_SCORING.group.correctNonQualifier * 2;
  const out = scoreBracket(input);
  assertEquals(out.total, expected);
  assertEquals(expected, 290);
  assertEquals(out.knockoutPoints, 0);
});

Deno.test("03 Group A swapped top-2 → 60", () => {
  const input: BracketScoreInput = {
    predictions: {
      groups: { A: ["RSA", "MEX", "XXX", "YYY"] },
      knockouts: [],
    },
    results: {
      groups: { A: ["MEX", "RSA", "KOR", "CZE"] },
      knockouts: [],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const expected = BRACKET_SCORING.group.correctQualifier * 2;
  const out = scoreBracket(input);
  assertEquals(out.total, expected);
  assertEquals(expected, 60);
});

Deno.test("04 Group A only 1st exact → 120", () => {
  const input: BracketScoreInput = {
    predictions: {
      groups: { A: ["MEX", "XXX", "YYY", "ZZZ"] },
      knockouts: [],
    },
    results: {
      groups: { A: ["MEX", "RSA", "KOR", "CZE"] },
      knockouts: [],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const out = scoreBracket(input);
  assertEquals(out.total, BRACKET_SCORING.group.exactRank);
  assertEquals(BRACKET_SCORING.group.exactRank, 120);
});

Deno.test("05 Group A only 3rd correct → 25", () => {
  const input: BracketScoreInput = {
    predictions: {
      groups: { A: ["WWW", "XXX", "KOR", "YYY"] },
      knockouts: [],
    },
    results: {
      groups: { A: ["MEX", "RSA", "KOR", "CZE"] },
      knockouts: [],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const out = scoreBracket(input);
  assertEquals(out.total, BRACKET_SCORING.group.correctNonQualifier);
  assertEquals(BRACKET_SCORING.group.correctNonQualifier, 25);
});

Deno.test("06 r32 winner correct, no upset → 40", () => {
  // BRA (seed 1) beats KOR (seed 22). Predicting BRA is not an upset.
  const input: BracketScoreInput = {
    predictions: {
      groups: {},
      knockouts: [{ round: "r32", index: 0, winnerCode: "BRA" }],
    },
    results: {
      groups: {},
      knockouts: [
        { round: "r32", index: 0, winnerCode: "BRA", loserCode: "KOR" },
      ],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const out = scoreBracket(input);
  assertEquals(out.total, BRACKET_SCORING.knockout.r32);
  assertEquals(BRACKET_SCORING.knockout.r32, 40);
});

Deno.test("07 r32 upset → 60", () => {
  // CAN (seed 41) beats BEL (seed 10) — predicted underdog wins.
  const input: BracketScoreInput = {
    predictions: {
      groups: {},
      knockouts: [{ round: "r32", index: 0, winnerCode: "CAN" }],
    },
    results: {
      groups: {},
      knockouts: [
        { round: "r32", index: 0, winnerCode: "CAN", loserCode: "BEL" },
      ],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const expected =
    BRACKET_SCORING.knockout.r32 *
    (1 + BRACKET_SCORING.knockout.upsetBonusMultiplier);
  const out = scoreBracket(input);
  assertEquals(out.total, expected);
  assertEquals(expected, 60);
});

Deno.test("08 qf+sf+final all correct (no upsets); +champion constant sums to 1920", () => {
  const input: BracketScoreInput = {
    predictions: {
      groups: {},
      knockouts: [
        { round: "qf", index: 0, winnerCode: "BRA" },
        { round: "sf", index: 0, winnerCode: "BRA" },
        { round: "final", index: 0, winnerCode: "BRA" },
      ],
    },
    results: {
      groups: {},
      knockouts: [
        { round: "qf", index: 0, winnerCode: "BRA", loserCode: "ESP" }, // 1 vs 4 — not upset
        { round: "sf", index: 0, winnerCode: "BRA", loserCode: "FRA" }, // 1 vs 3 — not upset
        { round: "final", index: 0, winnerCode: "BRA", loserCode: "ARG" }, // 1 vs 2 — not upset
      ],
    },
    fifaSeeds: FIFA_SEEDS,
  };
  const out = scoreBracket(input);
  const koSum =
    BRACKET_SCORING.knockout.qf +
    BRACKET_SCORING.knockout.sf +
    BRACKET_SCORING.knockout.final;
  assertEquals(out.knockoutPoints, koSum);
  const totalWithChampion = koSum + BRACKET_SCORING.knockout.champion;
  assertEquals(totalWithChampion, 1920);
});

Deno.test("09 full perfect KO bracket (no upsets) → derived from BRACKET_SCORING", () => {
  // 16 r32 + 8 r16 + 4 qf + 2 sf + 1 third + 1 final = 32 matches.
  const rounds: Array<{ round: KnockoutRoundId; count: number }> = [
    { round: "r32", count: 16 },
    { round: "r16", count: 8 },
    { round: "qf", count: 4 },
    { round: "sf", count: 2 },
    { round: "third", count: 1 },
    { round: "final", count: 1 },
  ];

  const predictions: BracketKnockoutPrediction[] = [];
  const results: BracketKnockoutResult[] = [];

  // BRA (seed 1) beats KOR (seed 22) in every match — never an upset.
  for (const { round, count } of rounds) {
    for (let i = 0; i < count; i++) {
      predictions.push({ round, index: i, winnerCode: "BRA" });
      results.push({ round, index: i, winnerCode: "BRA", loserCode: "KOR" });
    }
  }

  const input: BracketScoreInput = {
    predictions: { groups: {}, knockouts: predictions },
    results: { groups: {}, knockouts: results },
    fifaSeeds: FIFA_SEEDS,
  };

  const out = scoreBracket(input);

  const k = BRACKET_SCORING.knockout;
  const expected =
    16 * k.r32 +
    8 * k.r16 +
    4 * k.qf +
    2 * k.sf +
    1 * k.final + // third-place is scored at same tier as final
    1 * k.final;
  assertEquals(out.knockoutPoints, expected);
  assertEquals(out.breakdown.length, 32);
});
