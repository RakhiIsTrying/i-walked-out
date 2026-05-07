import { getAdmin } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";
import { moderateTexts } from "@/lib/moderate";
import { getUserLink } from "./helpers";

export async function handleSticky(chatId: number, text: string) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const content = text.replace(/^\/sticky\s*/i, "").trim();
  if (!content) {
    await sendMessage(
      chatId,
      `*Post a Sticky Decision:*\n` +
        `/sticky title | description | option1 | option2 | option3\n\n` +
        `*Example:*\n` +
        `/sticky Should I quit my job? | Been thinking for months | Yes quit | Stay 6 more months | Go part-time`
    );
    return;
  }

  const parts = content.split("|").map((p) => p.trim());
  if (parts.length < 4) {
    await sendMessage(
      chatId,
      "Need at least: title | description | option1 | option2\n\nSeparate everything with |"
    );
    return;
  }

  const allTexts = [parts[0], parts[1], ...parts.slice(2)];
  const moderated = await moderateTexts(allTexts);
  const title = moderated[0];
  const description = moderated[1];
  const options = moderated.slice(2);

  const db = getAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("anonymous_alias")
    .eq("id", link.user_id)
    .single();

  const { error } = await db.from("sticky_decisions").insert({
    user_id: link.user_id,
    title,
    description,
    options,
    anonymous_alias: profile?.anonymous_alias || "Ghost",
  });

  if (error) {
    await sendMessage(chatId, "Failed to post decision. Try again.");
    return;
  }

  const optionsList = options.map((o, i) => `  ${i + 1}. ${o}`).join("\n");
  await sendMessage(
    chatId,
    `*Decision posted!*\n\n🎲 *${title}*\n${description}\n\nOptions:\n${optionsList}\n\n_Others can now vote on this at i-walked-out.vercel.app or with /decisions_`
  );
}

export async function handleDecisions(chatId: number) {
  const db = getAdmin();
  const { data: decisions } = await db
    .from("sticky_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!decisions || decisions.length === 0) {
    await sendMessage(chatId, "No decisions posted yet. Be the first with /sticky");
    return;
  }

  const lines = decisions.map((d, i) => {
    const options = (d.options || []) as string[];
    const optStr = options.map((o: string, j: number) => `  ${j + 1}. ${o}`).join("\n");
    return (
      `*${i + 1}. ${d.title}* (${d.total_votes} votes)\n` +
      `${d.description}\n` +
      `${optStr}\n` +
      `_— ${d.anonymous_alias}_\n` +
      `Vote: /vote ${i + 1} <option\\_number>`
    );
  });

  await sendMessage(
    chatId,
    `🎲 *Sticky Decisions*\n\n${lines.join("\n\n")}`
  );
}

export async function handleVote(chatId: number, text: string) {
  const link = await getUserLink(chatId);
  if (!link) {
    await sendMessage(chatId, "Connect your account first: /connect your@email.com");
    return;
  }

  const parts = text.split(/\s+/);
  const decisionNum = parseInt(parts[1]);
  const optionNum = parseInt(parts[2]);

  if (!decisionNum || !optionNum) {
    await sendMessage(
      chatId,
      "Usage: /vote <decision\\_number> <option\\_number>\n\nSee decisions with /decisions"
    );
    return;
  }

  const db = getAdmin();
  const { data: decisions } = await db
    .from("sticky_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!decisions || decisionNum > decisions.length || decisionNum < 1) {
    await sendMessage(chatId, "Invalid decision number. Check /decisions");
    return;
  }

  const decision = decisions[decisionNum - 1];
  const options = (decision.options || []) as string[];

  if (optionNum < 1 || optionNum > options.length) {
    await sendMessage(chatId, `Invalid option. This decision has ${options.length} options.`);
    return;
  }

  const { error } = await db.from("sticky_votes").insert({
    decision_id: decision.id,
    user_id: link.user_id,
    chosen_option: optionNum - 1,
  });

  if (error) {
    if (error.code === "23505") {
      await sendMessage(chatId, "You already voted on this one!");
    } else {
      await sendMessage(chatId, "Failed to vote. Try again.");
    }
    return;
  }

  await sendMessage(
    chatId,
    `Voted *"${options[optionNum - 1]}"* on *"${decision.title}"*`
  );
}
