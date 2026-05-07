"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";

const SAMPLE_DREAMS = [
  { text: "i'm not going to learn french before turkey", back: "merci, duolingo. it's been 743 days. you can stop emailing me now.", author: "elena", date: "tue", color: "#faf3df", rotate: -3, pin: "rose" as const },
  { text: "the cafe will stay an idea. it's a good idea. it's just not mine.", back: "imaginary location: corner of nostalgia & 4th. closing forever.", author: "j.", date: "mar 4", color: "#f1e4d2", rotate: 4, pin: "teal" as const },
  { text: "i will never be the friend who plans the trip", back: "i AM the friend who shows up with snacks. that's a contribution.", author: "anon", date: "—", color: "#f5e8d0", rotate: -6, pin: "butter" as const },
  { text: "we are not getting back together. that's the dream i'm releasing.", back: "good luck out there. (i mean it. mostly. seventy percent.)", author: "m.", date: "apr", color: "#f8efd9", rotate: 5, pin: "plum" as const },
  { text: "novel. chapter 3. seven years. she can rest now.", back: "the protagonist was always going to be okay. that was the problem.", author: "r.s.", date: "—", color: "#f1e4d2", rotate: -2, pin: "rose" as const },
  { text: "i am NOT a person who runs marathons", back: "i AM a person who walks to the bakery. that's a sport, in this economy.", author: "stranger", date: "sun", color: "#faf3df", rotate: 3, pin: "teal" as const },
  { text: "the houseplants. all of them. i give up.", back: "fern, you tried. i tried. neither of us tried hard enough.", author: "p.", date: "fri", color: "#f4e2d4", rotate: -4, pin: "butter" as const },
  { text: "becoming someone who 'just goes for a run in the morning'", back: "i am someone who lies very still in the morning. and that's beautiful.", author: "anon", date: "—", color: "#f8efd9", rotate: 6, pin: "rose" as const },
  { text: "i'm not gonna read all those books on the shelf", back: "the books are decor. they have always been decor. i am at peace.", author: "k.", date: "wed", color: "#faf3df", rotate: -3, pin: "plum" as const },
];

type PinColor = "rose" | "teal" | "butter" | "plum";

const pinClasses: Record<PinColor, string> = {
  rose: "pin",
  teal: "pin pin-teal",
  butter: "pin pin-butter",
  plum: "pin pin-plum",
};

