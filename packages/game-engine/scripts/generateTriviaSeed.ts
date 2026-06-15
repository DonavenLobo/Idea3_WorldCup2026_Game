/**
 * Generate the daily trivia seed for [today .. today+horizon].
 * Run: pnpm dlx tsx packages/game-engine/scripts/generateTriviaSeed.ts [horizonDays]
 * Writes supabase/seed/trivia_questions.sql. Prints a coverage report.
 * Exits non-zero if any day cannot be filled (strict).
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateTriviaSchedule, renderScheduleSql,
} from "../src/trivia/generateTriviaSchedule";
import { WORLD_CUP_2026_NATION_SET } from "../src/trivia/worldCup2026";
import { WORLD_CUP_TRIVIA_POOL } from "../src/trivia/pool/worldCupTriviaPool";

declare const process: {
  argv: string[];
  exit(code?: number): never;
  cwd(): string;
};

const horizon = Number(process.argv[2] ?? "30");
const today = new Date().toISOString().slice(0, 10);

const { schedule, gaps } = generateTriviaSchedule({
  pool: WORLD_CUP_TRIVIA_POOL,
  wcNationCodes: WORLD_CUP_2026_NATION_SET,
  startDate: today,
  days: horizon,
});

console.log(`Trivia schedule: ${today} for ${horizon} days`);
console.log(`  filled: ${schedule.length}  gaps: ${gaps.length}`);
if (gaps.length > 0) {
  console.log("\nDAYS THAT CANNOT FIELD 3 DISTINCT WC NATIONS:");
  for (const g of gaps) {
    console.log(`  ${g.activeDate}: ${g.reason} (have ${g.availableNations}, need ${g.needed})`);
  }
  console.log("\nRe-run after adding questions for under-supplied nations.");
}

const outPath = resolve(process.cwd(), "supabase/seed/trivia_questions.sql");
writeFileSync(outPath, renderScheduleSql(schedule), "utf8");
console.log(`\nWrote ${schedule.length * 3} rows to ${outPath}`);

process.exit(gaps.length === 0 ? 0 : 1);
