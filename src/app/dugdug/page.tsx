"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starters = [
  "what should i do with my life?",
  "is it too late to start over?",
  "be honest with me",
  "roast my decisions",
  "say something i need to hear",
];

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

      if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let reply = "";
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const { text } = JSON.parse(line.slice(6));
                  reply += text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: reply };
                    return updated;
                  });
                } catch {}
              }
            }
          }
        }

        if (!reply) {
          setMessages([...newMessages, { role: "assistant", content: "i blanked out. try again?" }]);
        }
      } else if (res.ok) {
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
    <div className="page-in" style={{ maxWidth: 800, margin: "0 auto", padding: "72px 32px 40px" }}>

      {/* Page intro */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow">the resident satirist</div>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 400,
            fontSize: "clamp(48px, 6.4vw, 72px)",
            lineHeight: 0.98,
            letterSpacing: "-0.025em",
            margin: "18px 0 18px",
          }}
        >
          <em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--accent)" }}>
            Nigel Bottomsworth-Pemberton
          </em>
        </h1>
        <p style={{ maxWidth: "48ch", color: "var(--ink-2)", fontSize: 17, lineHeight: 1.55 }}>
          A personality built from abandoned dreams. Satirical. Deadpan. Uncomfortably honest.
          Ask anything — he&apos;ll say what you already know but were hoping no one would point out.
        </p>
      </div>

      {/* Chat area */}
      <div
        style={{
          background: "var(--ink)",
          border: "1px solid var(--ink)",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "6px 6px 0 var(--paper-edge)",
        }}
      >
        {/* Messages */}
        <div
          style={{
            minHeight: 380,
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "28px 24px 24px",
          }}
          className="no-scrollbar"
        >
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 24,
                  color: "rgba(243,236,224,0.6)",
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                go on then. say something.
              </p>
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "rgba(243,236,224,0.4)",
                  letterSpacing: "0.1em",
                  marginBottom: 24,
                }}
              >
                i&apos;m made of dead dreams and uncomfortable truths. you&apos;ve been warned.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    style={{
                      padding: "8px 16px",
                      fontFamily: "var(--serif)",
                      fontStyle: "italic",
                      fontSize: 15,
                      color: "var(--paper)",
                      background: "rgba(243,236,224,0.08)",
                      border: "1px solid rgba(243,236,224,0.2)",
                      borderRadius: 999,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
                  background:
                    msg.role === "user"
                      ? "var(--accent)"
                      : "rgba(243,236,224,0.08)",
                  color: "var(--paper)",
                  borderRadius:
                    msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  position: "relative",
                }}
              >
                {msg.role === "assistant" && (
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    nigel
                  </span>
                )}
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: msg.role === "assistant" ? "italic" : "normal",
                    fontSize: msg.role === "user" ? 15 : 18,
                    color: "var(--paper)",
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
                  background: "rgba(243,236,224,0.08)",
                  borderRadius: "16px 16px 16px 4px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  nigel
                </span>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 18,
                    color: "rgba(243,236,224,0.5)",
                    margin: 0,
                  }}
                >
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
            borderTop: "1px solid rgba(243,236,224,0.1)",
            background: "rgba(243,236,224,0.04)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="type something..."
            style={{
              flex: 1,
              fontSize: 17,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              padding: "12px 16px",
              background: "rgba(243,236,224,0.06)",
              border: "1px solid rgba(243,236,224,0.15)",
              color: "var(--paper)",
              borderRadius: 3,
            }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: "var(--accent)",
              color: "var(--paper)",
              border: "none",
              padding: "10px 20px",
              borderRadius: 999,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: loading || !input.trim() ? "default" : "pointer",
              opacity: loading || !input.trim() ? 0.4 : 1,
              transition: "opacity .15s",
            }}
          >
            {loading ? "..." : "send ↳"}
          </button>
        </form>
      </div>

      <p
        style={{
          textAlign: "center",
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: 17,
          color: "var(--ink-3)",
          marginTop: 24,
        }}
      >
        every dead dream makes me more honest. that&apos;s not a threat, it&apos;s just... what&apos;s happening.
      </p>
    </div>
  );
}
