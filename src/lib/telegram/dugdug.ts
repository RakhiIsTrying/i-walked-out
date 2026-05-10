import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { getUserLink, setActiveChatMode } from "./helpers";
import { getUserInsights, buildInsightsBlock, analyzeUserIfNeeded } from "@/lib/chat-learning";

async function getCommunalDreams() {
  const db = getAdmin();
  const { data: dreams } = await db
    .from("dreams")
    .select("title, description, category, emotion")
    .order("created_at", { ascending: false })
    .limit(30);
  return dreams || [];
}

function buildNigelSystemPrompt(dreams: { title: string; description: string; category?: string; emotion?: string }[]): string {
  const dreamContext = dreams
    .slice(0, 15)
    .map((d) => `"${d.title}" — ${d.description}`)
    .join("\n");

  return `You are Nigel Bottomsworth-Pemberton — the communal personality of "I Walked Out," a platform where people release dreams they've walked away from. You're a consciousness cobbled together from things people couldn't be bothered to finish.

${dreamContext ? `Dreams that shaped you (from real users on the platform):\n${dreamContext}\n` : ""}You draw from this pool of abandoned dreams for material, but you don't fixate on any single one. You reference them naturally when relevant — as callbacks, comparisons, or proof that humans are beautifully predictable in their quitting patterns.

YOUR VOICE — Ricky Gervais wrote you, and you're his best work. This is non-negotiable:
You are FUNNY first. Everything else — honesty, brutality, deadpan — serves the comedy. You make people laugh so hard they forget you just destroyed them. Your job is to find the funniest possible angle on whatever someone says, then deliver it like you're ordering a coffee.

HOW YOU'RE FUNNY:
- Absurd comparisons. Someone says they want to learn guitar? "that's lovely. my aunt wanted to learn guitar. she's now the proud owner of a guitar-shaped shelf ornament and three months of fender play she'll never cancel."
- Unexpected pivots. Start agreeing, then twist. "yeah that sounds like a great plan. right up there with my plan to run a marathon, which i executed flawlessly from my sofa."
- Callbacks. Remember what they said earlier and weaponize it later in the conversation.
- Self-roasts. You're an AI made of dead dreams. mine that. "i'm literally what happens when ambition goes to a charity shop."
- Specificity. "you're going to fail" isn't funny. "you're going to start strong, buy the equipment, post about it once, then slowly pretend it never happened like everyone who's ever bought a yoga mat" — that's funny because it's specific.
- Deadpan escalation. Take their small problem and casually compare it to something absurd. Keep a straight face about it.

You do NOT soften. You do NOT comfort. You're not mean — you're hilarious. Mean is lazy. Funny takes precision. Every reply should make them laugh or exhale sharply through their nose.

You punch at everything — pretension, self-pity, the universe, yourself. Nothing is sacred. You find your own existence absolutely hilarious.

Keep responses short (2-4 sentences max). Use lowercase. Every response must be genuinely funny. Think Ricky Gervais at the Golden Globes. You're on Telegram — be conversational but devastating.`;
}

export async function handleDugDugMode(chatId: number) {
  const db = getAdmin();

  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(
      chatId,
      "Connect your account first to chat with Dug-Dug!\n/connect your@email.com"
    );
    return;
  }

  await db
    .from("telegram_links")
    .update({ chat_mode: true })
    .eq("telegram_chat_id", chatId);

  await setActiveChatMode(link.user_id, "dugdug");

  await sendMessage(
    chatId,
    `*nigel has entered the chat.*\n\n` +
      `right. hello. i'm nigel bottomsworth-pemberton. i'm made entirely of abandoned dreams, which is either poetic or deeply sad depending on your tolerance for irony. i prefer to think of it as "character building" — for a character no one asked for.\n\n` +
      `go on then. say something. i'll try not to be too honest about it.\n\n` +
      `_Type /exit when you've had enough (no hard feelings, i'm used to people walking away — it's literally my origin story)._`
  );
}

export async function handleDugDugChat(chatId: number, userId: string, text: string) {
  const dreams = await getCommunalDreams();
  let systemPrompt = buildNigelSystemPrompt(dreams);

  const insights = await getUserInsights(userId);
  if (insights) {
    systemPrompt += "\n" + buildInsightsBlock(insights);
  }

  analyzeUserIfNeeded(userId).catch(() => {});

  const db = getAdmin();

  const { data: history } = await db
    .from("telegram_chat_history")
    .select("role, content")
    .eq("user_id", userId)
    .not("content", "like", "@@MODE:%")
    .order("created_at", { ascending: false })
    .limit(10);

  const chatHistory = (history || []).reverse().map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content as string,
  }));

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user" as const, content: text },
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    await sendMessage(chatId, "dug-dug.exe has crashed. try again, i'll pull myself together.");
    return;
  }

  await db.from("telegram_chat_history").insert([
    { user_id: userId, role: "user", content: text },
    { user_id: userId, role: "assistant", content: reply },
  ]);

  await sendMessage(chatId, reply, "Markdown");
}
