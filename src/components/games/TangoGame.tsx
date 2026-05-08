"use client";

import { useState, useEffect, useRef } from "react";
import { getDayNumber, getStats, recordWin, hasPlayedToday, markPlayedToday, buildShareText, shareOrCopy, GameStats } from "@/lib/games";
import { saveGameResult } from "@/lib/archive";

interface TangoProps {
  puzzle?: {
    grid: number[][];
    solution: number[][];
    given: boolean[][];
  };
  playDate?: string;
}

const SIZE = 6;
const SUN = 1;
const MOON = 2;

function checkViolations(grid: number[][]): boolean[][] {
  const violations: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  if (grid.length === 0) return violations;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) continue;
      // Check 3 consecutive in row
      if (c >= 2 && grid[r][c] === grid[r][c - 1] && grid[r][c] === grid[r][c - 2]) {
        violations[r][c] = violations[r][c - 1] = violations[r][c - 2] = true;
      }
      // Check 3 consecutive in column
      if (r >= 2 && grid[r][c] === grid[r - 1][c] && grid[r][c] === grid[r - 2][c]) {
        violations[r][c] = violations[r - 1][c] = violations[r - 2][c] = true;
      }
    }
  }

  // Check row/col counts
  for (let r = 0; r < SIZE; r++) {
    const sunCount = grid[r].filter((c) => c === SUN).length;
    const moonCount = grid[r].filter((c) => c === MOON).length;
    if (sunCount > 3 || moonCount > 3) {
      for (let c = 0; c < SIZE; c++) if (grid[r][c] !== 0) violations[r][c] = true;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let sunCount = 0, moonCount = 0;
    for (let r = 0; r < SIZE; r++) {
      if (grid[r][c] === SUN) sunCount++;
      if (grid[r][c] === MOON) moonCount++;
    }
    if (sunCount > 3 || moonCount > 3) {
      for (let r = 0; r < SIZE; r++) if (grid[r][c] !== 0) violations[r][c] = true;
    }
  }

  return violations;
}

export default function TangoGame({ puzzle: puzzleProp, playDate }: TangoProps) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [given, setGiven] = useState<boolean[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [shareMsg, setShareMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isToday = !playDate || playDate === new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!puzzleProp) return;
    const data = puzzleProp;
    setGrid(data.grid.map((r) => [...r]));
    setSolution(data.solution);
    setGiven(data.given);
    setStats(getStats("tango"));

    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function toggleCell(row: number, col: number) {
    if (gameOver || given[row]?.[col]) return;
    const newGrid = grid.map((r) => [...r]);
    const current = newGrid[row][col];
    newGrid[row][col] = current === 0 ? SUN : current === SUN ? MOON : 0;
    setGrid(newGrid);

    // Check if complete and correct
    const isFull = newGrid.every((r) => r.every((c) => c !== 0));
    if (isFull) {
      const isCorrect = newGrid.every((r, ri) => r.every((c, ci) => c === solution[ri][ci]));
      if (isCorrect) {
        setGameOver(true);
        setWon(true);
        if (timerRef.current) clearInterval(timerRef.current);
        if (!isToday || !hasPlayedToday("tango")) {
          if (isToday) markPlayedToday("tango");
          setStats(recordWin("tango"));
          saveGameResult("tango", true, timer, { time: timer }, playDate);
        }
      }
    }
  }

  async function handleShare() {
    const emoji = grid.map((r) => r.map((c) => c === SUN ? "☀️" : "🌙").join("")).join("\n");
    const text = buildShareText(
      `Tango #${getDayNumber()}`,
      `Solved in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}\n${emoji}`,
      stats?.currentStreak || 0
    );
    const r = await shareOrCopy(text);
    setShareMsg(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : "");
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
  }

  const violations = checkViolations(grid);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "100%", overflow: "hidden" }}>
      {/* Rules */}
      <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-faded)", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
        Fill each cell with ☀️ or 🌙. No 3 in a row. Each row/col needs exactly 3 of each.
      </div>

      {/* Timer */}
      <div className="typewriter" style={{ fontSize: 14, letterSpacing: "0.12em", color: gameOver ? "var(--teal)" : "var(--ink)" }}>
        {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 4, width: "min(100%, 340px)" }}>
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            const isGiven = given[ri]?.[ci];
            const hasViolation = violations[ri]?.[ci];
            return (
              <button
                key={`${ri}-${ci}`}
                onClick={() => toggleCell(ri, ci)}
                disabled={isGiven || gameOver}
                style={{
                  width: "100%", aspectRatio: "1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  background: hasViolation ? "rgba(210, 70, 70, 0.1)" :
                    isGiven ? "var(--paper-deep)" : "var(--paper-light)",
                  border: hasViolation ? "2px solid var(--rose)" :
                    isGiven ? "2px solid var(--ink)" : "2px solid var(--ink-faded)",
                  borderRadius: 4,
                  cursor: isGiven || gameOver ? "default" : "pointer",
                  transition: "all 0.15s",
                  opacity: isGiven ? 1 : 0.9,
                  fontWeight: isGiven ? 700 : 400,
                }}
              >
                {cell === SUN ? "☀️" : cell === MOON ? "🌙" : ""}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <span className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
          TAP TO CYCLE: empty → ☀️ → 🌙 → empty
        </span>
      </div>

      {/* Win state */}
      {gameOver && won && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--teal)" }}>
            Solved in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}!
          </p>
          <button onClick={handleShare} className="btn-paper" style={{ fontSize: 13, marginTop: 8 }}>
            {shareMsg || "share result"}
          </button>
        </div>
      )}
    </div>
  );
}
