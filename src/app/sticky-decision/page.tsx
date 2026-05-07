"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StickyDecision } from "@/lib/types";

function fireSmallConfetti(x: number, y: number) {
  const colors = ["var(--rose)", "var(--teal)", "var(--butter)"];
  const shapes = ["✦", "✶", "♡", "✿"];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = shapes[i % shapes.length];
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.fontSize = (12 + Math.random() * 14) + "px";
    el.style.color = colors[i % colors.length];
    el.style.setProperty("--dx", (Math.random() - 0.5) * 400 + "px");
    el.style.setProperty("--dr", (Math.random() * 720 - 360) + "deg");
    el.style.setProperty("--dur", (1.6 + Math.random() * 1.2) + "s");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

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
    <div className="page-in" style={{ padding: "20px clamp(16px, 4vw, 48px) 40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="typewriter" style={{ fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--rose)", marginBottom: 14 }}>
            ✦ sticky decision ✦
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(36px, 5vw, 60px)", margin: 0, fontWeight: 400, lineHeight: 1.05, fontStyle: "italic" }}>
            Help a stranger <em style={{ color: "var(--rose)" }}>get unstuck.</em>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            Real questions from real people. No advice, no comments — just a kind, anonymous vote. They&apos;ll see what the room thought.
          </p>
        </div>

        {/* Compose Form */}
        {userId && (
          <div style={{ maxWidth: 720, margin: "0 auto 60px" }}>
            {!showForm ? (
              <div style={{ textAlign: "center" }}>
                <button className="btn-chunky" onClick={() => setShowForm(true)}>+ POST A BALLOT</button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="paper"
                style={{ padding: "32px 32px 28px", position: "relative", background: "#f8efd9", transform: "rotate(0.5deg)" }}
              >
                <div className="tape tape-rose" style={{ top: -12, left: 50, transform: "rotate(-3deg)" }} />
                <div className="tape tape-teal" style={{ top: -12, right: 50, transform: "rotate(3deg)" }} />
                <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 8 }}>
                  ✦ post your own ✦
                </div>
                <h3 className="serif" style={{ fontSize: 26, margin: 0, marginBottom: 14, fontStyle: "italic", fontWeight: 400 }}>
                  what are you stuck on?
                </h3>
                <textarea
                  className="hand"
                  placeholder="Describe your dilemma..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  rows={2}
                  style={{ width: "100%", fontSize: 22, marginBottom: 12, resize: "vertical" }}
                />
                <textarea
                  placeholder="Add some context (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", fontSize: 15, minHeight: 60, resize: "vertical", marginBottom: 20 }}
                />

                <div style={{ marginBottom: 24 }}>
                  <label className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 12 }}>
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
                      style={{ marginTop: 12, fontSize: 13, color: "var(--teal)", background: "none", border: "1px dashed var(--teal)", borderRadius: 2, padding: "6px 14px", cursor: "pointer" }}
                    >
                      + add another option
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button type="submit" className="btn-paper" disabled={submitting}>
                    {submitting ? "posting..." : "post ballot"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: 14, padding: "10px 18px" }}>
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
            <p className="hand" style={{ fontSize: 24, color: "var(--ink-faded)" }}>loading ballots...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-faded)" }}>No sticky decisions yet.</p>
            <p className="hand" style={{ fontSize: 20, color: "var(--ink-faded)", marginTop: 8 }}>Be the first to let strangers run your life.</p>
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

function BallotCard({
  decision, index, hasVoted, onVote, isLoggedIn,
}: {
  decision: StickyDecision;
  index: number;
  hasVoted: boolean;
  onVote: (index: number) => void;
  isLoggedIn: boolean;
}) {
  const voteCounts = decision.options.map((_, i) => decision.votes?.filter((v) => v.chosen_option === i).length || 0);
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...voteCounts);
  const rotations = [-1.5, 2, -2.5, 1, -1, 2.5];
  const bgColors = ["#faf3df", "#f4e2d4", "#f1e4d2", "#f8efd9"];

  return (
    <div
      className="paper page-in"
      style={{
        padding: "32px 32px 28px",
        background: bgColors[index % bgColors.length],
        transform: `rotate(${rotations[index % rotations.length]}deg)`,
        position: "relative",
        maxWidth: 540,
        width: "100%",
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div className="tape tape-butter" style={{ top: -12, left: "50%", marginLeft: -40, transform: "rotate(-2deg)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)" }}>
          ballot no. {String(index + 1).padStart(3, "0")}
        </div>
        <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-faded)" }}>
          {decision.anonymous_alias}
        </div>
      </div>

      <h3 className="serif" style={{ fontSize: 26, fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, margin: 0, marginBottom: 12 }}>
        {decision.title}
      </h3>
      {decision.description && (
        <p className="hand" style={{ fontSize: 19, color: "var(--ink-soft)", margin: 0, marginBottom: 22 }}>
          — {decision.description}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {decision.options.map((opt, i) => {
          const voteCount = voteCounts[i];
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isWinning = totalVotes > 0 && voteCount === maxVotes;

          return (
            <button
              key={i}
              onClick={(e) => {
                if (!hasVoted && isLoggedIn) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  fireSmallConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                  onVote(i);
                }
              }}
              disabled={hasVoted || !isLoggedIn}
              style={{
                position: "relative",
                width: "100%",
                padding: "14px 18px",
                textAlign: "left",
                background: "var(--paper-light)",
                border: `1.5px ${hasVoted && isWinning ? "solid var(--rose)" : "dashed var(--ink-faded)"}`,
                cursor: hasVoted || !isLoggedIn ? "default" : "pointer",
                borderRadius: 2,
                overflow: "hidden",
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                color: "var(--ink)",
                transition: "all 0.25s ease",
              }}
            >
              {hasVoted && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${pct}%`,
                    background: isWinning ? "rgba(255, 90, 78, 0.2)" : "rgba(42, 95, 214, 0.12)",
                    transition: "width 0.6s cubic-bezier(.2,.7,.2,1)",
                  }}
                />
              )}
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 18, height: 18,
                    border: "1.5px solid var(--ink)",
                    borderRadius: 2,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: hasVoted && isWinning ? "var(--rose)" : "transparent",
                    fontWeight: 700,
                  }}>
                    ✓
                  </span>
                  {opt}
                </span>
                {hasVoted && (
                  <span className="typewriter" style={{ fontSize: 12, color: "var(--ink-faded)", letterSpacing: "0.05em" }}>
                    {pct}% · {voteCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div className="hand" style={{ fontSize: 19, color: "var(--rose)", marginTop: 18, textAlign: "center" }}>
          thank you for voting kindly. ✦ {totalVotes} kind strangers have weighed in.
        </div>
      )}
    </div>
  );
}
