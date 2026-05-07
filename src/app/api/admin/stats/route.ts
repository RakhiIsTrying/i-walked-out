import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "rakhisinha100896@gmail.com";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdmin();

  const [
    { count: userCount },
    { count: dreamCount },
    { count: stickyCount },
    { count: voteCount },
    { count: vibeCount },
    { count: bucketCount },
    { count: telegramLinkCount },
    { count: personalityCount },
    { count: gameArchiveCount },
    { count: chatHistoryCount },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("dreams").select("*", { count: "exact", head: true }),
    db.from("sticky_decisions").select("*", { count: "exact", head: true }),
    db.from("sticky_votes").select("*", { count: "exact", head: true }),
    db.from("vibe_searches").select("*", { count: "exact", head: true }),
    db.from("vibe_bucketlist").select("*", { count: "exact", head: true }),
    db.from("telegram_links").select("*", { count: "exact", head: true }),
    db.from("personality_profiles").select("*", { count: "exact", head: true }),
    db.from("game_archives").select("*", { count: "exact", head: true }),
    db.from("telegram_chat_history").select("*", { count: "exact", head: true }),
  ]);

  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, anonymous_alias, dream_count, personality_generated, created_at")
    .order("created_at", { ascending: false });

  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const phoneMap = new Map<string, string>();
  const providerMap = new Map<string, string>();
  if (authData?.users) {
    for (const u of authData.users) {
      if (u.phone) phoneMap.set(u.id, u.phone);
      providerMap.set(u.id, u.app_metadata?.provider || "email");
    }
  }

  const users = (profiles || []).map((p) => ({
    ...p,
    phone: phoneMap.get(p.id) || null,
    provider: providerMap.get(p.id) || "email",
  }));

  const { data: recentDreams } = await db
    .from("dreams")
    .select("id, title, category, emotion, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentSticky } = await db
    .from("sticky_decisions")
    .select("id, title, options, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentVibes } = await db
    .from("vibe_searches")
    .select("id, query, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: recentGames } = await db
    .from("game_archives")
    .select("id, game_type, score, won, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const today = new Date().toISOString().slice(0, 10);
  const { count: todayUsers } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  const { count: todayDreams } = await db
    .from("dreams")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  return NextResponse.json({
    stats: {
      users: userCount || 0,
      dreams: dreamCount || 0,
      sticky_decisions: stickyCount || 0,
      votes: voteCount || 0,
      vibe_searches: vibeCount || 0,
      bucket_items: bucketCount || 0,
      telegram_links: telegramLinkCount || 0,
      personalities: personalityCount || 0,
      games_played: gameArchiveCount || 0,
      chat_messages: chatHistoryCount || 0,
      today_users: todayUsers || 0,
      today_dreams: todayDreams || 0,
    },
    users,
    recentDreams: recentDreams || [],
    recentSticky: recentSticky || [],
    recentVibes: recentVibes || [],
    recentGames: recentGames || [],
  });
}
