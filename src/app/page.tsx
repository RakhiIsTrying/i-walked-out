"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

/* ──────────────────────────────────────────────
   Sample dreams for the hero collage
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   Confetti helper
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   FloatingNote — draggable + flippable
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   HeroCollage
   ────────────────────────────────────────────── */

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
    <div style={{ position: "relative", height: 660, margin: "0 auto", maxWidth: 1280, marginTop: 30 }}>
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

      {/* Stickers */}
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

/* ──────────────────────────────────────────────
   ReleaseBox
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   Hero
   ────────────────────────────────────────────── */

function Hero() {
  return (
    <section style={{ padding: "20px 48px 30px", position: "relative", overflow: "hidden" }}>
      {/* Background chaos */}
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

/* ──────────────────────────────────────────────
   Marquee
   ────────────────────────────────────────────── */

function Marquee() {
  const items = [
    "● 1,247 DREAMS QUIT TODAY · ZERO REFUNDS ISSUED",
    "✦ DREAMS FORMALLY FIRED",
    "● $0 SPENT ON THERAPY THIS WEEK",
    "✦ SMUG 42% · WEIRD ABOUT IT 21% · CRYING IN CVS 11%",
    "● AVG. TIME TO GIVE UP: 4.7 YEARS",
    "✦ HONESTLY, HUNGRY 8%",
  ];
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--butter)",
        padding: "20px 0",
        overflow: "hidden",
        position: "relative",
        transform: "rotate(-1.5deg)",
        margin: "60px -30px",
        boxShadow: "0 8px 0 var(--rose), 0 -8px 0 var(--teal)",
        borderTop: "3px solid var(--ink)",
        borderBottom: "3px solid var(--ink)",
      }}
    >
      <div className="marquee-track" style={{ display: "flex", gap: 60, whiteSpace: "nowrap", width: "max-content" }}>
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="display" style={{ fontSize: 24 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Features
   ────────────────────────────────────────────── */

const FEATURES = [
  { idx: 1, title: "THE WALL", desc: "Browse abandoned ideas from strangers. Anonymous, raw, real. No judgement — just ghosts of what could have been.", color: "var(--butter)", rotate: -1.5, accent: "var(--rose)", icon: "📌", href: "/feed", sticker: <span className="sticker" style={{ background: "var(--teal)", color: "var(--paper-light)", fontSize: 11, padding: "6px 12px", width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.05 }}>new</span> },
  { idx: 2, title: "PERSONALITY MIRROR", desc: "We gently build your portrait from what you release. What you let go of reveals more than what you hold.", color: "var(--paper-light)", rotate: 1, accent: "var(--teal)", icon: "🪞", href: "/personality" },
  { idx: 3, title: "STICKY DECISION", desc: "Stuck? Post it. Let kind strangers vote on what you should do next. You're not alone in this.", color: "var(--butter)", rotate: -0.5, accent: "var(--plum)", icon: "🗳️", href: "/sticky-decision", sticker: <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 11, padding: "6px 12px", width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", lineHeight: 1.05 }}>vote!</span> },
  { idx: 4, title: "VIBE IRL", desc: "Type a feeling. Get a place to visit, movie to watch, food to try, game to play. Let mood guide you.", color: "var(--paper-light)", rotate: 1.5, accent: "var(--butter)", icon: "🌀", href: "/vibe" },
];

function Features() {
  return (
    <section style={{ padding: "60px 48px 80px", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", top: 80, right: -50, width: 200, height: 200, opacity: 0.25, transform: "rotate(8deg)" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: 100, left: -40, width: 160, height: 160, background: "var(--teal)", opacity: 0.2, transform: "rotate(20deg)" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 12, padding: "8px 16px" }}>★ FOUR LITTLE ROOMS ★</span>
          <h2 className="display" style={{ fontSize: "clamp(44px, 7vw, 88px)", lineHeight: 0.9, margin: "20px 0 0", color: "var(--ink)", textShadow: "5px 5px 0 var(--butter)" }}>
            POKE AROUND.
          </h2>
          <h2 className="brush" style={{ fontSize: "clamp(48px, 8vw, 100px)", color: "var(--rose)", margin: 0, transform: "rotate(-2deg)", display: "inline-block", lineHeight: 0.9 }}>
            it&apos;s all yours.
          </h2>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", maxWidth: 520, margin: "24px auto 0", lineHeight: 1.5 }}>
            Every room is small, weird, and made with care. None of them ask much of you.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 36, paddingTop: 20 }}>
          {FEATURES.map((f) => (
            <Link key={f.idx} href={f.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                className="lift"
                style={{
                  padding: "30px 26px 26px",
                  background: f.color,
                  transform: `rotate(${f.rotate}deg)`,
                  cursor: "pointer",
                  position: "relative",
                  border: "2.5px solid var(--ink)",
                  boxShadow: "6px 6px 0 var(--ink)",
                  ["--hover-rot" as string]: `${f.rotate * 0.3}deg`,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 320,
                }}
              >
                <div style={{
                  position: "absolute", top: -18, left: 20,
                  background: f.accent, color: "var(--paper-light)",
                  border: "2.5px solid var(--ink)",
                  padding: "4px 14px",
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: 16, letterSpacing: "0.05em",
                }}>
                  №0{f.idx}
                </div>
                <div style={{ marginBottom: 16, fontSize: 48, lineHeight: 1 }}>{f.icon}</div>
                <h3 className="heavy" style={{ fontSize: 26, margin: 0, marginBottom: 12, lineHeight: 1, color: "var(--ink)" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.55, margin: 0, flex: 1 }}>
                  {f.desc}
                </p>
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px dashed var(--ink-faded)", paddingTop: 14 }}>
                  <span className="display" style={{ fontSize: 13, color: "var(--ink)" }}>OPEN →</span>
                  <span className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", letterSpacing: "0.15em" }}>FREE · ALWAYS</span>
                </div>
                {f.sticker && (
                  <div className="wiggle" style={{ position: "absolute", top: -22, right: -18, transform: `rotate(${f.rotate * -3}deg)`, zIndex: 6 }}>
                    {f.sticker}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   How It Works
   ────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    { num: "01", title: "RELEASE", body: "Tell us what you're letting go of. Two sentences. Thirty seconds.", color: "var(--rose)", emoji: "✉️" },
    { num: "02", title: "WE LISTEN", body: "Quietly, our AI builds a portrait of you from your releases. No quizzes.", color: "var(--teal)", emoji: "👂" },
    { num: "03", title: "WANDER", body: "Browse other people's released dreams. Realize how many strangers carry the same story.", color: "var(--butter)", emoji: "🌫️" },
    { num: "04", title: "MEET YOU", body: "Chat with a self shaped by your choices. Ask about regrets, about what's next.", color: "var(--plum)", emoji: "🪞" },
  ];

  return (
    <section style={{ padding: "80px 48px", background: "var(--ink)", color: "var(--paper-light)", margin: "60px 0", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.08 }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="sticker" style={{ background: "var(--butter)", color: "var(--ink)", fontSize: 12, padding: "8px 16px" }}>★ HOW IT WORKS ★</span>
          <h2 className="display" style={{ fontSize: "clamp(44px, 7.5vw, 96px)", lineHeight: 0.9, margin: "20px 0 0", color: "var(--butter)", textShadow: "5px 5px 0 var(--rose)" }}>
            FOUR SOFT
          </h2>
          <h2 className="brush" style={{ fontSize: "clamp(48px, 8.5vw, 110px)", color: "var(--teal)", margin: 0, transform: "rotate(-2deg)", display: "inline-block", lineHeight: 0.9 }}>
            steps.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
          {steps.map((s, i) => (
            <div key={i}>
              <div
                style={{
                  background: s.color,
                  border: "2.5px solid var(--paper-light)",
                  boxShadow: "6px 6px 0 var(--paper-light)",
                  padding: "26px 22px",
                  color: "var(--ink)",
                  transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 240,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <span className="display" style={{ fontSize: 36, color: "var(--ink)", lineHeight: 1 }}>{s.num}</span>
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{s.emoji}</span>
                </div>
                <h3 className="heavy" style={{ fontSize: 22, margin: 0, marginBottom: 10, color: "var(--ink)", lineHeight: 1 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0, flex: 1 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Infographics
   ────────────────────────────────────────────── */

function StatBlock({ num, label, sub, color, rotate = 0 }: { num: string; label: string; sub: string; color: string; rotate?: number }) {
  return (
    <div
      className="lift"
      style={{
        background: color,
        border: "2.5px solid var(--ink)",
        boxShadow: "6px 6px 0 var(--ink)",
        padding: "26px 18px",
        transform: `rotate(${rotate}deg)`,
        textAlign: "center",
        position: "relative",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div className="display" style={{ fontSize: "clamp(36px, 4.2vw, 60px)", color: "var(--ink)", lineHeight: 0.9, letterSpacing: "-0.03em", wordBreak: "break-word" }}>
        {num}
      </div>
      <div className="heavy" style={{ fontSize: 13, color: "var(--ink)", marginTop: 8 }}>{label}</div>
      {sub && <div className="hand" style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function ChunkyBar({ label, pct, color, emoji, animated }: { label: string; pct: number; color: string; emoji: string; animated: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", alignItems: "center", gap: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <span className="display" style={{ fontSize: 13, color: "var(--ink)", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ height: 32, border: "2.5px solid var(--ink)", background: "var(--paper-light)", position: "relative", boxShadow: "3px 3px 0 var(--ink)" }}>
        <div
          style={{
            width: `${animated ? pct : 0}%`,
            height: "100%",
            background: color,
            borderRight: "2.5px solid var(--ink)",
            backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,0.08) 6px 8px)",
            transition: "width 1.2s cubic-bezier(.2,.9,.3,1.1)",
          }}
        />
      </div>
      <div className="heavy" style={{ fontSize: 22, color: "var(--ink)", textAlign: "right" }}>{pct}%</div>
    </div>
  );
}

function Infographics() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setAnimated(true)),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dreams = [
    { label: "BECOMING A MORNING PERSON", pct: 87, color: "var(--rose)", emoji: "☀️" },
    { label: "LEARNING A LANGUAGE", pct: 73, color: "var(--teal)", emoji: "🗣️" },
    { label: "STARTING A CAFÉ", pct: 64, color: "var(--butter)", emoji: "☕" },
    { label: "FINISHING THE NOVEL", pct: 58, color: "var(--plum)", emoji: "📖" },
    { label: "RUNNING A MARATHON", pct: 41, color: "var(--rose)", emoji: "🏃" },
    { label: "GETTING BACK W/ THEM", pct: 29, color: "var(--teal)", emoji: "💔" },
  ];

  const moods = [
    { label: "lighter", pct: 0.42, color: "var(--rose)" },
    { label: "weird", pct: 0.21, color: "var(--teal)" },
    { label: "freed", pct: 0.18, color: "var(--butter)" },
    { label: "weepy", pct: 0.11, color: "var(--plum)" },
    { label: "honestly fine", pct: 0.08, color: "var(--ink)" },
  ];

  let pieAcc = 0;
  const pieSegs = moods.map((m) => {
    const start = pieAcc;
    pieAcc += m.pct;
    return { ...m, start, end: pieAcc };
  });

  const polar = (cx: number, cy: number, r: number, t: number): [number, number] => [
    cx + r * Math.cos(2 * Math.PI * t - Math.PI / 2),
    cy + r * Math.sin(2 * Math.PI * t - Math.PI / 2),
  ];

  const timeline = [
    { t: "00:00", label: "you have a dream", emoji: "💭", c: "var(--butter)" },
    { t: "07:23", label: "you avoid it", emoji: "🫥", c: "var(--rose)" },
    { t: "14:08", label: "guilt", emoji: "😬", c: "var(--plum)" },
    { t: "00:30", label: "you release it here", emoji: "✉️", c: "var(--teal)" },
    { t: "00:00", label: "you feel free", emoji: "🪩", c: "var(--butter)" },
  ];

  return (
    <section ref={ref} style={{ padding: "80px 48px", background: "var(--paper)", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" className="checker" style={{ position: "absolute", top: 30, right: -30, width: 160, height: 80, opacity: 0.25, transform: "rotate(8deg)" }} />
      <div aria-hidden="true" className="halftone" style={{ position: "absolute", bottom: 60, left: -40, width: 200, height: 200, opacity: 0.3, transform: "rotate(-12deg)" }} />

      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <span className="sticker" style={{ background: "var(--ink)", color: "var(--butter)", fontSize: 12, padding: "8px 16px" }}>★ THE NUMBERS ★</span>
          <h2 className="display" style={{ fontSize: "clamp(48px, 8vw, 100px)", lineHeight: 0.9, margin: "20px 0 0", color: "var(--ink)", textShadow: "6px 6px 0 var(--teal)" }}>
            DREAMS, BY<br />
            <span className="brush" style={{ color: "var(--rose)", textShadow: "none", display: "inline-block", transform: "rotate(-3deg)" }}>the numbers</span>
          </h2>
          <p className="hand" style={{ fontSize: 24, color: "var(--ink-soft)", marginTop: 40, transform: "rotate(-1deg)", display: "inline-block" }}>
            (we counted. you&apos;re not alone.)
          </p>
        </div>

        {/* Stat blocks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 28, marginBottom: 70 }}>
          <StatBlock num="12,847" label="DREAMS RELEASED" sub="and counting" color="var(--butter)" rotate={-2} />
          <StatBlock num="3.2s" label="AVG TIME TO LET GO" sub="faster than a tweet" color="var(--rose)" rotate={1.5} />
          <StatBlock num="89%" label="FELT LIGHTER AFTER" sub="science? vibes?" color="var(--teal)" rotate={-1} />
          <StatBlock num="0" label="JUDGEMENT" sub="not even a little" color="var(--plum)" rotate={2} />
        </div>

        {/* Bars + Pie */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 50, alignItems: "start" }}>
          <div style={{ background: "var(--paper-light)", border: "2.5px solid var(--ink)", boxShadow: "8px 8px 0 var(--ink)", padding: "30px 28px", position: "relative" }}>
            <div style={{ position: "absolute", top: -16, left: 24 }}>
              <span className="sticker" style={{ fontSize: 12, background: "var(--rose)", color: "var(--paper-light)", transform: "rotate(-4deg)" }}>TOP RELEASES</span>
            </div>
            <h3 className="heavy" style={{ fontSize: 24, margin: "10px 0 22px", color: "var(--ink)" }}>
              what y&apos;all are letting go of
            </h3>
            {dreams.map((d) => (
              <ChunkyBar key={d.label} {...d} animated={animated} />
            ))}
            <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", borderTop: "1px dashed var(--ink-faded)", paddingTop: 12, marginTop: 18, letterSpacing: "0.05em" }}>
              SAMPLE: 12,847 DREAMS · ROLLING 30 DAYS
            </p>
          </div>

          <div style={{ background: "var(--paper-light)", border: "2.5px solid var(--ink)", boxShadow: "8px 8px 0 var(--ink)", padding: "30px 28px", position: "relative" }}>
            <div style={{ position: "absolute", top: -16, left: 24 }}>
              <span className="sticker" style={{ fontSize: 12, background: "var(--teal)", color: "var(--paper-light)", transform: "rotate(3deg)" }}>HOW IT FELT</span>
            </div>
            <h3 className="heavy" style={{ fontSize: 24, margin: "10px 0 18px", color: "var(--ink)" }}>
              after letting go,<br />you said you felt:
            </h3>
            <svg viewBox="-10 -10 220 220" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
              {pieSegs.map((s, i) => {
                const [x1, y1] = polar(100, 100, 95, animated ? s.start : 0);
                const [x2, y2] = polar(100, 100, 95, animated ? s.end : 0);
                const large = s.end - s.start > 0.5 ? 1 : 0;
                const ang = (s.start + s.end) / 2;
                const [ox, oy] = polar(0, 0, 6, ang);
                return (
                  <path
                    key={i}
                    d={`M ${100 + ox} ${100 + oy} L ${x1 + ox} ${y1 + oy} A 95 95 0 ${large} 1 ${x2 + ox} ${y2 + oy} Z`}
                    fill={s.color}
                    stroke="var(--ink)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    style={{ transition: "all 1s ease" }}
                  />
                );
              })}
            </svg>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 18 }}>
              {pieSegs.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <span style={{ width: 14, height: 14, background: s.color, border: "2px solid var(--ink)", display: "inline-block" }} />
                  <span className="heavy" style={{ fontSize: 12 }}>{s.label}</span>
                  <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)" }}>{Math.round(s.pct * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 70 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span className="sticker" style={{ background: "var(--butter)", fontSize: 12, transform: "rotate(2deg)" }}>★ A DREAM&apos;S JOURNEY ★</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, alignItems: "stretch" }}>
            {timeline.map((step, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div style={{
                  background: step.c,
                  border: "2.5px solid var(--ink)",
                  boxShadow: "5px 5px 0 var(--ink)",
                  padding: "18px 12px",
                  textAlign: "center",
                  transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                  height: "100%",
                }}>
                  <div style={{ fontSize: 36, lineHeight: 1 }}>{step.emoji}</div>
                  <div className="typewriter" style={{ fontSize: 11, color: "var(--ink)", marginTop: 8, letterSpacing: "0.1em" }}>+{step.t}</div>
                  <div className="heavy" style={{ fontSize: 13, color: "var(--ink)", marginTop: 6, lineHeight: 1.2 }}>{step.label}</div>
                </div>
                {i < 4 && (
                  <div style={{ position: "absolute", right: -22, top: "40%", fontSize: 28, color: "var(--ink)", zIndex: 2 }} className="display">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Quote
   ────────────────────────────────────────────── */

function Quote() {
  return (
    <section style={{ padding: "40px 48px", textAlign: "center" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", left: -10, top: -20, fontSize: 100, color: "var(--rose)", opacity: 0.25, fontFamily: "'Fraunces', serif", lineHeight: 1 }}>&ldquo;</div>
        <p className="serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.25, color: "var(--ink)", margin: 0 }}>
          The unexamined life is fine actually.
        </p>
        <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", marginTop: 28 }}>
          — Socrates, probably
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Telegram CTA
   ────────────────────────────────────────────── */

function TelegramCard() {
  return (
    <section style={{ padding: "60px 48px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 50, alignItems: "center" }}>
        <div>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            ✦ from your pocket ✦
          </div>
          <h2 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, fontWeight: 400, lineHeight: 1.05, fontStyle: "italic", marginBottom: 20 }}>
            Text us a dream. We&apos;ll bury it discreetly.
          </h2>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", maxWidth: 520, lineHeight: 1.5, marginBottom: 28 }}>
            Walk away from something on the way to the train? Tell our Telegram bot. It tucks the dream into your folder, automatically. No app. No mood to overcome.
          </p>
          <Link href="/feed" className="btn-paper" style={{ textDecoration: "none" }}>connect telegram</Link>
        </div>
        <div style={{ position: "relative", height: 380 }}>
          <div className="paper floaty" style={{ position: "absolute", top: 0, right: 30, width: 280, padding: "30px 24px", transform: "rotate(3deg)", background: "#faf3df", ["--rot" as string]: "3deg" }}>
            <div className="tape tape-teal" style={{ top: -12, left: "50%", marginLeft: -40 }} />
            <div className="typewriter" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faded)", borderBottom: "1px dashed var(--ink-faded)", paddingBottom: 8, marginBottom: 14 }}>
              i.w.o. receipt · today
            </div>
            <div className="hand" style={{ fontSize: 20, color: "var(--ink-soft)", lineHeight: 1.35, marginBottom: 14 }}>
              &ldquo;today i&apos;m letting go of being the one who remembers everyone&apos;s birthday&rdquo;
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 10, color: "var(--ink-faded)" }}>
              <span>logged · 14:22</span>
              <span>— elena</span>
            </div>
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <span className="stamp" style={{ color: "var(--teal)" }}>received</span>
            </div>
          </div>
          <div className="floaty" style={{ position: "absolute", bottom: 30, left: 20, transform: "rotate(-8deg)", ["--rot" as string]: "-8deg", animationDelay: "1s" }}>
            <div style={{ display: "inline-block", padding: 6, background: "var(--paper-light)", border: "1.5px dashed var(--teal)", position: "relative" }}>
              <div style={{ border: "2px solid var(--teal)", padding: "10px 14px", fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--teal)", textAlign: "center", lineHeight: 1.4 }}>
                <div style={{ fontSize: 16, fontFamily: "'Fraunces', serif", fontStyle: "italic", letterSpacing: 0, textTransform: "none" }}>i.w.o.</div>
                <div>released</div>
              </div>
            </div>
          </div>
          <div className="floaty wiggle" style={{ position: "absolute", top: 90, left: 0, animationDelay: "0.5s", ["--rot" as string]: "-15deg" }}>
            <span className="sticker" style={{ background: "var(--rose)", color: "var(--paper-light)", fontSize: 13, transform: "rotate(-15deg)" }}>POCKET MAIL</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Footer
   ────────────────────────────────────────────── */

function Footer() {
  return (
    <footer
      style={{
        padding: "60px 48px 40px",
        marginTop: 80,
        borderTop: "1px dashed var(--ink-faded)",
        display: "flex",
        flexDirection: "column",
        gap: 30,
        background: "rgba(235, 227, 208, 0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 360 }}>
          <h3 className="serif" style={{ fontSize: 28, margin: 0, fontWeight: 500, marginBottom: 10 }}>i walked out</h3>
          <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", margin: 0, lineHeight: 1.3 }}>
            Quit big. Live small.
          </p>
        </div>
        <div style={{ display: "flex", gap: 50, fontFamily: "'Fraunces', serif", fontSize: 15 }}>
          <div>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>wander</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/feed" style={{ color: "var(--ink)", textDecoration: "none" }}>Dead dreams feed</Link>
              <Link href="/sticky-decision" style={{ color: "var(--ink)", textDecoration: "none" }}>Sticky decision</Link>
              <Link href="/vibe" style={{ color: "var(--ink)", textDecoration: "none" }}>Vibe IRL</Link>
            </div>
          </div>
          <div>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>quiet things</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/personality" style={{ color: "var(--ink)", textDecoration: "none" }}>Personality mirror</Link>
              <Link href="/dugdug" style={{ color: "var(--ink)", textDecoration: "none" }}>Dug-Dug</Link>
              <Link href="/auth/login" style={{ color: "var(--ink)", textDecoration: "none" }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Special Elite', monospace", fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.05em" }}>
        <span>est. 2025 · made with care</span>
        <span>vol. 03 · issue ii</span>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────
   Main Page
   ────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="page-in">
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Infographics />
      <Quote />
      <TelegramCard />
      <Footer />
    </div>
  );
}
