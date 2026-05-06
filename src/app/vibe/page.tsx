"use client";

import { useState } from "react";
import { VibeResult } from "@/lib/types";

const vibeStarters = [
  "3am existential clarity",
  "running through airport energy",
  "quiet rebellion",
  "first snow melancholy",
  "chaotic good brunch",
  "sunset in a city you'll never return to",
  "dancing alone in the kitchen",
  "the calm before quitting your job",
];

const cardKinds: Record<string, { label: string; tapeClass: string; rotate: number }> = {
  place: { label: "go to →", tapeClass: "tape-rose", rotate: -3 },
  movie: { label: "watch →", tapeClass: "tape-teal", rotate: 2 },
  tv_show: { label: "binge →", tapeClass: "tape-plum", rotate: -2 },
  food: { label: "eat →", tapeClass: "tape-butter", rotate: 3 },
  game: { label: "play →", tapeClass: "tape-rose", rotate: -1 },
  song: { label: "listen →", tapeClass: "tape-teal", rotate: 2 },
  music_album: { label: "album →", tapeClass: "tape-plum", rotate: -3 },
  youtube: { label: "youtube →", tapeClass: "tape-butter", rotate: 1 },
};

export default function VibePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VibeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VibeResult[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  async function search(vibeQuery?: string) {
    const q = vibeQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/vibe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev.slice(0, 9)]);
    }
    setLoading(false);
  }

  function randomVibe() {
    const random = vibeStarters[Math.floor(Math.random() * vibeStarters.length)];
    setQuery(random);
    setActivePreset(random);
    search(random);
  }

  function pickPreset(vibe: string) {
    setQuery(vibe);
    setActivePreset(vibe);
    search(vibe);
  }

  const resultKeys = ["place", "movie", "tv_show", "food", "game", "song", "music_album", "youtube"] as const;

  return (
    <div className="page-in" style={{ padding: "20px 48px 40px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            ✦ vibe coding · irl ✦
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, fontWeight: 400, lineHeight: 1.05, fontStyle: "italic" }}>
            Type a feeling. <em style={{ color: "var(--rose)" }}>Get an evening.</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            No optimization. No reviews. Tell us how you are, and we&apos;ll hand you instructions for the next few hours.
          </p>
        </div>

        {/* Input area */}
        <div
          className="paper"
          style={{
            padding: "26px 28px",
            background: "#faf3df",
            margin: "0 auto 30px",
            maxWidth: 760,
            transform: "rotate(-0.5deg)",
            position: "relative",
          }}
        >
          <div className="tape tape-teal" style={{ top: -12, left: "50%", marginLeft: -40 }} />
          <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>
            ✦ how are you, really? ✦
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setActivePreset(null); search(); }}
            style={{ display: "flex", gap: 10, alignItems: "stretch" }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="like a sunday afternoon that won't end..."
              className="hand"
              style={{
                flex: 1,
                background: "var(--paper-light)",
                border: "1px dashed var(--ink-faded)",
                padding: "14px 16px",
                fontSize: 24,
                color: "var(--ink-soft)",
                fontFamily: "'Caveat', cursive",
                outline: "none",
                borderRadius: 2,
              }}
            />
            <button className="btn-paper" type="submit" disabled={loading || !query.trim()}>
              {loading ? "feeling..." : "make a board"}
              <span style={{ fontSize: 18 }}>↳</span>
            </button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
            <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>or borrow a vibe →</span>
            <button
              type="button"
              onClick={randomVibe}
              disabled={loading}
              className="typewriter"
              style={{
                fontSize: 11, color: "var(--teal)", background: "none",
                border: "1px dashed var(--teal)", borderRadius: 2,
                padding: "4px 10px", cursor: "pointer", marginRight: 4,
              }}
            >
              ↻ random
            </button>
            {vibeStarters.map((p) => (
              <button
                key={p}
                onClick={() => pickPreset(p)}
                disabled={loading}
                className="hand"
                style={{
                  padding: "4px 12px",
                  background: activePreset === p ? "var(--ink)" : "transparent",
                  color: activePreset === p ? "var(--paper-light)" : "var(--ink)",
                  border: `1.5px solid ${activePreset === p ? "var(--ink)" : "var(--ink-faded)"}`,
                  fontSize: 18,
                  cursor: "pointer",
                  borderRadius: 14,
                  fontFamily: "'Caveat', cursive",
                  transition: "all 0.2s ease",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p className="hand" style={{ fontSize: 26, color: "var(--ink-faded)" }}>feeling...</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div
            className="page-in"
            style={{
              background: "var(--paper-deep)",
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.13 0 0 0 0 0.11 0 0 0 0 0.09 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "auto, 200px 200px",
              border: "1.5px dashed var(--ink-faded)",
              padding: "36px 28px 40px",
              marginBottom: 48,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 4 }}>
                  a moodboard for —
                </span>
                <h2 className="serif" style={{ fontSize: 38, fontStyle: "italic", margin: 0, fontWeight: 400, marginTop: 4 }}>
                  &ldquo;{result.query}&rdquo;
                </h2>
              </div>
              <button className="btn-ghost" onClick={randomVibe} style={{ padding: "10px 16px", fontSize: 14 }}>
                ↻ another evening
              </button>
            </div>

            {result.vibe_summary && (
              <p className="hand" style={{ fontSize: 20, color: "var(--ink-soft)", marginBottom: 28, lineHeight: 1.4, maxWidth: 600 }}>
                {result.vibe_summary}
              </p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
              {resultKeys.map((key, i) => {
                const config = cardKinds[key];
                const value = result[key];
                if (!value) return null;

                return (
                  <div
                    key={key}
                    className="paper lift pop-in"
                    style={{
                      padding: "22px 24px 26px",
                      position: "relative",
                      transform: `rotate(${config.rotate}deg)`,
                      ["--hover-rot" as string]: `${config.rotate * 0.3}deg`,
                      ["--rot" as string]: `${config.rotate}deg`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    <div className={`tape ${config.tapeClass}`} style={{ top: -12, left: "50%", marginLeft: -40, transform: "rotate(-3deg)" }} />
                    <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
                      {config.label}
                    </div>
                    <h4 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
                      {value}
                    </h4>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 28, textAlign: "center" }}>
              <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", margin: 0 }}>
                you don&apos;t have to do all of them. one is enough.
              </p>
            </div>
          </div>
        )}

        {/* Past Vibes */}
        {history.length > 1 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)" }}>
                past vibes
              </span>
              <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed var(--ink-faded)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.slice(1).map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setResult(h); setQuery(h.query); setActivePreset(null); }}
                  className="hand"
                  style={{
                    textAlign: "left", background: "none", border: "none",
                    cursor: "pointer", padding: "8px 12px",
                    borderRadius: 3, fontSize: 19, color: "var(--ink-soft)",
                    transition: "background 0.2s ease",
                  }}
                >
                  &ldquo;{h.query}&rdquo;
                  {h.vibe_summary && (
                    <span style={{ marginLeft: 10, fontSize: 14, color: "var(--ink-faded)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                      {h.vibe_summary.slice(0, 60)}{h.vibe_summary.length > 60 ? "..." : ""}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
