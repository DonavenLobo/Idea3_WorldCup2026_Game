import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TRIVIA_QUESTIONS_PER_DAY } from "@gogaffa/config";
import { useSession } from "../auth/hooks/useSession";
import { useNotifyCardUpgrades } from "../card/components/CardUpgradeGate";
import {
  getCompletedTriviaAttempt,
  getDailyTriviaQuestions,
  submitDailyTriviaAttempt
} from "./api/trivia";
import type { DailyAnswer, DailyTriviaQuestion, ScoredTriviaAttempt, TriviaResult } from "./types";
import { dateKey } from "./utils";

interface TriviaContextValue {
  activeDate: string;
  answers: DailyAnswer[];
  completedAttempt: ScoredTriviaAttempt | null;
  currentIndex: number;
  error: Error | null;
  isLoading: boolean;
  isStarted: boolean;
  isSubmitting: boolean;
  questions: DailyTriviaQuestion[];
  questionStartedAt: number;
  advance: () => Promise<void>;
  reloadToday: () => Promise<void>;
  startToday: () => void;
  submitAnswer: (selectedIndex: number) => TriviaResult | null;
}

const TriviaContext = createContext<TriviaContextValue | null>(null);

export function TriviaProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isSessionLoading } = useSession();
  const notifyCardUpgrades = useNotifyCardUpgrades();
  const queryClient = useQueryClient();
  const [activeDate] = useState(() => dateKey());
  const [answers, setAnswers] = useState<DailyAnswer[]>([]);
  const [completedAttempt, setCompletedAttempt] = useState<ScoredTriviaAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<DailyTriviaQuestion[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());

  const loadToday = useCallback(async () => {
    if (isSessionLoading) return;

    if (!user) {
      setAnswers([]);
      setCompletedAttempt(null);
      setCurrentIndex(0);
      setError(null);
      setIsLoading(false);
      setIsStarted(false);
      setQuestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [dailyQuestions, existingAttempt] = await Promise.all([
        getDailyTriviaQuestions(activeDate),
        getCompletedTriviaAttempt(activeDate)
      ]);

      setQuestions(dailyQuestions);
      setCompletedAttempt(existingAttempt);
      setAnswers(existingAttempt?.answers ?? []);
      setCurrentIndex(existingAttempt ? dailyQuestions.length : 0);
      setIsStarted(Boolean(existingAttempt));
      setQuestionStartedAt(Date.now());
    } catch (loadError) {
      const normalizedError =
        loadError instanceof Error ? loadError : new Error("Failed to load daily trivia.");
      console.warn("Failed to load daily trivia", normalizedError);
      setError(normalizedError);
    } finally {
      setIsLoading(false);
    }
  }, [activeDate, isSessionLoading, user]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const startToday = useCallback(() => {
    if (completedAttempt || questions.length !== TRIVIA_QUESTIONS_PER_DAY) return;

    setAnswers([]);
    setCurrentIndex(0);
    setError(null);
    setIsStarted(true);
    setQuestionStartedAt(Date.now());
  }, [completedAttempt, questions.length]);

  const submitAnswer = useCallback(
    (selectedIndex: number): TriviaResult | null => {
      const currentQuestion = questions[currentIndex];
      const selectedOption = currentQuestion?.answerOptions[selectedIndex];

      if (!currentQuestion || !selectedOption || completedAttempt) {
        return null;
      }

      const responseTimeMs = Math.max(0, Date.now() - questionStartedAt);
      const answer: DailyAnswer = {
        questionId: currentQuestion.id,
        selectedAnswerKey: selectedOption.key,
        selectedIndex,
        responseTimeMs
      };

      setAnswers((prev) => {
        const withoutCurrentQuestion = prev.filter((entry) => entry.questionId !== currentQuestion.id);
        return [...withoutCurrentQuestion, answer];
      });

      return {
        selectedAnswerKey: selectedOption.key,
        responseTimeMs
      };
    },
    [completedAttempt, currentIndex, questionStartedAt, questions]
  );

  const advance = useCallback(async () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setQuestionStartedAt(Date.now());
      return;
    }

    if (answers.length !== questions.length || completedAttempt) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { attempt: scoredAttempt, pendingUpgrades } = await submitDailyTriviaAttempt({
        activeDate,
        answers: answers.map((answer) => ({
          questionId: answer.questionId,
          responseTimeMs: answer.responseTimeMs,
          selectedAnswerKey: answer.selectedAnswerKey
        }))
      });

      setCompletedAttempt(scoredAttempt);
      setAnswers(scoredAttempt.answers);
      setCurrentIndex(questions.length);
      setIsStarted(true);
      await notifyCardUpgrades(pendingUpgrades);

      // Proactively refresh competitive points + leaderboard caches so the
      // home pill and leaderboards reflect the trivia award immediately.
      void queryClient.invalidateQueries({ queryKey: ["competitive-points"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (submitError) {
      const normalizedError =
        submitError instanceof Error ? submitError : new Error("Failed to submit trivia attempt.");
      console.warn("Failed to submit trivia attempt", normalizedError);
      setError(normalizedError);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeDate, answers, completedAttempt, currentIndex, notifyCardUpgrades, questions.length, queryClient]);

  const value = useMemo<TriviaContextValue>(
    () => ({
      activeDate,
      answers,
      completedAttempt,
      currentIndex,
      error,
      isLoading,
      isStarted,
      isSubmitting,
      questions,
      questionStartedAt,
      advance,
      reloadToday: loadToday,
      startToday,
      submitAnswer
    }),
    [
      activeDate,
      answers,
      completedAttempt,
      currentIndex,
      error,
      isLoading,
      isStarted,
      isSubmitting,
      questions,
      questionStartedAt,
      advance,
      loadToday,
      startToday,
      submitAnswer
    ]
  );

  return <TriviaContext.Provider value={value}>{children}</TriviaContext.Provider>;
}

export function useTrivia(): TriviaContextValue {
  const ctx = useContext(TriviaContext);
  if (!ctx) throw new Error("useTrivia must be used within a TriviaProvider.");
  return ctx;
}
