import type { LeaderboardRowData } from "./types";

const COUNTRY_ALL = "all" as const;

export type CountryFilter = typeof COUNTRY_ALL | string;
export { COUNTRY_ALL };

export function filterLeaderboardRows(
  rows: readonly LeaderboardRowData[],
  country: CountryFilter
): LeaderboardRowData[] {
  const filtered =
    country === COUNTRY_ALL
      ? rows
      : rows.filter((row) => row.countryCode === country);

  return filtered.map((row, index) => ({
    ...row,
    rank: index + 1
  }));
}

export function uniqueCountryCodes(rows: readonly LeaderboardRowData[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    set.add(row.countryCode);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
