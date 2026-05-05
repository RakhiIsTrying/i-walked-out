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

/* ── Skeleton card for loading state ── */
function SkeletonCard() {
  return (
    <div
      className="paper"
      style={{
        borderRadius: 3,
        padding: "32px 22px 18px",
        opacity: 0.5,
      }}
    >
      <div
        style={{
          height: 10,
          width: "40%",
          background: "var(--paper-deep)",
          borderRadius: 2,
          marginBottom: 10,
        }}
      />
      <div
        style={{
          height: 18,
          width: "100%",
          background: "var(--paper-deep)",
          borderRadius: 2,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 18,
          width: "85%",
          background: "var(--paper-deep)",
          borderRadius: 2,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 18,
          width: "60%",
          background: "var(--paper-deep)",
          borderRadius: 2,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          borderTop: "1.5px dashed var(--paper-deep)",
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            height: 8,
            width: 60,
            background: "var(--paper-deep)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            height: 8,
            width: 40,
            background: "var(--paper-deep)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Feed Page
   ══════════════════════════════════════════ */
export default function FeedPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* Compose form state */
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDesc, setComposeDesc] = useState("");
  const [composeAuthor, setComposeAuthor] = useState("");
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

    if (filter !== "all") {
      query = query.eq("category", filter);
    }

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
        body: JSON.stringify({
          title: composeTitle,
          description: composeDesc,
          category: composeCategory,
          emotion: "reflective",
        }),
      });
      if (res.ok) {
        setComposeTitle("");
        setComposeDesc("");
        setComposeAuthor("");
        setComposeCategory("other");
        loadDreams();
      }
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = search
    ? dreams.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.description.toLowerCase().includes(search.toLowerCase())
      )
    : dreams;

  return (
    <div className="page-in" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 60px" }}>

      {/* ── Top section: 2-column grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 32,
          marginBottom: 40,
          alignItems: "start",
        }}
      >
        {/* Left: Section header */}
        <div>
          <p
            className="typewriter"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faded)",
              marginBottom: 8,
            }}
          >
            the wall &middot; everyone
          </p>
          <h1
            className="serif"
            style={{
              fontSize: 36,
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--ink)",
              lineHeight: 1.15,
              marginBottom: 10,
            }}
          >
            Dreams strangers{" "}
            <em style={{ color: "var(--rose)" }}>have set down.</em>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-faded)",
              lineHeight: 1.6,
              maxWidth: 420,
            }}
          >
            A pinboard of things people walked away from, anonymously, quietly.
          </p>
        </div>

        {/* Right: Compose card */}
        <form
          onSubmit={handleCompose}
          className="paper"
          style={{
            borderRadius: 3,
            padding: "28px 22px 22px",
            position: "relative",
          }}
        >
          {/* Two tape pieces at top */}
          <div
            className="tape"
            style={{ top: -10, left: 18, transform: "rotate(-3deg)" }}
          />
          <div
            className="tape tape-rose"
            style={{ top: -10, right: 18, transform: "rotate(4deg)" }}
          />

          <p
            className="typewriter"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faded)",
              textAlign: "center",
              marginBottom: 8,
              marginTop: 4,
            }}
          >
            &#10022; pin a new one &#10022;
          </p>

          <h3
            className="serif"
            style={{
              fontSize: 20,
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--ink)",
              textAlign: "center",
              marginBottom: 14,
              lineHeight: 1.25,
            }}
          >
            what are you letting go of?
          </h3>

          {/* Title input */}
          <input
            type="text"
            placeholder="a short title..."
            value={composeTitle}
            onChange={(e) => setComposeTitle(e.target.value)}
            className="typewriter"
            style={{
              width: "100%",
              fontSize: 12,
              padding: "8px 10px",
              marginBottom: 10,
            }}
          />

          {/* Description textarea */}
          <textarea
            placeholder="describe what you're walking away from..."
            value={composeDesc}
            onChange={(e) => setComposeDesc(e.target.value)}
            className="hand"
            rows={3}
            style={{
              width: "100%",
              fontSize: 22,
              lineHeight: 1.3,
              padding: "10px 10px",
              marginBottom: 10,
              resize: "vertical",
            }}
          />

          {/* Author + category row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="your alias (optional)"
              value={composeAuthor}
              onChange={(e) => setComposeAuthor(e.target.value)}
              className="typewriter"
              style={{ flex: 1, fontSize: 11, padding: "7px 10px" }}
            />
            <select
              value={composeCategory}
              onChange={(e) => setComposeCategory(e.target.value as DreamCategory)}
              className="typewriter"
              style={{ fontSize: 11, padding: "7px 10px", minWidth: 100 }}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
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

      {/* ── Filters + search ── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <span
            className="typewriter"
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-faded)",
              whiteSpace: "nowrap",
            }}
          >
            sort by feeling &rarr;
          </span>

          {filterTags.map((tag) => (
            <button
              key={tag.value + tag.label}
              onClick={() => setFilter(tag.value)}
              className="typewriter"
              style={{
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "5px 14px",
                borderRadius: 2,
                border:
                  filter === tag.value
                    ? "1.5px solid var(--ink)"
                    : "1.5px solid var(--ink-faded)",
                background:
                  filter === tag.value ? "var(--ink)" : "transparent",
                color:
                  filter === tag.value
                    ? "var(--paper-light)"
                    : "var(--ink)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Search + count row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <input
            type="text"
            placeholder="search dreams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="typewriter"
            style={{
              fontSize: 12,
              padding: "8px 12px",
              flex: 1,
              maxWidth: 320,
            }}
          />
          {!loading && (
            <span
              className="hand"
              style={{
                fontSize: 18,
                color: "var(--ink-faded)",
                whiteSpace: "nowrap",
              }}
            >
              {filtered.length} on the wall
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 28,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="page-in" style={{ animationDelay: `${i * 0.06}s` }}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 20px",
            textAlign: "center",
          }}
        >
          <p
            className="hand"
            style={{
              fontSize: 28,
              color: "var(--ink-faded)",
              marginBottom: 8,
            }}
          >
            nothing pinned here yet...
          </p>
          <p
            className="typewriter"
            style={{
              fontSize: 11,
              color: "var(--ink-faded)",
              opacity: 0.7,
            }}
          >
            be the first to pin something to the wall
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 28,
          }}
        >
          {filtered.map((dream, i) => (
            <div
              key={dream.id}
              className="page-in"
              style={{
                animationDelay: `${i * 0.06}s`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <DreamCard dream={dream} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
