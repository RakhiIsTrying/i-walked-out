import { DICTIONARY } from "@/lib/words";
import { SpellingPuzzle } from "./types";
import { extractJSON, cleanAIResponse, aiCall } from "./ai-utils";

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

function findValidWords(center: string, outer: string[]): string[] {
  const allLetters = new Set([center, ...outer]);
  return DICTIONARY.filter((word) => {
    if (word.length < 4) return false;
    if (!word.includes(center)) return false;
    for (const ch of word) {
      if (!allLetters.has(ch)) return false;
    }
    return true;
  }).sort();
}

export async function generateSpellingBee(dateLabel?: string): Promise<SpellingPuzzle> {
  const dateHint = dateLabel ? ` for ${dateLabel}` : "";
  const dateSeed = dateLabel ? ` Use the date "${dateLabel}" as inspiration — pick letters that feel thematically connected to that specific day. Do NOT reuse letter sets from other days.` : "";
  const res = await aiCall([
    {
      role: "system",
      content:
        "You generate Spelling Bee puzzles. Each day MUST have completely different letters. Reply with ONLY valid JSON. No markdown, no explanation.",
    },
    {
      role: "user",
      content: `Generate a Spelling Bee puzzle${dateHint}. Choose 7 UNIQUE lowercase letters. One is the "center" letter that MUST appear in every valid word. Pick letters that allow MANY common 4+ letter English words. Include at least 2 vowels.${dateSeed}

IMPORTANT: The center letter and outer letters must be COMPLETELY DIFFERENT from any other day's puzzle. Be creative with your letter selection.

Return ONLY: {"center":"x","outer":["a","b","c","d","e","f"]}`,
    },
  ], 100, 1.4, 3);

  const text = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "");
  const parsed = extractJSON(text);

  const center = parsed.center?.toLowerCase();
  const outer: string[] = parsed.outer?.map((l: string) => l.toLowerCase());
  if (!center || !outer || outer.length !== 6) throw new Error("bad data");

  const allLetters = new Set([center, ...outer]);
  if (allLetters.size !== 7) throw new Error("duplicate letters");

  const validWords = findValidWords(center, outer);
  if (validWords.length < 12) throw new Error("too few words");

  const maxScore = validWords.reduce(
    (sum, w) => sum + scoreSpellingWord(w, allLetters),
    0,
  );

  return { center, outer, validWords, maxScore };
}
