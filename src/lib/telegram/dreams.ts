import { getAdmin } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";
import { moderateTexts } from "@/lib/moderate";
import { getUserLink } from "./helpers";

export async function handleDream(chatId: number, text: string) {
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

export async function handleFeed(chatId: number) {
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
