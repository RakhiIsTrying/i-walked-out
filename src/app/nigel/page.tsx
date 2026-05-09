"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starters = [
  { label: "a small one", q: "i'm tired of pretending i still want to be a morning person." },
  { label: "a heavy one", q: "i think i need to stop wanting to be a founder." },
  { label: "something silly", q: "show me something silly someone buried." },
  { label: "wait, how does this work", q: "how does this work, exactly?" },
  { label: "show me the oldest", q: "what's the oldest dream you have down there?" },
  { label: "what're you doing rn", q: "what are you doing right now?" },
];

const NIGEL_DOINGS = [
  "reorganising the dream-jar shelf · alphabetising worms",
  "trying to remember where the kettle is · feeling its absence",
  "rereading a buried dream from 2025 · nodding slowly",
  "watering one stubborn root · waiting",
  "patching the burrow ceiling · with what, unclear",
  "writing labels in tiny handwriting · running out of pencil",
];

const NIGEL_STATUSES = [
  "putting the kettle on",
  "listening",
  "tidying up a worm",
  "thinking about your message",
  "stretching · just woke up",
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

function getTimeString() {
  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  const moods = ["light rain above", "wind in the floorboards", "soft afternoon", "dust falling", "quiet upstairs", "someone humming up there"];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  return `${months[now.getMonth()]} ${now.getDate()} · ${h12}:${m}${ampm} · ${mood}`;
}

export default function NigelPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("putting the kettle on");
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const todayDoing = useMemo(() => NIGEL_DOINGS[Math.floor(Math.random() * NIGEL_DOINGS.length)], []);
  const timeString = useMemo(() => getTimeString(), []);

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
    ta.style.height = "50px";
    ta.style.height = Math.min(160, ta.scrollHeight) + "px";
  }, []);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "50px";

    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    setStatusText("reading your note · slowly");
    persistMsg("user", msg);

    try {
      const res = await fetch("/api/nigel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: newMessages.slice(-10) }),
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
                  const { text: t } = JSON.parse(line.slice(6));
                  reply += t;
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
        } else {
          persistMsg("assistant", reply);
        }
      } else if (res.ok) {
        const { reply } = await res.json();
        setMessages([...newMessages, { role: "assistant", content: reply }]);
        if (reply) persistMsg("assistant", reply);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "i got a little lost there. try again?" }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "something went quiet. try again in a sec." }]);
    } finally {
      setLoading(false);
      setStatusText(NIGEL_STATUSES[Math.floor(Math.random() * NIGEL_STATUSES.length)]);
      taRef.current?.focus();
    }
  }

  const hasMessages = messages.length > 0 || !hydrated;

  return (
    <div className="page-in nigel-page" style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px 40px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="eyebrow">A small visit · 2 minutes · tea optional</div>
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
        Come in.{" "}
        <em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--accent)", whiteSpace: "nowrap" }}>
          Sit down.
        </em>{" "}
        Tell Nigel what you&apos;ve been carrying.
      </h1>
      <p style={{ maxWidth: "56ch", color: "var(--ink-2)", fontSize: 19, lineHeight: 1.55, marginBottom: 0 }}>
        Nigel lives just under the floorboards of this site. They&apos;re not a chatbot — they&apos;re a
        small creature with a name longer than they are. They listen, slowly. They write you a note back.
      </p>

      <span className="scribble-r-deco">&#8600; pull up a chair</span>

      {/* ── The Room ── */}
      <div className="room">
        <div className="room-hd">
          <div className="nigel-card">
            <div className="nigel-portrait" aria-hidden="true">
              <span className="specs" />
              <span className="scarf" />
            </div>
            <div>
              <div className="nigel-name"><span className="full">Nigel B. Pemberton</span></div>
              <div className="nigel-bio">keeper of buried dreams · est. always</div>
            </div>
          </div>
          <div className="room-status">
            <span>{statusText}</span>
            <span className="small">{timeString}</span>
          </div>
          <div className="room-doings">
            <span className="lab">today</span>
            <span>{todayDoing}</span>
          </div>
        </div>

        {/* Thread */}
        <div className="thread" ref={threadRef}>
          {!hasMessages && (
            <>
              <div className="msg-row">
                <div className="av-mini" aria-hidden="true" />
                <div className="note">
                  <span className="from">Nigel</span>
                  oh. you came down. <em>good.</em> most people walk over me without noticing.
                  <span className="stamp">~ N</span>
                </div>
              </div>
              <div className="msg-row">
                <div className="av-mini" aria-hidden="true" />
                <div className="note">
                  <span className="from">Nigel</span>
                  tell me a thing you&apos;ve been carrying. doesn&apos;t have to be big.
                  i&apos;ll bury it for you.
                  <span className="stamp">~ N</span>
                </div>
              </div>
            </>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role === "user" ? "me" : ""}`}>
              <div className="av-mini" aria-hidden="true" />
              <div className="note">
                <span className="from">{msg.role === "user" ? "You" : "Nigel"}</span>
                {msg.content}
                <span className="stamp">{msg.role === "user" ? "— you" : "~ N"}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row">
              <div className="av-mini" aria-hidden="true" />
              <div className="note">
                <span className="from">Nigel</span>
                <span className="typing">
                  <span className="typing-pen" /> writing back{" "}
                  <span className="typing-dots"><span /><span /><span /></span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Compose */}
        <div className="compose">
          <span className="compose-label">&#8627; pass nigel a note —</span>
          {!hasMessages && (
            <div className="starters">
              {starters.map((s) => (
                <button key={s.label} className="starter" onClick={() => send(s.q)}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="compose-row">
            <div className="you-av" aria-hidden="true"><span className="smile" /></div>
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="write something. anything. spelling doesn't matter down here."
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="slip note under the door"
            >
              <span>slip it under</span><span className="arrow">&#8617;</span>
            </button>
          </div>
        </div>

        <span className="doodle-worm">&#8627; a worm just wandered through. nigel waved.</span>
      </div>

      <style>{`
        :root { --hand: 'Caveat', 'Marker Felt', cursive; }

        /* ── The Room ── */
        .room {
          margin-top: 28px;
          position: relative;
          background:
            radial-gradient(ellipse at 30% 0%, rgba(200,85,61,0.06) 0%, transparent 50%),
            repeating-linear-gradient(180deg, transparent 0 38px, rgba(60,40,20,0.04) 38px 39px),
            var(--paper);
          border: 1.5px solid var(--ink);
          border-radius: 4px;
          box-shadow: 8px 8px 0 var(--paper-edge);
          padding: 0;
          overflow: hidden;
        }
        .room::before {
          content: "";
          position: absolute;
          top: 18px; right: 38px;
          width: 64px; height: 64px;
          border-radius: 50%;
          border: 2.5px solid rgba(120, 75, 45, 0.18);
          transform: rotate(-12deg);
          pointer-events: none;
        }

        /* ── Header strip ── */
        .room-hd {
          padding: 16px 24px 14px;
          border-bottom: 1px dashed var(--ink-3);
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 16px;
          background: rgba(60,40,20,0.03);
        }
        .nigel-card { display: flex; align-items: center; gap: 12px; }
        .nigel-portrait {
          width: 56px; height: 56px;
          border-radius: 50% 50% 50% 50% / 58% 58% 42% 42%;
          background: radial-gradient(circle at 32% 32%, #8a6a4a 0% 28%, #5a4530 30% 60%, #3a2c1c 62% 100%);
          border: 1.5px solid var(--ink);
          position: relative;
          flex-shrink: 0;
          box-shadow: 2px 3px 0 var(--paper-edge);
        }
        .nigel-portrait::before, .nigel-portrait::after {
          content: ""; position: absolute; top: 18px;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--paper);
          box-shadow: 0 0 0 1.5px var(--ink);
        }
        .nigel-portrait::before { left: 14px; animation: blink 5.7s infinite; }
        .nigel-portrait::after { right: 14px; animation: blink 5.7s infinite 0.05s; }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          97%, 99% { transform: scaleY(0.1); }
        }
        .nigel-portrait .specs {
          position: absolute;
          top: 16px; left: 8px; right: 8px;
          height: 12px;
          border-top: 1.5px solid var(--ink);
          pointer-events: none;
        }
        .nigel-portrait .specs::before, .nigel-portrait .specs::after {
          content: ""; position: absolute; top: 0;
          width: 12px; height: 12px;
          border: 1.5px solid var(--ink);
          border-radius: 50%;
          background: rgba(243,236,224,0.35);
        }
        .nigel-portrait .specs::before { left: 1px; }
        .nigel-portrait .specs::after { right: 1px; }
        .nigel-portrait .scarf {
          position: absolute;
          bottom: -3px; left: 50%; transform: translateX(-50%);
          width: 16px; height: 8px;
          background: var(--accent);
          clip-path: polygon(0 0, 100% 0, 80% 100%, 50% 60%, 20% 100%);
          border: 1px solid var(--ink);
          border-top: none;
        }
        .nigel-name {
          font-family: var(--serif);
          font-style: italic;
          font-size: 22px;
          line-height: 1;
          color: var(--ink);
        }
        .nigel-name .full { font-style: normal; font-weight: 500; }
        .nigel-bio {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-top: 4px;
        }
        .room-status {
          text-align: center;
          font-family: var(--hand);
          font-size: 22px;
          color: var(--accent);
          line-height: 1;
          transform: rotate(-2deg);
        }
        .room-status .small {
          display: block;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-3);
          transform: rotate(2deg);
          margin-top: 2px;
        }
        .room-doings {
          text-align: right;
          font-family: var(--serif);
          font-style: italic;
          font-size: 14px;
          color: var(--ink-2);
          line-height: 1.3;
        }
        .room-doings .lab {
          display: block;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-style: normal;
          margin-bottom: 2px;
        }

        /* ── Thread ── */
        .thread {
          padding: 36px 36px 12px;
          display: flex; flex-direction: column; gap: 26px;
          min-height: 360px;
          max-height: 560px;
          overflow-y: auto;
          scroll-behavior: smooth;
          position: relative;
        }
        .thread::-webkit-scrollbar { width: 6px; }
        .thread::-webkit-scrollbar-thumb { background: var(--paper-edge); border-radius: 3px; }

        /* Paper note bubble */
        .note {
          position: relative;
          max-width: 78%;
          padding: 14px 18px 16px;
          background: var(--note-1);
          border: 1px solid var(--ink);
          box-shadow: 3px 4px 0 var(--paper-edge);
          font-family: var(--serif);
          font-size: 18px;
          line-height: 1.5;
          color: var(--ink);
          transform: rotate(-0.6deg);
          align-self: flex-start;
        }
        .note em { color: var(--accent); font-style: italic; }
        .note .from {
          position: absolute;
          top: -10px; left: 14px;
          background: var(--paper);
          padding: 0 8px;
          font-family: var(--mono);
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          border: 1px solid var(--ink-3);
          border-radius: 999px;
        }
        .note .stamp {
          position: absolute;
          bottom: -10px; right: -4px;
          font-family: var(--hand);
          font-size: 13px;
          color: var(--ink-3);
          transform: rotate(-3deg);
        }
        .note::before {
          content: "";
          position: absolute;
          top: -8px; right: 24px;
          width: 32px; height: 14px;
          background: rgba(220, 200, 160, 0.55);
          border: 1px solid rgba(60,40,20,0.16);
          transform: rotate(4deg);
        }

        /* Message rows */
        .msg-row { display: flex; align-items: flex-start; gap: 12px; }
        .msg-row.me { flex-direction: row-reverse; }
        .msg-row.me .note {
          align-self: flex-end;
          background: var(--paper);
          transform: rotate(0.7deg);
          margin-left: auto;
        }
        .msg-row.me .from { left: auto; right: 14px; color: var(--accent); border-color: var(--accent); }
        .msg-row.me .note::before { right: auto; left: 24px; transform: rotate(-4deg); }

        .msg-row .av-mini {
          width: 32px; height: 32px; flex-shrink: 0;
          border-radius: 50% 50% 50% 50% / 58% 58% 42% 42%;
          background: radial-gradient(circle at 32% 32%, #8a6a4a 0% 28%, #5a4530 30% 60%, #3a2c1c 62% 100%);
          border: 1px solid var(--ink);
          position: relative;
          margin-top: 6px;
        }
        .msg-row .av-mini::before, .msg-row .av-mini::after {
          content: ""; position: absolute; top: 11px;
          width: 4px; height: 4px; border-radius: 50%; background: var(--paper);
        }
        .msg-row .av-mini::before { left: 7px; }
        .msg-row .av-mini::after { right: 7px; }
        .msg-row.me .av-mini {
          background: var(--paper);
          border-color: var(--ink);
        }
        .msg-row.me .av-mini::before, .msg-row.me .av-mini::after { background: var(--ink); }

        /* Alternating note tints */
        .thread .msg-row:nth-child(3n+1) .note { background: var(--note-1); }
        .thread .msg-row:nth-child(3n+2) .note { background: var(--note-3); transform: rotate(0.4deg); }
        .thread .msg-row:nth-child(3n+3) .note { background: var(--note-4); transform: rotate(-0.3deg); }
        .thread .msg-row.me .note { background: var(--paper) !important; transform: rotate(0.5deg) !important; }

        /* ── Typing ── */
        .typing {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--hand);
          font-size: 22px;
          color: var(--ink-3);
        }
        .typing-pen {
          display: inline-block;
          width: 14px; height: 2px; background: var(--ink);
          transform-origin: left;
          animation: scribble 1.4s infinite;
        }
        @keyframes scribble {
          0%, 100% { transform: rotate(-12deg) translateX(0); }
          50% { transform: rotate(8deg) translateX(2px); }
        }
        .typing-dots span {
          display: inline-block;
          width: 5px; height: 5px; border-radius: 50%; background: var(--ink-3);
          margin-right: 2px;
          animation: tdot 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes tdot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }

        /* ── Compose dock ── */
        .compose {
          border-top: 1px dashed var(--ink-3);
          padding: 18px 28px 22px;
          background:
            repeating-linear-gradient(180deg, transparent 0 28px, rgba(60,40,20,0.06) 28px 29px),
            rgba(255,255,255,0.4);
          position: relative;
        }
        .compose::before {
          content: "";
          position: absolute;
          left: 56px; top: 0; bottom: 0;
          width: 1px;
          background: rgba(200, 85, 61, 0.35);
        }
        .compose-label {
          font-family: var(--hand);
          font-size: 22px;
          color: var(--accent);
          line-height: 1;
          margin-bottom: 8px;
          transform: rotate(-1deg);
          display: inline-block;
        }
        .starters {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;
        }
        .starter {
          appearance: none;
          border: 1.5px solid var(--ink);
          background: var(--note-1);
          color: var(--ink);
          padding: 6px 12px 7px;
          border-radius: 999px;
          font-family: var(--serif);
          font-style: italic;
          font-size: 14px;
          cursor: pointer;
          transition: transform .15s, background .2s;
          box-shadow: 2px 2px 0 var(--paper-edge);
        }
        .starter:nth-child(2n) { background: var(--note-3); transform: rotate(-1deg); }
        .starter:nth-child(3n) { background: var(--note-4); transform: rotate(1deg); }
        .starter:hover {
          background: var(--accent);
          color: var(--paper);
          transform: translateY(-2px) rotate(0deg);
        }
        .compose-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: end;
        }
        .compose-row .you-av {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--paper);
          border: 1.5px solid var(--ink);
          box-shadow: 2px 2px 0 var(--paper-edge);
          position: relative;
          margin-bottom: 4px;
        }
        .compose-row .you-av::before, .compose-row .you-av::after {
          content: ""; position: absolute; top: 13px;
          width: 4px; height: 4px; border-radius: 50%; background: var(--ink);
        }
        .compose-row .you-av::before { left: 11px; }
        .compose-row .you-av::after { right: 11px; }
        .compose-row .you-av .smile {
          position: absolute; bottom: 9px; left: 50%; transform: translateX(-50%);
          width: 12px; height: 6px;
          border-bottom: 2px solid var(--ink);
          border-radius: 0 0 12px 12px;
        }
        .compose-row textarea {
          appearance: none;
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid var(--ink);
          padding: 12px 4px;
          color: var(--ink);
          font-family: var(--serif);
          font-size: 19px;
          line-height: 1.45;
          resize: none;
          min-height: 50px;
          max-height: 160px;
          outline: none;
        }
        .compose-row textarea::placeholder {
          color: var(--ink-3);
          font-style: italic;
        }
        .compose-row textarea:focus {
          border-bottom-color: var(--accent);
        }
        .send-btn {
          appearance: none;
          border: 1.5px solid var(--ink);
          background: var(--accent);
          color: var(--paper);
          padding: 10px 16px;
          border-radius: 999px;
          font-family: var(--hand);
          font-size: 22px;
          cursor: pointer;
          box-shadow: 3px 3px 0 var(--ink);
          transition: transform .15s, box-shadow .15s;
          line-height: 1;
          display: flex; align-items: center; gap: 6px;
        }
        .send-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0 var(--ink);
        }
        .send-btn:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0 var(--ink);
        }
        .send-btn:disabled {
          background: var(--paper-edge);
          color: var(--ink-3);
          box-shadow: 2px 2px 0 var(--paper-edge);
          cursor: not-allowed;
          transform: none;
        }
        .send-btn .arrow {
          font-family: var(--serif);
          font-size: 18px;
        }

        /* Decorations */
        .doodle-worm {
          position: absolute;
          bottom: 8px; left: 36px;
          font-family: var(--hand);
          font-size: 18px;
          color: var(--ink-3);
          transform: rotate(-3deg);
          pointer-events: none;
          z-index: 2;
        }
        .scribble-r-deco {
          position: relative;
          float: right;
          margin-top: -20px;
          font-family: var(--hand);
          font-size: 18px;
          color: var(--accent);
          transform: rotate(8deg);
          display: inline-block;
        }

        @media (max-width: 980px) {
          .room-hd { grid-template-columns: 1fr; gap: 8px; }
          .room-status, .room-doings { text-align: left; }
          .thread { padding: 24px 18px 8px; }
          .compose { padding: 16px 18px 18px; }
          .compose::before { display: none; }
          .note { max-width: 92%; }
          .scribble-r-deco { display: none; }
        }
        @media (max-width: 560px) {
          .nigel-page { padding: 40px 16px 32px !important; }
          .room-hd { padding: 14px 16px 12px; }
          .room-doings { display: none; }
          .nigel-portrait { width: 42px; height: 42px; }
          .nigel-portrait::before, .nigel-portrait::after { top: 14px; width: 5px; height: 5px; }
          .nigel-portrait::before { left: 10px; }
          .nigel-portrait::after { right: 10px; }
          .nigel-portrait .specs { top: 12px; }
          .nigel-portrait .specs::before, .nigel-portrait .specs::after { width: 10px; height: 10px; }
          .nigel-name { font-size: 18px; }
          .thread { padding: 20px 14px 8px; min-height: 280px; max-height: 420px; gap: 22px; }
          .note { font-size: 16px; padding: 12px 14px 14px; }
          .note .from { font-size: 8px; top: -9px; }
          .note .stamp { font-size: 11px; }
          .note::before { width: 26px; height: 11px; }
          .msg-row .av-mini { width: 26px; height: 26px; }
          .msg-row .av-mini::before, .msg-row .av-mini::after { top: 9px; width: 3px; height: 3px; }
          .msg-row .av-mini::before { left: 6px; }
          .msg-row .av-mini::after { right: 6px; }
          .compose { padding: 14px 14px 16px; }
          .compose-label { font-size: 18px; }
          .compose-row { grid-template-columns: 1fr auto; gap: 10px; }
          .compose-row .you-av { display: none; }
          .compose-row textarea { font-size: 16px; min-height: 44px; }
          .send-btn { padding: 8px 14px; font-size: 18px; }
          .send-btn span:first-child { display: none; }
          .send-btn .arrow { font-size: 20px; }
          .starter { font-size: 12px; padding: 5px 10px; }
          .doodle-worm { font-size: 14px; left: 14px; bottom: 4px; }
        }
      `}</style>
    </div>
  );
}
