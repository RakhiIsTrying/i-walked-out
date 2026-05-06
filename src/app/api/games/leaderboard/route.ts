import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

interface LeaderboardEntry {
  user_id: string;
  alias: string;
  wins: number;
  total_score: number;
  games_played: number;
}

const VALID_GAMES = ["wordle", "crossword", "sudoku", "spelling"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const game = searchParams.get("game") || "all";

  const now = new Date();
  let startDate: string;

  switch (period) {
    case "weekly": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      startDate = d.toISOString().split("T")[0];
      break;
    }
    case "monthly":
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      break;
    case "yearly":
      startDate = `${now.getFullYear()}-01-01`;
      break;
    default:
      startDate = now.toISOString().split("T")[0];
  }

  const db = getAdmin();

  let query = db
    .from("game_archives")
    .select("user_id, won, score, game_type")
    .gte("played_at", startDate);

  if (game !== "all" && VALID_GAMES.includes(game)) {
    query = query.eq("game_type", game);
  }

  const { data: archives, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userMap = new Map<string, { wins: number; total_score: number; games_played: number }>();
  for (const row of archives || []) {
    const entry = userMap.get(row.user_id) || { wins: 0, total_score: 0, games_played: 0 };
    entry.games_played++;
    if (row.won) entry.wins++;
    entry.total_score += row.score || 0;
    userMap.set(row.user_id, entry);
  }

  if (userMap.size === 0) {
    return NextResponse.json([]);
  }

  const userIds = [...userMap.keys()];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, anonymous_alias")
    .in("id", userIds);

  const aliasMap = new Map<string, string>();
  for (const p of profiles || []) {
    aliasMap.set(p.id, p.anonymous_alias || "Ghost");
  }

  const leaderboard: LeaderboardEntry[] = userIds
    .map((uid) => {
      const stats = userMap.get(uid)!;
      return {
        user_id: uid,
        alias: aliasMap.get(uid) || "Ghost",
        wins: stats.wins,
        total_score: stats.total_score,
        games_played: stats.games_played,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.total_score - a.total_score || b.games_played - a.games_played)
    .slice(0, 50);

  return NextResponse.json(leaderboard, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
