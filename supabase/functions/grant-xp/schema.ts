export interface GrantXpRequest {
  userId: string;
  sourceType: "daily_trivia" | "match_prediction" | "match_bounty" | "streak" | "locker_purchase" | "admin_grant";
  currencyType: "competitive_points" | "earned_xp" | "locker_credits" | "purchased_credits";
  amount: number;
  reason: string;
  countsTowardLeaderboard: boolean;
}

export function parseGrantXpRequest(value: unknown): GrantXpRequest {
  const input = value as Partial<GrantXpRequest>;

  if (!input.userId || !input.sourceType || !input.currencyType || input.amount === undefined || !input.reason) {
    throw new Error("Invalid grant-xp request.");
  }

  return input as GrantXpRequest;
}
