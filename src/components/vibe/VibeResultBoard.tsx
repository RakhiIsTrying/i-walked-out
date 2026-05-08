import { VibeResult } from "@/lib/types";

const cardKinds: Record<string, { label: string; emoji: string; accent: string }> = {
  place: { label: "go to", emoji: "📍", accent: "var(--accent)" },
  movie: { label: "watch", emoji: "🎬", accent: "var(--accent)" },
  tv_show: { label: "binge", emoji: "📺", accent: "var(--note-5)" },
  food: { label: "eat", emoji: "🍜", accent: "var(--note-1)" },
  game: { label: "play", emoji: "🎮", accent: "var(--accent)" },
  song: { label: "listen", emoji: "🎵", accent: "var(--accent)" },
  music_album: { label: "album", emoji: "💿", accent: "var(--note-5)" },
  youtube: { label: "youtube", emoji: "▶️", accent: "var(--note-1)" },
};

const resultKeys = ["place", "movie", "tv_show", "food", "game", "song", "music_album", "youtube"] as const;

function mapsUrl(q: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
}
function ytUrl(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
function ytMusicUrl(q: string) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(q)}`;
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--accent)",
  textDecoration: "none",
  borderBottom: "1px dashed var(--accent)",
  paddingBottom: 1,
};

function CardLinks({ keyName, result }: { keyName: string; result: VibeResult }) {
  const links: React.ReactNode[] = [];

  if (keyName === "place" && result.place_location) {
    links.push(
      <a key="map" href={mapsUrl(result.place_location)} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        Google Maps →
      </a>
    );
  }

  if (keyName === "movie") {
    if (result.movie_platform) {
      links.push(<span key="plat" style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>on {result.movie_platform}</span>);
    }
  }

  if (keyName === "tv_show") {
    if (result.tv_show_platform) {
      links.push(<span key="plat" style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>on {result.tv_show_platform}</span>);
    }
  }

  if (keyName === "food" && result.food_location) {
    links.push(
      <a key="map" href={mapsUrl(result.food_location)} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        Google Maps →
      </a>
    );
  }

  if (keyName === "game" && result.game_platform) {
    links.push(<span key="plat" style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>{result.game_platform}</span>);
  }

  if (keyName === "song") {
    const artist = result.song_artist || "";
    const album = result.song_album;
    if (album) {
      links.push(<span key="alb" style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 12, color: "var(--ink-3)" }}>from {album}</span>);
    }
    const searchQ = `${result.song} ${artist}`;
    links.push(
      <a key="yt" href={ytUrl(searchQ)} target="_blank" rel="noopener noreferrer" style={linkStyle}>YouTube</a>,
      <a key="ytm" href={ytMusicUrl(searchQ)} target="_blank" rel="noopener noreferrer" style={linkStyle}>YT Music</a>,
    );
  }

  if (keyName === "music_album") {
    const artist = result.music_album_artist || "";
    const searchQ = `${result.music_album} ${artist}`;
    links.push(
      <a key="yt" href={ytUrl(searchQ + " full album")} target="_blank" rel="noopener noreferrer" style={linkStyle}>YouTube</a>,
      <a key="ytm" href={ytMusicUrl(searchQ)} target="_blank" rel="noopener noreferrer" style={linkStyle}>YT Music</a>,
    );
  }

  if (keyName === "youtube") {
    links.push(
      <a key="yt" href={ytUrl(result.youtube)} target="_blank" rel="noopener noreferrer" style={linkStyle}>Watch on YouTube →</a>
    );
  }

  if (links.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
      {links}
    </div>
  );
}

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
        border: "1px solid var(--rule)",
        borderRadius: 4,
        padding: "36px 28px 40px",
        marginBottom: 48,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", display: "block", marginBottom: 4 }}>
            a moodboard for —
          </span>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 38, fontStyle: "italic", margin: 0, fontWeight: 400, marginTop: 4 }}>
            &ldquo;{result.query}&rdquo;
          </h2>
        </div>
        <button className="btn-outline" onClick={onAnotherEvening} style={{ padding: "10px 16px", fontSize: 14 }}>
          ↻ another evening
        </button>
      </div>

      {result.vibe_summary && (
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, color: "var(--ink-2)", marginBottom: 28, lineHeight: 1.4, maxWidth: 600 }}>
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
              style={{ padding: "0", position: "relative", transform: "none", animationDelay: `${i * 0.08}s`, overflow: "hidden", border: "1px solid var(--ink)", boxShadow: "4px 5px 0 var(--paper-edge)", background: "var(--paper)" }}
            >
              <div style={{ height: 4, background: config.accent }} />
              <div style={{ padding: "18px 22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{config.emoji}</span> {config.label}
                  </div>
                  {isLoggedIn && (
                    <button
                      onClick={() => !alreadyAdded && onAddToBucket(key)}
                      disabled={addingKey === key || alreadyAdded}
                      title={alreadyAdded ? "Already in bucket list" : "Add to bucket list"}
                      style={{
                        background: "none",
                        border: alreadyAdded ? "1.5px solid var(--accent)" : "1.5px dashed var(--ink-3)",
                        borderRadius: "50%", width: 28, height: 28,
                        cursor: alreadyAdded ? "default" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16,
                        color: alreadyAdded ? "var(--accent)" : "var(--ink-3)",
                        transition: "all 0.2s ease",
                        opacity: addingKey === key ? 0.5 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {alreadyAdded ? "✓" : "+"}
                    </button>
                  )}
                </div>
                <h4 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
                  {value}
                </h4>
                <CardLinks keyName={key} result={result} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 22, color: "var(--ink-2)", margin: 0 }}>
          you don&apos;t have to do all of them. one is enough.
        </p>
      </div>
    </div>
  );
}
