import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";

export async function GET() {
  const db = getAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: cached } = await db
    .from("nigel_daily")
    .select("thought")
    .eq("date", today)
    .single();

  if (cached?.thought) {
    return NextResponse.json({ thought: cached.thought, date: today });
  }

  const { data: dreams } = await db
    .from("dreams")
    .select("title, category, emotion")
    .order("created_at", { ascending: false })
    .limit(20);

  const categories = (dreams || []).map((d) => d.category);
  const emotions = (dreams || []).map((d) => d.emotion);
  const topCategory = mode(categories) || "career";
  const topEmotion = mode(emotions) || "relief";

  const dreamTitles = (dreams || [])
    .slice(0, 8)
    .map((d) => `"${d.title}"`)
    .join(", ");

  try {
    const completion = await getAI().chat.completions.create({
      model: MODEL,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: `You are Nigel Bottomsworth-Pemberton, a satirist assembled from abandoned dreams. You write one short daily observation (1-2 sentences, max 30 words) about quitting patterns you've noticed. Your tone: deadpan, Ricky Gervais-level funny, brutally specific. No hashtags, no emojis, no encouragement. Lowercase only.`,
        },
        {
          role: "user",
          content: `Today's trending quit theme: people walking away from "${topCategory}" dreams, feeling "${topEmotion}". Recent abandoned dreams include: ${dreamTitles}. Write your thought of the day — one sharp, funny observation about this pattern.`,
        },
      ],
    });

    const thought =
      completion.choices[0]?.message?.content?.trim() ||
      getFallbackThought(today);

    await db.from("nigel_daily").upsert(
      { date: today, thought, category: topCategory, emotion: topEmotion },
      { onConflict: "date" }
    );

    return NextResponse.json({ thought, date: today });
  } catch {
    return NextResponse.json({
      thought: getFallbackThought(today),
      date: today,
    });
  }
}

function mode(arr: string[]): string | null {
  if (!arr.length) return null;
  const counts: Record<string, number> = {};
  for (const v of arr) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

const FALLBACK_THOUGHTS = [
  "another day, another dream quietly moved to the 'someday' folder. the folder is full.",
  "noticed a spike in people quitting creative projects. the guitar industry remains unaffected.",
  "everyone's walking away from things today. must be a tuesday.",
  "the collective abandoned dream count went up again. humanity remains on brand.",
  "i'm made of dead dreams and even i'm impressed by how many new ones arrived today.",
  "someone quit something meaningful today. they'll call it 'pivoting' by thursday.",
  "the quit-to-start ratio is holding steady at its traditional level of 'basically everyone.'",
];

function getFallbackThought(date: string): string {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash + date.charCodeAt(i)) | 0;
  }
  return FALLBACK_THOUGHTS[Math.abs(hash) % FALLBACK_THOUGHTS.length];
}
