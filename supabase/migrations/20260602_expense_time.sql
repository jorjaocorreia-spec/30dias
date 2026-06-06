-- Add time column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS time TEXT;
