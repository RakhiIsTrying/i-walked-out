"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SectionLabel, StatCard, ActivityCard, ActivityRow, Pill, EmptyMsg, thStyle, tdStyle } from "@/components/admin/AdminWidgets";

interface Stats {
  users: number;
  dreams: number;
  sticky_decisions: number;
  votes: number;
  vibe_searches: number;
  bucket_items: number;
  telegram_links: number;
  personalities: number;
  games_played: number;
  chat_messages: number;
  today_users: number;
  today_dreams: number;
}

interface User {
  id: string;
  email: string;
  phone: string | null;
  provider: string;
  anonymous_alias: string;
  dream_count: number;
  personality_generated: boolean;
  created_at: string;
}

interface RecentDream {
  id: string;
  title: string;
  category: string;
  emotion: string;
  created_at: string;
}

interface RecentSticky {
  id: string;
  title: string;
  options: string[];
  created_at: string;
}

interface RecentVibe {
  id: string;
  query: string;
  created_at: string;
}

interface RecentGame {
  id: string;
  game_type: string;
  score: number;
  won: boolean;
  created_at: string;
}

interface FeedbackEntry {
  id: string;
  message: string;
  emoji: string | null;
  page: string | null;
  user_email: string | null;
  created_at: string;
}

type Tab = "overview" | "users" | "dreams" | "decisions" | "vibes" | "games" | "feedback";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recentDreams, setRecentDreams] = useState<RecentDream[]>([]);
  const [recentSticky, setRecentSticky] = useState<RecentSticky[]>([]);
  const [recentVibes, setRecentVibes] = useState<RecentVibe[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== "rakhisinha100896@gmail.com") {
      router.push("/");
      return;
    }
    setAuthChecking(false);
    loadStats();
  }

  async function loadStats() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users);
      setRecentDreams(data.recentDreams);
      setRecentSticky(data.recentSticky);
      setRecentVibes(data.recentVibes);
      setRecentGames(data.recentGames);
    }
    const fbRes = await fetch("/api/feedback");
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      setFeedback(fbData.feedback);
      setFeedbackTotal(fbData.total);
    }
    setLoading(false);
  }

  if (authChecking) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.15em", color: "var(--ink-3)" }}>
          verifying...
        </p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "dreams", label: "Dreams" },
    { key: "decisions", label: "Decisions" },
    { key: "vibes", label: "Vibes" },
    { key: "games", label: "Games" },
    { key: "feedback", label: `Feedback${feedbackTotal ? ` (${feedbackTotal})` : ""}` },
  ];

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="page-in" style={{ padding: "24px clamp(16px, 4vw, 48px) 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <header style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
            admin · private
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 400, fontStyle: "italic", margin: 0, lineHeight: 1.05 }}>
            Command Center
          </h1>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32, borderBottom: "1.5px solid var(--rule)", paddingBottom: 12 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "8px 16px",
                cursor: "pointer",
                border: "none",
                borderRadius: 2,
                background: tab === t.key ? "var(--ink)" : "transparent",
                color: tab === t.key ? "var(--paper)" : "var(--ink-3)",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 22, color: "var(--ink-3)", textAlign: "center", padding: "60px 0" }}>
            loading dashboard...
          </p>
        ) : (
          <>
            {/* Overview */}
            {tab === "overview" && stats && (
              <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

                {/* Today */}
                <div>
                  <SectionLabel text="today" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
                    <StatCard value={stats.today_users} label="new signups" color="var(--accent)" />
                    <StatCard value={stats.today_dreams} label="dreams logged" color="var(--accent-deep)" />
                  </div>
                </div>

                {/* All time */}
                <div>
                  <SectionLabel text="all time" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
                    <StatCard value={stats.users} label="users" color="var(--ink)" />
                    <StatCard value={stats.dreams} label="dreams" color="var(--accent-deep)" />
                    <StatCard value={stats.sticky_decisions} label="decisions" color="var(--ink-2)" />
                    <StatCard value={stats.votes} label="votes" color="var(--accent)" />
                    <StatCard value={stats.vibe_searches} label="vibe searches" color="var(--accent)" />
                    <StatCard value={stats.bucket_items} label="bucket items" color="var(--accent-deep)" />
                    <StatCard value={stats.games_played} label="games played" color="var(--accent)" />
                    <StatCard value={stats.personalities} label="personalities" color="var(--ink-2)" />
                    <StatCard value={stats.telegram_links} label="telegram links" color="var(--ink)" />
                    <StatCard value={stats.chat_messages} label="chat messages" color="var(--accent-deep)" />
                  </div>
                </div>

                {/* Recent activity */}
                <div>
                  <SectionLabel text="recent activity" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 20 }}>
                    <ActivityCard title="Latest Dreams">
                      {recentDreams.length === 0 ? <EmptyMsg /> : recentDreams.slice(0, 5).map((d) => (
                        <ActivityRow key={d.id} primary={d.title} secondary={`${d.category} · ${d.emotion}`} time={formatDate(d.created_at)} />
                      ))}
                    </ActivityCard>
                    <ActivityCard title="Latest Vibes">
                      {recentVibes.length === 0 ? <EmptyMsg /> : recentVibes.slice(0, 5).map((v) => (
                        <ActivityRow key={v.id} primary={v.query} time={formatDate(v.created_at)} />
                      ))}
                    </ActivityCard>
                    <ActivityCard title="Latest Decisions">
                      {recentSticky.length === 0 ? <EmptyMsg /> : recentSticky.slice(0, 5).map((s) => (
                        <ActivityRow key={s.id} primary={s.title} secondary={s.options?.join(" vs ")} time={formatDate(s.created_at)} />
                      ))}
                    </ActivityCard>
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === "users" && (
              <div>
                <SectionLabel text={`${users.length} users`} />
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ fontFamily: "var(--mono)", borderBottom: "2px solid var(--ink)", textAlign: "left", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>email</th>
                        <th style={thStyle}>phone</th>
                        <th style={thStyle}>via</th>
                        <th style={thStyle}>alias</th>
                        <th style={thStyle}>dreams</th>
                        <th style={thStyle}>personality</th>
                        <th style={thStyle}>signed up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: "1px dashed var(--ink-3)" }}>
                          <td style={{ ...tdStyle, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>{i + 1}</td>
                          <td style={{ ...tdStyle, fontFamily: "monospace" }}>{u.email || "—"}</td>
                          <td style={{ ...tdStyle, fontFamily: "monospace" }}>{u.phone || "—"}</td>
                          <td style={{ ...tdStyle, fontFamily: "var(--mono)", fontSize: 10 }}>{u.provider}</td>
                          <td style={{ ...tdStyle, fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 16 }}>{u.anonymous_alias}</td>
                          <td style={{ ...tdStyle, fontFamily: "var(--mono)", textAlign: "center" }}>{u.dream_count}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>{u.personality_generated ? "yes" : "—"}</td>
                          <td style={{ ...tdStyle, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{formatDate(u.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Dreams */}
            {tab === "dreams" && (
              <div>
                <SectionLabel text={`${stats?.dreams || 0} total dreams`} />
                {recentDreams.length === 0 ? <EmptyMsg /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {recentDreams.map((d) => (
                      <div key={d.id} className="paper" style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                          <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500, margin: 0 }}>{d.title}</h3>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{formatDate(d.created_at)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <Pill text={d.category} color="var(--accent)" />
                          <Pill text={d.emotion} color="var(--accent-deep)" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Decisions */}
            {tab === "decisions" && (
              <div>
                <SectionLabel text={`${stats?.sticky_decisions || 0} decisions · ${stats?.votes || 0} votes`} />
                {recentSticky.length === 0 ? <EmptyMsg /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {recentSticky.map((s) => (
                      <div key={s.id} className="paper" style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                          <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 500, margin: 0 }}>{s.title}</h3>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{formatDate(s.created_at)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          {s.options?.map((opt, i) => (
                            <Pill key={i} text={opt} color="var(--note-5)" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vibes */}
            {tab === "vibes" && (
              <div>
                <SectionLabel text={`${stats?.vibe_searches || 0} searches · ${stats?.bucket_items || 0} bucket items`} />
                {recentVibes.length === 0 ? <EmptyMsg /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {recentVibes.map((v) => (
                      <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px dashed var(--ink-3)" }}>
                        <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20 }}>&ldquo;{v.query}&rdquo;</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", flexShrink: 0, marginLeft: 12 }}>{formatDate(v.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Games */}
            {tab === "games" && (
              <div>
                <SectionLabel text={`${stats?.games_played || 0} games played`} />
                {recentGames.length === 0 ? <EmptyMsg /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {recentGames.map((g) => (
                      <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px dashed var(--ink-3)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Pill text={g.game_type} color="var(--accent-deep)" />
                          <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
                            {g.won ? "Won" : "Lost"} · {g.score} pts
                          </span>
                        </div>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", flexShrink: 0 }}>{formatDate(g.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            {tab === "feedback" && (
              <div>
                <SectionLabel text={`${feedbackTotal} feedback entries`} />
                {feedback.length === 0 ? <EmptyMsg /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {feedback.map((f) => (
                      <div key={f.id} className="paper" style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {f.emoji && <span style={{ fontSize: 22 }}>{f.emoji}</span>}
                            <span style={{ fontSize: 15, color: "var(--ink)" }}>{f.message || <em style={{ color: "var(--ink-3)" }}>emoji only</em>}</span>
                          </div>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", flexShrink: 0 }}>{formatDate(f.created_at)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          {f.page && <Pill text={f.page} color="var(--accent-deep)" />}
                          <Pill text={f.user_email || "anonymous"} color="var(--ink-3)" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

