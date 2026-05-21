-- ============================================================
-- 7Dias — Schema Supabase
-- Executar no SQL Editor do Supabase (uma vez)
-- ============================================================

-- Categories
create table if not exists categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean default false
);
alter table categories enable row level security;
create policy "own" on categories for all using (auth.uid() = user_id);

-- Establishments
create table if not exists establishments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id text not null
);
alter table establishments enable row level security;
create policy "own" on establishments for all using (auth.uid() = user_id);

-- Expenses
create table if not exists expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  category_id text not null,
  description text not null,
  date text not null,
  notes text,
  week_key text not null,
  payment_method text not null,
  establishment_id text,
  fixed_expense_id text,
  fixed_expense_month_id text
);
alter table expenses enable row level security;
create policy "own" on expenses for all using (auth.uid() = user_id);

-- Fixed Expenses (templates)
create table if not exists fixed_expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  suggested_amount numeric(10,2) not null,
  category_id text not null,
  establishment_id text,
  payment_method text not null,
  notes text,
  is_active boolean default true,
  created_at text not null
);
alter table fixed_expenses enable row level security;
create policy "own" on fixed_expenses for all using (auth.uid() = user_id);

-- Fixed Expense Months
create table if not exists fixed_expense_months (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  fixed_expense_id text not null,
  month text not null,
  amount numeric(10,2) not null
);
alter table fixed_expense_months enable row level security;
create policy "own" on fixed_expense_months for all using (auth.uid() = user_id);

-- Income Categories
create table if not exists income_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean default false
);
alter table income_categories enable row level security;
create policy "own" on income_categories for all using (auth.uid() = user_id);

-- Income Sources
create table if not exists income_sources (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  expected_amount numeric(10,2) not null,
  category_id text not null,
  payment_method text not null,
  notes text,
  is_active boolean default true,
  created_at text not null
);
alter table income_sources enable row level security;
create policy "own" on income_sources for all using (auth.uid() = user_id);

-- Income Entries
create table if not exists income_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  income_source_id text,
  category_id text not null,
  description text not null,
  amount numeric(10,2) not null,
  month text not null,
  received_date text,
  payment_method text not null,
  notes text
);
alter table income_entries enable row level security;
create policy "own" on income_entries for all using (auth.uid() = user_id);

-- User Preferences
create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'dark',
  weekly_budget numeric(10,2) default 1000,
  budget_mode text default 'fixed',
  category_budgets jsonb default '{}',
  currency text default 'BRL'
);
alter table user_preferences enable row level security;
create policy "own" on user_preferences for all using (auth.uid() = user_id);
