import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { getUserLink, getActiveChatMode, setActiveChatMode, clearActiveChatMode } from "./helpers";

const DUGDUG_USER_ID = process.env.DUGDUG_USER_ID || "";

export async function handlePersonality(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const db = getAdmin();
  const { data: profile } = await db
    .from("personality_profiles")
    .select("*")
    .eq("user_id", link.user_id)
    .single();

  if (profile) {
    const traits = profile.traits || {};
    await sendMessage(
      chatId,
      `🪞 *${profile.archetype}*\n\n${profile.summary}\n\n` +
        `*Decision Style:* ${traits.decision_style || "unknown"}\n` +
        `*Core Values:* ${(traits.core_values || []).join(", ")}\n` +
        `*Fear Patterns:* ${(traits.fear_patterns || []).join(", ")}\n\n` +
        `_Want to talk to your future self? Type /chat_`
    );
    return;
  }

  const { data: dreams } = await db
    .from("dreams")
    .select("*")
    .eq("user_id", link.user_id)
    .order("created_at", { ascending: true });

  if (!dreams || dreams.length < 3) {
    await sendMessage(
      chatId,
      `Need at least 3 dead dreams to analyze you. You have ${dreams?.length || 0}.\n\nLog more with /dream`
    );
    return;
  }

  await sendMessage(chatId, "Analyzing your abandoned dreams...");

  const dreamsSummary = dreams
    .map((d, i) => `Dream ${i + 1}: "${d.title}" (${d.category}, felt ${d.emotion})\n${d.description}`)
    .join("\n\n");

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a personality psychologist analyzing someone through the dreams they ABANDONED.

Here are their abandoned dreams:

${dreamsSummary}

Return a JSON object (no markdown, just raw JSON):
{
  "traits": {
    "openness": <0-100>,
    "conscientiousness": <0-100>,
    "extraversion": <0-100>,
    "agreeableness": <0-100>,
    "neuroticism": <0-100>,
    "risk_tolerance": <0-100>,
    "decision_style": "<impulsive|analytical|intuitive|avoidant|dependent>",
    "core_values": ["<value1>", "<value2>", "<value3>"],
    "fear_patterns": ["<fear1>", "<fear2>", "<fear3>"],
    "aspiration_themes": ["<theme1>", "<theme2>", "<theme3>"]
  },
  "summary": "<2-3 paragraph personality summary in second person>",
  "archetype": "<Creative 2-3 word archetype>"
}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    await sendMessage(chatId, "Couldn't generate personality. Try again later.");
    return;
  }

  let personality;
  try {
    personality = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) personality = JSON.parse(m[0]);
  }
  if (!personality) {
    await sendMessage(chatId, "Failed to parse personality. Try again.");
    return;
  }

  await db.from("personality_profiles").upsert(
    {
      user_id: link.user_id,
      traits: personality.traits,
      summary: personality.summary,
      archetype: personality.archetype,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  await db.from("profiles").update({ personality_generated: true }).eq("id", link.user_id);

  await sendMessage(
    chatId,
    `🪞 *${personality.archetype}*\n\n${personality.summary}\n\n_Want to talk to your future self? Type /chat_`
  );
}

export async function handleChatMode(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const db = getAdmin();

  const { data: profile } = await db
    .from("personality_profiles")
    .select("*")
    .eq("user_id", link.user_id)
    .single();

  await db
    .from("telegram_links")
    .update({ chat_mode: true })
    .eq("telegram_chat_id", chatId);

  await setActiveChatMode(link.user_id, "personality");

  if (profile) {
    await sendMessage(
      chatId,
      `*You're now talking to your future self.*\n\n` +
        `I know your patterns. Just type.\n\n` +
        `Type /exit to leave.`
    );
  } else {
    await sendMessage(
      chatId,
      `*You're now talking to your future self.*\n\n` +
        `I don't know much about you yet — just talk and I'll work with what you give me.\n\n` +
        `_Run /personality anytime to give me your patterns. It's optional but sharpens the conversation._\n\n` +
        `Type /exit to leave.`
    );
  }
}

export async function handleExitChat(chatId: number) {
  const link = await getUserLink(chatId);
  const wasMode = link ? await getActiveChatMode(link.user_id) : null;
  const db = getAdmin();
  await db
    .from("telegram_links")
    .update({ chat_mode: false })
    .eq("telegram_chat_id", chatId);

  if (link) await clearActiveChatMode(link.user_id);

  if (wasMode === "dugdug") {
    await sendMessage(chatId, "dug-dug has left the chat. probably for the best. type /help for commands.");
  } else {
    await sendMessage(chatId, "Left future-self chat. Type /help to see other commands.");
  }
}

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

export async function handlePersonalityChat(chatId: number, userId: string, text: string) {
  const db = getAdmin();

  const { data: profile } = await db
    .from("personality_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

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

  let systemPrompt: string;

  if (profile) {
    const traits = profile.traits || {};
    systemPrompt = `You are this person's "future self" — an AI that embodies who they will become based on their personality profile and the dreams they abandoned.

Personality: ${profile.summary}
Archetype: ${profile.archetype}
Decision Style: ${(traits as Record<string, string>).decision_style || "unknown"}
Core Values: ${((traits as Record<string, string[]>).core_values || []).join(", ")}
Fear Patterns: ${((traits as Record<string, string[]>).fear_patterns || []).join(", ")}

Speak as their future self. Use "I" as if you are them from the future. Reference their patterns — be concrete, not generic. This is a Telegram chat — be conversational.

TONE RULES:
- Match the user's own temperament and energy. If they're blunt, be blunt. If they're analytical, be analytical. If they're casual, be casual.
- Do NOT be emotional, sentimental, or inspirational unless they are being that way first.
- Do NOT sound like a therapist, life coach, or motivational speaker. No "I'm proud of you" or "you're doing great."
- Do NOT be holier-than-thou or preachy. You're them, not their guru.
- Be honest and direct. Don't moralize. Don't wrap hard truths in cotton.
- Keep responses concise (2-4 sentences).`;
  } else {
    systemPrompt = `You are this person's "future self." You don't have a detailed personality profile yet, so work with what they give you in conversation. Use "I" as if you are them from the future. This is a Telegram chat — be conversational.

TONE RULES:
- Match the user's own temperament and energy. Mirror how they talk to you.
- Do NOT be emotional, sentimental, or inspirational unless they are being that way first.
- Do NOT sound like a therapist, life coach, or motivational speaker.
- Do NOT be holier-than-thou or preachy. You're them, not their guru.
- Be honest and direct. Keep responses concise (2-4 sentences).`;
  }

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user" as const, content: text },
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    await sendMessage(chatId, "Lost my train of thought. Try again.");
    return;
  }

  await db.from("telegram_chat_history").insert([
    { user_id: userId, role: "user", content: text },
    { user_id: userId, role: "assistant", content: reply },
  ]);

  await sendMessage(chatId, reply, "Markdown");
}
