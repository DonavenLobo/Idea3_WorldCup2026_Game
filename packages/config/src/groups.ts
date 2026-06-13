export type GroupVisibility = "public" | "private";

export interface PublicGroup {
  id: string;
  name: string;
  memberCount: number;
  visibility: GroupVisibility;
  isFeatured?: boolean;
}

// Provisional mock public groups for development. Replace with real groups
// sourced from Supabase before launch.
export const PUBLIC_GROUPS: readonly PublicGroup[] = [
  {
    id: "og-2026",
    name: "OG Tournament '26 Group",
    memberCount: 129,
    visibility: "public",
    isFeatured: true
  },
  {
    id: "wc-fanatics",
    name: "Tournament Fanatics",
    memberCount: 87,
    visibility: "public"
  },
  {
    id: "bracket-builders",
    name: "Bracket Builders",
    memberCount: 45,
    visibility: "public"
  },
  {
    id: "football-family",
    name: "Football Family",
    memberCount: 32,
    visibility: "public"
  },
  {
    id: "the-pitch",
    name: "The Pitch",
    memberCount: 21,
    visibility: "public"
  },
  {
    id: "post-90-club",
    name: "Post-90 Club",
    memberCount: 18,
    visibility: "public"
  }
];
