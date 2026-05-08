interface SudokuGridProps {
  board: number[][];
  given: boolean[][];
  selected: [number, number] | null;
  cellPx: number;
  onSelect: (r: number, c: number) => void;
}

export default function SudokuGrid({ board, given, selected, cellPx, onSelect }: SudokuGridProps) {
  return (
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
              onClick={() => onSelect(ri, ci)}
              style={{
                width: cellPx, height: cellPx,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17,
                fontWeight: isGiven ? 700 : 600,
                fontFamily: "var(--mono)",
                color: isGiven ? "var(--ink)" : "var(--accent)",
                background: isSelected ? "oklch(0.62 0.14 35 / 0.15)" : sameNum ? "oklch(0.62 0.14 35 / 0.06)" : "var(--paper)",
                border: "1px solid var(--ink-3)",
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
  );
}
