import type { CardStatKey, CardStats } from "@gogaffa/types";

export interface CardStatUpgrade {
  stat: CardStatKey;
  amount: number;
}

export function applyCardStatUpgrade(stats: CardStats, upgrade: CardStatUpgrade, cap: number): CardStats {
  return {
    ...stats,
    [upgrade.stat]: Math.min(cap, stats[upgrade.stat] + upgrade.amount)
  };
}

export function calculateOverall(stats: CardStats): number {
  const values = Object.values(stats);
  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round(total / values.length);
}
