"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starters = [
  "what should i do with my life?",
  "is it too late to start over?",
  "give me a pep talk",
  "roast my decisions",
  "tell me something weird",
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
    <div className="page-in" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px 30px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
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
        style={{
          borderRadius: 4,
          padding: 0,
          overflow: "hidden",
          position: "relative",
          background: "var(--paper-light)",
          border: "1px solid rgba(106,112,140,0.15)",
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
                className="hand"
                style={{ fontSize: 26, color: "var(--ink-faded)", margin: 0, marginBottom: 8 }}
              >
                say literally anything. i dare you.
              </p>
              <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.1em", opacity: 0.7, marginBottom: 24 }}>
                i&apos;m made of dead dreams and bad advice. it&apos;s a whole vibe.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="hand"
                    style={{
                      padding: "8px 16px", fontSize: 17, color: "var(--ink-soft)",
                      background: "var(--paper-deep)", border: "1px solid rgba(106,112,140,0.15)",
                      borderRadius: 20, cursor: "pointer", transition: "all 0.15s ease",
                      fontFamily: "'Caveat', cursive",
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
                  background: msg.role === "user" ? "var(--ink)" : "var(--paper-deep)",
                  color: msg.role === "user" ? "var(--paper-light)" : "var(--ink)",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
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
                    color: msg.role === "user" ? "var(--paper-light)" : "var(--ink-soft)",
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
                  background: "var(--paper-deep)",
                  borderRadius: "16px 16px 16px 4px",
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
            borderTop: "1px solid rgba(106,112,140,0.12)",
            background: "rgba(233, 220, 192, 0.15)",
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
