import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { getDayNumber } from "@/lib/games";
import { CROSSWORD_FALLBACKS } from "@/lib/crossword-fallbacks";
import { CrosswordPuzzle } from "./types";

const CW_TEMPLATE = [
  "....#.....#....",
  "....#.....#....",
  "....#.....#....",
  ".....#...#.....",
  "##...#...#...##",
  ".....#...#.....",
  "...#.......#...",
  "...#.......#...",
  "...#.......#...",
  ".....#...#.....",
  "##...#...#...##",
  ".....#...#.....",
  "....#.....#....",
  "....#.....#....",
  "....#.....#....",
];

export function numberGrid(rawGrid: (string | null)[][]): {
  numbers: (number | null)[][];
  acrossWords: { num: number; row: number; col: number; len: number; word: string }[];
  downWords: { num: number; row: number; col: number; len: number; word: string }[];
} {
  const size = rawGrid.length;
  const numbers: (number | null)[][] = rawGrid.map((r) => r.map(() => null));
  const acrossWords: { num: number; row: number; col: number; len: number; word: string }[] = [];
  const downWords: { num: number; row: number; col: number; len: number; word: string }[] = [];
  let num = 1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (rawGrid[r][c] === null) continue;
      const startsAcross =
        (c === 0 || rawGrid[r][c - 1] === null) &&
        c + 1 < size && rawGrid[r][c + 1] !== null;
      const startsDown =
        (r === 0 || rawGrid[r - 1][c] === null) &&
        r + 1 < size && rawGrid[r + 1][c] !== null;

      if (startsAcross || startsDown) {
        numbers[r][c] = num;
        if (startsAcross) {
          let len = 0;
          let word = "";
          for (let cc = c; cc < size && rawGrid[r][cc] !== null; cc++) {
            word += rawGrid[r][cc];
            len++;
          }
          acrossWords.push({ num, row: r, col: c, len, word });
        }
        if (startsDown) {
          let len = 0;
          let word = "";
          for (let rr = r; rr < size && rawGrid[rr][c] !== null; rr++) {
            word += rawGrid[rr][c];
            len++;
          }
          downWords.push({ num, row: r, col: c, len, word });
        }
        num++;
      }
    }
  }
  return { numbers, acrossWords, downWords };
}

export function parseCrosswordGrid(rows: string[]): (string | null)[][] {
  return rows.map((row) =>
    row.split("").map((ch) => (ch === "#" ? null : ch.toUpperCase()))
  );
}

export function buildCrosswordFromFallback(dayNum: number): CrosswordPuzzle {
  const fb = CROSSWORD_FALLBACKS[dayNum % CROSSWORD_FALLBACKS.length];
  const rawGrid = parseCrosswordGrid(fb.grid);
  const { numbers, acrossWords, downWords } = numberGrid(rawGrid);
  return {
    size: rawGrid.length,
    grid: rawGrid,
    numbers,
    acrossClues: acrossWords.map((w, i) => ({ num: w.num, clue: fb.acrossClues[i] || w.word })),
    downClues: downWords.map((w, i) => ({ num: w.num, clue: fb.downClues[i] || w.word })),
  };
}

export async function generateCrossword(): Promise<CrosswordPuzzle> {
  const SIZE = CW_TEMPLATE.length;
  const template = CW_TEMPLATE.join("\n");
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const ai = getGamesAI();
      const res = await ai.chat.completions.create({
        model: GAMES_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a crossword puzzle constructor. Reply with ONLY valid JSON. No markdown fences, no explanation.",
          },
          {
            role: "user",
            content: `Fill this ${SIZE}×${SIZE} crossword grid template. Replace each "." with a letter. Keep all "#" as black squares. Every horizontal and vertical run of letters (between black squares or edges) must be a common English word (minimum 3 letters).

Template:
${template}

Return ONLY this JSON:
{"grid":["row1","row2",...],"acrossClues":["clue for each across word in reading order"],"downClues":["clue for each down word in left-to-right, top-to-bottom order"]}

Each grid row must be exactly ${SIZE} characters. Provide one clue per word in order.`,
          },
        ],
        max_tokens: 5000,
        temperature: 0.7 + attempt * 0.2,
      });

      let text = res.choices[0]?.message?.content?.trim() ?? "";
      text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed.grid) || parsed.grid.length !== SIZE) throw new Error("bad grid");

      const rows: string[] = parsed.grid.map((r: string) => r.toUpperCase());
      for (let i = 0; i < SIZE; i++) {
        if (rows[i].length !== SIZE) throw new Error("bad row length");
        for (let j = 0; j < SIZE; j++) {
          const expected = CW_TEMPLATE[i][j];
          if (expected === "#" && rows[i][j] !== "#") throw new Error("black square mismatch");
          if (expected === "." && !/[A-Z]/.test(rows[i][j])) throw new Error("empty cell");
        }
      }

      const rawGrid = parseCrosswordGrid(rows);
      const { numbers, acrossWords, downWords } = numberGrid(rawGrid);

      const ac = parsed.acrossClues ?? parsed.across_clues ?? [];
      const dc = parsed.downClues ?? parsed.down_clues ?? [];

      return {
        size: SIZE,
        grid: rawGrid,
        numbers,
        acrossClues: acrossWords.map((w, i) => ({ num: w.num, clue: ac[i] || w.word })),
        downClues: downWords.map((w, i) => ({ num: w.num, clue: dc[i] || w.word })),
      };
    } catch {}
  }

  return buildCrosswordFromFallback(getDayNumber());
}
