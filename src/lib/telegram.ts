const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN!.trim();

export async function sendMessage(
  chatId: number,
  text: string,
  parseMode: "Markdown" | "HTML" = "Markdown"
) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Telegram sendMessage failed:", res.status, err);
    if (parseMode === "Markdown") {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        }
      );
    }
  }
}
