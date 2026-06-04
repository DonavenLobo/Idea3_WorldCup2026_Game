/** Tournament phase identifier, used to narrow stage-specific UI logic. */
export type MatchStage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface Fixture {
  /** Canonical match number: knockouts 73-104; group matches 1-72 by kickoff order. */
  num: number;
  /** Raw round label, e.g. "Matchday 1", "Round of 32", "Final". */
  round: string;
  stage: MatchStage;
  /** "Group A".."Group L" for the group stage; null for knockouts. */
  group: string | null;
  /** Kickoff as a UTC ISO string (precomputed from the source local time + offset). */
  kickoffUtc: string;
  /** Nation name, or a knockout placeholder like "2A" / "W74" / "3A/B/C/D/F". */
  team1: string;
  team2: string;
  /** Host city; exact join key to Stadium.city. */
  venueCity: string;
}

export { WORLD_CUP_FIXTURES } from "./schedule.data";
