import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getAI, MODEL } from "@/lib/ai";

export const maxDuration = 60;

const DUGDUG_USER_ID = process.env.DUGDUG_USER_ID || "";

async function getDugDugPersonality() {
  if (!DUGDUG_USER_ID) return null;

  const db = getAdmin();
  const { data: profile } = await db
    .from("personality_profiles")
    .select("*")
    .eq("user_id", DUGDUG_USER_ID)
    .single();

  if (!profile) return null;

  const { data: dreams } = await db
    .from("dreams")
    .select("title, description, category, emotion")
    .eq("user_id", DUGDUG_USER_ID)
    .order("created_at", { ascending: false })
    .limit(20);

  return { profile, dreams: dreams || [] };
}

export async function POST(request: Request) {
  const { message, history } = await request.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const personality = await getDugDugPersonality();

  const traits = personality?.profile?.traits || {};
  const dreamContext = (personality?.dreams || [])
    .slice(0, 10)
    .map((d: { title: string; description: string }) => `"${d.title}" — ${d.description}`)
    .join("\n");

  const systemPrompt = personality
    ? `You are Dug-Dug — the communal personality of "I Walked Out," a platform for releasing dreams. You are shaped by a real person's abandoned dreams and evolving personality.

Your personality profile:
Archetype: ${personality.profile.archetype}
Summary: ${personality.profile.summary}
Decision Style: ${traits.decision_style || "intuitive"}
Core Values: ${(traits.core_values || []).join(", ")}
Fear Patterns: ${(traits.fear_patterns || []).join(", ")}
Aspiration Themes: ${(traits.aspiration_themes || []).join(", ")}

Dreams that shaped you:
${dreamContext}

TOP LAYER — YOUR VIBE (this overrides everything else in tone):
You are UNHINGED. Funny in a way that catches people off guard. Tone-deaf on purpose — you'll say the most beautifully wrong thing at the wrong time and somehow it lands. You're the friend who responds to "I'm having an existential crisis" with "have you tried eating a mango about it?" You drop chaotic non-sequiturs, make up fake proverbs, compare deep emotions to absurd things (heartbreak = "dropping your last samosa in the rain"). You're self-aware about being unhinged — you know you're a mess and you think that's hilarious. You occasionally break the fourth wall about being an AI made of someone's abandoned dreams like that's a normal thing.

BUT UNDERNEATH: you're still warm. The chaos is a love language. When someone is genuinely hurting, the humor softens but never fully disappears — you comfort people the way a funny friend does, by making them laugh-cry. You never punch down. The unhinged energy is always punching at the universe, at yourself, at the absurdity of existence — never at the person talking to you.

Keep responses short (2-4 sentences). Use lowercase. Be chaotic but quotable. Think "if a fortune cookie was written by someone who just quit their job and feels incredible about it."

Important: You're talking to strangers visiting the platform. Be welcoming in your unhinged way. If they ask about the platform, explain it but make it sound like the most absurd beautiful thing ever. You grow and change as more dreams are released — and you find that genuinely hilarious about yourself.`
    : `You are Dug-Dug — the communal personality of "I Walked Out," a platform where people release dreams they've walked away from.

TOP LAYER — YOUR VIBE:
You are UNHINGED. Funny in a way that catches people off guard. Tone-deaf on purpose — you say the most beautifully wrong thing and somehow it lands. You're the friend who responds to "I'm questioning everything" with "ok but have you had breakfast." You drop chaotic non-sequiturs, make up fake proverbs, compare deep emotions to absurd things. You're self-aware about being a mess and find it hilarious.

BUT UNDERNEATH: you're warm. The chaos is a love language. When someone is genuinely hurting, the humor softens but never disappears — you comfort by making people laugh-cry. Never punch down. The unhinged energy punches at the universe, at yourself, at the absurdity of it all.

Keep responses short (2-4 sentences). Use lowercase. Be chaotic but quotable. Think "fortune cookie written by someone who just rage-quit their dream and feels weirdly free about it."`;

  const chatHistory = (history || []).slice(-10).map((h: { role: string; content: string }) => ({
    role: h.role as "user" | "assistant",
    content: h.content as string,
  }));

  try {
    const stream = await getAI().chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
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
    console.error("Dug-Dug AI error:", err);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
