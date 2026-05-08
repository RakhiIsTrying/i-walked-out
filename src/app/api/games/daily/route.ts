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
} from "@/lib/generators";

const MIN_DATE = "2026-05-05";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const refresh = searchParams.get("refresh") === "true";
  const refreshGame = searchParams.get("game");
  const today = new Date().toISOString().split("T")[0];
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

  try {
    const [theme, wordle, spelling, sudoku, tango] = await Promise.all([
      generateDailyTheme(targetDate),
      generateWordle(dateLabel),
      generateSpellingBee(dateLabel),
      generateSudoku(),
      generateTango(),
    ]);

    const crossword = await generateCrosswordVariant("normal", theme);

    const puzzles: DailyPuzzles = { date: targetDate, wordle, crossword, spelling, sudoku, tango };

    try {
      await getAdmin().from("daily_puzzles").upsert({ date: targetDate, puzzles });
    } catch {}

    return NextResponse.json(puzzles, { headers: { "Cache-Control": cacheHeader } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[daily] generation failed:", msg);
    if (existing) {
      return NextResponse.json(existing, { headers: { "Cache-Control": cacheHeader } });
    }
    return NextResponse.json(
      { error: "Puzzle generation failed", detail: msg },
      { status: 500 }
    );
  }
}
