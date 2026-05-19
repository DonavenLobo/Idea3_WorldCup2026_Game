export interface StreakState {
  currentStreak: number;
  lastCompletedDate?: string;
  streakSaves: number;
}

export function extendDailyStreak(state: StreakState, completedDate: string): StreakState {
  if (state.lastCompletedDate === completedDate) {
    return state;
  }

  return {
    ...state,
    currentStreak: state.currentStreak + 1,
    lastCompletedDate: completedDate
  };
}

export function useStreakSave(state: StreakState): StreakState {
  if (state.streakSaves <= 0) {
    return {
      ...state,
      currentStreak: 0
    };
  }

  return {
    ...state,
    streakSaves: state.streakSaves - 1
  };
}
