"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NigelThought() {
  const [thought, setThought] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nigel/daily")
      .then((r) => r.json())
      .then((d) => setThought(d.thought))
      .catch(() => {});
  }, []);

  if (!thought) return null;

  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
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
            color: "rgba(255,255,255,0.5)",
          }}
        >
          nigel&apos;s thought of the day
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          fontSize: "clamp(16px, 2vw, 19px)",
          lineHeight: 1.45,
          color: "var(--paper)",
          margin: 0,
        }}
      >
        {thought}
      </p>

      <Link
        href="/nigel"
        style={{
          appearance: "none",
          background: "none",
          border: "1px dashed rgba(255,255,255,0.4)",
          borderRadius: 3,
          padding: "10px 16px",
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.7)",
          textDecoration: "none",
          alignSelf: "flex-start",
        }}
      >
        talk to nigel
      </Link>
    </div>
  );
}
