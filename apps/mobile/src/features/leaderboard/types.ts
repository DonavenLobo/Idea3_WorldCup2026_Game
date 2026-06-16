export type {
  LeaderboardEntry,
  LeaderboardStage
} from "@gogaffa/config";

export interface LeaderboardRowData {
  rank: number;
  id: string;
  displayName: string;
  countryCode: string;
  score: number;
  isCurrentUser: boolean;
}
