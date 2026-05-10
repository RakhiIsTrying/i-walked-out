"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PersonalityProfile } from "@/lib/types";
import PersonalityChat from "@/components/personality/PersonalityChat";
import TraitBars from "@/components/personality/TraitBars";
import TagsGrid from "@/components/personality/TagsGrid";

export default function PersonalityPage() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);

  useEffect(() => {
    loadPersonality();
  }, []);

  async function loadPersonality() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("dream_count")
      .eq("id", user.id)
      .single();

    setDreamCount(prof?.dream_count || 0);

    const { data } = await supabase
      .from("personality_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }

  async function generatePersonality() {
    setGenerating(true);
    const res = await fetch("/api/personality", { method: "POST" });
    if (res.ok) {
      await loadPersonality();
    }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="page-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.15em", color: "var(--ink-3)" }}>
          analyzing...
        </p>
      </div>
    );
  }

  return (
    <div className="page-in" style={{ padding: "72px 0 40px" }}>
      <div className="wrap" style={{ maxWidth: 860 }}>

        {/* Header */}
        <header style={{ marginBottom: 40 }}>
          {profile ? (
            <>
              <div className="eyebrow">your archetype</div>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 500,
                  fontSize: "clamp(48px, 6.4vw, 72px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.025em",
                  margin: "18px 0 20px",
                  fontStyle: "italic",
                  color: "var(--accent)",
                }}
              >
                {profile.archetype}
              </h1>
              <button onClick={generatePersonality} disabled={generating} className="btn-outline">
                {generating ? "regenerating..." : "regenerate"}
              </button>
            </>
          ) : (
            <>
              <div className="eyebrow">my mind</div>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 400,
                  fontSize: "clamp(48px, 6.4vw, 72px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.025em",
                  margin: "18px 0 18px",
                }}
              >
                Talk to your{" "}
                <em style={{ fontStyle: "italic", fontWeight: 500, color: "var(--accent)" }}>
                  future self.
                </em>
              </h1>
            </>
          )}
        </header>

        {profile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

            {/* Headline */}
            {profile.headline && (
              <div
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  border: "1px solid var(--ink)",
                  borderRadius: 3,
                  padding: "28px 28px",
                  boxShadow: "4px 5px 0 var(--paper-edge)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: "clamp(22px, 3vw, 28px)",
                    lineHeight: 1.35,
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  &ldquo;{profile.headline}&rdquo;
                </p>
              </div>
            )}

            {/* Summary */}
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--ink)",
                borderRadius: 3,
                padding: "36px 28px 28px",
                boxShadow: "4px 5px 0 var(--paper-edge)",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 14,
                }}
              >
                The reading
              </div>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 19,
                  lineHeight: 1.5,
                  color: "var(--ink)",
                  whiteSpace: "pre-line",
                  margin: 0,
                }}
              >
                {profile.summary}
              </p>
            </div>

            <TraitBars profile={profile} />

            {/* Decision Style */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "14px 28px",
                  border: "2px solid var(--ink)",
                  borderRadius: 3,
                  color: "var(--ink)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 9,
                    color: "var(--ink-3)",
                    marginBottom: 4,
                    letterSpacing: "0.2em",
                  }}
                >
                  decision style
                </span>
                {profile.traits.decision_style}
              </div>
            </div>

            <TagsGrid profile={profile} />

            <PersonalityChat
              profile={profile}
              emptyText={"Your future self is waiting...\nAsk anything about your decisions."}
              subtitle="Ask about decisions, regrets, or anything on your mind"
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

            <PersonalityChat
              profile={null}
              emptyText="Say something. Your future self is listening."
              subtitle="Just talk. No analysis required."
            />

            {dreamCount >= 3 ? (
              <div
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--ink)",
                  borderRadius: 3,
                  padding: "28px 24px",
                  boxShadow: "4px 5px 0 var(--paper-edge)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10.5px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--ink-3)",
                    marginBottom: 10,
                  }}
                >
                  optional &middot; {dreamCount} dreams logged
                </div>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 24,
                    fontWeight: 400,
                    color: "var(--ink)",
                    margin: "0 0 10px",
                  }}
                >
                  Want a sharper conversation?
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ink-3)",
                    lineHeight: 1.5,
                    maxWidth: 420,
                    margin: "0 auto 20px",
                  }}
                >
                  Run a personality analysis on your dead dreams. Your future self will know your
                  patterns, fears, and values — and talk like someone who actually knows you.
                </p>
                <button onClick={generatePersonality} disabled={generating} className="btn-ink">
                  {generating ? "analyzing..." : "analyze my patterns"}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
                  Log {3 - dreamCount} more dream{3 - dreamCount === 1 ? "" : "s"} to unlock
                  personality analysis. Chat works fine without it.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
