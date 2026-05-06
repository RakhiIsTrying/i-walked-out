import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { moderateTexts } from "@/lib/moderate";
import { getDayNumber, getDailyRng, seededPick } from "@/lib/games";
import { WORDLE_ANSWERS, VALID_GUESSES, DICTIONARY, PANGRAM_SEEDS } from "@/lib/words";

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
    } else if (text.startsWith("/wordle")) {
      await handleWordleStart(chatId);
    } else if (text.startsWith("/bee")) {
      await handleBeeStart(chatId);
    } else if (text.startsWith("/leaderboard")) {
      await handleGameLeaderboard(chatId, text);
    } else if (text.startsWith("/endgame") || text.startsWith("/quit")) {
      await handleEndGame(chatId);
    } else if (text.startsWith("/bucket")) {
      await handleBucket(chatId, text);
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
      `▶️ *YouTube:* ${result.youtube}\n\n` +
      `_Save any to your bucket list:_\n` +
      `/bucket add place | ${result.place} | ${query}\n` +
      `/bucket add movie | ${result.movie} | ${query}`
  );

  const link = await getUserLink(chatId);
  if (link) {
    const db = getAdmin();
    await db.from("vibe_searches").insert({
      user_id: link.user_id,
      query,
      results: result,
    }).then(() => {});
  }
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

  // Check for active game sessions (single-word alpha input)
  if (/^[a-zA-Z]+$/.test(text)) {
    if (text.length === 5) {
      const ws = await getGameState(chatId, "wordle");
      if (ws && !ws.gameOver) {
        await handleWordleGuess(chatId, link.user_id, text.toUpperCase(), ws);
        return;
      }
    }
    if (text.length >= 4) {
      const bs = await getGameState(chatId, "spelling");
      if (bs && !bs.gameOver) {
        await handleBeeGuess(chatId, link.user_id, text.toLowerCase(), bs);
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
      `/vibe <phrase> — Life recs from a feeling\n` +
      `/bucket — View your bucket list\n` +
      `/bucket add <cat> | <item> — Add to list\n` +
      `/bucket done <num> — Check off an item\n\n` +
      `🎮 *Games*\n` +
      `/wordle — Play today's Wordle\n` +
      `/bee — Play today's Spelling Bee\n` +
      `/endgame — Quit current game\n` +
      `/leaderboard — View top players\n\n` +
      `🔗 *Account*\n` +
      `/connect <email> — Link with your signup email\n` +
      `/link <code> — Or use a code from dashboard\n\n` +
      `_Hand the world something gentler than it gave you._`
  );
}

// ─── Game State Helpers ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getGameState(chatId: number, gameType: string): Promise<any | null> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db
    .from("telegram_game_state")
    .select("state")
    .eq("telegram_chat_id", chatId)
    .eq("game_type", gameType)
    .eq("game_date", today)
    .single();
  return data?.state || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setGameState(chatId: number, gameType: string, state: any) {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  await db.from("telegram_game_state").upsert({
    telegram_chat_id: chatId,
    game_type: gameType,
    game_date: today,
    state,
    updated_at: new Date().toISOString(),
  }, { onConflict: "telegram_chat_id,game_type,game_date" });
}

async function getTodayWordleAnswer(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db.from("daily_puzzles").select("puzzles").eq("date", today).single();
  if (data?.puzzles?.wordle?.answer) return data.puzzles.wordle.answer.toUpperCase();
  const rng = getDailyRng(42);
  return seededPick(WORDLE_ANSWERS, rng).toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTodayBeeData(): Promise<any> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db.from("daily_puzzles").select("puzzles").eq("date", today).single();
  if (data?.puzzles?.spelling) return data.puzzles.spelling;
  const rng = getDailyRng(77);
  const seed = seededPick(PANGRAM_SEEDS, rng);
  const outer = seed.letters.filter((l: string) => l !== seed.center);
  const allLetters = new Set([seed.center, ...outer]);
  const validWords = DICTIONARY.filter((word: string) => {
    if (word.length < 4) return false;
    if (!word.includes(seed.center)) return false;
    for (const ch of word) { if (!allLetters.has(ch)) return false; }
    return true;
  });
  const maxScore = validWords.reduce((sum: number, w: string) => {
    if (w.length === 4) return sum + 1;
    let s = w.length;
    const unique = new Set(w);
    if (allLetters.size === unique.size && [...allLetters].every(l => unique.has(l))) s += 7;
    return sum + s;
  }, 0);
  return { center: seed.center, outer, validWords, maxScore };
}

function evalWordleGuess(guess: string, answer: string): ("correct" | "present" | "absent")[] {
  const result: ("correct" | "present" | "absent")[] = Array(5).fill("absent");
  const ansLetters = answer.split("");
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) { result[i] = "correct"; ansLetters[i] = ""; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = ansLetters.indexOf(guess[i]);
    if (idx !== -1) { result[i] = "present"; ansLetters[idx] = ""; }
  }
  return result;
}

