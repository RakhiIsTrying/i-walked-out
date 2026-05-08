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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const refresh = searchParams.get("refresh") === "true";
  const today = new Date().toISOString().split("T")[0];
  const targetDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const isToday = targetDate === today;

  if (!refresh) {
    try {
      const { data } = await getAdmin()
        .from("daily_puzzles")
        .select("puzzles")
        .eq("date", targetDate)
        .single();
      if (data?.puzzles?.crossword?.theme) {
        return NextResponse.json(data.puzzles, {
          headers: { "Cache-Control": isToday ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=86400" },
        });
      }
    } catch {}
  }

  try {
    // Round 1: theme + wordle + spelling in parallel
    const [theme, wordle, spelling] = await Promise.all([
      generateDailyTheme(isToday ? undefined : targetDate),
      generateWordle(),
      generateSpellingBee(),
    ]);

    // Round 2: crossword + sudoku + tango in parallel
    const [crossword, sudoku, tango] = await Promise.all([
      generateCrosswordVariant("normal", theme),
      generateSudoku(),
      generateTango(),
    ]);

    const puzzles: DailyPuzzles = { date: targetDate, wordle, crossword, spelling, sudoku, tango };

    try {
      await getAdmin().from("daily_puzzles").upsert({ date: targetDate, puzzles });
    } catch {}

    return NextResponse.json(puzzles, {
      headers: { "Cache-Control": isToday ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=86400" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[daily] generation failed:", msg);
    return NextResponse.json(
      { error: "Puzzle generation failed", detail: msg },
      { status: 500 }
    );
  }
}
