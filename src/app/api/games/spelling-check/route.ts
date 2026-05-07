import { NextResponse } from "next/server";
import { DICTIONARY, VALID_GUESSES } from "@/lib/words";

const DICT_SET = new Set(DICTIONARY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word")?.toLowerCase().trim();

  if (!word || word.length < 4 || !/^[a-z]+$/.test(word)) {
    return NextResponse.json({ valid: false });
  }

  if (DICT_SET.has(word) || VALID_GUESSES.has(word)) {
    return NextResponse.json(
      { valid: true },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(3000) },
    );
    return NextResponse.json(
      { valid: res.ok },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json(
      { valid: true },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  }
}
