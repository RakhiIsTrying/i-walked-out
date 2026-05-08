import { SudokuPuzzle } from "./types";
import { getDailyRng, seededShuffle } from "@/lib/games";
import { extractJSON, cleanAIResponse, aiCall } from "./ai-utils";

function isValidSudoku(grid: number[][]): boolean {
  if (grid.length !== 9) return false;
  for (let r = 0; r < 9; r++) {
    if (grid[r].length !== 9) return false;
    const rowSet = new Set<number>();
    const colSet = new Set<number>();
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] < 1 || grid[r][c] > 9) return false;
      rowSet.add(grid[r][c]);
      colSet.add(grid[c][r]);
    }
    if (rowSet.size !== 9 || colSet.size !== 9) return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const boxSet = new Set<number>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          boxSet.add(grid[r][c]);
        }
      }
      if (boxSet.size !== 9) return false;
    }
  }
  return true;
}

async function aiGenerateSudoku(): Promise<number[][]> {
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await aiCall([
        {
          role: "system",
          content: "You are a Sudoku puzzle generator. Reply with ONLY valid JSON. No markdown fences, no explanation.",
        },
        {
          role: "user",
          content: `Generate a complete, valid 9x9 Sudoku solution. Every row, column, and 3x3 box must contain the digits 1-9 exactly once.

Return ONLY this JSON (no markdown fences):
{"grid":[[r1c1,r1c2,...,r1c9],[r2c1,...,r2c9],...,[r9c1,...,r9c9]]}

Each row must have exactly 9 digits. 9 rows total.`,
        },
      ], 500, 0.8 + retry * 0.2);

      const text = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "");
      const parsed = extractJSON(text);

      if (!Array.isArray(parsed.grid) || parsed.grid.length !== 9) throw new Error("bad grid size");
      const grid: number[][] = parsed.grid.map((row: number[]) =>
        row.map((v: number) => Math.max(1, Math.min(9, Math.round(Number(v)))))
      );

      if (isValidSudoku(grid)) return grid;
      console.error("[sudoku] AI grid failed validation, retrying");
    } catch (e) {
      console.error("[sudoku] attempt failed:", e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error("Failed to generate valid sudoku after retries");
}

function removeCells(solution: number[][], rng: () => number): SudokuPuzzle {
  const puzzle = solution.map((r) => [...r]);
  const given: boolean[][] = solution.map(() => Array(9).fill(true));
  const cells = seededShuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  const toRemove = 45 + Math.floor(rng() * 6);

  for (let k = 0; k < toRemove && k < cells.length; k++) {
    const r = Math.floor(cells[k] / 9);
    const c = cells[k] % 9;
    puzzle[r][c] = 0;
    given[r][c] = false;
  }

  return { solution, puzzle, given };
}

export async function generateSudoku(): Promise<SudokuPuzzle> {
  const solution = await aiGenerateSudoku();
  const rng = getDailyRng(7);
  return removeCells(solution, rng);
}

export async function generateSudokuForDay(dayNum: number): Promise<SudokuPuzzle> {
  const solution = await aiGenerateSudoku();
  let seed = (dayNum + 7) * 2654435761;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return removeCells(solution, rng);
}
