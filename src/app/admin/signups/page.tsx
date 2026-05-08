"use client";

import { useEffect, useState } from "react";

interface Signup {
  id: string;
  email: string;
  phone: string | null;
  provider: string;
  anonymous_alias: string;
  dream_count: number;
  personality_generated: boolean;
  created_at: string;
}

export default function AdminSignups() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === "iwalkedout2024") {
      setAuthed(true);
      sessionStorage.setItem("admin_auth", "1");
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/admin/signups")
      .then((r) => r.json())
      .then((data) => {
        setSignups(data.signups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authed]);

  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <form
          onSubmit={handleLogin}
          className="paper"
          style={{ padding: 40, maxWidth: 360, width: "100%", textAlign: "center" }}
        >
          <h2
            style={{ fontFamily: "var(--serif)", fontSize: 28, fontStyle: "italic", fontWeight: 400, marginBottom: 20 }}
          >
            admin
          </h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            style={{ fontFamily: "var(--mono)", width: "100%", padding: "10px 14px", fontSize: 14, marginBottom: 14 }}
          />
          <button type="submit" className="btn-ink" style={{ width: "100%", justifyContent: "center" }}>
            enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-in" style={{ padding: "30px clamp(16px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 10,
            }}
          >
            admin panel
          </div>
          <h1
            style={{ fontFamily: "var(--serif)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, fontStyle: "italic", margin: 0 }}
          >
            All Signups
          </h1>
          {!loading && (
            <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>
              {signups.length} total users
            </p>
          )}
        </div>

        {loading ? (
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, color: "var(--ink-3)" }}>loading...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    fontFamily: "var(--mono)",
                    borderBottom: "2px solid var(--ink)",
                    textAlign: "left",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "10px 12px" }}>#</th>
                  <th style={{ padding: "10px 12px" }}>email</th>
                  <th style={{ padding: "10px 12px" }}>phone</th>
                  <th style={{ padding: "10px 12px" }}>via</th>
                  <th style={{ padding: "10px 12px" }}>alias</th>
                  <th style={{ padding: "10px 12px" }}>dreams</th>
                  <th style={{ padding: "10px 12px" }}>personality</th>
                  <th style={{ padding: "10px 12px" }}>signed up</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px dashed var(--ink-3)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(0,0,0,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ fontFamily: "var(--mono)", padding: "10px 12px", color: "var(--ink-3)" }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>{s.email || "—"}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>{s.phone || "—"}</td>
                    <td style={{ fontFamily: "var(--mono)", padding: "10px 12px", fontSize: 10 }}>{s.provider}</td>
                    <td style={{ fontFamily: "var(--serif)", fontStyle: "italic", padding: "10px 12px", fontSize: 16 }}>
                      {s.anonymous_alias}
                    </td>
                    <td style={{ fontFamily: "var(--mono)", padding: "10px 12px", textAlign: "center" }}>
                      {s.dream_count}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {s.personality_generated ? "yes" : "—"}
                    </td>
                    <td style={{ fontFamily: "var(--mono)", padding: "10px 12px", fontSize: 11, color: "var(--ink-3)" }}>
                      {new Date(s.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
