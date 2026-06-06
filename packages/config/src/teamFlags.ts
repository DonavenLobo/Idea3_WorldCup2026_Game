import { TEAM_FLAGS } from "./teamFlags.data";
import { formatTeamName } from "./teamShortNames";

export type TeamFlagMap = Record<string, string>;

export { TEAM_FLAGS };
export { formatTeamName, TEAM_SHORT_NAMES } from "./teamShortNames";

/** Emoji flag for a nation name, or undefined for knockout placeholder slots. */
export function flagForTeam(name: string): string | undefined {
  return TEAM_FLAGS[name];
}
