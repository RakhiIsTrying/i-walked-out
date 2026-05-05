"use client";

import Link from "next/link";
import { useState } from "react";

/* ──────────────────────────────────────────────
   Sample dream data
   ────────────────────────────────────────────── */

const dreams = [
  { text: "i'm not going to learn french before turkey", author: "elena", rotate: -3, x: "8%", y: "10%" },
  { text: "the cafe will stay an idea. it's a good idea. it's just not mine.", author: "j.", rotate: 4, x: "60%", y: "6%" },
  { text: "i don't want to be a morning person. i never did.", author: "anon", rotate: -6, x: "78%", y: "30%" },
  { text: "we are not getting back together. and that's the dream i'm releasing today.", author: "m.", rotate: 5, x: "4%", y: "48%" },
  { text: "novel. chapter 3. seven years. she can rest now.", author: "r.s.", rotate: -2, x: "44%", y: "54%" },
  { text: "i am not the kind of person who runs marathons and that's okay", author: "stranger", rotate: 3, x: "70%", y: "62%" },
];

const marqueeItems = [
  "✦ released today · 1,247 dreams",
  "✶ kindest community on the internet",
  "✦ no algorithm, no metrics, just letting go",
  "✶ telegram bot · whisper a dream · we'll keep it",
  "✦ since 2025 · still gentle",
];

const features = [
  {
    num: "01",
    title: "The wall",
    body: "Browse abandoned dreams from strangers. Anonymous, unpolished, honest. A quiet scroll through everything people let go.",
    cta: "take a look",
    href: "/feed",
    tapeClass: "tape",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="6" width="28" height="24" rx="2" />
        <line x1="4" y1="14" x2="32" y2="14" />
        <line x1="4" y1="22" x2="32" y2="22" />
        <line x1="16" y1="6" x2="16" y2="30" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Personality mirror",
    body: "We build a gentle portrait of you from the dreams you release. What you let go says more than what you hold on to.",
    cta: "take a look",
    href: "/personality",
    tapeClass: "tape tape-rose",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="14" r="6" />
        <path d="M8 30c0-5.5 4.5-10 10-10s10 4.5 10 10" />
        <path d="M26 12l3-3M10 12l-3-3M18 5V2" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Sticky decision",
    body: "Stuck on something? Post it. Let kind strangers vote on what you should do next. You're not alone in this.",
    cta: "take a look",
    href: "/sticky-decision",
    tapeClass: "tape tape-teal",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="24" height="28" rx="1" />
        <line x1="12" y1="12" x2="24" y2="12" />
        <line x1="12" y1="18" x2="24" y2="18" />
        <line x1="12" y1="24" x2="18" y2="24" />
        <path d="M6 4l2-2h20l2 2" strokeDasharray="3 2" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Vibe IRL",
    body: "Type a random feeling. Get a place to visit, movie to watch, food to try, game to play. Let vibes guide you.",
    cta: "take a look",
    href: "/vibe",
    tapeClass: "tape tape-plum",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--ink-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 4l4 8 9 1.5-6.5 6.3L26 29l-8-4.2L10 29l1.5-9.2L5 13.5 14 12z" />
      </svg>
    ),
  },
];

const steps = [
  { num: "01", title: "release", body: "Via the website or Telegram bot -- whenever you let go of an idea, give it a quiet home here." },
  { num: "02", title: "we listen", body: "Our AI gently notes patterns in the dreams you release. No quizzes, no pressure -- just what you choose to share." },
  { num: "03", title: "wander", body: "Browse what others let go of. You'll find you're never alone in the things you walk away from." },
  { num: "04", title: "meet you", body: "Over time we build a gentle mirror. A portrait made from everything you set free." },
];

/* ──────────────────────────────────────────────
   Pressed Flower (CSS-only)
   ────────────────────────────────────────────── */

