import { TRIVIA_RULES } from "@world-cup-game/config";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function calculateTriviaAnswerPoints(isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;

  const cappedMs = Math.max(0, Math.min(responseTimeMs, 30_000));
  const remainingRatio = (30_000 - cappedMs) / 30_000;
  const speedBonus = Math.round(TRIVIA_RULES.maxSpeedBonusPerQuestion * remainingRatio);

  return TRIVIA_RULES.correctAnswerCompetitivePoints + speedBonus;
}
