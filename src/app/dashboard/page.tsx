"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dream } from "@/lib/types";
import DreamCard from "@/components/DreamCard";
import DreamForm from "@/components/dashboard/DreamForm";
import TelegramSection from "@/components/dashboard/TelegramSection";
import DailyPromptCard from "@/components/dashboard/DailyPromptCard";
import NigelThought from "@/components/dashboard/NigelThought";
import Link from "next/link";

export default function DashboardPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);
  const [personalityReady, setPersonalityReady] = useState(false);

  useEffect(() => {
    loadDreams();
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

  function handleFormSubmitted() {
    setShowForm(false);
    loadDreams();
  }

  return (
    <div className="page-in" style={{ padding: "72px 0 40px" }}>
      <div className="wrap" style={{ maxWidth: 960 }}>

        {/* Welcome + Stats */}
        <header style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 24, marginBottom: 28 }}>
            <div>
              <div className="eyebrow">your graveyard</div>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontWeight: 400,
                  fontSize: "clamp(40px, 5vw, 64px)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.025em",
                  margin: "18px 0 0",
                  fontStyle: "italic",
                }}
              >
                Welcome back.
              </h1>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <StatCapsule value={String(dreamCount)} label="dreams" />
              <StatCapsule value={personalityReady ? "Yes" : "No"} label="profile" accent={personalityReady} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <button onClick={() => setShowForm(!showForm)} className="btn-ink">
              {showForm ? "cancel ×" : "walk out ↳"}
            </button>
            {dreamCount >= 3 && (
              <Link href="/personality" className="btn-outline">
                {personalityReady ? "view personality" : "generate personality"} →
              </Link>
            )}
          </div>
        </header>

        {showForm && <DreamForm onSubmitted={handleFormSubmitted} />}

        {/* Daily Prompt + Nigel Thought */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 20, margin: "32px 0" }}>
          <DailyPromptCard onRespond={() => setShowForm(true)} />
          <NigelThought />
        </div>

        {/* Onboarding */}
        {!loading && (dreamCount < 3 || !personalityReady) && (
          <OnboardingSteps dreamCount={dreamCount} personalityReady={personalityReady} onWalkOut={() => setShowForm(true)} />
        )}

        <TelegramSection />

        {/* Dream List */}
        {!loading && dreams.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                whiteSpace: "nowrap",
              }}
            >
              your dreams ({dreams.length})
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
          </div>
        )}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  borderRadius: 3,
                  padding: "28px 20px",
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
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
          <div className="page-in" style={{ textAlign: "center", padding: "80px 20px" }}>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 24,
                color: "var(--ink-3)",
                lineHeight: 1.4,
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              No ghosts here yet. Every dream you walk away from deserves a proper farewell.
            </p>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--ink-3)",
                letterSpacing: "0.12em",
                marginTop: 20,
                opacity: 0.6,
              }}
            >
              click &quot;walk out&quot; to begin
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
            {dreams.map((dream, index) => (
              <div key={dream.id} className="page-in" style={{ animationDelay: `${index * 0.06}s` }}>
                <DreamCard dream={dream} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingSteps({ dreamCount, personalityReady, onWalkOut }: { dreamCount: number; personalityReady: boolean; onWalkOut: () => void }) {
  const steps = [
    {
      num: 1,
      title: "Release 3 dreams",
      desc: "What did you walk away from? A career, a relationship, a hobby — anything you quit.",
      done: dreamCount >= 3,
      progress: `${Math.min(dreamCount, 3)}/3`,
      action: dreamCount < 3 ? onWalkOut : undefined,
      actionLabel: "walk out ↳",
    },
    {
      num: 2,
      title: "Meet yourself",
      desc: "We'll build your personality profile from what you let go of. What you quit says more than what you keep.",
      done: personalityReady,
      progress: personalityReady ? "done" : dreamCount >= 3 ? "ready" : "locked",
      href: dreamCount >= 3 ? "/personality" : undefined,
      actionLabel: personalityReady ? "view profile →" : "generate →",
    },
    {
      num: 3,
      title: "Talk to Nigel",
      desc: "A satirist assembled from abandoned dreams. He'll say what you already know but hoped no one would point out.",
      done: false,
      progress: personalityReady ? "ready" : "locked",
      href: personalityReady ? "/nigel" : undefined,
      actionLabel: "meet nigel →",
    },
  ];

  return (
    <div style={{
      margin: "32px 0",
      background: "var(--paper)",
      border: "1.5px solid var(--ink)",
      borderRadius: 4,
      boxShadow: "6px 6px 0 var(--paper-edge)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px dashed var(--ink-3)",
        background: "rgba(60,40,20,0.03)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          your journey
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)" }}>
          {steps.filter(s => s.done).length}/{steps.length} COMPLETE
        </span>
      </div>

      <div style={{ padding: "8px 0" }}>
        {steps.map((step, i) => {
          const locked = step.progress === "locked";
          return (
            <div key={step.num} style={{
              padding: "20px 24px",
              display: "grid",
              gridTemplateColumns: "36px 1fr auto",
              gap: 16,
              alignItems: "center",
              borderBottom: i < steps.length - 1 ? "1px dashed var(--rule)" : "none",
              opacity: locked ? 0.45 : 1,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `2px solid ${step.done ? "var(--accent)" : "var(--ink-3)"}`,
                background: step.done ? "var(--accent)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--mono)",
                fontSize: 13,
                fontWeight: 600,
                color: step.done ? "var(--paper)" : "var(--ink-3)",
              }}>
                {step.done ? "✓" : step.num}
              </div>

              <div>
                <div style={{
                  fontFamily: "var(--serif)",
                  fontSize: 19,
                  fontWeight: 500,
                  color: step.done ? "var(--ink-3)" : "var(--ink)",
                  textDecoration: step.done ? "line-through" : "none",
                  marginBottom: 2,
                }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.45 }}>
                  {step.desc}
                </div>
              </div>

              <div>
                {step.done ? (
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--accent)", textTransform: "uppercase" }}>
                    {step.progress}
                  </span>
                ) : step.action ? (
                  <button onClick={step.action} className="btn-ink" style={{ fontSize: 12, padding: "8px 16px" }}>
                    {step.actionLabel}
                  </button>
                ) : step.href && !locked ? (
                  <Link href={step.href} className="btn-outline" style={{ fontSize: 12, padding: "8px 16px" }}>
                    {step.actionLabel}
                  </Link>
                ) : (
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--ink-3)", textTransform: "uppercase" }}>
                    {step.progress}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCapsule({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div style={{
      background: "var(--paper)",
      border: "1px solid var(--ink)",
      borderRadius: 3,
      padding: "12px 20px",
      textAlign: "center",
      minWidth: 90,
      boxShadow: "3px 3px 0 var(--paper-edge)",
    }}>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 28,
          fontWeight: 500,
          color: accent ? "var(--accent)" : "var(--ink)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 9,
          letterSpacing: "0.15em",
          color: "var(--ink-3)",
          marginTop: 4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