function fireConfetti(originX: number, originY: number) {
  const colors = ["var(--rose)", "var(--teal)", "var(--butter)", "var(--plum)", "var(--moss)"];
  const shapes = ["✦", "✧", "✶", "♡", "✿"];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = Math.random() > 0.4 ? shapes[i % shapes.length] : "";
    const size = 10 + Math.random() * 22;
    el.style.left = originX + "px";
    el.style.top = originY + "px";
    el.style.fontSize = size + "px";
    el.style.color = colors[i % colors.length];
    el.style.setProperty("--dx", (Math.random() - 0.5) * 600 + "px");
    el.style.setProperty("--dr", (Math.random() * 1080 - 540) + "deg");
    el.style.setProperty("--dur", (2.2 + Math.random() * 2) + "s");
    if (!el.textContent) {
      el.style.width = (4 + Math.random() * 6) + "px";
      el.style.height = (8 + Math.random() * 10) + "px";
      el.style.background = colors[i % colors.length];
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
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
      className={dragging ? "" : "floaty"}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: dragging || flipped ? 30 : 1,
        cursor: dragging ? "grabbing" : "grab",
        ["--rot" as string]: `${dream.rotate}deg`,
        transform: dragging ? `rotate(${dream.rotate * 1.5}deg) scale(1.04)` : undefined,
        transition: dragging ? "none" : "transform 0.3s ease",
        animationDelay: `${initial.delay}s`,
      }}
      onPointerDown={onPointerDown}
    >
      <div
        className={`card-flip-container paper ${flipped ? "flipped" : ""}`}
        style={{
          width: 230,
          minHeight: 150,
          padding: "26px 22px 18px",
          background: dream.color,
          userSelect: "none",
          position: "relative",
          boxShadow: dragging
            ? "0 30px 60px -10px rgba(34,30,24,0.35), 0 8px 20px rgba(34,30,24,0.18)"
            : undefined,
        }}
      >
        <div className="card-flip-inner" style={{ minHeight: 120, transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}>
          <div className={pinClasses[dream.pin]} style={{ top: -18, left: "50%", transform: "translateX(-50%)" }} />
          <div className="card-face" style={{ position: "relative" }}>
            <p className="hand" style={{ fontSize: 22, lineHeight: 1.3, color: "var(--ink-soft)", margin: 0, marginBottom: 14 }}>
              {dream.text}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 10, color: "var(--ink-faded)", borderTop: "1px dashed var(--ink-faded)", paddingTop: 8, opacity: 0.8 }}>
              <span>— {dream.author}</span>
              <span>{dream.date}</span>
            </div>
            <div className="typewriter" style={{ position: "absolute", bottom: -16, right: 4, fontSize: 9, color: "var(--ink-faded)", opacity: 0.6 }}>
              click to flip
            </div>
          </div>
          <div className="card-face card-back" style={{ background: dream.color, padding: "26px 22px 18px" }}>
            <p className="serif" style={{ fontSize: 17, fontStyle: "italic", lineHeight: 1.4, color: "var(--ink-soft)", margin: 0 }}>
              {dream.back}
            </p>
            <div className="typewriter" style={{ position: "absolute", bottom: 8, right: 14, fontSize: 9, color: "var(--ink-faded)", opacity: 0.7 }}>
              p.s. ✦
            </div>
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
    <div className="hero-collage" style={{ position: "relative", height: 660, margin: "0 auto", maxWidth: 1280, marginTop: 30 }}>
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(122,107,88,0.08) 1px, transparent 1.5px)",
          backgroundSize: "32px 32px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      {SAMPLE_DREAMS.map((d, i) => (
        <FloatingNote key={i} dream={d} initial={positions[i]} />
      ))}

      <div className="floaty wiggle" style={{ position: "absolute", left: "32%", top: "6%", animationDelay: "1.5s", ["--rot" as string]: "12deg" }}>
        <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 14, transform: "rotate(12deg)" }}>★ NEW ★</span>
      </div>
      <div className="floaty wiggle" style={{ position: "absolute", right: "6%", top: "2%", animationDelay: "0.7s", ["--rot" as string]: "-8deg" }}>
        <span className="sticker" style={{ background: "var(--teal)", color: "var(--paper-light)", fontSize: 14, transform: "rotate(-8deg)" }}>BYE!!</span>
      </div>
      <div className="floaty wiggle" style={{ position: "absolute", left: "44%", bottom: "6%", animationDelay: "2s", ["--rot" as string]: "20deg" }}>
        <span className="sticker" style={{ background: "var(--butter)", color: "var(--ink)", fontSize: 14, transform: "rotate(20deg)" }}>FREE!</span>
      </div>
      <div className="floaty wiggle" style={{ position: "absolute", right: "30%", top: "70%", animationDelay: "1.1s", ["--rot" as string]: "-14deg" }}>
        <span className="sticker" style={{ background: "var(--ink)", color: "var(--butter)", fontSize: 14, transform: "rotate(-14deg)" }}>ZINE 03</span>
      </div>

      <div className="wiggle" style={{ position: "absolute", left: "36%", top: "32%", transform: "rotate(8deg)", cursor: "pointer", zIndex: 4 }}>
        <span className="stamp" style={{ color: "var(--teal)", transform: "rotate(0deg)" }}>released · with love</span>
      </div>

      <p className="hand" style={{ position: "absolute", left: "2%", bottom: "2%", fontSize: 22, color: "var(--ink-soft)", transform: "rotate(-4deg)", maxWidth: 200, pointerEvents: "none" }}>
        drag them. flip them. the wall is yours.
      </p>
    </div>
  );
}

