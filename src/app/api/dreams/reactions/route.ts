import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

const VALID_REACTIONS = ["skull", "oof", "rip", "haunting", "dramatic", "pour_one_out"];

export async function POST(request: Request) {
  const { dream_id, reaction } = await request.json();

  if (!dream_id || !reaction || !VALID_REACTIONS.includes(reaction)) {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
  }

  const db = getAdmin();

  const { data: dream, error: fetchErr } = await db
    .from("dreams")
    .select("id, reactions")
    .eq("id", dream_id)
    .single();

  if (fetchErr || !dream) {
    if (fetchErr?.message?.includes("reactions")) {
      return NextResponse.json({
        error: "Run migration: ALTER TABLE dreams ADD COLUMN reactions JSONB DEFAULT '{}';",
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const reactions = (dream.reactions as Record<string, number>) || {};
  reactions[reaction] = (reactions[reaction] || 0) + 1;

  const { error: updateErr } = await db
    .from("dreams")
    .update({ reactions })
    .eq("id", dream_id);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }

  return NextResponse.json({ reactions });
}
