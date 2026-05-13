import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export const maxDuration = 120;
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

const MIN_DATE = "2026-05-05";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const refresh = searchParams.get("refresh") === "true";
  const refreshGame = searchParams.get("game");
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const today = new Date(now.getTime() + istOffset).toISOString().split("T")[0];
  const targetDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const isToday = targetDate === today;

  if (targetDate < MIN_DATE || targetDate > today) {
    return NextResponse.json({ error: "Date out of range" }, { status: 400 });
  }

  const cacheHeader = isToday
    ? "public, s-maxage=60, stale-while-revalidate=300"
    : "public, s-maxage=86400, stale-while-revalidate=604800";

  let existing: DailyPuzzles | null = null;
  try {
    const { data } = await getAdmin()
      .from("daily_puzzles")
      .select("puzzles")
      .eq("date", targetDate)
      .single();
    if (data?.puzzles) existing = data.puzzles;
  } catch {}

  if (existing && !refresh && !refreshGame) {
    if (!existing.crossword) {
      const cw = fallbackCrossword(targetDate);
      if (cw) {
        existing.crossword = cw;
        try { await getAdmin().from("daily_puzzles").upsert({ date: targetDate, puzzles: existing }); } catch {}
      }
    }
    return NextResponse.json(existing, { headers: { "Cache-Control": cacheHeader } });
  }

  if (refreshGame === "crossword") {
    try {
      const theme = existing?.crossword?.theme || await generateDailyTheme(targetDate);
      const crossword = await generateCrosswordVariant("normal", theme);
      if (existing) {
        existing.crossword = crossword;
      } else {
        existing = { date: targetDate, crossword } as DailyPuzzles;
      }
      await getAdmin().from("daily_puzzles").upsert({ date: targetDate, puzzles: existing });
      return NextResponse.json(existing, { headers: { "Cache-Control": cacheHeader } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (existing) return NextResponse.json(existing, { headers: { "Cache-Control": cacheHeader } });
      return NextResponse.json({ error: "Refresh failed", detail: msg }, { status: 500 });
    }
  }

  const dateLabel = new Date(targetDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // Generate all puzzles in parallel — individual failures don't kill the rest
  const results = await Promise.allSettled([
    generateDailyTheme(targetDate),
    generateWordle(dateLabel),
    generateSpellingBee(dateLabel),
    generateSudoku(),
    generateTango(dateLabel),
  ]);

  const names = ["theme", "wordle", "spelling", "sudoku", "tango"];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      console.error(`[daily] ${names[i]} AI failed, using fallback:`, (results[i] as PromiseRejectedResult).reason);
    }
  }

  const theme = results[0].status === "fulfilled" ? results[0].value : "Daily Puzzle";
  const recentWords = await getRecentWordleWords();
  const rawWordle = results[1].status === "fulfilled" ? results[1].value : fallbackWordle(targetDate, recentWords);
  const wordle = dedupeWordle(rawWordle, recentWords, targetDate);
  const spelling = results[2].status === "fulfilled" ? results[2].value : fallbackSpelling(targetDate);
  const sudoku = results[3].status === "fulfilled" ? results[3].value : fallbackSudoku(targetDate);
  const tango = results[4].status === "fulfilled" ? results[4].value : fallbackTango(targetDate);

  // Crossword: try normal (15x15), fall back to mini (5x5) if that fails
  let crossword = existing?.crossword;
  if (!crossword) {
    try {
      crossword = await generateCrosswordVariant("normal", theme);
    } catch (e) {
      console.error("[daily] normal crossword failed, trying mini:", e instanceof Error ? e.message : String(e));
      try {
        crossword = await generateCrosswordVariant("mini", theme);
      } catch (e2) {
        console.error("[daily] mini crossword also failed, using deterministic fallback:", e2 instanceof Error ? e2.message : String(e2));
        crossword = fallbackCrossword(targetDate) ?? undefined;
      }
    }
  }

  const puzzles: DailyPuzzles = {
    date: targetDate,
    wordle,
    sudoku,
    tango,
    ...(spelling ? { spelling } : {}),
    ...(crossword ? { crossword } : {}),
  };

  try {
    await getAdmin().from("daily_puzzles").upsert({ date: targetDate, puzzles });
  } catch {}

  return NextResponse.json(puzzles, { headers: { "Cache-Control": cacheHeader } });
}
