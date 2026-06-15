import { getTriviaTierForOrder } from "@world-cup-game/config";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Live-display per-answer points. Mirrors the edge-function scoring exactly:
 * each question's tier (easy/medium/hard) is keyed off question_order (1/2/3).
 */
export function calculateTriviaAnswerPoints(
  isCorrect: boolean,
  responseTimeMs: number,
  questionOrder: number
): number {
  if (!isCorrect) return 0;

  const tier = getTriviaTierForOrder(questionOrder);
  const cappedMs = Math.max(0, Math.min(responseTimeMs, tier.timeLimitMs));
  const remainingRatio = Math.max(0, 1 - cappedMs / (2 * tier.timeLimitMs));
  const speedBonusRaw = tier.basePoints * remainingRatio;

  return Math.round(tier.basePoints + speedBonusRaw);
}
