import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";
import { handleStart, handleConnect, handleLink } from "@/lib/telegram/auth";
import { handleDream, handleFeed, handleDailyPrompt } from "@/lib/telegram/dreams";
import { handleVibe, handleBucket } from "@/lib/telegram/vibe";
import { handlePersonality, handleChatMode, handleExitChat, handleDugDugMode } from "@/lib/telegram/chat";
import { handleSticky, handleDecisions, handleVote } from "@/lib/telegram/sticky";
import { handleWordleStart, handleBeeStart, handleEndGame, handleGameLeaderboard, handleGamesStatus } from "@/lib/telegram/games";
import { handleFreeText } from "@/lib/telegram/intent";
import { handleHelp } from "@/lib/telegram/help";

export const maxDuration = 60;

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
    } else if (text.startsWith("/nigel")) {
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
    } else if (text.startsWith("/games")) {
      await handleGamesStatus(chatId);
    } else if (text.startsWith("/bucket")) {
      await handleBucket(chatId, text);
    } else if (text.startsWith("/prompt")) {
      await handleDailyPrompt(chatId);
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
