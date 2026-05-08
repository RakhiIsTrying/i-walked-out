"use client";

interface Clue {
  num: number;
  clue: string;
}

interface CrosswordCluesProps {
  acrossClues: Clue[];
  downClues: Clue[];
  direction: "across" | "down";
  activeClueNum: number | null;
  maxHeight: number;
  isMobileView: boolean;
  onClueClick: (num: number, dir: "across" | "down") => void;
}

export default function CrosswordClues({
  acrossClues, downClues, direction, activeClueNum,
  maxHeight, isMobileView, onClueClick,
}: CrosswordCluesProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minWidth: 0,
        maxHeight: isMobileView ? undefined : (maxHeight || undefined),
        overflowY: isMobileView ? undefined : "auto",
        paddingRight: isMobileView ? 0 : 4,
      }}
    >
      <ClueSection
        title="Across"
        clues={acrossClues}
        dir="across"
        activeDir={direction}
        activeNum={activeClueNum}
        onClueClick={onClueClick}
      />
      <ClueSection
        title="Down"
        clues={downClues}
        dir="down"
        activeDir={direction}
        activeNum={activeClueNum}
        onClueClick={onClueClick}
      />
    </div>
  );
}

function ClueSection({
  title, clues, dir, activeDir, activeNum, onClueClick,
}: {
  title: string;
  clues: Clue[];
  dir: "across" | "down";
  activeDir: "across" | "down";
  activeNum: number | null;
  onClueClick: (num: number, dir: "across" | "down") => void;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "var(--ink-3)",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {clues.map(({ num, clue }) => {
        const isActive = activeDir === dir && activeNum === num;
        return (
          <div
            key={`${dir[0]}${num}`}
            onClick={() => onClueClick(num, dir)}
            style={{
              fontSize: 12,
              padding: "2px 0",
              cursor: "pointer",
              color: isActive ? "var(--accent)" : "var(--ink-2)",
              fontWeight: isActive ? 600 : 400,
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontWeight: 700, marginRight: 4, fontSize: 10 }}>
              {num}.
            </span>
            {clue}
          </div>
        );
      })}
    </div>
  );
}
