import { describe, expect, it } from "vitest";
import { SUPPORTED_NATIONS } from "./nations";
import { TEAM_FLAGS } from "./teamFlags";

// The onboarding nation picker (SUPPORTED_NATIONS, keyed by code) and the
// schedule flag map (TEAM_FLAGS, keyed by full team name from worldcup.json)
// are intentionally separate sources. This guards against silent drift:
// wherever a nation name appears in BOTH, the emoji MUST be identical.
describe("flag consistency between nations.ts and team-flags.json", () => {
  it("uses the same emoji for nation names present in both sources", () => {
    const mismatches: string[] = [];
    for (const nation of SUPPORTED_NATIONS) {
      const scheduleFlag = TEAM_FLAGS[nation.name];
      if (scheduleFlag !== undefined && scheduleFlag !== nation.flagEmoji) {
        mismatches.push(
          `${nation.name}: nations.ts=${nation.flagEmoji} team-flags.json=${scheduleFlag}`
        );
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("overlaps on at least a dozen nations (sanity: the check is actually running)", () => {
    const overlap = SUPPORTED_NATIONS.filter((n) => n.name in TEAM_FLAGS);
    expect(overlap.length).toBeGreaterThanOrEqual(12);
  });
});
