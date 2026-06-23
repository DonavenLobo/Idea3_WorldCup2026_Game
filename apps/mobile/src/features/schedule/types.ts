import type { Fixture } from "@gogaffa/config";

export type ScheduleFilter = "today" | "all" | "group" | "knockouts" | "myTeam";
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
