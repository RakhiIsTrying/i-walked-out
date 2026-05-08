import { VibeResult } from "@/lib/types";

interface VibeHistoryProps {
  history: VibeResult[];
  onSelect: (result: VibeResult) => void;
}

export default function VibeHistory({ history, onSelect }: VibeHistoryProps) {
  if (history.length <= 1) return null;

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span className="typewriter" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-faded)" }}>
          past vibes
        </span>
        <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed var(--ink-faded)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {history.slice(1).map((h, i) => (
          <button
            key={i}
            onClick={() => onSelect(h)}
            className="hand"
            style={{
              textAlign: "left", background: "none", border: "none",
              cursor: "pointer", padding: "8px 12px",
              borderRadius: 3, fontSize: 19, color: "var(--ink-soft)",
              transition: "background 0.2s ease",
            }}
          >
            &ldquo;{h.query}&rdquo;
            {h.vibe_summary && (
              <span style={{ marginLeft: 10, fontSize: 14, color: "var(--ink-faded)", fontFamily: "'Inter', system-ui, sans-serif" }}>
                {h.vibe_summary.slice(0, 60)}{h.vibe_summary.length > 60 ? "..." : ""}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
