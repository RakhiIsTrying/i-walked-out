"use client";

import { useState, useEffect, useRef } from "react";

interface LiveStats {
  dreams: number;
  users: number;
  categories: Record<string, number>;
  emotions: Record<string, number>;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function Numbers({ stats }: { stats: LiveStats | null }) {
  const dreamCount = stats?.dreams ?? 0;
  const userCount = stats?.users ?? 0;

  const items = [
    { big: formatCount(dreamCount), label: "Dreams released", sub: "and counting, slowly" },
    { big: formatCount(userCount), label: "Dreamers", sub: "growing, gently" },
    {
      big: dreamCount && userCount ? (dreamCount / userCount).toFixed(1) : "—",
      label: "Avg. dreams / person",
      sub: "we don't think that's a lot",
      accent: true,
    },
    { big: "0", label: "Judgement", sub: "not even a little" },
  ];

  return (
    <section style={{ padding: "96px 0" }}>
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
          <div className="eyebrow">By the numbers</div>
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
            Dreams,{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 500 }}>
              quantified.
            </em>
          </h2>
        </div>
        <div style={{ maxWidth: "32ch", color: "var(--ink-2)", fontSize: 17 }}>
          (We counted. You&apos;re not alone. We are also not optimising for these.)
        </div>
      </div>

      <div
        className="wrap num-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 28,
        }}
      >
        {items.map((item, i) => (
          <div key={i} style={{ borderTop: "1px solid var(--ink)", paddingTop: 18 }}>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 84,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                fontWeight: 400,
              }}
            >
              {item.accent ? (
                <em style={{ fontStyle: "italic", color: "var(--accent)" }}>{item.big}</em>
              ) : (
                item.big
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginTop: 10,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                color: "var(--ink-2)",
                fontSize: "14.5px",
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .num-grid { grid-template-columns: repeat(2, 1fr) !important; }
          section > .wrap:first-child { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .num-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function Journey() {
  const stages = [
    { glyph: "i", ts: "+ 00:00", body: "you have a dream", active: false },
    { glyph: "ii", ts: "+ 07:23", body: "you avoid it", active: false },
    { glyph: "iii", ts: "+ 14:08", body: "guilt visits", active: false },
    { glyph: "iv", ts: "+ 00:30", body: "you release it here", active: true },
    { glyph: "v", ts: "+ 00:00", body: "you feel free", active: false },
  ];

  return (
    <section style={{ padding: "80px 0", borderTop: "1px solid var(--rule)" }}>
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
          <div className="eyebrow">A dream&apos;s journey</div>
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
            From spark to{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 500 }}>shrug.</em>
          </h2>
        </div>
        <div style={{ maxWidth: "32ch", color: "var(--ink-2)", fontSize: 17 }}>
          Most dreams die quietly, in airports, mid-shower, on Tuesdays. Here&apos;s the usual arc.
        </div>
      </div>

      <div
        className="wrap journey-track"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 0,
          alignItems: "stretch",
        }}
      >
        {stages.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "22px 14px 18px",
              textAlign: "center",
              borderRight: i < 4 ? "1px dashed var(--rule)" : "none",
              position: "relative",
            }}
          >
            <div
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 28,
                color: s.active ? "var(--paper)" : "var(--ink)",
                border: "1px solid var(--ink)",
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: s.active ? "var(--accent)" : "var(--paper)",
                marginBottom: 12,
                fontWeight: 500,
                borderColor: s.active ? "var(--accent)" : "var(--ink)",
              }}
            >
              {s.glyph}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10.5px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 4,
              }}
            >
              {s.ts}
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--ink)",
              }}
            >
              {s.body}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .journey-track { grid-template-columns: 1fr !important; }
          .journey-track > div { border-right: 0 !important; border-bottom: 1px dashed var(--rule); padding: 18px !important; }
          section > .wrap:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

export default function Infographics() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div ref={ref}>
      <Numbers stats={stats} />
      <Journey />
    </div>
  );
}
