import { getAdmin } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";
import { getDayNumber } from "@/lib/games";
import { getGameState, setGameState, getUserLink } from "../helpers";

export { getAdmin, sendMessage, getDayNumber, getGameState, setGameState, getUserLink };

export async function endOtherGame(chatId: number, userId: string, keep: "wordle" | "spelling") {
  const { getTodayWordleAnswer } = await import("./wordle");
  const other = keep === "wordle" ? "spelling" : "wordle";
  const state = await getGameState(chatId, other);
  if (!state || state.gameOver) return;

  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();

  if (other === "wordle") {
    const answer = state.answer || await getTodayWordleAnswer();
    await setGameState(chatId, "wordle", { ...state, gameOver: true, won: false, answer });
    await db.from("game_archives").insert({
      user_id: userId, game_type: "wordle", won: false, score: 0,
      result: { answer, guesses: state.guesses || [], attempts: (state.guesses || []).length },
      played_at: today,
    });
  } else {
    const { getTodayBeeData, getBeeRank } = await import("./spelling");
    const puzzle = await getTodayBeeData();
    const rank = getBeeRank(state.score || 0, puzzle.maxScore);
    await setGameState(chatId, "spelling", { ...state, gameOver: true });
    await db.from("game_archives").insert({
      user_id: userId, game_type: "spelling", won: rank === "Genius", score: state.score || 0,
      result: { words: state.found || [], rank, maxScore: puzzle.maxScore },
      played_at: today,
    });
  }
}
