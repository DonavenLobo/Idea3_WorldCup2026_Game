import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { TRIVIA_POINTS } from "@world-cup-game/config";
import type { TriviaQuestion } from "@world-cup-game/config";
import type { DailyAttempt, TriviaResult } from "./types";
import { dateKey, pickTodaysQuestions } from "./utils";

interface TriviaContextValue {
  totalPoints: number;
  todayDateKey: string | null;
  todayQuestions: TriviaQuestion[];
  todayAttempts: DailyAttempt[];
  todayCurrentIndex: number;
  startToday: () => void;
  submitAnswer: (selectedIndex: number) => TriviaResult;
  advance: () => void;
  resetAll: () => void;
}

const TriviaContext = createContext<TriviaContextValue | null>(null);

export function TriviaProvider({ children }: PropsWithChildren) {
  const [totalPoints, setTotalPoints] = useState(0);
  const [todayDateKey, setTodayDateKey] = useState<string | null>(null);
  const [todayQuestions, setTodayQuestions] = useState<TriviaQuestion[]>([]);
  const [todayAttempts, setTodayAttempts] = useState<DailyAttempt[]>([]);
  const [todayCurrentIndex, setTodayCurrentIndex] = useState(0);

  const startToday = useCallback(() => {
    setTodayDateKey(dateKey());
    setTodayQuestions(pickTodaysQuestions());
    setTodayAttempts([]);
    setTodayCurrentIndex(0);
  }, []);

  const submitAnswer = useCallback(
    (selectedIndex: number): TriviaResult => {
      const currentQuestion = todayQuestions[todayCurrentIndex];
      if (!currentQuestion) {
        return { correct: false, points: 0, correctIndex: -1 };
      }
      const correct = selectedIndex === currentQuestion.correctIndex;
      const points = correct ? TRIVIA_POINTS[currentQuestion.difficulty] : 0;

      setTodayAttempts((prev) => [
        ...prev,
        { questionId: currentQuestion.id, selectedIndex, correct, points }
      ]);
      if (correct) {
        setTotalPoints((prev) => prev + points);
      }

      return { correct, points, correctIndex: currentQuestion.correctIndex };
    },
    [todayCurrentIndex, todayQuestions]
  );

  const advance = useCallback(() => {
    setTodayCurrentIndex((i) => i + 1);
  }, []);

  const resetAll = useCallback(() => {
    setTotalPoints(0);
    setTodayDateKey(null);
    setTodayQuestions([]);
    setTodayAttempts([]);
    setTodayCurrentIndex(0);
  }, []);

  const value = useMemo<TriviaContextValue>(
    () => ({
      totalPoints,
      todayDateKey,
      todayQuestions,
      todayAttempts,
      todayCurrentIndex,
      startToday,
      submitAnswer,
      advance,
      resetAll
    }),
    [
      totalPoints,
      todayDateKey,
      todayQuestions,
      todayAttempts,
      todayCurrentIndex,
      startToday,
      submitAnswer,
      advance,
      resetAll
    ]
  );

  return <TriviaContext.Provider value={value}>{children}</TriviaContext.Provider>;
}

export function useTrivia(): TriviaContextValue {
  const ctx = useContext(TriviaContext);
  if (!ctx) throw new Error("useTrivia must be used within a TriviaProvider.");
  return ctx;
}
