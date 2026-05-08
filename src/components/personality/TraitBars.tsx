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
  if (value >= 70) return "var(--accent)";
  if (value >= 40) return "var(--accent-deep)";
  return "var(--note-1)";
}

export default function TraitBars({ profile }: { profile: PersonalityProfile }) {
  return (
    <section>
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 20, textAlign: "center" }}>
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
                background: "var(--paper)",
                padding: "16px 20px",
                borderRadius: 3,
                border: "1px dashed var(--ink-3)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-2)" }}>
                  {label}
                </span>
                <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 22, color: barColor, fontWeight: 600 }}>
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
  );
}
