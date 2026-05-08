"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getStats, GameStats, buildShareText, shareOrCopy } from "@/lib/games";
import { getArchive, ArchiveEntry } from "@/lib/archive";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ArchiveView from "@/components/games/ArchiveView";
import LeaderboardView from "@/components/games/LeaderboardView";
import GameSidebar, { GAMES, GameId } from "@/components/games/GameSidebar";

const WordleGame = dynamic(() => import("@/components/games/WordleGame"), { ssr: false });
const SudokuGame = dynamic(() => import("@/components/games/SudokuGame"), { ssr: false });
const SpellingBeeGame = dynamic(() => import("@/components/games/SpellingBeeGame"), { ssr: false });
const CrosswordGame = dynamic(() => import("@/components/games/CrosswordGame"), { ssr: false });
const TangoGame = dynamic(() => import("@/components/games/TangoGame"), { ssr: false });

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
  const crosswordVariant = "normal" as const;
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
    fetch(url, { cache: "no-store" })
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
    <div className="page-in" style={{ padding: "20px clamp(12px, 4vw, 48px) 40px", overflow: "hidden" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", overflow: "hidden" }}>

        {/* Header row - puzzle-head style */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 28,
        }}>
          <div>
            {/* Eyebrow */}
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <span style={{ display: "inline-block", width: 22, height: 1, background: "var(--ink-3)" }} />
              games corner
            </div>
            <h1 style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(28px, 4vw, 40px)",
              margin: 0,
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.1,
              color: "var(--ink)",
            }}>
              Daily <em>Puzzles.</em>
            </h1>
          </div>

          {/* Date navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={goBack}
              style={{
                appearance: "none",
                border: "1px solid var(--ink)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "var(--mono)",
                fontSize: 14,
                padding: "10px 0",
                width: 38,
                cursor: "pointer",
                borderRadius: 3,
                transition: "background 0.15s, color 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={goToday}
              style={{
                appearance: "none",
                border: "1px solid var(--ink)",
                background: isToday ? "var(--ink)" : "var(--paper)",
                color: isToday ? "var(--paper)" : "var(--ink)",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "10px 24px",
                cursor: "pointer",
                borderRadius: 3,
                fontWeight: isToday ? 500 : 400,
                transition: "background 0.15s, color 0.15s",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              {isToday ? "TODAY" : formatDate(playDate)}
            </button>

            <button
              onClick={goForward}
              disabled={isToday}
              style={{
                appearance: "none",
                border: "1px solid var(--ink)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "var(--mono)",
                fontSize: 14,
                padding: "10px 0",
                width: 38,
                cursor: "pointer",
                borderRadius: 3,
                transition: "background 0.15s, color 0.15s",
                opacity: isToday ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={14} />
            </button>

            <button
              onClick={shareAllStreaks}
              style={{
                appearance: "none",
                border: "1px solid var(--ink)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "10px 16px",
                cursor: "pointer",
                borderRadius: 3,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {shareMsg || "share"}
            </button>
          </div>
        </div>

        {!isToday && (
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--accent)",
              background: "var(--note-1)",
              padding: "5px 14px",
              borderRadius: 3,
              textTransform: "uppercase",
            }}>
              playing {formatDate(playDate)}&apos;s puzzles
            </span>
          </div>
        )}

        {/* Arcade layout: 320px sidebar + fluid main */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 32,
          alignItems: "start",
        }}>

          <GameSidebar
            active={active}
            allStats={allStats}
            onSelect={setActive}
            onArchiveClick={() => {
              setActive("archive");
              if (archive.length === 0) {
                setArchiveLoading(true);
                getArchive().then((a) => { setArchive(a); setArchiveLoading(false); });
              }
            }}
          />

          {/* Main puzzle area - paper card */}
          <div
            className="page-in"
            key={`${playDate}-${active}`}
            style={{
              border: "1px solid var(--ink)",
              background: "var(--paper)",
              borderRadius: 4,
              padding: "36px 40px 40px",
              boxShadow: "6px 6px 0 var(--paper-edge)",
              position: "relative",
              minHeight: 460,
              overflow: "hidden",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Eyebrow line */}
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              margin: "0 0 20px",
            }}>
              {active === "archive"
                ? "your game archive"
                : active === "leaderboard"
                  ? "leaderboard"
                  : `${isToday ? "daily" : formatDate(playDate)} ${GAMES.find((g) => g.id === active)?.label}`}
            </div>

            {active === "leaderboard" ? (
              <LeaderboardView />
            ) : active === "archive" ? (
              <ArchiveView entries={archive} loading={archiveLoading} />
            ) : loading ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}>
                  loading {isToday ? "today" : formatDate(playDate)}&apos;s puzzles...
                </div>
              </div>
            ) : (
              <>
                {active === "wordle" && <WordleGame answer={puzzles?.wordle?.answer} playDate={playDate} />}
                {active === "sudoku" && <SudokuGame puzzle={puzzles?.sudoku} playDate={playDate} />}
                {active === "spelling" && <SpellingBeeGame puzzle={puzzles?.spelling} playDate={playDate} />}
                {active === "crossword" && (
                  <>
                    {puzzles?.crossword?.theme && (
                      <h2 style={{
                        fontFamily: "var(--serif)",
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: 32,
                        lineHeight: 1.2,
                        textAlign: "center",
                        color: "var(--accent)",
                        margin: "0 0 24px",
                      }}>
                        Today&apos;s Theme: {puzzles.crossword.theme}
                      </h2>
                    )}
                    <CrosswordGame
                      puzzle={puzzles?.crossword}
                      playDate={playDate}
                      variant={crosswordVariant}
                    />
                  </>
                )}
                {active === "tango" && <TangoGame puzzle={puzzles?.tango} playDate={playDate} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
