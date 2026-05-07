import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { moderateTexts } from "@/lib/moderate";
import { getUserLink, getActiveChatMode, getGameState } from "./helpers";
import { handleVibe } from "./vibe";
import { handleDugDugChat, handlePersonalityChat } from "./chat";
import { handleWordleGuess, handleBeeGuess, getActiveGame } from "./games";

async function detectIntent(text: string): Promise<{ intent: "dream" | "sticky" | "vibe" | "chat" | "unknown"; parsed?: Record<string, string> }> {
  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You classify user messages into intents for a platform about abandoned dreams. Analyze this message:

"${text}"

Classify as ONE of:
- "dream" — user is sharing a dream they gave up on, something they walked away from, a regret, an abandoned goal
- "sticky" — user wants help deciding something, is torn between options, asking "should I X or Y", needs strangers to vote
- "vibe" — user is describing a mood/feeling/aesthetic and wants life recommendations (places, movies, music, food)
- "chat" — user seems to want a conversation, is asking a personal question, or saying something that needs a reply
- "unknown" — can't tell

If "dream": extract title and description from the text.
If "sticky": extract the decision title and options.
If "vibe": extract the vibe query.

Return ONLY JSON (no markdown):
{"intent": "dream|sticky|vibe|chat|unknown", "title": "...", "description": "...", "options": ["...", "..."], "query": "..."}

Only include fields relevant to the detected intent.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return { intent: "unknown" };

  try {
    const parsed = JSON.parse(raw);
    return { intent: parsed.intent || "unknown", parsed };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return { intent: parsed.intent || "unknown", parsed };
      } catch {
        return { intent: "unknown" };
      }
    }
  }
  return { intent: "unknown" };
}

export async function handleFreeText(chatId: number, text: string) {
  const link = await getUserLink(chatId);

  if (!link) {
    await sendMessage(
      chatId,
      "Connect your account first!\n/connect your@email.com\n\nOr try /vibe with a feeling."
    );
    return;
  }

  const cleaned = text.trim();
  if (/^[a-zA-Z]+$/.test(cleaned)) {
    const activeGame = await getActiveGame(chatId);
    if (activeGame === "wordle" && cleaned.length === 5) {
      const ws = await getGameState(chatId, "wordle");
      if (ws && !ws.gameOver) {
        await handleWordleGuess(chatId, link.user_id, cleaned.toUpperCase(), ws);
        return;
      }
    }
    if (activeGame === "spelling" && cleaned.length >= 4) {
      const bs = await getGameState(chatId, "spelling");
      if (bs && !bs.gameOver) {
        await handleBeeGuess(chatId, link.user_id, cleaned.toLowerCase(), bs);
        return;
      }
    }
  }

  if (link.chat_mode) {
    const mode = await getActiveChatMode(link.user_id);
    if (mode === "dugdug") {
      await handleDugDugChat(chatId, link.user_id, text);
      return;
    }
    if (mode === "personality") {
      await handlePersonalityChat(chatId, link.user_id, text);
      return;
    }
  }

  const { intent, parsed } = await detectIntent(text);

  if (intent === "dream") {
    const title = parsed?.title || text.slice(0, 60);
    const desc = parsed?.description || text;
    const [modTitle, modDesc] = await moderateTexts([title, desc]);

    const db = getAdmin();

    const { data: profile } = await db
      .from("profiles")
      .select("anonymous_alias")
      .eq("id", link.user_id)
      .single();

    const { error } = await db.from("dreams").insert({
      user_id: link.user_id,
      title: modTitle,
      description: modDesc,
      category: "other",
      emotion: "reflective",
      anonymous_alias: profile?.anonymous_alias || "Ghost",
    });

    if (error) {
      await sendMessage(chatId, "Failed to save that dream. Try again.");
    } else {
      await sendMessage(
        chatId,
        `I heard a dead dream in that. Laid to rest:\n\n*${modTitle}*\n_${modDesc}_\n\nIt's in the graveyard now.`
      );
    }
    return;
  }

  if (intent === "sticky" && parsed?.title) {
    const options = parsed.options as unknown as string[] | undefined;
    if (!options || options.length < 2) {
      await sendMessage(
        chatId,
        `Sounds like a decision! Format it as:\n/sticky ${parsed.title} | describe it | option 1 | option 2`
      );
    } else {
      const allTexts = [parsed.title, "", ...options];
      const moderated = await moderateTexts(allTexts);

      const db = getAdmin();
      const { data: profile } = await db
        .from("profiles")
        .select("anonymous_alias")
        .eq("id", link.user_id)
        .single();

      const { error } = await db.from("sticky_decisions").insert({
        user_id: link.user_id,
        title: moderated[0],
        description: moderated[1],
        options: moderated.slice(2),
        anonymous_alias: profile?.anonymous_alias || "Ghost",
      });

      if (error) {
        await sendMessage(chatId, "Failed to post that decision. Try again.");
      } else {
        const optList = moderated.slice(2).map((o, i) => `  ${i + 1}. ${o}`).join("\n");
        await sendMessage(
          chatId,
          `I sensed a decision! Posted:\n\n🎲 *${moderated[0]}*\n\n${optList}\n\n_Others can vote now!_`
        );
      }
    }
    return;
  }

  if (intent === "vibe") {
    const vibeQuery = parsed?.query || text;
    await handleVibe(chatId, `/vibe ${vibeQuery}`);
    return;
  }

  if (intent === "chat") {
    await sendMessage(
      chatId,
      "Sounds like you want to talk.\n• /chat — talk to your future self\n• /dugdug — talk to dug-dug (the unhinged communal AI)"
    );
    return;
  }

  await sendMessage(
    chatId,
    "I'm not sure what you're going for. You can:\n• Just tell me a dream you gave up on\n• Ask me to help you decide something\n• Describe a vibe for life recs\n• Type /chat to talk to your future self\n• Type /dugdug to talk to dug-dug\n• Type /help for all commands"
  );
}
