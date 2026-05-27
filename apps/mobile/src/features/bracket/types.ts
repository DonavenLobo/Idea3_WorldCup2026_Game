import type { GroupId } from "@world-cup-game/config";

export type Round = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export type PickRound = Exclude<Round, "final" | "third">;

export type SubTab = "groups" | Round | "summary";

export interface BracketPicks {
  r32: Record<number, string>;
  r16: Record<number, string>;
  qf: Record<number, string>;
  sf: Record<number, string>;
  final: string | null;
  third: string | null;
}

export interface BracketState {
  isCreated: boolean;
  groupRankings: Record<GroupId, string[]>;
  picks: BracketPicks;
}

export interface Match {
  index: number;
  home: string | null;
  away: string | null;
}
