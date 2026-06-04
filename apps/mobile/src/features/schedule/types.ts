import type { Fixture } from "@world-cup-game/config";

export type ScheduleFilter = "all" | "group" | "knockouts" | "myTeam";

export interface ScheduleSection {
  title: string;
  data: Fixture[];
}
