export type CosmeticCategory = "frame" | "badge" | "background";

export type LockerTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  emoji: string;
  priceCredits: number;
  requiredTier?: LockerTier;
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
  { id: "bronze",   label: "Bronze",   minItemsOwned: 0,  ovrBonus: 0,  badgeColor: "#A56627" },
  { id: "silver",   label: "Silver",   minItemsOwned: 3,  ovrBonus: 5,  badgeColor: "#9AA0A6" },
  { id: "gold",     label: "Gold",     minItemsOwned: 6,  ovrBonus: 10, badgeColor: "#D6A11E" },
  { id: "platinum", label: "Platinum", minItemsOwned: 10, ovrBonus: 15, badgeColor: "#5BC0EB" },
  { id: "diamond",  label: "Diamond",  minItemsOwned: 14, ovrBonus: 20, badgeColor: "#A88EFE" }
];

// Provisional cosmetic catalog. Replace with curated production set + real
// art assets before launch.
export const COSMETIC_ITEMS: readonly CosmeticItem[] = [
  // Frames (visual templates the card sits in)
  { id: "frame-bronze",   name: "Bronze Frame",   category: "frame", emoji: "🟤", priceCredits: 50 },
  { id: "frame-silver",   name: "Silver Frame",   category: "frame", emoji: "⚪", priceCredits: 120, requiredTier: "silver" },
  { id: "frame-gold",     name: "Gold Frame",     category: "frame", emoji: "🟡", priceCredits: 250, requiredTier: "gold" },
  { id: "frame-platinum", name: "Platinum Frame", category: "frame", emoji: "💎", priceCredits: 500, requiredTier: "platinum" },
  { id: "frame-diamond",  name: "Diamond Frame",  category: "frame", emoji: "✨", priceCredits: 1000, requiredTier: "diamond" },

  // Badges (stickers/awards displayed on the card)
  { id: "badge-wc26",       name: "World Cup '26", category: "badge", emoji: "🏆", priceCredits: 75 },
  { id: "badge-mvp",        name: "MVP",           category: "badge", emoji: "⭐", priceCredits: 150 },
  { id: "badge-hattrick",   name: "Hat-trick",     category: "badge", emoji: "🎩", priceCredits: 200, requiredTier: "silver" },
  { id: "badge-ironwall",   name: "Iron Wall",     category: "badge", emoji: "🛡️", priceCredits: 300, requiredTier: "gold" },
  { id: "badge-speeddemon", name: "Speed Demon",   category: "badge", emoji: "⚡", priceCredits: 400, requiredTier: "gold" },

  // Backgrounds (scenery behind the card)
  { id: "bg-stadium",    name: "Stadium Lights", category: "background", emoji: "🏟️", priceCredits: 100 },
  { id: "bg-pitch",      name: "Pitch View",     category: "background", emoji: "🌿", priceCredits: 150 },
  { id: "bg-trophyhall", name: "Trophy Hall",    category: "background", emoji: "🏆", priceCredits: 350, requiredTier: "gold" },
  { id: "bg-fireworks",  name: "Fireworks",      category: "background", emoji: "🎆", priceCredits: 600, requiredTier: "platinum" }
];

// Mock credit packs. Real IAP requires the dev build + verified product IDs.
// Pricing in USD here is purely cosmetic display; actual prices come from
// the App Store / Play Store at runtime.
export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "pack-small",   credits: 100,  priceUsd: "$0.99"  },
  { id: "pack-medium",  credits: 500,  priceUsd: "$3.99"  },
  { id: "pack-large",   credits: 1500, priceUsd: "$9.99",  bestValue: true },
  { id: "pack-huge",    credits: 5000, priceUsd: "$24.99" }
];
