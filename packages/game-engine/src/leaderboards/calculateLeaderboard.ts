import type { LeaderboardEntry } from "@gogaffa/types";
import type { LeaderboardScoreInput } from "./leaderboardTypes";

export function calculateLeaderboard(entries: LeaderboardScoreInput[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (a.tiebreakerMs ?? Number.MAX_SAFE_INTEGER) - (b.tiebreakerMs ?? Number.MAX_SAFE_INTEGER);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}
