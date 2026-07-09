-- Adiciona created_at em expenses para distinguir despesas pré-registradas
-- (date futura no momento do lançamento) de lançamentos do próprio dia,
-- usado pelo cron de lembretes para não avisar sobre despesas variáveis
-- que já aconteceram (ver /api/cron/fixed-expense-reminders).
alter table expenses add column if not exists created_at timestamptz not null default now();
