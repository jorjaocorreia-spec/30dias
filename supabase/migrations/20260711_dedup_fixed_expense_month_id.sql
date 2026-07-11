-- syncFixedExpenses() checks `alreadyExists` against in-memory client state before
-- inserting one Expense per FixedExpenseMonth. Without a DB-level guard, two
-- concurrent calls (two tabs, or a stale/racing client) that both read the same
-- "not yet synced" state each insert their own row, producing duplicate expenses
-- for the same fixed_expense_month_id — cleaned up client-side on next load
-- (see dedup filter in loadUserData) but never actually removed from the database.

-- Remove existing duplicates, keeping one row per fixed_expense_month_id
-- (same "keep smallest id" convention as 20260531_fixed_expense_month_date.sql).
DELETE FROM expenses
WHERE fixed_expense_month_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (fixed_expense_month_id) id
    FROM expenses
    WHERE fixed_expense_month_id IS NOT NULL
    ORDER BY fixed_expense_month_id, id ASC
  );

-- Enforce uniqueness going forward: a FixedExpenseMonth can back at most one Expense.
CREATE UNIQUE INDEX IF NOT EXISTS expenses_fixed_expense_month_id_unique
  ON expenses (fixed_expense_month_id)
  WHERE fixed_expense_month_id IS NOT NULL;
