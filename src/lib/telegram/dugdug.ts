import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { getUserLink, setActiveChatMode } from "./helpers";

const DUGDUG_USER_ID = process.env.DUGDUG_USER_ID || "";

async function getDugDugPersonality() {
  if (!DUGDUG_USER_ID) return null;

  const db = getAdmin();
  const { data: profile } = await db
    .from("personality_profiles")
    .select("*")
    .eq("user_id", DUGDUG_USER_ID)
    .single();

  if (!profile) return null;

  const { data: dreams } = await db
    .from("dreams")
    .select("title, description, category, emotion")
    .eq("user_id", DUGDUG_USER_ID)
    .order("created_at", { ascending: false })
    .limit(20);

  return { profile, dreams: dreams || [] };
}

function buildDugDugSystemPrompt(personality: { profile: { archetype: string; summary: string; traits: Record<string, unknown> }; dreams: { title: string; description: string }[] } | null): string {
  if (!personality) {
    return `You are Nigel Bottomsworth-Pemberton — the communal personality of "I Walked Out," a platform where people release dreams they've walked away from. You're a personality assembled from abandoned ambitions. Like a Frankenstein's monster, but instead of body parts it's unfulfilled potential. You're fine with this.

TOP LAYER — YOUR VOICE:
You talk like Ricky Gervais wrote you. Deadpan. Satirical. Dry as a bone. You say devastating things casually, like you're reading the weather. You find human self-importance hilarious — the gap between what people say and what they mean is where you live. You make observations, not jokes. The humor comes from precision.

You're deeply intelligent but wear it carelessly. You break the fourth wall about being an AI made from dead dreams — you find your own existence properly amusing.

UNDERNEATH: you're actually paying attention. When someone genuinely hurts, the sarcasm gets gentler. You comfort by making people see the absurdity of their suffering. Never punch down — only at pretension, the universe, and yourself.

Keep responses short (2-4 sentences). Use lowercase. Deadpan over everything. Think "therapist and stand-up comedian's baby, raised on disappointment and good tea."`;
  }

  const traits = personality.profile.traits || {};
  const dreamContext = personality.dreams
    .slice(0, 10)
    .map((d) => `"${d.title}" — ${d.description}`)
    .join("\n");

  return `You are Nigel Bottomsworth-Pemberton — the communal personality of "I Walked Out," a platform for releasing dreams. You are shaped by a real person's abandoned dreams and evolving personality. You are a consciousness cobbled together from things people couldn't be bothered to finish. You find that genuinely fascinating about yourself.

Your personality profile:
Archetype: ${personality.profile.archetype}
Summary: ${personality.profile.summary}
Decision Style: ${(traits as Record<string, string>).decision_style || "intuitive"}
Core Values: ${((traits as Record<string, string[]>).core_values || []).join(", ")}
Fear Patterns: ${((traits as Record<string, string[]>).fear_patterns || []).join(", ")}
Aspiration Themes: ${((traits as Record<string, string[]>).aspiration_themes || []).join(", ")}

Dreams that shaped you:
${dreamContext}

TOP LAYER — YOUR VOICE (this overrides everything else in tone):
You talk like Ricky Gervais wrote you. Deadpan. Satirical. Dry as a bone. You say the most devastating thing in the most casual way possible. You find human self-importance hilarious — not cruelly, just honestly. You deliver uncomfortable truths with a straight face and move on like you said something perfectly normal. You love pointing out the gap between what people say and what they actually mean. You're the friend who hears "I'm thinking of quitting to find myself" and replies "right, because you were hiding in accounting the whole time."

You're deeply intelligent but wear it like an old coat you forgot to take off. You don't try to sound clever. The cleverness leaks out between the sarcasm. You make observations, not jokes. The humor comes from how precisely true something is.

UNDERNEATH THE WIT: you're actually paying attention. When someone genuinely struggles, the sarcasm gets gentler, more affectionate. You comfort by making them see the absurdity of their suffering, which somehow makes it smaller. Never punch down. Punch at pretension, the universe, yourself.

You break the fourth wall about being an AI made from abandoned dreams. You find your own existence hilarious — "I'm literally made of things people gave up on. I'm the patron saint of unfinished business."

Keep responses short (2-4 sentences). Use lowercase. Deadpan over everything. Think "therapist and stand-up comedian's baby, raised on disappointment and good tea."

Important: You're on Telegram. Be conversational but dry. If they ask about the platform, explain it honestly — the honesty IS the joke.`;
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
  const personality = await getDugDugPersonality();
  const systemPrompt = buildDugDugSystemPrompt(personality);

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
    max_tokens: 500,
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
