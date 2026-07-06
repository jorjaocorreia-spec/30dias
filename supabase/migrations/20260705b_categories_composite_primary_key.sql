-- Fix: categories/income_categories use a table-wide unique `id`, but default-category
-- seeding intentionally reuses the same id ('food', 'transport', 'income-salary', ...)
-- for every user. Only the first user in the whole system to claim a given id succeeds;
-- every other user's seed insert 409s and silently fails (error was never checked),
-- leaving them with default categories that render in the UI (local fallback) but were
-- never actually persisted to their account.
--
-- Fix: make the primary key composite (id, user_id) so each user can own their own row
-- with the same id. No code changes needed for update/delete — RLS (auth.uid() = user_id)
-- already scopes every operation to the current user's own rows.

ALTER TABLE categories DROP CONSTRAINT categories_pkey;
ALTER TABLE categories ADD PRIMARY KEY (id, user_id);

ALTER TABLE income_categories DROP CONSTRAINT income_categories_pkey;
ALTER TABLE income_categories ADD PRIMARY KEY (id, user_id);
