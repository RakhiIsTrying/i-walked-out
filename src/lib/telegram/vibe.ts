import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";
import { sendMessage } from "@/lib/telegram";
import { getUserLink } from "./helpers";

export async function handleVibe(chatId: number, text: string) {
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

  const seed = Math.floor(Math.random() * 9000) + 1000;
  const decades = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  const forcedDecade = decades[Math.floor(Math.random() * decades.length)];

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 1.4,
    messages: [
      {
        role: "user",
        content: `You are a "Vibe Coding IRL" engine. Feel the EMOTION in the user's words and translate it into real-life discoveries.

The user's vibe: "${query}"

SEED: ${seed} — randomize picks based on this.

RULES:
- Match the emotional frequency, not keywords. Feel what they MEAN.
- The movie or tv_show must be from the ${forcedDecade} or earlier — dig deep.
- NEVER pick: Lost in Translation, Eternal Sunshine, Amélie, Into the Wild, Her, Grand Budapest Hotel.
- NEVER pick Radiohead, Bon Iver, or Tame Impala for music.
- Song and album must be from DIFFERENT artists.
- Be specific: exact dish, exact neighborhood, exact episode.

Return JSON only (no markdown):
{
  "place": "<Specific place — neighborhood, market, bench, not just a city>",
  "movie": "<Obscure > obvious. Must FEEL like this vibe>",
  "tv_show": "<Specific show, name season/episode if relevant>",
  "food": "<Specific dish at a specific restaurant>",
  "game": "<Game that puts you in this emotional state>",
  "song": "<Song — different artist from album below>",
  "music_album": "<Full album, front-to-back — different artist from song>",
  "youtube": "<Specific video — essays or short films preferred>",
  "vibe_summary": "<What emotion you detected and why these picks fit>"
}`,
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

export async function handleBucket(chatId: number, text: string) {
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
