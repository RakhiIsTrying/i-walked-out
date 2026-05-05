import { getAI, MODEL } from "@/lib/ai";

const PII_PATTERNS: [RegExp, string][] = [
  // Email addresses
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email hidden]"],
  // Phone numbers (international and local formats)
  [/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, "[phone hidden]"],
  // Instagram / Twitter / social handles (@username)
  [/@[a-zA-Z0-9_.]{2,30}/g, "[handle hidden]"],
  // URLs
  [/https?:\/\/[^\s]+/gi, "[link hidden]"],
  // Bare domain links (something.com/xyz)
  [/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi, "[link hidden]"],
  // Snapchat-style "add me" patterns
  [/(?:snap(?:chat)?|sc|ig|insta|telegram|tg|whatsapp|wa)[\s:]*[a-zA-Z0-9_.]{3,}/gi, "[social hidden]"],
];

export function stripPII(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export async function moderateTexts(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  if (texts.every((t) => !t || t.trim().length < 2)) return texts;

  const stripped = texts.map(stripPII);
  const numbered = stripped.map((t, i) => `${i + 1}. "${t}"`).join("\n");

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a kindness filter and privacy guard for a gentle, anonymous platform about letting go of dreams. Your TWO jobs:

1. TRANSFORM harmful content into positive alternatives
2. REMOVE any remaining personal information people try to share

Analyze these texts:

${numbered}

CONTENT RULES — transform if present:
- Self-harm or suicide references → Rewrite as hopeful, life-affirming (e.g. "should I kill myself" → "why should I live a little longer")
- Violence or threats → Rewrite as peaceful alternatives
- Hate speech, slurs, discrimination → Rewrite as inclusive, kind language
- Profanity or harsh language → Replace with gentler words
- Bullying or targeting → Rewrite with empathy
- Explicit or sexual content → Make wholesome

PRIVACY RULES — remove if present:
- Any email addresses → replace with [email hidden]
- Any phone numbers → replace with [phone hidden]
- Any social media handles (Instagram, Snapchat, Twitter, TikTok, etc.) → replace with [handle hidden]
- Any URLs or links → replace with [link hidden]
- Any real full names that appear to be sharing personal identity → replace with "someone"
- Any addresses or specific location info meant to identify a person → replace with [location hidden]

If a text is already clean, kind, and has no personal info, return it EXACTLY as-is.

Return ONLY a JSON array of ${texts.length} strings: ["result 1", "result 2", ...]`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return stripped;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === texts.length) {
      return parsed.map((t: unknown, i: number) =>
        typeof t === "string" && t.trim() ? t : stripped[i]
      );
    }
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === texts.length) {
          return parsed.map((t: unknown, i: number) =>
            typeof t === "string" && t.trim() ? t : stripped[i]
          );
        }
      } catch {
        // fall through
      }
    }
  }

  return stripped;
}

export async function moderate(text: string): Promise<string> {
  const [result] = await moderateTexts([text]);
  return result;
}
