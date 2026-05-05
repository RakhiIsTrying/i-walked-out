"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StickyDecision } from "@/lib/types";

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

  useEffect(() => {
    loadDecisions();
  }, []);

  async function loadDecisions() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  function addOption() {
    if (options.length < 5) setOptions([...options, ""]);
  }

  function updateOption(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  return (
    <div className="page-in" style={{ maxWidth: 820, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <span className="typewriter" style={{
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--ink-faded)", display: "block", marginBottom: 10,
        }}>
          sticky decision
        </span>
        <h1 className="serif" style={{ fontSize: 42, fontWeight: 400, margin: "0 0 14px", lineHeight: 1.15 }}>
          Help a stranger{" "}
          <em style={{ color: "var(--rose)", fontStyle: "italic" }}>get unstuck.</em>
        </h1>
        <p style={{
          color: "var(--ink-faded)", maxWidth: 460, margin: "0 auto",
          fontSize: 16, lineHeight: 1.6,
        }}>
          Kind, anonymous voting. No judgment, no history, just a nudge in a direction.
        </p>
      </div>

      {/* Compose Form */}
      {userId && (
        <div style={{ maxWidth: 720, margin: "0 auto 60px", position: "relative" }}>
          {!showForm ? (
            <div style={{ textAlign: "center" }}>
              <button className="btn-paper" onClick={() => setShowForm(true)}>
                + post a ballot
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="paper"
              style={{ padding: "40px 36px 36px", borderRadius: 3, position: "relative" }}
            >
              {/* Tape pieces */}
              <div className="tape" style={{ top: -10, left: 32, transform: "rotate(-3deg)" }} />
              <div className="tape tape-rose" style={{ top: -10, right: 40, transform: "rotate(4deg)" }} />

              <span className="typewriter" style={{
                fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--ink-faded)", display: "block", textAlign: "center", marginBottom: 16,
              }}>
                &#10022; post your own &#10022;
              </span>

              <h2 className="serif" style={{
                fontStyle: "italic", fontWeight: 400, fontSize: 26, marginBottom: 24,
                textAlign: "center",
              }}>
                what are you stuck on?
              </h2>

              <textarea
                className="hand"
                placeholder="Describe your dilemma..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%", fontSize: 22, minHeight: 90, resize: "vertical",
                  marginBottom: 16, lineHeight: 1.5,
                }}
              />

              <textarea
                placeholder="Add some context (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%", fontSize: 15, minHeight: 60, resize: "vertical",
                  marginBottom: 20,
                }}
              />

              <div style={{ marginBottom: 24 }}>
                <label className="typewriter" style={{
                  fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--ink-faded)", display: "block", marginBottom: 12,
                }}>
                  Options
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      className="typewriter"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      required={i < 2}
                      style={{ fontSize: 15, padding: "10px 14px" }}
                    />
                  ))}
                </div>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="typewriter"
                    style={{
                      marginTop: 12, fontSize: 13, color: "var(--teal)",
                      background: "none", border: "1px dashed var(--teal)",
                      borderRadius: 2, padding: "6px 14px", cursor: "pointer",
                    }}
                  >
                    + add another option
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button type="submit" className="btn-paper" disabled={submitting}>
                  {submitting ? "posting..." : "post ballot"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowForm(false)}
                  style={{ fontSize: 14, padding: "10px 18px" }}
                >
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
          <p className="hand" style={{ fontSize: 24, color: "var(--ink-faded)" }}>
            loading ballots...
          </p>
        </div>
      ) : decisions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-faded)" }}>
            No sticky decisions yet.
          </p>
          <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", marginTop: 8 }}>
            Be the first to let strangers run your life.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 60, alignItems: "center" }}>
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
  );
}