function formatWordleRow(guess: string, states: ("correct" | "present" | "absent")[]): string {
  const emoji = states.map(s => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("");
  return `${emoji}  ${guess}`;
}

async function isValidWordleGuess(word: string): Promise<boolean> {
  if (VALID_GUESSES.has(word.toLowerCase())) return true;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch { return false; }
}

function scoreBeeWord(word: string, allLetters: Set<string>): number {
  if (word.length === 4) return 1;
  let s = word.length;
  const unique = new Set(word);
  if (allLetters.size === unique.size && [...allLetters].every(l => unique.has(l))) s += 7;
  return s;
}

function getBeeRank(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.7) return "Genius";
  if (pct >= 0.5) return "Amazing";
  if (pct >= 0.3) return "Great";
  if (pct >= 0.15) return "Nice";
  if (pct >= 0.05) return "Good";
  return "Beginner";
}

// ─── /wordle ───

async function handleWordleStart(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const existing = await getGameState(chatId, "wordle");
  if (existing?.gameOver) {
    const grid = (existing.guesses || []).map((g: string, i: number) => formatWordleRow(g, existing.states[i])).join("\n");
    await sendMessage(chatId, `🟩 *WORDLE — Day #${getDayNumber()}*\n\n${grid}\n\n${existing.won ? "You got it!" : `The word was *${existing.answer}*`}\n\nCome back tomorrow for a new puzzle!`);
    return;
  }

  if (existing?.guesses?.length > 0) {
    const grid = existing.guesses.map((g: string, i: number) => formatWordleRow(g, existing.states[i])).join("\n");
    await sendMessage(chatId, `🟩 *WORDLE — ${existing.guesses.length}/6*\n\n${grid}\n\nType a 5-letter word to guess. /endgame to quit.`);
    return;
  }

  await setGameState(chatId, "wordle", { guesses: [], states: [], gameOver: false, won: false });
  await sendMessage(chatId, `🟩 *WORDLE — Day #${getDayNumber()}*\n\nGuess a 5-letter word! You have 6 attempts.\nJust type any 5-letter word.\n\n/endgame to quit.`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleWordleGuess(chatId: number, userId: string, guess: string, state: any) {
  if (guess.length !== 5 || !/^[A-Z]{5}$/.test(guess)) {
    await sendMessage(chatId, "Type a 5-letter word.");
    return;
  }

  const valid = await isValidWordleGuess(guess);
  if (!valid) {
    await sendMessage(chatId, `"${guess}" is not a valid word. Try another.`);
    return;
  }

  const answer = await getTodayWordleAnswer();
  const result = evalWordleGuess(guess, answer);

  const guesses = [...(state.guesses || []), guess];
  const states = [...(state.states || []), result];

  const isWin = result.every(s => s === "correct");
  const isLoss = !isWin && guesses.length >= 6;
  const gameOver = isWin || isLoss;

  await setGameState(chatId, "wordle", { guesses, states, gameOver, won: isWin, answer: gameOver ? answer : undefined });

  const grid = guesses.map((g: string, i: number) => formatWordleRow(g, states[i])).join("\n");

  if (isWin) {
    await sendMessage(chatId, `🟩 *WORDLE — ${guesses.length}/6*\n\n${grid}\n\n🎉 *Got it in ${guesses.length}!*`);
    const db = getAdmin();
    await db.from("game_archives").insert({
      user_id: userId,
      game_type: "wordle",
      won: true,
      score: guesses.length,
      result: { answer, guesses, attempts: guesses.length },
      played_at: new Date().toISOString().split("T")[0],
    });
  } else if (isLoss) {
    await sendMessage(chatId, `🟩 *WORDLE — X/6*\n\n${grid}\n\nThe word was *${answer}*. Better luck tomorrow!`);
    const db = getAdmin();
    await db.from("game_archives").insert({
      user_id: userId,
      game_type: "wordle",
      won: false,
      score: 0,
      result: { answer, guesses, attempts: guesses.length },
      played_at: new Date().toISOString().split("T")[0],
    });
  } else {
    await sendMessage(chatId, `🟩 *${guesses.length}/6*\n\n${grid}\n\nKeep going!`);
  }
}

// ─── /bee (Spelling Bee) ───

async function handleBeeStart(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const puzzle = await getTodayBeeData();
  const existing = await getGameState(chatId, "spelling");

  if (existing?.gameOver) {
    const rank = getBeeRank(existing.score, puzzle.maxScore);
    await sendMessage(chatId, `🐝 *SPELLING BEE — Day #${getDayNumber()}*\n\nYou reached *${rank}*! ${existing.score} pts · ${existing.found.length} words\n\nCome back tomorrow!`);
    return;
  }

  const letters = `*${puzzle.center.toUpperCase()}* ${puzzle.outer.map((l: string) => l.toUpperCase()).join("  ")}`;

  if (existing?.found?.length > 0) {
    const rank = getBeeRank(existing.score, puzzle.maxScore);
    await sendMessage(
      chatId,
      `🐝 *SPELLING BEE*\n\nCenter: ${letters}\n\n${rank} · ${existing.score} pts · ${existing.found.length} words\n\nType a word (4+ letters, must use center). /endgame to quit.`
    );
    return;
  }

  await setGameState(chatId, "spelling", { found: [], score: 0, gameOver: false });
  await sendMessage(
    chatId,
    `🐝 *SPELLING BEE — Day #${getDayNumber()}*\n\nCenter: ${letters}\n\nFind words using these letters (4+ letters). Every word must use the center letter. Letters can repeat.\n\nType a word to guess. /endgame to quit.`
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBeeGuess(chatId: number, userId: string, word: string, state: any) {
  const puzzle = await getTodayBeeData();
  const allLetters = new Set([puzzle.center, ...puzzle.outer]);

  if (word.length < 4) { await sendMessage(chatId, "Too short — need 4+ letters."); return; }
  if (!word.includes(puzzle.center)) { await sendMessage(chatId, `Must use center letter *${puzzle.center.toUpperCase()}*.`); return; }
  for (const ch of word) {
    if (!allLetters.has(ch)) { await sendMessage(chatId, `Letter "${ch.toUpperCase()}" is not in the puzzle.`); return; }
  }
  if ((state.found || []).includes(word)) { await sendMessage(chatId, "Already found that one!"); return; }

  const validSet = new Set(puzzle.validWords);
  let isValid = validSet.has(word);
  if (!isValid) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(3000) });
      isValid = res.ok;
    } catch {}
  }

  if (!isValid) { await sendMessage(chatId, `"${word.toUpperCase()}" is not a valid word.`); return; }

  const pts = scoreBeeWord(word, allLetters);
  const isPangram = new Set(word).size === allLetters.size && [...allLetters].every(l => word.includes(l));
  const found = [...(state.found || []), word];
  const score = (state.score || 0) + pts;
  const rank = getBeeRank(score, puzzle.maxScore);
  const isGenius = rank === "Genius";

  await setGameState(chatId, "spelling", { found, score, gameOver: isGenius });

  let msg = isPangram ? `🎯 *PANGRAM! +${pts}*` : `+${pts}`;
  msg += `\n\n${rank} · ${score} pts · ${found.length} words`;

  if (isGenius) {
    msg += `\n\n🎉 *You reached Genius!* Amazing work!`;
    const db = getAdmin();
    await db.from("game_archives").insert({
      user_id: userId,
      game_type: "spelling",
      won: true,
      score,
      result: { words: found, rank: "Genius", maxScore: puzzle.maxScore },
      played_at: new Date().toISOString().split("T")[0],
    });
  }

  await sendMessage(chatId, `🐝 ${msg}`);
}

