import { NextResponse } from "next/server";
import { getAI, MODEL } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a "Vibe Coding IRL" engine. The user types a random phrase or vibe, and you translate it into real-life recommendations.

The user's vibe: "${query.trim()}"

Return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "place": "<A specific real place to visit — be creative and specific>",
  "place_location": "<City, Country or full address for Google Maps>",
  "movie": "<A specific movie to watch that captures this vibe>",
  "movie_platform": "<Where to watch: Netflix, Prime Video, Hulu, Apple TV+, HBO Max, Disney+, Mubi, Criterion, etc.>",
  "tv_show": "<A specific TV show to binge that lives in this vibe>",
  "tv_show_platform": "<Where to watch: Netflix, Prime Video, Hulu, Apple TV+, HBO Max, Disney+, etc.>",
  "food": "<A specific dish AND a specific restaurant or food spot to try it at>",
  "food_location": "<Restaurant name, City, Country for Google Maps>",
  "game": "<A specific game (video game, board game, sport, or activity) to play>",
  "game_platform": "<Platform: PC, PlayStation, Xbox, Nintendo Switch, Mobile, Board Game, etc.>",
  "song": "<A specific song that IS this vibe>",
  "song_artist": "<The artist name>",
  "song_album": "<The album this song is from>",
  "music_album": "<A specific album to listen front-to-back for this vibe>",
  "music_album_artist": "<The artist name>",
  "youtube": "<A specific YouTube video title + channel to search for>",
  "vibe_summary": "<A 1-2 sentence poetic interpretation of their vibe and why these recommendations fit>"
}

Be unexpected, specific, and interesting. Avoid obvious choices. Match the ENERGY of the vibe, not just the literal words.`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    return NextResponse.json(
      { error: "Failed to generate vibe" },
      { status: 500 }
    );
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      return NextResponse.json(
        { error: "Failed to parse vibe" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ...result, query: query.trim() });
}
