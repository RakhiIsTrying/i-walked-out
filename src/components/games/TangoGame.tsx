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

function generateTangoSolution(rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  function isValidPlacement(row: number, col: number, val: number): boolean {
    // Check no 3 consecutive in row
    if (col >= 2 && grid[row][col - 1] === val && grid[row][col - 2] === val) return false;
    // Check no 3 consecutive in column
    if (row >= 2 && grid[row - 1][col] === val && grid[row - 2][col] === val) return false;
    // Check row count
    const rowCount = grid[row].filter((c) => c === val).length;
    if (rowCount >= 3) return false;
    // Check column count
    let colCount = 0;
    for (let r = 0; r < SIZE; r++) {
      if (grid[r][col] === val) colCount++;
    }
    if (colCount >= 3) return false;
    return true;
  }

  function solve(pos: number): boolean {
    if (pos === SIZE * SIZE) return true;
    const row = Math.floor(pos / SIZE);
    const col = pos % SIZE;
    const values = rng() > 0.5 ? [SUN, MOON] : [MOON, SUN];
    for (const val of values) {
      if (isValidPlacement(row, col, val)) {
        grid[row][col] = val;
        if (solve(pos + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0);
  return grid;
}

function createTangoPuzzle(solution: number[][], rng: () => number): { puzzle: number[][]; given: boolean[][] } {
  const puzzle = solution.map((r) => [...r]);
  const given: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(true));
  const cells = Array.from({ length: SIZE * SIZE }, (_, i) => i);

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let removed = 0;
  const target = 20 + Math.floor(rng() * 4);
  for (const idx of cells) {
    if (removed >= target) break;
    const row = Math.floor(idx / SIZE);
    const col = idx % SIZE;
    puzzle[row][col] = 0;
    given[row][col] = false;
    removed++;
  }

  return { puzzle, given };
}

function generateFallbackTango() {
  const day = getDayNumber();
  let seed = (day + 99) * 2654435761;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const solution = generateTangoSolution(rng);
  const { puzzle, given } = createTangoPuzzle(solution, rng);
  return { grid: puzzle, solution, given };
}

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
    const data = puzzleProp || generateFallbackTango();
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Rules */}
      <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-faded)", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
        Fill each cell with ☀️ or 🌙. No 3 in a row. Each row/col needs exactly 3 of each.
      </div>

      {/* Timer */}
      <div className="typewriter" style={{ fontSize: 14, letterSpacing: "0.12em", color: gameOver ? "var(--teal)" : "var(--ink)" }}>
        {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: 4, width: "fit-content" }}>
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
                  width: 52, height: 52,
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
