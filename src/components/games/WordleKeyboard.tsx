"use client";

type CellState = "correct" | "present" | "absent" | "empty";

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

interface WordleKeyboardProps {
  keyColors: Record<string, CellState>;
  isMobile: boolean;
  onKey: (key: string) => void;
}

export default function WordleKeyboard({ keyColors, isMobile, onKey }: WordleKeyboardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6, marginTop: 8, width: "100%", maxWidth: 484 }}>
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: isMobile ? 3 : 4, justifyContent: "center", width: "100%" }}>
          {row.map((key) => {
            const state = keyColors[key];
            const isWide = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                onClick={() => onKey(key)}
                className="typewriter"
                style={{
                  flex: isWide ? 1.5 : 1,
                  minWidth: 0,
                  height: isMobile ? 40 : 44,
                  padding: "0 2px",
                  fontSize: isWide ? (isMobile ? 10 : 11) : (isMobile ? 13 : 14),
                  fontWeight: 700,
                  background: state === "correct" ? "var(--teal)" : state === "present" ? "var(--butter)" : state === "absent" ? "var(--ink-faded)" : "var(--paper-deep)",
                  color: state && state !== "empty" ? "#fff" : "var(--ink)",
                  border: isMobile ? "1.5px solid var(--ink)" : "2px solid var(--ink)",
                  cursor: "pointer",
                  borderRadius: 3,
                  transition: "all 0.2s",
                  letterSpacing: "0.02em",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
