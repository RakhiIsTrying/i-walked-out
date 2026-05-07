"use client";

import { useState, useEffect, useRef } from "react";

function StatBlock({ num, label, sub, color, rotate = 0 }: { num: string; label: string; sub: string; color: string; rotate?: number }) {
  return (
    <div
      className="lift"
      style={{
        background: color,
        border: "2.5px solid var(--ink)",
        boxShadow: "6px 6px 0 var(--ink)",
        padding: "26px 18px",
        transform: `rotate(${rotate}deg)`,
        textAlign: "center",
        position: "relative",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div className="display" style={{ fontSize: "clamp(36px, 4.2vw, 60px)", color: "var(--ink)", lineHeight: 0.9, letterSpacing: "-0.03em", wordBreak: "break-word" }}>
        {num}
      </div>
      <div className="heavy" style={{ fontSize: 13, color: "var(--ink)", marginTop: 8 }}>{label}</div>
      {sub && <div className="hand" style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function ChunkyBar({ label, pct, color, emoji, animated }: { label: string; pct: number; color: string; emoji: string; animated: boolean }) {
  return (
    <div className="chunky-bar" style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", alignItems: "center", gap: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span className="display" style={{ fontSize: 13, color: "var(--ink)", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ height: 32, border: "2.5px solid var(--ink)", background: "var(--paper-light)", position: "relative", boxShadow: "3px 3px 0 var(--ink)" }}>
        <div
          style={{
            width: `${animated ? pct : 0}%`,
            height: "100%",
            background: color,
            borderRight: "2.5px solid var(--ink)",
            backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,0.08) 6px 8px)",
            transition: "width 1.2s cubic-bezier(.2,.9,.3,1.1)",
          }}
        />
      </div>
      <div className="heavy" style={{ fontSize: 22, color: "var(--ink)", textAlign: "right" }}>{pct}%</div>
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
    { label: "BECOMING A MORNING PERSON", pct: 87, color: "var(--rose)", emoji: "☀️" },
    { label: "LEARNING A LANGUAGE", pct: 73, color: "var(--teal)", emoji: "🗣️" },
    { label: "STARTING A CAFÉ", pct: 64, color: "var(--butter)", emoji: "☕" },
    { label: "FINISHING THE NOVEL", pct: 58, color: "var(--plum)", emoji: "📖" },
    { label: "RUNNING A MARATHON", pct: 41, color: "var(--rose)", emoji: "🏃" },
    { label: "GETTING BACK W/ THEM", pct: 29, color: "var(--teal)", emoji: "💔" },
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
    <section ref={ref} style={{ padding: "80px clamp(16px, 4vw, 48px)", background: "var(--paper)", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="checker" style={{ position: "absolute", top: 30, right: -30, width: 160, height: 80, opacity: 0.25, transform: "rotate(8deg)" }} />
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", bottom: 60, left: -40, width: 200, height: 200, opacity: 0.3, transform: "rotate(-12deg)" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span className="sticker" style={{ background: "var(--ink)", color: "var(--butter)", fontSize: 12, padding: "8px 16px" }}>★ THE NUMBERS ★</span>
          <h2 className="display" style={{ fontSize: "clamp(48px, 8vw, 100px)", lineHeight: 0.9, margin: "20px 0 0", color: "var(--ink)", textShadow: "6px 6px 0 var(--teal)" }}>
            DREAMS, BY<br />
            <span className="brush" style={{ color: "var(--rose)", textShadow: "none", display: "inline-block", transform: "rotate(-3deg)" }}>the numbers</span>
          </h2>
          <p className="hand" style={{ fontSize: 24, color: "var(--ink-soft)", marginTop: 40, transform: "rotate(-1deg)", display: "inline-block" }}>
            (we counted. you&apos;re not alone.)
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 28, marginBottom: 70 }}>
          <StatBlock num="12,847" label="DREAMS RELEASED" sub="and counting" color="var(--butter)" rotate={-2} />
          <StatBlock num="3.2s" label="AVG TIME TO LET GO" sub="faster than a tweet" color="var(--rose)" rotate={1.5} />
          <StatBlock num="89%" label="FELT LIGHTER AFTER" sub="science? vibes?" color="var(--teal)" rotate={-1} />
          <StatBlock num="0" label="JUDGEMENT" sub="not even a little" color="var(--plum)" rotate={2} />
        </div>

        <div className="infographic-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 50, alignItems: "start" }}>
          <div style={{ background: "var(--paper-light)", border: "2.5px solid var(--ink)", boxShadow: "8px 8px 0 var(--ink)", padding: "30px 28px", position: "relative" }}>
            <div style={{ position: "absolute", top: -16, left: 24 }}>
              <span className="sticker" style={{ fontSize: 12, background: "var(--rose)", color: "var(--paper-light)", transform: "rotate(-4deg)" }}>TOP RELEASES</span>
            </div>
            <h3 className="heavy" style={{ fontSize: 24, margin: "10px 0 22px", color: "var(--ink)" }}>
              what y&apos;all are letting go of
            </h3>
            {dreams.map((d) => (
              <ChunkyBar key={d.label} {...d} animated={animated} />
            ))}
            <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", borderTop: "1px dashed var(--ink-faded)", paddingTop: 12, marginTop: 18, letterSpacing: "0.05em" }}>
              SAMPLE: 12,847 DREAMS · ROLLING 30 DAYS
            </p>
          </div>

          <div style={{ background: "var(--paper-light)", border: "2.5px solid var(--ink)", boxShadow: "8px 8px 0 var(--ink)", padding: "30px 28px", position: "relative" }}>
            <div style={{ position: "absolute", top: -16, left: 24 }}>
              <span className="sticker" style={{ fontSize: 12, background: "var(--teal)", color: "var(--paper-light)", transform: "rotate(3deg)" }}>HOW IT FELT</span>
            </div>
            <h3 className="heavy" style={{ fontSize: 24, margin: "10px 0 18px", color: "var(--ink)" }}>
              after letting go,<br />you said you felt:
            </h3>
            <svg viewBox="-10 -10 220 220" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
              {pieSegs.map((s, i) => {
                const [x1, y1] = polar(100, 100, 95, animated ? s.start : 0);
                const [x2, y2] = polar(100, 100, 95, animated ? s.end : 0);
                const large = s.end - s.start > 0.5 ? 1 : 0;
                const ang = (s.start + s.end) / 2;
                const [ox, oy] = polar(0, 0, 6, ang);
                return (
                  <path
                    key={i}
                    d={`M ${100 + ox} ${100 + oy} L ${x1 + ox} ${y1 + oy} A 95 95 0 ${large} 1 ${x2 + ox} ${y2 + oy} Z`}
                    fill={s.color}
                    stroke="var(--ink)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    style={{ transition: "all 1s ease" }}
                  />
                );
              })}
            </svg>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 18 }}>
              {pieSegs.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ width: 14, height: 14, background: s.color, border: "2px solid var(--ink)", display: "inline-block" }} />
                  <span className="heavy" style={{ fontSize: 12 }}>{s.label}</span>
                  <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)" }}>{Math.round(s.pct * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 70 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span className="sticker" style={{ background: "var(--butter)", fontSize: 12, transform: "rotate(2deg)" }}>★ A DREAM&apos;S JOURNEY ★</span>
          </div>
          <div className="timeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, alignItems: "stretch" }}>
            {timeline.map((step, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{
                  background: step.c,
                  border: "2.5px solid var(--ink)",
                  boxShadow: "5px 5px 0 var(--ink)",
                  padding: "18px 12px",
                  textAlign: "center",
                  transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                  height: "100%",
                }}>
                  <div style={{ fontSize: 36, lineHeight: 1 }}>{step.emoji}</div>
                  <div className="typewriter" style={{ fontSize: 11, color: "var(--ink)", marginTop: 8, letterSpacing: "0.1em" }}>+{step.t}</div>
                  <div className="heavy" style={{ fontSize: 13, color: "var(--ink)", marginTop: 6, lineHeight: 1.2 }}>{step.label}</div>
                </div>
                {i < 4 && (
                  <div className="display timeline-arrow" style={{ position: "absolute", right: -22, top: "40%", fontSize: 28, color: "var(--ink)", zIndex: 2 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
