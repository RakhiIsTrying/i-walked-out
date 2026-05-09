import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  saveWebMessage,
  getWebChatHistory,
  analyzeUserIfNeeded,
} from "@/lib/chat-learning";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatType, role, content } = await request.json();

  if (!chatType || !role || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await saveWebMessage(user.id, chatType, role, content);

  if (role === "user") {
    analyzeUserIfNeeded(user.id).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatType = searchParams.get("type") as "nigel" | "self";

  if (!chatType) {
    return NextResponse.json({ error: "Missing type" }, { status: 400 });
  }

  const history = await getWebChatHistory(user.id, chatType, 50);
  return NextResponse.json({ history });
}
