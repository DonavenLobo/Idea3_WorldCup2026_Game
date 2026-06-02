export type LeaderboardStage =
  | "overall"
  | "trivia"
  | "prediction"
  | "showcase"
  | "bracket";

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  countryCode: string;
  scores: Record<LeaderboardStage, number>;
}

export const LEADERBOARD_STAGES: readonly { id: LeaderboardStage; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "trivia", label: "Daily Trivia" },
  { id: "prediction", label: "Prediction Accuracy" },
  { id: "showcase", label: "Card Showcase" },
  { id: "bracket", label: "Bracket" }
];

// Provisional mock leaderboard for development. Replace with a Supabase-backed
// query before launch.
export const MOCK_LEADERBOARD: readonly LeaderboardEntry[] = [
  { id: "u-1",  displayName: "Sarah Bishop", countryCode: "ENG", scores: { overall: 1250, trivia: 320, prediction: 450, showcase: 220, bracket: 260 } },
  { id: "u-2",  displayName: "Danilo",       countryCode: "BRA", scores: { overall: 1180, trivia: 280, prediction: 410, showcase: 230, bracket: 260 } },
  { id: "u-3",  displayName: "Ollie",        countryCode: "AUS", scores: { overall: 1090, trivia: 290, prediction: 380, showcase: 200, bracket: 220 } },
  { id: "u-4",  displayName: "Nina",         countryCode: "FRA", scores: { overall: 1040, trivia: 260, prediction: 360, showcase: 180, bracket: 240 } },
  { id: "u-5",  displayName: "Susan",        countryCode: "USA", scores: { overall: 980,  trivia: 240, prediction: 340, showcase: 170, bracket: 230 } },
  { id: "u-6",  displayName: "Sigurd27",     countryCode: "NOR", scores: { overall: 940,  trivia: 220, prediction: 320, showcase: 200, bracket: 200 } },
  { id: "u-7",  displayName: "Jasmine",      countryCode: "MAR", scores: { overall: 900,  trivia: 210, prediction: 300, showcase: 180, bracket: 210 } },
  { id: "u-8",  displayName: "Marco",        countryCode: "ITA", scores: { overall: 860,  trivia: 200, prediction: 290, showcase: 170, bracket: 200 } },
  { id: "u-9",  displayName: "Yuki",         countryCode: "JPN", scores: { overall: 830,  trivia: 250, prediction: 250, showcase: 150, bracket: 180 } },
  { id: "u-10", displayName: "Kai",          countryCode: "GER", scores: { overall: 800,  trivia: 190, prediction: 270, showcase: 160, bracket: 180 } },
  { id: "u-11", displayName: "Lupe",         countryCode: "MEX", scores: { overall: 760,  trivia: 180, prediction: 260, showcase: 140, bracket: 180 } },
  { id: "u-12", displayName: "Pedro",        countryCode: "POR", scores: { overall: 720,  trivia: 170, prediction: 240, showcase: 150, bracket: 160 } },
  { id: "u-13", displayName: "Aisha",        countryCode: "SEN", scores: { overall: 680,  trivia: 160, prediction: 230, showcase: 140, bracket: 150 } },
  { id: "u-14", displayName: "Hans",         countryCode: "SUI", scores: { overall: 640,  trivia: 150, prediction: 220, showcase: 130, bracket: 140 } },
  { id: "u-15", displayName: "Lucas",        countryCode: "ARG", scores: { overall: 600,  trivia: 140, prediction: 210, showcase: 120, bracket: 130 } }
];
