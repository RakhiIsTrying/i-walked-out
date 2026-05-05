"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Ghost, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Ghost className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h1 className="text-2xl font-bold">Welcome back, ghost</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to revisit your graveyard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account yet?{" "}
          <Link href="/auth/signup" className="text-accent hover:underline">
            Join the graveyard
          </Link>
        </p>
      </div>
    </div>
  );
}
