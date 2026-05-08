"use client";

import Link from "next/link";
import { useState } from "react";

const CARDS = [
  {
    front: "i'm not going to learn french before turkey",
    who: "— elenatue",
    back: "merci, duolingo. it's been 743 days. you can stop emailing me now.",
    color: "var(--note-1)",
  },
  {
    front: "the cafe will stay an idea. it's a good idea. it's just not mine.",
    who: "— j.mar 4",
    back: "imaginary location: corner of nostalgia & 4th. closing forever.",
    color: "var(--note-3)",
  },
  {
    front: "i will never be the friend who plans the trip",
    who: "— anon",
    back: "i AM the friend who shows up with snacks. that's a contribution.",
    color: "var(--note-2)",
  },
  {
    front: "we are not getting back together. that's the dream i'm releasing.",
    who: "— m.apr",
    back: "good luck out there. (i mean it. mostly. seventy percent.)",
    color: "var(--note-4)",
  },
  {
    front: "novel. chapter 3. seven years. she can rest now.",
    who: "— r.s.",
    back: "the protagonist was always going to be okay. that was the problem.",
    color: "var(--note-5)",
  },
  {
    front: "i am NOT a person who runs marathons",
    who: "— strangersun",
    back: "i AM a person who walks to the bakery. that's a sport, in this economy.",
    color: "var(--note-1)",
  },
  {
    front: "the houseplants. all of them. i give up.",
    who: "— p.fri",
    back: "fern, you tried. i tried. neither of us tried hard enough.",
    color: "var(--note-3)",
  },
  {
    front: "becoming someone who 'just goes for a run in the morning'",
    who: "— anon",
    back: "i am someone who lies very still. and that's beautiful.",
    color: "var(--note-2)",
  },
];

const TILTS = [-1.1, 0.6, -0.4, 1.2];

