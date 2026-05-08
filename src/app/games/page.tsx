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

          {/* Main game area */}
          <div
            className="paper page-in"
            key={`${playDate}-${active}`}
            style={{
              padding: "28px clamp(12px, 3vw, 24px) 36px",
              position: "relative",
              minHeight: 460,
              background: "var(--paper-light)",
              overflow: "hidden",
              maxWidth: "100%",
              boxSizing: "border-box",
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
                {active === "crossword" && (
                  <>
                    {puzzles?.crossword?.theme && (
                      <div className="serif" style={{ fontSize: 18, fontStyle: "italic", color: "var(--teal)", textAlign: "center", marginBottom: 16 }}>
                        Today&apos;s Theme: {puzzles.crossword.theme}
                      </div>
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
