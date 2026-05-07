export interface WordlePuzzle {
  answer: string;
}

export interface CrosswordPuzzle {
  size: number;
  grid: (string | null)[][];
  numbers: (number | null)[][];
  acrossClues: { num: number; clue: string }[];
  downClues: { num: number; clue: string }[];
}

export interface SpellingPuzzle {
  center: string;
  outer: string[];
  validWords: string[];
  maxScore: number;
}

export interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  given: boolean[][];
}

export interface TangoPuzzle {
  grid: number[][];
  solution: number[][];
  given: boolean[][];
}

export interface DailyPuzzles {
  date: string;
  wordle: WordlePuzzle;
  crossword: CrosswordPuzzle;
  spelling: SpellingPuzzle;
  sudoku: SudokuPuzzle;
  tango: TangoPuzzle;
}
