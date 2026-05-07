"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getStats, GameStats, buildShareText, shareOrCopy } from "@/lib/games";
import { getArchive, ArchiveEntry } from "@/lib/archive";
import { ChevronLeft, ChevronRight, Trophy, ScrollText } from "lucide-react";
import ArchiveView from "@/components/games/ArchiveView";
import LeaderboardView from "@/components/games/LeaderboardView";

const WordleGame = dynamic(() => import("@/components/games/WordleGame"), { ssr: false });
const SudokuGame = dynamic(() => import("@/components/games/SudokuGame"), { ssr: false });
const SpellingBeeGame = dynamic(() => import("@/components/games/SpellingBeeGame"), { ssr: false });
const CrosswordGame = dynamic(() => import("@/components/games/CrosswordGame"), { ssr: false });
const TangoGame = dynamic(() => import("@/components/games/TangoGame"), { ssr: false });

const GAMES = [
  { id: "wordle", label: "Wordle", emoji: "🟩", color: "var(--moss)" },
  { id: "crossword", label: "Crossword", emoji: "✏️", color: "var(--butter)" },
  { id: "sudoku", label: "Sudoku", emoji: "🔢", color: "var(--teal)" },
  { id: "spelling", label: "Spelling Bee", emoji: "🐝", color: "var(--rose)" },
  { id: "tango", label: "Tango", emoji: "☀️", color: "var(--plum)" },
] as const;

