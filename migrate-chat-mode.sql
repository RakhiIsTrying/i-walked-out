-- Migration: Change chat_mode from BOOLEAN to TEXT, add chat_mode to chat history
-- Run this in your Supabase SQL editor

-- 1. Change chat_mode column from BOOLEAN to TEXT on telegram_links
ALTER TABLE telegram_links
  ALTER COLUMN chat_mode DROP DEFAULT,
  ALTER COLUMN chat_mode TYPE TEXT USING CASE WHEN chat_mode = true THEN 'personality' ELSE NULL END,
  ALTER COLUMN chat_mode SET DEFAULT NULL;

-- 2. Add chat_mode column to telegram_chat_history (to separate dugdug vs personality history)
ALTER TABLE telegram_chat_history
  ADD COLUMN IF NOT EXISTS chat_mode TEXT DEFAULT 'personality';

-- 3. Backfill existing chat history as 'personality' (they were all personality chats before)
UPDATE telegram_chat_history SET chat_mode = 'personality' WHERE chat_mode IS NULL;
