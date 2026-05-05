"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Ghost, Mail, Lock, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
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

        <form onSubmit={handleSignup} className="space-y-4">
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
