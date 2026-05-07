"use client";

import { ArchiveEntry } from "@/lib/archive";

const GAME_EMOJI: Record<string, string> = { wordle: "🟩", crossword: "✏️", sudoku: "🔢", spelling: "🐝", tango: "☀️" };

function formatArchiveResult(entry: ArchiveEntry): string {
  const r = entry.result as Record<string, unknown>;
  if (entry.game_type === "wordle") {
    return entry.won ? `${r.attempts || "?"}/6` : `X/6 — ${r.answer || ""}`;
  }
  if (entry.game_type === "crossword" || entry.game_type === "sudoku" || entry.game_type === "tango") {
    const t = r.time as number;
    if (t != null) return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  }
  if (entry.game_type === "spelling") {
    return `${entry.score} pts · ${(r.words as string[])?.length || 0} words`;
  }
  return entry.won ? "Won" : "Played";
}

export default function ArchiveView({ entries, loading }: { entries: ArchiveEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.15em" }}>
          loading archive...
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📜</div>
        <p className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.12em" }}>
          No games archived yet. Sign in and play to start building your history.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px",
            background: "var(--paper-deep)",
            borderRadius: 2,
            border: "1px solid var(--ink-faded)",
          }}
        >
          <span style={{ fontSize: 20 }}>{GAME_EMOJI[entry.game_type] || "🎮"}</span>
          <div style={{ flex: 1 }}>
            <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "capitalize", color: "var(--ink)" }}>
              {entry.game_type === "spelling" ? "Spelling Bee" : entry.game_type}
            </div>
            <div className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.08em", marginTop: 2 }}>
              {new Date(entry.played_at + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--ink-soft)" }}>
            {formatArchiveResult(entry)}
          </div>
          <span
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 2,
              background: entry.won ? "var(--teal)" : "var(--rose)",
              color: "#fff",
              fontWeight: 700,
              fontFamily: "'Bungee', system-ui",
              letterSpacing: "0.05em",
            }}
          >
            {entry.won ? "W" : "L"}
          </span>
        </div>
      ))}
    </div>
  );
}
