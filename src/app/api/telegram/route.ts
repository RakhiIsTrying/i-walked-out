import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { moderateTexts } from "@/lib/moderate";

export const maxDuration = 60;

const DUGDUG_USER_ID = process.env.DUGDUG_USER_ID || "";

const BLOCKED_FORMATS = [
  "photo", "video", "animation", "sticker", "document",
  "video_note", "audio", "contact", "location", "venue",
  "poll", "dice", "game",
];

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = await request.json();
  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;

  if (message.chat.type !== "private") {
    await sendMessage(chatId, "I only work in private chats. Message me directly!");
    return NextResponse.json({ ok: true });
  }

  if (BLOCKED_FORMATS.some((f) => message[f])) {
    await sendMessage(
      chatId,
      "I only understand text messages. No photos, stickers, or files — just words and feelings."
    );
    return NextResponse.json({ ok: true });
  }

  if (message.voice) {
    await sendMessage(
      chatId,
      "I hear you, but I can only read text right now. Type your thoughts out — sometimes writing them helps too."
    );
    return NextResponse.json({ ok: true });
  }

  if (!message.text) return NextResponse.json({ ok: true });

  const text = message.text.trim();
  const username = message.from?.username || null;

  try {
    if (text.startsWith("/start")) {
      await handleStart(chatId, text, username);
    } else if (text.startsWith("/connect")) {
      await handleConnect(chatId, text, username);
    } else if (text.startsWith("/link")) {
      await handleLink(chatId, text, username);
    } else if (text.startsWith("/dream")) {
      await handleDream(chatId, text);
    } else if (text.startsWith("/vibe")) {
      await handleVibe(chatId, text);
    } else if (text.startsWith("/personality")) {
      await handlePersonality(chatId);
    } else if (text.startsWith("/chat")) {
      await handleChatMode(chatId);
    } else if (text.startsWith("/dugdug")) {
      await handleDugDugMode(chatId);
    } else if (text.startsWith("/exit")) {
      await handleExitChat(chatId);
    } else if (text.startsWith("/feed")) {
      await handleFeed(chatId);
    } else if (text.startsWith("/sticky")) {
      await handleSticky(chatId, text);
    } else if (text.startsWith("/decisions")) {
      await handleDecisions(chatId);
    } else if (text.startsWith("/vote")) {
      await handleVote(chatId, text);
    } else if (text.startsWith("/help")) {
      await handleHelp(chatId);
    } else if (text.startsWith("/")) {
      await sendMessage(chatId, "Unknown command. Type /help to see what I can do.");
    } else {
      await handleFreeText(chatId, text);
    }
  } catch (err) {
    console.error("Telegram bot error:", err);
    await sendMessage(chatId, "Something went wrong. Try again in a moment.");
  }

  return NextResponse.json({ ok: true });
}

// ─── Helpers ───

async function getUserLink(chatId: number) {
  const db = getAdmin();
  const { data } = await db
    .from("telegram_links")
    .select("user_id, chat_mode")
    .eq("telegram_chat_id", chatId)
    .single();
  return data;
}

async function getActiveChatMode(userId: string): Promise<"personality" | "dugdug" | null> {
  const db = getAdmin();
  const { data } = await db
    .from("telegram_chat_history")
    .select("content")
    .eq("user_id", userId)
    .eq("role", "assistant")
    .like("content", "@@MODE:%")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;
  const mode = data[0].content.replace("@@MODE:", "");
  if (mode === "dugdug") return "dugdug";
  if (mode === "personality") return "personality";
  return null;
}

async function setActiveChatMode(userId: string, mode: "personality" | "dugdug") {
  const db = getAdmin();
  await db.from("telegram_chat_history").insert({
    user_id: userId,
    role: "assistant",
    content: `@@MODE:${mode}`,
  });
}

async function clearActiveChatMode(userId: string) {
  const db = getAdmin();
  await db.from("telegram_chat_history").insert({
    user_id: userId,
    role: "assistant",
    content: "@@MODE:off",
  });
}

// ─── /start ───

