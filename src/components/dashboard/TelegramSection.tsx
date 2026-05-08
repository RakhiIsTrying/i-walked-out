"use client";

import { useEffect, useState } from "react";

export default function TelegramSection() {
  const [linked, setLinked] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/telegram/link").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setLinked(data.linked);
        if (data.link?.telegram_username) setUsername(data.link.telegram_username);
        if (data.pendingCode) setLinkCode(data.pendingCode);
      }
    });
  }, []);

  async function generateCode() {
    setLoading(true);
    const res = await fetch("/api/telegram/link", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLinkCode(data.code);
    }
    setLoading(false);
  }

  async function unlink() {
    await fetch("/api/telegram/link", { method: "DELETE" });
    setLinked(false);
    setUsername(null);
    setLinkCode(null);
  }

  function copyCode() {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  return (
    <section
      style={{
        borderRadius: 4, padding: "20px 24px", marginBottom: 48,
        background: "var(--paper)", border: "1px solid var(--rule)",
      }}
    >
      {linked ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "oklch(0.62 0.14 35 / 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
            }}>
              T
            </div>
            <div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-3)", margin: 0 }}>
                Telegram
              </p>
              <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--accent)", margin: 0 }}>
                Connected{username ? ` as @${username}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={unlink}
            style={{ fontFamily: "var(--mono)", fontSize: 11, padding: "6px 14px", color: "var(--accent)", background: "none", border: "1px solid var(--accent)", borderRadius: 2, cursor: "pointer", letterSpacing: "0.08em" }}
          >
            disconnect
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "var(--paper-deep)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
            }}>
              T
            </div>
            <div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-3)", margin: 0 }}>
                Telegram
              </p>
              <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0 }}>
                Connect to log dreams from Telegram
              </p>
            </div>
          </div>

          {linkCode ? (
            <div className="page-in" style={{ padding: "16px 20px", background: "var(--paper-deep)", borderRadius: 3, marginTop: 8 }}>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 10px" }}>
                Open <strong>@IWalkedOut</strong> on Telegram and send:
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <code
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18, letterSpacing: "0.08em", color: "var(--accent)",
                    background: "var(--paper)", padding: "10px 16px",
                    borderRadius: 2, border: "1px solid var(--rule)", flex: 1,
                  }}
                >
                  /link {linkCode}
                </code>
                <button onClick={copyCode} className="btn-outline" style={{ padding: "8px 14px", fontSize: 12 }}>
                  {codeCopied ? "copied!" : "copy"}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", margin: 0, letterSpacing: "0.1em" }}>
                  code expired?
                </p>
                <button
                  onClick={generateCode} disabled={loading}
                  style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "4px 10px", color: "var(--accent)", background: "none", border: "1px dashed var(--accent)", borderRadius: 2, cursor: "pointer" }}
                >
                  {loading ? "..." : "regenerate"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generateCode} disabled={loading} className="btn-ink" style={{ fontSize: 13 }}>
              {loading ? "generating..." : "generate link code"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
