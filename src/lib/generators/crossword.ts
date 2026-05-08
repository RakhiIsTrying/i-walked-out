import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { getDayNumber } from "@/lib/games";
import { CROSSWORD_FALLBACKS } from "@/lib/crossword-fallbacks";
import { CrosswordPuzzle, CrosswordVariant } from "./types";

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

const MINI_TEMPLATE = [
  ".....",
  ".....",
  ".....",
  ".....",
  ".....",
];

const MIDI_TEMPLATE = [
  "...#...",
  ".......",
  ".......",
  "#.....#",
  ".......",
  ".......",
  "...#...",
];

const DAILY_THEMES = [
  "Animals & Pets", "Food & Cooking", "Travel & Places", "Music & Sound",
  "Science & Nature", "Sports & Fitness", "Movies & TV", "Technology",
  "Weather & Seasons", "History & Legends", "Fashion & Style", "Space & Astronomy",
  "Ocean & Marine Life", "Books & Writing", "Art & Colors", "Health & Body",
  "Cities & Landmarks", "Mythology & Folklore", "Holidays & Celebrations", "Time & Memory",
  "Tools & Building", "Language & Words", "Gardens & Flowers", "Mountains & Earth",
  "Dance & Rhythm", "Dreams & Imagination", "Magic & Mystery", "Birds & Wings",
  "Rivers & Water", "School & Learning",
];

export function getDailyTheme(dayNum?: number): string {
  const d = dayNum ?? getDayNumber();
  return DAILY_THEMES[d % DAILY_THEMES.length];
}

const VARIANT_CONFIG: Record<CrosswordVariant, { template: string[]; maxTokens: number }> = {
  mini: { template: MINI_TEMPLATE, maxTokens: 1500 },
  midi: { template: MIDI_TEMPLATE, maxTokens: 2500 },
  normal: { template: CW_TEMPLATE, maxTokens: 5000 },
};

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

const MINI_FALLBACK = {
  grid: ["HEART", "EMBER", "ABUSE", "RESIN", "TREND"],
  acrossClues: [
    "Organ that pumps blood",
    "Glowing remains of a fire",
    "To misuse or maltreat",
    "Sticky substance from trees",
    "General direction of change",
  ],
  downClues: [
    "Core of one's feelings",
    "Still-hot coal after flames die",
    "Cruel or violent treatment",
    "Used to make varnish",
    "What's currently popular",
  ],
};

export function buildMiniFromFallback(): CrosswordPuzzle {
  const rawGrid = parseCrosswordGrid(MINI_FALLBACK.grid);
  const { numbers, acrossWords, downWords } = numberGrid(rawGrid);
  return {
    size: 5,
    grid: rawGrid,
    numbers,
    acrossClues: acrossWords.map((w, i) => ({ num: w.num, clue: MINI_FALLBACK.acrossClues[i] || w.word })),
    downClues: downWords.map((w, i) => ({ num: w.num, clue: MINI_FALLBACK.downClues[i] || w.word })),
  };
}

function buildPrompt(variant: CrosswordVariant, template: string, size: number, theme: string): string {
  if (variant === "mini") {
    return `Create a 5×5 word square where every row (left to right) and every column (top to bottom) forms a valid common English word. Theme: "${theme}" — relate words to this theme where possible, but prioritize valid words.

Return ONLY this JSON (no markdown):
{"grid":["row1","row2","row3","row4","row5"],"acrossClues":["clue for row 1","clue for row 2","clue for row 3","clue for row 4","clue for row 5"],"downClues":["clue for col 1","clue for col 2","clue for col 3","clue for col 4","clue for col 5"]}

Each row must be exactly 5 letters. 10 clues total (5 across + 5 down).`;
  }

  return `Fill this ${size}×${size} crossword grid template. Replace each "." with a letter. Keep all "#" as black squares. Every horizontal and vertical run of letters (between black squares or edges) must be a common English word (minimum 3 letters). Theme: "${theme}" — words and clues should relate to this theme.

Template:
${template}

Return ONLY this JSON:
{"grid":["row1","row2",...],"acrossClues":["clue for each across word in reading order"],"downClues":["clue for each down word in left-to-right, top-to-bottom order"]}

Each grid row must be exactly ${size} characters. Provide one clue per word in order.`;
}

export async function generateCrosswordVariant(
  variant: CrosswordVariant,
  theme: string,
): Promise<CrosswordPuzzle> {
  const { template, maxTokens } = VARIANT_CONFIG[variant];
  const size = template.length;
  const templateStr = template.join("\n");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ai = getGamesAI();
      const res = await ai.chat.completions.create({
        model: GAMES_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a crossword puzzle constructor. Reply with ONLY valid JSON. No markdown fences, no explanation.",
          },
          {
            role: "user",
            content: buildPrompt(variant, templateStr, size, theme),
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7 + attempt * 0.2,
      });

      let text = res.choices[0]?.message?.content?.trim() ?? "";
      text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed.grid) || parsed.grid.length !== size) throw new Error("bad grid");

      const rows: string[] = parsed.grid.map((r: string) => r.toUpperCase());
      for (let i = 0; i < size; i++) {
        if (rows[i].length !== size) throw new Error("bad row length");
        for (let j = 0; j < size; j++) {
          const expected = template[i][j];
          if (expected === "#" && rows[i][j] !== "#") throw new Error("black square mismatch");
          if (expected === "." && !/[A-Z]/.test(rows[i][j])) throw new Error("empty cell");
        }
      }

      const rawGrid = parseCrosswordGrid(rows);
      const { numbers, acrossWords, downWords } = numberGrid(rawGrid);

      const ac = parsed.acrossClues ?? parsed.across_clues ?? [];
      const dc = parsed.downClues ?? parsed.down_clues ?? [];

      return {
        size,
        grid: rawGrid,
        numbers,
        acrossClues: acrossWords.map((w, i) => ({ num: w.num, clue: ac[i] || w.word })),
        downClues: downWords.map((w, i) => ({ num: w.num, clue: dc[i] || w.word })),
        theme,
      };
    } catch {}
  }

  if (variant === "mini") return { ...buildMiniFromFallback(), theme };
  if (variant === "midi") return { ...buildMiniFromFallback(), theme };
  return { ...buildCrosswordFromFallback(getDayNumber()), theme };
}

export async function generateCrossword(): Promise<CrosswordPuzzle> {
  const theme = getDailyTheme();
  return generateCrosswordVariant("normal", theme);
}
