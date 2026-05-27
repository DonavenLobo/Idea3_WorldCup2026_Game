export type TriviaDifficulty = "easy" | "medium" | "hard";

export interface TriviaQuestion {
  id: string;
  question: string;
  options: readonly string[];
  correctIndex: number;
  difficulty: TriviaDifficulty;
}

// Points awarded for a correct answer at each difficulty. Real production
// scoring (per mvp_decisions #20) should add a speed bonus on top of this.
// Mock: correctness * difficulty only.
export const TRIVIA_POINTS: Record<TriviaDifficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50
};

export const TRIVIA_QUESTIONS_PER_DAY = 3;

// Provisional question pool for development. Real production sources from
// Supabase + rotates via backend. Replace before launch.
export const TRIVIA_QUESTIONS: readonly TriviaQuestion[] = [
  // ---------- EASY (10 pts) ----------
  {
    id: "easy-1",
    difficulty: "easy",
    question: "Which country has won the most FIFA World Cups?",
    options: ["Germany", "Brazil", "Italy", "Argentina"],
    correctIndex: 1
  },
  {
    id: "easy-2",
    difficulty: "easy",
    question: "Which three countries are co-hosting the 2026 World Cup?",
    options: [
      "Brazil, Argentina, Uruguay",
      "Spain, Portugal, Morocco",
      "USA, Mexico, Canada",
      "England, Wales, Scotland"
    ],
    correctIndex: 2
  },
  {
    id: "easy-3",
    difficulty: "easy",
    question: "How many teams will compete at the 2026 World Cup?",
    options: ["32", "40", "48", "64"],
    correctIndex: 2
  },
  {
    id: "easy-4",
    difficulty: "easy",
    question: "What color is Brazil's primary home kit?",
    options: ["Blue", "Yellow", "Green", "White"],
    correctIndex: 1
  },
  {
    id: "easy-5",
    difficulty: "easy",
    question: "Which legendary player scored the famous \"Hand of God\" goal?",
    options: ["Pele", "Lionel Messi", "Diego Maradona", "Cristiano Ronaldo"],
    correctIndex: 2
  },

  // ---------- MEDIUM (25 pts) ----------
  {
    id: "medium-1",
    difficulty: "medium",
    question: "Who won the Golden Boot at the 2022 World Cup?",
    options: ["Lionel Messi", "Olivier Giroud", "Julian Alvarez", "Kylian Mbappe"],
    correctIndex: 3
  },
  {
    id: "medium-2",
    difficulty: "medium",
    question: "Which African nation reached the semi-finals of the 2022 World Cup?",
    options: ["Senegal", "Morocco", "Cameroon", "Ghana"],
    correctIndex: 1
  },
  {
    id: "medium-3",
    difficulty: "medium",
    question: "Who scored the winning goal in the 2014 World Cup Final?",
    options: ["Thomas Muller", "Andre Schurrle", "Mario Gotze", "Bastian Schweinsteiger"],
    correctIndex: 2
  },
  {
    id: "medium-4",
    difficulty: "medium",
    question: "Which country won the 1998 World Cup?",
    options: ["Brazil", "France", "Germany", "Italy"],
    correctIndex: 1
  },
  {
    id: "medium-5",
    difficulty: "medium",
    question: "Who holds the record for most goals in a single World Cup tournament?",
    options: ["Pele", "Just Fontaine", "Gerd Muller", "Ronaldo (Brazil)"],
    correctIndex: 1
  },

  // ---------- HARD (50 pts) ----------
  {
    id: "hard-1",
    difficulty: "hard",
    question: "Who is the all-time top scorer in FIFA World Cup history?",
    options: ["Pele", "Ronaldo (Brazil)", "Miroslav Klose", "Gerd Muller"],
    correctIndex: 2
  },
  {
    id: "hard-2",
    difficulty: "hard",
    question: "Which country hosted the very first FIFA World Cup in 1930?",
    options: ["Brazil", "Italy", "Uruguay", "Argentina"],
    correctIndex: 2
  },
  {
    id: "hard-3",
    difficulty: "hard",
    question: "Who is the youngest player to score in a World Cup Final?",
    options: ["Pele", "Kylian Mbappe", "Lionel Messi", "Ronaldo (Brazil)"],
    correctIndex: 0
  },
  {
    id: "hard-4",
    difficulty: "hard",
    question: "Which nation has appeared in the most World Cup Finals?",
    options: ["Brazil", "Germany", "Italy", "Argentina"],
    correctIndex: 1
  },
  {
    id: "hard-5",
    difficulty: "hard",
    question: "Who scored the fastest goal in World Cup history (around 11 seconds)?",
    options: ["Hakan Sukur", "Diego Maradona", "Robin van Persie", "Cristiano Ronaldo"],
    correctIndex: 0
  }
];
