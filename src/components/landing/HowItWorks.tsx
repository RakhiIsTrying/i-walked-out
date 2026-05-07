export default function HowItWorks() {
  const steps = [
    { num: "01", title: "RELEASE", body: "Tell us what you're letting go of. Two sentences. Thirty seconds.", color: "var(--rose)", emoji: "✉️" },
    { num: "02", title: "WE LISTEN", body: "Quietly, our AI builds a portrait of you from your releases. No quizzes.", color: "var(--teal)", emoji: "👂" },
    { num: "03", title: "WANDER", body: "Browse other people's released dreams. Realize how many strangers carry the same story.", color: "var(--butter)", emoji: "🌫️" },
    { num: "04", title: "MEET YOU", body: "Chat with a self shaped by your choices. Ask about regrets, about what's next.", color: "var(--plum)", emoji: "🪞" },
  ];

  return (
    <section style={{ padding: "80px clamp(16px, 4vw, 48px)", background: "var(--ink)", color: "var(--paper-light)", margin: "60px 0", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.08 }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="sticker" style={{ background: "var(--butter)", color: "var(--ink)", fontSize: 12, padding: "8px 16px" }}>★ HOW IT WORKS ★</span>
          <h2 className="display" style={{ fontSize: "clamp(44px, 7.5vw, 96px)", lineHeight: 0.9, margin: "20px 0 0", color: "var(--butter)", textShadow: "5px 5px 0 var(--rose)" }}>
            FOUR SOFT
          </h2>
          <h2 className="brush" style={{ fontSize: "clamp(48px, 8.5vw, 110px)", color: "var(--teal)", margin: 0, transform: "rotate(-2deg)", display: "inline-block", lineHeight: 0.9 }}>
            steps.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
          {steps.map((s, i) => (
            <div key={i}>
              <div
                style={{
                  background: s.color,
                  border: "2.5px solid var(--paper-light)",
                  boxShadow: "6px 6px 0 var(--paper-light)",
                  padding: "26px 22px",
                  color: "var(--ink)",
                  transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 240,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <span className="display" style={{ fontSize: 36, color: "var(--ink)", lineHeight: 1 }}>{s.num}</span>
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{s.emoji}</span>
                </div>
                <h3 className="heavy" style={{ fontSize: 22, margin: 0, marginBottom: 10, color: "var(--ink)", lineHeight: 1 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0, flex: 1 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
