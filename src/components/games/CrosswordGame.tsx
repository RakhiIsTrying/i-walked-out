"use client";

import { useState, useEffect, useRef } from "react";
import {
  getDayNumber,
  getStats,
  recordWin,
  hasPlayedToday,
  markPlayedToday,
  GameStats,
} from "@/lib/games";
import { saveGameResult } from "@/lib/archive";
import { useGameTimer, formatTime } from "@/hooks/useGameTimer";
import { useShareResult } from "@/hooks/useShareResult";
import CrosswordGrid from "./CrosswordGrid";
import CrosswordClues from "./CrosswordClues";

interface CrosswordPuzzle {
  size: number;
  grid: (string | null)[][];
  numbers: (number | null)[][];
  acrossClues: { num: number; clue: string }[];
  downClues: { num: number; clue: string }[];
  theme?: string;
}

interface CrosswordProps {
  puzzle?: CrosswordPuzzle;
  playDate?: string;
  variant?: "mini" | "midi" | "normal";
}

export default function CrosswordGame({ puzzle, playDate, variant = "normal" }: CrosswordProps) {
  if (!puzzle) return null;
  const pz = puzzle;
  const { size, grid: answer, numbers, acrossClues, downClues } = pz;
  const gameId = variant === "normal" ? "crossword" : `crossword-${variant}`;

  const isBlack = (r: number, c: number) => answer[r]?.[c] === null;

  const [board, setBoard] = useState<(string | null)[][]>(() =>
    answer.map((row) => row.map((cell) => (cell === null ? null : "")))
  );
  const [selected, setSelected] = useState<[number, number]>(() => {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!isBlack(r, c)) return [r, c];
    return [0, 0];
  });
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const { timer } = useGameTimer(!gameOver);
  const { shareMsg, share } = useShareResult();
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: size }, () => Array(size).fill(null))
  );

  const isToday = !playDate || playDate === new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isToday && hasPlayedToday(gameId)) {
      setGameOver(true);
      const saved = localStorage.getItem(`iwo_${gameId}_today`);
      if (saved) {
        try {
          const { b } = JSON.parse(saved);
          if (b?.length === size && b[0]?.length === size) {
            setBoard(b);
          }
        } catch {}
      }
    }
    setStats(getStats(gameId));
  }, []);

  function checkWin(b: (string | null)[][]) {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) {
        if (answer[r][c] === null) continue;
        if (b[r][c]?.toUpperCase() !== answer[r][c]) return false;
      }
    return true;
  }

  function nextCell(
    r: number,
    c: number,
    dir: "across" | "down",
    step: 1 | -1
  ): [number, number] | null {
    if (dir === "across") {
      let nc = c + step;
      while (nc >= 0 && nc < size) {
        if (!isBlack(r, nc)) return [r, nc];
        nc += step;
      }
    } else {
      let nr = r + step;
      while (nr >= 0 && nr < size) {
        if (!isBlack(nr, c)) return [nr, c];
        nr += step;
      }
    }
    return null;
  }

  function getWordCells(
    r: number,
    c: number,
    dir: "across" | "down"
  ): [number, number][] {
    if (isBlack(r, c)) return [];
    const cells: [number, number][] = [];
    if (dir === "across") {
      let start = c;
      while (start > 0 && !isBlack(r, start - 1)) start--;
      let end = c;
      while (end < size - 1 && !isBlack(r, end + 1)) end++;
      for (let cc = start; cc <= end; cc++) cells.push([r, cc]);
    } else {
      let start = r;
      while (start > 0 && !isBlack(start - 1, c)) start--;
      let end = r;
      while (end < size - 1 && !isBlack(end + 1, c)) end++;
      for (let rr = start; rr <= end; rr++) cells.push([rr, c]);
    }
    return cells;
  }

  function findClueCell(num: number): [number, number] | null {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (numbers[r][c] === num) return [r, c];
    return null;
  }

  function handleInput(r: number, c: number, val: string) {
    if (gameOver || isBlack(r, c)) return;
    const ch = val.slice(-1).toUpperCase();
    if (ch && !/^[A-Z]$/.test(ch)) return;

    const next = board.map((row) => [...row]);
    next[r][c] = ch;
    setBoard(next);

    if (ch && checkWin(next)) {
      setGameOver(true);
      if (isToday) {
        markPlayedToday(gameId);
        localStorage.setItem(`iwo_${gameId}_today`, JSON.stringify({ b: next }));
      }
      setStats(recordWin(gameId));
      saveGameResult(gameId, true, timer, {
        time: timer,
        size,
      }, playDate);
      return;
    }

    if (ch) {
      const nc = nextCell(r, c, direction, 1);
      if (nc) {
        setSelected(nc);
        inputRefs.current[nc[0]]?.[nc[1]]?.focus();
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    if (e.key === "Backspace" && !board[r][c]) {
      const prev = nextCell(r, c, direction, -1);
      if (prev) {
        setSelected(prev);
        inputRefs.current[prev[0]]?.[prev[1]]?.focus();
        const next = board.map((row) => [...row]);
        next[prev[0]][prev[1]] = "";
        setBoard(next);
      }
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      setDirection("across");
      const nc = nextCell(r, c, "across", 1);
      if (nc) {
        setSelected(nc);
        inputRefs.current[nc[0]]?.[nc[1]]?.focus();
      }
    }
    if (e.key === "ArrowLeft") {
      setDirection("across");
      const nc = nextCell(r, c, "across", -1);
      if (nc) {
        setSelected(nc);
        inputRefs.current[nc[0]]?.[nc[1]]?.focus();
      }
    }
    if (e.key === "ArrowDown") {
      setDirection("down");
      const nc = nextCell(r, c, "down", 1);
      if (nc) {
        setSelected(nc);
        inputRefs.current[nc[0]]?.[nc[1]]?.focus();
      }
    }
    if (e.key === "ArrowUp") {
      setDirection("down");
      const nc = nextCell(r, c, "down", -1);
      if (nc) {
        setSelected(nc);
        inputRefs.current[nc[0]]?.[nc[1]]?.focus();
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      setDirection((d) => (d === "across" ? "down" : "across"));
    }
  }

  function handleCellClick(r: number, c: number) {
    if (isBlack(r, c)) return;
    if (selected[0] === r && selected[1] === c) {
      setDirection((d) => (d === "across" ? "down" : "across"));
    } else {
      setSelected([r, c]);
    }
    inputRefs.current[r]?.[c]?.focus();
  }

  function handleClueClick(num: number, dir: "across" | "down") {
    const cell = findClueCell(num);
    if (cell) {
      setDirection(dir);
      setSelected(cell);
      inputRefs.current[cell[0]]?.[cell[1]]?.focus();
    }
  }

  async function handleShare() {
    const variantLabel = variant === "mini" ? "Mini" : variant === "midi" ? "Midi" : "Crossword";
    await share(
      `${variantLabel} #${getDayNumber()}`,
      `Solved in ${formatTime(timer)}${pz.theme ? `\nTheme: ${pz.theme}` : ""}`,
      stats?.currentStreak || 0,
    );
  }

  const highlightedCells = new Set<string>();
  const wordCells = getWordCells(selected[0], selected[1], direction);
  wordCells.forEach(([wr, wc]) => highlightedCells.add(`${wr},${wc}`));

  let activeClueNum: number | null = null;
  if (wordCells.length > 0) {
    const [wr, wc] = wordCells[0];
    activeClueNum = numbers[wr]?.[wc] ?? null;
  }

  const isMobileView = typeof window !== "undefined" && window.innerWidth < 600;
  const maxGrid = isMobileView ? window.innerWidth - 64 : 999;
  const desktopCell = size <= 5 ? 52 : size <= 7 ? 42 : size <= 9 ? 36 : size <= 12 ? 30 : 28;
  const cellSize = Math.min(desktopCell, Math.floor(maxGrid / size));
  const letterSize = cellSize >= 42 ? 22 : cellSize >= 32 ? 18 : cellSize >= 26 ? 15 : 12;
  const numSize = cellSize >= 42 ? 8 : cellSize >= 30 ? 7 : 6;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        className="typewriter"
        style={{
          fontSize: 12,
          letterSpacing: "0.1em",
          color: "var(--ink-faded)",
        }}
      >
        {formatTime(timer)}
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <CrosswordGrid
          size={size}
          answer={answer}
          board={board}
          numbers={numbers}
          selected={selected}
          highlightedCells={highlightedCells}
          gameOver={gameOver}
          cellSize={cellSize}
          letterSize={letterSize}
          numSize={numSize}
          inputRefs={inputRefs}
          onCellClick={handleCellClick}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />

        <CrosswordClues
          acrossClues={acrossClues}
          downClues={downClues}
          direction={direction}
          activeClueNum={activeClueNum}
          maxHeight={size * cellSize + 6}
          isMobileView={isMobileView}
          onClueClick={handleClueClick}
        />
      </div>

      {gameOver && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p
            className="serif"
            style={{
              fontSize: 22,
              fontStyle: "italic",
              color: "var(--teal)",
            }}
          >
            Solved in {formatTime(timer)}!
          </p>
          <button
            onClick={handleShare}
            className="btn-paper"
            style={{ marginTop: 8, fontSize: 13 }}
          >
            {shareMsg || "share result"}
          </button>
        </div>
      )}
    </div>
  );
}
