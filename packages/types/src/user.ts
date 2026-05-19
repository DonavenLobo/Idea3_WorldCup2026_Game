export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  selectedNationCode?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthProvider = "anonymous" | "apple" | "google" | "facebook" | "instagram" | "email";
