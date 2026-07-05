# Gestão de Fatura de Cartão de Crédito

Data: 2026-07-05

## Problema

Hoje, ao registrar uma despesa com `paymentMethod: 'credit_card'`, o valor é descontado do saldo mensal (`getMonthlyBalance`) e do "Disponível" imediatamente, na data da compra. Na vida real, o pagamento da fatura só ocorre no mês seguinte, na data de vencimento do cartão. Isso deixa o saldo do app fora de sincronia com o saldo real em conta.

## Escopo

Esta mudança afeta **apenas a visão de saldo/caixa** (Saldo do mês, card "Disponível" no dashboard). Orçamento por categoria, gráficos e listagem de despesas em `/expenses` continuam usando a **data da compra**, sem alteração — o objetivo é resolver a confusão do saldo, não redesenhar o controle de gastos por categoria.

Suporta **múltiplos cartões**, cada um com seu próprio dia de fechamento e vencimento, seguindo o mesmo modelo usado por apps de referência (Mobills, Organizze): despesas de cartão são agrupadas em faturas mensais, que só impactam o saldo em caixa quando vencem/são pagas.

## Modelo de dados

```ts
interface CreditCard {
  id: string
  name: string              // ex: "Nubank", "Inter"
  closingDay: number         // 1–31, dia de fechamento do ciclo
  dueDay: number             // 1–31, dia de vencimento da fatura
  color: string              // mesma paleta usada em categorias/metas
  isActive: boolean          // soft-retire, mesmo padrão de IncomeSource/FixedExpense
  createdAt: string          // YYYY-MM-DD
}

interface CreditCardInvoice {
  id: string
  creditCardId: string
  month: string              // YYYY-MM — mês de VENCIMENTO da fatura (não de fechamento)
  paid: boolean
  paidAt?: string            // YYYY-MM-DD
}
```

`Expense` ganha um campo novo:
```ts
creditCardId?: string   // obrigatório (via validação de formulário) quando paymentMethod === 'credit_card' em despesas novas
```

`CreditCardInvoice` não guarda valor: o total da fatura é sempre derivado somando as despesas do cartão que caem naquele ciclo (`getEffectiveAmount` aplicado a cada despesa com aquele `creditCardId` cujo `getInvoiceMonth` resulte no mês da fatura). O registro existe só para guardar o estado de confirmação de pagamento.

### Cálculo do mês de vencimento

Nova função em `weekHelpers.ts`:

```ts
function getInvoiceMonth(purchaseDate: string, card: Pick<CreditCard, 'closingDay' | 'dueDay'>): string
```

Regras:
1. Se o dia da compra > `closingDay` → o ciclo fecha no mês seguinte à compra.
2. Se `dueDay` (numericamente) < `closingDay` → o vencimento cai no mês seguinte ao fechamento (caso comum: fecha dia 28, vence dia 5 do mês seguinte).
3. Resultado final: string `YYYY-MM` do mês de vencimento.

Função pura e determinística — não depende de estado persistido.

## Página `/credit-cards`

Segue o mesmo padrão visual e de interação de `/fixed-expenses`.

**CRUD de cartões** (topo da página, como `/establishments`): nome, cor, dia de fechamento, dia de vencimento. Editar/excluir. Excluir um cartão com despesas vinculadas é bloqueado — o usuário deve reatribuir as despesas ou desativar o cartão (`isActive: false`) em vez de excluir, preservando histórico (mesmo padrão de fontes de renda inativas).

**Sincronização automática** — nova função `syncCreditCardInvoices()` no store, chamada nos mesmos gatilhos que `syncFixedExpenses()` (após mutações em despesas de cartão e no `onRehydrateStorage`):
- Para cada cartão ativo, agrupa despesas por `getInvoiceMonth(expense.date, card)`.
- Garante que existe um `CreditCardInvoice` (`creditCardId`, `month`) para cada mês com despesas — cria se faltar, nunca duplica (idempotente, igual a `syncFixedExpenses`).
- Nunca cria fatura para meses sem despesas.

