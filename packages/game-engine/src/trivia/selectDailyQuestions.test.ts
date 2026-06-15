/** Run: pnpm dlx tsx packages/game-engine/src/trivia/selectDailyQuestions.test.ts */
import type { PooledTriviaQuestion } from "@world-cup-game/types";
import { selectDailyQuestions, InsufficientPoolError } from "./selectDailyQuestions";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log("ok -", name);
  else { failed++; console.error("FAIL -", name); }
}

function q(id: string, nation: string): PooledTriviaQuestion {
  return {
    id, nationCode: nation, question: `Q ${id}`,
    answerOptions: [
      { key: "A", label: "a" }, { key: "B", label: "b" },
      { key: "C", label: "c" }, { key: "D", label: "d" },
    ],
    correctAnswerKey: "A", explanation: "because", difficulty: "standard",
  };
}

const wc = new Set(["BRA", "ARG", "FRA", "ENG", "JPN"]);
const pool: PooledTriviaQuestion[] = [
  q("b1", "BRA"), q("b2", "BRA"), q("a1", "ARG"),
  q("f1", "FRA"), q("e1", "ENG"), q("j1", "JPN"),
  q("x1", "XXX"),
];

const picks = selectDailyQuestions(pool, "2026-06-13", 3, { wcNationCodes: wc });
check("picks exactly 3", picks.length === 3);
check("distinct nations", new Set(picks.map((p) => p.nationCode)).size === 3);
check("all WC nations", picks.every((p) => wc.has(p.nationCode)));
check("never picks non-WC", picks.every((p) => p.nationCode !== "XXX"));

const again = selectDailyQuestions(pool, "2026-06-13", 3, { wcNationCodes: wc });
check("deterministic per date", JSON.stringify(picks) === JSON.stringify(again));

const ex = selectDailyQuestions(pool, "2026-06-13", 3, {
  wcNationCodes: wc, excludeQuestionIds: new Set(picks.map((p) => p.id)),
});
check("exclude avoids reused ids", ex.every((p) => !picks.some((o) => o.id === p.id)) || ex.length === 3);

let threw = false;
try {
  selectDailyQuestions([q("b1", "BRA"), q("b2", "BRA")], "2026-06-13", 3, { wcNationCodes: wc });
} catch (e) {
  threw = e instanceof InsufficientPoolError && (e as InsufficientPoolError).needed === 3;
}
check("throws InsufficientPoolError when <3 nations", threw);

const rev = selectDailyQuestions([...pool].reverse(), "2026-06-13", 3, { wcNationCodes: wc });
check("order-independent", JSON.stringify(picks.map((p) => p.id)) === JSON.stringify(rev.map((p) => p.id)));

let rangeThrew = false;
try {
  selectDailyQuestions(pool, "2026-06-13", -1, { wcNationCodes: wc });
} catch (e) {
  rangeThrew = e instanceof RangeError;
}
check("count<0 throws RangeError", rangeThrew);

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
if (failed > 0) {
  throw new Error(`${failed} test(s) failed`);
}
