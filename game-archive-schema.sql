-- Game archive table for storing completed game results
CREATE TABLE IF NOT EXISTS game_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('wordle', 'crossword', 'sudoku', 'spelling')),
  played_at DATE NOT NULL DEFAULT CURRENT_DATE,
  won BOOLEAN NOT NULL DEFAULT false,
  score INTEGER DEFAULT 0,
  result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_game_archives_user ON game_archives(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_archives_type ON game_archives(user_id, game_type, played_at DESC);

-- Prevent duplicate entries for same game on same day (optional, allows multiple wordle rounds)
-- No unique constraint since wordle is now unlimited

-- RLS
ALTER TABLE game_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archives"
  ON game_archives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archives"
  ON game_archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);
