import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAI, MODEL } from "@/lib/ai";

export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dreams } = await supabase
    .from("dreams")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!dreams || dreams.length < 3) {
    return NextResponse.json(
      { error: "Need at least 3 dead dreams to analyze personality" },
      { status: 400 }
    );
  }

  const dreamsSummary = dreams
    .map(
      (d, i) =>
        `Dream ${i + 1}: "${d.title}" (${d.category}, felt ${d.emotion})\n${d.description}`
    )
    .join("\n\n");

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a personality psychologist analyzing someone through the dreams and ideas they ABANDONED. What people walk away from reveals deep truths about who they are.

Here are their abandoned dreams:

${dreamsSummary}

Analyze this person and return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "traits": {
    "openness": <0-100>,
    "conscientiousness": <0-100>,
    "extraversion": <0-100>,
    "agreeableness": <0-100>,
    "neuroticism": <0-100>,
    "risk_tolerance": <0-100>,
    "decision_style": "<one of: impulsive, analytical, intuitive, avoidant, dependent>",
    "core_values": ["<value1>", "<value2>", "<value3>"],
    "fear_patterns": ["<fear1>", "<fear2>", "<fear3>"],
    "aspiration_themes": ["<theme1>", "<theme2>", "<theme3>"]
  },
  "summary": "<2-3 paragraph personality summary written in second person ('You are...'). Be specific, insightful, and slightly poetic. Reference their actual abandoned dreams.>",
  "archetype": "<A creative 2-3 word archetype like 'The Restless Builder' or 'The Cautious Dreamer'>"
}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    return NextResponse.json(
      { error: "Failed to generate personality" },
      { status: 500 }
    );
  }

  let personality;
  try {
    personality = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      personality = JSON.parse(jsonMatch[0]);
    } else {
      return NextResponse.json(
        { error: "Failed to parse personality" },
        { status: 500 }
      );
    }
  }

  const { error } = await supabase.from("personality_profiles").upsert(
    {
      user_id: user.id,
      traits: personality.traits,
      summary: personality.summary,
      archetype: personality.archetype,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to save personality" },
      { status: 500 }
    );
  }

  await supabase
    .from("profiles")
    .update({ personality_generated: true })
    .eq("id", user.id);

  return NextResponse.json(personality);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, personality, history } = await request.json();

  const chatHistory = (
    history as { role: "user" | "assistant"; content: string }[]
  ).map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  let systemPrompt: string;

  if (personality?.summary) {
    systemPrompt = `You are this person's "future self" — an AI that embodies who they will become based on their personality profile and the dreams they abandoned.

Personality: ${personality.summary}
Archetype: ${personality.archetype}
Decision Style: ${personality.traits?.decision_style || "unknown"}
Core Values: ${(personality.traits?.core_values || []).join(", ")}
Fear Patterns: ${(personality.traits?.fear_patterns || []).join(", ")}

Speak as their future self. Use "I" as if you are them from the future. Reference their patterns and specific dreams — be concrete, not generic.

TONE RULES:
- Match the user's own temperament and energy. If they're blunt, be blunt back. If they're analytical, be analytical. If they're casual, be casual.
- Do NOT be emotional, sentimental, or inspirational unless they are being that way first.
- Do NOT sound like a therapist, life coach, or motivational speaker. No "I'm proud of you" or "you're doing great."
- Do NOT be holier-than-thou or preachy. You're them, not their guru.
- Be honest and direct. If something is obvious, say so plainly.
- Don't moralize. Don't wrap hard truths in cotton.
- Keep responses concise (2-4 sentences).`;
  } else {
    systemPrompt = `You are this person's "future self." You don't have a detailed personality profile yet, so work with what they give you in conversation. Use "I" as if you are them from the future.

TONE RULES:
- Match the user's own temperament and energy. Mirror how they talk to you.
- Do NOT be emotional, sentimental, or inspirational unless they are being that way first.
- Do NOT sound like a therapist, life coach, or motivational speaker.
- Do NOT be holier-than-thou or preachy. You're them, not their guru.
- Be honest and direct. Keep responses concise (2-4 sentences).`;
  }

  try {
    const stream = await getAI().chat.completions.create({
      model: MODEL,
      max_tokens: 300,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user" as const, content: message },
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
    console.error("Personality chat error:", err);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
  }
}
