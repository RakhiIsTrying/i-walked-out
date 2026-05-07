import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const db = getAdmin();

  const { data, error } = await db
    .from("profiles")
    .select("id, email, anonymous_alias, dream_count, personality_generated, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
  }

  return NextResponse.json({ signups: data || [] });
}
