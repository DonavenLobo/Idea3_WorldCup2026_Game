import { GROUP_IDS } from "@gogaffa/config";
import type { GroupId } from "@gogaffa/config";
import type { BracketPicks, Match } from "./types";

// Mock heuristic for "8 best third-place teams": the third-place finishers
// from groups A-H. Real 2026 rules use a points/goal-diff ranking across
// all 12 third-place teams; replace this when the official rule is wired.
const THIRD_PLACE_GROUPS: readonly GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function getR32Teams(rankings: Record<GroupId, string[]>): (string | null)[] {
  const firsts: (string | null)[] = GROUP_IDS.map((g) => rankings[g]?.[0] ?? null);
  const seconds: (string | null)[] = GROUP_IDS.map((g) => rankings[g]?.[1] ?? null);
  const thirds: (string | null)[] = THIRD_PLACE_GROUPS.map((g) => rankings[g]?.[2] ?? null);
  return [...firsts, ...seconds, ...thirds];
}

export function getR32Matches(rankings: Record<GroupId, string[]>): Match[] {
  const teams = getR32Teams(rankings);
  // Standard tournament seeding: top half vs bottom half.
  // Slot i pairs with slot i+16. Mock simplification - real 2026 seeding is more complex.
  return Array.from({ length: 16 }, (_, i) => ({
    index: i,
    home: teams[i] ?? null,
    away: teams[i + 16] ?? null
  }));
}

function pairAdjacent(prev: Record<number, string>, count: number): Match[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    home: prev[2 * i] ?? null,
    away: prev[2 * i + 1] ?? null
  }));
}

export function getR16Matches(picks: BracketPicks): Match[] {
  return pairAdjacent(picks.r32, 8);
}

export function getQFMatches(picks: BracketPicks): Match[] {
  return pairAdjacent(picks.r16, 4);
}

export function getSFMatches(picks: BracketPicks): Match[] {
  return pairAdjacent(picks.qf, 2);
}

export function getFinalMatch(picks: BracketPicks): Match {
  return {
    index: 0,
    home: picks.sf[0] ?? null,
    away: picks.sf[1] ?? null
  };
}

// Third place: losers of the two semi-finals.
export function getThirdPlaceMatch(picks: BracketPicks): Match {
  const sfMatches = getSFMatches(picks);
  const sf0 = sfMatches[0];
  const sf1 = sfMatches[1];

  const loserOf = (m: Match | undefined, pickIndex: number): string | null => {
    if (!m) return null;
    const pick = picks.sf[pickIndex];
    if (!pick || !m.home || !m.away) return null;
    return pick === m.home ? m.away : m.home;
  };

  return {
    index: 0,
    home: loserOf(sf0, 0),
    away: loserOf(sf1, 1)
  };
}
