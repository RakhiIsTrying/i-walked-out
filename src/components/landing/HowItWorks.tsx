export default function HowItWorks() {
  const steps = [
    { num: "01", title: "Release", body: "Tell us what you're letting go of. Two sentences. Thirty seconds.", tag: "~30 sec" },
    { num: "02", title: "We listen", body: "Quietly, our AI builds a portrait of you from your releases. No quizzes.", tag: "background" },
    { num: "03", title: "Wander", body: "Browse other people's released dreams. Realize how many strangers carry the same story.", tag: "whenever" },
    { num: "04", title: "Meet you", body: "Chat with a self shaped by your choices. Ask about regrets, about what's next.", tag: "eventually" },
  ];

  return (
    <section
      style={{
        padding: "80px 0",
        background: "var(--paper-deep)",
        borderTop: "1px solid var(--ink)",
        borderBottom: "1px solid var(--ink)",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
          gap: 24,
          marginBottom: 44,
        }}
      >
        <div>
          <div className="eyebrow">How it works</div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(40px, 5vw, 64px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              margin: "14px 0 0",
              maxWidth: "18ch",
            }}
          >
            Four soft{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 500 }}>steps.</em>
          </h2>
        </div>
        <div style={{ maxWidth: "32ch", color: "var(--ink-2)", fontSize: 17 }}>
          No quizzes. No streaks. Nothing optimised. We promise to never gamify your grief.
        </div>
      </div>

      <div
        className="wrap steps-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "0 24px",
              borderRight: i < 3 ? "1px dashed var(--rule)" : "none",
              position: "relative",
            }}
          >
            <div
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 56,
                lineHeight: 1,
                color: "var(--accent)",
                fontWeight: 400,
              }}
            >
              {s.num}
            </div>
            <h3
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 24,
                fontWeight: 500,
                margin: "14px 0 8px",
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                color: "var(--ink-2)",
                fontSize: 15,
                margin: 0,
                maxWidth: "28ch",
              }}
            >
              {s.body}
            </p>
            <span
              style={{
                marginTop: 14,
                display: "inline-block",
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                border: "1px solid var(--rule)",
                padding: "3px 8px",
                borderRadius: 999,
              }}
            >
              {s.tag}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid > div { border-right: 0 !important; padding: 24px !important; border-bottom: 1px dashed var(--rule); }
          section > .wrap:first-child { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
