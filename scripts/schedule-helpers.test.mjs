import { describe, expect, it } from "vitest";
import {
  assignMatchNumbers,
  isPlaceholderTeam,
  parseCoords,
  parseKickoffUtc,
  stageForRound
} from "./schedule-helpers.mjs";

describe("parseKickoffUtc", () => {
  it("converts a local kickoff with offset to UTC ISO", () => {
    expect(parseKickoffUtc("2026-06-11", "13:00 UTC-6")).toBe("2026-06-11T19:00:00.000Z");
  });
  it("rolls over to the next day when needed", () => {
    expect(parseKickoffUtc("2026-06-11", "20:00 UTC-6")).toBe("2026-06-12T02:00:00.000Z");
  });
  it("handles UTC-4 venues", () => {
    expect(parseKickoffUtc("2026-06-18", "12:00 UTC-4")).toBe("2026-06-18T16:00:00.000Z");
  });
  it("throws on malformed input", () => {
    expect(() => parseKickoffUtc("2026-06-11", "nope")).toThrow();
  });
});

describe("stageForRound", () => {
  it("maps matchdays to group", () => {
    expect(stageForRound("Matchday 1")).toBe("group");
    expect(stageForRound("Matchday 17")).toBe("group");
  });
  it("maps knockout labels", () => {
    expect(stageForRound("Round of 32")).toBe("r32");
    expect(stageForRound("Round of 16")).toBe("r16");
    expect(stageForRound("Quarter-final")).toBe("qf");
    expect(stageForRound("Semi-final")).toBe("sf");
    expect(stageForRound("Match for third place")).toBe("third");
    expect(stageForRound("Final")).toBe("final");
  });
  it("throws on unknown rounds", () => {
    expect(() => stageForRound("Mystery")).toThrow();
  });
});

describe("isPlaceholderTeam", () => {
  it("treats real nation names as non-placeholders", () => {
    for (const name of ["Mexico", "South Africa", "Bosnia & Herzegovina", "DR Congo", "Curaçao"]) {
      expect(isPlaceholderTeam(name)).toBe(false);
    }
  });
  it("detects knockout slot labels", () => {
    for (const name of ["2A", "1E", "3A/B/C/D/F", "W74", "L101"]) {
      expect(isPlaceholderTeam(name)).toBe(true);
    }
  });
});

describe("assignMatchNumbers", () => {
  it("keeps explicit knockout numbers and numbers group matches by kickoff order", () => {
    const input = [
      { team1: "B", team2: "C", ground: "Z", kickoffUtc: "2026-06-12T00:00:00.000Z" },
      { team1: "A", team2: "D", ground: "Y", kickoffUtc: "2026-06-11T00:00:00.000Z" },
      { num: 73, team1: "W", team2: "X", ground: "Q", kickoffUtc: "2026-06-28T00:00:00.000Z" }
    ];
    const out = assignMatchNumbers(input);
    expect(out.find((m) => m.team1 === "A").num).toBe(1);
    expect(out.find((m) => m.team1 === "B").num).toBe(2);
    expect(out.find((m) => m.team1 === "W").num).toBe(73);
  });
});

describe("parseCoords", () => {
  it("parses DMS coordinates", () => {
    expect(parseCoords("49°16'36\"N 123°6'43\"W")).toEqual({ lat: 49.27667, lng: -123.11194 });
  });
  it("parses decimal coordinates", () => {
    expect(parseCoords("37.403°N 121.970°W")).toEqual({ lat: 37.403, lng: -121.97 });
  });
  it("parses fractional seconds", () => {
    const out = parseCoords("40°48'48.7\"N 74°4'27.7\"W");
    expect(out.lat).toBeCloseTo(40.81353, 4);
    expect(out.lng).toBeCloseTo(-74.07436, 4);
  });
});
