import { getAdmin, sendMessage } from "./shared";

export async function handleLeaderboard(chatId: number, text: string) {
  const arg = text.replace(/^\/leaderboard\s*/i, "").trim().toLowerCase();
  const tokens = arg.split(/\s+/).filter(Boolean);

  const GAME_NAMES: Record<string, string> = { wordle: "Wordle", crossword: "Crossword", sudoku: "Sudoku", spelling: "Spelling Bee", bee: "Spelling Bee" };
  const GAME_KEYS = new Set(Object.keys(GAME_NAMES));

  let gameFilter: string | null = null;
  let gameLabel = "All Games";
  let periodKey = "daily";
  let periodLabel = "Today";

  for (const t of tokens) {
    if (GAME_KEYS.has(t)) { gameFilter = t === "bee" ? "spelling" : t; gameLabel = GAME_NAMES[t]; }
    else if (t.includes("week")) { periodKey = "weekly"; periodLabel = "This Week"; }
    else if (t.includes("month")) { periodKey = "monthly"; periodLabel = "This Month"; }
    else if (t.includes("year")) { periodKey = "yearly"; periodLabel = "This Year"; }
  }

  const now = new Date();
  let startDate: string;
  switch (periodKey) {
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

  if (gameFilter) query = query.eq("game_type", gameFilter);

  const { data: archives } = await query;

  if (!archives || archives.length === 0) {
    await sendMessage(chatId, `🏆 *${gameLabel} Leaderboard — ${periodLabel}*\n\nNo games played yet. Be the first!\n\n/wordle or /bee to play.`);
    return;
  }

  const userMap = new Map<string, { wins: number; total_score: number; games_played: number }>();
  for (const row of archives) {
    const e = userMap.get(row.user_id) || { wins: 0, total_score: 0, games_played: 0 };
    e.games_played++;
    if (row.won) e.wins++;
    e.total_score += row.score || 0;
    userMap.set(row.user_id, e);
  }

  const userIds = [...userMap.keys()];
  const { data: profiles } = await db.from("profiles").select("id, anonymous_alias").in("id", userIds);
  const aliasMap = new Map<string, string>();
  for (const p of profiles || []) aliasMap.set(p.id, p.anonymous_alias || "Ghost");

  const board = userIds
    .map(uid => ({ alias: aliasMap.get(uid) || "Ghost", ...userMap.get(uid)! }))
    .sort((a, b) => b.wins - a.wins || b.total_score - a.total_score || b.games_played - a.games_played)
    .slice(0, 10);

  const medals = ["🥇", "🥈", "🥉"];
  const lines = board.map((e, i) => {
    const m = medals[i] || `${i + 1}.`;
    return `${m} *${e.alias}* — ${e.wins}W · ${e.total_score}pts · ${e.games_played} played`;
  });

  await sendMessage(
    chatId,
    `🏆 *${gameLabel} Leaderboard — ${periodLabel}*\n\n${lines.join("\n")}\n\n_Try: /leaderboard wordle weekly, /leaderboard bee monthly, etc._`
  );
}
