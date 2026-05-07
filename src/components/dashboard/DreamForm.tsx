"use client";

import { useState } from "react";
import { DreamCategory } from "@/lib/types";

const categories: { value: DreamCategory; label: string }[] = [
  { value: "career", label: "Career" },
  { value: "relationship", label: "Relationship" },
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

const emotions = [
  "relieved", "regretful", "indifferent", "scared",
  "liberated", "conflicted", "numb", "reflective",
];

export default function DreamForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DreamCategory>("other");
  const [emotion, setEmotion] = useState("reflective");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/dreams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, emotion }),
    });

    if (res.ok) {
      setTitle("");
      setDescription("");
      setCategory("other");
      setEmotion("reflective");
      onSubmitted();
    }

    setSubmitting(false);
  }

  return (
    <section
      className="paper page-in"
      style={{ borderRadius: 3, padding: "36px 28px 28px", marginBottom: 48, position: "relative" }}
    >
      <h2 className="serif" style={{ fontSize: 24, fontStyle: "italic", fontWeight: 400, color: "var(--ink)", marginBottom: 24 }}>
        what are you letting go of?
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <input
          type="text"
          placeholder="What did you walk away from?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="typewriter"
          style={{ fontSize: 13, letterSpacing: "0.04em", width: "100%" }}
          required
        />

        <textarea
          placeholder="Tell the story. Why did you give it up? What was the last straw?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="hand"
          style={{ fontSize: 20, lineHeight: 1.45, minHeight: 120, resize: "vertical", width: "100%" }}
          required
        />

        <div>
          <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
            Category
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className="typewriter"
                style={{
                  fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "6px 14px",
                  border: category === c.value ? "1.5px solid var(--ink)" : "1px dashed var(--ink-faded)",
                  borderRadius: 2,
                  background: category === c.value ? "var(--ink)" : "transparent",
                  color: category === c.value ? "var(--paper-light)" : "var(--ink-faded)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-faded)", marginBottom: 10 }}>
            How did it feel?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {emotions.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmotion(em)}
                className="typewriter"
                style={{
                  fontSize: 10, letterSpacing: "0.1em", padding: "6px 14px",
                  border: emotion === em ? "1.5px solid var(--rose)" : "1px dashed var(--ink-faded)",
                  borderRadius: 2,
                  background: emotion === em ? "var(--rose)" : "transparent",
                  color: emotion === em ? "var(--paper-light)" : "var(--ink-faded)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 4 }}>
          <button type="submit" disabled={submitting} className="btn-paper">
            {submitting ? "walking out..." : "walk out ↳"}
          </button>
        </div>
      </form>
    </section>
  );
}
