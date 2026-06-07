/** Official-style short display names for teams that do not fit fixture rows. */
export const TEAM_SHORT_NAMES: Record<string, string> = {
  "Bosnia & Herzegovina": "Bosnia & H.",
  "Czech Republic": "Czechia",
  "United States": "USA",
  "Saudi Arabia": "Saudi",
  "Ivory Coast": "Iv. Coast",
  "New Zealand": "N. Zealand",
  "South Africa": "S. Africa",
  "DR Congo": "DR Congo",
};

/** Returns a display-friendly team name, using short form only when mapped. */
export function formatTeamName(name: string): string {
  return TEAM_SHORT_NAMES[name] ?? name;
}
