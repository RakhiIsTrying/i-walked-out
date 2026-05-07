"use client";

import { useState, useEffect, useCallback } from "react";
import { VibeResult } from "@/lib/types";

interface BucketItem {
  id: string;
  vibe_query: string;
  category: string;
  item_text: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

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

const cardKinds: Record<string, { label: string; tapeClass: string; rotate: number; emoji: string }> = {
  place: { label: "go to →", tapeClass: "tape-rose", rotate: -3, emoji: "📍" },
  movie: { label: "watch →", tapeClass: "tape-teal", rotate: 2, emoji: "🎬" },
  tv_show: { label: "binge →", tapeClass: "tape-plum", rotate: -2, emoji: "📺" },
  food: { label: "eat →", tapeClass: "tape-butter", rotate: 3, emoji: "🍜" },
  game: { label: "play →", tapeClass: "tape-rose", rotate: -1, emoji: "🎮" },
  song: { label: "listen →", tapeClass: "tape-teal", rotate: 2, emoji: "🎵" },
  music_album: { label: "album →", tapeClass: "tape-plum", rotate: -3, emoji: "💿" },
  youtube: { label: "youtube →", tapeClass: "tape-butter", rotate: 1, emoji: "▶️" },
};

const resultKeys = ["place", "movie", "tv_show", "food", "game", "song", "music_album", "youtube"] as const;

export default function VibePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VibeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VibeResult[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [bucket, setBucket] = useState<BucketItem[]>([]);
  const [bucketLoading, setBucketLoading] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [showBucket, setShowBucket] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadBucket = useCallback(async () => {
    const res = await fetch("/api/vibe/bucketlist");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setBucket(data);
      setIsLoggedIn(true);
    } else if (res.status === 401) {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    loadBucket();
  }, [loadBucket]);

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

  async function addToBucket(key: string) {
    if (!result || !isLoggedIn) return;
    setAddingKey(key);

    const res = await fetch("/api/vibe/bucketlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vibe_query: result.query,
        category: key,
        item_text: result[key as keyof VibeResult],
      }),
    });

    if (res.ok) {
      const item = await res.json();
      setBucket((prev) => [item, ...prev]);
    }
    setAddingKey(null);
  }

  async function toggleComplete(id: string, completed: boolean) {
    setBucketLoading(true);
    const res = await fetch("/api/vibe/bucketlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed: !completed }),
    });

    if (res.ok) {
      setBucket((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, completed: !completed, completed_at: !completed ? new Date().toISOString() : null }
            : item
        )
      );
    }
    setBucketLoading(false);
  }

  async function removeFromBucket(id: string) {
    const res = await fetch("/api/vibe/bucketlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setBucket((prev) => prev.filter((item) => item.id !== id));
    }
  }

  function isInBucket(key: string, text: string) {
    return bucket.some((b) => b.category === key && b.item_text === text);
  }

  const pendingItems = bucket.filter((b) => !b.completed);
  const doneItems = bucket.filter((b) => b.completed);

  return (
    <div className="page-in" style={{ padding: "20px clamp(16px, 4vw, 48px) 40px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            vibe coding · irl
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, fontWeight: 400, lineHeight: 1.05, fontStyle: "italic" }}>
            Type a feeling. <em style={{ color: "var(--rose)" }}>Get an evening.</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            No optimization. No reviews. Tell us how you are, and we&apos;ll hand you instructions for the next few hours.
          </p>
        </div>

        {/* Bucket list toggle */}
        {isLoggedIn && bucket.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              onClick={() => setShowBucket(!showBucket)}
              className="typewriter"
              style={{
                fontSize: 12,
                letterSpacing: "0.15em",
                color: showBucket ? "var(--paper-light)" : "var(--teal)",
                background: showBucket ? "var(--teal)" : "transparent",
                border: "1.5px solid var(--teal)",
                borderRadius: 20,
                padding: "8px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {showBucket ? "close bucket list" : `my bucket list (${pendingItems.length} pending · ${doneItems.length} done)`}
            </button>
          </div>
        )}

        {/* Bucket List View */}
        {showBucket && (
          <div
            className="paper page-in"
            style={{
              padding: "28px 28px 32px",
              marginBottom: 36,
              background: "#faf3df",
              position: "relative",
            }}
          >
            <div className="tape tape-rose" style={{ top: -12, left: "50%", marginLeft: -40 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <h2 className="serif" style={{ fontSize: 30, fontWeight: 400, fontStyle: "italic", margin: 0 }}>
                Bucket List
              </h2>
              <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.12em" }}>
                {doneItems.length}/{bucket.length} done
              </span>
            </div>

            {/* Progress bar */}
            {bucket.length > 0 && (
              <div style={{ height: 6, background: "var(--ink-faded)", borderRadius: 3, marginBottom: 24, opacity: 0.3 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(doneItems.length / bucket.length) * 100}%`,
                    background: "var(--teal)",
                    borderRadius: 3,
                    transition: "width 0.4s ease",
                    opacity: 1,
                  }}
                />
              </div>
            )}

            {/* Pending items */}
            {pendingItems.length > 0 && (
              <div style={{ marginBottom: doneItems.length > 0 ? 24 : 0 }}>
                <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)", marginBottom: 12, textTransform: "uppercase" }}>
                  to do
                </div>
                {pendingItems.map((item) => (
                  <BucketRow
                    key={item.id}
                    item={item}
                    onToggle={toggleComplete}
                    onRemove={removeFromBucket}
                    disabled={bucketLoading}
                  />
                ))}
              </div>
            )}

            {/* Done items */}
            {doneItems.length > 0 && (
              <div>
                <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)", marginBottom: 12, textTransform: "uppercase" }}>
                  done
                </div>
                {doneItems.map((item) => (
                  <BucketRow
                    key={item.id}
                    item={item}
                    onToggle={toggleComplete}
                    onRemove={removeFromBucket}
                    disabled={bucketLoading}
                  />
                ))}
              </div>
            )}

            {bucket.length === 0 && (
              <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", textAlign: "center", margin: "20px 0" }}>
                Nothing here yet. Add items from your vibe results!
              </p>
            )}
          </div>
        )}

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
            how are you, really?
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

                const alreadyAdded = isInBucket(key, value);

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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-faded)" }}>
                        {config.label}
                      </div>
                      {isLoggedIn && (
                        <button
                          onClick={() => !alreadyAdded && addToBucket(key)}
                          disabled={addingKey === key || alreadyAdded}
                          title={alreadyAdded ? "Already in bucket list" : "Add to bucket list"}
                          style={{
                            background: "none",
                            border: alreadyAdded ? "1.5px solid var(--teal)" : "1.5px dashed var(--ink-faded)",
                            borderRadius: "50%",
                            width: 28,
                            height: 28,
                            cursor: alreadyAdded ? "default" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            color: alreadyAdded ? "var(--teal)" : "var(--ink-faded)",
                            transition: "all 0.2s ease",
                            opacity: addingKey === key ? 0.5 : 1,
                            flexShrink: 0,
                          }}
                        >
                          {alreadyAdded ? "✓" : "+"}
                        </button>
                      )}
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

function BucketRow({
  item,
  onToggle,
  onRemove,
  disabled,
}: {
  item: BucketItem;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const config = cardKinds[item.category];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderBottom: "1px dashed var(--ink-faded)",
        opacity: item.completed ? 0.6 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <button
        onClick={() => onToggle(item.id, item.completed)}
        disabled={disabled}
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          border: item.completed ? "2px solid var(--teal)" : "2px dashed var(--ink-faded)",
          background: item.completed ? "var(--teal)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--paper-light)",
          fontSize: 14,
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        {item.completed ? "✓" : ""}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          className="serif"
          style={{
            fontSize: 18,
            fontWeight: 500,
            textDecoration: item.completed ? "line-through" : "none",
            color: item.completed ? "var(--ink-faded)" : "var(--ink)",
          }}
        >
          {item.item_text}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
          <span className="typewriter" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-faded)", textTransform: "uppercase" }}>
            {config?.emoji} {config?.label.replace(" →", "")}
          </span>
          <span style={{ fontSize: 10, color: "var(--ink-faded)" }}>·</span>
          <span className="hand" style={{ fontSize: 14, color: "var(--ink-faded)" }}>
            &ldquo;{item.vibe_query}&rdquo;
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        title="Remove"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--ink-faded)",
          fontSize: 16,
          padding: "4px 8px",
          opacity: 0.5,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.5"; }}
      >
        ✕
      </button>
    </div>
  );
}
