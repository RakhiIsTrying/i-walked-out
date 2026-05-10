import { sendMessage } from "@/lib/telegram";

export async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    `*I Walked Out — Commands*\n\n` +
      `👻 *Dead Dreams*\n` +
      `/dream title | desc | category — Log a dream\n` +
      `/prompt — Today's daily reflection prompt\n` +
      `/feed — Browse the graveyard\n\n` +
      `🪞 *AI Personality Mirror*\n` +
      `/personality — Generate your profile\n` +
      `/chat — Talk to your future self\n` +
      `/nigel — Talk to nigel (the unhinged communal AI)\n` +
      `/exit — Leave chat mode\n\n` +
      `🎲 *Sticky Decisions*\n` +
      `/sticky title | desc | opt1 | opt2 — Post a decision\n` +
      `/decisions — Browse & vote\n` +
      `/vote <num> <option> — Cast your vote\n\n` +
      `✨ *Vibe Coding IRL*\n` +
      `/vibe <phrase> — Life recs from a feeling\n` +
      `/bucket — View your bucket list\n` +
      `/bucket add <cat> | <item> — Add to list\n` +
      `/bucket done <num> — Check off an item\n\n` +
      `🎮 *Games*\n` +
      `/games — See today's games & your status\n` +
      `/wordle — Play today's Wordle\n` +
      `/bee — Play today's Spelling Bee\n` +
      `/endgame — Quit current game\n` +
      `/leaderboard — View top players\n\n` +
      `🔗 *Account*\n` +
      `/connect <email> — Link with your signup email\n` +
      `/link <code> — Or use a code from dashboard\n\n` +
      `_Hand the world something gentler than it gave you._`
  );
}
