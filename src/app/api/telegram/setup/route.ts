import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { secret } = await request.json();
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `https://i-walked-out.vercel.app/api/telegram`;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET?.trim(),
        allowed_updates: ["message"],
      }),
    }
  );

  const data = await res.json();

  await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "dream", description: "Log a dead dream" },
        { command: "feed", description: "Browse the graveyard" },
        { command: "vibe", description: "Life recs from a feeling" },
        { command: "bucket", description: "View your bucket list" },
        { command: "games", description: "Today's games & your status" },
        { command: "wordle", description: "Play today's Wordle" },
        { command: "bee", description: "Play today's Spelling Bee" },
        { command: "endgame", description: "Quit current game" },
        { command: "leaderboard", description: "View top players" },
        { command: "sticky", description: "Post a decision for strangers" },
        { command: "decisions", description: "Browse & vote on decisions" },
        { command: "personality", description: "Generate your personality" },
        { command: "chat", description: "Talk to your future self" },
        { command: "dugdug", description: "Talk to dug-dug" },
        { command: "exit", description: "Leave chat mode" },
        { command: "connect", description: "Link your account" },
        { command: "help", description: "All commands" },
      ],
    }),
  });

  return NextResponse.json(data);
}
