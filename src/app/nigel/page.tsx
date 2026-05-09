"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starters = [
  { label: "roast my decisions", q: "roast my decisions" },
  { label: "be honest with me", q: "be honest with me" },
  { label: "say something i need to hear", q: "say something i need to hear" },
  { label: "is it too late?", q: "is it too late to start over?" },
  { label: "what should i do", q: "what should i do with my life?" },
];

const NIGEL_STORAGE_KEY = "nigel_chat_history";

function loadChat(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NIGEL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChat(msgs: Message[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NIGEL_STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
}

export default function DugDugPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/chat-history?type=nigel");
        if (res.ok) {
          const { history } = await res.json();
          if (history && history.length > 0) {
            const msgs = history.map((h: { role: string; content: string }) => ({
              role: h.role as "user" | "assistant",
              content: h.content,
            }));
            setMessages(msgs);
            saveChat(msgs);
            setHydrated(true);
            return;
          }
        }
      } catch {}
      const saved = loadChat();
      if (saved.length > 0) setMessages(saved);
      setHydrated(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (hydrated && messages.length > 0) saveChat(messages);
  }, [messages, hydrated]);

  function persistMsg(role: "user" | "assistant", content: string) {
    fetch("/api/chat-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatType: "nigel", role, content }),
    }).catch(() => {});
  }

  const autoResize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "46px";
    ta.style.height = Math.min(140, ta.scrollHeight) + "px";
  }, []);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "46px";

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: msg },
    ];
    setMessages(newMessages);
    setLoading(true);
    persistMsg("user", msg);

    try {
      const res = await fetch("/api/nigel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: newMessages.slice(-10),
        }),
      });

      if (
        res.ok &&
        res.headers.get("content-type")?.includes("text/event-stream")
      ) {
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
                  const { text: t } = JSON.parse(line.slice(6));
                  reply += t;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: reply,
                    };
                    return updated;
                  });
                } catch {}
              }
            }
          }
        }

        if (!reply) {
          setMessages([
            ...newMessages,
            { role: "assistant", content: "i blanked out. try again?" },
          ]);
        } else {
          persistMsg("assistant", reply);
        }
      } else if (res.ok) {
        const { reply } = await res.json();
        setMessages([...newMessages, { role: "assistant", content: reply }]);
        if (reply) persistMsg("assistant", reply);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "i got a little lost there. try again?",
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "something went quiet. try again in a sec.",
        },
      ]);
    } finally {
      setLoading(false);
      taRef.current?.focus();
    }
  }

  const hasMessages = messages.length > 0 || !hydrated;

  return (
    <div className="page-in nigel-page" style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px 40px" }}>
      {/* Page intro */}
      <div className="eyebrow">Nigel B. Pemberton · the resident satirist</div>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontWeight: 400,
          fontSize: "clamp(48px, 6.4vw, 88px)",
          lineHeight: 0.98,
          letterSpacing: "-0.025em",
          margin: "18px 0 18px",
          maxWidth: "16ch",
        }}
      >
        Tell Nigel{" "}
        <em
          style={{
            fontStyle: "italic",
            fontWeight: 500,
            color: "var(--accent)",
            position: "relative",
            whiteSpace: "nowrap",
          }}
        >
          what you already know.
        </em>
      </h1>
      <p
        style={{
          maxWidth: "56ch",
          color: "var(--ink-2)",
          fontSize: 19,
          lineHeight: 1.55,
          marginBottom: 0,
        }}
      >
        A personality built from abandoned dreams. Satirical. Deadpan.
        Uncomfortably honest. He&apos;ll say what you already know but were
        hoping no one would point out.
      </p>

      {/* ── The Burrow ── */}
      <div className="burrow">
        {/* Top rule */}
        <div className="burrow-top">
          <div className="who">
            <div className="nigel-head" />
            <span>
              <strong style={{ fontStyle: "normal", color: "var(--paper)" }}>
                Nigel B. Pemberton
              </strong>{" "}
              · satirist-in-residence ·{" "}
              <span style={{ color: "rgba(243,236,224,0.5)" }}>
                est. always
              </span>
            </span>
          </div>
          <span className="live-dot">listening</span>
        </div>

        {/* Chat thread */}
        <div className="thread" ref={threadRef}>
          {!hasMessages && (
            <>
              <div className="msg dug">
                <div className="av">
                  <div className="mouth" />
                </div>
                <div>
                  <div className="bubble">
                    right. you came down. <em>bold move.</em>
                  </div>
                  <div className="msg-meta">just now</div>
                </div>
              </div>
              <div className="msg dug">
                <div className="av">
                  <div className="mouth" />
                </div>
                <div>
                  <div className="bubble">
                    go on then. say something you already know is true but
                    haven&apos;t said out loud yet. i&apos;ll try not to be too
                    honest about it. actually no. i won&apos;t try at all.
                  </div>
                  <div className="msg-meta">just now</div>
                </div>
              </div>
            </>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`msg ${msg.role === "user" ? "me" : "dug"}`}
            >
              <div className="av">
                <div className="mouth" />
              </div>
              <div>
                <div className="bubble">{msg.content}</div>
                <div className="msg-meta">just now</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg dug">
              <div className="av">
                <div className="mouth" />
              </div>
              <div>
                <div className="bubble">
                  <span className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
                <div className="msg-meta">thinking...</div>
              </div>
            </div>
          )}
        </div>

        {/* Dock */}
        <div className="dock">
          {!hasMessages && (
            <div className="starter-row">
              {starters.map((s) => (
                <button
                  key={s.label}
                  className="starter"
                  onClick={() => send(s.q)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="input-row">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="say it out loud (or quietly. nigel doesn't mind.)"
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="send"
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* ── Info cards ── */}
      <div className="liner">
        <div className="liner-card">
          <h4>Who is Nigel</h4>
          <p>
            A personality assembled from abandoned dreams. Satirical, deadpan,
            and uncomfortably honest. Says what everyone&apos;s thinking but
            won&apos;t say.
          </p>
          <p>
            Does not comfort. Does not soften. Will occasionally roast your
            life choices unprompted.
          </p>
        </div>
        <div className="liner-card">
          <h4>Rules of engagement</h4>
          <ul>
            <li>say anything · he&apos;s heard worse</li>
            <li>don&apos;t expect sympathy · expect honesty</li>
            <li>he gets sharper the more dreams people release</li>
            <li>you can stop whenever you want · he won&apos;t care</li>
          </ul>
        </div>
        <div className="liner-card">
          <h4>Last buried dream</h4>
          <div className="liner-quote">
            &ldquo;i was going to be the kind of person who reads at the
            gym.&rdquo;
          </div>
          <p
            style={{
              marginTop: 10,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            — anon · 7 months ago
          </p>
        </div>
      </div>

      <style>{`
        /* ── Burrow stage ── */
        .burrow {
          margin-top: 28px;
          background:
            radial-gradient(ellipse at 50% -10%, rgba(243,236,224,0.08) 0%, transparent 55%),
            linear-gradient(180deg, #2c2520 0%, #1a1714 60%, #0f0c09 100%);
          border: 1px solid var(--ink);
          box-shadow: 8px 8px 0 var(--paper-edge);
          border-radius: 4px;
          color: var(--paper);
          position: relative;
          overflow: hidden;
          min-height: 620px;
          display: grid;
          grid-template-rows: auto 1fr auto;
        }

        .burrow-top {
          padding: 14px 24px;
          border-bottom: 1px dashed rgba(243,236,224,0.18);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--mono);
          font-size: 10.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(243,236,224,0.5);
        }
        .live-dot::before {
          content: "●";
          color: var(--accent);
          margin-right: 6px;
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse { 50% { opacity: 0.3; } }

        .who {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(243,236,224,0.7);
          text-transform: none;
          letter-spacing: 0;
          font-family: var(--serif);
          font-style: italic;
          font-size: 15px;
        }
        .nigel-head {
          width: 26px;
          height: 26px;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          background: radial-gradient(circle at 30% 30%, #5a4a3c 0 30%, #2e2620 31% 100%);
          border: 1px solid rgba(243,236,224,0.5);
          position: relative;
        }
        .nigel-head::before, .nigel-head::after {
          content: "";
          position: absolute;
          top: 9px;
          width: 3px;
          height: 3px;
          background: var(--paper);
          border-radius: 50%;
        }
        .nigel-head::before { left: 7px; }
        .nigel-head::after { right: 7px; }

        /* ── Chat thread ── */
        .thread {
          padding: 28px 24px 12px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
          scroll-behavior: smooth;
          max-height: 540px;
        }
        .msg {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 12px;
          max-width: 78%;
        }
        .msg.me {
          justify-self: end;
          grid-template-columns: 1fr 38px;
        }
        .msg .av {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(243,236,224,0.4);
          background: radial-gradient(circle at 30% 30%, #5a4a3c 0 30%, #2e2620 31% 100%);
          position: relative;
          flex-shrink: 0;
        }
        .msg .av::before, .msg .av::after {
          content: "";
          position: absolute;
          top: 13px;
          width: 4px;
          height: 4px;
          background: var(--paper);
          border-radius: 50%;
        }
        .msg .av::before { left: 11px; }
        .msg .av::after { right: 11px; }
        .msg .av .mouth {
          position: absolute;
          bottom: 9px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 3px;
          border-radius: 0 0 8px 8px;
          background: var(--paper);
        }

        .msg.me .av {
          background: var(--paper);
          border-color: var(--paper);
          grid-column: 2;
        }
        .msg.me .av::before, .msg.me .av::after {
          background: var(--ink);
          top: 14px;
        }
        .msg.me .av::before { left: 12px; }
        .msg.me .av::after { right: 12px; }
        .msg.me .av .mouth { background: var(--ink); }

        .bubble {
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 17px;
          line-height: 1.45;
        }
        .msg.dug .bubble {
          background: rgba(243,236,224,0.06);
          border: 1px solid rgba(243,236,224,0.18);
          color: var(--paper);
          font-family: var(--serif);
          border-bottom-left-radius: 4px;
        }
        .msg.dug .bubble em {
          color: var(--accent);
          font-style: italic;
        }
        .msg.me .bubble {
          background: var(--paper);
          color: var(--ink);
          font-family: var(--serif);
          grid-column: 1;
          border-bottom-right-radius: 4px;
        }
        .msg-meta {
          font-family: var(--mono);
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(243,236,224,0.35);
          margin-top: 4px;
        }
        .msg.me .msg-meta { text-align: right; }

        /* ── Typing dots ── */
        .typing-dots {
          display: inline-flex;
          gap: 4px;
          align-items: center;
          padding: 4px 0;
        }
        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(243,236,224,0.55);
          animation: tdot 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes tdot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }

        /* ── Input dock ── */
        .dock {
          border-top: 1px dashed rgba(243,236,224,0.18);
          padding: 16px 20px 18px;
          background: rgba(0,0,0,0.25);
        }
        .starter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .starter {
          appearance: none;
          border: 1px solid rgba(243,236,224,0.25);
          background: transparent;
          color: rgba(243,236,224,0.75);
          padding: 7px 12px;
          border-radius: 999px;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all .2s;
        }
        .starter:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(217,119,87,0.08);
        }
        .input-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: end;
        }
        .input-row textarea {
          appearance: none;
          width: 100%;
          background: rgba(243,236,224,0.05);
          border: 1px solid rgba(243,236,224,0.25);
          border-radius: 18px;
          padding: 12px 16px;
          color: var(--paper);
          font-family: var(--serif);
          font-size: 17px;
          line-height: 1.4;
          resize: none;
          min-height: 46px;
          max-height: 140px;
          outline: none;
          transition: border-color .2s;
        }
        .input-row textarea::placeholder {
          color: rgba(243,236,224,0.4);
          font-style: italic;
        }
        .input-row textarea:focus {
          border-color: var(--accent);
        }
        .send-btn {
          appearance: none;
          width: 46px;
          height: 46px;
          border: 1px solid var(--accent);
          background: var(--accent);
          color: var(--paper);
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          transition: transform .15s, background .2s;
        }
        .send-btn:hover { transform: translateY(-1px); }
        .send-btn:disabled {
          background: rgba(243,236,224,0.1);
          border-color: rgba(243,236,224,0.2);
          color: rgba(243,236,224,0.3);
          cursor: not-allowed;
        }

        /* ── Info cards ── */
        .liner {
          margin-top: 50px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 28px;
        }
        .liner-card {
          border: 1px solid var(--ink);
          background: var(--paper);
          padding: 22px;
          border-radius: 3px;
          box-shadow: 4px 5px 0 var(--paper-edge);
        }
        .liner-card h4 {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin: 0 0 12px;
          font-weight: 500;
        }
        .liner-card p {
          color: var(--ink-2);
          font-size: 15.5px;
          margin: 0 0 8px;
          line-height: 1.55;
        }
        .liner-card ul {
          padding-left: 18px;
          margin: 0;
          color: var(--ink-2);
          font-size: 15.5px;
          line-height: 1.65;
        }
        .liner-quote {
          font-family: var(--serif);
          font-style: italic;
          font-size: 20px;
          line-height: 1.35;
          color: var(--ink);
        }

        @media (max-width: 980px) {
          .liner { grid-template-columns: 1fr; }
          .msg { max-width: 92%; }
          .who span { display: none; }
        }
      `}</style>
    </div>
  );
}
