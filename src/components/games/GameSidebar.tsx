"use client";

import { Trophy, ScrollText } from "lucide-react";
import { GameStats } from "@/lib/games";

const GAMES = [
  { id: "wordle", label: "Wordle", emoji: "🟩", color: "var(--moss)" },
  { id: "crossword", label: "Crossword", emoji: "✏️", color: "var(--butter)" },
  { id: "sudoku", label: "Sudoku", emoji: "🔢", color: "var(--teal)" },
  { id: "spelling", label: "Spelling Bee", emoji: "🐝", color: "var(--rose)" },
  { id: "tango", label: "Tango", emoji: "☀️", color: "var(--plum)" },
] as const;

type GameId = (typeof GAMES)[number]["id"] | "archive" | "leaderboard";

interface GameSidebarProps {
  active: GameId;
  allStats: Record<string, GameStats>;
  onSelect: (id: GameId) => void;
  onArchiveClick: () => void;
}

export { GAMES };
export type { GameId };

export default function GameSidebar({ active, allStats, onSelect, onArchiveClick }: GameSidebarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {GAMES.map((g) => {
        const s = allStats[g.id];
        const streak = s?.currentStreak || 0;
        const won = s?.gamesWon || 0;
        const selected = active === g.id;

        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: selected ? "var(--ink)" : "var(--paper-light)",
              color: selected ? "var(--paper-light)" : "var(--ink)",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
              boxShadow: selected
                ? "0 2px 8px rgba(26, 31, 58, 0.25)"
                : "0 1px 3px rgba(34, 30, 24, 0.08)",
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{g.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>
                {g.label}
              </div>
              <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6 }}>
                {streak > 0 ? `${streak} day streak` : `${won} won`}
              </div>
            </div>
            {streak > 0 && (
              <span style={{ fontSize: 14, flexShrink: 0 }}>🔥</span>
            )}
          </button>
        );
      })}

      <div style={{ height: 1, background: "rgba(106, 112, 140, 0.15)", margin: "4px 0" }} />

      <button
        onClick={onArchiveClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: active === "archive" ? "var(--ink)" : "transparent",
          color: active === "archive" ? "var(--paper-light)" : "var(--ink-soft)",
          border: "none",
          borderRadius: 3,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s ease",
        }}
      >
        <ScrollText size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
        <span className="serif" style={{ fontSize: 14 }}>Archive</span>
      </button>

      <button
        onClick={() => onSelect("leaderboard")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: active === "leaderboard" ? "var(--ink)" : "transparent",
          color: active === "leaderboard" ? "var(--paper-light)" : "var(--ink-soft)",
          border: "none",
          borderRadius: 3,
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s ease",
        }}
      >
        <Trophy size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
        <span className="serif" style={{ fontSize: 14 }}>Leaderboard</span>
      </button>
    </div>
  );
}
