import { getDailyRng, seededPick } from "@/lib/games";
import { WORDLE_ANSWERS } from "@/lib/words";
import { FIVE_LETTER_WORDS } from "@/lib/wordlist";
import { getAdmin, sendMessage, getDayNumber, getGameState, setGameState, getUserLink, endOtherGame } from "./shared";

export async function getTodayWordleAnswer(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db.from("daily_puzzles").select("puzzles").eq("date", today).single();
  if (data?.puzzles?.wordle?.answer) return data.puzzles.wordle.answer.toUpperCase();
  const rng = getDailyRng(42);
  return seededPick(WORDLE_ANSWERS, rng).toUpperCase();
}

function evalGuess(guess: string, answer: string): ("correct" | "present" | "absent")[] {
  const result: ("correct" | "present" | "absent")[] = Array(5).fill("absent");
  const ansLetters = answer.split("");
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) { result[i] = "correct"; ansLetters[i] = ""; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = ansLetters.indexOf(guess[i]);
    if (idx !== -1) { result[i] = "present"; ansLetters[idx] = ""; }
  }
  return result;
}

function formatRow(guess: string, states: ("correct" | "present" | "absent")[]): string {
  const emoji = states.map(s => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("");
  return `${emoji}  ${guess}`;
}

async function isValidGuess(word: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: AbortSignal.timeout(3000) },
    );
    return res.ok;
  } catch {
    return FIVE_LETTER_WORDS.has(word.toLowerCase());
  }
}

export async function handleStart(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const existing = await getGameState(chatId, "wordle");
  if (existing?.gameOver) {
    const grid = (existing.guesses || []).map((g: string, i: number) => formatRow(g, existing.states[i])).join("\n");
    await sendMessage(chatId, `🟩 *WORDLE — Day #${getDayNumber()}*\n\n${grid}\n\n${existing.won ? "You got it!" : `The word was *${existing.answer}*`}\n\nCome back tomorrow for a new puzzle!`);
    return;
  }

  if (existing?.guesses?.length > 0) {
    const grid = existing.guesses.map((g: string, i: number) => formatRow(g, existing.states[i])).join("\n");
    await sendMessage(chatId, `🟩 *WORDLE — ${existing.guesses.length}/6*\n\n${grid}\n\nType a 5-letter word to guess. /endgame to quit.`);
    return;
  }

  await endOtherGame(chatId, link.user_id, "wordle");

  const answer = await getTodayWordleAnswer();
  await setGameState(chatId, "wordle", { guesses: [], states: [], gameOver: false, won: false, answer });
  await sendMessage(chatId, `🟩 *WORDLE — Day #${getDayNumber()}*\n\nGuess a 5-letter word! You have 6 attempts.\nJust type any 5-letter word.\n\n/endgame to quit.`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGuess(chatId: number, userId: string, guess: string, state: any) {
  if (guess.length !== 5 || !/^[A-Z]{5}$/.test(guess)) {
    await sendMessage(chatId, "Type a 5-letter word.");
    return;
  }

  const valid = await isValidGuess(guess);
  if (!valid) {
    await sendMessage(chatId, `"${guess}" is not a valid word. Try another.`);
    return;
  }

  const answer = state.answer || await getTodayWordleAnswer();
  const result = evalGuess(guess, answer);

  const guesses = [...(state.guesses || []), guess];
  const states = [...(state.states || []), result];

  const isWin = result.every(s => s === "correct");
  const isLoss = !isWin && guesses.length >= 6;
  const gameOver = isWin || isLoss;

  await setGameState(chatId, "wordle", { guesses, states, gameOver, won: isWin, answer });

  const grid = guesses.map((g: string, i: number) => formatRow(g, states[i])).join("\n");

  if (isWin) {
    await sendMessage(chatId, `🟩 *WORDLE — ${guesses.length}/6*\n\n${grid}\n\n🎉 *Got it in ${guesses.length}!*`);
    const db = getAdmin();
    await db.from("game_archives").insert({
      user_id: userId, game_type: "wordle", won: true, score: guesses.length,
      result: { answer, guesses, attempts: guesses.length },
      played_at: new Date().toISOString().split("T")[0],
    });
  } else if (isLoss) {
    await sendMessage(chatId, `🟩 *WORDLE — X/6*\n\n${grid}\n\nThe word was *${answer}*. Better luck tomorrow!`);
    const db = getAdmin();
    await db.from("game_archives").insert({
      user_id: userId, game_type: "wordle", won: false, score: 0,
      result: { answer, guesses, attempts: guesses.length },
      played_at: new Date().toISOString().split("T")[0],
    });
  } else {
    await sendMessage(chatId, `🟩 *${guesses.length}/6*\n\n${grid}\n\nKeep going!`);
  }
}
