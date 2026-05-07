"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getStats, GameStats, buildShareText, shareOrCopy } from "@/lib/games";
import { getArchive, ArchiveEntry } from "@/lib/archive";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import ArchiveView from "@/components/games/ArchiveView";
import LeaderboardView from "@/components/games/LeaderboardView";

const WordleGame = dynamic(() => import("@/components/games/WordleGame"), { ssr: false });
const SudokuGame = dynamic(() => import("@/components/games/SudokuGame"), { ssr: false });
const SpellingBeeGame = dynamic(() => import("@/components/games/SpellingBeeGame"), { ssr: false });
const CrosswordGame = dynamic(() => import("@/components/games/CrosswordGame"), { ssr: false });
const TangoGame = dynamic(() => import("@/components/games/TangoGame"), { ssr: false });

const GAMES = [
  { id: "wordle", label: "Wordle", emoji: "🟩" },
  { id: "crossword", label: "Crossword", emoji: "✏️" },
  { id: "sudoku", label: "Sudoku", emoji: "🔢" },
  { id: "spelling", label: "Spelling Bee", emoji: "🐝" },
  { id: "tango", label: "Tango", emoji: "☀️" },
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

  return (
    <div className="page-in" style={{ padding: "20px clamp(16px, 4vw, 48px) 40px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            ✦ games corner · daily ✦
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 56px)", margin: 0, fontWeight: 400, lineHeight: 1.05, fontStyle: "italic" }}>
            Play something. <em style={{ color: "var(--rose)" }}>Keep a streak.</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            New puzzles every day. Solve them all, build your streak, challenge your friends.
          </p>
        </div>

        {/* Date navigator */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          marginBottom: 20,
        }}>
          <button
            onClick={goBack}
            className="btn-ghost"
            style={{ padding: "6px 10px", display: "flex", alignItems: "center" }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToday}
            className="typewriter"
            style={{
              fontSize: 13, letterSpacing: "0.1em", padding: "6px 16px",
              background: isToday ? "var(--ink)" : "var(--paper-deep)",
              color: isToday ? "var(--paper-light)" : "var(--ink)",
              border: "2px solid var(--ink)", borderRadius: 2, cursor: "pointer",
              minWidth: 160, textAlign: "center",
            }}
          >
            {isToday ? "TODAY" : formatDate(playDate)}
          </button>
          <button
            onClick={goForward}
            disabled={isToday}
            className="btn-ghost"
            style={{
              padding: "6px 10px", display: "flex", alignItems: "center",
              opacity: isToday ? 0.3 : 1, cursor: isToday ? "default" : "pointer",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {!isToday && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span className="typewriter" style={{
              fontSize: 11, letterSpacing: "0.12em", color: "var(--teal)",
              background: "rgba(42, 95, 214, 0.08)", padding: "5px 14px", borderRadius: 2,
            }}>
              playing {formatDate(playDate)}&apos;s puzzles
            </span>
          </div>
        )}

        {/* Streak bar */}
        <div
          className="paper"
          style={{
            padding: "16px 24px",
            background: "#faf3df",
            margin: "0 auto 28px",
            maxWidth: 700,
            transform: "rotate(-0.3deg)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div className="tape tape-rose" style={{ top: -12, left: 40, transform: "rotate(-3deg)" }} />

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {GAMES.map((g) => {
              const s = allStats[g.id];
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{g.emoji}</span>
                  <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-faded)" }}>
                    {s?.currentStreak || 0}
                  </span>
                  {(s?.currentStreak || 0) > 0 && <span style={{ fontSize: 12 }}>🔥</span>}
                </div>
              );
            })}
          </div>

          <button
            onClick={shareAllStreaks}
            className="typewriter"
            style={{
              fontSize: 11, color: "var(--teal)", background: "none",
              border: "1px dashed var(--teal)", borderRadius: 2,
              padding: "5px 12px", cursor: "pointer", letterSpacing: "0.1em",
            }}
          >
            {shareMsg || "challenge a friend"}
          </button>
        </div>

        {/* Game tabs */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className="typewriter"
              style={{
                padding: "10px 20px",
                background: active === g.id ? "var(--ink)" : "transparent",
                color: active === g.id ? "var(--paper-light)" : "var(--ink)",
                border: `2px solid ${active === g.id ? "var(--ink)" : "var(--ink-faded)"}`,
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.2s ease",
              }}
            >
              {g.emoji} {g.label}
            </button>
          ))}
          <button
            onClick={() => {
              setActive("archive");
              if (archive.length === 0) {
                setArchiveLoading(true);
                getArchive().then((a) => { setArchive(a); setArchiveLoading(false); });
              }
            }}
            className="typewriter"
            style={{
              padding: "10px 20px",
              background: active === "archive" ? "var(--ink)" : "transparent",
              color: active === "archive" ? "var(--paper-light)" : "var(--ink)",
              border: `2px solid ${active === "archive" ? "var(--ink)" : "var(--ink-faded)"}`,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: 2,
              transition: "all 0.2s ease",
            }}
          >
            📜 Archive
          </button>
          <button
            onClick={() => setActive("leaderboard")}
            className="typewriter"
            style={{
              padding: "10px 20px",
              background: active === "leaderboard" ? "var(--ink)" : "transparent",
              color: active === "leaderboard" ? "var(--paper-light)" : "var(--ink)",
              border: `2px solid ${active === "leaderboard" ? "var(--ink)" : "var(--ink-faded)"}`,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: 2,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trophy size={14} /> Leaderboard
          </button>
        </div>

        {/* Game container */}
        <div
          className="paper page-in"
          key={playDate}
          style={{
            padding: "32px 24px 40px",
            position: "relative",
            minHeight: 400,
            background: "var(--paper-light)",
          }}
        >
          <div className="tape tape-teal" style={{ top: -12, left: "50%", marginLeft: -40, transform: "rotate(-2deg)" }} />

          <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 20, textAlign: "center" }}>
            {active === "archive" ? "✦ your game archive ✦" : active === "leaderboard" ? "✦ leaderboard ✦" : `✦ ${isToday ? "daily" : formatDate(playDate)} ${GAMES.find((g) => g.id === active)?.label} ✦`}
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

        {/* Stats section */}
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {GAMES.map((g) => {
            const s = allStats[g.id];
            return (
              <div
                key={g.id}
                className="paper"
                style={{
                  padding: "20px 18px",
                  textAlign: "center",
                  transform: `rotate(${(g.id.charCodeAt(0) % 5) - 2}deg)`,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{g.emoji}</div>
                <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 8 }}>
                  {g.label}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 28, fontFamily: "'Bungee', system-ui", color: "var(--ink)" }}>
                      {s?.currentStreak || 0}
                    </div>
                    <div className="typewriter" style={{ fontSize: 9, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
                      STREAK
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontFamily: "'Bungee', system-ui", color: "var(--ink-faded)" }}>
                      {s?.maxStreak || 0}
                    </div>
                    <div className="typewriter" style={{ fontSize: 9, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
                      BEST
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontFamily: "'Bungee', system-ui", color: "var(--teal)" }}>
                      {s?.gamesWon || 0}
                    </div>
                    <div className="typewriter" style={{ fontSize: 9, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
                      WON
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
