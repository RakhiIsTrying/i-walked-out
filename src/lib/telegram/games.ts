import { getAdmin } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";
import { getDayNumber, getDailyRng, seededPick } from "@/lib/games";
import { WORDLE_ANSWERS, VALID_GUESSES, DICTIONARY, PANGRAM_SEEDS } from "@/lib/words";
import { getUserLink, getGameState, setGameState } from "./helpers";

async function getTodayWordleAnswer(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db.from("daily_puzzles").select("puzzles").eq("date", today).single();
  if (data?.puzzles?.wordle?.answer) return data.puzzles.wordle.answer.toUpperCase();
  const rng = getDailyRng(42);
  return seededPick(WORDLE_ANSWERS, rng).toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTodayBeeData(): Promise<any> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db.from("daily_puzzles").select("puzzles").eq("date", today).single();
  if (data?.puzzles?.spelling) return data.puzzles.spelling;
  const rng = getDailyRng(77);
  const seed = seededPick(PANGRAM_SEEDS, rng);
  const outer = seed.letters.filter((l: string) => l !== seed.center);
  const allLetters = new Set([seed.center, ...outer]);
  const validWords = DICTIONARY.filter((word: string) => {
    if (word.length < 4) return false;
    if (!word.includes(seed.center)) return false;
    for (const ch of word) { if (!allLetters.has(ch)) return false; }
    return true;
  });
  const maxScore = validWords.reduce((sum: number, w: string) => {
    if (w.length === 4) return sum + 1;
    let s = w.length;
    const unique = new Set(w);
    if (allLetters.size === unique.size && [...allLetters].every(l => unique.has(l))) s += 7;
    return sum + s;
  }, 0);
  return { center: seed.center, outer, validWords, maxScore };
}

