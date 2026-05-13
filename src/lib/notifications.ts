import { getAdmin } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";

const SITE_URL = "https://i-walked-out.vercel.app";

export async function notifyDailyPuzzles(date: string) {
  const db = getAdmin();

  // Dedup: check if already notified (column may not exist yet)
  try {
    const { data } = await db
      .from("daily_puzzles")
      .select("notified_at")
      .eq("date", date)
      .single();
    if (data?.notified_at) return { skipped: true };
  } catch {}

  const [tg, email] = await Promise.allSettled([
    notifyTelegram(date),
    notifyEmail(date),
  ]);

  // Mark as notified
  try {
    await db
      .from("daily_puzzles")
      .update({ notified_at: new Date().toISOString() })
      .eq("date", date);
  } catch {}

  return {
    telegram: tg.status === "fulfilled" ? tg.value : { sent: 0 },
    email: email.status === "fulfilled" ? email.value : { sent: 0 },
  };
}

async function notifyTelegram(date: string) {
  const db = getAdmin();
  const { data: links } = await db
    .from("telegram_links")
    .select("telegram_chat_id");

  if (!links || links.length === 0) return { sent: 0 };

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const msg =
    `🧩 *Daily Puzzles Ready!*\n\n` +
    `${dateLabel}\n` +
    `Fresh Wordle, Sudoku, Crossword, Spelling Bee & Tango.\n\n` +
    `[Play now →](${SITE_URL}/games)`;

  let sent = 0;
  for (const link of links) {
    try {
      await sendMessage(link.telegram_chat_id, msg);
      sent++;
    } catch (e) {
      console.error(
        `[notify] telegram ${link.telegram_chat_id}:`,
        e instanceof Error ? e.message : String(e),
      );
    }
    if (sent % 25 === 0 && sent > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return { sent };
}

async function notifyEmail(date: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, skipped: "no RESEND_API_KEY" };

  const db = getAdmin();
  const { data: profiles } = await db
    .from("profiles")
    .select("email")
    .not("email", "is", null);

  if (!profiles || profiles.length === 0) return { sent: 0 };

  const emails = profiles
    .map((p) => p.email)
    .filter((e): e is string => !!e);
  if (emails.length === 0) return { sent: 0 };

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
  <h2 style="color:#c4b5fd;margin:0 0 8px;">🧩 Daily Puzzles Ready</h2>
  <p style="color:#888;margin:0 0 20px;">${dateLabel}</p>
  <p style="color:#e2e8f0;line-height:1.6;">Fresh Wordle, Sudoku, Crossword, Spelling Bee & Tango waiting for you.</p>
  <a href="${SITE_URL}/games" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Play Now →</a>
  <p style="color:#64748b;font-size:12px;margin-top:32px;">You're receiving this because you have an account on I Walked Out.<br/>
  <a href="${SITE_URL}" style="color:#64748b;">Unsubscribe</a></p>
</div>`.trim();

  // Batch send (max 100 per Resend batch)
  const batches: string[][] = [];
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(emails.slice(i, i + 100));
  }

  let sent = 0;
  for (const batch of batches) {
    try {
      const payload = batch.map((to) => ({
        from: fromEmail,
        to,
        subject: `🧩 Daily Puzzles — ${dateLabel}`,
        html,
      }));

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        sent += batch.length;
      } else {
        console.error("[notify] email batch failed:", await res.text());
      }
    } catch (e) {
      console.error(
        "[notify] email batch error:",
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  return { sent };
}
