"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const FEEDBACK_EMOJIS = [
  { emoji: "😍", label: "love it" },
  { emoji: "👍", label: "good" },
  { emoji: "🤔", label: "hmm" },
  { emoji: "👎", label: "nope" },
  { emoji: "🐛", label: "bug" },
];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!message.trim() && !emoji) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          emoji,
          page: window.location.pathname,
        }),
      });
      if (res.ok) {
        setSent(true);
        setMessage("");
        setEmoji(null);
        setTimeout(() => {
          setSent(false);
          setOpen(false);
        }, 1500);
      }
    } catch {
      // network error
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Give feedback"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: open ? "var(--ink)" : "var(--teal)",
          color: "var(--paper-light)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
          zIndex: 1000,
          transition: "all 0.2s ease",
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Feedback panel */}
      {open && (
        <div
          className="page-in"
          style={{
            position: "fixed",
            bottom: 84,
            right: 24,
            width: 320,
            maxWidth: "calc(100vw - 48px)",
            background: "var(--paper-light)",
            borderRadius: 6,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px 10px",
              borderBottom: "1px solid rgba(106,112,140,0.15)",
            }}
          >
            <div
              className="typewriter"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--rose)",
                marginBottom: 4,
              }}
            >
              feedback
            </div>
            <p
              className="serif"
              style={{
                fontSize: 16,
                fontStyle: "italic",
                margin: 0,
                color: "var(--ink)",
              }}
            >
              {sent ? "Thank you!" : "How's the experience?"}
            </p>
          </div>

          {!sent && (
            <div style={{ padding: "12px 18px 16px" }}>
              {/* Emoji row */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {FEEDBACK_EMOJIS.map((item) => (
                  <button
                    key={item.emoji}
                    onClick={() => setEmoji(emoji === item.emoji ? null : item.emoji)}
                    style={{
                      padding: "6px 8px",
                      background:
                        emoji === item.emoji
                          ? "rgba(42,95,214,0.12)"
                          : "var(--paper-deep)",
                      border:
                        emoji === item.emoji
                          ? "1.5px solid var(--teal)"
                          : "1px solid rgba(106,112,140,0.2)",
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{item.emoji}</span>
                    <span
                      className="typewriter"
                      style={{
                        fontSize: 7,
                        letterSpacing: "0.05em",
                        color: "var(--ink-faded)",
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                maxLength={1000}
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "var(--paper)",
                  border: "1px solid rgba(106,112,140,0.25)",
                  borderRadius: 4,
                  padding: "10px 12px",
                  color: "var(--ink)",
                  boxSizing: "border-box",
                }}
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={sending || (!message.trim() && !emoji)}
                className="typewriter"
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "10px",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  background:
                    sending || (!message.trim() && !emoji)
                      ? "var(--ink-faded)"
                      : "var(--ink)",
                  color: "var(--paper-light)",
                  border: "none",
                  borderRadius: 3,
                  cursor:
                    sending || (!message.trim() && !emoji)
                      ? "default"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
              >
                <Send size={14} />
                {sending ? "sending..." : "send feedback"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
