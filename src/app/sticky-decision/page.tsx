"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StickyDecision } from "@/lib/types";
import BallotCard from "@/components/sticky-decision/BallotCard";

export default function StickyDecisionPage() {
  const [decisions, setDecisions] = useState<StickyDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [votedOn, setVotedOn] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);

  useEffect(() => { loadDecisions(); }, []);

  async function loadDecisions() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data } = await supabase
      .from("sticky_decisions")
      .select("*, votes:sticky_votes(*)")
      .order("created_at", { ascending: false })
      .limit(30);

    setDecisions((data as StickyDecision[]) || []);

    if (user) {
      const { data: myVotes } = await supabase
        .from("sticky_votes")
        .select("decision_id")
        .eq("user_id", user.id);
      setVotedOn(new Set((myVotes || []).map((v) => v.decision_id)));
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return;

    const res = await fetch("/api/sticky-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, options: validOptions }),
    });

    if (res.ok) {
      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setShowForm(false);
      loadDecisions();
    }
    setSubmitting(false);
  }

  async function vote(decisionId: string, optionIndex: number) {
    if (!userId || votedOn.has(decisionId)) return;
    const supabase = createClient();
    await supabase.from("sticky_votes").insert({
      decision_id: decisionId,
      user_id: userId,
      chosen_option: optionIndex,
    });
    setVotedOn((prev) => new Set([...prev, decisionId]));
    loadDecisions();
  }

  function addOption() { if (options.length < 5) setOptions([...options, ""]); }
  function updateOption(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  return (
    <div className="page-in" style={{ padding: "72px 0 40px" }}>
      <div className="wrap" style={{ maxWidth: 1100 }}>
        {/* Page intro */}
        <div style={{ marginBottom: 44 }}>
          <div className="eyebrow">sticky decision</div>
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
            Help a stranger{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--accent)",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              get unstuck.
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
            Real questions from real people. No advice, no comments — just a kind, anonymous vote.
            They&apos;ll see what the room thought.
          </p>
        </div>

        {/* Compose Form */}
        {userId && (
          <div style={{ maxWidth: 720, marginBottom: 60 }}>
            {!showForm ? (
              <button className="btn-ink" onClick={() => setShowForm(true)}>
                + post a ballot
              </button>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  padding: "22px 22px 18px",
                  background: "var(--paper)",
                  border: "1px solid var(--ink)",
                  borderRadius: 4,
                  boxShadow: "6px 6px 0 var(--paper-edge)",
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
                  Post your own
                </label>
                <h3
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: 26,
                    fontWeight: 400,
                    margin: "8px 0 14px",
                  }}
                >
                  what are you stuck on?
                </h3>
                <textarea
                  placeholder="Describe your dilemma..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  rows={2}
                  style={{
                    width: "100%",
                    fontSize: 20,
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    marginBottom: 12,
                    resize: "vertical",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px dashed var(--rule)",
                    padding: "6px 0",
                    outline: "none",
                    color: "var(--ink)",
                  }}
                />
                <textarea
                  placeholder="Add some context (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: 15,
                    minHeight: 60,
                    resize: "vertical",
                    marginBottom: 20,
                  }}
                />

                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--ink-3)",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    Options
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {options.map((opt, i) => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        required={i < 2}
                        style={{ fontSize: 15, padding: "10px 14px", fontFamily: "var(--mono)" }}
                      />
                    ))}
                  </div>
                  {options.length < 5 && (
                    <button
                      type="button"
                      onClick={addOption}
                      style={{
                        marginTop: 12,
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        background: "none",
                        border: "1px dashed var(--accent)",
                        borderRadius: 999,
                        padding: "6px 14px",
                        cursor: "pointer",
                      }}
                    >
                      + add another option
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button type="submit" className="btn-ink" disabled={submitting}>
                    {submitting ? "posting..." : "post ballot"}
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>
                    cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--ink-3)",
              }}
            >
              loading ballots...
            </p>
          </div>
        ) : decisions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 22,
                color: "var(--ink-3)",
              }}
            >
              No sticky decisions yet.
            </p>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--ink-3)",
                marginTop: 8,
              }}
            >
              Be the first to let strangers run your life.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 44, alignItems: "center" }}>
            {decisions.map((decision, index) => (
              <BallotCard
                key={decision.id}
                decision={decision}
                index={index}
                hasVoted={votedOn.has(decision.id)}
                onVote={(optionIndex) => vote(decision.id, optionIndex)}
                isLoggedIn={!!userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
