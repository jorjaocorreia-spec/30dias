-- Credit card invoice management
-- credit_cards: card templates (name, closing/due day)
-- credit_card_invoices: monthly invoice instance per card, confirmable by the user

CREATE TABLE IF NOT EXISTS credit_cards (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  closing_day INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_card_invoices (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  credit_card_id TEXT NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  month TEXT NOT NULL,           -- YYYY-MM (mês de vencimento)
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TEXT,
  UNIQUE (credit_card_id, month)
);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS credit_card_id TEXT REFERENCES credit_cards(id) ON DELETE SET NULL;

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own credit cards"
  ON credit_cards FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users own credit card invoices"
  ON credit_card_invoices FOR ALL
  USING (auth.uid() = user_id);
