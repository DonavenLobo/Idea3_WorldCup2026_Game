import type { CardProgressionLevel } from "@gogaffa/types";

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

export function templateKeyForLevel(level: CardProgressionLevel): string {
  return TEMPLATE_KEY_BY_LEVEL[level];
}

export function progressionLevelFromTemplateKey(templateKey: string): CardProgressionLevel {
  return LEGACY_TEMPLATE_KEYS[templateKey] ?? 2;
}
