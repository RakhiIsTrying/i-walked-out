import { VibeResult } from "@/lib/types";

const cardKinds: Record<string, { label: string; emoji: string; accent: string }> = {
  place: { label: "go to", emoji: "📍", accent: "var(--rose)" },
  movie: { label: "watch", emoji: "🎬", accent: "var(--teal)" },
  tv_show: { label: "binge", emoji: "📺", accent: "var(--plum)" },
  food: { label: "eat", emoji: "🍜", accent: "var(--butter)" },
  game: { label: "play", emoji: "🎮", accent: "var(--rose)" },
  song: { label: "listen", emoji: "🎵", accent: "var(--teal)" },
  music_album: { label: "album", emoji: "💿", accent: "var(--plum)" },
  youtube: { label: "youtube", emoji: "▶️", accent: "var(--butter)" },
};

const resultKeys = ["place", "movie", "tv_show", "food", "game", "song", "music_album", "youtube"] as const;

interface VibeResultBoardProps {
  result: VibeResult;
  isLoggedIn: boolean;
  addingKey: string | null;
  onAddToBucket: (key: string) => void;
  onAnotherEvening: () => void;
  isInBucket: (key: string, text: string) => boolean;
}

export default function VibeResultBoard({
  result, isLoggedIn, addingKey,
  onAddToBucket, onAnotherEvening, isInBucket,
}: VibeResultBoardProps) {
  return (
    <div
      className="page-in"
      style={{
        background: "var(--paper-deep)",
        border: "1px solid rgba(106, 112, 140, 0.15)",
        borderRadius: 4,
        padding: "36px 28px 40px",
        marginBottom: 48,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)", display: "block", marginBottom: 4 }}>
            a moodboard for —
          </span>
          <h2 className="serif" style={{ fontSize: 38, fontStyle: "italic", margin: 0, fontWeight: 400, marginTop: 4 }}>
            &ldquo;{result.query}&rdquo;
          </h2>
        </div>
        <button className="btn-ghost" onClick={onAnotherEvening} style={{ padding: "10px 16px", fontSize: 14 }}>
          ↻ another evening
        </button>
      </div>

      {result.vibe_summary && (
        <p className="hand" style={{ fontSize: 20, color: "var(--ink-soft)", marginBottom: 28, lineHeight: 1.4, maxWidth: 600 }}>
          {result.vibe_summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {resultKeys.map((key, i) => {
          const config = cardKinds[key];
          const value = result[key];
          if (!value) return null;
          const alreadyAdded = isInBucket(key, value);

          return (
            <div
              key={key}
              className="paper lift pop-in"
              style={{ padding: "0", position: "relative", transform: "none", animationDelay: `${i * 0.08}s`, overflow: "hidden" }}
            >
              <div style={{ height: 4, background: config.accent }} />
              <div style={{ padding: "18px 22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div className="typewriter" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-faded)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{config.emoji}</span> {config.label}
                  </div>
                  {isLoggedIn && (
                    <button
                      onClick={() => !alreadyAdded && onAddToBucket(key)}
                      disabled={addingKey === key || alreadyAdded}
                      title={alreadyAdded ? "Already in bucket list" : "Add to bucket list"}
                      style={{
                        background: "none",
                        border: alreadyAdded ? "1.5px solid var(--teal)" : "1.5px dashed var(--ink-faded)",
                        borderRadius: "50%", width: 28, height: 28,
                        cursor: alreadyAdded ? "default" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16,
                        color: alreadyAdded ? "var(--teal)" : "var(--ink-faded)",
                        transition: "all 0.2s ease",
                        opacity: addingKey === key ? 0.5 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {alreadyAdded ? "✓" : "+"}
                    </button>
                  )}
                </div>
                <h4 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
                  {value}
                </h4>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", margin: 0 }}>
          you don&apos;t have to do all of them. one is enough.
        </p>
      </div>
    </div>
  );
}
