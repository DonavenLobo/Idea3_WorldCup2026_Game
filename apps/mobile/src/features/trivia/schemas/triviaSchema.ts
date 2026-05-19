import type { AnswerKey } from "@world-cup-game/types";

export function isAnswerKey(value: string): value is AnswerKey {
  return value === "A" || value === "B" || value === "C" || value === "D";
}