type GameId = (typeof GAMES)[number]["id"] | "archive" | "leaderboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Puzzles = Record<string, any>;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function GamesPage() {
  const [active, setActive] = useState<GameId>("wordle");
  const [allStats, setAllStats] = useState<Record<string, GameStats>>({});
  const [shareMsg, setShareMsg] = useState("");
  const [playDate, setPlayDate] = useState(todayStr);
  const [puzzles, setPuzzles] = useState<Puzzles | null>(null);
  const [loading, setLoading] = useState(true);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const isToday = playDate === todayStr();

  const fetchPuzzles = useCallback((date: string) => {
    setLoading(true);
    setPuzzles(null);
    const url = date === todayStr() ? "/api/games/daily" : `/api/games/daily?date=${date}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setPuzzles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPuzzles(playDate);
  }, [playDate, fetchPuzzles]);

  useEffect(() => {
    const s: Record<string, GameStats> = {};
    GAMES.forEach((g) => { s[g.id] = getStats(g.id); });
    setAllStats(s);

    const interval = setInterval(() => {
      const updated: Record<string, GameStats> = {};
      GAMES.forEach((g) => { updated[g.id] = getStats(g.id); });
      setAllStats(updated);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function goBack() {
    setPlayDate((d) => shiftDate(d, -1));
  }

  function goForward() {
    if (!isToday) setPlayDate((d) => shiftDate(d, 1));
  }

  function goToday() {
    setPlayDate(todayStr());
  }

  const totalStreak = Math.min(
    ...GAMES.map((g) => allStats[g.id]?.currentStreak ?? 0)
  );

  async function shareAllStreaks() {
    const lines = GAMES.map((g) => {
      const s = allStats[g.id];
      return `${g.emoji} ${g.label}: ${s?.currentStreak || 0} day streak`;
    });
    const text = buildShareText(
      "Games Corner",
      lines.join("\n"),
      totalStreak
    );
    const r = await shareOrCopy(text);
    setShareMsg(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : "");
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
  }

  const isGameActive = (id: string) => active === id;

  return (
    <div className="page-in" style={{ padding: "20px clamp(16px, 4vw, 48px) 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 6 }}>
              games corner
            </div>
            <h1 className="serif" style={{ fontSize: "clamp(28px, 4vw, 40px)", margin: 0, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1 }}>
              Daily Puzzles
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={goBack} className="btn-ghost" style={{ padding: "6px 8px", display: "flex", alignItems: "center", border: "1px solid rgba(106,112,140,0.3)" }}>
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToday}
              className="typewriter"
              style={{
                fontSize: 12, letterSpacing: "0.1em", padding: "6px 14px",
                background: isToday ? "var(--ink)" : "var(--paper-deep)",
                color: isToday ? "var(--paper-light)" : "var(--ink)",
                border: "1px solid var(--ink)", borderRadius: 2, cursor: "pointer",
                minWidth: 120, textAlign: "center",
              }}
            >
              {isToday ? "TODAY" : formatDate(playDate)}
            </button>
            <button
              onClick={goForward}
              disabled={isToday}
              className="btn-ghost"
              style={{ padding: "6px 8px", display: "flex", alignItems: "center", opacity: isToday ? 0.3 : 1, cursor: isToday ? "default" : "pointer", border: "1px solid rgba(106,112,140,0.3)" }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={shareAllStreaks}
              className="typewriter"
              style={{
                fontSize: 10, color: "var(--teal)", background: "none",
                border: "1px solid rgba(42, 95, 214, 0.3)", borderRadius: 2,
                padding: "6px 12px", cursor: "pointer", letterSpacing: "0.1em",
                marginLeft: 4,
              }}
            >
              {shareMsg || "share"}
            </button>
          </div>
        </div>

        {!isToday && (
          <div style={{ marginBottom: 16 }}>
            <span className="typewriter" style={{
              fontSize: 11, letterSpacing: "0.12em", color: "var(--teal)",
              background: "rgba(42, 95, 214, 0.08)", padding: "5px 14px", borderRadius: 2,
            }}>
              playing {formatDate(playDate)}&apos;s puzzles
            </span>
          </div>
        )}

        {/* Two-column layout */}
        <div className="games-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Game cards */}
            {GAMES.map((g) => {
              const s = allStats[g.id];
              const streak = s?.currentStreak || 0;
              const won = s?.gamesWon || 0;
              const selected = isGameActive(g.id);

              return (
                <button
                  key={g.id}
                  onClick={() => setActive(g.id)}
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

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(106, 112, 140, 0.15)", margin: "4px 0" }} />

            {/* Archive */}
            <button
              onClick={() => {
                setActive("archive");
                if (archive.length === 0) {
                  setArchiveLoading(true);
                  getArchive().then((a) => { setArchive(a); setArchiveLoading(false); });
                }
              }}
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

            {/* Leaderboard */}
            <button
              onClick={() => setActive("leaderboard")}
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

          {/* Main game area */}
          <div
            className="paper page-in"
            key={`${playDate}-${active}`}
            style={{
              padding: "28px 24px 36px",
              position: "relative",
              minHeight: 460,
              background: "var(--paper-light)",
            }}
          >
            <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 20 }}>
              {active === "archive" ? "your game archive" : active === "leaderboard" ? "leaderboard" : `${isToday ? "daily" : formatDate(playDate)} ${GAMES.find((g) => g.id === active)?.label}`}
            </div>

            {active === "leaderboard" ? (
              <LeaderboardView />
            ) : active === "archive" ? (
              <ArchiveView entries={archive} loading={archiveLoading} />
            ) : loading ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.15em" }}>
                  loading {isToday ? "today" : formatDate(playDate)}&apos;s puzzles...
                </div>
              </div>
            ) : (
              <>
                {active === "wordle" && <WordleGame answer={puzzles?.wordle?.answer} playDate={playDate} />}
                {active === "sudoku" && <SudokuGame puzzle={puzzles?.sudoku} playDate={playDate} />}
                {active === "spelling" && <SpellingBeeGame puzzle={puzzles?.spelling} playDate={playDate} />}
                {active === "crossword" && <CrosswordGame puzzle={puzzles?.crossword} playDate={playDate} />}
                {active === "tango" && <TangoGame puzzle={puzzles?.tango} playDate={playDate} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
