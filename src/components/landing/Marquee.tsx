export default function Marquee() {
  const items = [
    "1,247 dreams quit today",
    "zero refunds issued",
    "dreams formally fired",
    "avg. time to give up — 4.7 years",
    "smug 42%",
    "weird about it 21%",
    "honestly hungry 8%",
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        borderTop: "1px solid var(--ink)",
        borderBottom: "1px solid var(--ink)",
        background: "var(--ink)",
        color: "var(--paper)",
        overflow: "hidden",
        padding: "14px 0",
      }}
    >
      <div
        className="marquee-track"
        style={{
          display: "inline-flex",
          whiteSpace: "nowrap",
          fontFamily: "var(--mono)",
          fontSize: 12,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{
              padding: "0 28px",
              display: "inline-flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            {item}
            <span style={{ color: "var(--accent)", fontSize: 13, opacity: 0.9 }}>
              ✺
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
