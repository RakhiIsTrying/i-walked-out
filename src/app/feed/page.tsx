"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dream, DreamCategory } from "@/lib/types";
import DreamCard from "@/components/DreamCard";

const filterTags: { label: string; value: string }[] = [
  { label: "all", value: "all" },
  { label: "self", value: "health" },
  { label: "love", value: "relationship" },
  { label: "career", value: "career" },
  { label: "creative", value: "creative" },
  { label: "family", value: "other" },
  { label: "business", value: "business" },
  { label: "education", value: "education" },
  { label: "travel", value: "travel" },
];

const categoryOptions: { label: string; value: DreamCategory }[] = [
  { label: "Career", value: "career" },
  { label: "Relationship", value: "relationship" },
  { label: "Creative", value: "creative" },
  { label: "Business", value: "business" },
  { label: "Education", value: "education" },
  { label: "Travel", value: "travel" },
  { label: "Health", value: "health" },
  { label: "Other", value: "other" },
];

function SkeletonCard() {
  return (
    <div className="paper" style={{ borderRadius: 3, padding: "32px 22px 18px", opacity: 0.5 }}>
      <div style={{ height: 10, width: "40%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 10 }} />
      <div style={{ height: 18, width: "100%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 18, width: "85%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 18, width: "60%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 16 }} />
      <div style={{ borderTop: "1.5px dashed var(--paper-deep)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
        <div style={{ height: 8, width: 60, background: "var(--paper-deep)", borderRadius: 2 }} />
        <div style={{ height: 8, width: 40, background: "var(--paper-deep)", borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [composeTitle, setComposeTitle] = useState("");
  const [composeDesc, setComposeDesc] = useState("");
  const [composeCategory, setComposeCategory] = useState<DreamCategory>("other");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function loadDreams() {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("dreams")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (filter !== "all") query = query.eq("category", filter);
    const { data } = await query;
    setDreams(data || []);
    setLoading(false);
  }

  async function handleCompose(e: React.FormEvent) {
    e.preventDefault();
    if (!composeTitle.trim() || !composeDesc.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: composeTitle, description: composeDesc, category: composeCategory, emotion: "reflective" }),
      });
      if (res.ok) {
        setComposeTitle("");
        setComposeDesc("");
        setComposeCategory("other");
        loadDreams();
      }
    } catch { /* silent */ } finally { setSubmitting(false); }
  }

  const filtered = search
    ? dreams.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()))
    : dreams;

  return (
    <div className="page-in" style={{ padding: "20px clamp(16px, 4vw, 48px) 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="feed-header-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32, alignItems: "start", marginBottom: 24 }}>
          {/* Header */}
          <div>
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
              the wall · everyone
            </div>
            <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", fontStyle: "italic" }}>
              Dreams strangers <em style={{ color: "var(--rose)" }}>have set down.</em>
            </h1>
            <p style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 14, maxWidth: 520, lineHeight: 1.5 }}>
              Pinned in the order they arrived. Hover to lift one off the wall.
            </p>
          </div>

          {/* Compose card */}
          <form
            onSubmit={handleCompose}
            className="paper"
            style={{ padding: 26, background: "#faf3df", position: "relative" }}
          >
            <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 12 }}>
              pin a new one
            </div>
            <h3 className="serif" style={{ fontSize: 28, margin: 0, marginBottom: 16, fontStyle: "italic", fontWeight: 400 }}>
              what are you letting go of?
            </h3>
            <input
              type="text"
              placeholder="a short title..."
              value={composeTitle}
              onChange={(e) => setComposeTitle(e.target.value)}
              className="typewriter"
              style={{ width: "100%", fontSize: 12, padding: "8px 10px", marginBottom: 10 }}
            />
            <textarea
              placeholder="describe what you're walking away from..."
              value={composeDesc}
              onChange={(e) => setComposeDesc(e.target.value)}
              className="hand"
              rows={3}
              style={{ width: "100%", fontSize: 22, lineHeight: 1.3, padding: "10px 10px", marginBottom: 10, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <select
                value={composeCategory}
                onChange={(e) => setComposeCategory(e.target.value as DreamCategory)}
                className="typewriter"
                style={{ fontSize: 11, padding: "7px 10px", flex: 1 }}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-paper"
              disabled={submitting || !composeTitle.trim() || !composeDesc.trim()}
              style={{ width: "100%", justifyContent: "center", fontSize: 14 }}
            >
              {submitting ? "pinning..." : "pin to the wall 📌"}
            </button>
          </form>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginRight: 10 }}>
            sort by feeling →
          </span>
          {filterTags.map((t) => (
            <button
              key={t.value + t.label}
              onClick={() => setFilter(t.value)}
              className="typewriter"
              style={{
                padding: "6px 14px",
                background: filter === t.value ? "var(--ink)" : "transparent",
                color: filter === t.value ? "var(--paper-light)" : "var(--ink)",
                border: `1.5px solid ${filter === t.value ? "var(--ink)" : "var(--ink-faded)"}`,
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.2s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <input
            type="text"
            placeholder="search dreams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="typewriter"
            style={{ fontSize: 12, padding: "8px 12px", flex: 1, maxWidth: 320 }}
          />
          {!loading && (
            <span className="hand" style={{ fontSize: 20, color: "var(--ink-faded)" }}>
              {filtered.length} on the wall
            </span>
          )}
        </div>

        {/* The wall */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 28 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="page-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
            <p className="hand" style={{ fontSize: 28, color: "var(--ink-faded)", marginBottom: 8 }}>
              nothing pinned here yet...
            </p>
            <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", opacity: 0.7 }}>
              be the first to pin something to the wall
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 28, paddingTop: 20, paddingBottom: 40 }}>
            {filtered.map((dream, i) => (
              <div key={dream.id} className="page-in" style={{ animationDelay: `${i * 0.06}s`, display: "flex", justifyContent: "center" }}>
                <DreamCard dream={dream} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
