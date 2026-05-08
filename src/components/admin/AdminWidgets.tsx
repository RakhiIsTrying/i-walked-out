"use client";

import React from "react";

export const thStyle: React.CSSProperties = { padding: "10px 12px" };
export const tdStyle: React.CSSProperties = { padding: "10px 12px" };

export function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-3)", whiteSpace: "nowrap" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, borderTop: "1.5px dashed var(--ink-3)" }} />
    </div>
  );
}

export function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      background: "var(--paper)",
      border: "1px solid var(--rule)",
      borderRadius: 4,
      padding: "20px 18px",
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.15em", color: "var(--ink-3)", marginTop: 6, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export function ActivityCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 4, padding: "18px 20px" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

export function ActivityRow({ primary, secondary, time }: { primary: string; secondary?: string; time: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{primary}</div>
        {secondary && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{secondary}</div>}
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", flexShrink: 0 }}>{time}</span>
    </div>
  );
}

export function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontFamily: "var(--mono)",
      fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
      padding: "3px 10px", borderRadius: 12,
      border: `1.5px solid ${color}`, color,
    }}>
      {text}
    </span>
  );
}

export function EmptyMsg() {
  return <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "var(--ink-3)", textAlign: "center", padding: "20px 0" }}>nothing yet</p>;
}
