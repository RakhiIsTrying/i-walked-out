import { getDailyRng, seededPick } from "@/lib/games";
import { DICTIONARY, PANGRAM_SEEDS } from "@/lib/words";
import { getAdmin, sendMessage, getDayNumber, getGameState, setGameState, getUserLink, endOtherGame } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTodayBeeData(): Promise<any> {
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

function scoreWord(word: string, allLetters: Set<string>): number {
  if (word.length === 4) return 1;
  let s = word.length;
  const unique = new Set(word);
  if (allLetters.size === unique.size && [...allLetters].every(l => unique.has(l))) s += 7;
  return s;
}

export function getBeeRank(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.7) return "Genius";
  if (pct >= 0.5) return "Amazing";
  if (pct >= 0.3) return "Great";
  if (pct >= 0.15) return "Nice";
  if (pct >= 0.05) return "Good";
  return "Beginner";
}

export async function handleStart(chatId: number) {
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
export async function handleGuess(chatId: number, userId: string, word: string, state: any) {
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

  let isValid = false;
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(3000) });
    isValid = res.ok;
  } catch {
    const validSet = new Set(state.validWords || []);
    isValid = validSet.has(word);
  }

  if (!isValid) { await sendMessage(chatId, `"${word.toUpperCase()}" is not a valid word.`); return; }

  const pts = scoreWord(word, allLetters);
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
