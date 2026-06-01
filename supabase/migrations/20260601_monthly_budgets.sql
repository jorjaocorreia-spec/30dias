-- Monthly budgets per user per month.
-- Allows budget values to be stored historically and propagated to future months.
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,            -- YYYY-MM
  monthly_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  category_budgets JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_budgets_user" ON monthly_budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