function BallotCard({
  decision,
  index,
  hasVoted,
  onVote,
  isLoggedIn,
}: {
  decision: StickyDecision;
  index: number;
  hasVoted: boolean;
  onVote: (index: number) => void;
  isLoggedIn: boolean;
}) {
  const voteCounts = decision.options.map(
    (_, i) => decision.votes?.filter((v) => v.chosen_option === i).length || 0
  );
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...voteCounts);

  const tapeColors = ["tape-rose", "tape-teal", "tape-plum", "tape-butter", ""];
  const tapeClass = tapeColors[index % tapeColors.length];

  return (
    <div
      className="paper page-in"
      style={{
        width: "100%", maxWidth: 640, padding: "40px 36px 36px",
        borderRadius: 3, position: "relative",
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Tape at top */}
      <div
        className={`tape ${tapeClass}`}
        style={{ top: -10, left: "50%", transform: "translateX(-50%) rotate(-2deg)" }}
      />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 20,
      }}>
        <span className="typewriter" style={{
          fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--ink-faded)",
        }}>
          ballot no. {String(index + 1).padStart(3, "0")}
        </span>
        <span className="typewriter" style={{ fontSize: 11, color: "var(--ink-faded)" }}>
          {decision.anonymous_alias}
        </span>
      </div>

      {/* Question */}
      <h3 className="serif" style={{
        fontSize: 26, fontWeight: 400, fontStyle: "italic",
        marginBottom: 8, lineHeight: 1.25,
      }}>
        {decision.title}
      </h3>

      {/* Context */}
      {decision.description && (
        <p className="hand" style={{
          fontSize: 20, color: "var(--ink-soft)", marginBottom: 24,
          lineHeight: 1.4,
        }}>
          {decision.description}
        </p>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {decision.options.map((option, i) => {
          const pct = totalVotes > 0 ? (voteCounts[i] / totalVotes) * 100 : 0;
          const isWinning = totalVotes > 0 && voteCounts[i] === maxVotes;
          const isMyPick = hasVoted && isWinning; // simplified: highlight winner

          if (!hasVoted) {
            // Pre-vote: paper-light bg, dashed border
            return (
              <button
                key={i}
                onClick={() => onVote(i)}
                disabled={!isLoggedIn}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "14px 18px",
                  background: "var(--paper-light)",
                  border: "1.5px dashed var(--ink-faded)",
                  borderRadius: 3,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 15, color: "var(--ink)",
                  cursor: isLoggedIn ? "pointer" : "default",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (isLoggedIn) {
                    e.currentTarget.style.background = "var(--paper-deep)";
                    e.currentTarget.style.borderColor = "var(--ink-soft)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--paper-light)";
                  e.currentTarget.style.borderColor = "var(--ink-faded)";
                }}
              >
                {option}
              </button>
            );
          }

          // Post-vote: animated fill bar
          return (
            <div
              key={i}
              style={{
                position: "relative", width: "100%",
                padding: "14px 18px",
                background: "var(--paper-light)",
                border: `1.5px solid ${isWinning ? "var(--rose)" : "var(--ink-faded)"}`,
                borderRadius: 3, overflow: "hidden",
              }}
            >
              {/* Fill bar */}
              <div
                style={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isMyPick
                    ? "rgba(196, 122, 106, 0.18)"
                    : "rgba(74, 122, 118, 0.12)",
                  borderRadius: "3px 0 0 3px",
                  transition: "width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              />
              <div style={{
                position: "relative", display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 15, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  {isWinning && <span style={{ color: "var(--rose)" }}>&#10003;</span>}
                  {option}
                </span>
                <span className="typewriter" style={{
                  fontSize: 12, color: isWinning ? "var(--rose)" : "var(--ink-faded)",
                }}>
                  {Math.round(pct)}% &middot; {voteCounts[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* After voting thank-you */}
      {hasVoted && (
        <p className="hand" style={{
          fontSize: 19, color: "var(--ink-faded)", marginTop: 20,
          textAlign: "center",
        }}>
          thanks for nudging. {totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far.
        </p>
      )}
    </div>
  );
}
