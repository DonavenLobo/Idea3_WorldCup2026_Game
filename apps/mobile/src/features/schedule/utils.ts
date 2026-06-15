import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { Fixture } from "@world-cup-game/config";
import type { ScheduleFilter, ScheduleSection } from "./types";

interface FilterMatchesOptions {
  now?: Date;
  timeZone?: string;
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function localDayKey(kickoffUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(kickoffUtc));
}

export function formatDayHeader(kickoffUtc: string, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(kickoffUtc));
}

export function formatKickoffTime(kickoffUtc: string, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(kickoffUtc));
}

export function myTeamNamesForCode(code: string | null | undefined): Set<string> {
  const names = new Set<string>();
  if (!code) return names;
  names.add(code.toLowerCase());
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  if (nation) names.add(nation.name.toLowerCase());
  return names;
}

export function matchesMyTeam(fixture: Fixture, names: Set<string>): boolean {
  if (names.size === 0) return false;
  return names.has(fixture.team1.toLowerCase()) || names.has(fixture.team2.toLowerCase());
}

export function matchesLocalDay(fixture: Fixture, timeZone: string, date: Date = new Date()): boolean {
  return localDayKey(fixture.kickoffUtc, timeZone) === localDayKey(date.toISOString(), timeZone);
}

export function hasMatchesToday(
  fixtures: Fixture[],
  timeZone: string,
  now: Date = new Date()
): boolean {
  return fixtures.some((fixture) => matchesLocalDay(fixture, timeZone, now));
}

export function filterMatches<T extends Fixture>(
  fixtures: T[],
  filter: ScheduleFilter,
  myTeamNames: Set<string>,
  options: FilterMatchesOptions = {}
): T[] {
  switch (filter) {
    case "today": {
      const timeZone = options.timeZone ?? deviceTimeZone();
      const now = options.now ?? new Date();
      return fixtures.filter((fixture) => matchesLocalDay(fixture, timeZone, now));
    }
    case "group":
      return fixtures.filter((f) => f.stage === "group");
    case "knockouts":
      return fixtures.filter((f) => f.stage !== "group");
    case "myTeam":
      return fixtures.filter((f) => matchesMyTeam(f, myTeamNames));
    case "all":
    default:
      return fixtures;
  }
}

export function groupByLocalDay<T extends Fixture>(
  fixtures: T[],
  timeZone: string
): Array<Omit<ScheduleSection, "data"> & { data: T[] }> {
  const sorted = [...fixtures].sort((a, b) =>
    a.kickoffUtc < b.kickoffUtc ? -1 : a.kickoffUtc > b.kickoffUtc ? 1 : a.num - b.num
  );

  const sections: Array<Omit<ScheduleSection, "data"> & { data: T[] }> = [];
  const indexByKey = new Map<string, number>();

  for (const fixture of sorted) {
    const key = localDayKey(fixture.kickoffUtc, timeZone);
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = sections.length;
      indexByKey.set(key, index);
      sections.push({ title: formatDayHeader(fixture.kickoffUtc, timeZone), data: [] });
    }
    sections[index]!.data.push(fixture);
  }

  return sections;
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
