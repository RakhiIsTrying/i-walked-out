interface FoundWordsProps {
  words: string[];
  allLetters: Set<string>;
}

export default function FoundWords({ words, allLetters }: FoundWordsProps) {
  if (words.length === 0) return null;

  return (
    <div style={{
      maxWidth: 360, width: "100%",
      borderTop: "1.5px dashed var(--ink-faded)", paddingTop: 12, marginTop: 4,
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {words.map((w) => {
          const isPangram = new Set(w).size === allLetters.size;
          return (
            <span
              key={w}
              className="typewriter"
              style={{
                fontSize: 12, padding: "4px 10px",
                background: isPangram ? "var(--butter)" : "var(--paper-deep)",
                border: isPangram ? "2px solid var(--ink)" : "1px solid var(--ink-faded)",
                borderRadius: 2, fontWeight: isPangram ? 700 : 400,
                letterSpacing: "0.08em",
              }}
            >
              {w.toUpperCase()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
