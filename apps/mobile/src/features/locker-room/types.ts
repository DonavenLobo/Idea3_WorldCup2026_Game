import type { CosmeticCategory, CosmeticItem, LockerTier } from "@world-cup-game/config";

export type { CosmeticCategory, CosmeticItem, LockerTier };

export interface LockerProgress {
  tier: LockerTier;
  ownedCount: number;
  ownedToNextTier: number | null;
  nextTierLabel: string | null;
  progressPercent: number;
}

export interface LockerWallet {
  lockerCredits: number;
  purchasedCredits: number;
  balance: number;
}
