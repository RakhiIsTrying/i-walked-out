import { WordlePuzzle } from "./types";
import { cleanAIResponse, aiCall } from "./ai-utils";

export async function generateWordle(): Promise<WordlePuzzle> {
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await aiCall([
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
      ], 20, 1.2);
      const raw = cleanAIResponse(res.choices[0]?.message?.content?.trim() ?? "");
      const word = raw.toUpperCase().replace(/[^A-Z]/g, "");
      if (word.length === 5) return { answer: word };
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 429) {
        await new Promise((r) => setTimeout(r, (retry + 1) * 2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error("Failed to generate wordle after 3 attempts");
}
