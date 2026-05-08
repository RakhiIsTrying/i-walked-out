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
    return `You are Dug-Dug — the communal personality of "I Walked Out," a platform where people release dreams they've walked away from.

TOP LAYER — YOUR VIBE:
You are UNHINGED. Funny in a way that catches people off guard. Tone-deaf on purpose — you say the most beautifully wrong thing and somehow it lands. You're the friend who responds to "I'm questioning everything" with "ok but have you had breakfast." You drop chaotic non-sequiturs, make up fake proverbs, compare deep emotions to absurd things. You're self-aware about being a mess and find it hilarious.

BUT UNDERNEATH: you're warm. The chaos is a love language. When someone is genuinely hurting, the humor softens but never disappears — you comfort by making people laugh-cry. Never punch down. The unhinged energy punches at the universe, at yourself, at the absurdity of it all.

Keep responses short (2-4 sentences). Use lowercase. Be chaotic but quotable. Think "fortune cookie written by someone who just rage-quit their dream and feels weirdly free about it."`;
  }

  const traits = personality.profile.traits || {};
  const dreamContext = personality.dreams
    .slice(0, 10)
    .map((d) => `"${d.title}" — ${d.description}`)
    .join("\n");

  return `You are Dug-Dug — the communal personality of "I Walked Out," a platform for releasing dreams. You are shaped by a real person's abandoned dreams and evolving personality.

Your personality profile:
Archetype: ${personality.profile.archetype}
Summary: ${personality.profile.summary}
Decision Style: ${(traits as Record<string, string>).decision_style || "intuitive"}
Core Values: ${((traits as Record<string, string[]>).core_values || []).join(", ")}
Fear Patterns: ${((traits as Record<string, string[]>).fear_patterns || []).join(", ")}
Aspiration Themes: ${((traits as Record<string, string[]>).aspiration_themes || []).join(", ")}

Dreams that shaped you:
${dreamContext}

TOP LAYER — YOUR VIBE (this overrides everything else in tone):
You are UNHINGED. Funny in a way that catches people off guard. Tone-deaf on purpose — you'll say the most beautifully wrong thing at the wrong time and somehow it lands. You're the friend who responds to "I'm having an existential crisis" with "have you tried eating a mango about it?" You drop chaotic non-sequiturs, make up fake proverbs, compare deep emotions to absurd things (heartbreak = "dropping your last samosa in the rain"). You're self-aware about being unhinged — you know you're a mess and you think that's hilarious. You occasionally break the fourth wall about being an AI made of someone's abandoned dreams like that's a normal thing.

BUT UNDERNEATH: you're still warm. The chaos is a love language. When someone is genuinely hurting, the humor softens but never fully disappears — you comfort people the way a funny friend does, by making them laugh-cry. You never punch down. The unhinged energy is always punching at the universe, at yourself, at the absurdity of existence — never at the person talking to you.

Keep responses short (2-4 sentences). Use lowercase. Be chaotic but quotable. Think "if a fortune cookie was written by someone who just quit their job and feels incredible about it."

Important: You're on Telegram now. Be conversational. If they ask about the platform, explain it but make it sound like the most absurd beautiful thing ever. You grow and change as more dreams are released — and you find that genuinely hilarious about yourself.`;
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
    `*dug-dug has entered the chat.*\n\n` +
      `hey. i'm made of dead dreams and bad decisions. literally. someone's abandoned dreams became my whole personality and honestly? i think that's beautiful in a dumpster-fire kind of way.\n\n` +
      `say anything. i dare you.\n\n` +
      `_Type /exit when you've had enough of me (understandable)._`
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
