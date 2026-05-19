import type { GrantXpRequest } from "./schema.ts";

export function validateGrantXpRequest(input: GrantXpRequest): void {
  if (input.sourceType === "locker_purchase" && input.countsTowardLeaderboard) {
    throw new Error("Purchased credits cannot count toward competitive leaderboards.");
  }

  if (input.sourceType === "match_bounty" && input.countsTowardLeaderboard) {
    throw new Error("Match bounty rewards cannot count toward Competitive Points in MVP.");
  }
}
