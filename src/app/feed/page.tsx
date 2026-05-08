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
    <div style={{
      backgroundColor: "var(--note-1)",
      border: "1px solid var(--ink)",
      boxShadow: "4px 5px 0 var(--paper-edge)",
      borderRadius: 3,
      padding: "22px 20px 16px",
      opacity: 0.5,
      position: "relative" as const,
    }}>
      <div style={{ height: 10, width: "40%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 10 }} />
      <div style={{ height: 18, width: "100%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 18, width: "85%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 18, width: "60%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 16 }} />
      <div style={{ borderTop: "1px dashed var(--rule)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
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

        {/* Page intro */}
        <section style={{ marginBottom: 36 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 14,
            }}
          >
            the wall · everyone
          </div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: "clamp(48px, 6.4vw, 88px)",
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            Dreams strangers{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>have set down.</em>
          </h1>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              color: "var(--ink-2)",
              marginTop: 14,
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            Pinned in the order they arrived. No likes. No threads. Hover to lift one off the wall — drop a small ribbon if it lands, walk on if it doesn't.
          </p>
        </section>

        {/* Compose card */}
        <section style={{ marginBottom: 36 }}>
          <form
            onSubmit={handleCompose}
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink)",
              boxShadow: "6px 6px 0 var(--paper-edge)",
              padding: 24,
              borderRadius: 4,
              maxWidth: 540,
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1px dashed var(--rule)",
                paddingBottom: 10,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                Pin a new one
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                anonymous by default
              </span>
            </div>

            <h3
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 26,
                margin: "6px 0 14px",
                letterSpacing: "-0.01em",
                color: "var(--ink)",
              }}
            >
              What are you letting go of?
            </h3>

            <input
              type="text"
              placeholder="a short title..."
              value={composeTitle}
              onChange={(e) => setComposeTitle(e.target.value)}
              style={{
                width: "100%",
                fontFamily: "var(--mono)",
                fontSize: 12,
                padding: "8px 10px",
                marginBottom: 10,
                border: "1px solid var(--rule)",
                borderRadius: 3,
                background: "transparent",
                color: "var(--ink)",
                outline: "none",
              }}
            />

            <textarea
              placeholder="today i'm releasing..."
              value={composeDesc}
              onChange={(e) => setComposeDesc(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                border: 0,
                outline: "none",
                resize: "none",
                background: "transparent",
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 22,
                lineHeight: 1.35,
                color: "var(--ink)",
                minHeight: 88,
                marginBottom: 10,
              }}
            />

            {/* Category chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setComposeCategory(opt.value)}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "6px 16px",
                    background: composeCategory === opt.value ? "var(--ink)" : "transparent",
                    color: composeCategory === opt.value ? "var(--paper)" : "var(--ink-2)",
                    border: "1px solid var(--rule)",
                    borderRadius: 999,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 14,
                borderTop: "1px dashed var(--rule)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                it'll appear pinned within seconds
              </span>
              <button
                type="submit"
                disabled={submitting || !composeTitle.trim() || !composeDesc.trim()}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "10px 22px",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: "1px solid var(--ink)",
                  borderRadius: 999,
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting || !composeTitle.trim() || !composeDesc.trim() ? 0.5 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                {submitting ? "pinning..." : "Pin it to the wall 📌"}
              </button>
            </div>
          </form>
        </section>

        {/* Filter bar */}
        <div
          style={{
            borderTop: "1px solid var(--ink)",
            borderBottom: "1px solid var(--ink)",
            padding: "16px 0",
            background: "var(--paper)",
            position: "sticky",
            top: 88,
            zIndex: 40,
            marginBottom: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginRight: 8,
              }}
            >
              Sort by feeling
            </span>
            {filterTags.map((t) => (
              <button
                key={t.value + t.label}
                onClick={() => setFilter(t.value)}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "6px 16px",
                  background: filter === t.value ? "var(--ink)" : "transparent",
                  color: filter === t.value ? "var(--paper)" : "var(--ink-2)",
                  border: filter === t.value ? "1px solid var(--ink)" : "1px solid var(--rule)",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {t.label}
              </button>
            ))}
            <span style={{ flex: 1 }} />
            {!loading && (
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  color: "var(--ink-2)",
                  fontSize: 16,
                }}
              >
                <strong style={{ fontStyle: "normal", color: "var(--accent)", fontWeight: 500 }}>
                  {filtered.length}
                </strong>{" "}
                dreams on the wall
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0" }}>
          <input
            type="text"
            placeholder="search dreams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              letterSpacing: "0.08em",
              padding: "8px 12px",
              flex: 1,
              maxWidth: 320,
              border: "1px solid var(--rule)",
              borderRadius: 3,
              background: "transparent",
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </div>

        {/* The pinboard */}
        {loading ? (
          <div className="pin-grid-responsive" style={{ columnCount: 4, columnGap: 22, padding: "56px 0 40px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 24 }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 28,
                color: "var(--ink-3)",
                marginBottom: 8,
              }}
            >
              nothing pinned here yet...
            </p>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                opacity: 0.7,
              }}
            >
              be the first to pin something to the wall
            </p>
          </div>
        ) : (
          <section
            style={{
              padding: "56px 0 40px",
              position: "relative",
            }}
          >
            {/* Cork-board grid lines behind the cards */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent 0 47px, rgba(60,40,20,0.04) 47px 48px), repeating-linear-gradient(90deg, transparent 0 47px, rgba(60,40,20,0.04) 47px 48px)",
                pointerEvents: "none",
              }}
            />
            <div
              className="pin-grid-responsive"
              style={{
                columnCount: 4,
                columnGap: 22,
                position: "relative",
              }}
            >
              {filtered.map((dream, i) => (
                <DreamCard key={dream.id} dream={dream} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Responsive overrides via inline style tag */}
      <style>{`
        @media (max-width: 980px) {
          .pin-grid-responsive { column-count: 2 !important; }
        }
        @media (max-width: 560px) {
          .pin-grid-responsive { column-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}
