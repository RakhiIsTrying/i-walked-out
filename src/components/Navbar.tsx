"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, X } from "lucide-react";

export default function Navbar({ user }: { user: { email: string } | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/feed", label: "Dead Dreams" },
    { href: "/sticky-decision", label: "Sticky Decision" },
    { href: "/vibe", label: "Vibe IRL" },
    { href: "/dugdug", label: "Dug-Dug" },
    { href: "/games", label: "Games" },
    ...(user
      ? [
          { href: "/dashboard", label: "My Graveyard" },
          { href: "/personality", label: "My Mind" },
        ]
      : []),
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(251, 247, 236, 0.88)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px dashed rgba(106, 112, 140, 0.3)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 lg:px-12 py-5">
        <Link
          href="/"
          className="serif flex items-center gap-2.5 text-[22px] font-semibold tracking-tight"
          style={{ color: "var(--ink)", textDecoration: "none" }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="11" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M9 14 Q14 8 19 14 Q14 20 9 14 Z" fill="var(--rose)" opacity="0.75" />
          </svg>
          i walked out
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="typewriter text-xs" style={{ color: "var(--ink-faded)", letterSpacing: "0.05em" }}>
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded px-3 py-2 text-sm transition-colors"
                style={{ color: "var(--ink-faded)" }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-paper" style={{ padding: "10px 18px", fontSize: 14 }}>
              Sign in
            </Link>
          )}
        </div>

        <button
          className="md:hidden"
          style={{ color: "var(--ink-faded)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="px-6 py-4 md:hidden"
          style={{
            borderTop: "1px dashed rgba(106, 112, 140, 0.3)",
            background: "rgba(251, 247, 236, 0.95)",
          }}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`serif block py-2.5 text-base`}
              style={{ color: pathname === href ? "var(--rose)" : "var(--ink)", textDecoration: "none" }}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-2 py-2.5 text-sm"
              style={{ color: "var(--rose)" }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="btn-paper mt-3 block text-center"
              style={{ fontSize: 14 }}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
