/**
 * Hand-rolled tests for card progression. Run with:
 *   pnpm dlx tsx packages/game-engine/src/cardProgression/cardProgression.test.ts
 */

import { calculateCardProgressionLevel, milestonesFromTimestamps } from "./calculateCardProgressionLevel";
import { getUpgradeSteps } from "./getUpgradeSteps";
import { progressionLevelFromTemplateKey, templateKeyForLevel } from "./cardProgressionKeys";

let failed = 0;
let passed = 0;

function eq<T>(name: string, actual: T, expected: T): void {
  if (actual === expected) {
    passed += 1;
    console.log(`PASS  ${name}`);
    return;
  }

  failed += 1;
  console.error(`FAIL  ${name}`);
  console.error(`        expected: ${String(expected)}`);
  console.error(`        actual:   ${String(actual)}`);
}

function deepEq(name: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson === expectedJson) {
    passed += 1;
    console.log(`PASS  ${name}`);
    return;
  }

  failed += 1;
  console.error(`FAIL  ${name}`);
  console.error(`        expected: ${expectedJson}`);
  console.error(`        actual:   ${actualJson}`);
}

eq("signup only -> level 2", calculateCardProgressionLevel({
  hasCompletedFirstTrivia: false,
  hasFinalizedAllBracketGroups: false,
}), 2);

eq("trivia only -> level 3", calculateCardProgressionLevel({
  hasCompletedFirstTrivia: true,
  hasFinalizedAllBracketGroups: false,
}), 3);

eq("bracket only -> level 3", calculateCardProgressionLevel({
  hasCompletedFirstTrivia: false,
  hasFinalizedAllBracketGroups: true,
}), 3);

eq("both milestones -> level 4", calculateCardProgressionLevel({
  hasCompletedFirstTrivia: true,
  hasFinalizedAllBracketGroups: true,
}), 4);

deepEq("2 -> 4 yields sequential steps", getUpgradeSteps(2, 4), [
  { from: 2, to: 3 },
  { from: 3, to: 4 },
]);

deepEq("3 -> 4 yields one step", getUpgradeSteps(3, 4), [{ from: 3, to: 4 }]);

deepEq("same level yields no steps", getUpgradeSteps(3, 3), []);

deepEq("regression lower target yields no steps", getUpgradeSteps(4, 2), []);

eq("legacy sketch maps to level 2", progressionLevelFromTemplateKey("level-00-sketch-v1"), 2);
eq("page 4 maps to level 4", progressionLevelFromTemplateKey("level-04-base-v1"), 4);
eq("template key for level 3", templateKeyForLevel(3), "level-03-base-v1");

deepEq("milestones from timestamps", milestonesFromTimestamps({
  firstTriviaCompletedAt: "2026-06-15T00:00:00.000Z",
  bracketGroupsFinalizedAt: null,
}), {
  hasCompletedFirstTrivia: true,
  hasFinalizedAllBracketGroups: false,
});

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  throw new Error(`${failed} card progression tests failed`);
}

console.log(`\nAll ${passed} tests passed.`);
