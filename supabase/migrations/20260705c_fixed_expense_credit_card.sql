-- Allows a fixed expense template to be linked to a credit card, so monthly
-- generated entries count by invoice due month (getInvoiceMonth) instead of
-- falling into the legacy "purchase + 1 month" fallback in getEffectiveMonth.

ALTER TABLE fixed_expenses
  ADD COLUMN IF NOT EXISTS credit_card_id TEXT REFERENCES credit_cards(id) ON DELETE SET NULL;
