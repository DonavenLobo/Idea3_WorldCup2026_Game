import type { PooledTriviaQuestion } from "@gogaffa/types";
import { seededRandom, seededShuffle } from "./seededRandom";

export class InsufficientPoolError extends Error {
  constructor(
    public readonly date: string,
    public readonly reason: string,
    public readonly availableNations: number,
    public readonly needed: number,
  ) {
    super(
      `Cannot field ${needed} distinct WC nations for ${date}: ${reason} ` +
        `(have ${availableNations}).`,
    );
    this.name = "InsufficientPoolError";
  }
}

export interface SelectOptions {
  wcNationCodes: ReadonlySet<string>;
  excludeQuestionIds?: ReadonlySet<string>;
}

/**
 * Deterministically pick `count` questions for `isoDate` such that every pick is
 * a distinct WC-2026 nation. Stable for a given (pool contents, date, exclude set)
 * regardless of input order. Throws InsufficientPoolError when impossible.
 */
export function selectDailyQuestions(
  pool: readonly PooledTriviaQuestion[],
  isoDate: string,
  count: number,
  opts: SelectOptions,
): PooledTriviaQuestion[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`count must be a non-negative integer, got ${count}`);
  }
  const exclude = opts.excludeQuestionIds ?? new Set<string>();
  const available = pool
    .filter((q) => opts.wcNationCodes.has(q.nationCode) && !exclude.has(q.id))
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const byNation = new Map<string, PooledTriviaQuestion[]>();
  for (const q of available) {
    const list = byNation.get(q.nationCode);
    if (list) list.push(q);
    else byNation.set(q.nationCode, [q]);
  }

  const nations = [...byNation.keys()].sort();
  if (nations.length < count) {
    throw new InsufficientPoolError(
      isoDate,
      "not enough distinct WC nations with an unused question",
      nations.length,
      count,
    );
  }

  const rand = seededRandom(isoDate);
  const chosenNations = seededShuffle(nations, rand).slice(0, count);
  return chosenNations.map((nation) => {
    const [pick] = seededShuffle(byNation.get(nation)!, rand);
    if (!pick) {
      throw new Error(`Internal: empty question list for nation ${nation}`);
    }
    return pick;
  });
}
