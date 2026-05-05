"use client";

import { Dream } from "@/lib/types";

const categoryPinClass: Record<string, string> = {
  career: "pin-teal",
  relationship: "",         // default red pin
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

export default function DreamCard({ dream }: { dream: Dream }) {
  const timeAgo = getTimeAgo(dream.created_at);
  const rotation = (dream.id.charCodeAt(0) % 7) - 3;
  const pinClass = categoryPinClass[dream.category] ?? "pin-plum";
  const bg = categoryBg[dream.category] ?? categoryBg.other;

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
      {/* Pin at top center */}
      <div
        className={`pin ${pinClass}`}
        style={{
          top: -6,
          left: "50%",
          marginLeft: -8,
        }}
      />

      {/* Category tag top-right */}
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

      {/* Title as typewriter label */}
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

      {/* Main description */}
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
          style={{
            fontSize: 10,
            color: "var(--ink-faded)",
          }}
        >
          {dream.anonymous_alias}
        </span>
        <span
          className="typewriter"
          style={{
            fontSize: 10,
            color: "var(--ink-faded)",
          }}
        >
          {timeAgo}
        </span>
      </div>
    </div>
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
