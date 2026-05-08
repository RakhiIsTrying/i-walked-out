"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getDayNumber, getStats, recordWin, hasPlayedToday, markPlayedToday, GameStats } from "@/lib/games";
import { saveGameResult } from "@/lib/archive";
import { useGameTimer, formatTime } from "@/hooks/useGameTimer";
import { useShareResult } from "@/hooks/useShareResult";
import SudokuGrid from "./SudokuGrid";
import SudokuPad from "./SudokuPad";

interface SudokuProps {
  puzzle?: {
    puzzle: number[][];
    solution: number[][];
    given: boolean[][];
  };
  playDate?: string;
}

export default function SudokuGame({ puzzle: puzzleProp, playDate }: SudokuProps) {
  const [solution, setSolution] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [given, setGiven] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);

  const isToday = !playDate || playDate === new Date().toISOString().split("T")[0];
  const { timer } = useGameTimer(!gameOver);
  const { shareMsg, share } = useShareResult();

  useEffect(() => {
    if (isToday && hasPlayedToday("sudoku")) {
      setGameOver(true);
      setStats(getStats("sudoku"));
      return;
    }
    if (!puzzleProp) return;
    setSolution(puzzleProp.solution);
    setBoard(puzzleProp.puzzle.map((r) => [...r]));
    setGiven(puzzleProp.given);
  }, []);

  const checkWin = useCallback((b: number[][]) => {
    if (b.length === 0 || solution.length === 0) return false;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (b[r][c] !== solution[r][c]) return false;
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
      if (isToday) markPlayedToday("sudoku");
      setStats(recordWin("sudoku"));
      saveGameResult("sudoku", true, timer, { time: timer, errors: errorCount }, playDate);
    }
  }

  useEffect(() => {
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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function handleShare() {
    await share(`Sudoku #${getDayNumber()}`, `Solved in ${formatTime(timer)}`, stats?.currentStreak || 0);
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

      <SudokuGrid board={board} given={given} selected={selected} cellPx={cellPx} onSelect={(r, c) => setSelected([r, c])} />
      <SudokuPad cellPx={cellPx} disabled={gameOver} onNumber={placeNumber} />

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
