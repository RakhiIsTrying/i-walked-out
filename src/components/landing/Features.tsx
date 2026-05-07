import Link from "next/link";

const FEATURES = [
  { idx: 1, title: "THE WALL", desc: "Browse abandoned ideas from strangers. Anonymous, raw, real. No judgement — just ghosts of what could have been.", color: "var(--butter)", rotate: -1.5, accent: "var(--rose)", icon: "📌", href: "/feed", sticker: <span className="sticker" style={{ background: "var(--teal)", color: "var(--paper-light)", fontSize: 11, padding: "6px 12px", width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.05 }}>new</span> },
  { idx: 2, title: "PERSONALITY MIRROR", desc: "We gently build your portrait from what you release. What you let go of reveals more than what you hold.", color: "var(--paper-light)", rotate: 1, accent: "var(--teal)", icon: "🪞", href: "/personality" },
  { idx: 3, title: "STICKY DECISION", desc: "Stuck? Post it. Let kind strangers vote on what you should do next. You're not alone in this.", color: "var(--butter)", rotate: -0.5, accent: "var(--plum)", icon: "🗳️", href: "/sticky-decision", sticker: <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 11, padding: "6px 12px", width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.05 }}>vote!</span> },
  { idx: 4, title: "VIBE IRL", desc: "Type a feeling. Get a place to visit, movie to watch, food to try, game to play. Let mood guide you.", color: "var(--paper-light)", rotate: 1.5, accent: "var(--butter)", icon: "🌀", href: "/vibe" },
];

export default function Features() {
  return (
    <section style={{ padding: "60px clamp(16px, 4vw, 48px) 80px", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", top: 80, right: -50, width: 200, height: 200, opacity: 0.25, transform: "rotate(8deg)" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: 100, left: -40, width: 160, height: 160, background: "var(--teal)", opacity: 0.2, transform: "rotate(20deg)" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 12, padding: "8px 16px" }}>★ FOUR LITTLE ROOMS ★</span>
          <h2 className="display" style={{ fontSize: "clamp(44px, 7vw, 88px)", lineHeight: 0.9, margin: "20px 0 0", color: "var(--ink)", textShadow: "5px 5px 0 var(--butter)" }}>
            POKE AROUND.
          </h2>
          <h2 className="brush" style={{ fontSize: "clamp(48px, 8vw, 100px)", color: "var(--rose)", margin: 0, transform: "rotate(-2deg)", display: "inline-block", lineHeight: 0.9 }}>
            it&apos;s all yours.
          </h2>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", maxWidth: 520, margin: "24px auto 0", lineHeight: 1.5 }}>
            Every room is small, weird, and made with care. None of them ask much of you.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 36, paddingTop: 20 }}>
          {FEATURES.map((f) => (
            <Link key={f.idx} href={f.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                className="lift"
                style={{
                  padding: "30px 26px 26px",
                  background: f.color,
                  transform: `rotate(${f.rotate}deg)`,
                  cursor: "pointer",
                  position: "relative",
                  border: "2.5px solid var(--ink)",
                  boxShadow: "6px 6px 0 var(--ink)",
                  ["--hover-rot" as string]: `${f.rotate * 0.3}deg`,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 320,
                }}
              >
                <div style={{
                  position: "absolute", top: -18, left: 20,
                  background: f.accent, color: "var(--paper-light)",
                  border: "2.5px solid var(--ink)",
                  padding: "4px 14px",
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: 16, letterSpacing: "0.05em",
                }}>
                  №0{f.idx}
                </div>
                <div style={{ marginBottom: 16, fontSize: 48, lineHeight: 1 }}>{f.icon}</div>
                <h3 className="heavy" style={{ fontSize: 26, margin: 0, marginBottom: 12, lineHeight: 1, color: "var(--ink)" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.55, margin: 0, flex: 1 }}>
                  {f.desc}
                </p>
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px dashed var(--ink-faded)", paddingTop: 14 }}>
                  <span className="display" style={{ fontSize: 13, color: "var(--ink)" }}>OPEN →</span>
                  <span className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.15em" }}>FREE · ALWAYS</span>
                </div>
                {f.sticker && (
                  <div className="wiggle" style={{ position: "absolute", top: -22, right: -18, transform: `rotate(${f.rotate * -3}deg)`, zIndex: 6 }}>
                    {f.sticker}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
