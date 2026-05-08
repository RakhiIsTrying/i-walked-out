"use client";

import { useState, useRef, useEffect } from "react";
import { PersonalityProfile } from "@/lib/types";

interface Props {
  profile: PersonalityProfile | null;
  emptyText: string;
  subtitle: string;
}

export default function PersonalityChat({ profile, emptyText, subtitle }: Props) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    const updated = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/personality", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, personality: profile, history: messages }),
      });

      if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let reply = "";
        setMessages([...updated, { role: "assistant", content: "" }]);

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
                    const msgs = [...prev];
                    msgs[msgs.length - 1] = { role: "assistant", content: reply };
                    return msgs;
                  });
                } catch {}
              }
            }
          }
        }

        if (!reply) {
          setMessages([...updated, { role: "assistant", content: "I lost my train of thought. Try again." }]);
        }
      } else if (res.ok) {
        const data = await res.json();
        setMessages([...updated, { role: "assistant", content: data.response }]);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <section
      className="paper"
      style={{ borderRadius: 3, overflow: "hidden", position: "relative" }}
    >
      <div style={{ padding: "24px 24px 16px", borderBottom: "1.5px dashed var(--ink-faded)" }}>
        <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 4 }}>
          Chat with your Future Self
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-faded)" }}>{subtitle}</p>
      </div>

      <div style={{ maxHeight: 450, minHeight: 180, overflowY: "auto", padding: 24 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140 }}>
            <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", opacity: 0.5, textAlign: "center" }}>
              {emptyText}
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
                maxWidth: "75%",
                padding: "14px 18px",
                borderRadius: 3,
                position: "relative",
                ...(msg.role === "user"
                  ? {
                      background: "var(--paper-deep)",
                      border: "1px dashed var(--ink-faded)",
                      fontFamily: "'Caveat', cursive",
                      fontSize: 19,
                      lineHeight: 1.4,
                      color: "var(--ink-soft)",
                    }
                  : {
                      background: "var(--paper-light)",
                      border: "1px solid var(--ink-faded)",
                      borderLeft: "3px solid var(--teal)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--ink-soft)",
                    }),
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
            <div
              style={{
                padding: "14px 18px",
                background: "var(--paper-light)",
                border: "1px solid var(--ink-faded)",
                borderLeft: "3px solid var(--teal)",
                borderRadius: 3,
              }}
            >
              <span className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
                {profile ? "analyzing..." : "thinking..."}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div style={{ borderTop: "1.5px dashed var(--ink-faded)", padding: 16 }}>
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          style={{ display: "flex", gap: 12 }}
        >
          <input
            type="text"
            placeholder="Ask your future self..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="hand"
            style={{ flex: 1, fontSize: 18 }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-paper"
            style={{ padding: "10px 20px", fontSize: 14 }}
          >
            send &rarr;
          </button>
        </form>
      </div>
    </section>
  );
}
