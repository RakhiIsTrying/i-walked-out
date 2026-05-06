export interface ArchiveEntry {
  id: string;
  game_type: "wordle" | "crossword" | "sudoku" | "spelling";
  played_at: string;
  won: boolean;
  score: number;
  result: Record<string, unknown>;
  created_at: string;
}

export async function saveGameResult(
  game_type: string,
  won: boolean,
  score: number,
  result: Record<string, unknown>,
  played_at?: string,
): Promise<void> {
  try {
    await fetch("/api/games/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_type, won, score, result, played_at }),
    });
  } catch {
    // Silently fail — archiving is best-effort
  }
}

export async function getArchive(): Promise<ArchiveEntry[]> {
  try {
    const res = await fetch("/api/games/archive");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
