import { TRIVIA_RULES } from "./xpRules";

export const TRIVIA_QUESTIONS_PER_DAY = TRIVIA_RULES.questionsPerDay;
export const TRIVIA_MAX_POINTS_PER_QUESTION =
  TRIVIA_RULES.correctAnswerCompetitivePoints + TRIVIA_RULES.maxSpeedBonusPerQuestion;
