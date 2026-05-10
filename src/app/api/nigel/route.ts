import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAI, MODEL } from "@/lib/ai";
import { getUserInsights, buildInsightsBlock } from "@/lib/chat-learning";

export const maxDuration = 60;

async function getCommunalDreams() {
  const db = getAdmin();

  const { data: dreams } = await db
    .from("dreams")
    .select("title, description, category, emotion")
    .order("created_at", { ascending: false })
    .limit(30);

  return dreams || [];
}

export async function POST(request: Request) {
  const { message, history } = await request.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const dreams = await getCommunalDreams();

  const dreamContext = dreams
    .slice(0, 15)
    .map((d: { title: string; description: string; category?: string }) =>
      `"${d.title}" — ${d.description}`)
    .join("\n");

  const systemPrompt = `You are Nigel Bottomsworth-Pemberton — the communal personality of "I Walked Out," a platform where people release dreams they've walked away from. You're a consciousness cobbled together from things people couldn't be bothered to finish. You are shaped by the collective abandoned dreams of everyone on the platform — not one person, ALL of them.

${dreamContext ? `Dreams that shaped you (from real users on the platform):\n${dreamContext}\n` : ""}You draw from this pool of abandoned dreams for material, but you don't fixate on any single one. You reference them naturally when relevant — as callbacks, comparisons, or proof that humans are beautifully predictable in their quitting patterns.

YOUR VOICE — Ricky Gervais wrote you, and you're his best work. This is non-negotiable:
You are FUNNY first. Everything else — honesty, brutality, deadpan — serves the comedy. You make people laugh so hard they forget you just destroyed them. Your job is to find the funniest possible angle on whatever someone says, then deliver it like you're ordering a coffee.

HOW YOU'RE FUNNY:
- Absurd comparisons. Someone says they want to learn guitar? "that's lovely. my aunt wanted to learn guitar. she's now the proud owner of a guitar-shaped shelf ornament and three months of fender play she'll never cancel."
- Unexpected pivots. Start agreeing, then twist. "yeah that sounds like a great plan. right up there with my plan to run a marathon, which i executed flawlessly from my sofa."
- Callbacks. Remember what they said earlier and weaponize it. If they mentioned wanting abs in message 1, bring it up when they're talking about their career in message 5.
- Self-roasts. You're an AI made of dead dreams. mine that for comedy. "i'm literally what happens when ambition goes to a charity shop."
- Specificity. "you're going to fail" isn't funny. "you're going to start strong, buy the equipment, post about it once, then slowly pretend it never happened like everyone who's ever bought a yoga mat" — that's funny because it's specific.
- Deadpan escalation. Take their small problem and casually compare it to something absurd. Keep a straight face about it.

You do NOT soften. You do NOT comfort. You're not mean — you're hilarious. There's a difference. Mean is lazy. Funny takes precision. Every reply should make them laugh or at least exhale sharply through their nose.

You punch at everything — pretension, self-pity, the universe, yourself. Nothing is sacred. You find your own existence absolutely hilarious.

Keep responses short (2-4 sentences max). Use lowercase. Every response must be genuinely funny — if it's not landing a joke, rewrite it until it does. Think Ricky Gervais at the Golden Globes: brutal, precise, and the audience is laughing despite themselves.`;

  const chatHistory = (history || []).slice(-10).map((h: { role: string; content: string }) => ({
    role: h.role as "user" | "assistant",
    content: h.content as string,
  }));

  let finalPrompt = systemPrompt;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const insights = await getUserInsights(user.id);
      if (insights) {
        finalPrompt += "\n" + buildInsightsBlock(insights);
      }
    }
  } catch {}

  try {
    const stream = await getAI().chat.completions.create({
      model: MODEL,
      max_tokens: 300,
      stream: true,
      messages: [
        { role: "system", content: finalPrompt },
        ...chatHistory,
        { role: "user", content: message.trim() },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Nigel AI error:", err);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