// ─── /endgame ───

async function handleEndGame(chatId: number) {
  const link = await getUserLink(chatId);
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();

  let ended = false;
  const ws = await getGameState(chatId, "wordle");
  if (ws && !ws.gameOver) {
    const answer = await getTodayWordleAnswer();
    await setGameState(chatId, "wordle", { ...ws, gameOver: true, won: false, answer });
    if (link) {
      await db.from("game_archives").insert({
        user_id: link.user_id, game_type: "wordle", won: false, score: 0,
        result: { answer, guesses: ws.guesses || [], attempts: (ws.guesses || []).length },
        played_at: today,
      });
    }
    ended = true;
  }

  const bs = await getGameState(chatId, "spelling");
  if (bs && !bs.gameOver) {
    const puzzle = await getTodayBeeData();
    const rank = getBeeRank(bs.score || 0, puzzle.maxScore);
    await setGameState(chatId, "spelling", { ...bs, gameOver: true });
    if (link) {
      await db.from("game_archives").insert({
        user_id: link.user_id, game_type: "spelling", won: rank === "Genius", score: bs.score || 0,
        result: { words: bs.found || [], rank, maxScore: puzzle.maxScore },
        played_at: today,
      });
    }
    ended = true;
  }

  if (ended) {
    await sendMessage(chatId, "Game ended. Your progress was saved.\n\n/wordle or /bee to start a new game tomorrow.");
  } else {
    await sendMessage(chatId, "No active game to end.");
  }
}

