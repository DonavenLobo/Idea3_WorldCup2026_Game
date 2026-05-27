export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export const GROUP_IDS: readonly GroupId[] = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L"
];

// Provisional group assignments for development. Uses our 48 provisional
// nations split across 12 groups of 4, balanced across confederations.
// NOT the official 2026 draw - replace with the official assignments
// before launch.
export const BRACKET_GROUPS: Record<GroupId, readonly string[]> = {
  A: ["USA", "BRA", "IRN", "MAR"],
  B: ["MEX", "ARG", "JPN", "SEN"],
  C: ["CAN", "COL", "KOR", "EGY"],
  D: ["ENG", "FRA", "KSA", "NGA"],
  E: ["ESP", "GER", "AUS", "CMR"],
  F: ["POR", "NED", "QAT", "GHA"],
  G: ["BEL", "ITA", "UZB", "TUN"],
  H: ["CRO", "SUI", "IRQ", "ALG"],
  I: ["DEN", "POL", "CRC", "CIV"],
  J: ["NOR", "SWE", "PAN", "URU"],
  K: ["AUT", "SRB", "JAM", "PER"],
  L: ["HON", "PAR", "ECU", "NZL"]
};
