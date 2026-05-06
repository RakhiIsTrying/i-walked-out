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
  grid: string[][];
  acrossClues: string[];
  downClues: string[];
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

// ── Crossword (5×5 word square) ──

const FALLBACK_SQUARES: { grid: string[]; acrossClues: string[]; downClues: string[] }[] = [
  {
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
  },
];

async function generateCrossword(): Promise<CrosswordPuzzle> {
  try {
    const ai = getGamesAI();
    const res = await ai.chat.completions.create({
      model: GAMES_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You generate crossword puzzles. Reply with ONLY valid JSON. No markdown fences, no explanation.",
        },
        {
          role: "user",
          content: `Create a 5×5 crossword word square. Fill a 5-row, 5-column grid so that EVERY row (left→right) AND EVERY column (top→bottom) is a common English word. That's 10 words total, all 5 letters.

Return ONLY this JSON:
{"grid":["XXXXX","XXXXX","XXXXX","XXXXX","XXXXX"],"acrossClues":["c1","c2","c3","c4","c5"],"downClues":["c1","c2","c3","c4","c5"]}

CRITICAL: Column N is formed by taking the Nth letter of each row. For example column 0 = row0[0]+row1[0]+row2[0]+row3[0]+row4[0]. ALL columns must be real words. Double-check each column before answering.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    let text = res.choices[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed.grid) || parsed.grid.length !== 5) throw new Error("bad grid");

    const rows: string[] = parsed.grid.map((r: string) => r.toUpperCase());
    for (const r of rows) {
      if (!/^[A-Z]{5}$/.test(r)) throw new Error("bad row");
    }

    const grid = rows.map((r) => r.split(""));
    const down: string[] = [];
    for (let c = 0; c < 5; c++) {
      down.push(grid.map((row) => row[c]).join(""));
    }
    for (const w of down) {
      if (!/^[A-Z]{5}$/.test(w)) throw new Error("bad col word");
    }

    return {
      size: 5,
      grid,
      acrossClues: (parsed.acrossClues ?? parsed.across_clues ?? []).slice(0, 5),
      downClues: (parsed.downClues ?? parsed.down_clues ?? []).slice(0, 5),
    };
  } catch {}

  const rng = getDailyRng(99);
  const fb = FALLBACK_SQUARES[Math.floor(rng() * FALLBACK_SQUARES.length)];
  return {
    size: 5,
    grid: fb.grid.map((r) => r.split("")),
    acrossClues: fb.acrossClues,
    downClues: fb.downClues,
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

  if (validWords.length < 5) return null;

  const maxScore = validWords.reduce(
    (sum, w) => sum + scoreSpellingWord(w, allLetters),
    0,
  );

  return { center, outer, validWords, maxScore };
}

async function generateSpellingBee(): Promise<SpellingPuzzle> {
  try {
    const ai = getGamesAI();
    const res = await ai.chat.completions.create({
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

    let text = res.choices[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(text);

    const center = parsed.center?.toLowerCase();
    const outer: string[] = parsed.outer?.map((l: string) => l.toLowerCase());
    if (!center || !outer || outer.length !== 6) throw new Error("bad data");

    const result = buildSpellingResult(center, outer);
    if (result) return result;
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
