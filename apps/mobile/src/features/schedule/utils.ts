import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { Fixture } from "@world-cup-game/config";
import type { ScheduleFilter, ScheduleSection } from "./types";

const CURRENT_MATCH_WINDOW_MS = 4 * 60 * 60 * 1000;

export interface ScheduleScrollTarget {
  itemIndex: number;
  matchNum: number;
  reason: "live" | "current" | "upcoming" | "fallback";
  sectionIndex: number;
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

export function filterMatches<T extends Fixture>(
  fixtures: T[],
  filter: ScheduleFilter,
  myTeamNames: Set<string>
): T[] {
  switch (filter) {
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

function findFirstTarget(
  sections: ScheduleSection[],
  reason: ScheduleScrollTarget["reason"],
  predicate: (fixture: ScheduleSection["data"][number]) => boolean
): ScheduleScrollTarget | null {
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex]!;
    for (let itemIndex = 0; itemIndex < section.data.length; itemIndex += 1) {
      const fixture = section.data[itemIndex]!;
      if (predicate(fixture)) {
        return { itemIndex, matchNum: fixture.num, reason, sectionIndex };
      }
    }
  }

  return null;
}

export function findDefaultScheduleScrollTarget(
  sections: ScheduleSection[],
  now: Date = new Date()
): ScheduleScrollTarget | null {
  const nowMs = now.getTime();

  const liveTarget = findFirstTarget(
    sections,
    "live",
    (fixture) => fixture.status === "live"
  );
  if (liveTarget) return liveTarget;

  const currentTarget = findFirstTarget(sections, "current", (fixture) => {
    if (fixture.status === "completed") return false;
    const kickoffMs = Date.parse(fixture.kickoffUtc);
    return kickoffMs <= nowMs && nowMs < kickoffMs + CURRENT_MATCH_WINDOW_MS;
  });
  if (currentTarget) return currentTarget;

  const upcomingTarget = findFirstTarget(sections, "upcoming", (fixture) => {
    if (fixture.status === "completed") return false;
    return Date.parse(fixture.kickoffUtc) > nowMs;
  });
  if (upcomingTarget) return upcomingTarget;

  for (let sectionIndex = sections.length - 1; sectionIndex >= 0; sectionIndex -= 1) {
    const section = sections[sectionIndex]!;
    if (section.data.length > 0) {
      const itemIndex = section.data.length - 1;
      const fixture = section.data[itemIndex]!;
      return { itemIndex, matchNum: fixture.num, reason: "fallback", sectionIndex };
    }
  }

  return null;
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
