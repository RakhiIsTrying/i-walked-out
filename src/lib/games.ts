// Seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayStr(): string {
  // IST (UTC+5:30) so puzzles refresh at midnight India time
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset).toISOString().split("T")[0];
}

export function getDayNumber(): number {
  const start = new Date("2025-01-01").getTime();
  const now = new Date(getTodayStr()).getTime();
  return Math.floor((now - start) / 86400000);
}

export function getDailyRng(offset = 0): () => number {
  const day = getDayNumber() + offset;
  return mulberry32(day * 2654435761);
}

export function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Streak management ──

export interface GameStats {
  currentStreak: number;
  maxStreak: number;
  lastWonDate: string;
  gamesPlayed: number;
  gamesWon: number;
}

function defaultStats(): GameStats {
  return { currentStreak: 0, maxStreak: 0, lastWonDate: "", gamesPlayed: 0, gamesWon: 0 };
}

export function getStats(gameId: string): GameStats {
  if (typeof window === "undefined") return defaultStats();
  try {
    const raw = localStorage.getItem(`iwo_${gameId}`);
    return raw ? JSON.parse(raw) : defaultStats();
  } catch {
    return defaultStats();
  }
}

function saveStats(gameId: string, stats: GameStats) {
  localStorage.setItem(`iwo_${gameId}`, JSON.stringify(stats));
}

function yesterdayStr(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  istNow.setDate(istNow.getDate() - 1);
  return istNow.toISOString().split("T")[0];
}

export function recordWin(gameId: string): GameStats {
  const stats = getStats(gameId);
  const today = getTodayStr();
  if (stats.lastWonDate === today) return stats;
  stats.gamesPlayed++;
  stats.gamesWon++;
  stats.currentStreak = stats.lastWonDate === yesterdayStr() ? stats.currentStreak + 1 : 1;
  stats.lastWonDate = today;
  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  saveStats(gameId, stats);
  return stats;
}

export function recordLoss(gameId: string): GameStats {
  const stats = getStats(gameId);
  stats.gamesPlayed++;
  stats.currentStreak = 0;
  saveStats(gameId, stats);
  return stats;
}

export function hasPlayedToday(gameId: string): boolean {
  const raw = typeof window !== "undefined" ? localStorage.getItem(`iwo_${gameId}_done`) : null;
  return raw === getTodayStr();
}

export function markPlayedToday(gameId: string) {
  localStorage.setItem(`iwo_${gameId}_done`, getTodayStr());
}

// ── Share / Challenge ──

export function buildShareText(game: string, detail: string, streak: number): string {
  return `${game} — i walked out\n${detail}\n${streak > 0 ? `🔥 ${streak} day streak` : ""}\nhttps://i-walked-out.vercel.app/games`.trim();
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch {
      /* cancelled */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