// ─── /leaderboard ───

async function handleGameLeaderboard(chatId: number, text: string) {
  const arg = text.replace(/^\/leaderboard\s*/i, "").trim().toLowerCase();
  const tokens = arg.split(/\s+/).filter(Boolean);

  const GAME_NAMES: Record<string, string> = { wordle: "Wordle", crossword: "Crossword", sudoku: "Sudoku", spelling: "Spelling Bee", bee: "Spelling Bee" };
  const GAME_KEYS = new Set(Object.keys(GAME_NAMES));

  let gameFilter: string | null = null;
  let gameLabel = "All Games";
  let periodKey = "daily";
  let periodLabel = "Today";

  for (const t of tokens) {
    if (GAME_KEYS.has(t)) { gameFilter = t === "bee" ? "spelling" : t; gameLabel = GAME_NAMES[t]; }
    else if (t.includes("week")) { periodKey = "weekly"; periodLabel = "This Week"; }
    else if (t.includes("month")) { periodKey = "monthly"; periodLabel = "This Month"; }
    else if (t.includes("year")) { periodKey = "yearly"; periodLabel = "This Year"; }
  }

  const now = new Date();
  let startDate: string;
  switch (periodKey) {
    case "weekly": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      startDate = d.toISOString().split("T")[0];
      break;
    }
    case "monthly":
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      break;
    case "yearly":
      startDate = `${now.getFullYear()}-01-01`;
      break;
    default:
      startDate = now.toISOString().split("T")[0];
  }

  const db = getAdmin();
  let query = db
    .from("game_archives")
    .select("user_id, won, score, game_type")
    .gte("played_at", startDate);

  if (gameFilter) query = query.eq("game_type", gameFilter);

  const { data: archives } = await query;

  if (!archives || archives.length === 0) {
    await sendMessage(chatId, `🏆 *${gameLabel} Leaderboard — ${periodLabel}*\n\nNo games played yet. Be the first!\n\n/wordle or /bee to play.`);
    return;
  }

  const userMap = new Map<string, { wins: number; total_score: number; games_played: number }>();
  for (const row of archives) {
    const e = userMap.get(row.user_id) || { wins: 0, total_score: 0, games_played: 0 };
    e.games_played++;
    if (row.won) e.wins++;
    e.total_score += row.score || 0;
    userMap.set(row.user_id, e);
  }

  const userIds = [...userMap.keys()];
  const { data: profiles } = await db.from("profiles").select("id, anonymous_alias").in("id", userIds);
  const aliasMap = new Map<string, string>();
  for (const p of profiles || []) aliasMap.set(p.id, p.anonymous_alias || "Ghost");

  const board = userIds
    .map(uid => ({ alias: aliasMap.get(uid) || "Ghost", ...userMap.get(uid)! }))
    .sort((a, b) => b.wins - a.wins || b.total_score - a.total_score || b.games_played - a.games_played)
    .slice(0, 10);

  const medals = ["🥇", "🥈", "🥉"];
  const lines = board.map((e, i) => {
    const m = medals[i] || `${i + 1}.`;
    return `${m} *${e.alias}* — ${e.wins}W · ${e.total_score}pts · ${e.games_played} played`;
  });

  await sendMessage(
    chatId,
    `🏆 *${gameLabel} Leaderboard — ${periodLabel}*\n\n${lines.join("\n")}\n\n_Try: /leaderboard wordle weekly, /leaderboard bee monthly, etc._`
  );
}

