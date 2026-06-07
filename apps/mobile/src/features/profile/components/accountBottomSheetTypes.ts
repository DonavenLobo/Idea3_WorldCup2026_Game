export interface AccountBottomSheetProps {
  /** Global leaderboard score (overall stage) — same source as /leaderboard. */
  leaderboardScore?: number;
  creditBalance?: number;
  displayName: string;
  email?: string | null;
  imageUri?: string | null;
  nationCode?: string;
  overall?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface AccountBottomSheetHandle {
  present: () => void;
  dismiss: () => void;
}
