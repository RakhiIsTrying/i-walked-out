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
