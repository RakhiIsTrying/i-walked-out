const DAILY_PROMPTS = [
  "What did you almost quit today?",
  "What are you pretending to care about?",
  "What would you walk away from if no one was watching?",
  "What dream are you keeping on life support?",
  "What did you lie to yourself about this week?",
  "What's the thing you keep starting over?",
  "What would you admit if it didn't matter?",
  "What are you doing out of guilt, not want?",
  "What's the dream that embarrasses you now?",
  "What would your past self be disappointed by?",
  "What are you too proud to quit?",
  "What would you stop doing if money wasn't involved?",
  "What's the thing everyone thinks you love but you don't?",
  "What are you avoiding by staying busy?",
  "What did you give up on so quietly nobody noticed?",
  "What are you still doing just to prove someone wrong?",
  "What would you never start if you could go back?",
  "What's the decision you keep postponing?",
  "What's the hobby you bought equipment for and never used?",
  "What do you say you'll do 'someday' but mean 'never'?",
  "What relationship are you in out of convenience?",
  "What skill did you half-learn and abandon?",
  "What would you walk out of right now if there were no consequences?",
  "What are you holding onto because letting go feels like failure?",
  "What's the thing you do that future-you will regret?",
  "What plan are you making that you'll never follow through on?",
  "What did someone say about you that stung because it was true?",
  "What are you afraid to be honest about?",
  "What would you do differently if no one remembered your past?",
  "What are you just going through the motions on?",
];

export function getDailyPrompt(date?: string): string {
  const d = date || new Date().toISOString().split("T")[0];
  const seed = dateToIndex(d);
  return DAILY_PROMPTS[seed % DAILY_PROMPTS.length];
}

function dateToIndex(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