function FlipCard({ card, idx }: { card: typeof CARDS[number]; idx: number }) {
  const [flipped, setFlipped] = useState(false);
  const tilt = TILTS[idx % 4];

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        aspectRatio: "5/4",
        perspective: 1200,
        cursor: "pointer",
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform .55s cubic-bezier(.5,.1,.2,1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            padding: "22px 20px 18px",
            border: "1px solid var(--ink)",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 5px 0 var(--paper-edge)",
            background: card.color,
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 21,
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
            }}
          >
            {card.front}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: "10.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            <span>{card.who}</span>
            <span
              style={{
                border: "1px solid var(--rule)",
                padding: "3px 7px",
                borderRadius: 999,
              }}
            >
              flip ↻
            </span>
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            padding: "22px 20px 18px",
            border: "1px solid var(--ink)",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "4px 5px 0 var(--paper-edge)",
            background: card.color,
          }}
        >
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 21,
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
            }}
          >
            {card.back}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: "10.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            <span>p.s.</span>
            <span
              style={{
                border: "1px solid var(--rule)",
                padding: "3px 7px",
                borderRadius: 999,
              }}
            >
              flip back ↺
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardWall() {
  return (
    <section style={{ padding: "60px 0 80px", position: "relative" }}>
      <div className="wrap">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
            gap: 32,
          }}
        >
          <div>
            <div className="eyebrow">From the wall &middot; Today</div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: 32,
                margin: "6px 0 0",
                letterSpacing: "-0.01em",
              }}
            >
              Dreams already released this morning.
            </h2>
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              whiteSpace: "nowrap",
            }}
          >
            click any card to flip ↻
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "22px 22px",
          }}
        >
          {CARDS.map((card, i) => (
            <FlipCard key={i} card={card} idx={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          section > .wrap > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          section > .wrap > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function Rooms() {
  const rooms = [
    {
      num: "N° 01",
      title: "The Wall",
      desc: "Browse abandoned ideas from strangers. Anonymous, raw, real. No judgement — just ghosts of what could have been.",
      href: "/feed",
      visualClass: "wall",
    },
    {
      num: "N° 02",
      title: "Personality Mirror",
      desc: "We gently build your portrait from what you release. What you let go of reveals more than what you hold.",
      href: "/personality",
      visualClass: "mirror",
    },
    {
      num: "N° 03",
      title: "Sticky Decision",
      desc: "Stuck? Post it. Let kind strangers vote on what you should do next. You're not alone in this.",
      href: "/sticky-decision",
      visualClass: "vote",
    },
    {
      num: "N° 04",
      title: "Vibe IRL",
      desc: "Type a feeling. Get a place to visit, a movie to watch, food to try. Let mood guide you, not a roadmap.",
      href: "/vibe",
      visualClass: "vibe",
    },
  ];

  const visualBgs: Record<string, React.CSSProperties> = {
    wall: {
      backgroundImage: `
        radial-gradient(circle at 22% 30%, var(--note-3) 0 20%, transparent 22%),
        radial-gradient(circle at 65% 25%, var(--note-1) 0 18%, transparent 20%),
        radial-gradient(circle at 45% 70%, var(--note-4) 0 22%, transparent 24%),
        repeating-linear-gradient(135deg, transparent 0 8px, rgba(60,40,20,0.05) 8px 9px)`,
    },
    mirror: {
      background: `radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, transparent 60%),
        linear-gradient(180deg, var(--paper-deep), var(--paper-edge))`,
    },
    vote: {
      background: "linear-gradient(180deg, var(--note-2), var(--paper-edge))",
    },
    vibe: {
      background:
        "conic-gradient(from 200deg at 50% 60%, var(--note-5), var(--note-4), var(--note-1), var(--note-3), var(--note-5))",
      filter: "blur(0.3px)",
    },
  };

  return (
    <section style={{ padding: "96px 0 80px" }}>
      <div
        className="wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
          gap: 24,
          marginBottom: 44,
        }}
      >
        <div>
          <div className="eyebrow">Four rooms to explore</div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(40px, 5vw, 64px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              margin: "14px 0 0",
              maxWidth: "18ch",
            }}
          >
            Poke around.{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 500 }}>
              It&apos;s all yours.
            </em>
          </h2>
        </div>
        <div
          style={{
            maxWidth: "32ch",
            color: "var(--ink-2)",
            fontSize: 17,
          }}
        >
          Every room is small, weird, and made with care. None of them ask much of you.
        </div>
      </div>

      <div className="wrap">
        <div
          className="room-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            borderTop: "1px solid var(--ink)",
            borderBottom: "1px solid var(--ink)",
          }}
        >
          {rooms.map((room, i) => (
            <Link
              key={i}
              href={room.href}
              style={{
                padding: "28px 24px 26px",
                borderRight: i < 3 ? "1px solid var(--rule)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 360,
                position: "relative",
                background: "var(--paper)",
                transition: "background .25s",
                color: "var(--ink)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--paper-deep)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--paper)";
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  color: "var(--ink-3)",
                }}
              >
                {room.num}
              </div>
              <div
                style={{
                  aspectRatio: "4/3",
                  border: "1px solid var(--rule)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--mono)",
                  fontSize: "10.5px",
                  letterSpacing: "0.14em",
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                  ...visualBgs[room.visualClass],
                }}
                aria-hidden="true"
              />
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 30,
                  lineHeight: 1.05,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {room.title}
              </h3>
              <p
                style={{
                  color: "var(--ink-2)",
                  fontSize: "15.5px",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {room.desc}
              </p>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  marginTop: "auto",
                  borderTop: "1px dashed var(--rule)",
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                explore <span style={{ transition: "transform .25s" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .room-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .room-grid > a { border-right: 0 !important; border-bottom: 1px solid var(--rule); }
          .room-grid > a:nth-child(odd) { border-right: 1px solid var(--rule) !important; }
          section > .wrap:first-child { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .room-grid { grid-template-columns: 1fr !important; }
          .room-grid > a, .room-grid > a:nth-child(odd) { border-right: 0 !important; }
        }
      `}</style>
    </section>
  );
}

export default function Features() {
  return (
    <>
      <CardWall />
      <Rooms />
    </>
  );
}
