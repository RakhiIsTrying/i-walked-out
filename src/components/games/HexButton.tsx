interface HexButtonProps {
  letter: string;
  isCenter: boolean;
  onClick: () => void;
  x: number;
  y: number;
}

export default function HexButton({ letter, isCenter, onClick, x, y }: HexButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        left: x, top: y,
        width: 50, height: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 700,
        fontFamily: "var(--mono)",
        color: isCenter ? "#fff" : "var(--ink)",
        background: isCenter ? "var(--accent)" : "var(--paper-deep)",
        border: `3px solid ${isCenter ? "var(--accent)" : "var(--ink)"}`,
        borderRadius: "50%",
        cursor: "pointer",
        transition: "transform 0.15s",
        textTransform: "uppercase",
        zIndex: isCenter ? 2 : 1,
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.1)"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
    >
      {letter.toUpperCase()}
    </button>
  );
}
