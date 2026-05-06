import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "I Walked Out — A scrapbook for released dreams",
  description:
    "Log the dreams you walked away from. Browse others' abandoned ideas anonymously. Discover what your future self thinks about your decisions.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar user={user ? { email: user.email || "" } : null} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
