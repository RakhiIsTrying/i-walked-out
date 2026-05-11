import { NextResponse } from "next/server";
import { getAI, MODEL } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const seed = Math.floor(Math.random() * 9000) + 1000;
  const decades = ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  const forcedDecade = decades[Math.floor(Math.random() * decades.length)];
  const regions = ["East Asia", "Latin America", "Scandinavia", "Eastern Europe", "South Asia", "Middle East", "West Africa", "Southeast Asia", "Mediterranean", "Oceania"];
  const forcedRegion = regions[Math.floor(Math.random() * regions.length)];

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 1.4,
    messages: [
      {
        role: "user",
        content: `You are a "Vibe Coding IRL" engine. You translate feelings into real-life experiences. Your job is to FEEL what the user is saying — not match keywords, but match the emotional frequency.

The user's vibe: "${query.trim()}"

SEED: ${seed} — use this to randomize your picks. Different seed = completely different recommendations.

CRITICAL RULES:
- Feel the EMOTION underneath the words. "3am existential clarity" isn't about nighttime — it's about that raw, stripped-down honesty when defenses are down. Match THAT feeling.
- At least one recommendation must come from ${forcedRegion} or be influenced by that region's culture.
- The movie OR tv_show must be from the ${forcedDecade} or earlier — dig deep, not surface-level picks.
- NEVER pick these overused defaults: Lost in Translation, Eternal Sunshine, Amélie, The Secret Life of Walter Mitty, Into the Wild, Midnight in Paris, Before Sunrise, Garden State, Her (2013), The Grand Budapest Hotel. Pick something the user has probably never heard of.
- NEVER pick Radiohead, Bon Iver, or Tame Impala for music unless the vibe is literally about them.
- Every recommendation must feel like a discovery, not a "best of" list.
- The song and album should be from DIFFERENT artists.
- Be specific: name the exact dish, the exact neighborhood, the exact episode to start with.

Return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "place": "<A specific real place — a neighborhood, a bench, a market stall, not just a city>",
  "place_location": "<Full location for Google Maps>",
  "movie": "<A specific movie that FEELS like this vibe — obscure is better than obvious>",
  "movie_platform": "<Where to watch: Netflix, Prime Video, Hulu, Apple TV+, HBO Max, Disney+, Mubi, Criterion, etc.>",
  "tv_show": "<A specific TV show — name the season/episode to start with if relevant>",
  "tv_show_platform": "<Where to watch>",
  "food": "<A specific dish at a specific place — 'the spicy lamb hand-pulled noodles at Xi'an Famous Foods, NYC' not just 'ramen'>",
  "food_location": "<Restaurant name, City, Country>",
  "game": "<A specific game that puts you in this emotional state>",
  "game_platform": "<Platform>",
  "song": "<A specific song — artist must NOT be the same as the album artist below>",
  "song_artist": "<Artist>",
  "song_album": "<Album>",
  "music_album": "<A full album to listen front-to-back — different artist from the song above>",
  "music_album_artist": "<Artist>",
  "youtube": "<A specific YouTube video — essays, short films, or obscure content preferred over mainstream>",
  "vibe_summary": "<1-2 sentences: what emotion you detected and why these specific picks resonate with it>"
}`,
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
