export type LedgerSourceType =
  | "daily_trivia"
  | "match_prediction"
  | "match_bounty"
  | "streak"
  | "locker_purchase"
  | "admin_grant";

export interface XpLedgerEntry {
  userId: string;
  sourceType: LedgerSourceType;
  sourceId?: string;
  amount: number;
  reason: string;
  countsTowardLeaderboard: boolean;
}

export function assertLeaderboardEligible(entry: XpLedgerEntry): void {
  if (entry.sourceType === "locker_purchase" && entry.countsTowardLeaderboard) {
    throw new Error("Purchased credits cannot count toward competitive leaderboards.");
  }

  if (entry.sourceType === "match_bounty" && entry.countsTowardLeaderboard) {
    throw new Error("Match bounties cannot count toward Competitive Points in MVP.");
  }
}
