export const TRIVIA_RULES = {
  questionsPerDay: 5,
  answerOptionsPerQuestion: 4,
  correctAnswerCompetitivePoints: 100,
  maxSpeedBonusPerQuestion: 20,
  correctAnswerCardXp: 25,
  completedDailyTriviaCardXp: 50
} as const;

export const BOUNTY_RULES = {
  awardsCompetitivePoints: false,
  revealRewardOnOpen: true
} as const;

export const ECONOMY_RULES = {
  purchasesAffectCompetitivePoints: false,
  cardsCanDowngrade: false
} as const;
