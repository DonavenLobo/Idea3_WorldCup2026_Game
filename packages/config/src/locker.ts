export type CosmeticCategory = "frame" | "badge" | "background";

export type LockerTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface CosmeticMeta {
  color?: string;
  backgroundColor?: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  emoji: string;
  priceCredits: number;
  requiredTier?: LockerTier;
  meta?: CosmeticMeta;
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
  // Frames (card border color)
  { id: "frame-bronze",   name: "Bronze Frame",   category: "frame", emoji: "🟤", priceCredits: 50,                            meta: { color: "#A56627" } },
  { id: "frame-silver",   name: "Silver Frame",   category: "frame", emoji: "⚪", priceCredits: 120, requiredTier: "silver",   meta: { color: "#9AA0A6" } },
  { id: "frame-gold",     name: "Gold Frame",     category: "frame", emoji: "🟡", priceCredits: 250, requiredTier: "gold",     meta: { color: "#D6A11E" } },
  { id: "frame-platinum", name: "Platinum Frame", category: "frame", emoji: "💎", priceCredits: 500, requiredTier: "platinum", meta: { color: "#5BC0EB" } },
  { id: "frame-diamond",  name: "Diamond Frame",  category: "frame", emoji: "✨", priceCredits: 1000, requiredTier: "diamond", meta: { color: "#A88EFE" } },

  // Badges (sticker on card)
  { id: "badge-wc26",       name: "World Cup '26", category: "badge", emoji: "🏆", priceCredits: 75 },
  { id: "badge-mvp",        name: "MVP",           category: "badge", emoji: "⭐", priceCredits: 150 },
  { id: "badge-hattrick",   name: "Hat-trick",     category: "badge", emoji: "🎩", priceCredits: 200, requiredTier: "silver" },
  { id: "badge-ironwall",   name: "Iron Wall",     category: "badge", emoji: "🛡️", priceCredits: 300, requiredTier: "gold" },
  { id: "badge-speeddemon", name: "Speed Demon",   category: "badge", emoji: "⚡", priceCredits: 400, requiredTier: "gold" },

  // Backgrounds (card background color tint)
  { id: "bg-stadium",    name: "Stadium Lights", category: "background", emoji: "🏟️", priceCredits: 100,                            meta: { backgroundColor: "#F2EBD3" } },
  { id: "bg-pitch",      name: "Pitch View",     category: "background", emoji: "🌿", priceCredits: 150,                            meta: { backgroundColor: "#E5F0DA" } },
  { id: "bg-trophyhall", name: "Trophy Hall",    category: "background", emoji: "🏆", priceCredits: 350, requiredTier: "gold",      meta: { backgroundColor: "#FBEFC8" } },
  { id: "bg-fireworks",  name: "Fireworks",      category: "background", emoji: "🎆", priceCredits: 600, requiredTier: "platinum",  meta: { backgroundColor: "#F7D6E0" } }
];

// Mock credit packs. Real IAP requires the dev build + verified product IDs.
export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "pack-small",   credits: 100,  priceUsd: "$0.99"  },
  { id: "pack-medium",  credits: 500,  priceUsd: "$3.99"  },
  { id: "pack-large",   credits: 1500, priceUsd: "$9.99",  bestValue: true },
  { id: "pack-huge",    credits: 5000, priceUsd: "$24.99" }
];
