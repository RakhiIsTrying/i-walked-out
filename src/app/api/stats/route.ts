import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getAdmin();

  const [
    { count: dreamCount },
    { count: userCount },
    { data: categories },
    { data: emotions },
  ] = await Promise.all([
    db.from("dreams").select("*", { count: "exact", head: true }),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("dreams").select("category"),
    db.from("dreams").select("emotion"),
  ]);

  const catCounts: Record<string, number> = {};
  for (const d of categories || []) {
    catCounts[d.category] = (catCounts[d.category] || 0) + 1;
  }

  const emotionCounts: Record<string, number> = {};
  for (const d of emotions || []) {
    emotionCounts[d.emotion] = (emotionCounts[d.emotion] || 0) + 1;
  }

  return NextResponse.json(
    { dreams: dreamCount || 0, users: userCount || 0, categories: catCounts, emotions: emotionCounts },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
