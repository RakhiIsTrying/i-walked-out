import { NextResponse } from "next/server";
import { DICTIONARY, WORDLE_ANSWERS } from "@/lib/words";
import { FIVE_LETTER_WORDS } from "@/lib/wordlist";

const LOCAL_WORDS = new Set([
  ...DICTIONARY,
  ...WORDLE_ANSWERS,
  ...FIVE_LETTER_WORDS,
]);
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word")?.toLowerCase().trim();

  if (!word || word.length < 4 || !/^[a-z]+$/.test(word)) {
    return NextResponse.json({ valid: false });
  }

  if (LOCAL_WORDS.has(word)) {
    return NextResponse.json({ valid: true }, { headers: CACHE_HEADERS });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(3000) },
    );
    return NextResponse.json({ valid: res.ok }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ valid: false }, { headers: CACHE_HEADERS });
  }
}
