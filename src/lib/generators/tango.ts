import { TangoPuzzle } from "./types";
import { getDailyRng, seededShuffle } from "@/lib/games";
import { extractJSON, cleanAIResponse, aiCall } from "./ai-utils";

const SIZE = 6;

function isValidTango(grid: number[][]): boolean {
  if (grid.length !== SIZE) return false;
  for (let r = 0; r < SIZE; r++) {
    if (grid[r].length !== SIZE) return false;
    let suns = 0, moons = 0;
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== 1 && grid[r][c] !== 2) return false;
      if (grid[r][c] === 1) suns++;
      else moons++;
      if (c >= 2 && grid[r][c] === grid[r][c - 1] && grid[r][c] === grid[r][c - 2]) return false;
    }
    if (suns !== 3 || moons !== 3) return false;
  }
  for (let c = 0; c < SIZE; c++) {
    let suns = 0, moons = 0;
    for (let r = 0; r < SIZE; r++) {
      if (grid[r][c] === 1) suns++;
      else moons++;
      if (r >= 2 && grid[r][c] === grid[r - 1][c] && grid[r][c] === grid[r - 2][c]) return false;
    }
    if (suns !== 3 || moons !== 3) return false;
  }
  return true;
}

async function aiGenerateTango(dateLabel?: string): Promise<number[][]> {
  const dateHint = dateLabel ? ` This is for ${dateLabel} — generate a UNIQUE grid different from any other day.` : "";
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await aiCall([
        {
          role: "system",
          content: "You are a logic puzzle generator. Reply with ONLY valid JSON. No markdown fences, no explanation.",
        },
        {
          role: "user",
          content: `Generate a valid 6x6 Tango puzzle solution grid.${dateHint} Rules:
- Each cell is either 1 (sun) or 2 (moon)
- Each row must have exactly 3 suns and 3 moons
- Each column must have exactly 3 suns and 3 moons
- No three consecutive cells in a row or column can be the same value

Return ONLY this JSON (no markdown fences):
{"grid":[[1,2,1,2,1,2],[2,1,2,1,2,1],[1,2,1,2,1,2],[2,1,2,1,2,1],[1,2,1,2,1,2],[2,1,2,1,2,1]]}

Replace the example values with a valid solution. Each row must have exactly 6 values. 6 rows total.`,
        },
      ], 300, 0.8 + retry * 0.3);

      const text = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "");
      const parsed = extractJSON(text);

      if (!Array.isArray(parsed.grid) || parsed.grid.length !== SIZE) throw new Error("bad grid size");
      const grid: number[][] = parsed.grid.map((row: number[]) =>
        row.map((v: number) => (v === 2 ? 2 : 1))
      );

      if (isValidTango(grid)) return grid;
      console.error("[tango] AI grid failed validation, retrying");
    } catch (e) {
      console.error("[tango] attempt failed:", e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error("Failed to generate valid tango after retries");
}

function removeCells(solution: number[][], rng: () => number): TangoPuzzle {
  const puzzle = solution.map((r) => [...r]);
  const given: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
  const cells = seededShuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i), rng);
  const toRemove = 20 + Math.floor(rng() * 4);

  for (let k = 0; k < toRemove && k < cells.length; k++) {
    const r = Math.floor(cells[k] / SIZE);
    const c = cells[k] % SIZE;
    puzzle[r][c] = 0;
    given[r][c] = false;
  }

  return { grid: puzzle, solution, given };
}

export async function generateTango(dateLabel?: string): Promise<TangoPuzzle> {
  const solution = await aiGenerateTango(dateLabel);
  const rng = getDailyRng(99);
  return removeCells(solution, rng);
}

export async function generateTangoForDay(dayNum: number): Promise<TangoPuzzle> {
  const solution = await aiGenerateTango();
  let seed = (dayNum + 99) * 2654435761;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return removeCells(solution, rng);
}