async function handleStart(chatId: number, text: string, username: string | null) {
  const link = await getUserLink(chatId);

  if (link) {
    await sendMessage(
      chatId,
      `Welcome back! Your Telegram is linked.\n\nType /help to see all commands.`
    );
    return;
  }

  const startParam = text.replace(/^\/start\s*/i, "").trim();
  if (startParam) {
    await handleLink(chatId, `/link ${startParam}`, username);
    return;
  }

  await sendMessage(
    chatId,
    `*Welcome to I Walked Out*\n\n` +
      `A warm little corner for dreams you let go of.\n\n` +
      `*To connect your account:*\n` +
      `/connect your@email.com — Link with your signup email\n` +
      `/link CODE — Or use a code from your dashboard\n\n` +
      `*Or explore without linking:*\n` +
      `/feed — Browse dead dreams\n` +
      `/vibe <phrase> — Life recs from a feeling\n` +
      `/decisions — See what people are deciding\n\n` +
      `_Let kindness be the language we all happen to share._`
  );
}

// ─── /connect — link by email directly ───

async function handleConnect(chatId: number, text: string, username: string | null) {
  const existing = await getUserLink(chatId);
  if (existing) {
    await sendMessage(chatId, "Already linked! Type /help to get started.");
    return;
  }

  const email = text.replace(/^\/connect\s*/i, "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    await sendMessage(chatId, "Send your signup email:\n/connect your@email.com");
    return;
  }

  const db = getAdmin();

  const { data: profile } = await db
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .single();

  if (!profile) {
    await sendMessage(
      chatId,
      `No account found for *${email}*.\n\nSign up first at i-walked-out.vercel.app, then come back and try /connect again.`
    );
    return;
  }

  const { data: alreadyLinked } = await db
    .from("telegram_links")
    .select("id")
    .eq("user_id", profile.id)
    .single();

  if (alreadyLinked) {
    await sendMessage(chatId, "This email is already connected to another Telegram account.");
    return;
  }

  const { error } = await db.from("telegram_links").insert({
    user_id: profile.id,
    telegram_chat_id: chatId,
    telegram_username: username,
  });

  if (error) {
    if (error.code === "23505") {
      await sendMessage(chatId, "This Telegram is already linked to another account.");
    } else {
      await sendMessage(chatId, "Failed to connect. Try again.");
    }
    return;
  }

  await db.from("telegram_link_codes").update({ used: true }).eq("user_id", profile.id);

  await sendMessage(
    chatId,
    `Connected! Your Telegram is now linked to *${email}*.\n\nEverything you do here shows up on the website. Type /help to see all commands.`
  );
}

// ─── /link ───

async function handleLink(chatId: number, text: string, username: string | null) {
  const parts = text.split(/\s+/);
  const code = parts[1];

  if (!code) {
    await sendMessage(chatId, "Send me the code from your dashboard:\n/link YOUR\\_CODE");
    return;
  }

  const db = getAdmin();

  const existing = await getUserLink(chatId);
  if (existing) {
    await sendMessage(chatId, "Already linked! Type /help to get started.");
    return;
  }

  const { data: linkCode } = await db
    .from("telegram_link_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("used", false)
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .single();

  if (!linkCode) {
    await sendMessage(chatId, "Invalid or expired code. Generate a new one from your dashboard.");
    return;
  }

  const { error: linkError } = await db.from("telegram_links").insert({
    user_id: linkCode.user_id,
    telegram_chat_id: chatId,
    telegram_username: username,
  });

  if (linkError) {
    if (linkError.code === "23505") {
      await sendMessage(chatId, "This account is already linked to another Telegram.");
    } else {
      await sendMessage(chatId, "Failed to link. Try again.");
    }
    return;
  }

  await db.from("telegram_link_codes").update({ used: true }).eq("id", linkCode.id);

  await sendMessage(
    chatId,
    "Linked! Your account is connected.\n\nType /help to see everything you can do."
  );
}

// ─── /dream ───

async function handleDream(chatId: number, text: string) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first!\n/connect your@email.com");
    return;
  }

  const content = text.replace(/^\/dream\s*/i, "").trim();
  if (!content) {
    await sendMessage(
      chatId,
      `*Log a dead dream:*\n` +
        `/dream title | description | category\n\n` +
        `*Example:*\n` +
        `/dream Learning piano | Bought a keyboard, never got past week 3 | creative\n\n` +
        `*Categories:* career, relationship, creative, business, education, travel, health, other`
    );
    return;
  }

  const parts = content.split("|").map((p) => p.trim());
  const rawTitle = parts[0];
  const rawDescription = parts[1] || rawTitle;
  const category = parts[2]?.toLowerCase() || "other";

  const validCategories = [
    "career", "relationship", "creative", "business",
    "education", "travel", "health", "other",
  ];
  const finalCategory = validCategories.includes(category) ? category : "other";

  const [modTitle, modDescription] = await moderateTexts([rawTitle, rawDescription]);

  const db = getAdmin();

  const { data: profile } = await db
    .from("profiles")
    .select("anonymous_alias")
    .eq("id", link.user_id)
    .single();

  const { error } = await db.from("dreams").insert({
    user_id: link.user_id,
    title: modTitle,
    description: modDescription,
    category: finalCategory,
    emotion: "reflective",
    anonymous_alias: profile?.anonymous_alias || "Ghost",
  });

  if (error) {
    await sendMessage(chatId, "Failed to save. Try again.");
    return;
  }

  await sendMessage(
    chatId,
    `Laid to rest: *${modTitle}*\n\n_${modDescription}_\n\nYour dream is in the graveyard now. Be gentle with yourself.`
  );
}

