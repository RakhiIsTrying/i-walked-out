"use client";

import { getDailyPrompt } from "@/lib/daily-prompts";

export default function DailyPromptCard({ onRespond }: { onRespond: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const prompt = getDailyPrompt(today);

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1.5px solid var(--ink)",
        borderRadius: 4,
        padding: "24px 22px",
        boxShadow: "4px 5px 0 var(--paper-edge)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          daily prompt
        </span>
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "var(--ink-3)",
          }}
        >
          {today}
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: "clamp(20px, 2.5vw, 24px)",
          lineHeight: 1.35,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        {prompt}
      </p>

      <button
        onClick={onRespond}
        style={{
          appearance: "none",
          background: "none",
          border: "1px dashed var(--accent)",
          borderRadius: 3,
          padding: "10px 16px",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        respond with a dead dream
      </button>
    </div>
  );
}
