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
    { href: "/dugdug", label: "Nigel Bottomsworth-Pemberton" },
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      style={{
        borderBottom: "1px solid var(--ink)",
        padding: "14px 0 0",
        background: "var(--paper)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Left: meta info */}
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10.5px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--ink-2)",
            display: "flex",
            gap: 18,
          }}
        >
          <span>Est. 2025</span>
          <span style={{ color: "var(--ink-3)" }}>Vol. 03</span>
        </div>

        {/* Center: logo */}
        <Link
          href="/"
          style={{
            textAlign: "center",
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "var(--ink)",
          }}
        >
          i walked{" "}
          <em style={{ color: "var(--accent)", fontStyle: "italic" }}>out</em>
        </Link>

        {/* Right: user / sign in */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 22,
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {user ? (
            <span className="desktop-user-info" style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <span
                style={{
                  color: "var(--ink-3)",
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 10,
                }}
              >
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                <LogOut size={14} />
              </button>
            </span>
          ) : (
            <Link
              href="/auth/login"
              className="desktop-user-info"
              style={{
                border: "1px solid var(--ink)",
                padding: "7px 12px",
                borderRadius: 999,
                transition: "background .2s, color .2s",
                color: "var(--ink)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--mono)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--ink)";
                e.currentTarget.style.color = "var(--paper)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ink)";
              }}
            >
              Sign in
            </Link>
          )}

          {/* Mobile: sign-in button when logged out, hamburger when logged in */}
          {user ? (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink)",
                padding: 4,
              }}
              className="mobile-nav-toggle"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="mobile-sign-in"
              style={{
                display: "none",
                border: "1px solid var(--ink)",
                padding: "6px 14px",
                borderRadius: 999,
                color: "var(--ink)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--mono)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Nav row */}
      <nav
        className="wrap desktop-nav"
        style={{
          marginTop: 10,
          borderTop: "1px solid var(--rule)",
          paddingTop: 10,
          paddingBottom: 12,
          display: "flex",
          justifyContent: "center",
          gap: 38,
          fontFamily: "var(--serif)",
          fontSize: 15,
          fontStyle: "italic",
          color: "var(--ink-2)",
        }}
      >
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              position: "relative",
              color: isActive(href) ? "var(--ink)" : "var(--ink-2)",
              transition: "color .15s",
            }}
          >
            {label}
            {isActive(href) && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -4,
                  height: 4,
                  background:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 4' preserveAspectRatio='none'><path d='M1 3 Q 20 0 40 2 T 79 2' stroke='%23b6651e' stroke-width='1.4' fill='none' stroke-linecap='round'/></svg>\") center / 100% 100% no-repeat",
                }}
              />
            )}
          </Link>
        ))}
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div
          className="mobile-nav"
          style={{
            borderTop: "1px solid var(--rule)",
            padding: "16px 32px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                fontSize: 17,
                padding: "8px 0",
                color: isActive(href) ? "var(--accent)" : "var(--ink)",
                borderBottom: "1px dashed var(--rule)",
              }}
            >
              {label}
            </Link>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "10px 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 980px) {
          .mobile-nav-toggle { display: flex !important; }
          .mobile-sign-in { display: inline-flex !important; }
          .desktop-nav { display: none !important; }
          .desktop-user-info { display: none !important; }
          header > .wrap:first-child {
            grid-template-columns: 1fr auto auto !important;
          }
          header > .wrap:first-child > div:first-child { display: none; }
        }
        @media (min-width: 981px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </header>
  );
}
