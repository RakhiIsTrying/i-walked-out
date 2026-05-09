import Link from "next/link";

export function Quote() {
  return (
    <section
      style={{
        padding: "110px 0",
        textAlign: "center",
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        background: "radial-gradient(ellipse at center, var(--paper) 0%, var(--paper-deep) 100%)",
      }}
    >
      <div className="wrap">
        <span
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 100,
            lineHeight: 0.6,
            color: "var(--accent)",
            display: "block",
            marginBottom: 8,
          }}
        >
          &ldquo;
        </span>
        <blockquote
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: "clamp(34px, 4.4vw, 60px)",
            lineHeight: 1.1,
            margin: "0 auto",
            maxWidth: "18ch",
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          The unexamined life is fine, actually.
        </blockquote>
        <cite
          style={{
            display: "block",
            marginTop: 24,
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            fontStyle: "normal",
          }}
        >
          — Socrates, probably
        </cite>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "70px 0 40px",
        borderTop: "1px solid var(--ink)",
        marginTop: 80,
      }}
    >
      <div
        className="wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 40,
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 44,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            i walked <span style={{ color: "var(--accent)" }}>out</span>
          </div>
          <p
            style={{
              marginTop: 14,
              color: "rgba(243,236,224,0.6)",
              fontSize: 15,
              fontStyle: "italic",
              maxWidth: "28ch",
            }}
          >
            Quit big. Live small. A scrapbook for released dreams since 2025.
          </p>
        </div>

        {/* Wander */}
        <div>
          <h4
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(243,236,224,0.5)",
              margin: "0 0 14px",
              fontWeight: 500,
            }}
          >
            Wander
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            <li>
              <Link href="/feed" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Dead dreams feed
              </Link>
            </li>
            <li>
              <Link href="/sticky-decision" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Sticky decision
              </Link>
            </li>
            <li>
              <Link href="/vibe" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Vibe IRL
              </Link>
            </li>
          </ul>
        </div>

        {/* Quiet things */}
        <div>
          <h4
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(243,236,224,0.5)",
              margin: "0 0 14px",
              fontWeight: 500,
            }}
          >
            Quiet things
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            <li>
              <Link href="/personality" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Personality mirror
              </Link>
            </li>
            <li>
              <Link href="/nigel" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Nigel Bottomsworth-Pemberton
              </Link>
            </li>
            <li>
              <Link href="/auth/login" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Sign in
              </Link>
            </li>
          </ul>
        </div>

        {/* Colophon */}
        <div>
          <h4
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(243,236,224,0.5)",
              margin: "0 0 14px",
              fontWeight: 500,
            }}
          >
            Colophon
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            <li>
              <Link href="/games" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)", borderBottom: "1px solid transparent" }}>
                Games
              </Link>
            </li>
            <li>
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)" }}>
                Privacy (we mean it)
              </span>
            </li>
            <li>
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--paper)" }}>
                Made with care
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="wrap"
        style={{
          marginTop: 60,
          paddingTop: 18,
          borderTop: "1px solid rgba(243,236,224,0.15)",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--mono)",
          fontSize: "10.5px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(243,236,224,0.5)",
        }}
      >
        <span>&copy; 2026 i walked out &middot; all rights released</span>
        <span>set in newsreader &amp; jetbrains mono</span>
      </div>

      <style>{`
        @media (max-width: 980px) {
          footer > .wrap:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          footer > .wrap:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
