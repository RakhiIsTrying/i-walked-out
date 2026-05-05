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

const cardKinds: Record<
  string,
  { label: string; tapeClass: string }
> = {
  place: { label: "go to", tapeClass: "tape-rose" },
  movie: { label: "watch", tapeClass: "tape-teal" },
  tv_show: { label: "binge", tapeClass: "tape-plum" },
  food: { label: "eat", tapeClass: "tape-butter" },
  game: { label: "play", tapeClass: "tape-rose" },
  song: { label: "listen", tapeClass: "tape-teal" },
  music_album: { label: "album", tapeClass: "tape-plum" },
  youtube: { label: "youtube", tapeClass: "tape-butter" },
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
    const random =
      vibeStarters[Math.floor(Math.random() * vibeStarters.length)];
    setQuery(random);
    setActivePreset(random);
    search(random);
  }

  function pickPreset(vibe: string) {
    setQuery(vibe);
    setActivePreset(vibe);
    search(vibe);
  }

  const resultKeys = [
    "place", "movie", "tv_show", "food", "game", "song", "music_album", "youtube",
  ] as const;

  return (
    <div className="page-in" style={{ maxWidth: 900, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <span className="typewriter" style={{
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--ink-faded)", display: "block", marginBottom: 10,
        }}>
          vibe coding &middot; irl
        </span>
        <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, margin: "0 0 14px", lineHeight: 1.15 }}>
          Type a feeling.{" "}
          <em style={{ color: "var(--rose)", fontStyle: "italic" }}>Get an evening.</em>
        </h1>
        <p style={{
          color: "var(--ink-faded)", maxWidth: 520, margin: "0 auto",
          fontSize: 16, lineHeight: 1.6,
        }}>
          No optimization. No reviews. Tell us how you are, and we&rsquo;ll hand you instructions for the next few hours.
        </p>
      </div>

      {/* Search Input Area */}
      <div
        className="paper"
        style={{
          maxWidth: 760, margin: "0 auto 48px", padding: "36px 32px 32px",
          borderRadius: 3, position: "relative",
        }}
      >
        {/* Tape */}
        <div className="tape" style={{ top: -10, left: 40, transform: "rotate(-3deg)" }} />

        <span className="typewriter" style={{
          fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--ink-faded)", display: "block", textAlign: "center", marginBottom: 20,
        }}>
          &#10022; how are you, really? &#10022;
        </span>

        <form
          onSubmit={(e) => { e.preventDefault(); setActivePreset(null); search(); }}
          style={{ display: "flex", gap: 12, marginBottom: 20 }}
        >
          <input
            type="text"
            className="hand"
            placeholder="Describe a vibe..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, fontSize: 24, padding: "12px 16px",
              lineHeight: 1.4,
            }}
          />
          <button
            type="submit"
            className="btn-paper"
            disabled={loading || !query.trim()}
            style={{ whiteSpace: "nowrap", fontSize: 15 }}
          >
            {loading ? "feeling..." : "make a board ↳"}
          </button>
        </form>

        {/* Presets */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "var(--ink-faded)", marginRight: 8 }}>
            or borrow a vibe &rarr;
          </span>
          <button
            type="button"
            onClick={randomVibe}
            disabled={loading}
            className="typewriter"
            style={{
              fontSize: 11, color: "var(--teal)", background: "none",
              border: "1px dashed var(--teal)", borderRadius: 2,
              padding: "4px 10px", cursor: "pointer", marginRight: 8,
              marginBottom: 8,
            }}
          >
            &#x21BB; random
          </button>
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: 8, marginTop: 10,
          }}>
            {vibeStarters.map((vibe) => (
              <button
                key={vibe}
                onClick={() => pickPreset(vibe)}
                disabled={loading}
                className="hand"
                style={{
                  fontSize: 16, padding: "5px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${activePreset === vibe ? "var(--ink)" : "var(--ink-faded)"}`,
                  background: activePreset === vibe ? "var(--ink)" : "transparent",
                  color: activePreset === vibe ? "var(--paper-light)" : "var(--ink-soft)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: "center", padding: "60px 0",
        }}>
          <p className="hand" style={{ fontSize: 26, color: "var(--ink-faded)" }}>
            feeling...
          </p>
        </div>
      )}

      {/* Results Moodboard */}
      {result && !loading && (
        <div
          className="page-in"
          style={{
            background: "var(--paper-deep)",
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.13 0 0 0 0 0.11 0 0 0 0 0.09 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "auto, 200px 200px",
            border: "1.5px dashed var(--ink-faded)",
            borderRadius: 3,
            padding: "36px 28px 40px",
            marginBottom: 48,
            opacity: loading ? 0.4 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {/* Board header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginBottom: 28, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <span className="typewriter" style={{
                fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--ink-faded)", display: "block", marginBottom: 4,
              }}>
                a moodboard for &mdash;
              </span>
              <h2 className="serif" style={{
                fontSize: 30, fontWeight: 400, fontStyle: "italic",
                margin: 0, lineHeight: 1.2,
              }}>
                &ldquo;{result.query}&rdquo;
              </h2>
            </div>
            <button
              className="btn-ghost"
              onClick={randomVibe}
              style={{ fontSize: 14, padding: "8px 16px" }}
            >
              &#x21BB; another evening
            </button>
          </div>

          {/* Vibe summary */}
          {result.vibe_summary && (
            <p className="hand" style={{
              fontSize: 20, color: "var(--ink-soft)", marginBottom: 28,
              lineHeight: 1.4, maxWidth: 600,
            }}>
              {result.vibe_summary}
            </p>
          )}

          {/* Grid of result cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}>
            {resultKeys.map((key, i) => {
              const config = cardKinds[key];
              const value = result[key];
              if (!value) return null;

              return (
                <div
                  key={key}
                  className="paper lift page-in"
                  style={{
                    padding: "32px 22px 24px",
                    borderRadius: 3,
                    position: "relative",
                    animationDelay: `${0.1 + i * 0.06}s`,
                    cursor: "default",
                  }}
                >
                  {/* Tape */}
                  <div
                    className={`tape ${config.tapeClass}`}
                    style={{ top: -8, left: "50%", transform: "translateX(-50%) rotate(-2deg)", width: 60 }}
                  />

                  {/* Kind label */}
                  <span className="typewriter" style={{
                    fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "var(--ink-faded)", display: "block", marginBottom: 10,
                  }}>
                    {config.label} &rarr;
                  </span>

                  {/* Title */}
                  <p className="serif" style={{
                    fontSize: 24, fontWeight: 400, margin: 0,
                    lineHeight: 1.2, color: "var(--ink)",
                  }}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom note */}
          <p className="hand" style={{
            textAlign: "center", fontSize: 19, color: "var(--ink-faded)",
            marginTop: 32, marginBottom: 0,
          }}>
            you don&rsquo;t have to do all of them. one is enough.
          </p>
        </div>
      )}

      {/* Past Vibes Timeline */}
      {history.length > 1 && (
        <div style={{ marginTop: 48 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <span className="typewriter" style={{
              fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--ink-faded)",
            }}>
              past vibes
            </span>
            <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed var(--ink-faded)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setResult(h);
                  setQuery(h.query);
                  setActivePreset(null);
                }}
                className="hand"
                style={{
                  textAlign: "left", background: "none", border: "none",
                  cursor: "pointer", padding: "8px 12px",
                  borderRadius: 3, fontSize: 19,
                  color: "var(--ink-soft)",
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--paper-light)";
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--ink-soft)";
                }}
              >
                &ldquo;{h.query}&rdquo;
                <span style={{
                  marginLeft: 10, fontSize: 14, color: "var(--ink-faded)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  {h.vibe_summary ? h.vibe_summary.slice(0, 60) + (h.vibe_summary.length > 60 ? "..." : "") : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
