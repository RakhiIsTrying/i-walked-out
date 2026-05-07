import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { getDailyRng, seededPick } from "@/lib/games";
import { WORDLE_ANSWERS } from "@/lib/words";
import { WordlePuzzle } from "./types";

export async function generateWordle(): Promise<WordlePuzzle> {
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
