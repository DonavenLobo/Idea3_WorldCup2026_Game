export type GroupRole = "owner" | "admin" | "member";

export type LeaderboardType =
  | "daily_trivia"
  | "overall_competitive_points"
  | "prediction_accuracy"
  | "card_showcase";

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  tiebreakerMs?: number;
}
