import { NextResponse } from "next/server";
import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { getAdmin } from "@/lib/supabase/admin";
import { DICTIONARY, WORDLE_ANSWERS, PANGRAM_SEEDS } from "@/lib/words";
import { getDayNumber, getDailyRng, seededShuffle, seededPick } from "@/lib/games";

/* ──────────────────────────────────────────
   Supabase table (run once in dashboard):

   CREATE TABLE daily_puzzles (
     date DATE PRIMARY KEY,
     puzzles JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "public read" ON daily_puzzles
     FOR SELECT USING (true);
   ────────────────────────────────────────── */

// ── Types ──

interface WordlePuzzle {
  answer: string;
}

interface CrosswordPuzzle {
  size: number;
  grid: (string | null)[][];
  numbers: (number | null)[][];
  acrossClues: { num: number; clue: string }[];
  downClues: { num: number; clue: string }[];
}

interface SpellingPuzzle {
  center: string;
  outer: string[];
  validWords: string[];
  maxScore: number;
}

interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  given: boolean[][];
}

interface DailyPuzzles {
  date: string;
  wordle: WordlePuzzle;
  crossword: CrosswordPuzzle;
  spelling: SpellingPuzzle;
  sudoku: SudokuPuzzle;
}

// ── Wordle ──

async function generateWordle(): Promise<WordlePuzzle> {
  try {
    const ai = getGamesAI();
    const res = await ai.chat.completions.create({
      model: GAMES_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a word puzzle generator. Reply with ONLY the requested word in UPPERCASE. No explanation, no quotes, no punctuation, no extra text.",
        },
        {
          role: "user",
          content:
            "Pick ONE common English 5-letter word for today's Wordle puzzle. It should be well-known and not obscure. Output ONLY the word.",
        },
      ],
      max_tokens: 20,
      temperature: 1.2,
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const word = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (word.length === 5) return { answer: word };
  } catch {}
  const rng = getDailyRng(42);
  return { answer: seededPick(WORDLE_ANSWERS, rng).toUpperCase() };
}

// ── Crossword (15×15 with black squares) ──

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