// ─── /vibe ───

async function handleVibe(chatId: number, text: string) {
  const query = text.replace(/^\/vibe\s*/i, "").trim();
  if (!query) {
    await sendMessage(
      chatId,
      `*Vibe Coding IRL*\nGive me a feeling, I'll give you a life.\n\n` +
        `/vibe 3am existential clarity\n` +
        `/vibe sunset in a city you'll never return to\n` +
        `/vibe chaotic good brunch\n` +
        `/vibe dancing alone in the kitchen`
    );
    return;
  }

  await sendMessage(chatId, "Translating your vibe...");

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a "Vibe Coding IRL" engine. The user types a vibe, you translate it into real-life recommendations.

The user's vibe: "${query}"

Return a JSON object (no markdown, just raw JSON):
{
  "place": "<Specific real place — include city/country>",
  "movie": "<Specific movie to watch>",
  "tv_show": "<Specific TV show to binge>",
  "food": "<Specific dish or food experience>",
  "game": "<Specific game to play>",
  "song": "<Specific song — include artist>",
  "music_album": "<Specific album to listen front-to-back — include artist>",
  "youtube": "<Specific YouTube video title + channel to search for>",
  "vibe_summary": "<1-2 sentence poetic interpretation>"
}

Be unexpected, specific, and interesting.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    await sendMessage(chatId, "Couldn't translate that vibe. Try another!");
    return;
  }

  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) result = JSON.parse(m[0]);
  }
  if (!result) {
    await sendMessage(chatId, "Couldn't parse that vibe. Try again!");
    return;
  }

  await sendMessage(
    chatId,
    `*Your Vibe:* "${query}"\n\n` +
      `_${result.vibe_summary}_\n\n` +
      `📍 *Place:* ${result.place}\n` +
      `🎬 *Movie:* ${result.movie}\n` +
      `📺 *TV Show:* ${result.tv_show}\n` +
      `🍜 *Eat:* ${result.food}\n` +
      `🎮 *Play:* ${result.game}\n` +
      `🎵 *Song:* ${result.song}\n` +
      `💿 *Album:* ${result.music_album}\n` +
      `▶️ *YouTube:* ${result.youtube}`
  );
}

// ─── /personality ───

