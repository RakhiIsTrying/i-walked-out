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
  return NextResponse.json(data);
}
