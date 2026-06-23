import type { CardProgressionLevel, CardUpgradeStep } from "@gogaffa/types";

export function getUpgradeSteps(
  fromLevel: CardProgressionLevel,
  toLevel: CardProgressionLevel
): CardUpgradeStep[] {
  if (toLevel <= fromLevel) {
    return [];
  }

  const steps: CardUpgradeStep[] = [];

  for (let level = fromLevel; level < toLevel; level += 1) {
    steps.push({
      from: level as CardProgressionLevel,
      to: (level + 1) as CardProgressionLevel,
    });
  }

  return steps;
}
