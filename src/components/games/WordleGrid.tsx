type CellState = "correct" | "present" | "absent" | "empty";

interface WordleGridProps {
  guesses: string[];
  states: CellState[][];
  current: string;
  shake: boolean;
  gameOver: boolean;
  isMobile: boolean;
  rows: number;
  cols: number;
  onClick: () => void;
  roundNum: number;
}

export default function WordleGrid({
  guesses, states, current, shake, gameOver,
  isMobile, rows, cols, onClick, roundNum,
}: WordleGridProps) {
  const cellPx = isMobile ? 44 : 52;

  const cellBg = (s: CellState) =>
    s === "correct" ? "var(--accent)" : s === "present" ? "var(--note-1)" : s === "absent" ? "var(--ink-3)" : "transparent";

  const cellColor = (s: CellState) => (s === "empty" ? "var(--ink)" : "#fff");

  return (
    <div key={roundNum} onClick={onClick} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6, cursor: "pointer", maxWidth: "100%" }}>
      {Array.from({ length: rows }).map((_, ri) => {
        const g = guesses[ri];
        const s = states[ri];
        const isCurrent = ri === guesses.length && !gameOver;
        return (
          <div
            key={ri}
            style={{ display: "flex", gap: isMobile ? 4 : 6, justifyContent: "center", animation: isCurrent && shake ? "wiggle 0.3s" : undefined }}
          >
            {Array.from({ length: cols }).map((_, ci) => {
              const letter = g ? g[ci] : isCurrent ? current[ci] || "" : "";
              const state: CellState = s ? s[ci] : "empty";
              return (
                <div
                  key={ci}
                  className="pop-in"
                  style={{
                    width: cellPx, height: cellPx,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: cellBg(state),
                    border: state === "empty" ? "2px solid var(--ink-3)" : "2px solid transparent",
                    fontSize: isMobile ? 20 : 24, fontWeight: 700,
                    fontFamily: "var(--mono)",
                    color: cellColor(state),
                    transition: "all 0.3s",
                    animationDelay: s ? `${ci * 0.1}s` : "0s",
                  }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export type { CellState };
