import { MAX_CARD_OVERALL_BY_TOURNAMENT_DAY } from "@world-cup-game/config";

export function calculateStatCap(tournamentDay: number): number {
  const progressiveCap = 60 + tournamentDay;

  return Math.min(progressiveCap, MAX_CARD_OVERALL_BY_TOURNAMENT_DAY);
}
