export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  selectedNationCode?: string;
  /** PR-A: consecutive-day login count. Sourced from profiles.current_login_streak. */
  currentLoginStreak?: number;
  createdAt: string;
  updatedAt: string;
}

export type AuthProvider = "anonymous" | "apple" | "google" | "facebook" | "instagram" | "email";
