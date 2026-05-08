import { sendMessage, getDayNumber, getGameState, setGameState, getUserLink, getAdmin } from "./shared";
import { getTodayWordleAnswer } from "./wordle";
import { getTodayBeeData, getBeeRank } from "./spelling";

export { handleStart as handleWordleStart, handleGuess as handleWordleGuess } from "./wordle";
export { handleStart as handleBeeStart, handleGuess as handleBeeGuess } from "./spelling";
export { handleLeaderboard as handleGameLeaderboard } from "./leaderboard";

export async function getActiveGame(chatId: number): Promise<"wordle" | "spelling" | null> {
  const ws = await getGameState(chatId, "wordle");
  if (ws && !ws.gameOver) return "wordle";
  const bs = await getGameState(chatId, "spelling");
  if (bs && !bs.gameOver) return "spelling";
  return null;
}

export async function handleEndGame(chatId: number) {
  const link = await getUserLink(chatId);
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();

  let ended = false;
  const ws = await getGameState(chatId, "wordle");
  if (ws && !ws.gameOver) {
    const answer = ws.answer || await getTodayWordleAnswer();
    await setGameState(chatId, "wordle", { ...ws, gameOver: true, won: false, answer });
    if (link) {
      await db.from("game_archives").insert({
        user_id: link.user_id, game_type: "wordle", won: false, score: 0,
        result: { answer, guesses: ws.guesses || [], attempts: (ws.guesses || []).length },
        played_at: today,
      });
    }
    ended = true;
  }

  const bs = await getGameState(chatId, "spelling");
  if (bs && !bs.gameOver) {
    const maxScore = bs.maxScore || 0;
    const rank = getBeeRank(bs.score || 0, maxScore);
    await setGameState(chatId, "spelling", { ...bs, gameOver: true });
    if (link) {
      await db.from("game_archives").insert({
        user_id: link.user_id, game_type: "spelling", won: rank === "Genius", score: bs.score || 0,
        result: { words: bs.found || [], rank, maxScore },
        played_at: today,
      });
    }
    ended = true;
  }

  if (ended) {
    await sendMessage(chatId, "Game ended. Your progress was saved.\n\n/wordle or /bee to start a new game tomorrow.");
  } else {
    await sendMessage(chatId, "No active game to end.");
  }
}

export async function handleGamesStatus(chatId: number) {
  const ws = await getGameState(chatId, "wordle");
  const bs = await getGameState(chatId, "spelling");

  const lines: string[] = [];

  if (ws) {
    if (ws.gameOver) {
      lines.push(`🟩 Wordle: ${ws.won ? `Won in ${ws.guesses?.length}` : "Lost"} (done for today)`);
    } else {
      lines.push(`🟩 Wordle: *In progress* — ${ws.guesses?.length || 0}/6 guesses`);
    }
  } else {
    lines.push("🟩 Wordle: Not played today");
  }

  if (bs) {
    if (bs.gameOver) {
      const rank = getBeeRank(bs.score || 0, bs.maxScore || 0);
      lines.push(`🐝 Spelling Bee: ${rank} — ${bs.score || 0} pts (done for today)`);
    } else {
      const rank = getBeeRank(bs.score || 0, bs.maxScore || 0);
      lines.push(`🐝 Spelling Bee: *In progress* — ${rank} · ${bs.score || 0} pts · ${bs.found?.length || 0} words`);
    }
  } else {
    lines.push("🐝 Spelling Bee: Not played today");
  }

  await sendMessage(
    chatId,
    `🎮 *Games — Day #${getDayNumber()}*\n\n${lines.join("\n")}\n\n/wordle — Play Wordle\n/bee — Play Spelling Bee\n/leaderboard — View top players`
  );
}
