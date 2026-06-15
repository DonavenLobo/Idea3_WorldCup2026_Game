/** The 2026 World Cup field (mirrors nations.in_world_cup_2026 in the DB). */
export const WORLD_CUP_2026_NATION_CODES: readonly string[] = [
  "USA", "MEX", "CAN", "CRC", "PAN", "JAM", "HON",
  "BRA", "ARG", "URU", "COL", "ECU", "PER", "PAR",
  "ENG", "FRA", "ESP", "GER", "POR", "NED", "BEL", "ITA", "CRO", "SUI",
  "DEN", "POL", "NOR", "SWE", "AUT", "SRB",
  "JPN", "KOR", "AUS", "IRN", "KSA", "QAT", "UZB", "IRQ",
  "MAR", "SEN", "EGY", "NGA", "CMR", "GHA", "TUN", "ALG", "CIV",
  "NZL",
];

export const WORLD_CUP_2026_NATION_SET: ReadonlySet<string> = new Set(
  WORLD_CUP_2026_NATION_CODES,
);
