import { getGamesAI, GAMES_MODEL } from "@/lib/ai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractJSON(text: string): any {
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

export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export function cleanAIResponse(text: string): string {
  let cleaned = stripThinkTags(text);
  cleaned = cleaned.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  return cleaned;
}

export async function aiCall(
  messages: ChatCompletionMessageParam[],
  maxTokens: number,
  temperature: number,
  maxRetries = 2,
) {
  const ai = getGamesAI();
  for (let retry = 0; retry < maxRetries; retry++) {
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
