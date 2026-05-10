import { WordlePuzzle, SudokuPuzzle, TangoPuzzle, SpellingPuzzle } from "./types";
import { WORDLE_ANSWERS, DICTIONARY } from "@/lib/words";
import { scoreSpellingWord } from "./spelling";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  return Math.floor(d.getTime() / 86400000);
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Wordle: pick from static word list by date ──

export function fallbackWordle(dateStr: string): WordlePuzzle {
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed * 2654435761);
  const idx = Math.floor(rng() * WORDLE_ANSWERS.length);
  return { answer: WORDLE_ANSWERS[idx].toUpperCase() };
}

// ── Sudoku: permute a known valid grid ──

const BASE_GRID = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 1, 5, 6, 4, 8, 9, 7],
  [5, 6, 4, 8, 9, 7, 2, 3, 1],
  [8, 9, 7, 2, 3, 1, 5, 6, 4],
  [3, 1, 2, 6, 4, 5, 9, 7, 8],
  [6, 4, 5, 9, 7, 8, 3, 1, 2],
  [9, 7, 8, 3, 1, 2, 6, 4, 5],
];

function permuteSudoku(rng: () => number): number[][] {
  const grid = BASE_GRID.map((r) => [...r]);

  // Digit substitution
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 8; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) grid[r][c] = digits[grid[r][c] - 1];

  // Swap rows within bands
  for (let band = 0; band < 3; band++) {
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const ri = band * 3 + i,
        rj = band * 3 + j;
      [grid[ri], grid[rj]] = [grid[rj], grid[ri]];
    }
  }

  // Swap columns within stacks
  for (let stack = 0; stack < 3; stack++) {
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const ci = stack * 3 + i,
        cj = stack * 3 + j;
      for (let r = 0; r < 9; r++)
        [grid[r][ci], grid[r][cj]] = [grid[r][cj], grid[r][ci]];
    }
  }

  // Swap bands
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    if (i !== j)
      for (let k = 0; k < 3; k++)
        [grid[i * 3 + k], grid[j * 3 + k]] = [grid[j * 3 + k], grid[i * 3 + k]];
  }

  // Swap stacks
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    if (i !== j)
      for (let r = 0; r < 9; r++)
        for (let k = 0; k < 3; k++)
          [grid[r][i * 3 + k], grid[r][j * 3 + k]] = [grid[r][j * 3 + k], grid[r][i * 3 + k]];
  }

  return grid;
}

export function fallbackSudoku(dateStr: string): SudokuPuzzle {
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed * 2654435761 + 7);
  const solution = permuteSudoku(rng);

  const puzzle = solution.map((r) => [...r]);
  const given: boolean[][] = solution.map(() => Array(9).fill(true));
  const cells = seededShuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
  const toRemove = 45 + Math.floor(rng() * 6);
  for (let k = 0; k < toRemove; k++) {
    const r = Math.floor(cells[k] / 9);
    const c = cells[k] % 9;
    puzzle[r][c] = 0;
    given[r][c] = false;
  }

  return { solution, puzzle, given };
}

// ── Tango: backtracking solver with seeded randomization ──

function generateTangoSolution(rng: () => number): number[][] {
  const SIZE = 6;
  const grid: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  function isValid(r: number, c: number, val: number): boolean {
    let rowCount = 0,
      colCount = 0;
    for (let i = 0; i < SIZE; i++) {
      if (grid[r][i] === val) rowCount++;
      if (grid[i][c] === val) colCount++;
    }
    if (rowCount >= 3 || colCount >= 3) return false;
    if (c >= 2 && grid[r][c - 1] === val && grid[r][c - 2] === val) return false;
    if (r >= 2 && grid[r - 1][c] === val && grid[r - 2][c] === val) return false;
    return true;
  }

  function solve(pos: number): boolean {
    if (pos === SIZE * SIZE) return true;
    const r = Math.floor(pos / SIZE);
    const c = pos % SIZE;
    const first = rng() < 0.5 ? 1 : 2;
    const vals = [first, first === 1 ? 2 : 1];
    for (const v of vals) {
      if (isValid(r, c, v)) {
        grid[r][c] = v;
        if (solve(pos + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  solve(0);
  return grid;
}

export function fallbackTango(dateStr: string): TangoPuzzle {
  const SIZE = 6;
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed * 2654435761 + 99);
  const solution = generateTangoSolution(rng);

  const puzzle = solution.map((r) => [...r]);
  const given = Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
  const cells = seededShuffle(
    Array.from({ length: SIZE * SIZE }, (_, i) => i),
    rng,
  );
  const toRemove = 20 + Math.floor(rng() * 4);
  for (let k = 0; k < toRemove; k++) {
    const r = Math.floor(cells[k] / SIZE);
    const c = cells[k] % SIZE;
    puzzle[r][c] = 0;
    given[r][c] = false;
  }

  return { grid: puzzle, solution, given };
}

// ── Spelling Bee: find pangrams from dictionary, pick by date ──

export function fallbackSpelling(dateStr: string): SpellingPuzzle | null {
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed * 2654435761 + 42);

  const candidates: string[] = [];
  for (const word of DICTIONARY) {
    if (word.length >= 7 && new Set(word).size === 7) {
      candidates.push(word);
    }
  }
  if (candidates.length === 0) return null;

  const shuffled = seededShuffle(candidates, rng);
  for (const word of shuffled.slice(0, 20)) {
    const unique = [...new Set(word)];
    const center = unique[0];
    const outer = unique.slice(1);
    const allLetters = new Set(unique);

    const validWords = DICTIONARY.filter((w) => {
      if (w.length < 4) return false;
      if (!w.includes(center)) return false;
      for (const ch of w) {
        if (!allLetters.has(ch)) return false;
      }
      return true;
    });

    if (validWords.length >= 12) {
      const maxScore = validWords.reduce(
        (sum, w) => sum + scoreSpellingWord(w, allLetters),
        0,
      );
      return { center, outer, validWords, maxScore };
    }
  }

  return null;
}
