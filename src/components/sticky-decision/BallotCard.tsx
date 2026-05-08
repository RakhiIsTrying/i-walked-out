import { StickyDecision } from "@/lib/types";

function fireSmallConfetti(x: number, y: number) {
  const colors = ["var(--accent)", "var(--accent-deep)", "var(--note-1)"];
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

interface Props {
  decision: StickyDecision;
  index: number;
  hasVoted: boolean;
  onVote: (optionIndex: number) => void;
  isLoggedIn: boolean;
}

export default function BallotCard({ decision, index, hasVoted, onVote, isLoggedIn }: Props) {
  const voteCounts = decision.options.map((_, i) => decision.votes?.filter((v) => v.chosen_option === i).length || 0);
  const totalVotes = voteCounts.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...voteCounts);

  return (
    <div
      className="page-in"
      style={{
        padding: "0",
        background: "var(--paper)",
        border: "1px solid var(--ink)",
        boxShadow: "4px 5px 0 var(--paper-edge)",
        borderRadius: 6,
        overflow: "hidden",
        maxWidth: 560,
        width: "100%",
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div style={{ height: 4, background: "var(--accent)" }} />
      <div style={{ padding: "24px 28px 24px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          ballot no. {String(index + 1).padStart(3, "0")}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-3)" }}>
          {decision.anonymous_alias}
        </div>
      </div>

      <h3 style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, margin: 0, marginBottom: 12 }}>
        {decision.title}
      </h3>
      {decision.description && (
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19, color: "var(--ink-2)", margin: 0, marginBottom: 22 }}>
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
                background: hasVoted && isWinning ? "oklch(0.62 0.14 35 / 0.06)" : "var(--paper-deep)",
                border: hasVoted && isWinning ? "1.5px solid var(--accent)" : "1px solid var(--rule)",
                cursor: hasVoted || !isLoggedIn ? "default" : "pointer",
                borderRadius: 4,
                overflow: "hidden",
                fontFamily: "var(--serif)",
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
                    background: isWinning ? "var(--accent)" : "var(--rule)",
                    opacity: isWinning ? 0.2 : 0.12,
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
                    color: hasVoted && isWinning ? "var(--accent)" : "transparent",
                    fontWeight: 700,
                  }}>
                    ✓
                  </span>
                  {opt}
                </span>
                {hasVoted && (
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.05em" }}>
                    {pct}% · {voteCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19, color: "var(--accent)", marginTop: 18, textAlign: "center" }}>
          thank you for voting kindly. {totalVotes} kind strangers have weighed in.
        </div>
      )}
      </div>
    </div>
  );
}