function numberGrid(rawGrid: (string | null)[][]): {
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

function parseCrosswordGrid(rows: string[]): (string | null)[][] {
  return rows.map((row) =>
    row.split("").map((ch) => (ch === "#" ? null : ch.toUpperCase()))
  );
}

const FALLBACK_CW = {
  grid: [
    "CLAP#SHED",
    "LANGUAGES",
    "AIMLESSLY",
    "#PLEA#ROT",
    "SIDELINED",
    "SON#AGED#",
    "TOLERATED",
    "OTHERWISE",
    "DENY#DYES",
  ],
  acrossClues: [
    "Round of applause", "Small outdoor building",
    "Many tongues",
    "Without purpose or direction",
    "Earnest request", "To decompose",
    "Benched from the game",
    "Male child", "How many years old",
    "Put up with",
    "If not this way, then ...",
    "Refuse to admit", "Colors fabric",
  ],
  downClues: [
    "Possessed (past tense)", "Long journey",
    "Changed direction", "Outer layer",
    "Awaiting judgment", "Guardian figure",
    "Floor cleaning tool", "Protective gear",
    "Spiral forms", "Herb for cooking",
    "Grew older", "Rooftop addition",
    "Proper conduct",
  ],
};

async function generateCrossword(): Promise<CrosswordPuzzle> {
  const SIZE = CW_TEMPLATE.length;
  const template = CW_TEMPLATE.join("\n");

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
      temperature: 0.7,
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

  const rawGrid = parseCrosswordGrid(FALLBACK_CW.grid);
  const { numbers, acrossWords, downWords } = numberGrid(rawGrid);
  return {
    size: rawGrid.length,
    grid: rawGrid,
    numbers,
    acrossClues: acrossWords.map((w, i) => ({ num: w.num, clue: FALLBACK_CW.acrossClues[i] || w.word })),
    downClues: downWords.map((w, i) => ({ num: w.num, clue: FALLBACK_CW.downClues[i] || w.word })),
  };
}

// ── Spelling Bee ──

function scoreSpellingWord(word: string, allLetters: Set<string>): number {
  if (word.length === 4) return 1;
  let score = word.length;
  const unique = new Set(word);
  if (
    allLetters.size === unique.size &&
    [...allLetters].every((l) => unique.has(l))
  ) {
    score += 7;
  }
  return score;
}

function buildSpellingResult(
  center: string,
  outer: string[],
): SpellingPuzzle | null {
  const allLetters = new Set([center, ...outer]);
  if (allLetters.size !== 7) return null;

  const validWords = DICTIONARY.filter((word) => {
    if (word.length < 4) return false;
    if (!word.includes(center)) return false;
    for (const ch of word) {
      if (!allLetters.has(ch)) return false;
    }
    return true;
  });

  if (validWords.length < 12) return null;

  const maxScore = validWords.reduce(
    (sum, w) => sum + scoreSpellingWord(w, allLetters),
    0,
  );

  return { center, outer, validWords, maxScore };
}

async function generateSpellingBee(): Promise<SpellingPuzzle> {
  try {
    const ai = getGamesAI();

    const lettersRes = await ai.chat.completions.create({
      model: GAMES_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You generate Spelling Bee puzzles. Reply with ONLY valid JSON. No markdown, no explanation.",
        },
        {
          role: "user",
          content: `Generate a Spelling Bee puzzle. Choose 7 UNIQUE lowercase letters. One is the "center" letter that MUST appear in every valid word. Pick letters that allow MANY common 4+ letter English words. Include at least 2 vowels.

Return ONLY: {"center":"x","outer":["a","b","c","d","e","f"]}`,
        },
      ],
      max_tokens: 100,
      temperature: 1.2,
    });

    let text = lettersRes.choices[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(text);

    const center = parsed.center?.toLowerCase();
    const outer: string[] = parsed.outer?.map((l: string) => l.toLowerCase());
    if (!center || !outer || outer.length !== 6) throw new Error("bad data");

    const allLetters = new Set([center, ...outer]);
    if (allLetters.size !== 7) throw new Error("duplicate letters");

    const wordsRes = await ai.chat.completions.create({
      model: GAMES_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a word list generator. Return ONLY a JSON array of words. No markdown fences, no explanation.",
        },
        {
          role: "user",
          content: `List ALL common English words (4+ letters) that can be made using ONLY these letters: ${[...allLetters].join(", ")}. Each letter can be used multiple times. Every word MUST contain the letter "${center}". Only include real, common English dictionary words — no proper nouns, abbreviations, or slang. Return as JSON array: ["word1","word2",...]`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    let wordsText = wordsRes.choices[0]?.message?.content?.trim() ?? "";
    wordsText = wordsText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const aiWords: string[] = JSON.parse(wordsText);

    const dictWords = DICTIONARY.filter((word) => {
      if (word.length < 4) return false;
      if (!word.includes(center)) return false;
      for (const ch of word) {
        if (!allLetters.has(ch)) return false;
      }
      return true;
    });

    const validSet = new Set<string>();
    for (const w of aiWords) {
      const word = w.toLowerCase();
      if (word.length < 4) continue;
      if (!word.includes(center)) continue;
      let ok = true;
      for (const ch of word) {
        if (!allLetters.has(ch)) { ok = false; break; }
      }
      if (ok) validSet.add(word);
    }
    for (const w of dictWords) validSet.add(w);

    const validWords = [...validSet].sort();
    if (validWords.length < 12) throw new Error("too few words");

    const maxScore = validWords.reduce(
      (sum, w) => sum + scoreSpellingWord(w, allLetters),
      0,
    );

    return { center, outer, validWords, maxScore };
  } catch {}

  const rng = getDailyRng(77);
  const seed = seededPick(PANGRAM_SEEDS, rng);
  const outer = seed.letters.filter((l) => l !== seed.center);
  return buildSpellingResult(seed.center, outer)!;
}

// ── Sudoku (algorithmic) ──

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

function generateSudoku(): SudokuPuzzle {
  const rng = getDailyRng(7);
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

// ── Main handler ──

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  // Try Supabase cache
  try {
    const { data } = await getAdmin()
      .from("daily_puzzles")
      .select("puzzles")
      .eq("date", today)
      .single();
    if (data?.puzzles) {
      return NextResponse.json(data.puzzles, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }
  } catch {}

  // Generate fresh
  const [wordle, crossword, spelling] = await Promise.all([
    generateWordle(),
    generateCrossword(),
    generateSpellingBee(),
  ]);
  const sudoku = generateSudoku();

  const puzzles: DailyPuzzles = { date: today, wordle, crossword, spelling, sudoku };

  // Cache in Supabase
  try {
    await getAdmin().from("daily_puzzles").upsert({ date: today, puzzles });
  } catch {}

  return NextResponse.json(puzzles, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
