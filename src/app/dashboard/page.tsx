"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dream } from "@/lib/types";
import DreamCard from "@/components/DreamCard";
import DreamForm from "@/components/dashboard/DreamForm";
import TelegramSection from "@/components/dashboard/TelegramSection";
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
    <div className="page-in" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Welcome + Stats */}
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

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCapsule value={String(dreamCount)} label="dreams" color="var(--ink)" />
            <StatCapsule value={personalityReady ? "Yes" : "No"} label="profile" color={personalityReady ? "var(--teal)" : "var(--ink-faded)"} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button onClick={() => setShowForm(!showForm)} className="btn-paper">
            {showForm ? "cancel" : "walk out"} {showForm ? "×" : "↳"}
          </button>
          {dreamCount >= 3 && (
            <Link href="/personality" className="btn-ghost" style={{ fontSize: 14 }}>
              {personalityReady ? "view personality" : "generate personality"} &rarr;
            </Link>
          )}
        </div>
      </header>

      {showForm && <DreamForm onSubmitted={handleFormSubmitted} />}

      <TelegramSection />

      {/* Dream List */}
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
            <div key={dream.id} className="page-in" style={{ animationDelay: `${index * 0.06}s` }}>
              <DreamCard dream={dream} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCapsule({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      background: "var(--paper-light)", border: "1px solid rgba(106,112,140,0.15)",
      borderRadius: 4, padding: "12px 20px", textAlign: "center", minWidth: 90,
    }}>
      <div className="serif" style={{ fontSize: 28, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
      <div className="typewriter" style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-faded)", marginTop: 4, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
