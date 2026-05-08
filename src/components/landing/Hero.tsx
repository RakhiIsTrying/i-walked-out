"use client";

import Link from "next/link";
import { useState, useRef } from "react";

function fireConfetti(originX: number, originY: number) {
  const colors = ["var(--accent)", "var(--note-1)", "var(--note-4)"];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = originX + "px";
    el.style.top = originY + "px";
    el.style.width = (3 + Math.random() * 5) + "px";
    el.style.height = (6 + Math.random() * 8) + "px";
    el.style.background = colors[i % colors.length];
    el.style.borderRadius = "1px";
    el.style.setProperty("--dx", (Math.random() - 0.5) * 400 + "px");
    el.style.setProperty("--dur", (1.8 + Math.random() * 1.2) + "s");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

function ReleaseCard() {
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(true);
  const [released, setReleased] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const release = async () => {
    if (!text.trim()) return;
    const rect = cardRef.current?.getBoundingClientRect();
    try {
      await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: text.slice(0, 60),
          description: text,
          category: "other",
          emotion: "reflective",
        }),
      });
    } catch { /* silent */ }
    if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + 60);
    setReleased(true);
    setTimeout(() => {
      setReleased(false);
      setText("");
    }, 2200);
  };

  return (
    <div
      ref={cardRef}
      style={{
        background: "var(--paper)",
        border: "1px solid var(--ink)",
        borderRadius: 4,
        padding: "22px 22px 18px",
        boxShadow: "6px 6px 0 var(--paper-edge)",
        position: "relative",
      }}
    >
      {/* Pin hole */}
      <div
        style={{
          position: "absolute",
          top: -7,
          left: "50%",
          transform: "translateX(-50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, var(--accent) 0 35%, var(--accent-deep) 36% 60%, #6e2f0e 61% 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      />

      <label
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10.5px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        Release form &middot; No. 01248
      </label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="today i'm letting go of…"
        disabled={released}
        style={{
          width: "100%",
          border: 0,
          outline: 0,
          resize: "none",
          background: "transparent",
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 24,
          lineHeight: 1.35,
          color: "var(--ink)",
          padding: "6px 0 14px",
          minHeight: 84,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px dashed var(--rule)",
          paddingTop: 12,
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span
            className={`chip ${anon ? "on" : ""}`}
            onClick={() => setAnon(!anon)}
            style={{ padding: "4px 8px", cursor: "pointer" }}
          >
            anonymous
          </span>
          <span className="chip" style={{ padding: "4px 8px" }}>
            add a note to self
          </span>
        </div>
        <button
          onClick={release}
          disabled={!text.trim() || released}
          className="btn-ink"
          style={{ opacity: !text.trim() ? 0.4 : 1 }}
        >
          {released ? "released" : "Let it go"} {!released && <span style={{ display: "inline-block", transform: "translateY(-1px)" }}>↳</span>}
        </button>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section style={{ padding: "72px 0 40px", position: "relative" }}>
      <div
        className="wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        <div>
          <div className="eyebrow">A scrapbook for released dreams</div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(56px, 7.6vw, 108px)",
              lineHeight: 0.95,
              letterSpacing: "-0.025em",
              margin: "18px 0 24px",
            }}
          >
            Quit your{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--accent)",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              dreams.
              <span
                style={{
                  position: "absolute",
                  left: "2%",
                  right: "2%",
                  bottom: -4,
                  height: 10,
                  background:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 10' preserveAspectRatio='none'><path d='M2 7 Q 50 1 100 5 T 198 5' stroke='%23b6651e' stroke-width='2' fill='none' stroke-linecap='round'/></svg>\") center / 100% 100% no-repeat",
                }}
              />
            </em>
            <br />
            Keep your{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--accent)",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              weekends.
              <span
                style={{
                  position: "absolute",
                  left: "2%",
                  right: "2%",
                  bottom: -4,
                  height: 10,
                  background:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 10' preserveAspectRatio='none'><path d='M2 7 Q 50 1 100 5 T 198 5' stroke='%23b6651e' stroke-width='2' fill='none' stroke-linecap='round'/></svg>\") center / 100% 100% no-repeat",
                }}
              />
            </em>
          </h1>
          <p
            style={{
              maxWidth: "38ch",
              color: "var(--ink-2)",
              fontSize: 19,
              lineHeight: 1.55,
            }}
          >
            A graceful exit for the marathon you&apos;ll never run, the novel you&apos;ll never finish,
            and the ex you absolutely should not text. Two sentences. Thirty seconds. Then it&apos;s
            not yours anymore.
          </p>
          <div
            style={{
              display: "flex",
              gap: 22,
              alignItems: "center",
              marginTop: 32,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
              }}
            />
            <span>1,247 dreams quit today</span>
            <span>&middot;</span>
            <span>Avg. time to give up — 4.7 yrs</span>
          </div>
        </div>

        <aside>
          <ReleaseCard />
          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 22,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
            }}
          >
            <Link
              href="/feed"
              style={{
                borderBottom: "1px solid var(--rule)",
                paddingBottom: 2,
              }}
            >
              Read the wall of regrets →
            </Link>
            <Link
              href="/vibe"
              style={{
                borderBottom: "1px solid var(--rule)",
                paddingBottom: 2,
              }}
            >
              I just want a vibe →
            </Link>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 980px) {
          section > .wrap { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
