import { TEAM_FLAGS } from "./teamFlags.data";

export type TeamFlagMap = Record<string, string>;

export { TEAM_FLAGS };

/** Emoji flag for a nation name, or undefined for knockout placeholder slots. */
export function flagForTeam(name: string): string | undefined {
  return TEAM_FLAGS[name];
}
