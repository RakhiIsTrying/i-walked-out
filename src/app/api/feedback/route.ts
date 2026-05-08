import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "rakhisinha100896@gmail.com";

export async function POST(request: Request) {
  const { message, page, emoji } = await request.json();
  const trimmedMsg = typeof message === "string" ? message.trim().slice(0, 1000) : "";
  if (!trimmedMsg && !emoji) {
    return NextResponse.json({ error: "Message or emoji required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = getAdmin();
  const { error } = await db.from("feedback").insert({
    message: trimmedMsg || null,
    page: page || null,
    emoji: emoji || null,
    user_id: user?.id || null,
    user_email: user?.email || null,
  });

  if (error) {
    console.error("[feedback] insert error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdmin();
  const { data, count } = await db
    .from("feedback")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ feedback: data || [], total: count || 0 });
}
