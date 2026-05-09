import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const db = getAdmin();
  const { data, error } = await db
    .from("dreams")
    .select("reactions")
    .limit(1);

  if (error?.message?.includes("reactions")) {
    return NextResponse.json({
      status: "migration_needed",
      sql: "ALTER TABLE dreams ADD COLUMN reactions JSONB DEFAULT '{}';",
    });
  }

  return NextResponse.json({ status: "ok", sample: data });
}

export async function POST() {
  const db = getAdmin();
  const results: string[] = [];

  const { error: e1 } = await db.rpc("exec_sql", {
    query: `
      CREATE TABLE IF NOT EXISTS web_chat_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        chat_type TEXT NOT NULL CHECK (chat_type IN ('nigel', 'self')),
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_web_chat_user_type ON web_chat_history(user_id, chat_type, created_at DESC);
    `,
  });

  if (e1) {
    const { error: fallback1 } = await db.from("web_chat_history").select("id").limit(1);
    if (fallback1) {
      results.push(`web_chat_history: needs manual creation - ${fallback1.message}`);
    } else {
      results.push("web_chat_history: already exists");
    }
  } else {
    results.push("web_chat_history: created");
  }

  const { error: e2 } = await db.rpc("exec_sql", {
    query: `
      CREATE TABLE IF NOT EXISTS chat_insights (
        user_id UUID PRIMARY KEY,
        insights JSONB NOT NULL DEFAULT '{}',
        message_count INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `,
  });

  if (e2) {
    const { error: fallback2 } = await db.from("chat_insights").select("user_id").limit(1);
    if (fallback2) {
      results.push(`chat_insights: needs manual creation - ${fallback2.message}`);
    } else {
      results.push("chat_insights: already exists");
    }
  } else {
    results.push("chat_insights: created");
  }

  return NextResponse.json({
    status: "migration_complete",
    results,
    manual_sql: `
-- Run this in Supabase SQL Editor if tables don't exist:

CREATE TABLE IF NOT EXISTS web_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_type TEXT NOT NULL CHECK (chat_type IN ('nigel', 'self')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_web_chat_user_type ON web_chat_history(user_id, chat_type, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_insights (
  user_id UUID PRIMARY KEY,
  insights JSONB NOT NULL DEFAULT '{}',
  message_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (optional, admin client bypasses RLS):
ALTER TABLE web_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_insights ENABLE ROW LEVEL SECURITY;
    `,
  });
}
