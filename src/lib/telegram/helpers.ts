import { getAdmin } from "@/lib/supabase/admin";

export async function getUserLink(chatId: number) {
  const db = getAdmin();
  const { data } = await db
    .from("telegram_links")
    .select("user_id, chat_mode")
    .eq("telegram_chat_id", chatId)
    .single();
  return data;
}

export async function getActiveChatMode(userId: string): Promise<"personality" | "dugdug" | null> {
  const db = getAdmin();
  const { data } = await db
    .from("telegram_chat_history")
    .select("content")
    .eq("user_id", userId)
    .eq("role", "assistant")
    .like("content", "@@MODE:%")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;
  const mode = data[0].content.replace("@@MODE:", "");
  if (mode === "dugdug") return "dugdug";
  if (mode === "personality") return "personality";
  return null;
}

export async function setActiveChatMode(userId: string, mode: "personality" | "dugdug") {
  const db = getAdmin();
  await db.from("telegram_chat_history").insert({
    user_id: userId,
    role: "assistant",
    content: `@@MODE:${mode}`,
  });
}

export async function clearActiveChatMode(userId: string) {
  const db = getAdmin();
  await db.from("telegram_chat_history").insert({
    user_id: userId,
    role: "assistant",
    content: "@@MODE:off",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGameState(chatId: number, gameType: string): Promise<any | null> {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  const { data } = await db
    .from("telegram_game_state")
    .select("state")
    .eq("telegram_chat_id", chatId)
    .eq("game_type", gameType)
    .eq("game_date", today)
    .single();
  return data?.state || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setGameState(chatId: number, gameType: string, state: any) {
  const today = new Date().toISOString().split("T")[0];
  const db = getAdmin();
  await db.from("telegram_game_state").upsert({
    telegram_chat_id: chatId,
    game_type: gameType,
    game_date: today,
    state,
    updated_at: new Date().toISOString(),
  }, { onConflict: "telegram_chat_id,game_type,game_date" });
}
