import Link from "next/link";

export function Quote() {
  return (
    <section style={{ padding: "40px clamp(16px, 4vw, 48px)", textAlign: "center" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", left: -10, top: -20, fontSize: 100, color: "var(--rose)", opacity: 0.25, fontFamily: "'Fraunces', serif", lineHeight: 1 }}>&ldquo;</div>
        <p className="serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.25, color: "var(--ink)", margin: 0 }}>
          The unexamined life is fine actually.
        </p>
        <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", marginTop: 28 }}>
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
        padding: "60px clamp(16px, 4vw, 48px) 40px",
        marginTop: 80,
        borderTop: "1px dashed var(--ink-faded)",
        display: "flex",
        flexDirection: "column",
        gap: 30,
        background: "rgba(235, 227, 208, 0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 360 }}>
          <h3 className="serif" style={{ fontSize: 28, margin: 0, fontWeight: 500, marginBottom: 10 }}>i walked out</h3>
          <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", margin: 0, lineHeight: 1.3 }}>
            Quit big. Live small.
          </p>
        </div>
        <div className="footer-links" style={{ display: "flex", gap: 50, fontFamily: "'Fraunces', serif", fontSize: 15, flexWrap: "wrap" }}>
          <div>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>wander</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/feed" style={{ color: "var(--ink)", textDecoration: "none" }}>Dead dreams feed</Link>
              <Link href="/sticky-decision" style={{ color: "var(--ink)", textDecoration: "none" }}>Sticky decision</Link>
              <Link href="/vibe" style={{ color: "var(--ink)", textDecoration: "none" }}>Vibe IRL</Link>
            </div>
          </div>
          <div>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>quiet things</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/personality" style={{ color: "var(--ink)", textDecoration: "none" }}>Personality mirror</Link>
              <Link href="/dugdug" style={{ color: "var(--ink)", textDecoration: "none" }}>Dug-Dug</Link>
              <Link href="/auth/login" style={{ color: "var(--ink)", textDecoration: "none" }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.05em" }}>
        <span>est. 2025 · made with care</span>
        <span>vol. 03 · issue ii</span>
      </div>
    </footer>
  );
}