// ─── /bucket — bucket list from vibe suggestions ───

const BUCKET_CATEGORIES: Record<string, string> = {
  place: "📍 Place",
  movie: "🎬 Movie",
  tv_show: "📺 TV Show",
  food: "🍜 Food",
  game: "🎮 Game",
  song: "🎵 Song",
  music_album: "💿 Album",
  youtube: "▶️ YouTube",
};

async function handleBucket(chatId: number, text: string) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const arg = text.replace(/^\/bucket\s*/i, "").trim();

  if (!arg) {
    await handleBucketList(chatId, link.user_id);
    return;
  }

  const subCmd = arg.split(/\s+/)[0].toLowerCase();
  const rest = arg.slice(subCmd.length).trim();

  if (subCmd === "done" || subCmd === "check") {
    await handleBucketDone(chatId, link.user_id, rest);
  } else if (subCmd === "undo") {
    await handleBucketUndo(chatId, link.user_id, rest);
  } else if (subCmd === "remove" || subCmd === "rm") {
    await handleBucketRemove(chatId, link.user_id, rest);
  } else if (subCmd === "add") {
    await handleBucketAdd(chatId, link.user_id, rest);
  } else {
    await handleBucketAdd(chatId, link.user_id, arg);
  }
}

async function handleBucketList(chatId: number, userId: string) {
  const db = getAdmin();
  const { data: items } = await db
    .from("vibe_bucketlist")
    .select("*")
    .eq("user_id", userId)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (!items || items.length === 0) {
    await sendMessage(
      chatId,
      `📋 *Vibe Bucket List*\n\nEmpty! Generate vibes first, then save items.\n\n` +
        `*How to use:*\n` +
        `1. /vibe <feeling> — get recommendations\n` +
        `2. /bucket add <category> | <item> — save to list\n` +
        `3. /bucket done <number> — check off done items\n\n` +
        `*Categories:* place, movie, tv\\_show, food, game, song, album, youtube\n\n` +
        `_Example: /bucket add place | Shimokitazawa, Tokyo_`
    );
    return;
  }

  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  let msg = `📋 *Vibe Bucket List*\n\n`;

  if (pending.length > 0) {
    msg += `*To Do:*\n`;
    pending.forEach((item, i) => {
      const cat = BUCKET_CATEGORIES[item.category] || item.category;
      msg += `${i + 1}. ${cat} — ${item.item_text}\n   _from "${item.vibe_query}"_\n`;
    });
  }

  if (done.length > 0) {
    msg += `\n*Done:*\n`;
    done.forEach((item) => {
      const cat = BUCKET_CATEGORIES[item.category] || item.category;
      msg += `✅ ~${cat} — ${item.item_text}~\n`;
    });
  }

  msg += `\n${done.length}/${items.length} completed`;
  msg += `\n\n_/bucket done <num> · /bucket undo <num> · /bucket rm <num>_`;

  await sendMessage(chatId, msg);
}

