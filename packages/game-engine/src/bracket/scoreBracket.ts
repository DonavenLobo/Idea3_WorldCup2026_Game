import type { BracketPick } from "@world-cup-game/types";
import { BRACKET_RULES } from "./bracketRules";

export function scoreBracket(picks: BracketPick[], actualWinnersByMatchId: Record<string, string>): number {
  return picks.reduce((score, pick) => {
    return actualWinnersByMatchId[pick.matchId] === pick.selectedTeamCode
      ? score + BRACKET_RULES.exactRoundPickPoints
      : score;
  }, 0);
}
