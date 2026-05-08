"use client";

import { Trophy, ScrollText } from "lucide-react";
import { GameStats } from "@/lib/games";

const GAMES = [
  { id: "wordle", label: "Wordle", emoji: "🟩", color: "#6aaa64", tileText: "W", tileFontFamily: "var(--mono)", tileFontWeight: 600, tileFontSize: "13px", tileColor: "#fff" },
  { id: "crossword", label: "Crossword", emoji: "✏️", color: "var(--paper-deep)", tileText: "✏︎", tileFontFamily: undefined, tileFontWeight: undefined, tileFontSize: "24px", tileColor: "var(--ink)" },
  { id: "sudoku", label: "Sudoku", emoji: "🔢", color: "linear-gradient(135deg, #b8d4f0, #6e9bd0)", tileText: "12\n34", tileFontFamily: "var(--mono)", tileFontWeight: 600, tileFontSize: "11px", tileColor: "#1a3a5c" },
  { id: "spelling", label: "Spelling Bee", emoji: "🐝", color: "#f4c430", tileText: "🐝", tileFontFamily: undefined, tileFontWeight: undefined, tileFontSize: "24px", tileColor: "#2a1a08" },
  { id: "tango", label: "Tango", emoji: "☀️", color: "#ffd56b", tileText: "☀︎", tileFontFamily: undefined, tileFontWeight: undefined, tileFontSize: "24px", tileColor: "#6a4310" },
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
    <div className="game-sidebar" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Game list */}
      <div className="game-sidebar-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GAMES.map((g) => {
          const s = allStats[g.id];
          const streak = s?.currentStreak || 0;
          const won = s?.gamesWon || 0;
          const selected = active === g.id;

          const isGradient = g.color.startsWith("linear-gradient");

          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                background: selected ? "var(--ink)" : "var(--paper)",
                color: selected ? "var(--paper)" : "var(--ink)",
                border: "1px solid var(--ink)",
                borderRadius: 4,
                cursor: "pointer",
                textAlign: "left",
                transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
                boxShadow: selected
                  ? "4px 4px 0 var(--paper-edge)"
                  : "3px 3px 0 var(--paper-edge)",
                position: "relative",
                textDecoration: "none",
              }}
            >
              {/* Colored tile */}
              <span
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  fontSize: g.tileFontSize || "24px",
                  flexShrink: 0,
                  background: isGradient ? g.color : g.color,
                  color: selected && g.id === "crossword" ? "var(--paper)" : g.tileColor,
                  fontFamily: g.tileFontFamily || "inherit",
                  fontWeight: g.tileFontWeight || "normal",
                  lineHeight: g.id === "sudoku" ? 1.05 : undefined,
                  padding: g.id === "sudoku" ? 4 : undefined,
                  whiteSpace: "pre",
                  ...(selected && g.id === "crossword"
                    ? { background: "rgba(243,236,224,0.12)" }
                    : {}),
                }}
              >
                {g.tileText}
              </span>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 19,
                  fontWeight: 500,
                  lineHeight: 1.1,
                  fontStyle: "italic",
                }}>
                  {g.label}
                </div>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10.5px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: selected ? "rgba(243,236,224,0.55)" : "var(--ink-3)",
                }}>
                  {streak > 0 ? `${streak} day streak` : `${won} won`}
                </div>
              </div>

              {/* Flame */}
              {streak > 0 ? (
                <span style={{ fontSize: 16, flexShrink: 0 }}>🔥</span>
              ) : (
                <span style={{ fontSize: 16, flexShrink: 0, filter: "grayscale(1)", opacity: 0.35 }}>🔥</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Side extras */}
      <div style={{
        marginTop: 18,
        borderTop: "1px dashed var(--rule)",
        paddingTop: 18,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
        <button
          onClick={onArchiveClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: active === "archive" ? "var(--note-1)" : "transparent",
            color: active === "archive" ? "var(--ink)" : "var(--ink-2)",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "var(--serif)",
            fontSize: 17,
            transition: "background 0.15s",
            textDecoration: "none",
          }}
        >
          <ScrollText size={16} style={{ flexShrink: 0, opacity: 0.7, width: 22, textAlign: "center" }} />
          <span>Archive</span>
        </button>

        <button
          onClick={() => onSelect("leaderboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: active === "leaderboard" ? "var(--note-1)" : "transparent",
            color: active === "leaderboard" ? "var(--ink)" : "var(--ink-2)",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "var(--serif)",
            fontSize: 17,
            transition: "background 0.15s",
            textDecoration: "none",
          }}
        >
          <Trophy size={16} style={{ flexShrink: 0, opacity: 0.7, width: 22, textAlign: "center" }} />
          <span>Leaderboard</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .game-sidebar {
            flex-direction: row !important;
            gap: 8px !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }
          .game-sidebar-list {
            flex-direction: row !important;
            gap: 8px !important;
          }
          .game-sidebar-list > button {
            min-width: 140px;
            flex-shrink: 0;
            padding: 10px 12px !important;
          }
          .game-sidebar-list > button > span:first-child {
            width: 32px !important;
            height: 32px !important;
          }
          .game-sidebar > div:last-child {
            flex-direction: row !important;
            border-top: none !important;
            border-left: 1px dashed var(--rule);
            padding-top: 0 !important;
            padding-left: 8px;
            margin-top: 0 !important;
            gap: 4px !important;
          }
          .game-sidebar > div:last-child > button {
            padding: 10px 12px !important;
            font-size: 14px !important;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}
