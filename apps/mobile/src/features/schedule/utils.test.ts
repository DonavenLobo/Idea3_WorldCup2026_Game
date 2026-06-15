import { describe, expect, it } from "vitest";
import type { Fixture } from "@world-cup-game/config";
import {
  findDefaultScheduleScrollTarget,
  filterMatches,
  formatDayHeader,
  formatKickoffTime,
  groupByLocalDay,
  localDayKey,
  mapsUrl,
  matchesMyTeam,
  myTeamNamesForCode
} from "./utils";
import type { ScheduledFixture } from "./types";

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

function scheduledFixture(
  partial: Partial<ScheduledFixture> & Pick<ScheduledFixture, "num">
): ScheduledFixture {
  return {
    ...fixture(partial),
    score: partial.score ?? null,
    status: partial.status ?? "scheduled"
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

describe("findDefaultScheduleScrollTarget", () => {
  it("prefers a live match over future matches", () => {
    const sections = groupByLocalDay(
      [
        scheduledFixture({
          num: 1,
          kickoffUtc: "2026-06-15T17:00:00.000Z",
          status: "scheduled"
        }),
        scheduledFixture({
          num: 2,
          kickoffUtc: "2026-06-15T15:00:00.000Z",
          status: "live"
        })
      ],
      "UTC"
    );

    expect(findDefaultScheduleScrollTarget(sections, new Date("2026-06-15T16:00:00.000Z"))).toMatchObject({
      matchNum: 2,
      reason: "live"
    });
  });

  it("uses the current match window when scores have not marked the match live", () => {
    const sections = groupByLocalDay(
      [
        scheduledFixture({
          num: 1,
          kickoffUtc: "2026-06-15T15:00:00.000Z",
          status: "scheduled"
        }),
        scheduledFixture({
          num: 2,
          kickoffUtc: "2026-06-15T22:00:00.000Z",
          status: "scheduled"
        })
      ],
      "UTC"
    );

    expect(findDefaultScheduleScrollTarget(sections, new Date("2026-06-15T16:00:00.000Z"))).toMatchObject({
      matchNum: 1,
      reason: "current"
    });
  });

  it("falls forward to the next upcoming match", () => {
    const sections = groupByLocalDay(
      [
        scheduledFixture({
          num: 1,
          kickoffUtc: "2026-06-15T15:00:00.000Z",
          status: "completed"
        }),
        scheduledFixture({
          num: 2,
          kickoffUtc: "2026-06-15T22:00:00.000Z",
          status: "scheduled"
        })
      ],
      "UTC"
    );

    expect(findDefaultScheduleScrollTarget(sections, new Date("2026-06-15T16:00:00.000Z"))).toMatchObject({
      matchNum: 2,
      reason: "upcoming"
    });
  });

  it("falls back to the last match if everything is complete", () => {
    const sections = groupByLocalDay(
      [
        scheduledFixture({
          num: 1,
          kickoffUtc: "2026-06-15T15:00:00.000Z",
          status: "completed"
        }),
        scheduledFixture({
          num: 2,
          kickoffUtc: "2026-06-16T15:00:00.000Z",
          status: "completed"
        })
      ],
      "UTC"
    );

    expect(findDefaultScheduleScrollTarget(sections, new Date("2026-06-17T16:00:00.000Z"))).toMatchObject({
      matchNum: 2,
      reason: "fallback"
    });
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
