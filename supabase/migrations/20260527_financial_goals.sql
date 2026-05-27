-- Financial Goals feature
-- financial_goals: goal templates (target, deadline, config)
-- goal_contributions: monthly contributions recorded by the user

CREATE TABLE IF NOT EXISTS financial_goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  deadline TEXT NOT NULL,        -- YYYY-MM
  icon TEXT NOT NULL DEFAULT 'Target',
  color TEXT NOT NULL DEFAULT '#10b981',
  notes TEXT,
  weekly_amount NUMERIC,         -- manual override; NULL = auto-calculated
  deduct_from_budget BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL,
  completed_at TEXT              -- YYYY-MM-DD when goal was reached
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  goal_id TEXT NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  month TEXT NOT NULL,           -- YYYY-MM
  amount NUMERIC NOT NULL
);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own goals"
  ON financial_goals FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users own goal contributions"
  ON goal_contributions FOR ALL
  USING (auth.uid() = user_id);
