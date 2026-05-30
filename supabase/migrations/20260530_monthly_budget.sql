-- Add monthly_budget column to user_preferences.
-- This replaces the weekly_budget as the source of truth for budget definition.
-- The weekly slice is always derived: monthlyBudget / weeksInCurrentMonth.
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12,2);

-- Migrate existing data: convert weekly → monthly (* 4 approximation)
UPDATE user_preferences
SET monthly_budget = weekly_budget * 4
WHERE monthly_budget IS NULL AND weekly_budget IS NOT NULL;

-- Default for new rows
ALTER TABLE user_preferences ALTER COLUMN monthly_budget SET DEFAULT 4000;
