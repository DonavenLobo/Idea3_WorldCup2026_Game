// MIRROR of packages/game-engine/src/cardProgression/* (card progression v1).
// Edge functions run in Deno and cannot import workspace packages.
// Keep in sync when progression rules change.

export type CardProgressionLevel = 2 | 3 | 4;

export interface CardProgressionMilestones {
  hasCompletedFirstTrivia: boolean;
  hasFinalizedAllBracketGroups: boolean;
}

export interface CardUpgradeStep {
  from: CardProgressionLevel;
  to: CardProgressionLevel;
}

export const TEMPLATE_KEY_BY_LEVEL = {
  2: "level-02-base-v1",
  3: "level-03-base-v1",
  4: "level-04-base-v1",
} as const satisfies Record<CardProgressionLevel, string>;

const LEGACY_TEMPLATE_KEYS: Record<string, CardProgressionLevel> = {
  "level-00-sketch-v1": 2,
  "level-01-base-v1": 2,
  "level-02-base-v1": 2,
  "level-03-base-v1": 3,
  "level-04-base-v1": 4,
};

export const BRACKET_GROUP_COUNT = 12;

export function templateKeyForLevel(level: CardProgressionLevel): string {
  return TEMPLATE_KEY_BY_LEVEL[level];
}

export function progressionLevelFromTemplateKey(templateKey: string): CardProgressionLevel {
  return LEGACY_TEMPLATE_KEYS[templateKey] ?? 2;
}

export function calculateCardProgressionLevel(
  milestones: CardProgressionMilestones
): CardProgressionLevel {
  if (milestones.hasCompletedFirstTrivia && milestones.hasFinalizedAllBracketGroups) {
    return 4;
  }

  if (milestones.hasCompletedFirstTrivia || milestones.hasFinalizedAllBracketGroups) {
    return 3;
  }

  return 2;
}

export function milestonesFromTimestamps(input: {
  firstTriviaCompletedAt: string | null;
  bracketGroupsFinalizedAt: string | null;
}): CardProgressionMilestones {
  return {
    hasCompletedFirstTrivia: input.firstTriviaCompletedAt !== null,
    hasFinalizedAllBracketGroups: input.bracketGroupsFinalizedAt !== null,
  };
}

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

export function hasFinalizedAllBracketGroups(picks: unknown): boolean {
  if (!picks || typeof picks !== "object") {
    return false;
  }

  const finalizedGroups = (picks as { finalizedGroups?: unknown }).finalizedGroups;
  return Array.isArray(finalizedGroups) && finalizedGroups.length >= BRACKET_GROUP_COUNT;
}
