"use client";

import { useState } from "react";

const MOODS = [
  { symbol: "\u{1F60D}", label: "loved it" },
  { symbol: "\u{1F914}", label: "confused" },
  { symbol: "\u{1F41B}", label: "broken" },
  { symbol: "\u{1F4A1}", label: "idea" },
  { symbol: "\u{1F44B}", label: "just hi" },
];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!message.trim() && !mood) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          emoji: mood,
          page: window.location.pathname,
        }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
        setMood(null);
        setTimeout(() => {
          setSent(false);
          setOpen(false);
        }, 1500);
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Sticky-note trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Give feedback"
        className="iwo-fb-trigger"
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 9998,
          background: "var(--accent)",
          color: "var(--paper)",
          border: "1.5px solid var(--ink)",
          borderRadius: 4,
          padding: "12px 18px 14px",
          boxShadow: "4px 4px 0 var(--ink)",
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 17,
          lineHeight: 1.05,
          cursor: "pointer",
          transform: "rotate(-3deg)",
          transformOrigin: "bottom right",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 220,
          textAlign: "left",
          animation: "iwoFbWiggle 4.2s ease-in-out infinite",
          transition: "transform .25s cubic-bezier(.5,1.6,.6,1), box-shadow .2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "rotate(0deg) scale(1.05)";
          e.currentTarget.style.boxShadow = "6px 6px 0 var(--ink)";
          e.currentTarget.style.animationPlayState = "paused";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "rotate(-3deg)";
          e.currentTarget.style.boxShadow = "4px 4px 0 var(--ink)";
          e.currentTarget.style.animationPlayState = "running";
        }}
      >
        <span
          style={{
            position: "absolute",
            top: -8,
            left: 18,
            width: 30,
            height: 14,
            background: "rgba(220,200,160,0.55)",
            border: "1px solid rgba(60,40,20,0.18)",
            borderRadius: 2,
            transform: "rotate(-6deg)",
            boxShadow: "1px 1px 0 rgba(60,40,20,0.08)",
          }}
        />
        <span
          className="iwo-fb-psst"
          style={{
            fontFamily: "var(--mono)",
            fontStyle: "normal",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.85,
            marginBottom: 2,
          }}
        >
          psst &mdash;
        </span>
        <span className="iwo-fb-title" style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 500, letterSpacing: "-0.01em" }}>
          tell us
        </span>
        <span
          className="iwo-fb-sub"
          style={{
            fontFamily: "var(--mono)",
            fontStyle: "normal",
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.78,
            marginTop: 3,
          }}
        >
          a sticky note &rarr;
        </span>
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="iwo-fb-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31,26,20,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "fadeUp 0.25s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="iwo-fb-modal"
            style={{
              background: "var(--paper)",
              border: "1.5px solid var(--ink)",
              borderRadius: 4,
              boxShadow: "8px 8px 0 var(--paper-edge)",
              width: 420,
              maxWidth: "100%",
              padding: "32px 28px 24px",
              position: "relative",
            }}
          >
            {/* Stamp label */}
            <div
              style={{
                position: "absolute",
                top: -14,
                right: 24,
                background: "var(--accent)",
                color: "var(--paper)",
                fontFamily: "var(--mono)",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "5px 12px",
                borderRadius: 3,
                border: "1.5px solid var(--ink)",
              }}
            >
              unsigned mail &middot; ok
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                background: "none",
                border: "none",
                fontSize: 20,
                color: "var(--ink-3)",
                cursor: "pointer",
                lineHeight: 1,
                padding: 4,
              }}
            >
              &times;
            </button>

            {sent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 28, color: "var(--accent)", marginBottom: 8 }}>
                  Noted.
                </div>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 16, color: "var(--ink-2)" }}>
                  We read every one. Promise.
                </p>
              </div>
            ) : (
              <>
                <h2
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 28,
                    fontWeight: 400,
                    color: "var(--ink)",
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  Slip us a <em style={{ fontStyle: "italic", color: "var(--accent)" }}>note.</em>
                </h2>

                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 15,
                    color: "var(--ink-2)",
                    margin: "0 0 16px",
                    lineHeight: 1.4,
                  }}
                >
                  Anonymous. Unedited. Read with coffee on Sundays.
                </p>

                {/* Mood chips */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setMood(mood === m.label ? null : m.label)}
                      style={{
                        padding: "7px 14px",
                        background: mood === m.label ? "var(--ink)" : "var(--paper)",
                        color: mood === m.label ? "var(--paper)" : "var(--ink)",
                        border: "1px solid var(--ink)",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        transition: "all .15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{m.symbol}</span>
                      {m.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 600))}
                  placeholder={"What do you wish were different? What made you smile?\nAnything, really."}
                  maxLength={600}
                  rows={4}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 16,
                    lineHeight: 1.5,
                    background: "var(--note-1)",
                    border: "1.5px solid var(--rule)",
                    borderRadius: 3,
                    padding: "14px 16px",
                    color: "var(--ink)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                <div className="iwo-fb-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      color: "var(--ink-3)",
                      flexShrink: 0,
                    }}
                  >
                    {message.length} / 600
                  </span>

                  <button
                    onClick={handleSubmit}
                    disabled={sending || (!message.trim() && !mood)}
                    className="btn-ink"
                    style={{
                      opacity: sending || (!message.trim() && !mood) ? 0.4 : 1,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sending ? "sending..." : "Slip it under the door →"}
                  </button>
                </div>

                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                    textAlign: "center",
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: "1px dashed var(--rule)",
                  }}
                >
                  no email collected &middot; we read every one &middot; promise
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes iwoFbWiggle {
          0%, 100% { transform: rotate(-3deg); }
          45% { transform: rotate(-3deg); }
          50% { transform: rotate(2deg) translateY(-2px); }
          55% { transform: rotate(-3deg); }
          60% { transform: rotate(0deg); }
          65% { transform: rotate(-3deg); }
        }
        @media (max-width: 480px) {
          .iwo-fb-trigger {
            right: 12px !important;
            bottom: 12px !important;
            padding: 8px 12px 10px !important;
            max-width: 160px !important;
          }
          .iwo-fb-title { font-size: 16px !important; }
          .iwo-fb-psst, .iwo-fb-sub { font-size: 8px !important; }
          .iwo-fb-backdrop { padding: 12px !important; align-items: flex-end !important; }
          .iwo-fb-modal {
            padding: 24px 18px 20px !important;
            border-radius: 4px 4px 0 0 !important;
            box-shadow: none !important;
            max-height: 90vh;
            overflow-y: auto;
          }
        }
      `}</style>
    </>
  );
}
