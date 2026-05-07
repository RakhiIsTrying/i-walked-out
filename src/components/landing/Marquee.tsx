export default function Marquee() {
  const items = [
    "1,247 dreams quit today",
    "zero refunds issued",
    "dreams formally fired",
    "avg. time to give up: 4.7 years",
    "smug 42%",
    "weird about it 21%",
    "honestly, hungry 8%",
  ];
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--paper-deep)",
        padding: "16px 0",
        overflow: "hidden",
        position: "relative",
        margin: "60px 0",
      }}
    >
      <div className="marquee-track" style={{ display: "flex", gap: 48, whiteSpace: "nowrap", width: "max-content" }}>
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="typewriter" style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {item}
            <span style={{ margin: "0 24px", opacity: 0.3 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
