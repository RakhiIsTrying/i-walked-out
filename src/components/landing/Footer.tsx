import Link from "next/link";

export function Quote() {
  return (
    <section style={{ padding: "60px clamp(16px, 4vw, 48px)", textAlign: "center" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", left: -8, top: -16, fontSize: 80, color: "var(--rose)", opacity: 0.15, fontFamily: "'Fraunces', serif", lineHeight: 1 }}>&ldquo;</div>
        <p className="serif" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.3, color: "var(--ink)", margin: 0 }}>
          The unexamined life is fine actually.
        </p>
        <p className="hand" style={{ fontSize: 22, color: "var(--ink-faded)", marginTop: 24 }}>
          — Socrates, probably
        </p>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <footer
      style={{
        padding: "48px clamp(16px, 4vw, 48px) 32px",
        marginTop: 80,
        borderTop: "1px solid rgba(106, 112, 140, 0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 320 }}>
          <h3 className="serif" style={{ fontSize: 24, margin: 0, fontWeight: 500, marginBottom: 8 }}>i walked out</h3>
          <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", margin: 0, lineHeight: 1.3 }}>
            Quit big. Live small.
          </p>
        </div>
        <div className="footer-links" style={{ display: "flex", gap: 48, fontFamily: "'Fraunces', serif", fontSize: 15, flexWrap: "wrap" }}>
          <div>
            <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>wander</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/feed" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Dead dreams feed</Link>
              <Link href="/sticky-decision" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Sticky decision</Link>
              <Link href="/vibe" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Vibe IRL</Link>
            </div>
          </div>
          <div>
            <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>quiet things</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/personality" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Personality mirror</Link>
              <Link href="/dugdug" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Dug-Dug</Link>
              <Link href="/auth/login" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.05em", opacity: 0.7 }}>
        <span>est. 2025</span>
        <span>made with care</span>
      </div>
    </footer>
  );
}
