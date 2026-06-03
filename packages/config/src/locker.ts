export type CosmeticCategory = "frame" | "badge" | "background";

export type LockerTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  emoji: string;
  priceCredits: number;
  requiredTier?: LockerTier;
  rarity: LockerTier;
}

export interface CreditPack {
  id: string;
  credits: number;
  priceUsd: string;
  bestValue?: boolean;
}

export interface LockerTierConfig {
  id: LockerTier;
  label: string;
  minItemsOwned: number;
  ovrBonus: number;
  badgeColor: string;
}

export const LOCKER_TIERS: readonly LockerTierConfig[] = [
  { id: "bronze", label: "Bronze", minItemsOwned: 0, ovrBonus: 0, badgeColor: "#A56627" },
  { id: "silver", label: "Silver", minItemsOwned: 3, ovrBonus: 5, badgeColor: "#9AA0A6" },
  { id: "gold", label: "Gold", minItemsOwned: 6, ovrBonus: 10, badgeColor: "#D6A11E" },
  { id: "platinum", label: "Platinum", minItemsOwned: 10, ovrBonus: 15, badgeColor: "#5BC0EB" },
  { id: "diamond", label: "Diamond", minItemsOwned: 14, ovrBonus: 20, badgeColor: "#A88EFE" }
];

// Provisional cosmetic catalog. Real visual assets can replace the emoji
// metadata without changing the server contract.
export const COSMETIC_ITEMS: readonly CosmeticItem[] = [
  { id: "frame-bronze", name: "Bronze Frame", category: "frame", emoji: "B", priceCredits: 50, rarity: "bronze" },
  { id: "frame-silver", name: "Silver Frame", category: "frame", emoji: "S", priceCredits: 120, requiredTier: "silver", rarity: "silver" },
  { id: "frame-gold", name: "Gold Frame", category: "frame", emoji: "G", priceCredits: 250, requiredTier: "gold", rarity: "gold" },
  { id: "frame-platinum", name: "Platinum Frame", category: "frame", emoji: "P", priceCredits: 500, requiredTier: "platinum", rarity: "platinum" },
  { id: "frame-diamond", name: "Diamond Frame", category: "frame", emoji: "D", priceCredits: 1000, requiredTier: "diamond", rarity: "diamond" },

  { id: "badge-wc26", name: "World Cup '26", category: "badge", emoji: "WC", priceCredits: 75, rarity: "bronze" },
  { id: "badge-mvp", name: "MVP", category: "badge", emoji: "MVP", priceCredits: 150, rarity: "bronze" },
  { id: "badge-hattrick", name: "Hat-trick", category: "badge", emoji: "HT", priceCredits: 200, requiredTier: "silver", rarity: "silver" },
  { id: "badge-ironwall", name: "Iron Wall", category: "badge", emoji: "IW", priceCredits: 300, requiredTier: "gold", rarity: "gold" },
  { id: "badge-speeddemon", name: "Speed Demon", category: "badge", emoji: "SD", priceCredits: 400, requiredTier: "gold", rarity: "gold" },

  { id: "bg-stadium", name: "Stadium Lights", category: "background", emoji: "SL", priceCredits: 100, rarity: "bronze" },
  { id: "bg-pitch", name: "Pitch View", category: "background", emoji: "PV", priceCredits: 150, rarity: "bronze" },
  { id: "bg-trophyhall", name: "Trophy Hall", category: "background", emoji: "TH", priceCredits: 350, requiredTier: "gold", rarity: "gold" },
  { id: "bg-fireworks", name: "Fireworks", category: "background", emoji: "FW", priceCredits: 600, requiredTier: "platinum", rarity: "platinum" }
];

// Display-only placeholders. Actual prices/products must come from verified
// App Store / Play Store IAP metadata at runtime.
export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "pack-small", credits: 100, priceUsd: "$0.99" },
  { id: "pack-medium", credits: 500, priceUsd: "$3.99" },
  { id: "pack-large", credits: 1500, priceUsd: "$9.99", bestValue: true },
  { id: "pack-huge", credits: 5000, priceUsd: "$24.99" }
];
