import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { notifyDailyPuzzles } from "@/lib/notifications";
import {
  DailyPuzzles,
  generateWordle,
  generateCrosswordVariant,
  generateSpellingBee,
  generateSudoku,
  generateTango,
  generateDailyTheme,
  fallbackWordle,
  fallbackSudoku,
  fallbackTango,
  fallbackSpelling,
  fallbackCrossword,
  getRecentWordleWords,
  dedupeWordle,
} from "@/lib/generators";

export const maxDuration = 180;

function getISTDate(offsetDays = 0): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  ist.setDate(ist.getDate() + offsetDays);
  return ist.toISOString().split("T")[0];
}

async function generateForDate(targetDate: string): Promise<{ date: string; status: string }> {
  const admin = getAdmin();

  // Skip if already generated
  try {
    const { data } = await admin
      .from("daily_puzzles")
      .select("puzzles")
      .eq("date", targetDate)
      .single();
    if (data?.puzzles?.wordle && data?.puzzles?.sudoku) {
      return { date: targetDate, status: "already exists" };
    }
  } catch {}

  const dateLabel = new Date(targetDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const results = await Promise.allSettled([
    generateDailyTheme(targetDate),
    generateWordle(dateLabel),
    generateSpellingBee(dateLabel),
    generateSudoku(),
    generateTango(dateLabel),
  ]);

  const theme = results[0].status === "fulfilled" ? results[0].value : "Daily Puzzle";
  const recentWords = await getRecentWordleWords();
  const rawWordle = results[1].status === "fulfilled" ? results[1].value : fallbackWordle(targetDate, recentWords);
  const wordle = dedupeWordle(rawWordle, recentWords, targetDate);
  const spelling = results[2].status === "fulfilled" ? results[2].value : fallbackSpelling(targetDate);
  const sudoku = results[3].status === "fulfilled" ? results[3].value : fallbackSudoku(targetDate);
  const tango = results[4].status === "fulfilled" ? results[4].value : fallbackTango(targetDate);

  let crossword;
  try {
    crossword = await generateCrosswordVariant("normal", theme);
  } catch (e) {
    console.error(`[cron] normal crossword failed for ${targetDate}, trying mini:`, e instanceof Error ? e.message : String(e));
    try {
      crossword = await generateCrosswordVariant("mini", theme);
    } catch (e2) {
      console.error(`[cron] mini crossword also failed for ${targetDate}, using deterministic fallback:`, e2 instanceof Error ? e2.message : String(e2));
      crossword = fallbackCrossword(targetDate);
    }
  }

  const failed = results.filter((r) => r.status === "rejected").length;

  const puzzles: DailyPuzzles = {
    date: targetDate,
    wordle,
    sudoku,
    tango,
    ...(spelling ? { spelling } : {}),
    ...(crossword ? { crossword } : {}),
  };

  await admin.from("daily_puzzles").upsert({ date: targetDate, puzzles });

  return {
    date: targetDate,
    status: `generated (${5 - failed}/5 AI, ${failed} fallback${crossword ? ", crossword ok" : ", no crossword"})`,
  };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getISTDate(0);
    const tomorrow = getISTDate(1);

    // Generate today first (usually already cached — instant)
    const todayResult = await generateForDate(today);

    // Send notifications before the slow tomorrow generation
    let notifyResult = null;
    try {
      notifyResult = await notifyDailyPuzzles(today);
    } catch (e) {
      console.error("[cron] notifications failed:", e instanceof Error ? e.message : String(e));
    }

    // Generate tomorrow (slow — AI crossword etc.)
    const tomorrowResult = await generateForDate(tomorrow);

    return NextResponse.json({
      ok: true,
      results: [todayResult, tomorrowResult],
      notifications: notifyResult,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
