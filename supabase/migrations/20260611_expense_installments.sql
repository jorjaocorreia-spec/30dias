ALTER TABLE expenses
  ADD COLUMN installment_group_id TEXT,
  ADD COLUMN installment_current  INTEGER,
  ADD COLUMN installment_total    INTEGER;
