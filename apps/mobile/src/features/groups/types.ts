import type { GroupVisibility, PublicGroup } from "@world-cup-game/config";

export type { PublicGroup };

export interface JoinedGroup {
  id: string;
  name: string;
  memberCount: number;
  visibility: GroupVisibility;
  isFeatured?: boolean;
  isCustom?: boolean;
  inviteCode?: string;
  role?: "owner" | "admin" | "member";
  defaultLeaderboardType?: string;
}

export type GroupsSubTab = "my" | "discover" | "leaderboard";
