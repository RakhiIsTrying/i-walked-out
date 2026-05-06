"use client";

import { useState, useEffect, useRef } from "react";
import {
  getDayNumber,
  getStats,
  recordWin,
  hasPlayedToday,
  markPlayedToday,
  buildShareText,
  shareOrCopy,
  GameStats,
} from "@/lib/games";

const SIZE = 5;

interface CrosswordProps {
  puzzle?: {
    size: number;
    grid: string[][];
    acrossClues: string[];
    downClues: string[];
  };
}

const FALLBACK_GRID = [
  ["H", "E", "A", "R", "T"],
  ["E", "M", "B", "E", "R"],
  ["A", "B", "U", "S", "E"],
  ["R", "E", "S", "I", "N"],
  ["T", "R", "E", "N", "D"],
];
const FALLBACK_ACROSS_CLUES = [
  "Organ that pumps blood",
  "Glowing remains of a fire",
  "To misuse or maltreat",
  "Sticky substance from trees",
  "General direction of change",
];
const FALLBACK_DOWN_CLUES = [
  "Core of one's feelings",
  "Still-hot coal after flames die",
  "Cruel or violent treatment",
  "Used to make varnish",
  "What's currently popular",
];

const ACROSS_NUMS = [1, 6, 7, 8, 9];
const DOWN_NUMS = [1, 2, 3, 4, 5];

function getCellNum(r: number, c: number): number | null {
  if (r === 0 && c === 0) return 1;
  if (r === 0) return c + 1;
  if (c === 0) return r + 5;
  return null;
}

