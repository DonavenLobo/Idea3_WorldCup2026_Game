export interface LeaderboardScoreInput {
  userId: string;
  displayName: string;
  score: number;
  tiebreakerMs?: number;
}
