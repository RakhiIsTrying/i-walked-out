"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PersonalityProfile } from "@/lib/types";

const traitKeys: { key: string; label: string }[] = [
  { key: "openness", label: "Openness" },
  { key: "conscientiousness", label: "Conscientiousness" },
  { key: "extraversion", label: "Extraversion" },
  { key: "agreeableness", label: "Agreeableness" },
  { key: "neuroticism", label: "Neuroticism" },
  { key: "risk_tolerance", label: "Risk Tolerance" },
];

function traitColor(value: number): string {
  if (value >= 70) return "var(--teal)";
  if (value >= 40) return "var(--rose)";
  return "var(--butter)";
}

export default function PersonalityPage() {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPersonality();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

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

  async function sendChat() {
    if (!chatInput.trim() || !profile) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    const res = await fetch("/api/personality", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        personality: profile,
        history: chatMessages,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    }
    setChatLoading(false);
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="page-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="typewriter" style={{ fontSize: 13, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>
          analyzing...
        </p>
      </div>
    );
  }

  /* dreamCount < 3 no longer blocks the page — chat works without personality */

  return (
    <div className="page-in" style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* ── Header ── */}
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        {profile ? (
          <>
            <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 8 }}>
              your archetype
            </p>
            <h1
              className="serif"
              style={{
                fontSize: 52,
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--rose)",
                lineHeight: 1.1,
                margin: "0 0 20px",
              }}
            >
              {profile.archetype}
            </h1>
            <button
              onClick={generatePersonality}
              disabled={generating}
              className="btn-ghost"
              style={{ fontSize: 13, padding: "8px 18px" }}
            >
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
              style={{
                fontSize: 42,
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--ink)",
                lineHeight: 1.1,
                margin: "0 0 20px",
              }}
            >
              Talk to your future self.
            </h1>
          </>
        )}
      </header>

      {profile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          {/* ── Summary Card ── */}
          <div
            className="paper"
            style={{ borderRadius: 3, padding: "36px 28px 28px", position: "relative" }}
          >
            <div className="tape tape-rose" style={{ top: -10, left: 40, transform: "rotate(-5deg)" }} />
            <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
              Personality Summary
            </p>
            <p className="hand" style={{ fontSize: 22, lineHeight: 1.45, color: "var(--ink-soft)", whiteSpace: "pre-line" }}>
              {profile.summary}
            </p>
          </div>

          {/* ── Trait Bars ── */}
          <section>
            <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 20, textAlign: "center" }}>
              Personality Traits
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {traitKeys.map(({ key, label }) => {
                const value = profile.traits[key as keyof typeof profile.traits] as number;
                const barColor = traitColor(value);
                return (
                  <div
                    key={key}
                    style={{
                      background: "var(--paper-light)",
                      padding: "16px 20px",
                      borderRadius: 3,
                      border: "1px dashed var(--ink-faded)",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                      <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-soft)" }}>
                        {label}
                      </span>
                      <span className="hand" style={{ fontSize: 22, color: barColor, fontWeight: 600 }}>
                        {value}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: "var(--paper-deep)", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${value}%`,
                          background: barColor,
                          borderRadius: 4,
                          transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Decision Style ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="typewriter"
              style={{
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "14px 28px",
                border: "2px solid var(--ink)",
                borderRadius: 2,
                color: "var(--ink)",
                textAlign: "center",
              }}
            >
              <span style={{ display: "block", fontSize: 9, color: "var(--ink-faded)", marginBottom: 4, letterSpacing: "0.2em" }}>
                decision style
              </span>
              {profile.traits.decision_style}
            </div>
          </div>

          {/* ── Tags Section ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {/* Core Values */}
            <div
              className="paper"
              style={{ borderRadius: 3, padding: "24px 20px", position: "relative" }}
            >
              <div className="pin pin-teal" style={{ top: -6, left: "50%", marginLeft: -8 }} />
              <p className="typewriter" style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
                Core Values
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.traits.core_values.map((v) => (
                  <span key={v} className="stamp" style={{ color: "var(--teal)", transform: `rotate(${(v.charCodeAt(0) % 7) - 3}deg)` }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Fear Patterns */}
            <div
              className="paper"
              style={{ borderRadius: 3, padding: "24px 20px", position: "relative" }}
            >
              <div className="pin" style={{ top: -6, left: "50%", marginLeft: -8 }} />
              <p className="typewriter" style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
                Fear Patterns
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.traits.fear_patterns.map((f) => (
                  <span key={f} className="stamp" style={{ color: "var(--rose)", transform: `rotate(${(f.charCodeAt(0) % 5) - 2}deg)` }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Aspiration Themes */}
            <div
              className="paper"
              style={{ borderRadius: 3, padding: "24px 20px", position: "relative" }}
            >
              <div className="pin pin-butter" style={{ top: -6, left: "50%", marginLeft: -8 }} />
              <p className="typewriter" style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
                Aspiration Themes
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profile.traits.aspiration_themes.map((a) => (
                  <span key={a} className="stamp" style={{ color: "var(--butter)", transform: `rotate(${(a.charCodeAt(0) % 7) - 3}deg)` }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Future Self Chat ── */}
          <section
            className="paper"
            style={{ borderRadius: 3, overflow: "hidden", position: "relative" }}
          >
            <div className="tape tape-plum" style={{ top: -10, right: 36, transform: "rotate(5deg)" }} />

            {/* Chat header */}
            <div style={{ padding: "24px 24px 16px", borderBottom: "1.5px dashed var(--ink-faded)" }}>
              <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 4 }}>
                Chat with your Future Self
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-faded)" }}>
                Ask about decisions, regrets, or anything on your mind
              </p>
            </div>

            {/* Chat messages */}
            <div
              style={{ maxHeight: 450, minHeight: 180, overflowY: "auto", padding: 24 }}
            >
              {chatMessages.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140 }}>
                  <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", opacity: 0.5, textAlign: "center" }}>
                    Your future self is waiting...
                    <br />
                    Ask anything about your decisions.
                  </p>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "14px 18px",
                      borderRadius: 3,
                      position: "relative",
                      ...(msg.role === "user"
                        ? {
                            background: "var(--paper-deep)",
                            border: "1px dashed var(--ink-faded)",
                            transform: "rotate(0.8deg)",
                            fontFamily: "'Caveat', cursive",
                            fontSize: 19,
                            lineHeight: 1.4,
                            color: "var(--ink-soft)",
                          }
                        : {
                            background: "var(--paper-light)",
                            border: "1px solid var(--ink-faded)",
                            borderLeft: "3px solid var(--teal)",
                            transform: "rotate(-0.4deg)",
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "var(--ink-soft)",
                          }),
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                  <div
                    style={{
                      padding: "14px 18px",
                      background: "var(--paper-light)",
                      border: "1px solid var(--ink-faded)",
                      borderLeft: "3px solid var(--teal)",
                      borderRadius: 3,
                      transform: "rotate(-0.4deg)",
                    }}
                  >
                    <span className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
                      analyzing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div style={{ borderTop: "1.5px dashed var(--ink-faded)", padding: 16 }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChat();
                }}
                style={{ display: "flex", gap: 12 }}
              >
                <input
                  type="text"
                  placeholder="Ask your future self..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="hand"
                  style={{ flex: 1, fontSize: 18 }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-paper"
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  send &rarr;
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : (
        /* ── No profile yet — show chat + optional analysis ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

          {/* ── Future Self Chat (works without personality) ── */}
          <section
            className="paper"
            style={{ borderRadius: 3, overflow: "hidden", position: "relative" }}
          >
            <div className="tape tape-plum" style={{ top: -10, right: 36, transform: "rotate(5deg)" }} />

            <div style={{ padding: "24px 24px 16px", borderBottom: "1.5px dashed var(--ink-faded)" }}>
              <p className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 4 }}>
                Chat with your Future Self
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-faded)" }}>
                Just talk. No analysis required.
              </p>
            </div>

            <div
              style={{ maxHeight: 450, minHeight: 180, overflowY: "auto", padding: 24 }}
            >
              {chatMessages.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140 }}>
                  <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", opacity: 0.5, textAlign: "center" }}>
                    Say something. Your future self is listening.
                  </p>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "14px 18px",
                      borderRadius: 3,
                      position: "relative",
                      ...(msg.role === "user"
                        ? {
                            background: "var(--paper-deep)",
                            border: "1px dashed var(--ink-faded)",
                            transform: "rotate(0.8deg)",
                            fontFamily: "'Caveat', cursive",
                            fontSize: 19,
                            lineHeight: 1.4,
                            color: "var(--ink-soft)",
                          }
                        : {
                            background: "var(--paper-light)",
                            border: "1px solid var(--ink-faded)",
                            borderLeft: "3px solid var(--teal)",
                            transform: "rotate(-0.4deg)",
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "var(--ink-soft)",
                          }),
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                  <div
                    style={{
                      padding: "14px 18px",
                      background: "var(--paper-light)",
                      border: "1px solid var(--ink-faded)",
                      borderLeft: "3px solid var(--teal)",
                      borderRadius: 3,
                      transform: "rotate(-0.4deg)",
                    }}
                  >
                    <span className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.1em" }}>
                      thinking...
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div style={{ borderTop: "1.5px dashed var(--ink-faded)", padding: 16 }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChat();
                }}
                style={{ display: "flex", gap: 12 }}
              >
                <input
                  type="text"
                  placeholder="Ask your future self..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="hand"
                  style={{ flex: 1, fontSize: 18 }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-paper"
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  send &rarr;
                </button>
              </form>
            </div>
          </section>

          {/* ── Optional personality analysis ── */}
          {dreamCount >= 3 ? (
            <div
              className="paper"
              style={{ borderRadius: 3, padding: "28px 24px", position: "relative", textAlign: "center" }}
            >
              <div className="tape tape-rose" style={{ top: -10, left: "50%", marginLeft: -40, transform: "rotate(-3deg)" }} />
              <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
                optional · {dreamCount} dreams logged
              </p>
              <h3 className="serif" style={{ fontSize: 24, fontStyle: "italic", fontWeight: 400, color: "var(--ink)", margin: "0 0 10px" }}>
                Want a sharper conversation?
              </h3>
              <p style={{ fontSize: 14, color: "var(--ink-faded)", lineHeight: 1.5, maxWidth: 420, margin: "0 auto 20px" }}>
                Run a personality analysis on your dead dreams. Your future self will know your patterns, fears, and values — and talk like someone who actually knows you.
              </p>
              <button
                onClick={generatePersonality}
                disabled={generating}
                className="btn-paper"
                style={{ fontSize: 15, padding: "12px 28px" }}
              >
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