**Conteúdo por cartão** (seção Pendentes em âmbar + histórico, como em `/fixed-expenses`):
- **Fatura aberta** (ciclo atual, ainda não fechou): total previsto até agora, "fecha em N dias".
- **Faturas pendentes de confirmação** (já fechadas, `paid: false`): total, data de vencimento, botão "Confirmar pagamento" → seta `paid: true`, `paidAt: hoje`.
- **Histórico**: faturas já pagas, expansível.

Clicar numa fatura expande a lista de despesas que a compõem (reaproveita a listagem de `/expenses` filtrada por `creditCardId` + mês calculado).

## Mudanças no `ExpenseForm`

- Quando `paymentMethod === 'credit_card'`, aparece um select "Cartão" (cartões ativos), no mesmo estilo do select de `establishment`.
- Validação Zod via `.superRefine`: `creditCardId` obrigatório quando `paymentMethod === 'credit_card'`.
- Sem nenhum cartão cadastrado: o select mostra um CTA "Cadastrar cartão" linkando para `/credit-cards`, evitando travar o registro da despesa.
- Parcelamentos continuam funcionando normalmente — cada parcela é uma `Expense` própria com seu `creditCardId`, cada uma cai na fatura calculada por sua própria data.

## Cálculo de saldo (dashboard) e migração de dados antigos

`getMonthlyBalance(month)` passa a usar um mês "efetivo" por despesa:

```ts
getMonthlyBalance: (month) => {
  const { incomeEntries, expenses, creditCards } = get()
  const income = incomeEntries.filter(e => e.month === month).reduce((s, e) => s + e.amount, 0)
  const monthExpenses = expenses
    .filter(e => effectiveMonth(e, creditCards) === month)
    .reduce((sum, e) => sum + getEffectiveAmount(e), 0)
  return { income, expenses: monthExpenses, balance: income - monthExpenses }
}
```

`effectiveMonth(expense, cards)`:
- `paymentMethod !== 'credit_card'` → `expense.date.slice(0, 7)` (comportamento atual, sem mudança).
- Cartão com `creditCardId` válido → `getInvoiceMonth(expense.date, card)`.
- Cartão **sem** `creditCardId` (despesas antigas, pré-migração) → fallback: mês da compra + 1.

**Migração:** sem backfill automático. Despesas de cartão já registradas continuam usando o fallback (compra + 1 mês) até serem opcionalmente editadas e associadas a um cartão. Evita uma migration arriscada tentando adivinhar qual cartão foi usado no passado.

Orçamento por categoria, gráficos e lista de despesas continuam por data da compra. Adicionar um texto de apoio no dashboard (ex: "saldo considera faturas de cartão pelo vencimento") para não confundir com a lista de despesas, que ainda mostra por data de compra.

## Schema Supabase (migrations + RLS)

Nova tabela `credit_cards`:
```sql
create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  color text not null default '#8b5cf6',
  is_active boolean not null default true,
  created_at date not null default current_date
);
alter table credit_cards enable row level security;
create policy "credit_cards_owner" on credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Nova tabela `credit_card_invoices`:
```sql
create table credit_card_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  month text not null,          -- YYYY-MM
  paid boolean not null default false,
  paid_at date,
  unique (credit_card_id, month)
);
alter table credit_card_invoices enable row level security;
create policy "credit_card_invoices_owner" on credit_card_invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Coluna nova em `expenses`:
```sql
alter table expenses add column credit_card_id uuid references credit_cards(id) on delete set null;
```

`on delete set null` — se um cartão for excluído (após reatribuição/desativação de todas as despesas vinculadas), as despesas não são apagadas, só perdem a referência e caem no fallback de cálculo.

O `unique (credit_card_id, month)` garante comportamento idempotente na sincronização — nunca duplica fatura pro mesmo cartão/mês.

## Fora de escopo

- Limite de crédito por cartão (não solicitado; pode ser adicionado depois se necessário).
- Backfill automático de `creditCardId` em despesas antigas.
- Alertas/notificações de vencimento de fatura via WhatsApp (pode reaproveitar o mecanismo já existente de lembretes de despesas fixas, mas não faz parte desta mudança).
- Mudança em orçamento por categoria, gráficos ou listagem de despesas — todos continuam por data da compra.
