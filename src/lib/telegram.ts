const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN!;

export async function sendMessage(
  chatId: number,
  text: string,
  parseMode: "Markdown" | "HTML" = "Markdown"
) {
  await fetch(
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
}
