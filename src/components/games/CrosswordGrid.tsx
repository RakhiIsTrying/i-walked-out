"use client";

import { RefObject } from "react";

interface CrosswordGridProps {
  size: number;
  answer: (string | null)[][];
  board: (string | null)[][];
  numbers: (number | null)[][];
  selected: [number, number];
  highlightedCells: Set<string>;
  gameOver: boolean;
  cellSize: number;
  letterSize: number;
  numSize: number;
  inputRefs: RefObject<(HTMLInputElement | null)[][]>;
  onCellClick: (r: number, c: number) => void;
  onInput: (r: number, c: number, val: string) => void;
  onKeyDown: (e: React.KeyboardEvent, r: number, c: number) => void;
}

export default function CrosswordGrid({
  size, answer, board, numbers, selected, highlightedCells,
  gameOver, cellSize, letterSize, numSize, inputRefs,
  onCellClick, onInput, onKeyDown,
}: CrosswordGridProps) {
  return (
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
          const isBlack = answer[r]?.[c] === null;

          if (isBlack) {
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
          const isCorrect = gameOver && board[r][c]?.toUpperCase() === answer[r][c];
          const cellNum = numbers[r][c];

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => onCellClick(r, c)}
              style={{
                width: cellSize,
                height: cellSize,
                position: "relative",
                background: isSel
                  ? "oklch(0.62 0.14 35 / 0.2)"
                  : isHL
                    ? "oklch(0.62 0.14 35 / 0.08)"
                    : isCorrect
                      ? "oklch(0.62 0.14 35 / 0.06)"
                      : "var(--paper)",
                border: "1px solid var(--ink-3)",
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
                    color: "var(--ink-3)",
                    fontFamily: "var(--mono)",
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
                onChange={(e) => onInput(r, c, e.target.value)}
                onKeyDown={(e) => onKeyDown(e, r, c)}
                maxLength={2}
                disabled={gameOver}
                style={{
                  width: "100%",
                  height: "100%",
                  textAlign: "center",
                  fontSize: letterSize,
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
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
  );
}
