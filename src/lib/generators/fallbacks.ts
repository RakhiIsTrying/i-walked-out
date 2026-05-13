import { WordlePuzzle, SudokuPuzzle, TangoPuzzle, SpellingPuzzle, CrosswordPuzzle } from "./types";
import { WORDLE_ANSWERS, DICTIONARY } from "@/lib/words";
import { scoreSpellingWord } from "./spelling";
import { parseCrosswordGrid, numberGrid } from "./crossword";

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

export function fallbackWordle(dateStr: string, recentWords?: Set<string>): WordlePuzzle {
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed * 2654435761);
  const shuffled = seededShuffle([...WORDLE_ANSWERS], rng);
  for (const word of shuffled) {
    const upper = word.toUpperCase();
    if (!recentWords || !recentWords.has(upper)) {
      return { answer: upper };
    }
  }
  return { answer: shuffled[0].toUpperCase() };
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

// ── Crossword: deterministic 5×5 mini via backtracking ──

let _cwWords4: string[] | null = null;
let _cwWords5: string[] | null = null;
let _cwPrefixes4: Set<string> | null = null;
let _cwPrefixes5: Set<string> | null = null;
let _cwSet4: Set<string> | null = null;
let _cwSet5: Set<string> | null = null;

function getCWData() {
  if (_cwWords4) return { w4: _cwWords4, w5: _cwWords5!, p4: _cwPrefixes4!, p5: _cwPrefixes5!, s4: _cwSet4!, s5: _cwSet5! };

  const all5 = [...new Set([...DICTIONARY.filter(w => w.length === 5), ...WORDLE_ANSWERS].map(w => w.toUpperCase()))];
  const all4 = [...new Set(DICTIONARY.filter(w => w.length === 4).map(w => w.toUpperCase()))];

  _cwWords4 = all4;
  _cwWords5 = all5;
  _cwSet4 = new Set(all4);
  _cwSet5 = new Set(all5);

  _cwPrefixes4 = new Set<string>();
  for (const w of all4) for (let i = 1; i <= 4; i++) _cwPrefixes4.add(w.slice(0, i));

  _cwPrefixes5 = new Set<string>();
  for (const w of all5) for (let i = 1; i <= 5; i++) _cwPrefixes5.add(w.slice(0, i));

  return { w4: _cwWords4, w5: _cwWords5, p4: _cwPrefixes4, p5: _cwPrefixes5, s4: _cwSet4, s5: _cwSet5 };
}

export function fallbackCrossword(dateStr: string): CrosswordPuzzle | null {
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed * 2654435761 + 137);
  const { w4, w5, p4, p5, s4, s5 } = getCWData();

  const sh4 = seededShuffle([...w4], rng);
  const sh5 = seededShuffle([...w5], rng);

  // Template: #.... / ..... / ..... / ..... / ....#
  const grid: string[] = ["", "", "", "", ""];

  function colPrefix(col: number, upToRow: number): string {
    const start = col === 0 ? 1 : 0;
    let s = "";
    for (let r = start; r <= upToRow; r++) s += grid[r][col];
    return s;
  }

  function validNext(col: number, row: number): Set<string> | null {
    const prefix = row > 0 ? colPrefix(col, row - 1) : (col === 0 ? "" : "");
    const len = (col === 0 || col === 4) ? 4 : 5;
    if (prefix.length >= len) return null;
    const pSet = len === 4 ? p4 : p5;
    const wSet = len === 4 ? s4 : s5;
    const valid = new Set<string>();
    for (let ch = 65; ch <= 90; ch++) {
      const letter = String.fromCharCode(ch);
      const ext = prefix + letter;
      if (ext.length === len ? wSet.has(ext) : pSet.has(ext)) valid.add(letter);
    }
    return valid;
  }

  function fillRow(ri: number): boolean {
    const first = ri === 0, last = ri === 4;
    const words = (first || last) ? sh4 : sh5;
    const sc = first ? 1 : 0;
    const ec = last ? 3 : 4;
    const wl = ec - sc + 1;

    const constraints: (Set<string> | null)[] = [];
    for (let c = sc; c <= ec; c++) constraints.push(validNext(c, ri));

    for (const word of words) {
      if (word.length !== wl) continue;
      let ok = true;
      for (let i = 0; i < wl; i++) {
        const cs = constraints[i];
        if (cs && !cs.has(word[i])) { ok = false; break; }
      }
      if (!ok) continue;

      grid[ri] = first ? "#" + word : last ? word + "#" : word;
      if (ri === 4) return true;
      if (fillRow(ri + 1)) return true;
    }
    grid[ri] = "";
    return false;
  }

  if (!fillRow(0)) return null;

  const rawGrid = parseCrosswordGrid(grid);
  const { numbers, acrossWords, downWords } = numberGrid(rawGrid);

  return {
    size: 5,
    grid: rawGrid,
    numbers,
    acrossClues: acrossWords.map(w => ({ num: w.num, clue: `${w.word.length}-letter word` })),
    downClues: downWords.map(w => ({ num: w.num, clue: `${w.word.length}-letter word` })),
    theme: "Daily Mini",
  };
}
