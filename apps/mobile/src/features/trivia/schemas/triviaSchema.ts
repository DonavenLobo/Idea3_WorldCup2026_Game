import type { AnswerKey } from "@gogaffa/types";

export function isAnswerKey(value: string): value is AnswerKey {
  return value === "A" || value === "B" || value === "C" || value === "D";
}
