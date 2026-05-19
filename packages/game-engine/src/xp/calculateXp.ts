export interface XpBalance {
  earnedXp: number;
  lockerCredits: number;
  purchasedCredits: number;
}

export function applyEarnedXp(balance: XpBalance, amount: number): XpBalance {
  return {
    ...balance,
    earnedXp: balance.earnedXp + amount
  };
}

export function applyPurchasedCredits(balance: XpBalance, amount: number): XpBalance {
  return {
    ...balance,
    purchasedCredits: balance.purchasedCredits + amount
  };
}
