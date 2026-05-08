import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { WordlePuzzle } from "./types";

export async function generateWordle(): Promise<WordlePuzzle> {
  const ai = getGamesAI();
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await (ai.chat.completions.create as Function)({
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
        chat_template_kwargs: { thinking: false },
      });
      let raw = res.choices[0]?.message?.content?.trim() ?? "";
      raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
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