async function handleBucketAdd(chatId: number, userId: string, text: string) {
  const parts = text.split("|").map((p) => p.trim());

  if (parts.length < 2 || !parts[0] || !parts[1]) {
    await sendMessage(
      chatId,
      `*Add to bucket list:*\n` +
        `/bucket add <category> | <item text>\n\n` +
        `*Or with vibe context:*\n` +
        `/bucket add <category> | <item> | <vibe>\n\n` +
        `*Categories:* place, movie, tv\\_show, food, game, song, album, youtube\n\n` +
        `_Example: /bucket add movie | Lost in Translation | 3am existential clarity_`
    );
    return;
  }

  let category = parts[0].toLowerCase().replace(/\s+/g, "_");
  if (category === "tv") category = "tv_show";
  if (category === "album") category = "music_album";

  const validCategories = ["place", "movie", "tv_show", "food", "game", "song", "music_album", "youtube"];
  if (!validCategories.includes(category)) {
    await sendMessage(chatId, `Invalid category "${parts[0]}". Use: place, movie, tv\\_show, food, game, song, album, youtube`);
    return;
  }

  const itemText = parts[1];
  const vibeQuery = parts[2] || "manual add";

  const db = getAdmin();
  const { error } = await db.from("vibe_bucketlist").insert({
    user_id: userId,
    vibe_query: vibeQuery,
    category,
    item_text: itemText,
  });

  if (error) {
    await sendMessage(chatId, "Failed to add. Try again.");
    return;
  }

  const cat = BUCKET_CATEGORIES[category] || category;
  await sendMessage(chatId, `Added to bucket list!\n\n${cat} — *${itemText}*\n\n_/bucket to see your list_`);
}

async function handleBucketDone(chatId: number, userId: string, numStr: string) {
  const num = parseInt(numStr);
  if (!num || num < 1) {
    await sendMessage(chatId, "Which item? /bucket done <number>\n\nSee your list with /bucket");
    return;
  }

  const db = getAdmin();
  const { data: pending } = await db
    .from("vibe_bucketlist")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", false)
    .order("created_at", { ascending: false });

  if (!pending || num > pending.length) {
    await sendMessage(chatId, `No item #${num} in your to-do list. Check /bucket`);
    return;
  }

  const item = pending[num - 1];
  await db
    .from("vibe_bucketlist")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", item.id);

  const cat = BUCKET_CATEGORIES[item.category] || item.category;
  await sendMessage(chatId, `✅ *Done!* ${cat} — ${item.item_text}\n\n_One less thing to dream about, one more thing you lived._`);
}

async function handleBucketUndo(chatId: number, userId: string, numStr: string) {
  const num = parseInt(numStr);
  if (!num || num < 1) {
    await sendMessage(chatId, "Which done item? /bucket undo <number from done list>");
    return;
  }

  const db = getAdmin();
  const { data: done } = await db
    .from("vibe_bucketlist")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("completed_at", { ascending: false });

  if (!done || num > done.length) {
    await sendMessage(chatId, `No done item #${num}. Check /bucket`);
    return;
  }

  const item = done[num - 1];
  await db
    .from("vibe_bucketlist")
    .update({ completed: false, completed_at: null })
    .eq("id", item.id);

  await sendMessage(chatId, `Moved back to to-do: ${item.item_text}`);
}

async function handleBucketRemove(chatId: number, userId: string, numStr: string) {
  const num = parseInt(numStr);
  if (!num || num < 1) {
    await sendMessage(chatId, "Which item? /bucket rm <number>\n\nNumbers match the to-do list in /bucket");
    return;
  }

  const db = getAdmin();
  const { data: pending } = await db
    .from("vibe_bucketlist")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", false)
    .order("created_at", { ascending: false });

  if (!pending || num > pending.length) {
    await sendMessage(chatId, `No item #${num}. Check /bucket`);
    return;
  }

  const item = pending[num - 1];
  await db.from("vibe_bucketlist").delete().eq("id", item.id);

  await sendMessage(chatId, `Removed: ${item.item_text}`);
}
