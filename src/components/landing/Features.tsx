import Link from "next/link";

const FEATURES = [
  { idx: 1, title: "The Wall", desc: "Browse abandoned ideas from strangers. Anonymous, raw, real. No judgement — just ghosts of what could have been.", icon: "📌", href: "/feed" },
  { idx: 2, title: "Personality Mirror", desc: "We gently build your portrait from what you release. What you let go of reveals more than what you hold.", icon: "🪞", href: "/personality" },
  { idx: 3, title: "Sticky Decision", desc: "Stuck? Post it. Let kind strangers vote on what you should do next. You're not alone in this.", icon: "🗳️", href: "/sticky-decision" },
  { idx: 4, title: "Vibe IRL", desc: "Type a feeling. Get a place to visit, movie to watch, food to try, game to play. Let mood guide you.", icon: "🌀", href: "/vibe" },
];

export default function Features() {
  return (
    <section style={{ padding: "80px clamp(16px, 4vw, 48px)", position: "relative" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 16 }}>
            four rooms to explore
          </p>
          <h2 className="serif" style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05, margin: 0, color: "var(--ink)", fontWeight: 400, fontStyle: "italic" }}>
            Poke around.<br />
            <span style={{ color: "var(--rose)" }}>It&apos;s all yours.</span>
          </h2>
          <p style={{ fontSize: 17, color: "var(--ink-soft)", maxWidth: 480, margin: "20px auto 0", lineHeight: 1.6 }}>
            Every room is small, weird, and made with care. None of them ask much of you.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {FEATURES.map((f) => (
            <Link key={f.idx} href={f.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                className="paper lift"
                style={{
                  padding: "28px 24px 24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 260,
                  ["--hover-rot" as string]: "0deg",
                }}
              >
                <div style={{ marginBottom: 16, fontSize: 36, lineHeight: 1 }}>{f.icon}</div>
                <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", margin: "0 0 8px" }}>
                  0{f.idx}
                </p>
                <h3 className="serif" style={{ fontSize: 22, margin: "0 0 10px", fontWeight: 500, fontStyle: "italic", lineHeight: 1.15, color: "var(--ink)" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {f.desc}
                </p>
                <div style={{ marginTop: 20, borderTop: "1px solid rgba(106, 112, 140, 0.15)", paddingTop: 14 }}>
                  <span className="serif" style={{ fontSize: 14, color: "var(--rose)", fontStyle: "italic" }}>explore →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
