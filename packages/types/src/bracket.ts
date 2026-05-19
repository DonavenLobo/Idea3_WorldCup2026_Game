export interface BracketPick {
  matchId: string;
  selectedTeamCode: string;
}

export interface BracketSubmission {
  id: string;
  userId: string;
  groupId?: string;
  picks: BracketPick[];
  score: number;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}
