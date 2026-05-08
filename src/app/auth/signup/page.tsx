"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, Phone, Calendar } from "lucide-react";

type AuthMode = "email" | "phone";

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const COUNTRY_CODES = [
  { code: "+91", flag: "\u{1F1EE}\u{1F1F3}", label: "India" },
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", label: "US/CA" },
  { code: "+44", flag: "\u{1F1EC}\u{1F1E7}", label: "UK" },
  { code: "+61", flag: "\u{1F1E6}\u{1F1FA}", label: "AU" },
  { code: "+86", flag: "\u{1F1E8}\u{1F1F3}", label: "CN" },
  { code: "+81", flag: "\u{1F1EF}\u{1F1F5}", label: "JP" },
  { code: "+49", flag: "\u{1F1E9}\u{1F1EA}", label: "DE" },
  { code: "+33", flag: "\u{1F1EB}\u{1F1F7}", label: "FR" },
  { code: "+55", flag: "\u{1F1E7}\u{1F1F7}", label: "BR" },
  { code: "+234", flag: "\u{1F1F3}\u{1F1EC}", label: "NG" },
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", label: "UAE" },
  { code: "+65", flag: "\u{1F1F8}\u{1F1EC}", label: "SG" },
  { code: "+82", flag: "\u{1F1F0}\u{1F1F7}", label: "KR" },
  { code: "+39", flag: "\u{1F1EE}\u{1F1F9}", label: "IT" },
  { code: "+34", flag: "\u{1F1EA}\u{1F1F8}", label: "ES" },
  { code: "+7", flag: "\u{1F1F7}\u{1F1FA}", label: "RU" },
  { code: "+62", flag: "\u{1F1EE}\u{1F1E9}", label: "ID" },
  { code: "+60", flag: "\u{1F1F2}\u{1F1FE}", label: "MY" },
  { code: "+66", flag: "\u{1F1F9}\u{1F1ED}", label: "TH" },
  { code: "+52", flag: "\u{1F1F2}\u{1F1FD}", label: "MX" },
];

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!dob || getAge(dob) < 15) { setError("You must be at least 15 years old to sign up."); setLoading(false); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  async function handlePhoneSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!dob || getAge(dob) < 15) { setError("You must be at least 15 years old to sign up."); setLoading(false); return; }
    const formatted = `${countryCode}${phone.replace(/\D/g, "")}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ phone: formatted, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <div style={{ display: "flex", minHeight: "80vh", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 48,
              color: "var(--accent)",
              marginBottom: 16,
            }}
          >
            ✉
          </div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: 32,
              fontWeight: 400,
              color: "var(--ink)",
              margin: "0 0 12px",
            }}
          >
            Check your email
          </h1>
          <p style={{ color: "var(--ink-2)", lineHeight: 1.6, fontSize: 16 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to enter the graveyard.
          </p>
          <Link href="/auth/login" className="btn-outline" style={{ marginTop: 24, display: "inline-flex" }}>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "80vh", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 14 }}>the front desk</div>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 400,
              fontSize: "clamp(36px, 5vw, 52px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            Join the <em style={{ color: "var(--accent)" }}>graveyard.</em>
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 16, marginTop: 12, fontFamily: "var(--serif)", fontStyle: "italic" }}>
            Start logging the dreams you walked away from
          </p>
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogleSignup}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            border: "1px solid var(--ink)",
            borderRadius: 999,
            padding: "12px 0",
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "var(--paper)",
            color: "var(--ink)",
            cursor: "pointer",
            transition: "background .2s, color .2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ink)"; e.currentTarget.style.color = "var(--paper)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.color = "var(--ink)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Telegram */}
        <a
          href="https://t.me/I_Walked_Out_bot"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            border: "1px solid var(--ink)",
            borderRadius: 999,
            padding: "12px 0",
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "var(--paper)",
            color: "var(--ink)",
            cursor: "pointer",
            transition: "background .2s, color .2s",
            marginTop: 10,
            textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#229ED9">
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.53 8.15l-1.84 8.66c-.14.62-.5.77-1.01.48l-2.8-2.06-1.35 1.3c-.15.15-.28.28-.57.28l.2-2.85 5.18-4.68c.23-.2-.05-.31-.35-.12l-6.4 4.03-2.76-.86c-.6-.19-.61-.6.13-.89l10.78-4.16c.5-.18.93.12.79.87z"/>
          </svg>
          Continue with Telegram
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.15em", color: "var(--ink-3)", textTransform: "uppercase" }}>
            or sign up with
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["email", "phone"] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`chip ${mode === m ? "on" : ""}`}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-3)" }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", paddingLeft: 36 }} required />
            </div>
            <div>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4, display: "block" }}>Date of birth (must be 15+)</label>
              <div style={{ position: "relative" }}>
                <Calendar size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-3)" }} />
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} style={{ width: "100%", paddingLeft: 36, color: dob ? "var(--ink)" : "var(--ink-3)" }} required aria-label="Date of birth" />
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-3)" }} />
              <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", paddingLeft: 36 }} minLength={6} required />
            </div>
            {error && (
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", padding: "8px 12px", background: "var(--note-3)", borderRadius: 3 }}>{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-ink" style={{ width: "100%", justifyContent: "center", padding: "14px 0" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Create Account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  width: "min(110px, 30%)",
                  padding: "10px 8px",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  background: "var(--paper-deep)",
                  border: "1px solid var(--ink)",
                  borderRadius: 3,
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <div style={{ flex: 1, position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-3)" }} />
                <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", paddingLeft: 36 }} required />
              </div>
            </div>
            <div>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4, display: "block" }}>Date of birth (must be 15+)</label>
              <div style={{ position: "relative" }}>
                <Calendar size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-3)" }} />
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} style={{ width: "100%", paddingLeft: 36, color: dob ? "var(--ink)" : "var(--ink-3)" }} required aria-label="Date of birth" />
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-3)" }} />
              <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", paddingLeft: 36 }} minLength={6} required />
            </div>
            {error && (
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", padding: "8px 12px", background: "var(--note-3)", borderRadius: 3 }}>{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-ink" style={{ width: "100%", justifyContent: "center", padding: "14px 0" }}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Create Account"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, textAlign: "center", fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, color: "var(--ink-2)" }}>
          Already haunting?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)", borderBottom: "1px solid var(--accent)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