export default function CrosswordGame({ puzzle }: CrosswordProps) {
  const answer = puzzle?.grid ?? FALLBACK_GRID;
  const acrossClues = puzzle?.acrossClues ?? FALLBACK_ACROSS_CLUES;
  const downClues = puzzle?.downClues ?? FALLBACK_DOWN_CLUES;

  const [board, setBoard] = useState<string[][]>(
    Array.from({ length: SIZE }, () => Array(SIZE).fill(""))
  );
  const [selected, setSelected] = useState<[number, number]>([0, 0]);
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [shareMsg, setShareMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  );

  useEffect(() => {
    if (hasPlayedToday("crossword")) {
      setGameOver(true);
      setTimerActive(false);
      const saved = localStorage.getItem("iwo_crossword_today");
      if (saved) {
        const { b } = JSON.parse(saved);
        setBoard(b);
      }
    }
    setStats(getStats("crossword"));
  }, []);

  useEffect(() => {
    if (!timerActive || gameOver) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, gameOver]);

  function checkWin(b: string[][]) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c].toUpperCase() !== answer[r][c]) return false;
      }
    }
    return true;
  }

  function handleInput(r: number, c: number, val: string) {
    if (gameOver) return;
    const ch = val.slice(-1).toUpperCase();
    if (ch && !/^[A-Z]$/.test(ch)) return;

    const next = board.map((row) => [...row]);
    next[r][c] = ch;
    setBoard(next);

    if (ch && checkWin(next)) {
      setGameOver(true);
      setTimerActive(false);
      markPlayedToday("crossword");
      setStats(recordWin("crossword"));
      localStorage.setItem(
        "iwo_crossword_today",
        JSON.stringify({ b: next })
      );
      return;
    }

    if (ch) {
      if (direction === "across" && c < SIZE - 1) {
        setSelected([r, c + 1]);
        inputRefs.current[r]?.[c + 1]?.focus();
      } else if (direction === "down" && r < SIZE - 1) {
        setSelected([r + 1, c]);
        inputRefs.current[r + 1]?.[c]?.focus();
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    if (e.key === "Backspace" && !board[r][c]) {
      if (direction === "across" && c > 0) {
        setSelected([r, c - 1]);
        inputRefs.current[r]?.[c - 1]?.focus();
        const next = board.map((row) => [...row]);
        next[r][c - 1] = "";
        setBoard(next);
      } else if (direction === "down" && r > 0) {
        setSelected([r - 1, c]);
        inputRefs.current[r - 1]?.[c]?.focus();
        const next = board.map((row) => [...row]);
        next[r - 1][c] = "";
        setBoard(next);
      }
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      setDirection("across");
      if (c < SIZE - 1) { setSelected([r, c + 1]); inputRefs.current[r]?.[c + 1]?.focus(); }
    }
    if (e.key === "ArrowLeft") {
      setDirection("across");
      if (c > 0) { setSelected([r, c - 1]); inputRefs.current[r]?.[c - 1]?.focus(); }
    }
    if (e.key === "ArrowDown") {
      setDirection("down");
      if (r < SIZE - 1) { setSelected([r + 1, c]); inputRefs.current[r + 1]?.[c]?.focus(); }
    }
    if (e.key === "ArrowUp") {
      setDirection("down");
      if (r > 0) { setSelected([r - 1, c]); inputRefs.current[r - 1]?.[c]?.focus(); }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      setDirection((d) => (d === "across" ? "down" : "across"));
    }
  }

  function handleCellClick(r: number, c: number) {
    if (selected[0] === r && selected[1] === c) {
      setDirection((d) => (d === "across" ? "down" : "across"));
    } else {
      setSelected([r, c]);
    }
    inputRefs.current[r]?.[c]?.focus();
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function handleShare() {
    const text = buildShareText(
      `Mini Crossword #${getDayNumber()}`,
      `Solved in ${formatTime(timer)}`,
      stats?.currentStreak || 0
    );
    const r = await shareOrCopy(text);
    setShareMsg(
      r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : ""
    );
    if (r !== "failed") setTimeout(() => setShareMsg(""), 2000);
  }

  const highlightedCells = new Set<string>();
  if (!gameOver) {
    const [sr, sc] = selected;
    if (direction === "across") {
      for (let c = 0; c < SIZE; c++) highlightedCells.add(`${sr},${c}`);
    } else {
      for (let r = 0; r < SIZE; r++) highlightedCells.add(`${r},${sc}`);
    }
  }

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
          gap: 32,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${SIZE}, 52px)`,
            gridTemplateRows: `repeat(${SIZE}, 52px)`,
            gap: 0,
            border: "3px solid var(--ink)",
          }}
        >
          {Array.from({ length: SIZE }).map((_, r) =>
            Array.from({ length: SIZE }).map((_, c) => {
              const isSelected =
                selected[0] === r && selected[1] === c;
              const isHighlighted = highlightedCells.has(`${r},${c}`);
              const isCorrect =
                gameOver &&
                board[r][c].toUpperCase() === answer[r][c];
              const cellNum = getCellNum(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    width: 52,
                    height: 52,
                    position: "relative",
                    background: isSelected
                      ? "rgba(42, 95, 214, 0.2)"
                      : isHighlighted
                        ? "rgba(42, 95, 214, 0.08)"
                        : isCorrect
                          ? "rgba(42, 95, 214, 0.06)"
                          : "var(--paper-light)",
                    border: "1px solid var(--ink-faded)",
                    cursor: "pointer",
                  }}
                >
                  {cellNum && (
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 3,
                        fontSize: 8,
                        fontWeight: 700,
                        color: "var(--ink-faded)",
                        fontFamily: "'Inter', system-ui",
                      }}
                    >
                      {cellNum}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[r][c] = el;
                    }}
                    value={board[r][c]}
                    onChange={(e) =>
                      handleInput(r, c, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    maxLength={2}
                    disabled={gameOver}
                    style={{
                      width: "100%",
                      height: "100%",
                      textAlign: "center",
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: "'Bungee', system-ui",
                      color: "var(--ink)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Clues */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 200,
            maxWidth: 260,
          }}
        >
          <div>
            <div
              className="typewriter"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--ink-faded)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Across
            </div>
            {acrossClues.map((clue, i) => (
              <div
                key={`a${i}`}
                onClick={() => {
                  setDirection("across");
                  setSelected([i, 0]);
                  inputRefs.current[i]?.[0]?.focus();
                }}
                style={{
                  fontSize: 13,
                  padding: "3px 0",
                  cursor: "pointer",
                  color:
                    direction === "across" && selected[0] === i
                      ? "var(--teal)"
                      : "var(--ink-soft)",
                  fontWeight:
                    direction === "across" && selected[0] === i
                      ? 600
                      : 400,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    marginRight: 6,
                    fontSize: 11,
                  }}
                >
                  {ACROSS_NUMS[i]}.
                </span>
                {clue}
              </div>
            ))}
          </div>
          <div>
            <div
              className="typewriter"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--ink-faded)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Down
            </div>
            {downClues.map((clue, i) => (
              <div
                key={`d${i}`}
                onClick={() => {
                  setDirection("down");
                  setSelected([0, i]);
                  inputRefs.current[0]?.[i]?.focus();
                }}
                style={{
                  fontSize: 13,
                  padding: "3px 0",
                  cursor: "pointer",
                  color:
                    direction === "down" && selected[1] === i
                      ? "var(--teal)"
                      : "var(--ink-soft)",
                  fontWeight:
                    direction === "down" && selected[1] === i
                      ? 600
                      : 400,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    marginRight: 6,
                    fontSize: 11,
                  }}
                >
                  {DOWN_NUMS[i]}.
                </span>
                {clue}
              </div>
            ))}
          </div>
        </div>
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
