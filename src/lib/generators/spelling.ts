import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { DICTIONARY } from "@/lib/words";
import { SpellingPuzzle } from "./types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBalanced(text: string, open: string, close: string): any {
  const start = text.indexOf(open);
  if (start < 0) throw new Error(`no ${open} found`);
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return JSON.parse(text.substring(start, i + 1)); }
  }
  throw new Error("unbalanced JSON");
}

export function scoreSpellingWord(word: string, allLetters: Set<string>): number {
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

export function buildSpellingResult(
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

async function aiCallSpelling(messages: ChatCompletionMessageParam[], maxTokens: number, temperature: number) {
  const ai = getGamesAI();
  for (let retry = 0; retry < 3; retry++) {
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

export async function generateSpellingBee(): Promise<SpellingPuzzle> {
  const lettersRes = await aiCallSpelling([
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
  ], 100, 1.2);

  let text = lettersRes.choices[0]?.message?.content?.trim() ?? "";
  text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = extractBalanced(text, "{", "}");

  const center = parsed.center?.toLowerCase();
  const outer: string[] = parsed.outer?.map((l: string) => l.toLowerCase());
  if (!center || !outer || outer.length !== 6) throw new Error("bad data");

  const allLetters = new Set([center, ...outer]);
  if (allLetters.size !== 7) throw new Error("duplicate letters");

  // Use dictionary to find valid words (fast, no extra AI call needed)
  const validWords = DICTIONARY.filter((word) => {
    if (word.length < 4) return false;
    if (!word.includes(center)) return false;
    for (const ch of word) {
      if (!allLetters.has(ch)) return false;
    }
    return true;
  }).sort();

  if (validWords.length < 12) throw new Error("too few words");

  const maxScore = validWords.reduce(
    (sum, w) => sum + scoreSpellingWord(w, allLetters),
    0,
  );

  return { center, outer, validWords, maxScore };
}
