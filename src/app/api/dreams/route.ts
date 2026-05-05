import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateTexts } from "@/lib/moderate";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, category, emotion } = await request.json();

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const [modTitle, modDescription] = await moderateTexts([title, description]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("anonymous_alias")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("dreams").insert({
    user_id: user.id,
    title: modTitle,
    description: modDescription,
    category: category || "other",
    emotion: emotion || "reflective",
    anonymous_alias: profile?.anonymous_alias || "Ghost",
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save dream" }, { status: 500 });
  }

  return NextResponse.json({ title: modTitle, description: modDescription });
}
