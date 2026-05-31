-- Adiciona coluna date em fixed_expense_months
ALTER TABLE fixed_expense_months ADD COLUMN IF NOT EXISTS date DATE;

-- Remove entradas semanais duplicadas geradas pelo sync antigo (divisão por 4).
-- Para cada fixed_expense_month_id, mantém apenas uma entrada (a de menor id).
DELETE FROM expenses
WHERE fixed_expense_month_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (fixed_expense_month_id) id
    FROM expenses
    WHERE fixed_expense_month_id IS NOT NULL
    ORDER BY fixed_expense_month_id, id ASC
  );

-- Redefine o amount das entradas remanescentes para o valor mensal cheio
-- (antes era amount/4; agora deve ser o valor total do mês).
UPDATE expenses e
SET amount = fem.amount
FROM fixed_expense_months fem
WHERE e.fixed_expense_month_id = fem.id;
