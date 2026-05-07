"use client";

import { useState, useEffect, useRef } from "react";

function StatBlock({ num, label, sub, color, rotate = 0 }: { num: string; label: string; sub: string; color: string; rotate?: number }) {
  return (
    <div
      className="paper lift"
      style={{
        padding: "28px 20px",
        transform: `rotate(${rotate}deg)`,
        textAlign: "center",
        position: "relative",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div className="serif" style={{ fontSize: "clamp(32px, 4vw, 52px)", color, lineHeight: 0.95, fontWeight: 500, fontStyle: "italic" }}>
        {num}
      </div>
      <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink)", marginTop: 10 }}>{label}</div>
      {sub && <div className="hand" style={{ fontSize: 17, color: "var(--ink-faded)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function ChunkyBar({ label, pct, color, emoji, animated }: { label: string; pct: number; color: string; emoji: string; animated: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 50px", alignItems: "center", gap: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink)", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ height: 24, background: "var(--paper-deep)", borderRadius: 2, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            width: `${animated ? pct : 0}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 1.2s cubic-bezier(.2,.9,.3,1.1)",
          }}
        />
      </div>
      <div className="serif" style={{ fontSize: 18, color: "var(--ink)", textAlign: "right", fontWeight: 500 }}>{pct}%</div>
    </div>
  );
}

export default function Infographics() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setAnimated(true)),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dreams = [
    { label: "Morning person", pct: 87, color: "var(--rose)", emoji: "☀️" },
    { label: "Learn a language", pct: 73, color: "var(--teal)", emoji: "🗣️" },
    { label: "Start a café", pct: 64, color: "var(--butter)", emoji: "☕" },
    { label: "Finish the novel", pct: 58, color: "var(--plum)", emoji: "📖" },
    { label: "Run a marathon", pct: 41, color: "var(--rose)", emoji: "🏃" },
    { label: "Get back w/ them", pct: 29, color: "var(--teal)", emoji: "💔" },
  ];

  const moods = [
    { label: "lighter", pct: 0.42, color: "var(--rose)" },
    { label: "weird", pct: 0.21, color: "var(--teal)" },
    { label: "freed", pct: 0.18, color: "var(--butter)" },
    { label: "weepy", pct: 0.11, color: "var(--plum)" },
    { label: "honestly fine", pct: 0.08, color: "var(--ink)" },
  ];

  let pieAcc = 0;
  const pieSegs = moods.map((m) => {
    const start = pieAcc;
    pieAcc += m.pct;
    return { ...m, start, end: pieAcc };
  });

  const polar = (cx: number, cy: number, r: number, t: number): [number, number] => [
    cx + r * Math.cos(2 * Math.PI * t - Math.PI / 2),
    cy + r * Math.sin(2 * Math.PI * t - Math.PI / 2),
  ];

  const timeline = [
    { t: "00:00", label: "you have a dream", emoji: "💭", c: "var(--butter)" },
    { t: "07:23", label: "you avoid it", emoji: "🫥", c: "var(--rose)" },
    { t: "14:08", label: "guilt", emoji: "😬", c: "var(--plum)" },
    { t: "00:30", label: "you release it here", emoji: "✉️", c: "var(--teal)" },
    { t: "00:00", label: "you feel free", emoji: "🪩", c: "var(--butter)" },
  ];

  return (
    <section ref={ref} style={{ padding: "80px clamp(16px, 4vw, 48px)", background: "var(--paper)", position: "relative" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            the numbers
          </div>
          <h2 className="serif" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1, margin: 0, fontWeight: 400, fontStyle: "italic", color: "var(--ink)" }}>
            Dreams, by the numbers.
          </h2>
          <p className="hand" style={{ fontSize: 22, color: "var(--ink-faded)", marginTop: 20 }}>
            (we counted. you&apos;re not alone.)
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 60 }}>
          <StatBlock num="12,847" label="Dreams released" sub="and counting" color="var(--rose)" rotate={-1} />
          <StatBlock num="3.2s" label="Avg time to let go" sub="faster than a tweet" color="var(--teal)" rotate={0.8} />
          <StatBlock num="89%" label="Felt lighter after" sub="science? vibes?" color="var(--butter)" rotate={-0.5} />
          <StatBlock num="0" label="Judgement" sub="not even a little" color="var(--plum)" rotate={1} />
        </div>

        <div className="infographic-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 40, alignItems: "start" }}>
          <div className="paper" style={{ padding: "30px 28px" }}>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 6 }}>
              top releases
            </div>
            <h3 className="serif" style={{ fontSize: 22, margin: "0 0 24px", fontWeight: 400, fontStyle: "italic", color: "var(--ink)" }}>
              What y&apos;all are letting go of
            </h3>
            {dreams.map((d) => (
              <ChunkyBar key={d.label} {...d} animated={animated} />
            ))}
            <p className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", borderTop: "1px solid rgba(106,112,140,0.2)", paddingTop: 14, marginTop: 18, letterSpacing: "0.08em" }}>
              sample: 12,847 dreams · rolling 30 days
            </p>
          </div>

          <div className="paper" style={{ padding: "30px 28px" }}>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: 6 }}>
              how it felt
            </div>
            <h3 className="serif" style={{ fontSize: 22, margin: "0 0 20px", fontWeight: 400, fontStyle: "italic", color: "var(--ink)" }}>
              After letting go, you said you felt:
            </h3>
            <svg viewBox="-10 -10 220 220" style={{ width: "100%", maxWidth: 240, display: "block", margin: "0 auto" }}>
              {pieSegs.map((s, i) => {
                const [x1, y1] = polar(100, 100, 95, animated ? s.start : 0);
                const [x2, y2] = polar(100, 100, 95, animated ? s.end : 0);
                const large = s.end - s.start > 0.5 ? 1 : 0;
                const ang = (s.start + s.end) / 2;
                const [ox, oy] = polar(0, 0, 4, ang);
                return (
                  <path
                    key={i}
                    d={`M ${100 + ox} ${100 + oy} L ${x1 + ox} ${y1 + oy} A 95 95 0 ${large} 1 ${x2 + ox} ${y2 + oy} Z`}
                    fill={s.color}
                    stroke="var(--paper-light)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    style={{ transition: "all 1s ease" }}
                  />
                );
              })}
            </svg>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 18 }}>
              {pieSegs.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, background: s.color, borderRadius: "50%", display: "inline-block" }} />
                  <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{s.label}</span>
                  <span className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)" }}>{Math.round(s.pct * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 60 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
              a dream&apos;s journey
            </div>
          </div>
          <div className="timeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, alignItems: "stretch" }}>
            {timeline.map((step, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div
                  className="paper"
                  style={{
                    padding: "20px 14px",
                    textAlign: "center",
                    transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)`,
                    height: "100%",
                    borderTop: `3px solid ${step.c}`,
                  }}
                >
                  <div style={{ fontSize: 32, lineHeight: 1 }}>{step.emoji}</div>
                  <div className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", marginTop: 10, letterSpacing: "0.1em" }}>+{step.t}</div>
                  <div className="serif" style={{ fontSize: 14, color: "var(--ink)", marginTop: 6, lineHeight: 1.3, fontStyle: "italic" }}>{step.label}</div>
                </div>
                {i < 4 && (
                  <div style={{ position: "absolute", right: -14, top: "40%", fontSize: 20, color: "var(--ink-faded)", zIndex: 2 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
