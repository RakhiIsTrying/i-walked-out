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

interface CrosswordPuzzle {
  size: number;
  grid: (string | null)[][];
  numbers: (number | null)[][];
  acrossClues: { num: number; clue: string }[];
  downClues: { num: number; clue: string }[];
}

interface CrosswordProps {
  puzzle?: CrosswordPuzzle;
}

const FALLBACK_PUZZLE: CrosswordPuzzle = {
  size: 5,
  grid: [
    ["H", "E", "A", "R", "T"],
    ["E", "M", "B", "E", "R"],
    ["A", "B", "U", "S", "E"],
    ["R", "E", "S", "I", "N"],
    ["T", "R", "E", "N", "D"],
  ],
  numbers: [
    [1, 2, 3, 4, 5],
    [6, null, null, null, null],
    [7, null, null, null, null],
    [8, null, null, null, null],
    [9, null, null, null, null],
  ],
  acrossClues: [
    { num: 1, clue: "Organ that pumps blood" },
    { num: 6, clue: "Glowing remains of a fire" },
    { num: 7, clue: "To misuse or maltreat" },
    { num: 8, clue: "Sticky substance from trees" },
    { num: 9, clue: "General direction of change" },
  ],
  downClues: [
    { num: 1, clue: "Core of one's feelings" },
    { num: 2, clue: "Still-hot coal after flames die" },
    { num: 3, clue: "Cruel or violent treatment" },
    { num: 4, clue: "Used to make varnish" },
    { num: 5, clue: "What's currently popular" },
  ],
};

export default function CrosswordGame({ puzzle }: CrosswordProps) {
  const pz = puzzle ?? FALLBACK_PUZZLE;
  const { size, grid: answer, numbers, acrossClues, downClues } = pz;

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
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [shareMsg, setShareMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: size }, () => Array(size).fill(null))
  );

  useEffect(() => {
    if (hasPlayedToday("crossword")) {
      setGameOver(true);
      setTimerActive(false);
      const saved = localStorage.getItem("iwo_crossword_today");
      if (saved) {
        try {
          const { b } = JSON.parse(saved);
          setBoard(b);
        } catch {}
      }
    }
    setStats(getStats("crossword"));
  }, []);

  useEffect(() => {
    if (!timerActive || gameOver) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, gameOver]);

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

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function handleShare() {
    const text = buildShareText(
      `Crossword #${getDayNumber()}`,
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
  const wordCells = getWordCells(selected[0], selected[1], direction);
  wordCells.forEach(([wr, wc]) => highlightedCells.add(`${wr},${wc}`));

  let activeClueNum: number | null = null;
  if (wordCells.length > 0) {
    const [wr, wc] = wordCells[0];
    activeClueNum = numbers[wr]?.[wc] ?? null;
  }

  const cellSize = size <= 5 ? 52 : size <= 7 ? 42 : size <= 9 ? 36 : size <= 12 ? 30 : 28;
  const letterSize = size <= 5 ? 22 : size <= 7 ? 18 : size <= 9 ? 15 : 12;
  const numSize = size <= 5 ? 8 : size <= 9 ? 7 : 6;

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
        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
            gap: 0,
            border: "3px solid var(--ink)",
          }}
        >
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((_, c) => {
              if (isBlack(r, c)) {
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: "var(--ink)",
                      border: "1px solid var(--ink)",
                    }}
                  />
                );
              }

              const isSel = selected[0] === r && selected[1] === c;
              const isHL = highlightedCells.has(`${r},${c}`);
              const isCorrect =
                gameOver &&
                board[r][c]?.toUpperCase() === answer[r][c];
              const cellNum = numbers[r][c];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    position: "relative",
                    background: isSel
                      ? "rgba(42, 95, 214, 0.2)"
                      : isHL
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
                        top: 1,
                        left: 2,
                        fontSize: numSize,
                        fontWeight: 700,
                        color: "var(--ink-faded)",
                        fontFamily: "'Inter', system-ui",
                        lineHeight: 1,
                      }}
                    >
                      {cellNum}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[r][c] = el;
                    }}
                    value={board[r][c] || ""}
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
                      fontSize: letterSize,
                      fontWeight: 700,
                      fontFamily: "'Bungee', system-ui",
                      color: "var(--ink)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      padding: 0,
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
            gap: 14,
            minWidth: 200,
            maxWidth: 280,
            maxHeight: size * cellSize + 6,
            overflowY: "auto",
          }}
        >
          <div>
            <div
              className="typewriter"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--ink-faded)",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Across
            </div>
            {acrossClues.map(({ num, clue }) => (
              <div
                key={`a${num}`}
                onClick={() => handleClueClick(num, "across")}
                style={{
                  fontSize: 12,
                  padding: "2px 0",
                  cursor: "pointer",
                  color:
                    direction === "across" && activeClueNum === num
                      ? "var(--teal)"
                      : "var(--ink-soft)",
                  fontWeight:
                    direction === "across" && activeClueNum === num
                      ? 600
                      : 400,
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    marginRight: 4,
                    fontSize: 10,
                  }}
                >
                  {num}.
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
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Down
            </div>
            {downClues.map(({ num, clue }) => (
              <div
                key={`d${num}`}
                onClick={() => handleClueClick(num, "down")}
                style={{
                  fontSize: 12,
                  padding: "2px 0",
                  cursor: "pointer",
                  color:
                    direction === "down" && activeClueNum === num
                      ? "var(--teal)"
                      : "var(--ink-soft)",
                  fontWeight:
                    direction === "down" && activeClueNum === num
                      ? 600
                      : 400,
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    marginRight: 4,
                    fontSize: 10,
                  }}
                >
                  {num}.
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
