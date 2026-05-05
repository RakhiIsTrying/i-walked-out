import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const db = getAdmin();
        const { data: existingLink } = await db
          .from("telegram_links")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingLink) {
          const { data: existingCode } = await db
            .from("telegram_link_codes")
            .select("id")
            .eq("user_id", user.id)
            .eq("used", false)
            .single();

          if (!existingCode) {
            const linkCode = generateCode();
            await db.from("telegram_link_codes").insert({
              user_id: user.id,
              code: linkCode,
            });
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could+not+authenticate`);
}
