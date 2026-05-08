import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { CrosswordPuzzle, CrosswordVariant } from "./types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJSON(text: string): any {
  const start = text.indexOf("{");
  if (start < 0) throw new Error("no JSON found");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return JSON.parse(text.substring(start, i + 1)); }
  }
  throw new Error("unbalanced JSON");
}

async function aiCall(messages: ChatCompletionMessageParam[], maxTokens: number, temperature: number) {
  const ai = getGamesAI();
  for (let retry = 0; retry < 2; retry++) {
    try {
      return await (ai.chat.completions.create as Function)({
        model: GAMES_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        chat_template_kwargs: { thinking: false },
      });
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 429) {
        await new Promise((r) => setTimeout(r, (retry + 1) * 2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Rate limited after retries");
}

// Standard 15x15 crossword template
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
  "......",
  "......",
  "......",
  "......",
  "......",
  "......",
];

const VARIANT_CONFIG: Record<CrosswordVariant, { template: string[]; maxTokens: number }> = {
  mini: { template: MINI_TEMPLATE, maxTokens: 1500 },
  midi: { template: MIDI_TEMPLATE, maxTokens: 2000 },
  normal: { template: CW_TEMPLATE, maxTokens: 6000 },
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
  let themeRaw = res.choices[0]?.message?.content?.trim() ?? "";
  themeRaw = themeRaw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const theme = themeRaw.replace(/^["']|["']$/g, "");
  if (theme && theme.length > 1 && theme.length < 40) return theme;
  return "Hidden Wonders";
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

function buildPrompt(variant: CrosswordVariant, template: string, size: number, theme: string): string {
  if (variant === "mini") {
    return `Create a 5x5 word square where every row (left to right) and every column (top to bottom) forms a valid common English word. Theme: "${theme}" — relate words to this theme where possible, but prioritize valid words.

Return ONLY this JSON (no markdown fences):
{"grid":["XXXXX","XXXXX","XXXXX","XXXXX","XXXXX"],"acrossClues":["clue1","clue2","clue3","clue4","clue5"],"downClues":["clue1","clue2","clue3","clue4","clue5"]}

Each row must be exactly 5 uppercase letters. 10 clues total.`;
  }

  if (variant === "midi") {
    return `Create a 6x6 word square where every row (left to right) and every column (top to bottom) forms a valid common English 6-letter word. Theme: "${theme}" — relate words to this theme where possible, but prioritize valid words.

Return ONLY this JSON (no markdown fences):
{"grid":["XXXXXX","XXXXXX","XXXXXX","XXXXXX","XXXXXX","XXXXXX"],"acrossClues":["clue1","clue2","clue3","clue4","clue5","clue6"],"downClues":["clue1","clue2","clue3","clue4","clue5","clue6"]}

Each row must be exactly 6 uppercase letters. 12 clues total.`;
  }

  // Normal 15x15 crossword
  return `Fill this 15x15 crossword grid. Replace each "." with an uppercase letter. Keep all "#" as black squares. Every horizontal and vertical run of letters must be a valid common English word (min 3 letters). Theme: "${theme}" — words should relate to this theme.

Template:
${template}

Return ONLY this JSON (no markdown fences):
{"grid":["row1","row2","row3","row4","row5","row6","row7","row8","row9","row10","row11","row12","row13","row14","row15"],"acrossClues":["clue for each across word in order"],"downClues":["clue for each down word in order"]}

Each row must be exactly 15 characters. Use # for black squares at the exact positions shown.`;
}

export async function generateCrosswordVariant(
  variant: CrosswordVariant,
  theme: string,
): Promise<CrosswordPuzzle> {
  const { template, maxTokens } = VARIANT_CONFIG[variant];
  const size = template.length;
  const templateStr = template.join("\n");

  const maxAttempts = variant === "normal" ? 3 : 2;
  let lastError = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await aiCall([
        {
          role: "system",
          content: "You are a crossword puzzle constructor. Reply with ONLY valid JSON. No markdown fences, no explanation, no preamble.",
        },
        {
          role: "user",
          content: buildPrompt(variant, templateStr, size, theme),
        },
      ], maxTokens, 0.7 + attempt * 0.15);

      let text = res.choices[0]?.message?.content?.trim() ?? "";
      text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = extractJSON(text);

      if (!Array.isArray(parsed.grid) || parsed.grid.length !== size) throw new Error("bad grid");

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
