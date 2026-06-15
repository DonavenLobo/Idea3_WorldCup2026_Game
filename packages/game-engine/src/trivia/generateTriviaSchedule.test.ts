/** Run: pnpm dlx tsx packages/game-engine/src/trivia/generateTriviaSchedule.test.ts */
import type { PooledTriviaQuestion } from "@world-cup-game/types";
import {
  addDays, generateTriviaSchedule, renderScheduleSql, withShuffledOptions,
} from "./generateTriviaSchedule";

declare const process: { exit(code?: number): never };
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log("ok -", name);
  else { failed++; console.error("FAIL -", name); }
}

function q(id: string, nation: string): PooledTriviaQuestion {
  return {
    id, nationCode: nation, question: `What about ${nation}? (${id})`,
    answerOptions: [
      { key: "A", label: "a" }, { key: "B", label: "b" },
      { key: "C", label: "c" }, { key: "D", label: "d" },
    ],
    correctAnswerKey: "A", explanation: "it's a fact", difficulty: "standard",
  };
}

check("addDays adds UTC days", addDays("2026-06-13", 2) === "2026-06-15");
check("addDays month rollover", addDays("2026-06-30", 1) === "2026-07-01");

const wc = new Set(["BRA", "ARG", "FRA", "ENG", "JPN"]);
const rich: PooledTriviaQuestion[] = [];
for (const n of wc) for (let i = 0; i < 4; i++) rich.push(q(`${n}${i}`, n));

const ok = generateTriviaSchedule({ pool: rich, wcNationCodes: wc, startDate: "2026-06-13", days: 3 });
check("3 days scheduled", ok.schedule.length === 3);
check("no gaps with rich pool", ok.gaps.length === 0);
check("each day 3 distinct nations", ok.schedule.every(
  (d) => d.questions.length === 3 && new Set(d.questions.map((x) => x.nationCode)).size === 3,
));
check("no question reused across horizon", (() => {
  const ids = ok.schedule.flatMap((d) => d.questions.map((x) => x.id));
  return new Set(ids).size === ids.length;
})());

const thin: PooledTriviaQuestion[] = [q("b0", "BRA"), q("a0", "ARG"), q("f0", "FRA")];
const thinRes = generateTriviaSchedule({ pool: thin, wcNationCodes: wc, startDate: "2026-06-13", days: 2 });
check("day 1 fills from thin pool", thinRes.schedule.some((d) => d.activeDate === "2026-06-13"));
check("day 2 is a gap (questions exhausted)", thinRes.gaps.some((g) => g.activeDate === "2026-06-14"));

const sql = renderScheduleSql(ok.schedule);
check("sql has insert", sql.includes("insert into public.trivia_questions"));
check("sql has on conflict upsert", sql.includes("on conflict (active_date, question_order) do update"));
check("sql row count = days*3", (sql.match(/::jsonb/g) || []).length === 9);

// Apostrophe escaping (Côte d'Ivoire) — JSON label + explanation
const apos = [{
  activeDate: "2026-06-13",
  questions: [{
    id: "c1", nationCode: "CIV", question: "Who plays for Côte d'Ivoire?",
    answerOptions: [
      { key: "A", label: "Côte d'Ivoire" }, { key: "B", label: "b" },
      { key: "C", label: "c" }, { key: "D", label: "d" },
    ],
    correctAnswerKey: "A", explanation: "it's them", difficulty: "standard",
  }],
}];
const aposSql = renderScheduleSql(apos as never);
check("escapes apostrophes to ''", aposSql.includes("Côte d''Ivoire") && aposSql.includes("it''s them"));

// Empty schedule must not emit a bare VALUES clause
const emptySql = renderScheduleSql([]);
check("empty schedule emits no VALUES", !emptySql.toLowerCase().includes("values"));

// Deterministic per-seed option shuffle that preserves the correct answer
const baseQ = q("z1", "BRA"); // correctAnswerKey "A", labels a/b/c/d
const sh1 = withShuffledOptions(baseQ, "2026-06-13:z1");
const sh2 = withShuffledOptions(baseQ, "2026-06-13:z1");
check("shuffle deterministic per seed", JSON.stringify(sh1) === JSON.stringify(sh2));
check("shuffle keeps 4 options + nation", sh1.answerOptions.length === 4 && sh1.nationCode === "BRA");
const baseCorrect = baseQ.answerOptions.find((o) => o.key === baseQ.correctAnswerKey)!.label;
const sh1Correct = sh1.answerOptions.find((o) => o.key === sh1.correctAnswerKey)!.label;
check("shuffle preserves correct label", sh1Correct === baseCorrect);
check("shuffle preserves option set", JSON.stringify(sh1.answerOptions.map((o) => o.label).sort())
  === JSON.stringify(baseQ.answerOptions.map((o) => o.label).sort()));
// Correct key is not always "A" across many questions
const correctKeys = new Set(
  Array.from({ length: 24 }, (_, i) => withShuffledOptions(q(`k${i}`, "BRA"), `seed:${i}`).correctAnswerKey),
);
check("correct key varies (not all A)", correctKeys.size >= 2);
// Schedule applies shuffling: keys across the generated seed aren't all "A"
const balanced = generateTriviaSchedule({ pool: rich, wcNationCodes: wc, startDate: "2026-06-13", days: 3 });
const allKeys = new Set(balanced.schedule.flatMap((d) => d.questions.map((x) => x.correctAnswerKey)));
check("generated schedule keys vary", allKeys.size >= 2);

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
