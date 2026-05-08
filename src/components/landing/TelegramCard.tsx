import Link from "next/link";

export default function TelegramCard() {
  return (
    <section style={{ padding: "100px 0" }}>
      <div
        className="wrap tg-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div>
          <div className="eyebrow">From your pocket</div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(40px, 4.8vw, 60px)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              margin: "12px 0 18px",
              maxWidth: "14ch",
            }}
          >
            Text us a dream. We&apos;ll bury it{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 500 }}>
              discreetly.
            </em>
          </h2>
          <p
            style={{
              color: "var(--ink-2)",
              fontSize: "17.5px",
              maxWidth: "42ch",
              margin: "0 0 26px",
            }}
          >
            Walk away from something on the way to the train? Tell us on Telegram. It tucks the
            dream into your folder, automatically. No app. No mood to overcome. No notifications
            back.
          </p>
          <Link href="/feed" className="btn-outline">
            Connect Telegram <span>→</span>
          </Link>
        </div>

        {/* Receipt mock */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink)",
            boxShadow: "6px 6px 0 var(--paper-edge)",
            padding: 22,
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--ink-2)",
            position: "relative",
            maxWidth: 420,
            marginLeft: "auto",
          }}
        >
          {/* Torn edge top */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: -6,
              height: 12,
              background:
                "radial-gradient(circle at 6px 6px, var(--paper-deep) 0 5px, transparent 6px) 0 0/12px 12px repeat-x",
            }}
          />
          {/* Torn edge bottom */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -6,
              height: 12,
              background:
                "radial-gradient(circle at 6px 6px, var(--paper-deep) 0 5px, transparent 6px) 0 0/12px 12px repeat-x",
              transform: "rotate(180deg)",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px dashed var(--rule)",
              paddingBottom: 10,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: "10.5px",
              color: "var(--ink-3)",
            }}
          >
            <span>i.w.o. receipt</span>
            <span>today &middot; 14:22</span>
          </div>

          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 19,
              color: "var(--ink)",
              lineHeight: 1.4,
              padding: "6px 0 12px",
            }}
          >
            &ldquo;today i&apos;m letting go of being the one who remembers everyone&apos;s birthday.&rdquo;
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px dashed var(--rule)",
              paddingTop: 10,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span>logged</span>
            <span>— elena</span>
          </div>

          {/* Stamp */}
          <div
            style={{
              position: "absolute",
              right: -10,
              bottom: 30,
              transform: "rotate(-12deg)",
              border: "2px solid var(--accent)",
              color: "var(--accent)",
              padding: "5px 10px",
              borderRadius: 4,
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: "0.18em",
              background: "var(--paper)",
              opacity: 0.92,
              textTransform: "uppercase",
            }}
          >
            RELEASED
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .tg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
