export interface Dream {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: DreamCategory;
  emotion: string;
  created_at: string;
  anonymous_alias: string;
  reactions?: Record<string, number>;
}

export type DreamCategory =
  | "career"
  | "relationship"
  | "creative"
  | "business"
  | "education"
  | "travel"
  | "health"
  | "other";

export interface PersonalityProfile {
  id: string;
  user_id: string;
  traits: PersonalityTraits;
  summary: string;
  archetype: string;
  updated_at: string;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  risk_tolerance: number;
  decision_style: string;
  core_values: string[];
  fear_patterns: string[];
  aspiration_themes: string[];
}

export interface StickyDecision {
  id: string;
  user_id: string;
  title: string;
  description: string;
  options: string[];
  created_at: string;
  anonymous_alias: string;
  votes: StickyVote[];
  total_votes: number;
}

export interface StickyVote {
  id: string;
  decision_id: string;
  user_id: string;
  chosen_option: number;
  created_at: string;
}

export interface VibeResult {
  query: string;
  place: string;
  place_location?: string;
  movie: string;
  movie_platform?: string;
  tv_show: string;
  tv_show_platform?: string;
  food: string;
  food_location?: string;
  game: string;
  game_platform?: string;
  song: string;
  song_artist?: string;
  song_album?: string;
  music_album: string;
  music_album_artist?: string;
  youtube: string;
  vibe_summary: string;
}

export interface UserProfile {
  id: string;
  email: string;
  anonymous_alias: string;
  dream_count: number;
  personality_generated: boolean;
  created_at: string;
}
