"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";

const SAMPLE_DREAMS = [
  { text: "i'm not going to learn french before turkey", back: "merci, duolingo. it's been 743 days. you can stop emailing me now.", author: "elena", date: "tue", color: "#faf3df" },
  { text: "the cafe will stay an idea. it's a good idea. it's just not mine.", back: "imaginary location: corner of nostalgia & 4th. closing forever.", author: "j.", date: "mar 4", color: "#f1e4d2" },
  { text: "i will never be the friend who plans the trip", back: "i AM the friend who shows up with snacks. that's a contribution.", author: "anon", date: "—", color: "#f5e8d0" },
  { text: "we are not getting back together. that's the dream i'm releasing.", back: "good luck out there. (i mean it. mostly. seventy percent.)", author: "m.", date: "apr", color: "#f8efd9" },
  { text: "novel. chapter 3. seven years. she can rest now.", back: "the protagonist was always going to be okay. that was the problem.", author: "r.s.", date: "—", color: "#f1e4d2" },
  { text: "i am NOT a person who runs marathons", back: "i AM a person who walks to the bakery. that's a sport, in this economy.", author: "stranger", date: "sun", color: "#faf3df" },
  { text: "the houseplants. all of them. i give up.", back: "fern, you tried. i tried. neither of us tried hard enough.", author: "p.", date: "fri", color: "#f4e2d4" },
  { text: "becoming someone who 'just goes for a run in the morning'", back: "i am someone who lies very still in the morning. and that's beautiful.", author: "anon", date: "—", color: "#f8efd9" },
  { text: "i'm not gonna read all those books on the shelf", back: "the books are decor. they have always been decor. i am at peace.", author: "k.", date: "wed", color: "#faf3df" },
];

function fireConfetti(originX: number, originY: number) {
  const colors = ["var(--rose)", "var(--teal)", "var(--butter)"];
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

function FloatingNote({ dream, initial }: {
  dream: typeof SAMPLE_DREAMS[number];
  initial: { x: number; y: number; delay: number };
}) {
  const [pos, setPos] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0, moved: false });

  const onPointerMove = useCallback((e: PointerEvent) => {
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) startRef.current.moved = true;
    setPos({ ...pos, x: startRef.current.ox + dx, y: startRef.current.oy + dy });
  }, [pos]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
    if (!startRef.current.moved) setFlipped((f) => !f);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: dragging || flipped ? 30 : 1,
        cursor: dragging ? "grabbing" : "grab",
        transform: dragging ? "scale(1.03)" : undefined,
        transition: dragging ? "none" : "transform 0.3s ease",
      }}
      onPointerDown={onPointerDown}
    >
      <div
        className={`card-flip-container paper ${flipped ? "flipped" : ""}`}
        style={{
          width: 230,
          minHeight: 150,
          padding: "24px 22px 18px",
          background: dream.color,
          userSelect: "none",
          position: "relative",
          boxShadow: dragging
            ? "0 20px 40px -8px rgba(34,30,24,0.25), 0 6px 16px rgba(34,30,24,0.12)"
            : undefined,
        }}
      >
        <div className="card-flip-inner" style={{ minHeight: 120, transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}>
          <div className="card-face" style={{ position: "relative" }}>
            <p className="hand" style={{ fontSize: 22, lineHeight: 1.3, color: "var(--ink-soft)", margin: 0, marginBottom: 14 }}>
              {dream.text}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 10, color: "var(--ink-faded)", borderTop: "1px solid rgba(106, 112, 140, 0.2)", paddingTop: 8, opacity: 0.7 }}>
              <span>— {dream.author}</span>
              <span>{dream.date}</span>
            </div>
            <div className="typewriter" style={{ position: "absolute", bottom: -14, right: 4, fontSize: 9, color: "var(--ink-faded)", opacity: 0.5 }}>
              click to flip
            </div>
          </div>
          <div className="card-face card-back" style={{ background: dream.color, padding: "24px 22px 18px" }}>
            <p className="serif" style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.45, color: "var(--ink-soft)", margin: 0 }}>
              {dream.back}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCollage() {
  const positions = [
    { x: 40, y: 30, delay: 0 },
    { x: 480, y: 20, delay: 0.3 },
    { x: 920, y: 50, delay: 0.6 },
    { x: 30, y: 240, delay: 0.15 },
    { x: 500, y: 270, delay: 0.5 },
    { x: 980, y: 230, delay: 0.8 },
    { x: 80, y: 440, delay: 0.25 },
    { x: 530, y: 460, delay: 0.7 },
    { x: 970, y: 430, delay: 1 },
  ];

  return (
    <div className="hero-collage" style={{ position: "relative", height: 640, margin: "0 auto", maxWidth: 1280, marginTop: 40 }}>
      {SAMPLE_DREAMS.map((d, i) => (
        <FloatingNote key={i} dream={d} initial={positions[i]} />
      ))}
    </div>
  );
}

function ReleaseBox() {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [released, setReleased] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const release = async () => {
    if (!text.trim()) return;
    const rect = boxRef.current?.getBoundingClientRect();

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
      setAuthor("");
    }, 2200);
  };

  return (
    <div
      ref={boxRef}
      className="paper"
      style={{
        padding: "32px 32px 28px",
        background: "#faf3df",
        position: "relative",
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
        try it now — no signup
      </p>
      <h3 className="serif" style={{ fontSize: 28, margin: 0, marginBottom: 18, fontWeight: 400, fontStyle: "italic" }}>
        what are you letting go of today?
      </h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="something small. something heavy. anything you're done carrying."
        className="hand"
        disabled={released}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 22,
          color: "var(--ink-soft)",
          fontFamily: "'Caveat', cursive",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="signed (or blank for anon)"
          className="typewriter"
          disabled={released}
          style={{
            padding: "10px 14px",
            fontSize: 13,
            flex: "1 1 160px",
          }}
        />
        <button
          className="btn-paper"
          onClick={release}
          disabled={!text.trim() || released}
          style={{ opacity: !text.trim() ? 0.4 : 1 }}
        >
          {released ? "released" : "let it go"}
          <span style={{ fontSize: 16 }}>{released ? "" : "↳"}</span>
        </button>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section style={{ padding: "40px clamp(16px, 4vw, 48px) 30px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>EST 2025</span>
          <span style={{ color: "var(--ink-faded)", opacity: 0.3 }}>·</span>
          <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>VOL 03</span>
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(56px, 11vw, 140px)",
            lineHeight: 0.92,
            margin: 0,
            color: "var(--ink)",
            fontWeight: 400,
          }}
        >
          Quit your<br />
          <em style={{ fontStyle: "italic" }}>dreams.</em>
        </h1>
        <p style={{ fontSize: 18, color: "var(--ink-soft)", maxWidth: 560, margin: "28px auto 0", lineHeight: 1.6 }}>
          Most of them weren&apos;t going great anyway. A graceful exit for
          the marathon you&apos;ll never run, the novel you&apos;ll never finish,
          and the ex you absolutely should not text.
        </p>
      </div>

      <HeroCollage />

      <div style={{ maxWidth: 1180, margin: "20px auto 0", position: "relative", zIndex: 2 }}>
        <ReleaseBox />
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 40, flexWrap: "wrap", position: "relative", zIndex: 2 }}>
        <Link href="/feed" className="btn-chunky" style={{ textDecoration: "none" }}>
          Read the wall of regrets
        </Link>
        <Link href="/vibe" className="btn-chunky alt" style={{ textDecoration: "none" }}>
          I just want a vibe
        </Link>
      </div>
    </section>
  );
}
