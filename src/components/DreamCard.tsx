"use client";

import { useState, useCallback } from "react";
import { Dream } from "@/lib/types";

const noteColors = [
  "var(--note-1)",
  "var(--note-2)",
  "var(--note-3)",
  "var(--note-4)",
  "var(--note-5)",
];

const tiltAngles = [-1.4, 0.8, -0.5, 1.2, -0.9, 0.4, -1.1];

const REACTIONS: { key: string; emoji: string; label: string }[] = [
  { key: "skull", emoji: "💀", label: "been there" },
  { key: "oof", emoji: "🫠", label: "oof" },
  { key: "rip", emoji: "🪦", label: "rip dream" },
  { key: "haunting", emoji: "👻", label: "haunts me" },
  { key: "dramatic", emoji: "🎪", label: "so dramatic" },
  { key: "pour_one_out", emoji: "🍷", label: "pour one out" },
];

function getReactedKey(dreamId: string): string {
  return `reacted_${dreamId}`;
}

function getReacted(dreamId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getReactedKey(dreamId)) || null;
}

function setReacted(dreamId: string, reaction: string | null) {
  if (typeof window === "undefined") return;
  if (reaction) {
    localStorage.setItem(getReactedKey(dreamId), reaction);
  } else {
    localStorage.removeItem(getReactedKey(dreamId));
  }
}

export default function DreamCard({ dream, index = 0 }: { dream: Dream; index?: number }) {
  const timeAgo = getTimeAgo(dream.created_at);
  const noteColor = noteColors[index % noteColors.length];
  const tilt = tiltAngles[index % tiltAngles.length];
  const [flipped, setFlipped] = useState(false);

  const [reactions, setReactions] = useState<Record<string, number>>(
    dream.reactions || {}
  );
  const [picked, setPicked] = useState<string | null>(() =>
    getReacted(dream.id)
  );
  const [animating, setAnimating] = useState<string | null>(null);

  const handleReact = useCallback(
    async (key: string) => {
      if (picked === key) return;

      const previous = picked;
      setReacted(dream.id, key);
      setPicked(key);
      setReactions((prev) => {
        const next = { ...prev, [key]: (prev[key] || 0) + 1 };
        if (previous && next[previous]) {
          next[previous] = Math.max(0, next[previous] - 1);
        }
        return next;
      });
      setAnimating(key);
      setTimeout(() => setAnimating(null), 600);

      try {
        const res = await fetch("/api/dreams/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dream_id: dream.id, reaction: key, previous }),
        });
        if (res.ok) {
          const data = await res.json();
          setReactions(data.reactions);
        }
      } catch {
        /* optimistic update stays */
      }
    },
    [dream.id, picked]
  );

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  const sharedCard = {
    backgroundColor: noteColor,
    border: "1px solid var(--ink)",
    boxShadow: "4px 5px 0 var(--paper-edge)",
    padding: "22px 20px 16px",
    borderRadius: 3,
    backfaceVisibility: "hidden" as const,
    boxSizing: "border-box" as const,
  };

  return (
    <div
      className="dream-card-wrapper"
      style={{
        width: "100%",
        breakInside: "avoid" as const,
        marginBottom: 24,
        perspective: 800,
        cursor: "pointer",
        transform: `rotate(${tilt}deg)`,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px) rotate(0deg)";
        e.currentTarget.style.zIndex = "5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${tilt}deg)`;
        e.currentTarget.style.zIndex = "0";
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT: Title side (relative = sets container height) ── */}
        <div
          style={{ ...sharedCard, position: "relative" as const }}
          onClick={() => setFlipped(true)}
        >
          <Pin />

          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "var(--ink-3)",
              marginBottom: 10,
            }}
          >
            {dream.category} · pinned {timeAgo}
          </div>

          <h3
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: dream.title.length > 40 ? 22 : 26,
              lineHeight: 1.2,
              fontWeight: 400,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              margin: "8px 0 0",
            }}
          >
            {dream.title}
          </h3>

          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: "1px dashed var(--rule)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: 10.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: "var(--ink-3)",
            }}
          >
            <span>— {dream.anonymous_alias}</span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>tap to read</span>
          </div>
        </div>

        {/* ── BACK: Description + reactions (absolute = fills front's height) ── */}
        <div
          style={{
            ...sharedCard,
            position: "absolute" as const,
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "rotateY(180deg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Pin />

          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "var(--ink-3)",
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{dream.category} · pinned {timeAgo}</span>
            <span
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              style={{ cursor: "pointer", fontSize: 10, opacity: 0.6 }}
            >
              flip back
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: dream.description.length > 120 ? 16 : 18,
                lineHeight: 1.38,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
                margin: 0,
              }}
            >
              {dream.description}
            </p>
          </div>

          {/* Reactions */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginTop: 12,
            }}
          >
            {REACTIONS.map((r) => {
              const count = reactions[r.key] || 0;
              const isActive = picked === r.key;
              const isAnimating = animating === r.key;
              return (
                <ReactionButton
                  key={r.key}
                  emoji={r.emoji}
                  label={r.label}
                  count={count}
                  isActive={isActive}
                  isAnimating={isAnimating}
                  onClick={(e) => { e.stopPropagation(); handleReact(r.key); }}
                />
              );
            })}
          </div>

          {/* Meta row */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px dashed var(--rule)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: 10.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: "var(--ink-3)",
            }}
          >
            <span>— {dream.anonymous_alias}</span>
            <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
              {totalReactions > 0 && (
                <span>
                  {totalReactions} react{totalReactions !== 1 ? "s" : ""}
                </span>
              )}
              <span style={{ cursor: "pointer", transition: "color 0.15s" }}>
                ⌇ me too
              </span>
              <span style={{ cursor: "pointer", transition: "color 0.15s" }}>
                ❀ ribbon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pin() {
  return (
    <div
      style={{
        position: "absolute",
        top: -7,
        left: "50%",
        transform: "translateX(-50%)",
        width: 14,
        height: 14,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 30%, var(--accent) 0 35%, var(--accent-deep) 36% 60%, #6e2f0e 61% 100%)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        zIndex: 2,
      }}
    />
  );
}

function ReactionButton({
  emoji,
  label,
  count,
  isActive,
  isAnimating,
  onClick,
}: {
  emoji: string;
  label: string;
  count: number;
  isActive: boolean;
  isAnimating: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "4px 8px",
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.1em",
        background: isActive ? "var(--ink)" : "transparent",
        color: isActive ? "var(--paper)" : "var(--ink-2)",
        border: isActive
          ? "1px solid var(--ink)"
          : "1px solid var(--rule)",
        borderRadius: 999,
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: isAnimating ? "scale(1.35)" : "scale(1)",
        textTransform: "uppercase" as const,
      }}
    >
      <span style={{ fontSize: 14 }}>{emoji}</span>
      {count > 0 && <span>{count}</span>}
      {!isAnimating && <span>{label}</span>}
      {isAnimating && <span style={{ fontWeight: 500 }}>{label}</span>}
    </button>
  );
}

function getTimeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
