import { getAdmin } from "@/lib/supabase/admin";
import { getAI, ANALYSIS_MODEL } from "@/lib/ai";

export interface ChatInsights {
  style: string;
  humor_preference: string;
  topics: string[];
  emotional_tone: string;
  response_style: string;
  quirks: string[];
  summary: string;
}

const ANALYSIS_PROMPT = `Analyze this user's chat messages and extract their communication profile. Return ONLY a JSON object (no markdown, no explanation):

{
  "style": "<one of: terse, conversational, verbose, stream-of-consciousness>",
  "humor_preference": "<what kind of humor do they respond to best? e.g. 'dry sarcasm', 'absurd comparisons', 'self-deprecating', 'dark humor', 'wordplay'>",
  "topics": ["<top 3-5 things they talk about or care about>"],
  "emotional_tone": "<their general emotional vibe: e.g. 'anxious but self-aware', 'casually existential', 'earnestly confused', 'performatively chill'>",
  "response_style": "<how should the AI respond to match them? e.g. 'keep it very short, they hate long answers', 'match their energy, they're playful', 'be extra brutal, they can take it'>",
  "quirks": ["<any specific patterns: e.g. 'uses lowercase only', 'asks rhetorical questions', 'deflects with humor', 'tends to overshare'>"],
  "summary": "<2 sentences: who is this person conversationally and what makes them tick>"
}

Be specific and observational. Base everything on actual message patterns, not assumptions.`;

const MIN_MESSAGES_FOR_ANALYSIS = 6;
const ANALYSIS_COOLDOWN_MS = 10 * 60 * 1000;

export async function saveWebMessage(
  userId: string,
  chatType: "nigel" | "self",
  role: "user" | "assistant",
  content: string
) {
  const db = getAdmin();
  await db.from("web_chat_history").insert({
    user_id: userId,
    chat_type: chatType,
    role,
    content,
  });
}

export async function getWebChatHistory(
  userId: string,
  chatType: "nigel" | "self",
  limit = 30
) {
  const db = getAdmin();
  const { data } = await db
    .from("web_chat_history")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .eq("chat_type", chatType)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).reverse();
}

export async function getUserInsights(
  userId: string
): Promise<ChatInsights | null> {
  const db = getAdmin();
  const { data } = await db
    .from("chat_insights")
    .select("insights, updated_at")
    .eq("user_id", userId)
    .single();

  if (!data) return null;
  return data.insights as ChatInsights;
}

export async function analyzeUserIfNeeded(userId: string): Promise<void> {
  const db = getAdmin();

  const { data: existing } = await db
    .from("chat_insights")
    .select("updated_at, message_count")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const elapsed = Date.now() - new Date(existing.updated_at).getTime();
    if (elapsed < ANALYSIS_COOLDOWN_MS) return;
  }

  const { data: webMsgs } = await db
    .from("web_chat_history")
    .select("role, content, chat_type")
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: tgMsgs } = await db
    .from("telegram_chat_history")
    .select("role, content")
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(20);

  const allUserMessages = [
    ...(webMsgs || []).map((m) => m.content),
    ...(tgMsgs || []).map((m) => m.content),
  ];

  const totalCount = allUserMessages.length;
  const previousCount = existing?.message_count || 0;
  if (totalCount < MIN_MESSAGES_FOR_ANALYSIS) return;
  if (totalCount === previousCount) return;

  const messagesBlock = allUserMessages
    .slice(0, 30)
    .map((m, i) => `${i + 1}. ${m}`)
    .join("\n");

  try {
    const completion = await getAI().chat.completions.create({
      model: ANALYSIS_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${ANALYSIS_PROMPT}\n\nUser messages:\n${messagesBlock}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return;

    let insights: ChatInsights;
    try {
      insights = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return;
      insights = JSON.parse(match[0]);
    }

    await db.from("chat_insights").upsert(
      {
        user_id: userId,
        insights,
        message_count: totalCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.error("Chat analysis error:", err);
  }
}

export function buildInsightsBlock(insights: ChatInsights): string {
  return `
ABOUT THIS USER (learned from their chat history — adapt your style accordingly):
- Communication style: ${insights.style}
- They respond best to: ${insights.humor_preference}
- Topics they care about: ${insights.topics.join(", ")}
- Emotional tone: ${insights.emotional_tone}
- How to talk to them: ${insights.response_style}
- Quirks: ${insights.quirks.join("; ")}
- Profile: ${insights.summary}

Use this to calibrate your tone, references, and humor. Don't mention that you've analyzed them unless they ask.`;
}
