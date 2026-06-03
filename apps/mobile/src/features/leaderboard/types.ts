export type {
  LeaderboardEntry,
  LeaderboardStage
} from "@world-cup-game/config";

export interface LeaderboardRowData {
  rank: number;
  id: string;
  displayName: string;
  countryCode: string;
  score: number;
  isCurrentUser: boolean;
}
