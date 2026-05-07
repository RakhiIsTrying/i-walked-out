import { PersonalityProfile } from "@/lib/types";

function TagCard({ title, tags, color }: { title: string; tags: string[]; color: string }) {
  return (
    <div className="paper" style={{ borderRadius: 3, padding: "24px 20px", position: "relative" }}>
      <p className="typewriter" style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 14 }}>
        {title}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((t) => (
          <span key={t} className="stamp" style={{ color }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function TagsGrid({ profile }: { profile: PersonalityProfile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
      <TagCard title="Core Values" tags={profile.traits.core_values} color="var(--teal)" />
      <TagCard title="Fear Patterns" tags={profile.traits.fear_patterns} color="var(--rose)" />
      <TagCard title="Aspiration Themes" tags={profile.traits.aspiration_themes} color="var(--butter)" />
    </div>
  );
}
