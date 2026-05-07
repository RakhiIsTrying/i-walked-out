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
        <p className="typewriter" style={{ fontSize: 13, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>
          analyzing...
        </p>
      </div>
    );
  }

  return (
    <div className="page-in" style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        {profile ? (
          <>
            <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 8 }}>
              your archetype
            </p>
            <h1
              className="serif"
              style={{ fontSize: 52, fontStyle: "italic", fontWeight: 400, color: "var(--rose)", lineHeight: 1.1, margin: "0 0 20px" }}
            >
              {profile.archetype}
            </h1>
            <button onClick={generatePersonality} disabled={generating} className="btn-ghost" style={{ fontSize: 13, padding: "8px 18px" }}>
              {generating ? "regenerating..." : "regenerate"}
            </button>
          </>
        ) : (
          <>
            <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 8 }}>
              my mind
            </p>
            <h1
              className="serif"
              style={{ fontSize: 42, fontStyle: "italic", fontWeight: 400, color: "var(--ink)", lineHeight: 1.1, margin: "0 0 20px" }}
            >
              Talk to your future self.
            </h1>
          </>
        )}
      </header>

      {profile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          {/* Summary */}
          <div className="paper" style={{ borderRadius: 3, padding: "36px 28px 28px", position: "relative" }}>
            <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
              Personality Summary
            </p>
            <p className="hand" style={{ fontSize: 22, lineHeight: 1.45, color: "var(--ink-soft)", whiteSpace: "pre-line" }}>
              {profile.summary}
            </p>
          </div>

          <TraitBars profile={profile} />

          {/* Decision Style */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="typewriter"
              style={{
                fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
                padding: "14px 28px", border: "2px solid var(--ink)", borderRadius: 2,
                color: "var(--ink)", textAlign: "center",
              }}
            >
              <span style={{ display: "block", fontSize: 9, color: "var(--ink-faded)", marginBottom: 4, letterSpacing: "0.2em" }}>
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
            <div className="paper" style={{ borderRadius: 3, padding: "28px 24px", position: "relative", textAlign: "center" }}>
              <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
                optional · {dreamCount} dreams logged
              </p>
              <h3 className="serif" style={{ fontSize: 24, fontStyle: "italic", fontWeight: 400, color: "var(--ink)", margin: "0 0 10px" }}>
                Want a sharper conversation?
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink-faded)", lineHeight: 1.5, maxWidth: 420, margin: "0 auto 20px" }}>
                Run a personality analysis on your dead dreams. Your future self will know your patterns, fears, and values — and talk like someone who actually knows you.
              </p>
              <button onClick={generatePersonality} disabled={generating} className="btn-paper" style={{ fontSize: 15, padding: "12px 28px" }}>
                {generating ? "analyzing..." : "analyze my patterns"}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ fontSize: 13, color: "var(--ink-faded)" }}>
                Log {3 - dreamCount} more dream{3 - dreamCount === 1 ? "" : "s"} to unlock personality analysis.
                Chat works fine without it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