function ReleaseBox() {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [stamping, setStamping] = useState(false);
  const [released, setReleased] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const release = async () => {
    if (!text.trim()) return;
    const rect = boxRef.current?.getBoundingClientRect();
    setStamping(true);

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

    setTimeout(() => {
      if (rect) fireConfetti(rect.left + rect.width / 2, rect.top + 60);
      setReleased(true);
      setTimeout(() => {
        setReleased(false);
        setStamping(false);
        setText("");
        setAuthor("");
      }, 2200);
    }, 350);
  };

  return (
    <div
      ref={boxRef}
      className="paper"
      style={{
        padding: "32px 32px 26px",
        background: "#faf3df",
        position: "relative",
        transform: "rotate(-0.8deg)",
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      <div className="tape tape-rose" style={{ top: -12, left: 30, transform: "rotate(-4deg)" }} />
      <div className="tape tape-teal" style={{ top: -12, right: 30, transform: "rotate(4deg)" }} />
      <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
        ✦ try it now · no signup ✦
      </div>
      <h3 className="serif" style={{ fontSize: 30, margin: 0, marginBottom: 18, fontWeight: 400, fontStyle: "italic" }}>
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
          background: "var(--paper-light)",
          border: "1px dashed var(--ink-faded)",
          padding: "14px 16px",
          fontSize: 22,
          color: "var(--ink-soft)",
          fontFamily: "'Caveat', cursive",
          outline: "none",
          resize: "vertical",
          borderRadius: 2,
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
            background: "var(--paper-light)",
            border: "1px dashed var(--ink-faded)",
            padding: "10px 14px",
            fontSize: 13,
            outline: "none",
            flex: "1 1 160px",
          }}
        />
        <button
          className="btn-paper"
          onClick={release}
          disabled={!text.trim() || released}
          style={{ opacity: !text.trim() ? 0.4 : 1 }}
        >
          {released ? "released ✦" : stamping ? "stamping..." : "let it go"}
          <span style={{ fontSize: 18 }}>{released ? "✦" : "↳"}</span>
        </button>
      </div>
      {stamping && (
        <div className="slam" style={{ position: "absolute", top: 50, right: 50, ["--rot" as string]: "-12deg", pointerEvents: "none" }}>
          <span className="stamp" style={{ color: "var(--rose)", transform: "rotate(-12deg)", fontSize: 16, padding: "8px 18px" }}>RELEASED</span>
        </div>
      )}
    </div>
  );
}

export default function Hero() {
  return (
    <section style={{ padding: "20px clamp(16px, 4vw, 48px) 30px", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", top: 60, left: -40, width: 180, height: 180, background: "var(--butter)", borderRadius: "50%", opacity: 0.6, zIndex: 0 }} />
      <div aria-hidden="true" style={{ position: "absolute", top: 200, right: -60, width: 220, height: 220, background: "var(--teal)", opacity: 0.55, zIndex: 0, transform: "rotate(15deg)" }} />
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", bottom: 40, left: "20%", width: 140, height: 140, opacity: 0.45, zIndex: 0, transform: "rotate(-8deg)" }} />
      <div aria-hidden="true" className="checker" style={{ position: "absolute", top: 30, right: "10%", width: 120, height: 60, opacity: 0.35, zIndex: 0, transform: "rotate(-6deg)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <span className="sticker" style={{ fontSize: 12, padding: "8px 14px" }}>EST · 2025</span>
          <span className="sticker" style={{ fontSize: 12, padding: "8px 14px", background: "var(--teal)", color: "var(--paper-light)", transform: "rotate(2deg)" }}>UNSUBSCRIBE FROM THE HUSTLE</span>
          <span className="sticker" style={{ fontSize: 12, padding: "8px 14px", background: "var(--rose)", color: "var(--paper-light)", transform: "rotate(-4deg)" }}>VOL · 03</span>
        </div>
        <h1
          className="serif"
          style={{
            fontSize: "clamp(56px, 11vw, 160px)",
            lineHeight: 0.9,
            margin: 0,
            color: "var(--ink)",
            fontWeight: 400,
          }}
        >
          Quit your<br />
          <em style={{ fontStyle: "italic" }}>dreams.</em>
        </h1>
        <p style={{ fontSize: 20, color: "var(--ink-soft)", maxWidth: 620, margin: "30px auto 0", lineHeight: 1.5 }}>
          Most of them weren&apos;t going great anyway. A graceful exit for
          the marathon you&apos;ll never run, the novel you&apos;ll never finish,
          and the ex you absolutely should not text.
        </p>
      </div>

      <HeroCollage />

      <div style={{ maxWidth: 1180, margin: "20px auto 0", position: "relative", zIndex: 2 }}>
        <ReleaseBox />
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 36, flexWrap: "wrap", position: "relative", zIndex: 2 }}>
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