function PressedFlower({ size = 28, color = "var(--rose)", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  const petalW = size * 0.35;
  const petalH = size * 0.5;
  const center = size / 2;
  return (
    <div className="flower" style={{ width: size, height: size, ...style }}>
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <div
          key={deg}
          className="petal"
          style={{
            width: petalW,
            height: petalH,
            background: color,
            left: center - petalW / 2,
            top: center - petalH,
            transformOrigin: "50% 100%",
            transform: `rotate(${deg}deg)`,
            opacity: 0.55,
          }}
        />
      ))}
      <div
        className="center"
        style={{
          width: size * 0.2,
          height: size * 0.2,
          background: "var(--butter)",
          left: center - size * 0.1,
          top: center - size * 0.1,
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Note Card (hero collage)
   ────────────────────────────────────────────── */

function NoteCard({ text, author, rotate, x, y }: typeof dreams[number]) {
  const [hovered, setHovered] = useState(false);
  const pinColors = ["pin", "pin-teal", "pin-butter", "pin-plum"];
  const pinClass = pinColors[Math.abs(rotate) % pinColors.length];
  const today = new Date();
  const dateStr = `${today.toLocaleString("default", { month: "short" })} ${today.getFullYear()}`;

  return (
    <div
      className="paper lift"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: "clamp(200px, 22vw, 260px)",
        padding: "28px 20px 18px",
        transform: `rotate(${rotate}deg)`,
        ["--hover-rot" as string]: `${rotate > 0 ? rotate - 2 : rotate + 2}deg`,
        borderRadius: 3,
        cursor: "default",
        zIndex: hovered ? 20 : 1,
      }}
    >
      {/* Pin */}
      <div
        className={pinClass}
        style={{ top: -6, left: "50%", marginLeft: -8 }}
      />

      {/* Dream text */}
      <p className="hand" style={{ fontSize: 22, lineHeight: 1.35, color: "var(--ink-soft)", margin: 0 }}>
        &ldquo;{text}&rdquo;
      </p>

      {/* Author row */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1.5px dashed var(--ink-faded)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.06em" }}>
          -- {author}
        </span>
        <span className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)", opacity: 0.6 }}>
          {dateStr}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Postage Stamp (decorative)
   ────────────────────────────────────────────── */

function PostageStamp({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: 64,
        height: 80,
        background: "var(--paper-light)",
        border: "2px solid var(--ink-faded)",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      {/* Perforated edge simulation */}
      <div style={{ position: "absolute", inset: 3, border: "1px dashed var(--ink-faded)", opacity: 0.4, borderRadius: 1 }} />
      <PressedFlower size={22} color="var(--teal)" />
      <span className="typewriter" style={{ fontSize: 8, color: "var(--ink-faded)", marginTop: 6, letterSpacing: "0.1em" }}>
        2025
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */

export default function Home() {
  /* word-reveal helper: split text into spans with stagger delay */
  function wordReveal(text: string, baseDelay = 0) {
    return text.split(" ").map((word, i) => (
      <span key={i} style={{ animationDelay: `${baseDelay + i * 0.08}s` }}>
        {word}&nbsp;
      </span>
    ));
  }

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ─── 1. Hero Section ─────────────────────── */}
      <section style={{ padding: "60px 48px 80px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Kicker */}
        <p
          className="typewriter"
          style={{
            fontSize: 12,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ink-faded)",
            marginBottom: 24,
          }}
        >
          ✦ a graveyard for dead dreams ✦
        </p>

        {/* Title */}
        <h1
          className="serif word-reveal"
          style={{
            fontWeight: 300,
            fontSize: "clamp(48px, 8vw, 110px)",
            lineHeight: 1.08,
            margin: "0 0 28px",
            maxWidth: 900,
          }}
        >
          {wordReveal("A warm, messy drawer", 0.1)}
          <br />
          <em style={{ color: "var(--rose)" }}>
            {wordReveal("for the dreams you let go.", 0.6)}
          </em>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 19,
            color: "var(--ink-soft)",
            maxWidth: 580,
            lineHeight: 1.65,
            marginBottom: 36,
          }}
        >
          Not every dream is meant to be chased. Some are meant to be released
          — pinned to the wall, kissed goodbye, and left in good company.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/feed" className="btn-paper">
            Pin your first dream ↳
          </Link>
          <Link href="/feed" className="btn-ghost">
            Wander the wall
          </Link>
        </div>
      </section>

      {/* ─── 2. Hero Collage ─────────────────────── */}
      <section
        style={{
          position: "relative",
          height: 560,
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          backgroundImage: "radial-gradient(circle, rgba(122,107,88,0.08) 1px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      >
        {/* Dream cards */}
        {dreams.map((d, i) => (
          <NoteCard key={i} {...d} />
        ))}

        {/* Decorative pressed flower */}
        <PressedFlower
          size={34}
          color="var(--rose)"
          style={{ position: "absolute", right: "18%", top: "8%", opacity: 0.6, transform: "rotate(15deg)" }}
        />
        <PressedFlower
          size={22}
          color="var(--teal)"
          style={{ position: "absolute", left: "38%", top: "38%", opacity: 0.5, transform: "rotate(-20deg)" }}
        />

        {/* Stamp */}
        <div
          className="stamp"
          style={{ position: "absolute", right: "12%", bottom: "14%", transform: "rotate(-6deg)" }}
        >
          released · with love
        </div>

        {/* Dashed arrow + handwritten hint */}
        <div style={{ position: "absolute", right: "6%", top: "18%", display: "flex", alignItems: "flex-start", gap: 6 }}>
          <svg width="60" height="40" viewBox="0 0 60 40" fill="none" style={{ opacity: 0.35 }}>
            <path
              d="M4 36 C 20 36, 30 10, 54 8"
              stroke="var(--ink-faded)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            <path
              d="M50 4 L 56 8 L 48 10"
              stroke="var(--ink-faded)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="hand" style={{ fontSize: 15, color: "var(--ink-faded)", marginTop: 28, whiteSpace: "nowrap" }}>
            hover to peek inside
          </span>
        </div>
      </section>

      {/* ─── 3. Marquee Banner ───────────────────── */}
      <div
        style={{
          background: "var(--ink)",
          transform: "rotate(-1deg)",
          margin: "60px -20px",
          padding: "18px 0",
          overflow: "hidden",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="marquee-track" style={{ display: "flex", width: "max-content" }}>
          {/* Duplicate items for seamless loop */}
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="serif"
              style={{
                fontSize: 22,
                fontStyle: "italic",
                color: "var(--paper-light)",
                whiteSpace: "nowrap",
                paddingLeft: 48,
                paddingRight: 48,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 4. Features Section ─────────────────── */}
      <section style={{ padding: "80px 48px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            className="typewriter"
            style={{ fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}
          >
            what&apos;s inside
          </p>
          <h2
            className="serif"
            style={{ fontWeight: 300, fontSize: "clamp(28px, 4vw, 44px)", fontStyle: "italic", margin: "0 0 12px" }}
          >
            A few quiet rooms to wander.
          </h2>
          <p style={{ color: "var(--ink-soft)", maxWidth: 460, margin: "0 auto", fontSize: 16 }}>
            Every room is a different way to sit with what you&apos;ve let go of.
          </p>
        </div>

        {/* Feature cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 28,
          }}
        >
          {features.map((f) => (
            <Link
              key={f.num}
              href={f.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="paper lift"
                style={{
                  borderRadius: 3,
                  padding: "40px 22px 22px",
                  position: "relative",
                  ["--hover-rot" as string]: "0deg",
                  minHeight: 280,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Tape */}
                <div
                  className={f.tapeClass}
                  style={{ top: -10, left: "50%", marginLeft: -40, transform: "rotate(-2deg)" }}
                />

                {/* Number */}
                <span
                  className="typewriter"
                  style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.15em", marginBottom: 14 }}
                >
                  no. {f.num}
                </span>

                {/* Icon */}
                <div style={{ marginBottom: 14 }}>{f.icon}</div>

                {/* Title */}
                <h3 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: "0 0 10px" }}>
                  {f.title}
                </h3>

                {/* Body */}
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {f.body}
                </p>

                {/* CTA */}
                <span
                  className="hand"
                  style={{ fontSize: 18, color: "var(--rose)", marginTop: 16, display: "inline-block" }}
                >
                  {f.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 5. How It Works ─────────────────────── */}
      <section
        style={{
          borderTop: "1.5px dashed var(--ink-faded)",
          borderBottom: "1.5px dashed var(--ink-faded)",
          background: "var(--paper-deep)",
          padding: "72px 48px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p
              className="typewriter"
              style={{ fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}
            >
              how it works
            </p>
            <h2
              className="serif"
              style={{ fontWeight: 300, fontSize: "clamp(28px, 4vw, 44px)", fontStyle: "italic", margin: 0 }}
            >
              Four gentle steps.
            </h2>
          </div>

          {/* Steps grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 36,
              position: "relative",
            }}
          >
            {steps.map((s, i) => (
              <div key={s.num} style={{ position: "relative" }}>
                {/* Dashed arrow connector (not on last item) */}
                {i < steps.length - 1 && (
                  <svg
                    width="40"
                    height="20"
                    viewBox="0 0 40 20"
                    fill="none"
                    style={{
                      position: "absolute",
                      top: 40,
                      right: -28,
                      opacity: 0.3,
                      display: "none",
                    }}
                    className="hidden lg:!block"
                  >
                    <path d="M0 10 H 30" stroke="var(--ink-faded)" strokeWidth="1.5" strokeDasharray="4 3" />
                    <path d="M26 5 L 34 10 L 26 15" stroke="var(--ink-faded)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}

                {/* Step number */}
                <p
                  className="serif"
                  style={{
                    fontSize: 80,
                    fontStyle: "italic",
                    fontWeight: 300,
                    color: "var(--rose)",
                    opacity: 0.7,
                    lineHeight: 1,
                    margin: "0 0 8px",
                  }}
                >
                  {s.num}
                </p>

                {/* Title */}
                <h3 className="hand" style={{ fontSize: 28, margin: "0 0 10px", color: "var(--ink)" }}>
                  {s.title}
                </h3>

                {/* Body */}
                <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, maxWidth: 260 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Quote Section ────────────────────── */}
      <section style={{ padding: "100px 48px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 720, textAlign: "center", position: "relative" }}>
          {/* Giant quotation mark */}
          <span
            className="serif"
            style={{
              position: "absolute",
              top: -50,
              left: -30,
              fontSize: 100,
              color: "var(--rose)",
              opacity: 0.25,
              lineHeight: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            &ldquo;
          </span>

          <blockquote
            className="serif"
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.3,
              margin: "0 0 24px",
              color: "var(--ink)",
            }}
          >
            Let kindness be the language we all happen to share.
          </blockquote>

          <p
            className="hand"
            style={{ fontSize: 20, color: "var(--ink-soft)", margin: 0 }}
          >
            — pinned to our front door since day one
          </p>
        </div>
      </section>

      {/* ─── 7. Telegram CTA ─────────────────────── */}
      <section style={{ padding: "80px 48px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          {/* Left: text */}
          <div>
            <p
              className="typewriter"
              style={{ fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}
            >
              from your pocket
            </p>
            <h2
              className="serif"
              style={{ fontWeight: 300, fontSize: "clamp(28px, 4vw, 44px)", margin: "0 0 20px", lineHeight: 1.15 }}
            >
              Whisper a dream<br />to our bot.
            </h2>
            <p style={{ fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.65, maxWidth: 400, marginBottom: 28 }}>
              Open Telegram, find our bot, and just type what you&apos;re letting go of.
              We&apos;ll keep it safe, pin it to the wall, and never judge.
            </p>
            <Link href="/feed" className="btn-paper">
              Try the bot ↳
            </Link>
          </div>

          {/* Right: receipt mockup */}
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            {/* Postage stamp decoration */}
            <PostageStamp style={{ position: "absolute", top: -18, right: 12, transform: "rotate(6deg)", zIndex: 3 }} />

            {/* Pressed flower decoration */}
            <PressedFlower
              size={30}
              color="var(--rose)"
              style={{ position: "absolute", bottom: -10, left: 30, transform: "rotate(25deg)", opacity: 0.55, zIndex: 3 }}
            />

            {/* Receipt card */}
            <div
              className="paper"
              style={{
                width: 300,
                padding: "42px 24px 28px",
                borderRadius: 3,
                position: "relative",
              }}
            >
              {/* Tape */}
              <div
                className="tape tape-rose"
                style={{ top: -10, left: "50%", marginLeft: -40, transform: "rotate(2deg)" }}
              />

              {/* Receipt header */}
              <p
                className="typewriter"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--ink-faded)",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                ── i walked out ──
              </p>
              <p
                className="typewriter"
                style={{
                  fontSize: 9,
                  color: "var(--ink-faded)",
                  textAlign: "center",
                  marginBottom: 16,
                  opacity: 0.6,
                }}
              >
                telegram receipt · {new Date().toLocaleDateString()}
              </p>

              <hr className="dashed-rule" style={{ marginBottom: 16 }} />

              {/* Dream text */}
              <p className="hand" style={{ fontSize: 22, lineHeight: 1.4, color: "var(--ink-soft)", margin: "0 0 16px" }}>
                &ldquo;I was going to move to Berlin. I think I just liked the idea of being someone who would.&rdquo;
              </p>

              <hr className="dashed-rule" style={{ marginBottom: 14 }} />

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="typewriter" style={{ fontSize: 10, color: "var(--ink-faded)" }}>
                  -- anonymous
                </span>
                <div className="stamp" style={{ transform: "rotate(-4deg)", margin: 0 }}>
                  received
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Footer ───────────────────────────── */}
      <footer
        style={{
          borderTop: "1.5px dashed var(--ink-faded)",
          background: "linear-gradient(to bottom, var(--paper-deep), var(--paper))",
          padding: "56px 48px 36px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Top row: logo + tagline + link columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr",
              gap: 48,
              marginBottom: 48,
            }}
          >
            {/* Logo + tagline */}
            <div>
              <h3 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: "0 0 12px" }}>
                i walked out
              </h3>
              <p className="hand" style={{ fontSize: 20, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0, maxWidth: 320 }}>
                Hand the world something gentler than it gave you.
              </p>
            </div>

            {/* Wander links */}
            <div>
              <p
                className="typewriter"
                style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 16 }}
              >
                wander
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li>
                  <Link href="/feed" className="nav-link" style={{ fontSize: 15 }}>
                    Dead dreams feed
                  </Link>
                </li>
                <li>
                  <Link href="/sticky-decision" className="nav-link" style={{ fontSize: 15 }}>
                    Sticky decision
                  </Link>
                </li>
                <li>
                  <Link href="/vibe" className="nav-link" style={{ fontSize: 15 }}>
                    Vibe IRL
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quiet things links */}
            <div>
              <p
                className="typewriter"
                style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 16 }}
              >
                quiet things
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li>
                  <Link href="/about" className="nav-link" style={{ fontSize: 15 }}>
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/telegram" className="nav-link" style={{ fontSize: 15 }}>
                    Telegram bot
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="nav-link" style={{ fontSize: 15 }}>
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <hr className="dashed-rule" style={{ marginBottom: 20 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p
              className="typewriter"
              style={{ fontSize: 11, color: "var(--ink-faded)", margin: 0 }}
            >
              est. 2025 · made with care
            </p>
            <p
              className="typewriter"
              style={{ fontSize: 11, color: "var(--ink-faded)", margin: 0 }}
            >
              vol. 03 · issue ii
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
