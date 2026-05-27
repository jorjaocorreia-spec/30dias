-- ============================================================
-- Vencimento e lembretes WhatsApp para despesas fixas
-- Executar no SQL Editor do Supabase
-- ============================================================

-- Dia do mês do vencimento (1–31); NULL = sem vencimento definido
ALTER TABLE fixed_expenses
  ADD COLUMN IF NOT EXISTS due_date_day INT CHECK (due_date_day >= 1 AND due_date_day <= 31),
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT false;

-- Número WhatsApp pessoal do usuário (necessário para lembretes)
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
