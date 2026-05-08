"use client";

import { useState, useEffect, useCallback } from "react";
import { VibeResult } from "@/lib/types";
import BucketListView from "@/components/vibe/BucketListView";
import VibeResultBoard from "@/components/vibe/VibeResultBoard";
import VibeHistory from "@/components/vibe/VibeHistory";

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

  useEffect(() => { loadBucket(); }, [loadBucket]);

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
      body: JSON.stringify({ vibe_query: result.query, category: key, item_text: result[key as keyof VibeResult] }),
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
          item.id === id ? { ...item, completed: !completed, completed_at: !completed ? new Date().toISOString() : null } : item
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
    if (res.ok) setBucket((prev) => prev.filter((item) => item.id !== id));
  }

  function isInBucket(key: string, text: string) {
    return bucket.some((b) => b.category === key && b.item_text === text);
  }

  const pendingCount = bucket.filter((b) => !b.completed).length;
  const doneCount = bucket.filter((b) => b.completed).length;

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
                fontSize: 12, letterSpacing: "0.15em",
                color: showBucket ? "var(--paper-light)" : "var(--teal)",
                background: showBucket ? "var(--teal)" : "transparent",
                border: "1.5px solid var(--teal)", borderRadius: 20,
                padding: "8px 20px", cursor: "pointer", transition: "all 0.2s ease",
              }}
            >
              {showBucket ? "close bucket list" : `my bucket list (${pendingCount} pending · ${doneCount} done)`}
            </button>
          </div>
        )}

        {showBucket && <BucketListView bucket={bucket} onToggle={toggleComplete} onRemove={removeFromBucket} disabled={bucketLoading} />}

        {/* Input area */}
        <div className="paper" style={{ padding: "26px 28px", background: "#faf3df", margin: "0 auto 30px", maxWidth: 760, position: "relative" }}>
          <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>
            how are you, really?
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setActivePreset(null); search(); }} style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="like a sunday afternoon that won't end..."
              className="hand"
              style={{
                flex: 1, background: "var(--paper-light)", border: "1px dashed var(--ink-faded)",
                padding: "14px 16px", fontSize: 24, color: "var(--ink-soft)",
                fontFamily: "'Caveat', cursive", outline: "none", borderRadius: 2,
              }}
            />
            <button className="btn-paper" type="submit" disabled={loading || !query.trim()}>
              {loading ? "feeling..." : "make a board"}
              <span style={{ fontSize: 18 }}>↳</span>
            </button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
            <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>or borrow a vibe →</span>
            <button type="button" onClick={randomVibe} disabled={loading} className="typewriter"
              style={{ fontSize: 11, color: "var(--teal)", background: "none", border: "1px dashed var(--teal)", borderRadius: 2, padding: "4px 10px", cursor: "pointer", marginRight: 4 }}>
              ↻ random
            </button>
            {vibeStarters.map((p) => (
              <button key={p} onClick={() => pickPreset(p)} disabled={loading} className="hand"
                style={{
                  padding: "4px 12px",
                  background: activePreset === p ? "var(--ink)" : "transparent",
                  color: activePreset === p ? "var(--paper-light)" : "var(--ink)",
                  border: `1.5px solid ${activePreset === p ? "var(--ink)" : "var(--ink-faded)"}`,
                  fontSize: 18, cursor: "pointer", borderRadius: 14,
                  fontFamily: "'Caveat', cursive", transition: "all 0.2s ease",
                  opacity: loading ? 0.5 : 1,
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p className="hand" style={{ fontSize: 26, color: "var(--ink-faded)" }}>feeling...</p>
          </div>
        )}

        {result && !loading && (
          <VibeResultBoard
            result={result}
            isLoggedIn={isLoggedIn}
            addingKey={addingKey}
            onAddToBucket={addToBucket}
            onAnotherEvening={randomVibe}
            isInBucket={isInBucket}
          />
        )}

        <VibeHistory
          history={history}
          onSelect={(h) => { setResult(h); setQuery(h.query); setActivePreset(null); }}
        />
      </div>
    </div>
  );
}
