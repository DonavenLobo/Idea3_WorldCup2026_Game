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

export interface PersistedBracketPicks {
  groupRankings: Record<GroupId, string[]>;
  picks: BracketPicks;
}

export interface BracketState {
  isCreated: boolean;
  isLoadingSavedBracket: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  saveError: Error | null;
  groupRankings: Record<GroupId, string[]>;
  picks: BracketPicks;
}

export interface Match {
  index: number;
  home: string | null;
  away: string | null;
}

import type { KnockoutRoundId } from "./lib/computeBracketLockState";

export interface PickPastLockoutDetails {
  invalidGroups: string[];
  invalidMatches: Array<{ round: KnockoutRoundId; index: number }>;
}

export class PickPastLockoutError extends Error {
  public readonly invalidGroups: string[];
  public readonly invalidMatches: Array<{ round: KnockoutRoundId; index: number }>;

  constructor(details: PickPastLockoutDetails) {
    super("Some picks are past lockout");
    this.name = "PickPastLockoutError";
    this.invalidGroups = details.invalidGroups;
    this.invalidMatches = details.invalidMatches;
  }
}

export class NotGroupMemberError extends Error {
  constructor() {
    super("Not a member of this group");
    this.name = "NotGroupMemberError";
  }
}