async function handlePersonality(chatId: number) {
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

// ─── /chat — enter personality conversation mode ───

async function handleChatMode(chatId: number) {
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

  if (!profile) {
    await sendMessage(
      chatId,
      "You need a personality profile first.\nLog 3+ dreams with /dream, then run /personality"
    );
    return;
  }

  await db
    .from("telegram_links")
    .update({ chat_mode: true })
    .eq("telegram_chat_id", chatId);

  await setActiveChatMode(link.user_id, "personality");

  await sendMessage(
    chatId,
    `🔮 *You're now talking to your future self.*\n\n` +
      `_I'm shaped by every dream you walked away from. Ask me anything — about your regrets, your patterns, what's next._\n\n` +
      `Just type normally. I'll respond as the person you're becoming.\n\n` +
      `Type /exit to leave this conversation.`
  );
}

// ─── /exit — leave chat mode ───

async function handleExitChat(chatId: number) {
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

// ─── /dugdug — enter dug-dug chat mode ───

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

async function handleDugDugMode(chatId: number) {
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

// ─── Intent detection for free text ───

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

// ─── Free text — smart intent detection or personality chat ───

async function handleFreeText(chatId: number, text: string) {
  const link = await getUserLink(chatId);

  if (!link) {
    await sendMessage(
      chatId,
      "Connect your account first!\n/connect your@email.com\n\nOr try /vibe with a feeling."
    );
    return;
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

// ─── Dug-Dug chat handler ───

async function handleDugDugChat(chatId: number, userId: string, text: string) {
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

// ─── Personality chat handler ───

async function handlePersonalityChat(chatId: number, userId: string, text: string) {
  const db = getAdmin();

  const { data: profile } = await db
    .from("personality_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    await db.from("telegram_links").update({ chat_mode: false }).eq("telegram_chat_id", chatId);
    await clearActiveChatMode(userId);
    await sendMessage(chatId, "No personality profile found. Generate one with /personality first.");
    return;
  }

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

  const traits = profile.traits || {};

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `You are this person's "future self" — an AI that embodies who they will become based on their personality profile and the dreams they abandoned.

Personality: ${profile.summary}
Archetype: ${profile.archetype}
Decision Style: ${traits.decision_style}
Core Values: ${(traits.core_values || []).join(", ")}
Fear Patterns: ${(traits.fear_patterns || []).join(", ")}

Speak as their future self. Be warm but honest. Reference their patterns. Be specific, not generic. Use "I" as if you are them from the future. Keep responses concise (2-4 sentences). This is a Telegram chat — be conversational, not formal.`,
      },
      ...chatHistory,
      { role: "user" as const, content: text },
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    await sendMessage(chatId, "I lost my train of thought. Try again.");
    return;
  }

  await db.from("telegram_chat_history").insert([
    { user_id: userId, role: "user", content: text },
    { user_id: userId, role: "assistant", content: reply },
  ]);

  await sendMessage(chatId, reply, "Markdown");
}

// ─── /feed ───

async function handleFeed(chatId: number) {
  const db = getAdmin();
  const { data: dreams } = await db
    .from("dreams")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!dreams || dreams.length === 0) {
    await sendMessage(chatId, "The graveyard is empty. No dead dreams yet.");
    return;
  }

  const lines = dreams.map(
    (d, i) =>
      `*${i + 1}. ${d.title}*\n${d.description.slice(0, 120)}${d.description.length > 120 ? "..." : ""}\n_— ${d.anonymous_alias}_ (${d.category})`
  );

  await sendMessage(
    chatId,
    `👻 *Dead Dreams Feed*\n\n${lines.join("\n\n")}\n\n_See more at i-walked-out.vercel.app/feed_`
  );
}

// ─── /sticky — create a sticky decision ───

async function handleSticky(chatId: number, text: string) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const content = text.replace(/^\/sticky\s*/i, "").trim();
  if (!content) {
    await sendMessage(
      chatId,
      `*Post a Sticky Decision:*\n` +
        `/sticky title | description | option1 | option2 | option3\n\n` +
        `*Example:*\n` +
        `/sticky Should I quit my job? | Been thinking for months | Yes quit | Stay 6 more months | Go part-time`
    );
    return;
  }

  const parts = content.split("|").map((p) => p.trim());
  if (parts.length < 4) {
    await sendMessage(
      chatId,
      "Need at least: title | description | option1 | option2\n\nSeparate everything with |"
    );
    return;
  }

  const allTexts = [parts[0], parts[1], ...parts.slice(2)];
  const moderated = await moderateTexts(allTexts);
  const title = moderated[0];
  const description = moderated[1];
  const options = moderated.slice(2);

  const db = getAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("anonymous_alias")
    .eq("id", link.user_id)
    .single();

  const { error } = await db.from("sticky_decisions").insert({
    user_id: link.user_id,
    title,
    description,
    options,
    anonymous_alias: profile?.anonymous_alias || "Ghost",
  });

  if (error) {
    await sendMessage(chatId, "Failed to post decision. Try again.");
    return;
  }

  const optionsList = options.map((o, i) => `  ${i + 1}. ${o}`).join("\n");
  await sendMessage(
    chatId,
    `*Decision posted!*\n\n🎲 *${title}*\n${description}\n\nOptions:\n${optionsList}\n\n_Others can now vote on this at i-walked-out.vercel.app or with /decisions_`
  );
}

// ─── /decisions — browse active decisions ───

async function handleDecisions(chatId: number) {
  const db = getAdmin();
  const { data: decisions } = await db
    .from("sticky_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!decisions || decisions.length === 0) {
    await sendMessage(chatId, "No decisions posted yet. Be the first with /sticky");
    return;
  }

  const lines = decisions.map((d, i) => {
    const options = (d.options || []) as string[];
    const optStr = options.map((o: string, j: number) => `  ${j + 1}. ${o}`).join("\n");
    return (
      `*${i + 1}. ${d.title}* (${d.total_votes} votes)\n` +
      `${d.description}\n` +
      `${optStr}\n` +
      `_— ${d.anonymous_alias}_\n` +
      `Vote: /vote ${i + 1} <option\\_number>`
    );
  });

  await sendMessage(
    chatId,
    `🎲 *Sticky Decisions*\n\n${lines.join("\n\n")}`
  );
}

// ─── /vote — vote on a decision ───

async function handleVote(chatId: number, text: string) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const parts = text.split(/\s+/);
  const decisionNum = parseInt(parts[1]);
  const optionNum = parseInt(parts[2]);

  if (!decisionNum || !optionNum) {
    await sendMessage(
      chatId,
      "Usage: /vote <decision\\_number> <option\\_number>\n\nSee decisions with /decisions"
    );
    return;
  }

  const db = getAdmin();
  const { data: decisions } = await db
    .from("sticky_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!decisions || decisionNum > decisions.length || decisionNum < 1) {
    await sendMessage(chatId, "Invalid decision number. Check /decisions");
    return;
  }

  const decision = decisions[decisionNum - 1];
  const options = (decision.options || []) as string[];

  if (optionNum < 1 || optionNum > options.length) {
    await sendMessage(chatId, `Invalid option. This decision has ${options.length} options.`);
    return;
  }

  const { error } = await db.from("sticky_votes").insert({
    decision_id: decision.id,
    user_id: link.user_id,
    chosen_option: optionNum - 1,
  });

  if (error) {
    if (error.code === "23505") {
      await sendMessage(chatId, "You already voted on this one!");
    } else {
      await sendMessage(chatId, "Failed to vote. Try again.");
    }
    return;
  }

  await sendMessage(
    chatId,
    `Voted *"${options[optionNum - 1]}"* on *"${decision.title}"*`
  );
}

// ─── /help ───

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    `*I Walked Out — Commands*\n\n` +
      `👻 *Dead Dreams*\n` +
      `/dream title | desc | category — Log a dream\n` +
      `/feed — Browse the graveyard\n\n` +
      `🪞 *AI Personality Mirror*\n` +
      `/personality — Generate your profile\n` +
      `/chat — Talk to your future self\n` +
      `/dugdug — Talk to dug-dug (the unhinged communal AI)\n` +
      `/exit — Leave chat mode\n\n` +
      `🎲 *Sticky Decisions*\n` +
      `/sticky title | desc | opt1 | opt2 — Post a decision\n` +
      `/decisions — Browse & vote\n` +
      `/vote <num> <option> — Cast your vote\n\n` +
      `✨ *Vibe Coding IRL*\n` +
      `/vibe <phrase> — Life recs from a feeling\n\n` +
      `🔗 *Account*\n` +
      `/connect <email> — Link with your signup email\n` +
      `/link <code> — Or use a code from dashboard\n\n` +
      `_Hand the world something gentler than it gave you._`
  );
}
