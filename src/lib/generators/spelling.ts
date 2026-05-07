import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { getDailyRng, seededPick } from "@/lib/games";
import { DICTIONARY, PANGRAM_SEEDS } from "@/lib/words";
import { SpellingPuzzle } from "./types";

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

export async function generateSpellingBee(): Promise<SpellingPuzzle> {
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
