"use client";

interface BucketItem {
  id: string;
  vibe_query: string;
  category: string;
  item_text: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

const cardKinds: Record<string, { label: string; emoji: string }> = {
  place: { label: "go to", emoji: "📍" },
  movie: { label: "watch", emoji: "🎬" },
  tv_show: { label: "binge", emoji: "📺" },
  food: { label: "eat", emoji: "🍜" },
  game: { label: "play", emoji: "🎮" },
  song: { label: "listen", emoji: "🎵" },
  music_album: { label: "album", emoji: "💿" },
  youtube: { label: "youtube", emoji: "▶️" },
};

interface Props {
  bucket: BucketItem[];
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}

export default function BucketListView({ bucket, onToggle, onRemove, disabled }: Props) {
  const pendingItems = bucket.filter((b) => !b.completed);
  const doneItems = bucket.filter((b) => b.completed);

  return (
    <div
      className="paper page-in"
      style={{ padding: "28px 28px 32px", marginBottom: 36, background: "var(--paper)", border: "1px solid var(--ink)", boxShadow: "4px 5px 0 var(--paper-edge)", position: "relative" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400, fontStyle: "italic", margin: 0 }}>
          Bucket List
        </h2>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em" }}>
          {doneItems.length}/{bucket.length} done
        </span>
      </div>

      {bucket.length > 0 && (
        <div style={{ height: 6, background: "var(--ink-3)", borderRadius: 3, marginBottom: 24, opacity: 0.3 }}>
          <div
            style={{
              height: "100%",
              width: `${(doneItems.length / bucket.length) * 100}%`,
              background: "var(--accent)",
              borderRadius: 3,
              transition: "width 0.4s ease",
              opacity: 1,
            }}
          />
        </div>
      )}

      {pendingItems.length > 0 && (
        <div style={{ marginBottom: doneItems.length > 0 ? 24 : 0 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>
            to do
          </div>
          {pendingItems.map((item) => (
            <BucketRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} disabled={disabled} />
          ))}
        </div>
      )}

      {doneItems.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>
            done
          </div>
          {doneItems.map((item) => (
            <BucketRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} disabled={disabled} />
          ))}
        </div>
      )}

      {bucket.length === 0 && (
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, color: "var(--ink-3)", textAlign: "center", margin: "20px 0" }}>
          Nothing here yet. Add items from your vibe results!
        </p>
      )}
    </div>
  );
}

function BucketRow({
  item, onToggle, onRemove, disabled,
}: {
  item: BucketItem;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const config = cardKinds[item.category];
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px", borderBottom: "1px dashed var(--ink-3)",
        opacity: item.completed ? 0.6 : 1, transition: "opacity 0.3s ease",
      }}
    >
      <button
        onClick={() => onToggle(item.id, item.completed)}
        disabled={disabled}
        style={{
          width: 24, height: 24, borderRadius: 4,
          border: item.completed ? "2px solid var(--accent)" : "2px dashed var(--ink-3)",
          background: item.completed ? "var(--accent)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--paper)", fontSize: 14, flexShrink: 0, transition: "all 0.2s ease",
        }}
      >
        {item.completed ? "✓" : ""}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 18, fontWeight: 500,
            textDecoration: item.completed ? "line-through" : "none",
            color: item.completed ? "var(--ink-3)" : "var(--ink)",
          }}
        >
          {item.item_text}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>
            {config?.emoji} {config?.label}
          </span>
          <span style={{ fontSize: 10, color: "var(--ink-3)" }}>·</span>
          <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)" }}>
            &ldquo;{item.vibe_query}&rdquo;
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        title="Remove"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--ink-3)", fontSize: 16, padding: "4px 8px",
          opacity: 0.5, transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.5"; }}
      >
        ✕
      </button>
    </div>
  );
}
