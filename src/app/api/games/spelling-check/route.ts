import { NextResponse } from "next/server";
import { DICTIONARY } from "@/lib/words";
import { FIVE_LETTER_WORDS } from "@/lib/wordlist";

const DICT_SET = new Set(DICTIONARY);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word")?.toLowerCase().trim();

  if (!word || word.length < 4 || !/^[a-z]+$/.test(word)) {
    return NextResponse.json({ valid: false });
  }

  if (DICT_SET.has(word) || FIVE_LETTER_WORDS.has(word)) {
    return NextResponse.json(
      { valid: true },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  }

  return NextResponse.json(
    { valid: false },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
