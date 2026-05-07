"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  alias: string;
  wins: number;
  total_score: number;
  games_played: number;
}

const PERIODS = [
  { id: "daily", label: "Today" },
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
  { id: "yearly", label: "This Year" },
] as const;

const GAME_FILTERS = [
  { id: "all", label: "All Games", emoji: "🏆" },
  { id: "wordle", label: "Wordle", emoji: "🟩" },
  { id: "crossword", label: "Crossword", emoji: "✏️" },
  { id: "sudoku", label: "Sudoku", emoji: "🔢" },
  { id: "spelling", label: "Spelling Bee", emoji: "🐝" },
  { id: "tango", label: "Tango", emoji: "☀️" },
] as const;

export default function LeaderboardView() {
  const [period, setPeriod] = useState<string>("daily");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (gameFilter !== "all") params.set("game", gameFilter);
    fetch(`/api/games/leaderboard?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setEntries([]); setLoading(false); });
  }, [period, gameFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {GAME_FILTERS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGameFilter(g.id)}
            className="typewriter"
            style={{
              padding: "7px 14px",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: gameFilter === g.id ? "var(--teal)" : "transparent",
              color: gameFilter === g.id ? "#fff" : "var(--ink)",
              border: `1.5px solid ${gameFilter === g.id ? "var(--teal)" : "var(--ink-faded)"}`,
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="typewriter"
            style={{
              padding: "7px 16px",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: period === p.id ? "var(--rose)" : "transparent",
              color: period === p.id ? "#fff" : "var(--ink)",
              border: `1.5px solid ${period === p.id ? "var(--rose)" : "var(--ink-faded)"}`,
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.15em" }}>
            loading leaderboard...
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Trophy size={40} style={{ color: "var(--ink-faded)", marginBottom: 16 }} />
          <p className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.12em" }}>
            No games played yet for this period. Be the first!
          </p>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div
            className="typewriter leaderboard-row"
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 70px 80px 70px",
              gap: 8,
              padding: "8px 14px",
              fontSize: 9,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink-faded)",
              borderBottom: "1.5px dashed var(--ink-faded)",
            }}
          >
            <span>#</span>
            <span>Player</span>
            <span style={{ textAlign: "center" }}>Wins</span>
            <span style={{ textAlign: "center" }}>Score</span>
            <span style={{ textAlign: "center" }}>Played</span>
          </div>

          {entries.map((entry, i) => {
            const rank = i + 1;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            return (
              <div
                key={entry.user_id}
                className="leaderboard-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr 70px 80px 70px",
                  gap: 8,
                  padding: "12px 14px",
                  alignItems: "center",
                  background: rank <= 3 ? "rgba(42, 95, 214, 0.04)" : "transparent",
                  borderBottom: "1px solid var(--paper-deep)",
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  fontFamily: "'Bungee', system-ui",
                  fontSize: medal ? 18 : 16,
                  color: "var(--ink)",
                }}>
                  {medal || rank}
                </span>
                <span className="typewriter" style={{
                  fontSize: 13,
                  letterSpacing: "0.06em",
                  color: "var(--ink)",
                  fontWeight: rank <= 3 ? 700 : 400,
                }}>
                  {entry.alias}
                </span>
                <span style={{
                  textAlign: "center",
                  fontFamily: "'Bungee', system-ui",
                  fontSize: 16,
                  color: "var(--teal)",
                }}>
                  {entry.wins}
                </span>
                <span className="typewriter" style={{
                  textAlign: "center",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  color: "var(--ink-soft)",
                }}>
                  {entry.total_score}
                </span>
                <span className="typewriter" style={{
                  textAlign: "center",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  color: "var(--ink-faded)",
                }}>
                  {entry.games_played}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
