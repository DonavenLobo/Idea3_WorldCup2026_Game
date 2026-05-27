import { TRIVIA_POINTS, TRIVIA_QUESTIONS, TRIVIA_QUESTIONS_PER_DAY } from "@world-cup-game/config";
import type { TriviaDifficulty, TriviaQuestion } from "@world-cup-game/config";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayIndex(d: Date = new Date()): number {
  return Math.floor(d.getTime() / 86_400_000);
}

/**
 * Picks today's trivia questions deterministically by day index, one of each
 * difficulty in order: easy, medium, hard. Same questions for every user on
 * the same day (per mvp_decisions #17).
 */
export function pickTodaysQuestions(d: Date = new Date()): TriviaQuestion[] {
  const idx = dayIndex(d);
  const easy = TRIVIA_QUESTIONS.filter((q) => q.difficulty === "easy");
  const medium = TRIVIA_QUESTIONS.filter((q) => q.difficulty === "medium");
  const hard = TRIVIA_QUESTIONS.filter((q) => q.difficulty === "hard");

  if (easy.length === 0 || medium.length === 0 || hard.length === 0) {
    throw new Error("Trivia question pool is missing one or more difficulty tiers.");
  }

  const picks = [
    easy[idx % easy.length],
    medium[idx % medium.length],
    hard[idx % hard.length]
  ].filter((q): q is TriviaQuestion => q !== undefined);

  if (picks.length !== TRIVIA_QUESTIONS_PER_DAY) {
    throw new Error("Failed to pick today's trivia questions.");
  }
  return picks;
}

export function pointsFor(difficulty: TriviaDifficulty): number {
  return TRIVIA_POINTS[difficulty];
}
