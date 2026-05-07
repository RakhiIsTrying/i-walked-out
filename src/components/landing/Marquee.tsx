export default function Marquee() {
  const items = [
    "● 1,247 DREAMS QUIT TODAY · ZERO REFUNDS ISSUED",
    "✦ DREAMS FORMALLY FIRED",
    "● $0 SPENT ON THERAPY THIS WEEK",
    "✦ SMUG 42% · WEIRD ABOUT IT 21% · CRYING IN CVS 11%",
    "● AVG. TIME TO GIVE UP: 4.7 YEARS",
    "✦ HONESTLY, HUNGRY 8%",
  ];
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--butter)",
        padding: "20px 0",
        overflow: "hidden",
        position: "relative",
        transform: "rotate(-1.5deg)",
        margin: "60px -30px",
        boxShadow: "0 8px 0 var(--rose), 0 -8px 0 var(--teal)",
        borderTop: "3px solid var(--ink)",
        borderBottom: "3px solid var(--ink)",
      }}
    >
      <div className="marquee-track" style={{ display: "flex", gap: 60, whiteSpace: "nowrap", width: "max-content" }}>
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="display" style={{ fontSize: 24 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
