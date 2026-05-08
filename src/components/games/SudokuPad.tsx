interface SudokuPadProps {
  cellPx: number;
  disabled: boolean;
  onNumber: (n: number) => void;
}

export default function SudokuPad({ cellPx, disabled, onNumber }: SudokuPadProps) {
  return (
    <div style={{ display: "flex", gap: cellPx < 34 ? 4 : 6, flexWrap: "wrap", justifyContent: "center" }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          onClick={() => onNumber(n)}
          disabled={disabled}
          style={{
            width: cellPx, height: cellPx,
            fontSize: cellPx < 34 ? 14 : 18, fontWeight: 700,
            fontFamily: "'Bungee', system-ui",
            background: "var(--paper-deep)",
            border: "2px solid var(--ink)",
            color: "var(--ink)",
            cursor: disabled ? "default" : "pointer",
            borderRadius: 2,
          }}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onNumber(0)}
        disabled={disabled}
        className="typewriter"
        style={{
          width: cellPx, height: cellPx,
          fontSize: 11, fontWeight: 700,
          background: "var(--paper-deep)",
          border: "2px solid var(--ink-faded)",
          color: "var(--ink-faded)",
          cursor: disabled ? "default" : "pointer",
          borderRadius: 2,
        }}
      >
        ⌫
      </button>
    </div>
  );
}
