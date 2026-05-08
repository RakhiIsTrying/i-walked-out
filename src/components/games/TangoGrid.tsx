const SUN = 1;
const MOON = 2;

interface TangoGridProps {
  grid: number[][];
  given: boolean[][];
  violations: boolean[][];
  gameOver: boolean;
  size: number;
  onToggle: (row: number, col: number) => void;
}

export default function TangoGrid({ grid, given, violations, gameOver, size, onToggle }: TangoGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 4, width: "min(100%, 340px)" }}>
      {grid.map((row, ri) =>
        row.map((cell, ci) => {
          const isGiven = given[ri]?.[ci];
          const hasViolation = violations[ri]?.[ci];
          return (
            <button
              key={`${ri}-${ci}`}
              onClick={() => onToggle(ri, ci)}
              disabled={isGiven || gameOver}
              style={{
                width: "100%", aspectRatio: "1",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
                background: hasViolation ? "rgba(210, 70, 70, 0.1)" :
                  isGiven ? "var(--paper-deep)" : "var(--paper)",
                border: hasViolation ? "2px solid var(--accent-deep)" :
                  isGiven ? "2px solid var(--ink)" : "2px solid var(--ink-3)",
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
  );
}
