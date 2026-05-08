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
        flexDirection: isMobileView ? "column" : "row",
        gap: isMobileView ? 14 : 20,
        minWidth: 0,
        maxWidth: isMobileView ? "100%" : 480,
        width: isMobileView ? "100%" : undefined,
        maxHeight: isMobileView ? undefined : maxHeight,
        overflowY: "auto",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <ClueSection
          title="Across"
          clues={acrossClues}
          dir="across"
          activeDir={direction}
          activeNum={activeClueNum}
          onClueClick={onClueClick}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ClueSection
          title="Down"
          clues={downClues}
          dir="down"
          activeDir={direction}
          activeNum={activeClueNum}
          onClueClick={onClueClick}
        />
      </div>
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
        className="typewriter"
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "var(--ink-faded)",
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
              color: isActive ? "var(--teal)" : "var(--ink-soft)",
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
