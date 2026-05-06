"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Ghost, Mail, Lock, Loader2, Phone } from "lucide-react";

type AuthMode = "email" | "phone";

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formatted = phone.startsWith("+") ? phone : `+${phone}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setOtpSent(true);
    setLoading(false);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formatted = phone.startsWith("+") ? phone : `+${phone}`;
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Ghost className="mx-auto mb-4 h-12 w-12" style={{ color: "var(--teal)" }} />
          <h1 className="serif mb-2 text-2xl" style={{ color: "var(--ink)" }}>Check your email</h1>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            enter the graveyard.
          </p>
          <p className="hand" style={{ color: "var(--ink-faded)", fontSize: 18, marginTop: 16 }}>
            Once confirmed, your Telegram link code will be waiting on your dashboard.
            One email. One code. One connection.
          </p>
          <Link
            href="/auth/login"
            className="btn-ghost mt-6 inline-block"
            style={{ fontSize: 14 }}
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Ghost className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h1 className="text-2xl font-bold">Join the graveyard</h1>
          <p className="mt-2 text-sm text-muted">
            Start logging the dreams you walked away from
          </p>
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogleSignup}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 py-3 font-medium transition-all hover:bg-[var(--paper-deep)]"
          style={{ borderColor: "var(--ink-faded)", color: "var(--ink)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div style={{ flex: 1, height: 1, background: "var(--ink-faded)" }} />
          <span className="typewriter" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--ink-faded)", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--ink-faded)" }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => { setMode("email"); setError(""); setOtpSent(false); }}
            className="typewriter"
            style={{
              flex: 1, padding: "8px 0", fontSize: 11, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: "pointer",
              borderRadius: 2, border: "none",
              background: mode === "email" ? "var(--ink)" : "transparent",
              color: mode === "email" ? "var(--paper-light)" : "var(--ink-faded)",
              transition: "all 0.15s",
            }}
          >
            Email
          </button>
          <button
            onClick={() => { setMode("phone"); setError(""); }}
            className="typewriter"
            style={{
              flex: 1, padding: "8px 0", fontSize: 11, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: "pointer",
              borderRadius: 2, border: "none",
              background: mode === "phone" ? "var(--ink)" : "transparent",
              color: mode === "phone" ? "var(--paper-light)" : "var(--ink-faded)",
              transition: "all 0.15s",
            }}
          >
            Phone
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-background transition-all hover:bg-accent-dim disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        ) : (
          <>
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10"
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-background transition-all hover:bg-accent-dim disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>
                  Code sent to <strong>{phone}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center typewriter"
                  style={{ fontSize: 20, letterSpacing: "0.3em" }}
                  maxLength={6}
                  required
                />

                {error && (
                  <p className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-medium text-background transition-all hover:bg-accent-dim disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Sign Up"}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                  className="btn-ghost w-full"
                  style={{ fontSize: 12 }}
                >
                  change number
                </button>
              </form>
            )}
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Already haunting?{" "}
          <Link href="/auth/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
