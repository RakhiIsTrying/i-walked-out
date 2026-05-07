"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getDayNumber, getDailyRng, seededShuffle, getStats, recordWin, hasPlayedToday, markPlayedToday, buildShareText, shareOrCopy, GameStats } from "@/lib/games";
import { saveGameResult } from "@/lib/archive";

interface SudokuProps {
  puzzle?: {
    puzzle: number[][];
    solution: number[][];
    given: boolean[][];
  };
  playDate?: string;
}

const BASE_GRID = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9],
];

function generateLocal(rng: () => number): { solution: number[][]; puzzle: number[][]; given: boolean[][] } {
  const perm = seededShuffle([1,2,3,4,5,6,7,8,9], rng);
  let grid = BASE_GRID.map((row) => row.map((v) => perm[v - 1]));

  for (let band = 0; band < 3; band++) {
    const rows = [band * 3, band * 3 + 1, band * 3 + 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [grid[rows[i]], grid[rows[j]]] = [grid[rows[j]], grid[rows[i]]];
    }
  }

  const transposed = grid[0].map((_, c) => grid.map((r) => r[c]));
  for (let stack = 0; stack < 3; stack++) {
    const cols = [stack * 3, stack * 3 + 1, stack * 3 + 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [transposed[cols[i]], transposed[cols[j]]] = [transposed[cols[j]], transposed[cols[i]]];
    }
  }
  grid = transposed[0].map((_, c) => transposed.map((r) => r[c]));

  const solution = grid.map((r) => [...r]);
  const given: boolean[][] = grid.map(() => Array(9).fill(true));
  const cells = Array.from({ length: 81 }, (_, i) => i);
  const shuffled = seededShuffle(cells, rng);
  const toRemove = 45 + Math.floor(rng() * 6);

  for (let k = 0; k < toRemove && k < shuffled.length; k++) {
    const r = Math.floor(shuffled[k] / 9);
    const c = shuffled[k] % 9;
    grid[r][c] = 0;
    given[r][c] = false;
  }

  return { solution, puzzle: grid, given };
}

export default function SudokuGame({ puzzle: puzzleProp, playDate }: SudokuProps) {
  const [solution, setSolution] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [given, setGiven] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [shareMsg, setShareMsg] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  const isToday = !playDate || playDate === new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isToday && hasPlayedToday("sudoku")) {
      setGameOver(true);
      setTimerActive(false);
      setStats(getStats("sudoku"));
      return;
    }
    const data = puzzleProp ?? generateLocal(getDailyRng(7));
    setSolution(data.solution);
    setBoard(data.puzzle.map((r) => [...r]));
    setGiven(data.given);
  }, []);

  useEffect(() => {
    if (!timerActive || gameOver) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, gameOver]);

  const checkWin = useCallback((b: number[][]) => {
    if (b.length === 0 || solution.length === 0) return false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }, [solution]);

  function placeNumber(num: number) {
    if (!selected || gameOver) return;
    const [r, c] = selected;
    if (given[r]?.[c]) return;

    const next = board.map((row) => [...row]);
    next[r][c] = num;
    setBoard(next);

    if (num !== 0 && num !== solution[r][c]) {
      setErrorCount((e) => e + 1);
    }

    if (checkWin(next)) {
      setGameOver(true);
      setTimerActive(false);
      if (isToday) markPlayedToday("sudoku");
      setStats(recordWin("sudoku"));
      saveGameResult("sudoku", true, timer, {
        time: timer,
        errors: errorCount,
      }, playDate);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (gameOver || !selected) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) placeNumber(num);
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") placeNumber(0);

    const [r, c] = selected;
    if (e.key === "ArrowUp" && r > 0) setSelected([r - 1, c]);
    if (e.key === "ArrowDown" && r < 8) setSelected([r + 1, c]);
    if (e.key === "ArrowLeft" && c > 0) setSelected([r, c - 1]);
    if (e.key === "ArrowRight" && c < 8) setSelected([r, c + 1]);
  }

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function handleShare() {
    const text = buildShareText(
      `Sudoku #${getDayNumber()}`,
      `Solved in ${formatTime(timer)}`,
      stats?.currentStreak || 0
    );
    const r = await shareOrCopy(text);
    setShareMsg(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : "");
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
  }

  if (gameOver && board.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--teal)" }}>Already solved today!</p>
        <p className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", marginTop: 8 }}>
          🔥 {stats?.currentStreak || 0} day streak
        </p>
      </div>
    );
  }

  const cellPx = useMemo(() => {
    if (typeof window === "undefined") return 38;
    return window.innerWidth < 600 ? Math.floor((window.innerWidth - 64) / 9) : 38;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "100%", overflow: "hidden" }}>
      <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.1em", color: "var(--ink-faded)" }}>
        {formatTime(timer)}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(9, ${cellPx}px)`,
          gridTemplateRows: `repeat(9, ${cellPx}px)`,
          gap: 0,
          border: "3px solid var(--ink)",
        }}
      >
        {board.map((row, ri) =>
          row.map((val, ci) => {
            const isGiven = given[ri]?.[ci];
            const isSelected = selected?.[0] === ri && selected?.[1] === ci;
            const sameNum = selected && val !== 0 && board[selected[0]][selected[1]] === val;
            return (
              <button
                key={`${ri}-${ci}`}
                onClick={() => setSelected([ri, ci])}
                style={{
                  width: cellPx, height: cellPx,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17,
                  fontWeight: isGiven ? 700 : 600,
                  fontFamily: "'Bungee', system-ui",
                  color: isGiven ? "var(--ink)" : "var(--teal)",
                  background: isSelected ? "rgba(42, 95, 214, 0.15)" : sameNum ? "rgba(42, 95, 214, 0.06)" : "var(--paper-light)",
                  border: "1px solid var(--ink-faded)",
                  borderRight: ci % 3 === 2 && ci < 8 ? "3px solid var(--ink)" : undefined,
                  borderBottom: ri % 3 === 2 && ri < 8 ? "3px solid var(--ink)" : undefined,
                  cursor: isGiven ? "default" : "pointer",
                  outline: "none",
                  transition: "background 0.15s",
                }}
              >
                {val || ""}
              </button>
            );
          })
        )}
      </div>

      {/* Number pad */}
      <div style={{ display: "flex", gap: cellPx < 34 ? 4 : 6, flexWrap: "wrap", justifyContent: "center" }}>
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button
            key={n}
            onClick={() => placeNumber(n)}
            disabled={gameOver}
            style={{
              width: cellPx, height: cellPx,
              fontSize: cellPx < 34 ? 14 : 18, fontWeight: 700,
              fontFamily: "'Bungee', system-ui",
              background: "var(--paper-deep)",
              border: "2px solid var(--ink)",
              color: "var(--ink)",
              cursor: gameOver ? "default" : "pointer",
              borderRadius: 2,
            }}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => placeNumber(0)}
          disabled={gameOver}
          className="typewriter"
          style={{
            width: cellPx, height: cellPx,
            fontSize: 11, fontWeight: 700,
            background: "var(--paper-deep)",
            border: "2px solid var(--ink-faded)",
            color: "var(--ink-faded)",
            cursor: gameOver ? "default" : "pointer",
            borderRadius: 2,
          }}
        >
          ⌫
        </button>
      </div>

      {gameOver && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--teal)" }}>
            Solved in {formatTime(timer)}!
          </p>
          <button onClick={handleShare} className="btn-paper" style={{ marginTop: 8, fontSize: 13 }}>
            {shareMsg || "share result"}
          </button>
        </div>
      )}
    </div>
  );
}
