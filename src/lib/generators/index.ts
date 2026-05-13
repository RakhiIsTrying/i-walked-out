export type { WordlePuzzle, CrosswordPuzzle, SpellingPuzzle, SudokuPuzzle, TangoPuzzle, DailyPuzzles, CrosswordVariant } from "./types";
export { generateWordle } from "./wordle";
export { generateCrossword, generateCrosswordVariant, generateDailyTheme } from "./crossword";
export { generateSpellingBee, buildSpellingResult, scoreSpellingWord } from "./spelling";
export { generateSudoku, generateSudokuForDay } from "./sudoku";
export { generateTango, generateTangoForDay } from "./tango";
export { fallbackWordle, fallbackSudoku, fallbackTango, fallbackSpelling, fallbackCrossword } from "./fallbacks";

import type { WordlePuzzle } from "./types";
import { fallbackWordle } from "./fallbacks";
import { getAdmin } from "@/lib/supabase/admin";

export async function getRecentWordleWords(): Promise<Set<string>> {
  try {
    const { data } = await getAdmin()
      .from("daily_puzzles")
      .select("puzzles")
      .order("date", { ascending: false })
      .limit(60);
    const words = new Set<string>();
    for (const row of data || []) {
      const answer = row.puzzles?.wordle?.answer;
      if (answer) words.add(answer.toUpperCase());
    }
    return words;
  } catch {
    return new Set();
  }
}

export function dedupeWordle(
  candidate: WordlePuzzle,
  recentWords: Set<string>,
  dateStr: string,
): WordlePuzzle {
  if (!recentWords.has(candidate.answer.toUpperCase())) return candidate;
  return fallbackWordle(dateStr, recentWords);
}
