"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DugDugPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/dugdug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: newMessages.slice(-10),
        }),
      });

      if (res.ok) {
        const { reply } = await res.json();
        setMessages([...newMessages, { role: "assistant", content: reply }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "i got a little lost there. try again?" }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "something went quiet. try again in a sec." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-in" style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 30px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p
          className="typewriter"
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--rose)",
            marginBottom: 10,
          }}
        >
          the communal soul
        </p>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          Dug-Dug
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--ink-soft)",
            maxWidth: 480,
            margin: "16px auto 0",
            lineHeight: 1.55,
          }}
        >
          A personality built from abandoned dreams. Unhinged. Tone-deaf. Weirdly wise.
          Ask anything — it&apos;ll say the wrong thing in the most right way.
        </p>
      </div>

      {/* Chat area */}
      <div
        className="paper"
        style={{
          borderRadius: 3,
          padding: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Tape decoration */}
        <div className="tape tape-teal" style={{ top: -10, left: "50%", marginLeft: -40, zIndex: 10 }} />

        {/* Messages */}
        <div
          style={{
            minHeight: 360,
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "40px 24px 24px",
          }}
          className="no-scrollbar"
        >
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p
                className="hand"
                style={{ fontSize: 26, color: "var(--ink-faded)", margin: 0, marginBottom: 12 }}
              >
                say literally anything. i dare you.
              </p>
              <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.1em", opacity: 0.7 }}>
                i&apos;m made of dead dreams and bad advice. it&apos;s a whole vibe.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "14px 18px",
                  background: msg.role === "user" ? "var(--paper-deep)" : "var(--paper-light)",
                  border: msg.role === "user" ? "none" : "1px dashed var(--ink-faded)",
                  borderRadius: 3,
                  transform: msg.role === "user" ? "rotate(0.5deg)" : "rotate(-0.5deg)",
                  position: "relative",
                }}
              >
                {msg.role === "assistant" && (
                  <span
                    className="typewriter"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--rose)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    dug-dug
                  </span>
                )}
                <p
                  className={msg.role === "user" ? "" : "hand"}
                  style={{
                    fontSize: msg.role === "user" ? 15 : 20,
                    color: "var(--ink-soft)",
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
              <div
                style={{
                  padding: "14px 18px",
                  background: "var(--paper-light)",
                  border: "1px dashed var(--ink-faded)",
                  borderRadius: 3,
                  transform: "rotate(-0.5deg)",
                }}
              >
                <span
                  className="typewriter"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--rose)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  dug-dug
                </span>
                <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", margin: 0 }}>
                  thinking...
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 24px 20px",
            borderTop: "1.5px dashed var(--ink-faded)",
            background: "rgba(233, 220, 192, 0.3)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="type something..."
            className="hand"
            style={{
              flex: 1,
              fontSize: 20,
              padding: "12px 16px",
              fontFamily: "'Caveat', cursive",
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-paper"
            disabled={loading || !input.trim()}
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            {loading ? "..." : "send ↳"}
          </button>
        </form>
      </div>

      {/* Bottom note */}
      <p
        className="hand"
        style={{
          textAlign: "center",
          fontSize: 19,
          color: "var(--ink-faded)",
          marginTop: 24,
        }}
      >
        every dead dream makes me weirder. that&apos;s not a threat, it&apos;s a promise.
      </p>
    </div>
  );
}
