"use client";

import { useState, useCallback } from "react";
import { Dream } from "@/lib/types";

const categoryPinClass: Record<string, string> = {
  career: "pin-teal",
  relationship: "",
  creative: "pin-butter",
  business: "pin-teal",
  education: "pin-plum",
  travel: "pin-butter",
  health: "",
  other: "pin-plum",
};

const categoryBg: Record<string, string> = {
  career: "#f1e4d2",
  relationship: "#f4e2d4",
  creative: "#faf3df",
  business: "#e4d9c2",
  education: "#f0e8d8",
  travel: "#e8eed8",
  health: "#f4dede",
  other: "#eee6d4",
};

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

export default function DreamCard({ dream }: { dream: Dream }) {
  const timeAgo = getTimeAgo(dream.created_at);
  const rotation = (dream.id.charCodeAt(0) % 7) - 3;
  const pinClass = categoryPinClass[dream.category] ?? "pin-plum";
  const bg = categoryBg[dream.category] ?? categoryBg.other;

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

  return (
    <div
      className="paper lift"
      style={{
        width: "100%",
        borderRadius: 3,
        padding: "32px 22px 18px",
        transform: `rotate(${rotation}deg)`,
        "--hover-rot": `${-rotation}deg`,
        backgroundColor: bg,
        position: "relative",
      } as React.CSSProperties}
    >
      <div
        className={`pin ${pinClass}`}
        style={{ top: -6, left: "50%", marginLeft: -8 }}
      />

      <span
        className="typewriter"
        style={{
          position: "absolute",
          top: 10,
          right: 14,
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-faded)",
        }}
      >
        {dream.category}
      </span>

      <p
        className="typewriter"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--ink-faded)",
          marginBottom: 6,
          lineHeight: 1.3,
          textTransform: "uppercase",
        }}
      >
        {dream.title}
      </p>

      <p
        className="hand"
        style={{
          fontSize: 22,
          lineHeight: 1.35,
          color: "var(--ink-soft)",
          marginBottom: 16,
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {dream.description}
      </p>

      {/* Reactions */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          marginBottom: 12,
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
              onClick={() => handleReact(r.key)}
            />
          );
        })}
      </div>

      {/* Bottom separator and meta */}
      <div
        style={{
          borderTop: "1.5px dashed var(--ink-faded)",
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="typewriter"
          style={{ fontSize: 10, color: "var(--ink-faded)" }}
        >
          {dream.anonymous_alias}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalReactions > 0 && (
            <span
              className="typewriter"
              style={{ fontSize: 10, color: "var(--ink-faded)" }}
            >
              {totalReactions} react{totalReactions !== 1 ? "s" : ""}
            </span>
          )}
          <span
            className="typewriter"
            style={{ fontSize: 10, color: "var(--ink-faded)" }}
          >
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
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
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="typewriter"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "4px 8px",
        fontSize: 11,
        background: isActive ? "var(--ink)" : "transparent",
        color: isActive ? "var(--paper-light)" : "var(--ink-soft)",
        border: isActive
          ? "1.5px solid var(--ink)"
          : "1px solid rgba(106,112,140,0.2)",
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: isAnimating ? "scale(1.35)" : "scale(1)",
      }}
    >
      <span style={{ fontSize: 14 }}>{emoji}</span>
      {count > 0 && <span>{count}</span>}
      {hovered && !isAnimating && (
        <span
          className="typewriter"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--ink)",
            color: "var(--paper-light)",
            fontSize: 9,
            letterSpacing: "0.1em",
            padding: "4px 8px",
            borderRadius: 3,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {label}
        </span>
      )}
      {isAnimating && (
        <span
          className="typewriter"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            background: "var(--ink)",
            color: "var(--paper-light)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            padding: "5px 10px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            animation: "reactionPop 0.6s ease-out forwards",
          }}
        >
          {label}
        </span>
      )}
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
