import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const db = getAdmin();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, email, anonymous_alias, dream_count, personality_generated, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
  }

  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const phoneMap = new Map<string, string>();
  const providerMap = new Map<string, string>();
  if (authData?.users) {
    for (const u of authData.users) {
      if (u.phone) phoneMap.set(u.id, u.phone);
      const provider = u.app_metadata?.provider || "email";
      providerMap.set(u.id, provider);
    }
  }

  const signups = (profiles || []).map((p) => ({
    ...p,
    phone: phoneMap.get(p.id) || null,
    provider: providerMap.get(p.id) || "email",
  }));

  return NextResponse.json({ signups });
}
