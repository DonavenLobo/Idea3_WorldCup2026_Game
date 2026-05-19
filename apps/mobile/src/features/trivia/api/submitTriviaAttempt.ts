import { scoreTriviaAttempt, type TriviaQuestionScoreInput } from "@world-cup-game/game-engine";

export async function submitTriviaAttempt(answers: TriviaQuestionScoreInput[]) {
  // TODO: Submit raw answers to Edge Function. Client-side scoring is only for optimistic display.
  return scoreTriviaAttempt(answers);
}
