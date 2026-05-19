export type PurchaseType = "card_regeneration" | "locker_credits" | "premium_cosmetic";

export interface Purchase {
  id: string;
  userId: string;
  platform: "ios" | "android" | "web";
  productId: string;
  transactionId: string;
  purchaseType: PurchaseType;
  amountCents: number;
  status: "pending" | "verified" | "rejected" | "refunded";
  createdAt: string;
}

export interface Wallet {
  userId: string;
  earnedXp: number;
  lockerCredits: number;
  purchasedCredits: number;
  updatedAt: string;
}
