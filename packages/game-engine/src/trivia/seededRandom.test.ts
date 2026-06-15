/** Run: pnpm dlx tsx packages/game-engine/src/trivia/seededRandom.test.ts */
import { seededRandom, seededShuffle } from "./seededRandom";

declare const process: { exit(code?: number): never };
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log("ok -", name);
  else { failed++; console.error("FAIL -", name); }
}

const a = seededRandom("2026-06-13");
const b = seededRandom("2026-06-13");
check("same seed same first value", a() === b());

const c = seededRandom("2026-06-14")();
const d = seededRandom("2026-06-13")();
check("different seed differs", c !== d);

const r = seededRandom("x");
let inRange = true;
for (let i = 0; i < 100; i++) { const v = r(); if (v < 0 || v >= 1) inRange = false; }
check("values in [0,1)", inRange);

const items = [1, 2, 3, 4, 5];
const s1 = seededShuffle(items, seededRandom("d"));
const s2 = seededShuffle(items, seededRandom("d"));
check("shuffle deterministic", JSON.stringify(s1) === JSON.stringify(s2));
check("shuffle is permutation", JSON.stringify([...s1].sort()) === JSON.stringify(items));
check("shuffle does not mutate input", JSON.stringify(items) === JSON.stringify([1,2,3,4,5]));

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
