-- Achievements feature
-- Catalog of achievements lives in code (src/lib/achievements.ts);
-- this table only stores which ones each user has unlocked.

CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,  -- YYYY-MM-DD
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id);
