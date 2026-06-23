import { describe, expect, it } from "vitest";
import type { Fixture } from "@gogaffa/config";
import {
  filterMatches,
  formatDayHeader,
  formatKickoffTime,
  groupByLocalDay,
  hasMatchesToday,
  localDayKey,
  mapsUrl,
  matchesLocalDay,
  matchesMyTeam,
  myTeamNamesForCode
} from "./utils";

function fixture(partial: Partial<Fixture> & Pick<Fixture, "num">): Fixture {
  return {
    num: partial.num,
    round: partial.round ?? "Matchday 1",
    stage: partial.stage ?? "group",
    group: partial.group ?? "Group A",
    kickoffUtc: partial.kickoffUtc ?? "2026-06-11T19:00:00.000Z",
    team1: partial.team1 ?? "Mexico",
    team2: partial.team2 ?? "South Africa",
    venueCity: partial.venueCity ?? "Mexico City"
  };
}

describe("localDayKey", () => {
  it("uses the supplied timezone to compute the local day", () => {
    expect(localDayKey("2026-06-12T02:00:00.000Z", "America/Los_Angeles")).toBe("2026-06-11");
    expect(localDayKey("2026-06-12T02:00:00.000Z", "UTC")).toBe("2026-06-12");
  });
});

describe("filterMatches / matchesMyTeam / myTeamNamesForCode", () => {
  const matches: Fixture[] = [
    fixture({ num: 1, stage: "group", team1: "USA", team2: "Paraguay" }),
    fixture({ num: 73, stage: "r32", group: null, team1: "2A", team2: "2B" })
  ];
  it("filters group vs knockouts", () => {
    expect(filterMatches(matches, "group", new Set()).map((m) => m.num)).toEqual([1]);
    expect(filterMatches(matches, "knockouts", new Set()).map((m) => m.num)).toEqual([73]);
  });
  it("returns everything for the 'all' filter", () => {
    expect(filterMatches(matches, "all", new Set()).map((m) => m.num)).toEqual([1, 73]);
  });
  it("filters to today's local matches", () => {
    const localMatches: Fixture[] = [
      fixture({ num: 1, kickoffUtc: "2026-06-12T02:00:00.000Z" }),
      fixture({ num: 2, kickoffUtc: "2026-06-12T20:00:00.000Z" })
    ];

    expect(
      filterMatches(localMatches, "today", new Set(), {
        now: new Date("2026-06-12T03:00:00.000Z"),
        timeZone: "America/Los_Angeles"
      }).map((m) => m.num)
    ).toEqual([1]);
  });
  it("matches my team by nation code", () => {
    const names = myTeamNamesForCode("USA");
    expect(matchesMyTeam(matches[0]!, names)).toBe(true);
    expect(matchesMyTeam(matches[1]!, names)).toBe(false);
  });
  it("matches my team by nation name when codes differ", () => {
    const names = myTeamNamesForCode("KOR");
    const korea = fixture({ num: 2, team1: "South Korea", team2: "Czech Republic" });
    expect(matchesMyTeam(korea, names)).toBe(true);
  });
});

describe("groupByLocalDay", () => {
  it("groups chronologically by local day", () => {
    const matches: Fixture[] = [
      fixture({ num: 2, kickoffUtc: "2026-06-12T19:00:00.000Z" }),
      fixture({ num: 1, kickoffUtc: "2026-06-11T19:00:00.000Z" })
    ];
    const sections = groupByLocalDay(matches, "UTC");
    expect(sections).toHaveLength(2);
    expect(sections[0]!.data[0]!.num).toBe(1);
  });
});

describe("matchesLocalDay / hasMatchesToday", () => {
  it("uses the supplied timezone to decide whether a fixture is today", () => {
    const match = fixture({ num: 1, kickoffUtc: "2026-06-12T02:00:00.000Z" });
    const now = new Date("2026-06-12T03:00:00.000Z");

    expect(matchesLocalDay(match, "America/Los_Angeles", now)).toBe(true);
    expect(matchesLocalDay(match, "UTC", now)).toBe(true);
    expect(matchesLocalDay(match, "America/Los_Angeles", new Date("2026-06-12T20:00:00.000Z"))).toBe(false);
  });

  it("detects when the fixture list has games today", () => {
    const matches = [
      fixture({ num: 1, kickoffUtc: "2026-06-14T15:00:00.000Z" }),
      fixture({ num: 2, kickoffUtc: "2026-06-15T22:00:00.000Z" })
    ];

    expect(hasMatchesToday(matches, "UTC", new Date("2026-06-15T16:00:00.000Z"))).toBe(true);
    expect(hasMatchesToday(matches, "UTC", new Date("2026-06-16T16:00:00.000Z"))).toBe(false);
  });
});

describe("mapsUrl", () => {
  it("builds a universal maps query", () => {
    expect(mapsUrl(49.27667, -123.11194)).toBe(
      "https://www.google.com/maps/search/?api=1&query=49.27667,-123.11194"
    );
  });
});

describe("formatKickoffTime", () => {
  it("renders the kickoff hour in the supplied timezone", () => {
    const utc = formatKickoffTime("2026-06-11T19:00:00.000Z", "UTC");
    expect(utc).toMatch(/7.*00/);
    expect(formatKickoffTime("2026-06-11T19:00:00.000Z", "America/Los_Angeles")).not.toBe(utc);
  });
});

describe("formatDayHeader", () => {
  it("is timezone-aware for the local calendar day", () => {
    expect(formatDayHeader("2026-06-12T02:00:00.000Z", "UTC")).toContain("Jun");
    // 02:00 UTC on Jun 12 is still Jun 11 in Los Angeles
    expect(formatDayHeader("2026-06-12T02:00:00.000Z", "America/Los_Angeles")).toContain("11");
  });
});