function evalWordleGuess(guess: string, answer: string): ("correct" | "present" | "absent")[] {
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

function formatWordleRow(guess: string, states: ("correct" | "present" | "absent")[]): string {
  const emoji = states.map(s => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("");
  return `${emoji}  ${guess}`;
}

async function isValidWordleGuess(word: string): Promise<boolean> {
  if (VALID_GUESSES.has(word.toLowerCase())) return true;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch { return false; }
}

function scoreBeeWord(word: string, allLetters: Set<string>): number {
  if (word.length === 4) return 1;
  let s = word.length;
  const unique = new Set(word);
  if (allLetters.size === unique.size && [...allLetters].every(l => unique.has(l))) s += 7;
  return s;
}

function getBeeRank(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.7) return "Genius";
  if (pct >= 0.5) return "Amazing";
  if (pct >= 0.3) return "Great";
  if (pct >= 0.15) return "Nice";
  if (pct >= 0.05) return "Good";
  return "Beginner";
}

async function endOtherGame(chatId: number, userId: string, keep: "wordle" | "spelling") {
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

export async function getActiveGame(chatId: number): Promise<"wordle" | "spelling" | null> {
  const ws = await getGameState(chatId, "wordle");
  if (ws && !ws.gameOver) return "wordle";
  const bs = await getGameState(chatId, "spelling");
  if (bs && !bs.gameOver) return "spelling";
  return null;
}

export async function handleWordleStart(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const existing = await getGameState(chatId, "wordle");
  if (existing?.gameOver) {
    const grid = (existing.guesses || []).map((g: string, i: number) => formatWordleRow(g, existing.states[i])).join("\n");
    await sendMessage(chatId, `🟩 *WORDLE — Day #${getDayNumber()}*\n\n${grid}\n\n${existing.won ? "You got it!" : `The word was *${existing.answer}*`}\n\nCome back tomorrow for a new puzzle!`);
    return;
  }

  if (existing?.guesses?.length > 0) {
    const grid = existing.guesses.map((g: string, i: number) => formatWordleRow(g, existing.states[i])).join("\n");
    await sendMessage(chatId, `🟩 *WORDLE — ${existing.guesses.length}/6*\n\n${grid}\n\nType a 5-letter word to guess. /endgame to quit.`);
    return;
  }

  await endOtherGame(chatId, link.user_id, "wordle");

  const answer = await getTodayWordleAnswer();
  await setGameState(chatId, "wordle", { guesses: [], states: [], gameOver: false, won: false, answer });
  await sendMessage(chatId, `🟩 *WORDLE — Day #${getDayNumber()}*\n\nGuess a 5-letter word! You have 6 attempts.\nJust type any 5-letter word.\n\n/endgame to quit.`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleWordleGuess(chatId: number, userId: string, guess: string, state: any) {
  if (guess.length !== 5 || !/^[A-Z]{5}$/.test(guess)) {
    await sendMessage(chatId, "Type a 5-letter word.");
    return;
  }

  const valid = await isValidWordleGuess(guess);
  if (!valid) {
    await sendMessage(chatId, `"${guess}" is not a valid word. Try another.`);
    return;
  }

  const answer = state.answer || await getTodayWordleAnswer();
  const result = evalWordleGuess(guess, answer);

  const guesses = [...(state.guesses || []), guess];
  const states = [...(state.states || []), result];

  const isWin = result.every(s => s === "correct");
  const isLoss = !isWin && guesses.length >= 6;
  const gameOver = isWin || isLoss;

  await setGameState(chatId, "wordle", { guesses, states, gameOver, won: isWin, answer });

  const grid = guesses.map((g: string, i: number) => formatWordleRow(g, states[i])).join("\n");

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

export async function handleBeeStart(chatId: number) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const puzzle = await getTodayBeeData();
  const existing = await getGameState(chatId, "spelling");

  if (existing?.gameOver) {
    const rank = getBeeRank(existing.score, puzzle.maxScore);
    await sendMessage(chatId, `🐝 *SPELLING BEE — Day #${getDayNumber()}*\n\nYou reached *${rank}*! ${existing.score} pts · ${existing.found.length} words\n\nCome back tomorrow!`);
    return;
  }

  const letters = `*${puzzle.center.toUpperCase()}* ${puzzle.outer.map((l: string) => l.toUpperCase()).join("  ")}`;

  if (existing?.found?.length > 0) {
    const rank = getBeeRank(existing.score, puzzle.maxScore);
    await sendMessage(
      chatId,
      `🐝 *SPELLING BEE*\n\nCenter: ${letters}\n\n${rank} · ${existing.score} pts · ${existing.found.length} words\n\nType a word (4+ letters, must use center). /endgame to quit.`
    );
    return;
  }

  await endOtherGame(chatId, link.user_id, "spelling");

  const validWordsList = puzzle.validWords.map((w: string) => w);
  await setGameState(chatId, "spelling", {
    found: [], score: 0, gameOver: false,
    center: puzzle.center, outer: puzzle.outer,
    validWords: validWordsList, maxScore: puzzle.maxScore,
  });
  await sendMessage(
    chatId,
    `🐝 *SPELLING BEE — Day #${getDayNumber()}*\n\nCenter: ${letters}\n\nFind words using these letters (4+ letters). Every word must use the center letter. Letters can repeat.\n\nType a word to guess. /endgame to quit.`
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleBeeGuess(chatId: number, userId: string, word: string, state: any) {
  const center = state.center;
  const outer = state.outer || [];
  const allLetters = new Set([center, ...outer]);
  const maxScore = state.maxScore || 0;

  if (word.length < 4) { await sendMessage(chatId, "Too short — need 4+ letters."); return; }
  if (!word.includes(center)) { await sendMessage(chatId, `Must use center letter *${center.toUpperCase()}*.`); return; }
  for (const ch of word) {
    if (!allLetters.has(ch)) { await sendMessage(chatId, `Letter "${ch.toUpperCase()}" is not in the puzzle.`); return; }
  }
  if ((state.found || []).includes(word)) { await sendMessage(chatId, "Already found that one!"); return; }

  const validSet = new Set(state.validWords || []);
  let isValid = validSet.has(word);
  if (!isValid) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(3000) });
      isValid = res.ok;
    } catch { /* timeout or network error — reject the word */ }
  }

  if (!isValid) { await sendMessage(chatId, `"${word.toUpperCase()}" is not a valid word.`); return; }

  const pts = scoreBeeWord(word, allLetters);
  const isPangram = new Set(word).size === allLetters.size && [...allLetters].every(l => word.includes(l));
  const found = [...(state.found || []), word];
  const score = (state.score || 0) + pts;
  const rank = getBeeRank(score, maxScore);
  const isGenius = rank === "Genius";

  await setGameState(chatId, "spelling", { ...state, found, score, gameOver: isGenius });

  let msg = isPangram ? `🎯 *PANGRAM! +${pts}*` : `+${pts}`;
  msg += `\n\n${rank} · ${score} pts · ${found.length} words`;

  if (isGenius) {
    msg += `\n\n🎉 *You reached Genius!* Amazing work!`;
    const db = getAdmin();
    await db.from("game_archives").insert({
      user_id: userId, game_type: "spelling", won: true, score,
      result: { words: found, rank: "Genius", maxScore },
      played_at: new Date().toISOString().split("T")[0],
    });
  }

  await sendMessage(chatId, `🐝 ${msg}`);
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

export async function handleGameLeaderboard(chatId: number, text: string) {
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
