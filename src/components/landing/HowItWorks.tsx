export default function HowItWorks() {
  const steps = [
    { num: "01", title: "Release", body: "Tell us what you're letting go of. Two sentences. Thirty seconds.", color: "var(--rose)", emoji: "✉️" },
    { num: "02", title: "We listen", body: "Quietly, our AI builds a portrait of you from your releases. No quizzes.", color: "var(--teal)", emoji: "👂" },
    { num: "03", title: "Wander", body: "Browse other people's released dreams. Realize how many strangers carry the same story.", color: "var(--butter)", emoji: "🌫️" },
    { num: "04", title: "Meet you", body: "Chat with a self shaped by your choices. Ask about regrets, about what's next.", color: "var(--plum)", emoji: "🪞" },
  ];

  return (
    <section style={{ padding: "80px clamp(16px, 4vw, 48px)", background: "var(--ink)", color: "var(--paper-light)", margin: "60px 0" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--paper-light)", opacity: 0.5, marginBottom: 16 }}>
            how it works
          </div>
          <h2 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1, margin: 0, fontWeight: 400, fontStyle: "italic", color: "var(--butter)" }}>
            Four soft steps.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              className="paper"
              style={{
                padding: "28px 24px",
                background: "rgba(255,255,255,0.06)",
                boxShadow: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)`,
                display: "flex",
                flexDirection: "column",
                minHeight: 220,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <span className="typewriter" style={{ fontSize: 13, color: s.color, letterSpacing: "0.1em" }}>{s.num}</span>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
              </div>
              <h3 className="serif" style={{ fontSize: 22, margin: 0, marginBottom: 10, color: "var(--paper-light)", fontWeight: 500, fontStyle: "italic" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, margin: 0, flex: 1 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
