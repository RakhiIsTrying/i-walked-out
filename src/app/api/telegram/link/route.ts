import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = generateCode();

  const { error } = await supabase.from("telegram_link_codes").insert({
    user_id: user.id,
    code,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }

  return NextResponse.json({ code });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("telegram_username, linked_at")
    .eq("user_id", user.id)
    .single();

  let pendingCode: string | null = null;
  if (!link) {
    const { data: codeRow } = await supabase
      .from("telegram_link_codes")
      .select("code, created_at")
      .eq("user_id", user.id)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (codeRow) {
      pendingCode = codeRow.code;
    }
  }

  return NextResponse.json({ linked: !!link, link, pendingCode });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await supabase.from("telegram_links").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
