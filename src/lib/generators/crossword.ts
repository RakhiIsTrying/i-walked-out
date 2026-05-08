import { CrosswordPuzzle, CrosswordVariant } from "./types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { extractJSON, cleanAIResponse, aiCall } from "./ai-utils";

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

const MINI_TEMPLATE = ["#....", ".....", ".....", ".....", "....#"];
const MIDI_TEMPLATE = ["#.....", "......", "......", "......", "......", ".....#"];

const VARIANT_CONFIG: Record<CrosswordVariant, { template: string[]; maxTokens: number }> = {
  mini: { template: MINI_TEMPLATE, maxTokens: 800 },
  midi: { template: MIDI_TEMPLATE, maxTokens: 1000 },
  normal: { template: CW_TEMPLATE, maxTokens: 4000 },
};

export async function generateDailyTheme(dateStr?: string): Promise<string> {
  const dateLabel = dateStr
    ? new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const res = await aiCall([
    {
      role: "system",
      content: "Reply with ONLY a short crossword theme. No quotes, no explanation. 2-4 words max.",
    },
    {
      role: "user",
      content: `Generate a creative, specific crossword puzzle theme for ${dateLabel}. Be inventive — don't just say "Food" or "Animals." Think of things like "Midnight Snacks", "Forgotten Inventions", "Carnival Rides", "Underwater Caves", "90s Nostalgia", "Kitchen Disasters", "Secret Passages". Make it fun and specific.`,
    },
  ], 30, 1.1);
  const theme = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "")
    .replace(/^["']|["']$/g, "");
  if (theme && theme.length > 1 && theme.length < 40) return theme;
  throw new Error("AI failed to generate a valid theme");
}

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

function buildGridPrompt(variant: CrosswordVariant, templateStr: string, size: number, theme: string): string {
  if (variant === "mini") {
    return `Create a 5×5 crossword grid. Black squares (#) are at the positions shown. Fill every "." with an uppercase letter so that every horizontal and vertical run of consecutive letters forms a valid, common English word (minimum 3 letters).

Theme: "${theme}" — use themed words where possible.

Template:
${templateStr}

IMPORTANT: Verify that EVERY word across AND down is a real English word before responding.

Return ONLY this JSON (no markdown): {"grid":["#ABCD","EFGHI","JKLMN","OPQRS","TUVW#"]}
Keep # at exact template positions. Use only uppercase A-Z for letter cells.`;
  }

  if (variant === "midi") {
    return `Create a 6×6 crossword grid. Black squares (#) are at the positions shown. Fill every "." with an uppercase letter so that every horizontal and vertical run of consecutive letters forms a valid, common English word (minimum 3 letters).

Theme: "${theme}" — use themed words where possible.

Template:
${templateStr}

IMPORTANT: Verify that EVERY word across AND down is a real English word before responding.

Return ONLY this JSON (no markdown): {"grid":["#ABCDE","FGHIJK","LMNOPQ","RSTUV0","WXYZ12","34567#"]}
Keep # at exact template positions. Use only uppercase A-Z for letter cells.`;
  }

  return `Fill this ${size}×${size} crossword grid. Replace each "." with an uppercase letter. Keep all "#" as black squares at the exact positions shown. Every horizontal and vertical run of consecutive letters must be a valid, common English word (minimum 3 letters).

Theme: "${theme}" — words should relate to the theme.

Template:
${templateStr}

IMPORTANT: Verify every word across and down. Each must be a real English word.

Return ONLY this JSON (no markdown): {"grid":["row1","row2",...,"row${size}"]}
Each row must be exactly ${size} characters.`;
}

function validateAndFixGrid(parsed: { grid: string[] }, template: string[], size: number): string[] {
  const rows: string[] = parsed.grid.map((r: string) => {
    let s = r.toUpperCase().replace(/[^A-Z#]/g, "");
    if (s.length > size) s = s.slice(0, size);
    while (s.length < size) s += "X";
    return s;
  });
  for (let i = 0; i < size; i++) {
    const chars = rows[i].split("");
    for (let j = 0; j < size; j++) {
      if (template[i][j] === "#") {
        chars[j] = "#";
      } else if (!/[A-Z]/.test(chars[j])) {
        chars[j] = "A";
      }
    }
    rows[i] = chars.join("");
  }
  return rows;
}

function validateWords(
  acrossWords: { word: string }[],
  downWords: { word: string }[],
): boolean {
  for (const { word } of [...acrossWords, ...downWords]) {
    if (word.length < 3) return false;
    if (/^(.)\1+$/.test(word)) return false;
    if (!/^[A-Z]+$/.test(word)) return false;
  }
  return true;
}

async function generateClues(
  acrossWords: { num: number; word: string }[],
  downWords: { num: number; word: string }[],
  theme: string,
): Promise<{ across: Record<string, string>; down: Record<string, string> }> {
  const lines = [
    ...acrossWords.map((w) => `${w.num}-Across: ${w.word}`),
    ...downWords.map((w) => `${w.num}-Down: ${w.word}`),
  ].join("\n");

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You write concise crossword clues. Reply with ONLY valid JSON. No markdown fences.",
    },
    {
      role: "user",
      content: `Write a short crossword clue for each word. Theme: "${theme}". Each clue must be under 10 words and must NOT contain the answer word.\n\n${lines}\n\nReturn: {"across":{"${acrossWords[0]?.num}":"clue",...},"down":{"${downWords[0]?.num}":"clue",...}}`,
    },
  ];

  const res = await aiCall(messages, 2000, 0.7, 1);
  const text = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "");
  return extractJSON(text);
}

export async function generateCrosswordVariant(
  variant: CrosswordVariant,
  theme: string,
): Promise<CrosswordPuzzle> {
  const { template, maxTokens } = VARIANT_CONFIG[variant];
  const size = template.length;
  const templateStr = template.join("\n");

  const maxAttempts = 2;
  let lastError = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: "You are a crossword puzzle constructor. Reply with ONLY valid JSON. No markdown fences, no explanation.",
        },
        {
          role: "user",
          content: buildGridPrompt(variant, templateStr, size, theme),
        },
      ];
      const res = await aiCall(messages, maxTokens, 0.7 + attempt * 0.15, 1);
      const text = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "");
      const parsed = extractJSON(text);

      if (!Array.isArray(parsed.grid) || parsed.grid.length !== size) throw new Error("bad grid");

      const rows = validateAndFixGrid(parsed, template, size);
      const rawGrid = parseCrosswordGrid(rows);
      const { numbers, acrossWords, downWords } = numberGrid(rawGrid);

      if (!validateWords(acrossWords, downWords)) throw new Error("invalid words in grid");

      let clueData: { across: Record<string, string>; down: Record<string, string> };
      try {
        clueData = await generateClues(acrossWords, downWords, theme);
      } catch {
        clueData = { across: {}, down: {} };
      }

      const ac = clueData.across || {};
      const dc = clueData.down || {};

      return {
        size,
        grid: rawGrid,
        numbers,
        acrossClues: acrossWords.map((w) => ({
          num: w.num,
          clue: ac[String(w.num)] || `${w.word.length}-letter word`,
        })),
        downClues: downWords.map((w) => ({
          num: w.num,
          clue: dc[String(w.num)] || `${w.word.length}-letter word`,
        })),
        theme,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`[crossword] ${variant} attempt ${attempt + 1} failed:`, lastError);
    }
  }

  throw new Error(`Failed to generate ${variant} crossword: ${lastError}`);
}

export async function generateCrossword(): Promise<CrosswordPuzzle> {
  const theme = await generateDailyTheme();
  return generateCrosswordVariant("normal", theme);
}
