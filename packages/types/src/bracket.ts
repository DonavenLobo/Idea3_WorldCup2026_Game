export interface BracketPick {
  matchId: string;
  selectedTeamCode: string;
}

export interface BracketDraftPicks {
  groupRankings: Record<string, string[]>;
  finalizedGroups?: string[];
  picks: {
    r32: Record<string, string>;
    r16: Record<string, string>;
    qf: Record<string, string>;
    sf: Record<string, string>;
    final: string | null;
    third: string | null;
  };
}

export interface BracketSubmission {
  id: string;
  userId: string;
  groupId: string | null;
  picks: BracketDraftPicks;
  score: number;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
