import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateTexts } from "@/lib/moderate";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, options } = await request.json();

  if (!title || !options || options.length < 2) {
    return NextResponse.json(
      { error: "Title and at least 2 options required" },
      { status: 400 }
    );
  }

  const allTexts = [title, description || "", ...options];
  const moderated = await moderateTexts(allTexts);

  const modTitle = moderated[0];
  const modDescription = moderated[1];
  const modOptions = moderated.slice(2);

  const { data: profile } = await supabase
    .from("profiles")
    .select("anonymous_alias")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("sticky_decisions").insert({
    user_id: user.id,
    title: modTitle,
    description: modDescription,
    options: modOptions,
    anonymous_alias: profile?.anonymous_alias || "Ghost",
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save decision" }, { status: 500 });
  }

  return NextResponse.json({
    title: modTitle,
    description: modDescription,
    options: modOptions,
  });
}
