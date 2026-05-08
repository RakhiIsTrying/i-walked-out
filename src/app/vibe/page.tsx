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
    <div className="page-in" style={{ padding: "72px 0 40px" }}>
      <div className="wrap" style={{ maxWidth: 1080 }}>
        {/* Page intro */}
        <div style={{ marginBottom: 44 }}>
          <div className="eyebrow">vibe coding &middot; irl</div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(48px, 6.4vw, 88px)",
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
              margin: "18px 0 18px",
              maxWidth: "16ch",
            }}
          >
            Type a feeling.{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--accent)",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              Get an evening.
              <span
                style={{
                  position: "absolute",
                  left: "2%",
                  right: "2%",
                  bottom: -4,
                  height: 8,
                  background:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 10' preserveAspectRatio='none'><path d='M2 7 Q 50 1 100 5 T 198 5' stroke='%23b6651e' stroke-width='2' fill='none' stroke-linecap='round'/></svg>\") center / 100% 100% no-repeat",
                }}
              />
            </em>
          </h1>
          <p style={{ maxWidth: "56ch", color: "var(--ink-2)", fontSize: 19, lineHeight: 1.55 }}>
            No optimization. No reviews. Tell us how you are, and we&apos;ll hand you instructions for
            the next few hours.
          </p>
        </div>

        {/* Bucket list toggle */}
        {isLoggedIn && bucket.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setShowBucket(!showBucket)}
              className={`chip ${showBucket ? "on" : ""}`}
            >
              {showBucket ? "close bucket list" : `my bucket list (${pendingCount} pending · ${doneCount} done)`}
            </button>
          </div>
        )}

        {showBucket && <BucketListView bucket={bucket} onToggle={toggleComplete} onRemove={removeFromBucket} disabled={bucketLoading} />}

        {/* Input area */}
        <div
          style={{
            padding: "22px 22px 18px",
            background: "var(--note-1)",
            border: "1px solid var(--ink)",
            borderRadius: 4,
            boxShadow: "6px 6px 0 var(--paper-edge)",
            marginBottom: 30,
            maxWidth: 760,
          }}
        >
          <label
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10.5px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}
          >
            how are you, really?
          </label>
          <form
            onSubmit={(e) => { e.preventDefault(); setActivePreset(null); search(); }}
            className="vibe-input-form"
            style={{ display: "flex", gap: 10, alignItems: "stretch", marginTop: 8 }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="like a sunday afternoon that won't end..."
              style={{
                flex: 1,
                background: "var(--paper)",
                border: "1px solid var(--ink)",
                padding: "14px 16px",
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--ink)",
                borderRadius: 3,
              }}
            />
            <button className="btn-ink" type="submit" disabled={loading || !query.trim()}>
              {loading ? "feeling..." : "make a board ↳"}
            </button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "var(--ink-3)",
              }}
            >
              or borrow a vibe →
            </span>
            <button
              type="button"
              onClick={randomVibe}
              disabled={loading}
              className="chip"
              style={{ fontSize: 11 }}
            >
              ↻ random
            </button>
            {vibeStarters.map((p) => (
              <button
                key={p}
                onClick={() => pickPreset(p)}
                disabled={loading}
                className={`chip ${activePreset === p ? "on" : ""}`}
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  fontSize: 14,
                  letterSpacing: 0,
                  textTransform: "none",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 24,
                color: "var(--ink-3)",
              }}
            >
              feeling...
            </p>
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

      <style>{`
        @media (max-width: 600px) {
          .vibe-input-form {
            flex-direction: column !important;
          }
          .vibe-input-form input {
            font-size: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
