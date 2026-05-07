import { getAdmin } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";
import { getUserLink } from "./helpers";

export async function handleStart(chatId: number, text: string, username: string | null) {
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

export async function handleConnect(chatId: number, text: string, username: string | null) {
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

export async function handleLink(chatId: number, text: string, username: string | null) {
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
