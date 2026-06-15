import type { Fixture } from "@world-cup-game/config";

export type ScheduleFilter = "all" | "group" | "knockouts" | "myTeam";
export type MatchStatus = "scheduled" | "live" | "completed";

export interface CachedMatchScore {
  awayScore: number | null;
  homeScore: number | null;
  matchNum: number;
  status: MatchStatus;
  syncedAt: string | null;
}

export interface ScheduledFixture extends Fixture {
  score: CachedMatchScore | null;
  status: MatchStatus;
}

export interface ScheduleSection {
  title: string;
  data: ScheduledFixture[];
}
