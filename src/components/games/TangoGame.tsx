"use client";

import { useState, useEffect } from "react";
import { getDayNumber, getTodayStr, getStats, recordWin, hasPlayedToday, markPlayedToday, GameStats } from "@/lib/games";
import { saveGameResult } from "@/lib/archive";
import { useGameTimer, formatTime } from "@/hooks/useGameTimer";
import { useShareResult } from "@/hooks/useShareResult";
import TangoGrid from "./TangoGrid";

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
      if (c >= 2 && grid[r][c] === grid[r][c - 1] && grid[r][c] === grid[r][c - 2]) {
        violations[r][c] = violations[r][c - 1] = violations[r][c - 2] = true;
      }
      if (r >= 2 && grid[r][c] === grid[r - 1][c] && grid[r][c] === grid[r - 2][c]) {
        violations[r][c] = violations[r - 1][c] = violations[r - 2][c] = true;
      }
    }
  }

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
  const [stats, setStats] = useState<GameStats | null>(null);

  const isToday = !playDate || playDate === getTodayStr();
  const { timer } = useGameTimer(!gameOver);
  const { shareMsg, share } = useShareResult();

  useEffect(() => {
    if (!puzzleProp) return;
    setGrid(puzzleProp.grid.map((r) => [...r]));
    setSolution(puzzleProp.solution);
    setGiven(puzzleProp.given);
    setStats(getStats("tango"));
  }, []);

  function toggleCell(row: number, col: number) {
    if (gameOver || given[row]?.[col]) return;
    const newGrid = grid.map((r) => [...r]);
    const current = newGrid[row][col];
    newGrid[row][col] = current === 0 ? SUN : current === SUN ? MOON : 0;
    setGrid(newGrid);

    const isFull = newGrid.every((r) => r.every((c) => c !== 0));
    if (isFull) {
      const isCorrect = newGrid.every((r, ri) => r.every((c, ci) => c === solution[ri][ci]));
      if (isCorrect) {
        setGameOver(true);
        setWon(true);
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
    await share(`Tango #${getDayNumber()}`, `Solved in ${formatTime(timer)}\n${emoji}`, stats?.currentStreak || 0);
  }

  const violations = checkViolations(grid);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-3)", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
        Fill each cell with ☀️ or 🌙. No 3 in a row. Each row/col needs exactly 3 of each.
      </div>

      <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: "0.12em", color: gameOver ? "var(--accent)" : "var(--ink)" }}>
        {formatTime(timer)}
      </div>

      <TangoGrid grid={grid} given={given} violations={violations} gameOver={gameOver} size={SIZE} onToggle={toggleCell} />

      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em" }}>
          TAP TO CYCLE: empty → ☀️ → 🌙 → empty
        </span>
      </div>

      {gameOver && won && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ fontFamily: "var(--serif)", fontSize: 22, fontStyle: "italic", color: "var(--accent)" }}>
            Solved in {formatTime(timer)}!
          </p>
          <button onClick={handleShare} className="btn-ink" style={{ fontSize: 13, marginTop: 8 }}>
            {shareMsg || "share result"}
          </button>
        </div>
      )}
    </div>
  );
}
