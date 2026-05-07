import Link from "next/link";

export default function TelegramCard() {
  return (
    <section style={{ padding: "60px clamp(16px, 4vw, 48px)" }}>
      <div className="telegram-split" style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 50, alignItems: "center" }}>
        <div>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            ✦ from your pocket ✦
          </div>
          <h2 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, fontWeight: 400, lineHeight: 1.05, fontStyle: "italic", marginBottom: 20 }}>
            Text us a dream. We&apos;ll bury it discreetly.
          </h2>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", maxWidth: 520, lineHeight: 1.5, marginBottom: 28 }}>
            Walk away from something on the way to the train? Tell our Telegram bot. It tucks the dream into your folder, automatically. No app. No mood to overcome.
          </p>
          <Link href="/feed" className="btn-paper" style={{ textDecoration: "none" }}>connect telegram</Link>
        </div>
        <div className="telegram-visual" style={{ position: "relative", height: 380 }}>
          <div className="paper floaty" style={{ position: "absolute", top: 0, right: 30, width: "min(280px, 80%)", padding: "30px 24px", transform: "rotate(3deg)", background: "#faf3df", ["--rot" as string]: "3deg" }}>
            <div className="tape tape-teal" style={{ top: -12, left: "50%", marginLeft: -40 }} />
            <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faded)", borderBottom: "1px dashed var(--ink-faded)", paddingBottom: 8, marginBottom: 14 }}>
              i.w.o. receipt · today
            </div>
            <div className="hand" style={{ fontSize: 20, color: "var(--ink-soft)", lineHeight: 1.35, marginBottom: 14 }}>
              &ldquo;today i&apos;m letting go of being the one who remembers everyone&apos;s birthday&rdquo;
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 10, color: "var(--ink-faded)" }}>
              <span>logged · 14:22</span>
              <span>— elena</span>
            </div>
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <span className="stamp" style={{ color: "var(--teal)" }}>received</span>
            </div>
          </div>
          <div className="floaty" style={{ position: "absolute", bottom: 30, left: 20, transform: "rotate(-8deg)", ["--rot" as string]: "-8deg", animationDelay: "1s" }}>
            <div style={{ display: "inline-block", padding: 6, background: "var(--paper-light)", border: "1.5px dashed var(--teal)", position: "relative" }}>
              <div style={{ border: "2px solid var(--teal)", padding: "10px 14px", fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--teal)", textAlign: "center", lineHeight: 1.4 }}>
                <div style={{ fontSize: 16, fontFamily: "'Fraunces', serif", fontStyle: "italic", letterSpacing: 0, textTransform: "none" }}>i.w.o.</div>
                <div>released</div>
              </div>
            </div>
          </div>
          <div className="floaty wiggle" style={{ position: "absolute", top: 90, left: 0, animationDelay: "0.5s", ["--rot" as string]: "-15deg" }}>
            <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 13, transform: "rotate(-15deg)" }}>POCKET MAIL</span>
          </div>
        </div>
      </div>
    </section>
  );
}
