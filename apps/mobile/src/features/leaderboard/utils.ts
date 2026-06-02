import { MOCK_LEADERBOARD } from "@world-cup-game/config";
import type { LeaderboardEntry, LeaderboardStage } from "@world-cup-game/config";
import type { LeaderboardRowData } from "./types";

export interface CurrentUserSeed {
  id: string;
  displayName: string;
  countryCode: string;
  scores: Record<LeaderboardStage, number>;
}

const COUNTRY_ALL = "all" as const;

export type CountryFilter = typeof COUNTRY_ALL | string;
export { COUNTRY_ALL };

export function buildLeaderboardRows(
  stage: LeaderboardStage,
  country: CountryFilter,
  currentUser: CurrentUserSeed | null
): LeaderboardRowData[] {
  const base: LeaderboardEntry[] = [...MOCK_LEADERBOARD];
  if (currentUser) {
    base.push({
      id: currentUser.id,
      displayName: currentUser.displayName,
      countryCode: currentUser.countryCode,
      scores: currentUser.scores
    });
  }

  const filtered =
    country === COUNTRY_ALL
      ? base
      : base.filter((e) => e.countryCode === country);

  const sorted = [...filtered].sort((a, b) => b.scores[stage] - a.scores[stage]);

  return sorted.map((e, idx) => ({
    rank: idx + 1,
    id: e.id,
    displayName: e.displayName,
    countryCode: e.countryCode,
    score: e.scores[stage],
    isCurrentUser: currentUser?.id === e.id
  }));
}

export function uniqueCountryCodes(): string[] {
  const set = new Set<string>();
  for (const e of MOCK_LEADERBOARD) {
    set.add(e.countryCode);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
