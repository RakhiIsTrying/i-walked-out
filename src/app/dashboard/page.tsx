"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dream, DreamCategory } from "@/lib/types";
import DreamCard from "@/components/DreamCard";

import Link from "next/link";

const categories: {
  value: DreamCategory;
  label: string;
}[] = [
  { value: "career", label: "Career" },
  { value: "relationship", label: "Relationship" },
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

const emotions = [
  "relieved",
  "regretful",
  "indifferent",
  "scared",
  "liberated",
  "conflicted",
  "numb",
  "reflective",
];

export default function DashboardPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);
  const [personalityReady, setPersonalityReady] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DreamCategory>("other");
  const [emotion, setEmotion] = useState("reflective");

  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    loadDreams();
    checkTelegram();
  }, []);

  async function loadDreams() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("dream_count, personality_generated")
      .eq("id", user.id)
      .single();

    if (profile) {
      setDreamCount(profile.dream_count);
      setPersonalityReady(profile.personality_generated);
    }

    const { data } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setDreams(data || []);
    setLoading(false);
  }

  async function checkTelegram() {
    const res = await fetch("/api/telegram/link");
    if (res.ok) {
      const data = await res.json();
      setTelegramLinked(data.linked);
      if (data.link?.telegram_username) {
        setTelegramUsername(data.link.telegram_username);
      }
      if (data.pendingCode) {
        setLinkCode(data.pendingCode);
      }
    }
  }

  async function generateLinkCode() {
    setTelegramLoading(true);
    const res = await fetch("/api/telegram/link", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLinkCode(data.code);
    }
    setTelegramLoading(false);
  }

  async function unlinkTelegram() {
    await fetch("/api/telegram/link", { method: "DELETE" });
    setTelegramLinked(false);
    setTelegramUsername(null);
    setLinkCode(null);
  }

  function copyCode() {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/dreams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, emotion }),
    });

    if (res.ok) {
      setTitle("");
      setDescription("");
      setCategory("other");
      setEmotion("reflective");
      setShowForm(false);
      loadDreams();
    }

    setSubmitting(false);
  }

  return (
    <div className="page-in" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* ── Welcome + Stats ── */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 24, marginBottom: 28 }}>
          <div>
            <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 8 }}>
              your graveyard
            </p>
            <h1 className="serif" style={{ fontSize: "clamp(32px, 5vw, 48px)", fontStyle: "italic", fontWeight: 400, color: "var(--ink)", margin: 0, lineHeight: 1.1 }}>
              Welcome back.
            </h1>
          </div>

          {/* Stats capsules */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{
              background: "var(--paper-light)", border: "1px solid rgba(106,112,140,0.15)",
              borderRadius: 4, padding: "12px 20px", textAlign: "center", minWidth: 90,
            }}>
              <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: "var(--ink)", lineHeight: 1 }}>{dreamCount}</div>
              <div className="typewriter" style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-faded)", marginTop: 4, textTransform: "uppercase" }}>dreams</div>
            </div>
            <div style={{
              background: "var(--paper-light)", border: "1px solid rgba(106,112,140,0.15)",
              borderRadius: 4, padding: "12px 20px", textAlign: "center", minWidth: 90,
            }}>
              <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: personalityReady ? "var(--teal)" : "var(--ink-faded)", lineHeight: 1 }}>
                {personalityReady ? "Yes" : "No"}
              </div>
              <div className="typewriter" style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-faded)", marginTop: 4, textTransform: "uppercase" }}>profile</div>
            </div>
            <div style={{
              background: "var(--paper-light)", border: "1px solid rgba(106,112,140,0.15)",
              borderRadius: 4, padding: "12px 20px", textAlign: "center", minWidth: 90,
            }}>
              <div className="serif" style={{ fontSize: 28, fontWeight: 500, color: telegramLinked ? "var(--teal)" : "var(--ink-faded)", lineHeight: 1 }}>
                {telegramLinked ? "On" : "Off"}
              </div>
              <div className="typewriter" style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-faded)", marginTop: 4, textTransform: "uppercase" }}>telegram</div>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-paper"
          >
            {showForm ? "cancel" : "walk out"} {showForm ? "×" : "↳"}
          </button>

          {dreamCount >= 3 && (
            <Link
              href="/personality"
              className="btn-ghost"
              style={{ fontSize: 14 }}
            >
              {personalityReady ? "view personality" : "generate personality"} &rarr;
            </Link>
          )}
        </div>
      </header>

      {/* ── Dream Form ── */}
      {showForm && (
        <section
          className="paper page-in"
          style={{ borderRadius: 3, padding: "36px 28px 28px", marginBottom: 48, position: "relative" }}
        >
          <h2 className="serif" style={{ fontSize: 24, fontStyle: "italic", fontWeight: 400, color: "var(--ink)", marginBottom: 24 }}>
            what are you letting go of?
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title */}
            <input
              type="text"
              placeholder="What did you walk away from?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="typewriter"
              style={{ fontSize: 13, letterSpacing: "0.04em", width: "100%" }}
              required
            />

            {/* Description */}
            <textarea
              placeholder="Tell the story. Why did you give it up? What was the last straw?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="hand"
              style={{ fontSize: 20, lineHeight: 1.45, minHeight: 120, resize: "vertical", width: "100%" }}
              required
            />

            {/* Category pills */}
            <div>
              <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
                Category
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {categories.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="typewriter"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "6px 14px",
                      border: category === c.value ? "1.5px solid var(--ink)" : "1px dashed var(--ink-faded)",
                      borderRadius: 2,
                      background: category === c.value ? "var(--ink)" : "transparent",
                      color: category === c.value ? "var(--paper-light)" : "var(--ink-faded)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emotion pills */}
            <div>
              <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
                How did it feel?
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {emotions.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmotion(em)}
                    className="typewriter"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      padding: "6px 14px",
                      border: emotion === em ? "1.5px solid var(--rose)" : "1px dashed var(--ink-faded)",
                      borderRadius: 2,
                      background: emotion === em ? "var(--rose)" : "transparent",
                      color: emotion === em ? "var(--paper-light)" : "var(--ink-faded)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-paper"
              >
                {submitting ? "walking out..." : "walk out ↳"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Telegram Section ── */}
      <section
        style={{
          borderRadius: 4, padding: "20px 24px", marginBottom: 48,
          background: "var(--paper-light)", border: "1px solid rgba(106,112,140,0.15)",
        }}
      >
        {telegramLinked ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "rgba(42,95,214,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>
                T
              </div>
              <div>
                <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", margin: 0 }}>
                  Telegram Bot
                </p>
                <p className="serif" style={{ fontSize: 16, color: "var(--teal)", margin: 0 }}>
                  Connected{telegramUsername ? ` as @${telegramUsername}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={unlinkTelegram}
              className="typewriter"
              style={{ fontSize: 11, padding: "6px 14px", color: "var(--rose)", background: "none", border: "1px solid var(--rose)", borderRadius: 2, cursor: "pointer", letterSpacing: "0.08em" }}
            >
              disconnect
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "rgba(106,112,140,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>
                T
              </div>
              <div>
                <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", margin: 0 }}>
                  Telegram Bot
                </p>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
                  Connect to log dreams from Telegram
                </p>
              </div>
            </div>

            {linkCode ? (
              <div className="page-in" style={{ padding: "16px 20px", background: "var(--paper-deep)", borderRadius: 3, marginTop: 8 }}>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>
                  Open <strong>@IWalkedOutBot</strong> on Telegram and send:
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <code
                    className="typewriter"
                    style={{
                      fontSize: 18, letterSpacing: "0.08em", color: "var(--teal)",
                      background: "var(--paper-light)", padding: "10px 16px",
                      borderRadius: 2, border: "1px solid rgba(106,112,140,0.15)", flex: 1,
                    }}
                  >
                    /link {linkCode}
                  </code>
                  <button onClick={copyCode} className="btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>
                    {codeCopied ? "copied!" : "copy"}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                  <p className="typewriter" style={{ fontSize: 9, color: "var(--ink-faded)", margin: 0, letterSpacing: "0.1em" }}>
                    code expired?
                  </p>
                  <button
                    onClick={generateLinkCode} disabled={telegramLoading}
                    className="typewriter"
                    style={{ fontSize: 10, padding: "4px 10px", color: "var(--teal)", background: "none", border: "1px dashed var(--teal)", borderRadius: 2, cursor: "pointer" }}
                  >
                    {telegramLoading ? "..." : "regenerate"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={generateLinkCode} disabled={telegramLoading} className="btn-paper" style={{ fontSize: 13 }}>
                {telegramLoading ? "generating..." : "generate link code"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Dream List ── */}
      {!loading && dreams.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", margin: 0, whiteSpace: "nowrap" }}>
            your dreams ({dreams.length})
          </p>
          <div style={{ flex: 1, height: 1, background: "rgba(106,112,140,0.15)" }} />
        </div>
      )}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 4, padding: "28px 20px",
                background: "var(--paper-light)", border: "1px solid rgba(106,112,140,0.1)",
                opacity: 0.5,
              }}
            >
              <div style={{ height: 10, width: "40%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 12 }} />
              <div style={{ height: 16, width: "90%", background: "var(--paper-deep)", borderRadius: 2, marginBottom: 8 }} />
              <div style={{ height: 16, width: "65%", background: "var(--paper-deep)", borderRadius: 2 }} />
            </div>
          ))}
        </div>
      ) : dreams.length === 0 ? (
        /* Empty state */
        <div className="page-in" style={{ textAlign: "center", padding: "80px 20px" }}>
          <p className="hand" style={{ fontSize: 28, color: "var(--ink-faded)", lineHeight: 1.4, maxWidth: 400, margin: "0 auto" }}>
            No ghosts here yet. Every dream you walk away from deserves a proper farewell.
          </p>
          <p className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)", letterSpacing: "0.12em", marginTop: 20, opacity: 0.6 }}>
            click &quot;walk out&quot; to begin
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
          {dreams.map((dream, index) => (
            <div
              key={dream.id}
              className="page-in"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <DreamCard dream={dream} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
