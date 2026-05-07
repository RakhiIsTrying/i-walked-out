-- I Walked Out - Database Schema
-- Run this in your Supabase SQL editor

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  anonymous_alias TEXT NOT NULL DEFAULT 'Ghost_' || substr(gen_random_uuid()::text, 1, 8),
  dream_count INTEGER DEFAULT 0,
  personality_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dreams (walked-out moments)
CREATE TABLE dreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  emotion TEXT NOT NULL DEFAULT 'reflective',
  anonymous_alias TEXT NOT NULL,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Personality profiles (AI-generated)
CREATE TABLE personality_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  traits JSONB NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  archetype TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sticky decisions
CREATE TABLE sticky_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  anonymous_alias TEXT NOT NULL,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sticky votes
CREATE TABLE sticky_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID REFERENCES sticky_decisions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chosen_option INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(decision_id, user_id)
);

-- Vibe searches (history)
CREATE TABLE vibe_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_searches ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Dreams: anyone can read (anonymous feed), users manage their own
CREATE POLICY "Anyone can view dreams" ON dreams FOR SELECT USING (true);
CREATE POLICY "Users can insert own dreams" ON dreams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own dreams" ON dreams FOR DELETE USING (auth.uid() = user_id);

-- Personality: only owner can view
CREATE POLICY "Users can view own personality" ON personality_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own personality" ON personality_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personality" ON personality_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Sticky decisions: anyone can read, users manage their own
CREATE POLICY "Anyone can view decisions" ON sticky_decisions FOR SELECT USING (true);
CREATE POLICY "Users can insert own decisions" ON sticky_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own decisions" ON sticky_decisions FOR DELETE USING (auth.uid() = user_id);

-- Sticky votes: anyone can read, users can vote once
CREATE POLICY "Anyone can view votes" ON sticky_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON sticky_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vibe searches: users can manage their own, anonymous allowed
CREATE POLICY "Users can view own searches" ON vibe_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert searches" ON vibe_searches FOR INSERT WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, anonymous_alias)
  VALUES (
    new.id,
    new.email,
    'Ghost_' || substr(new.id::text, 1, 8)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment dream count trigger
CREATE OR REPLACE FUNCTION public.increment_dream_count()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET dream_count = dream_count + 1 WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_dream_created
  AFTER INSERT ON dreams
  FOR EACH ROW EXECUTE FUNCTION public.increment_dream_count();

-- Increment vote count trigger
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS trigger AS $$
BEGIN
  UPDATE sticky_decisions SET total_votes = total_votes + 1 WHERE id = NEW.decision_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_vote_created
  AFTER INSERT ON sticky_votes
  FOR EACH ROW EXECUTE FUNCTION public.increment_vote_count();

-- Dream reactions (anonymous, stored as JSONB on dreams table)
-- Run this migration if upgrading from an earlier version:
-- ALTER TABLE dreams ADD COLUMN reactions JSONB DEFAULT '{}';
