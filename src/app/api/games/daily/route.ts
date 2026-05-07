import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getDayNumber } from "@/lib/games";
import { WORDLE_ANSWERS, PANGRAM_SEEDS } from "@/lib/words";
import {
  DailyPuzzles,
  generateWordle,
  generateCrossword,
  generateSpellingBee,
  generateSudoku,
  generateSudokuForDay,
  generateTango,
  generateTangoForDay,
  buildCrosswordFromFallback,
  buildSpellingResult,
} from "@/lib/generators";

/* ──────────────────────────────────────────
   Supabase table (run once in dashboard):

   CREATE TABLE daily_puzzles (
     date DATE PRIMARY KEY,
     puzzles JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "public read" ON daily_puzzles
     FOR SELECT USING (true);
   ────────────────────────────────────────── */

function makeRng(dayNum: number, offset: number) {
  let s = (dayNum + offset) * 2654435761;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const today = new Date().toISOString().split("T")[0];
  const targetDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const isToday = targetDate === today;

  // Try Supabase cache
  try {
    const { data } = await getAdmin()
      .from("daily_puzzles")
      .select("puzzles")
      .eq("date", targetDate)
      .single();
    if (data?.puzzles) {
      return NextResponse.json(data.puzzles, {
        headers: { "Cache-Control": isToday ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=86400" },
      });
    }
  } catch {}

  // For past dates with no cache, use deterministic fallbacks only (no AI calls)
  if (!isToday) {
    const dayNum = Math.floor((new Date(targetDate).getTime() - new Date("2025-01-01").getTime()) / 86400000);

    const wordleRng = makeRng(dayNum, 42);
    const wordle = { answer: WORDLE_ANSWERS[Math.floor(wordleRng() * WORDLE_ANSWERS.length)].toUpperCase() };

    const sudoku = generateSudokuForDay(dayNum);

    const spellingRng = makeRng(dayNum, 77);
    const seedIdx = Math.floor(spellingRng() * PANGRAM_SEEDS.length);
    const seed = PANGRAM_SEEDS[seedIdx];
    const outer = seed.letters.filter((l) => l !== seed.center);
    const spelling = buildSpellingResult(seed.center, outer)!;

    const crossword = buildCrosswordFromFallback(dayNum);
    const tango = generateTangoForDay(dayNum);

    const puzzles: DailyPuzzles = { date: targetDate, wordle, crossword, spelling, sudoku, tango };

    try {
      await getAdmin().from("daily_puzzles").upsert({ date: targetDate, puzzles });
    } catch {}

    return NextResponse.json(puzzles, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  }

  // Generate fresh for today (with AI)
  const [wordle, crossword, spelling] = await Promise.all([
    generateWordle(),
    generateCrossword(),
    generateSpellingBee(),
  ]);
  const sudoku = generateSudoku();
  const tango = generateTango();

  const puzzles: DailyPuzzles = { date: today, wordle, crossword, spelling, sudoku, tango };

  // Cache in Supabase
  try {
    await getAdmin().from("daily_puzzles").upsert({ date: today, puzzles });
  } catch {}

  return NextResponse.json(puzzles, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
