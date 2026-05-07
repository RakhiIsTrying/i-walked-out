import { getDailyRng, seededShuffle } from "@/lib/games";
import { SudokuPuzzle } from "./types";

const BASE_GRID = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

function buildSudoku(rng: () => number): SudokuPuzzle {
  const perm = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  let grid = BASE_GRID.map((row) => row.map((v) => perm[v - 1]));

  for (let band = 0; band < 3; band++) {
    const rows = [band * 3, band * 3 + 1, band * 3 + 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [grid[rows[i]], grid[rows[j]]] = [grid[rows[j]], grid[rows[i]]];
    }
  }

  const transposed = grid[0].map((_, c) => grid.map((r) => r[c]));
  for (let stack = 0; stack < 3; stack++) {
    const cols = [stack * 3, stack * 3 + 1, stack * 3 + 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [transposed[cols[i]], transposed[cols[j]]] = [
        transposed[cols[j]],
        transposed[cols[i]],
      ];
    }
  }
  grid = transposed[0].map((_, c) => transposed.map((r) => r[c]));

  const solution = grid.map((r) => [...r]);
  const given: boolean[][] = grid.map(() => Array(9).fill(true));
  const cells = Array.from({ length: 81 }, (_, i) => i);
  const shuffled = seededShuffle(cells, rng);
  const toRemove = 45 + Math.floor(rng() * 6);

  for (let k = 0; k < toRemove && k < shuffled.length; k++) {
    const r = Math.floor(shuffled[k] / 9);
    const c = shuffled[k] % 9;
    grid[r][c] = 0;
    given[r][c] = false;
  }

  return { solution, puzzle: grid, given };
}

export function generateSudoku(): SudokuPuzzle {
  const rng = getDailyRng(7);
  return buildSudoku(rng);
}

export function generateSudokuForDay(dayNum: number): SudokuPuzzle {
  let seed = (dayNum + 7) * 2654435761;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return buildSudoku(rng);
}
