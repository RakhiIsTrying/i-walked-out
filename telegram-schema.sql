-- Telegram Integration Tables
-- Run this in your Supabase SQL editor

-- Telegram account linking
CREATE TABLE telegram_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  chat_mode TEXT DEFAULT NULL,
  linked_at TIMESTAMPTZ DEFAULT now()
);

-- One-time link codes (generated on website, redeemed via bot)
CREATE TABLE telegram_link_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat history for personality conversations
CREATE TABLE telegram_chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  chat_mode TEXT DEFAULT 'personality',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE telegram_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_chat_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own telegram link from the website
CREATE POLICY "Users can view own telegram link"
  ON telegram_links FOR SELECT USING (auth.uid() = user_id);

-- Users can delete their own telegram link (disconnect)
CREATE POLICY "Users can delete own telegram link"
  ON telegram_links FOR DELETE USING (auth.uid() = user_id);

-- Users can view their own link codes
CREATE POLICY "Users can view own link codes"
  ON telegram_link_codes FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own link codes
CREATE POLICY "Users can insert own link codes"
  ON telegram_link_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat history: users can view their own
CREATE POLICY "Users can view own chat history"
  ON telegram_chat_history FOR SELECT USING (auth.uid() = user_id);
