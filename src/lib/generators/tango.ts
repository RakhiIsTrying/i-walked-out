import { getDailyRng, seededShuffle } from "@/lib/games";
import { TangoPuzzle } from "./types";

const SIZE = 6;
const SUN = 1;
const MOON = 2;

export function generateTangoSolution(rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  function isValid(row: number, col: number, val: number): boolean {
    if (col >= 2 && grid[row][col - 1] === val && grid[row][col - 2] === val) return false;
    if (row >= 2 && grid[row - 1][col] === val && grid[row - 2][col] === val) return false;
    const rowCount = grid[row].filter((c) => c === val).length;
    if (rowCount >= 3) return false;
    let colCount = 0;
    for (let r = 0; r < SIZE; r++) { if (grid[r][col] === val) colCount++; }
    if (colCount >= 3) return false;
    return true;
  }

  function solve(pos: number): boolean {
    if (pos === SIZE * SIZE) return true;
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    const values = rng() > 0.5 ? [SUN, MOON] : [MOON, SUN];
    for (const val of values) {
      if (isValid(row, col, val)) {
        grid[row][col] = val;
        if (solve(pos + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0);
  return grid;
}

function removeCells(solution: number[][], rng: () => number, shuffle: (cells: number[]) => number[]): TangoPuzzle {
  const puzzle = solution.map((r) => [...r]);
  const given: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
  const cells = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i));
  const toRemove = 20 + Math.floor(rng() * 4);

  for (let k = 0; k < toRemove && k < cells.length; k++) {
    const r = Math.floor(cells[k] / SIZE);
    const c = cells[k] % SIZE;
    puzzle[r][c] = 0;
    given[r][c] = false;
  }

  return { grid: puzzle, solution, given };
}

export function generateTango(): TangoPuzzle {
  const rng = getDailyRng(99);
  const solution = generateTangoSolution(rng);
  return removeCells(solution, rng, (cells) => seededShuffle(cells, rng));
}

export function generateTangoForDay(dayNum: number): TangoPuzzle {
  let seed = (dayNum + 99) * 2654435761;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const solution = generateTangoSolution(rng);
  const puzzle = solution.map((r) => [...r]);
  const given: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
  const cells = Array.from({ length: SIZE * SIZE }, (_, i) => i);

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const toRemove = 20 + Math.floor(rng() * 4);
  for (let k = 0; k < toRemove && k < cells.length; k++) {
    const r = Math.floor(cells[k] / SIZE);
    const c = cells[k] % SIZE;
    puzzle[r][c] = 0;
    given[r][c] = false;
  }

  return { grid: puzzle, solution, given };
}
