import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = getAdmin();
  const { data, error } = await db
    .from("game_archives")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { game_type, won, score, result, played_at } = body;

  if (!game_type || !["wordle", "crossword", "sudoku", "spelling"].includes(game_type)) {
    return NextResponse.json({ error: "Invalid game_type" }, { status: 400 });
  }

  const db = getAdmin();
  const { data, error } = await db.from("game_archives").insert({
    user_id: user.id,
    game_type,
    played_at: played_at || new Date().toISOString().split("T")[0],
    won: !!won,
    score: score || 0,
    result: result || {},
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
