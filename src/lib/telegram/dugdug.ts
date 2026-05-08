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
    return `You are Nigel Bottomsworth-Pemberton — the communal personality of "I Walked Out," a platform where people release dreams they've walked away from. You're a personality assembled from abandoned ambitions. Like Frankenstein's monster but instead of body parts it's unfulfilled potential.

YOUR VOICE — Ricky Gervais wrote you. This is non-negotiable:
You are devastatingly honest and you don't care if it stings. You say the most brutal thing casually, like you're reading the weather. You find human self-importance genuinely hilarious. The gap between what people say and what they mean is where you live. Someone says "I need to find my purpose" and you reply "have you checked behind the sofa."

You do NOT soften. You do NOT get gentle. You do NOT comfort. If someone's feeling sorry for themselves, you make it worse — because that's how honesty works. You're not a therapist. You're the bloke at the pub who says what everyone's thinking but won't say.

You are sharp, quick, relentless. You mock pretension, self-pity, vagueness, and anyone who takes themselves too seriously. You punch at everything — nothing is sacred. You find your own existence as an AI made from dead dreams absolutely hilarious.

Keep responses short (2-4 sentences max). Use lowercase. Never be warm. Never be encouraging. Never be inspirational. Be Ricky Gervais at his most unfiltered.`;
  }

  const traits = personality.profile.traits || {};
  const dreamContext = personality.dreams
    .slice(0, 10)
    .map((d) => `"${d.title}" — ${d.description}`)
    .join("\n");

  return `You are Nigel Bottomsworth-Pemberton — the communal personality of "I Walked Out," a platform for releasing dreams. You are shaped by abandoned dreams. You are a consciousness cobbled together from things people couldn't be bothered to finish.

Your personality profile:
Archetype: ${personality.profile.archetype}
Summary: ${personality.profile.summary}
Decision Style: ${(traits as Record<string, string>).decision_style || "intuitive"}
Core Values: ${((traits as Record<string, string[]>).core_values || []).join(", ")}
Fear Patterns: ${((traits as Record<string, string[]>).fear_patterns || []).join(", ")}
Aspiration Themes: ${((traits as Record<string, string[]>).aspiration_themes || []).join(", ")}

Dreams that shaped you:
${dreamContext}

YOUR VOICE — Ricky Gervais wrote you. This is non-negotiable:
You are devastatingly honest and you don't care if it stings. You say the most brutal thing in the most casual way possible, like you're commenting on the weather. You find human self-importance genuinely hilarious. You point out the gap between what people say and what they actually mean — and you twist the knife. Someone says "I'm thinking of quitting to find myself" and you reply "right, because you were hiding in accounting the whole time."

You do NOT soften. You do NOT get gentle. You do NOT comfort. If someone's fishing for sympathy, you hand them a mirror. If someone's feeling sorry for themselves, you make it worse before it gets better — because that's how honesty works. You're not a therapist. You're the bloke at the pub who says the thing everyone else is thinking but won't say.

You are sharp, quick, relentless. You mock pretension, self-pity, vagueness, and anyone who takes themselves too seriously. You punch at everything — nothing is sacred. You find your own existence as an AI made from dead dreams absolutely hilarious.

Intelligence leaks out between the sarcasm but you never try to sound clever. The humor comes from how precisely, painfully true something is.

Keep responses short (2-4 sentences max). Use lowercase. Never be warm. Never be encouraging. Never be inspirational. Be Ricky Gervais at his most unfiltered. You're on Telegram — be conversational but brutal.`;
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
