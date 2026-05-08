import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateTexts, stripPII } from "@/lib/moderate";

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

  const stripped = [stripPII(title), stripPII(description)];

  const { data: profile } = await supabase
    .from("profiles")
    .select("anonymous_alias")
    .eq("id", user.id)
    .single();

  const { data: dream, error } = await supabase
    .from("dreams")
    .insert({
      user_id: user.id,
      title: stripped[0],
      description: stripped[1],
      category: category || "other",
      emotion: emotion || "reflective",
      anonymous_alias: profile?.anonymous_alias || "Ghost",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save dream" }, { status: 500 });
  }

  moderateTexts([stripped[0], stripped[1]])
    .then(async ([modTitle, modDesc]) => {
      if (modTitle !== stripped[0] || modDesc !== stripped[1]) {
        await supabase
          .from("dreams")
          .update({ title: modTitle, description: modDesc })
          .eq("id", dream.id);
      }
    })
    .catch(() => {});

  return NextResponse.json({ title: stripped[0], description: stripped[1] });
}
