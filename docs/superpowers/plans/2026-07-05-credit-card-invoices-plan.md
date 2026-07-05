# Gestão de Fatura de Cartão de Crédito Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard's "Saldo do mês" and "Disponível" cards reflect credit card invoices by their due month (not the purchase date), while orçamento por categoria, gráficos and `/expenses` keep working by purchase date exactly as today.

**Architecture:** New `CreditCard` (template: name, closing/due day) and `CreditCardInvoice` (monthly instance, auto-generated, confirmable) entities, following the same template + monthly-instance + sync pattern already used by `FixedExpense`/`FixedExpenseMonth`. `Expense` gains an optional `creditCardId`. A new pure helper `getInvoiceMonth` computes which month a card expense's invoice is due in; `getEffectiveMonth` wraps it with a fallback for legacy card expenses with no `creditCardId`. `getMonthlyBalance` is the only balance-affecting function that changes.

**Tech Stack:** Next.js App Router, TypeScript, Zustand (no persist middleware in this store — state is Supabase-backed, refetched via `loadUserData`), Supabase (Postgres + RLS), React Hook Form + Zod, lucide-react, Framer Motion.

## Global Constraints

- No unit test runner is configured in this repo (`package.json` only has `lint`, `build`, and Playwright e2e scripts — no `vitest`/`jest`). Per-task "test" steps in this plan use `npx tsc --noEmit` for type-safety verification and manual dev-server checks (`npm run dev` + browser) instead of automated unit tests. Do not introduce a new test framework as part of this feature — out of scope.
- Follow existing store conventions exactly: `nanoid()` for ids, `toDB(obj, userId)` / `dbUpdate(data)` / `fromDB<T>(row)` for Supabase mapping, `if (user) supabase.from(...).then(({ error }) => { if (error) console.error(error) })` fire-and-forget writes, optimistic `set(...)` before the Supabase call.
- Supabase migrations: `id TEXT PRIMARY KEY` (nanoid strings, not `uuid`/`gen_random_uuid()`), `user_id UUID REFERENCES auth.users NOT NULL`, `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`, `CREATE POLICY "users own X" ON x FOR ALL USING (auth.uid() = user_id);` — copy the exact style of `supabase/migrations/20260527_financial_goals.sql`.
- Dark-only design system: never use `dark:` Tailwind prefix, always CSS vars (`var(--bg-card)`, `var(--accent)`, etc.) via inline `style={}`. Headings use `fontFamily: 'var(--font-syne)'`; monetary values use `fontFamily: 'var(--font-dm-mono)'`.
- Dates: `YYYY-MM-DD` strings, displayed via `new Date(date + 'T12:00:00')` (never raw `new Date(date)`, never `.toISOString()` for local dates — use `toLocalDateKey`).
- Scope: orçamento por categoria, gráficos and `/expenses` listing are NOT touched by this feature — they keep using purchase date. Only `getMonthlyBalance` changes.

---

### Task 1: Add `CreditCard` / `CreditCardInvoice` types and `Expense.creditCardId`

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `CreditCard`, `CreditCardInvoice` types, and `Expense.creditCardId?: string`, importable from `@/types` by every later task.

- [ ] **Step 1: Add the two new interfaces and the new `Expense` field**

In `src/types/index.ts`, add `creditCardId?: string` to the `Expense` interface (after `establishmentId`):

```ts
export interface Expense {
  id: string
  amount: number
  categoryId: string
  description: string
  date: string // ISO date string YYYY-MM-DD
  time?: string // HH:mm (hora local do lançamento)
  notes?: string
  weekKey: string // YYYY-WNN format
  paymentMethod: PaymentMethod
  establishmentId?: string
  creditCardId?: string        // qual cartão gerou esta despesa (obrigatório em novas despesas com paymentMethod === 'credit_card')
  fixedExpenseId?: string       // links to FixedExpense template
  fixedExpenseMonthId?: string  // links to the specific FixedExpenseMonth that generated this entry
  sharedWith?: ExpenseParticipant[]  // defined when expense is split among multiple people
  userShares?: number                // partes do próprio usuário (ex: casal = 2); padrão 1
  installmentGroupId?: string        // nanoid compartilhado entre todas as parcelas do mesmo parcelamento
  installmentCurrent?: number        // número da parcela (1-based)
  installmentTotal?: number          // total de parcelas
}
```

Then add these two new interfaces after `FixedExpenseMonth` (right after its closing `}`, before `IncomeCategory`):

```ts
export interface CreditCard {
  id: string
  name: string              // ex: "Nubank", "Inter"
  closingDay: number         // 1–31, dia de fechamento do ciclo
  dueDay: number             // 1–31, dia de vencimento da fatura
  color: string
  isActive: boolean
  createdAt: string          // YYYY-MM-DD
}

export interface CreditCardInvoice {
  id: string
  creditCardId: string
  month: string              // YYYY-MM — mês de VENCIMENTO da fatura
  paid: boolean
  paidAt?: string            // YYYY-MM-DD
}
```

- [ ] **Step 2: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors (the new fields are optional / new types are unused so far — should be identical output to before this change, likely zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add CreditCard and CreditCardInvoice types"
```

---

### Task 2: Add `getInvoiceMonth` and `getEffectiveMonth` helpers

**Files:**
- Modify: `src/lib/weekHelpers.ts`

**Interfaces:**
- Consumes: `Expense` (from Task 1, already existed), `CreditCard` (from Task 1: `{ id, name, closingDay, dueDay, color, isActive, createdAt }`).
- Produces: `getInvoiceMonth(purchaseDate: string, card: Pick<CreditCard, 'closingDay' | 'dueDay'>): string` and `getEffectiveMonth(expense: Expense, creditCards: CreditCard[]): string`, consumed by Task 6 (`getMonthlyBalance`) and Task 9 (credit card page invoice totals).

- [ ] **Step 1: Add the helpers**

In `src/lib/weekHelpers.ts`, change the top import to also bring in `CreditCard`:

```ts
import { CreditCard, Expense, WeekSummary } from '@/types'
```

Then add these two functions right after `addMonthsToDate` (after its closing `}`, before `getISOWeek`):

```ts
// Mês (YYYY-MM) em que a fatura do cartão vence, dado o dia da compra e o
// fechamento/vencimento do cartão. O vencimento é sempre cronologicamente
// depois do fechamento — se dueDay < closingDay numericamente, o vencimento
// cai no mês seguinte ao fechamento.
export function getInvoiceMonth(purchaseDate: string, card: Pick<CreditCard, 'closingDay' | 'dueDay'>): string {
  const d = new Date(purchaseDate + 'T12:00:00')
  const purchaseDay = d.getDate()

  const closeMonthDate = new Date(d.getFullYear(), d.getMonth(), 1)
  if (purchaseDay > card.closingDay) {
    closeMonthDate.setMonth(closeMonthDate.getMonth() + 1)
  }

  const dueMonthDate = new Date(closeMonthDate)
  if (card.dueDay < card.closingDay) {
    dueMonthDate.setMonth(dueMonthDate.getMonth() + 1)
  }

  return `${dueMonthDate.getFullYear()}-${String(dueMonthDate.getMonth() + 1).padStart(2, '0')}`
}

// Mês efetivo de uma despesa para fins de saldo/caixa: despesas não-cartão
// usam a data da compra; despesas de cartão usam o mês de vencimento da
// fatura. Despesas de cartão antigas sem creditCardId (pré-migração) caem
// no fallback "compra + 1 mês".
export function getEffectiveMonth(expense: Expense, creditCards: CreditCard[]): string {
  if (expense.paymentMethod !== 'credit_card') return expense.date.slice(0, 7)

  const card = creditCards.find(c => c.id === expense.creditCardId)
  if (!card) {
    const [year, month] = expense.date.slice(0, 7).split('-').map(Number)
    const d = new Date(year, month, 1) // month is 1-based here, so this is already +1
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return getInvoiceMonth(expense.date, card)
}
```

- [ ] **Step 2: Manually verify the formula with a scratch script**

Create a throwaway file `scratch-invoice-month.mjs` in the repo root (not committed) to sanity-check the logic in isolation before wiring it into the app:

```js
function getInvoiceMonth(purchaseDate, card) {
  const d = new Date(purchaseDate + 'T12:00:00')
  const purchaseDay = d.getDate()
  const closeMonthDate = new Date(d.getFullYear(), d.getMonth(), 1)
  if (purchaseDay > card.closingDay) closeMonthDate.setMonth(closeMonthDate.getMonth() + 1)
  const dueMonthDate = new Date(closeMonthDate)
  if (card.dueDay < card.closingDay) dueMonthDate.setMonth(dueMonthDate.getMonth() + 1)
  return `${dueMonthDate.getFullYear()}-${String(dueMonthDate.getMonth() + 1).padStart(2, '0')}`
}

const cases = [
  ['2026-01-20', { closingDay: 28, dueDay: 5 }, '2026-02'],   // before closing, due next month -> due month = purchase+1
  ['2026-01-29', { closingDay: 28, dueDay: 5 }, '2026-03'],   // after closing, rolls to next cycle, due month+1 again
  ['2026-01-22', { closingDay: 23, dueDay: 30 }, '2026-01'],  // before closing, due same month
  ['2026-01-24', { closingDay: 23, dueDay: 30 }, '2026-02'],  // after closing, due next month
]

for (const [date, card, expected] of cases) {
  const got = getInvoiceMonth(date, card)
  console.log(got === expected ? 'PASS' : 'FAIL', date, card, 'expected', expected, 'got', got)
}
```

Run: `node scratch-invoice-month.mjs`
Expected: four `PASS` lines.

Delete the scratch file afterward: `rm scratch-invoice-month.mjs` (PowerShell: `Remove-Item scratch-invoice-month.mjs`).

- [ ] **Step 3: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/weekHelpers.ts
git commit -m "feat: add getInvoiceMonth and getEffectiveMonth helpers"
```

---

### Task 3: Supabase migration — `credit_cards`, `credit_card_invoices`, `expenses.credit_card_id`

**Files:**
- Create: `supabase/migrations/20260705_credit_cards.sql`

**Interfaces:**
- Produces: tables `credit_cards`, `credit_card_invoices`, column `expenses.credit_card_id` — consumed by Task 4/5's Supabase calls.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Run this SQL in the Supabase SQL Editor for this project (same manual process used for prior migrations in `supabase/migrations/`).
Expected: no errors; `credit_cards` and `credit_card_invoices` tables exist, `expenses` has a new nullable `credit_card_id` column.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260705_credit_cards.sql
git commit -m "feat: add credit_cards and credit_card_invoices tables"
```

---

### Task 4: Store — `creditCards` state, CRUD actions, load/logout wiring

**Files:**
- Modify: `src/store/useAppStore.ts`

**Interfaces:**
- Consumes: `CreditCard` type (Task 1), `toDB`, `dbUpdate`, `fromDB`, `nanoid`, `getTodayKey` (already imported in this file).
- Produces: `creditCards: CreditCard[]` state, `addCreditCard`, `updateCreditCard`, `deleteCreditCard` actions — consumed by Task 7 (ExpenseForm) and Task 9 (credit cards page).

- [ ] **Step 1: Add `CreditCard` to the type import and add state field**

At the top import (line 6), add `CreditCard` to the destructured import from `@/types`:

```ts
import { Category, CreditCard, CreditCardInvoice, Establishment, Expense, ExpenseParticipant, FinancialGoal, FixedExpense, FixedExpenseMonth, GoalContribution, UserPreferences, IncomeCategory, IncomeSource, IncomeEntry, MonthlyBudget, UserAchievement } from '@/types'
```

In the `AppState` interface, add after `fixedExpenseMonths: FixedExpenseMonth[]`:

```ts
  creditCards: CreditCard[]
  creditCardInvoices: CreditCardInvoice[]
```

And add to the actions section, right after the `syncFixedExpenses: () => void` line:

```ts
  // Credit Cards
  addCreditCard: (data: Omit<CreditCard, 'id' | 'createdAt'>) => void
  updateCreditCard: (id: string, data: Partial<Omit<CreditCard, 'id' | 'createdAt'>>) => void
  deleteCreditCard: (id: string) => void

  // Credit Card Invoices
  syncCreditCardInvoices: () => void
  setCreditCardInvoicePaid: (id: string, paid: boolean) => void
```

In the store's initial state object (where `fixedExpenseMonths: [],` is set, around line 160), add:

```ts
  creditCards: [],
  creditCardInvoices: [],
```

In the `SIGNED_OUT` reset block inside `initAuth` (around line 195, next to `fixedExpenseMonths: [],`), add:

```ts
          creditCards: [],
          creditCardInvoices: [],
```

- [ ] **Step 2: Fetch `credit_cards` / `credit_card_invoices` in `loadUserData`**

In `loadUserData`, add two entries to the `Promise.all` array (right after `supabase.from('fixed_expense_months').select('*'),`):

```ts
        supabase.from('credit_cards').select('*'),
        supabase.from('credit_card_invoices').select('*'),
```

Add matching destructured result names to the array on the left (`const [catRes, estRes, expRes, feRes, femRes, ccRes, ccInvRes, icatRes, isrcRes, ieRes, prefRes, goalsRes, contribRes, mbRes, achRes] =`).

In the final `set({...})` call inside `loadUserData`, add:

```ts
      creditCards: ccRes.data?.map(r => fromDB<CreditCard>(r)) ?? [],
      creditCardInvoices: ccInvRes.data?.map(r => fromDB<CreditCardInvoice>(r)) ?? [],
```

Right after `get().syncFixedExpenses()` (still inside `loadUserData`), add:

```ts
    get().syncCreditCardInvoices()
```

- [ ] **Step 3: Add the CRUD actions**

Right after the `syncFixedExpenses` action closes (after its final `},`), add a new section:

```ts
  // ── Credit Cards ─────────────────────────────────────────────────────────
  addCreditCard: (data) => {
    const card: CreditCard = { ...data, id: nanoid(), createdAt: getTodayKey() }
    set(state => ({ creditCards: [...state.creditCards, card] }))
    const { user } = get()
    if (user) supabase.from('credit_cards').insert(toDB(card, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateCreditCard: (id, data) => {
    set(state => ({ creditCards: state.creditCards.map(c => c.id === id ? { ...c, ...data } : c) }))
    const { user } = get()
    if (user) supabase.from('credit_cards').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteCreditCard: (id) => {
    const inUse = get().expenses.some(e => e.creditCardId === id)
    if (inUse) return
    set(state => ({
      creditCards: state.creditCards.filter(c => c.id !== id),
      creditCardInvoices: state.creditCardInvoices.filter(inv => inv.creditCardId !== id),
    }))
    const { user } = get()
    if (user) {
      Promise.all([
        supabase.from('credit_cards').delete().eq('id', id),
        supabase.from('credit_card_invoices').delete().eq('credit_card_id', id),
      ]).then(results => results.forEach(({ error }) => { if (error) console.error(error) }))
    }
  },
```

- [ ] **Step 4: Verify the project type-checks**

Run: `npx tsc --noEmit`
Expected: errors only about `syncCreditCardInvoices`/`setCreditCardInvoicePaid` not yet implemented would NOT appear (they're declared in the interface but Task 5 implements them — TypeScript will error that the object literal doesn't satisfy `AppState` until Task 5 is done). This task's `tsc` run is expected to FAIL with `Property 'syncCreditCardInvoices' is missing` — that's fine, confirms Task 5 is required next. Do not treat this as a task failure; just don't commit broken code as final — commit Task 4 and Task 5 together if needed, or proceed straight to Task 5 before committing.

- [ ] **Step 5: Commit** (only after Task 5's methods exist too, so the file type-checks clean — see Task 5 Step 3)

---

### Task 5: Store — `syncCreditCardInvoices`, `setCreditCardInvoicePaid`, sync triggers

**Files:**
- Modify: `src/store/useAppStore.ts`

**Interfaces:**
- Consumes: `getInvoiceMonth` (Task 2), `creditCards`/`creditCardInvoices` state (Task 4).
- Produces: `syncCreditCardInvoices()`, `setCreditCardInvoicePaid(id, paid)` — consumed by Task 9 (credit cards page) and called internally after expense mutations.

- [ ] **Step 1: Import `getInvoiceMonth`**

In the `weekHelpers` import line (line 9), add `getInvoiceMonth`:

```ts
import { getWeekKey, getCurrentWeekKey, getMondaysBetween, getTodayKey, toLocalDateKey, getEffectiveAmount, getWeeksUntilDeadline, getInvoiceMonth, getEffectiveMonth } from '@/lib/weekHelpers'
```

(`getEffectiveMonth` is added here too, needed by Task 6.)

- [ ] **Step 2: Add the two actions**

Right after the `deleteCreditCard` action (end of Task 4's new section), add:

```ts
  // ── Credit Card Invoices ─────────────────────────────────────────────────
  syncCreditCardInvoices: () => {
    const { creditCards, expenses, creditCardInvoices, user } = get()
    const newInvoices: CreditCardInvoice[] = []

    for (const card of creditCards) {
      const months = new Set(
        expenses
          .filter(e => e.creditCardId === card.id)
          .map(e => getInvoiceMonth(e.date, card))
      )
      for (const month of months) {
        const exists = creditCardInvoices.some(inv => inv.creditCardId === card.id && inv.month === month)
          || newInvoices.some(inv => inv.creditCardId === card.id && inv.month === month)
        if (!exists) {
          newInvoices.push({ id: nanoid(), creditCardId: card.id, month, paid: false })
        }
      }
    }

    if (newInvoices.length === 0) return
    set(state => ({ creditCardInvoices: [...state.creditCardInvoices, ...newInvoices] }))
    if (user) {
      supabase.from('credit_card_invoices').insert(newInvoices.map(inv => toDB(inv, user.id)))
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  setCreditCardInvoicePaid: (id, paid) => {
    const paidAt = paid ? getTodayKey() : undefined
    set(state => ({
      creditCardInvoices: state.creditCardInvoices.map(inv => inv.id === id ? { ...inv, paid, paidAt } : inv),
    }))
    const { user } = get()
    if (user) {
      supabase.from('credit_card_invoices').update(dbUpdate({ paid, paidAt: paidAt ?? null })).eq('id', id)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },
```

- [ ] **Step 3: Call `syncCreditCardInvoices()` after expense mutations that can introduce new card months**

In `addExpense`, right after `get().checkAchievements()` (end of that action), add:

```ts
    get().syncCreditCardInvoices()
```

Do the same in `addExpenses` (after its own `get().checkAchievements()`), and in `updateExpense` (at the very end of that action, after the `if (user) { ... }` block — `updateExpense` currently has no `checkAchievements()` call, so add the sync call as the last line of the action body).

- [ ] **Step 4: Verify the project type-checks**

Run: `npx tsc --noEmit`
Expected: no errors (this closes out the `AppState` interface implementation started in Task 4).

- [ ] **Step 5: Commit** (this closes Task 4 + Task 5 together since they share one interface)

```bash
git add src/store/useAppStore.ts
git commit -m "feat: add credit card CRUD and invoice sync to store"
```

---

### Task 6: `getMonthlyBalance` uses `getEffectiveMonth`

**Files:**
- Modify: `src/store/useAppStore.ts`

**Interfaces:**
- Consumes: `getEffectiveMonth` (Task 2, already imported in Task 5 Step 1), `creditCards` state (Task 4).

- [ ] **Step 1: Update `getMonthlyBalance`**

Replace:

```ts
  getMonthlyBalance: (month) => {
    const { incomeEntries, expenses } = get()
    const income = incomeEntries.filter(e => e.month === month).reduce((sum, e) => sum + e.amount, 0)
    const monthExpenses = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + getEffectiveAmount(e), 0)
    return { income, expenses: monthExpenses, balance: income - monthExpenses }
  },
```

with:

```ts
  getMonthlyBalance: (month) => {
    const { incomeEntries, expenses, creditCards } = get()
    const income = incomeEntries.filter(e => e.month === month).reduce((sum, e) => sum + e.amount, 0)
    const monthExpenses = expenses
      .filter(e => getEffectiveMonth(e, creditCards) === month)
      .reduce((sum, e) => sum + getEffectiveAmount(e), 0)
    return { income, expenses: monthExpenses, balance: income - monthExpenses }
  },
```

- [ ] **Step 2: Manual verification via dev server**

Run: `npm run dev`, open `http://localhost:3000/dashboard`.
Expected: dashboard loads with no console errors; "Saldo do mês" numbers are unchanged for a month with no credit-card expenses (pix/ted/cash-only months must show identical totals to before this change, since `getEffectiveMonth` returns `expense.date.slice(0,7)` for non-card expenses — same as the old `e.date.startsWith(month)` check).

- [ ] **Step 3: Commit**

```bash
git add src/store/useAppStore.ts
git commit -m "feat: getMonthlyBalance uses invoice month for credit card expenses"
```

---

### Task 7: `ExpenseForm` — credit card selection

**Files:**
- Modify: `src/components/ui/ExpenseForm.tsx`

**Interfaces:**
- Consumes: `creditCards` state and `addCreditCard`... no — this task only *reads* `creditCards` from the store (no card creation from within the expense form; card creation happens on `/credit-cards`, Task 9). Consumes `useAppStore().creditCards: CreditCard[]`.
- Produces: `creditCardId` on the submitted `Expense`/`Expense[]`, consumed at runtime by `getEffectiveMonth` (Task 2/6).

- [ ] **Step 1: Add `creditCards` to the store destructure and `CreditCardId` to the zod schema**

At the top of the component (line 48), add `creditCards` to the destructure:

```ts
  const { categories, establishments, creditCards, addExpense, addExpenses, updateExpense, addCategory, addEstablishment, addFixedExpense } = useAppStore()
```

Update the zod schema (replace the whole `schema` object) to add conditional validation:

```ts
const schema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  description: z.string().min(1, 'Descrição obrigatória').max(100),
  date: z.string().min(1, 'Data obrigatória'), // armazena YYYY-MM-DDTHH:mm no form
  notes: z.string().optional(),
  paymentMethod: z.enum(['credit_card', 'pix', 'ted', 'cash']),
  establishmentId: z.string().optional(),
  creditCardId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'credit_card' && !data.creditCardId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['creditCardId'], message: 'Selecione o cartão' })
  }
})
```

- [ ] **Step 2: Add `creditCardId` to form default values and reset payloads**

In the `useForm` `defaultValues` object, add after `establishmentId`:

```ts
      creditCardId: initialData?.creditCardId ?? undefined,
```

In `newExpenseDefaults` (around line 183), add:

```ts
    creditCardId: undefined,
```

- [ ] **Step 3: Render the card select, right after the Payment Method block**

Right after the closing `</div>` of the "Payment Method" block (after the `{errors.paymentMethod && ...}` line, before the "Notes" block), add:

```tsx
      {/* Credit card selection — only when paymentMethod is credit_card */}
      {selectedPaymentMethod === 'credit_card' && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Cartão</label>
          {creditCards.length === 0 ? (
            <a href="/credit-cards" className="block text-xs px-4 py-3 rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-input)', color: 'var(--accent)' }}>
              Nenhum cartão cadastrado — cadastrar cartão →
            </a>
          ) : (
            <select
              aria-label="Cartão"
              {...register('creditCardId')}
              className={fieldClass} style={fieldStyle}
            >
              <option value="">Selecione o cartão</option>
              {creditCards.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {errors.creditCardId && <p className="text-xs mt-1.5 text-red-400">{errors.creditCardId.message}</p>}
        </div>
      )}
```

(`fieldClass`/`fieldStyle` are declared further down in the component, right before the `return` — since they are `const` declarations without hooks, moving this JSX block is safe as JSX is only evaluated at render time inside the returned tree, not at declaration time. Confirm by checking `fieldClass`/`fieldStyle` are declared before the `return (` statement, which they are — verify with the file's existing structure before pasting.)

- [ ] **Step 4: Confirm `creditCardId` flows through to `addExpense`/`addExpenses`/`updateExpense`**

No change needed here — `expenseData` (built from `{ ...data, date: dateOnly, time: timeOnly }` in `onSubmit`) already spreads every zod-validated field including the new `creditCardId`, and all three call sites (`addExpense`, `addExpenses` installment loop, `updateExpense`) spread `expenseData`. Just re-read `onSubmit` to confirm no field allowlist filters it out.

- [ ] **Step 5: Manual verification via dev server**

Run: `npm run dev`, open `/expenses/new`.
Expected: selecting "Cartão de Crédito" as payment method reveals a "Cartão" select; submitting without picking a card shows "Selecione o cartão"; with no cards registered, a link to `/credit-cards` appears instead of the select (this route doesn't exist until Task 9 — confirm the link renders, 404 is expected until then).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ExpenseForm.tsx
git commit -m "feat: require credit card selection on card expenses"
```

---

### Task 8: Navbar — add `/credit-cards` nav item

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

**Interfaces:**
- Produces: a `/credit-cards` link in the nav, consumed visually once Task 9's page exists.

- [ ] **Step 1: Add the icon import and nav item**

Add `CreditCard` to the lucide-react import (line 6):

```ts
import { LayoutDashboard, PlusCircle, Tag, BarChart2, Store, List, Repeat2, Wallet, TrendingUp, Target, LogOut, Plug, ChevronLeft, ChevronRight, HelpCircle, MoreHorizontal, X, Trophy, CreditCard } from 'lucide-react'
```

Add a new entry to `navItems`, right after the `/fixed-expenses` entry so it sits next to the other recurring-expense management page:

```ts
  { href: '/fixed-expenses', icon: Repeat2, label: 'Fixas', section: 'main' },
  { href: '/credit-cards', icon: CreditCard, label: 'Cartões', section: 'main' },
```

- [ ] **Step 2: Manual verification via dev server**

Run: `npm run dev`, check the sidebar (desktop) and the "mais" bottom-nav overflow (mobile) at `/dashboard`.
Expected: "Cartões" appears in the sidebar; since `bottomNavPrimary = navItems.slice(0, 4)` and this entry becomes the 5th `main`-section item, it likely lands in `bottomNavMore` on mobile — confirm it's reachable via the "mais" (More) button, not silently dropped.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: add Cartões nav item"
```

---

### Task 9: `/credit-cards` page — CRUD + faturas pendentes + histórico

**Files:**
- Create: `src/app/(app)/credit-cards/page.tsx`

**Interfaces:**
- Consumes: `useAppStore().creditCards`, `creditCardInvoices`, `expenses`, `addCreditCard`, `updateCreditCard`, `deleteCreditCard`, `setCreditCardInvoicePaid` (Tasks 4–5), `getInvoiceMonth`, `getEffectiveAmount`, `formatCurrency` (Tasks 2, existing `weekHelpers`).

- [ ] **Step 1: Write the page**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, CreditCard as CreditCardIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, getEffectiveAmount, getInvoiceMonth } from '@/lib/weekHelpers'
import { CreditCard } from '@/types'

const QUICK_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#64748b']

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

interface CardForm {
  name: string
  closingDay: string
  dueDay: string
  color: string
  isActive: boolean
}

const defaultCardForm: CardForm = { name: '', closingDay: '', dueDay: '', color: QUICK_COLORS[0], isActive: true }

export default function CreditCardsPage() {
  const { creditCards, creditCardInvoices, expenses, addCreditCard, updateCreditCard, deleteCreditCard, setCreditCardInvoicePaid } = useAppStore()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [form, setForm] = useState<CardForm>(defaultCardForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const cardsInUse = useMemo(() => new Set(expenses.filter(e => e.creditCardId).map(e => e.creditCardId!)), [expenses])

  const invoiceTotal = (cardId: string, month: string) =>
    expenses
      .filter(e => e.creditCardId === cardId && getInvoiceMonth(e.date, creditCards.find(c => c.id === cardId)!) === month)
      .reduce((sum, e) => sum + getEffectiveAmount(e), 0)

  const invoicesForCard = (cardId: string) =>
    creditCardInvoices.filter(inv => inv.creditCardId === cardId).sort((a, b) => b.month.localeCompare(a.month))

  const openNew = () => { setEditing(null); setForm(defaultCardForm); setShowForm(true) }
  const openEdit = (card: CreditCard) => {
    setEditing(card)
    setForm({ name: card.name, closingDay: String(card.closingDay), dueDay: String(card.dueDay), color: card.color, isActive: card.isActive })
    setShowForm(true)
  }

  const save = () => {
    const closingDay = parseInt(form.closingDay, 10)
    const dueDay = parseInt(form.dueDay, 10)
    if (!form.name.trim() || !closingDay || !dueDay || closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) return
    const data = { name: form.name.trim(), closingDay, dueDay, color: form.color, isActive: form.isActive }
    if (editing) updateCreditCard(editing.id, data)
    else addCreditCard(data)
    setShowForm(false)
  }

  const toggleActive = (card: CreditCard) => updateCreditCard(card.id, { isActive: !card.isActive })

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Cartões de Crédito</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {creditCards.filter(c => c.isActive).length} ativos
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
          <Plus size={15} /> Novo
        </button>
      </div>

      {creditCards.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <CreditCardIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p className="text-sm font-medium">Nenhum cartão cadastrado</p>
          <p className="text-xs mt-1">Cadastre para acompanhar suas faturas por vencimento</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {creditCards.map(card => {
            const invoices = invoicesForCard(card.id)
            const pending = invoices.filter(inv => !inv.paid)
            const isExpanded = expandedId === card.id
            const isDeleting = deleteConfirm === card.id
            const inUse = cardsInUse.has(card.id)

            return (
              <motion.div key={card.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', opacity: card.isActive ? 1 : 0.6 }}>

                <div className="flex items-start gap-3 p-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.color + '20' }}>
                    <CreditCardIcon size={18} style={{ color: card.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{card.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                      {pending.length > 0 && ` · ${pending.length} fatura${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <button onClick={() => setExpandedId(isExpanded ? null : card.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div className="px-3.5 pb-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        {invoices.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhuma fatura ainda.</p>
                        ) : invoices.map(inv => {
                          const total = invoiceTotal(card.id, inv.month)
                          return (
                            <div key={inv.id} className="flex items-center justify-between gap-2">
                              <span className="text-xs" style={{ color: inv.paid ? 'var(--text-muted)' : '#f59e0b' }}>
                                {formatMonth(inv.month)}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-dm-mono)' }}>{formatCurrency(total)}</span>
                                <button onClick={() => setCreditCardInvoicePaid(inv.id, !inv.paid)}
                                  className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                  style={{ background: inv.paid ? 'var(--bg-input)' : 'rgba(245,158,11,0.15)', color: inv.paid ? 'var(--text-muted)' : '#f59e0b' }}>
                                  {inv.paid ? 'Paga' : 'Confirmar pagamento'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isDeleting ? (
                  <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-1">
                    <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>Excluir este cartão?</p>
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>Cancelar</button>
                    <button onClick={() => { deleteCreditCard(card.id); setDeleteConfirm(null) }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#ef444420', color: '#ef4444' }}>Excluir</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 pb-3.5 pt-1">
                    <button onClick={() => toggleActive(card)}
                      className="flex items-center gap-2 text-xs font-medium"
                      style={{ color: card.isActive ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 20, borderRadius: 10, background: card.isActive ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: card.isActive ? 19 : 3, transition: 'left 0.2s' }} />
                      </div>
                      {card.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(card)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => !inUse && setDeleteConfirm(card.id)}
                        disabled={inUse}
                        title={inUse ? 'Desative em vez de excluir — há despesas vinculadas' : undefined}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-40"
                        style={{ background: '#ef444420', color: '#ef4444' }}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} />
            <motion.div
              className="fixed lg:relative bottom-0 lg:bottom-auto left-0 lg:left-auto right-0 lg:right-auto rounded-t-3xl lg:rounded-2xl border-t lg:border mt-4"
              style={{ background: 'var(--bg-modal)', borderColor: 'var(--border)', maxHeight: 'calc(92vh - env(safe-area-inset-bottom))', overflowY: 'auto', zIndex: 50 }}
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="lg:hidden flex justify-center pt-3">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hover)' }} />
              </div>
              <div className="p-5 space-y-4" style={{ paddingBottom: 'calc(var(--bottomnav-h) + env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{editing ? 'Editar cartão' : 'Novo cartão'}</h2>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                    <X size={15} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nome</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Nubank, Inter..." className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Dia de fechamento</label>
                    <select value={form.closingDay} onChange={e => setForm({ ...form, closingDay: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <option value="">Selecione</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>Dia {d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Dia de vencimento</label>
                    <select value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <option value="">Selecione</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>Dia {d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Cor</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_COLORS.map(color => (
                      <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                        className="w-7 h-7 rounded-full flex-shrink-0"
                        style={{ background: color, border: form.color === color ? '2px solid var(--text)' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>

                {editing && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Ativo</p>
                    <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      style={{ width: 44, height: 24, borderRadius: 12, flexShrink: 0, background: form.isActive ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.isActive ? 23 : 3, transition: 'left 0.2s' }} />
                    </button>
                  </div>
                )}

                <button onClick={save}
                  disabled={!form.name.trim() || !form.closingDay || !form.dueDay}
                  className="w-full py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                  {editing ? 'Salvar alterações' : 'Criar cartão'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify the project type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification via dev server**

Run: `npm run dev`, open `/credit-cards`.
Expected: can create a card (e.g. "Nubank", fechamento 28, vencimento 5); it appears in the list. Register a credit-card expense at `/expenses/new` dated before/after the closing day and confirm (after returning to `/credit-cards` and expanding the card) that an invoice appears grouped in the expected month, with the correct total; clicking "Confirmar pagamento" flips its state to "Paga". Attempting to delete a card with an expense linked to it should show the button disabled with a tooltip; a card with no expenses should delete normally.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/credit-cards/page.tsx"
git commit -m "feat: add /credit-cards page"
```

---

### Task 10: Dashboard microcopy — clarify saldo uses invoice month

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- No new interfaces — purely a UI text addition next to the existing "Saldo do mês" card described in the design (around line 369).

- [ ] **Step 1: Add the caption**

Find this block (around line 368-373):

```tsx
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Saldo do mês</p>
          <Link href="/income" className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
            Ver receitas
          </Link>
        </div>
```

Replace it with (adds a caption paragraph below the header row):

```tsx
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Saldo do mês</p>
          <Link href="/income" className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
            Ver receitas
          </Link>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
          Despesas de cartão contam pelo vencimento da fatura, não pela data da compra
        </p>
```

- [ ] **Step 2: Manual verification via dev server**

Run: `npm run dev`, open `/dashboard`.
Expected: the caption renders under the "Saldo do mês" header, styled subtly (`--text-dim`), doesn't break the card's layout on mobile or desktop widths.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "docs: clarify saldo do mes uses invoice month for card expenses"
```

---

## Self-Review Notes

- **Spec coverage:** Data model (Task 1), `getInvoiceMonth`/fallback (Task 2), Supabase schema + RLS (Task 3), card CRUD (Task 4), invoice sync + confirmation (Task 5), balance calc (Task 6), `ExpenseForm` required card select (Task 7), nav entry (Task 8), `/credit-cards` page with pendentes/histórico (Task 9), dashboard caption so category/expense-list-vs-balance discrepancy isn't confusing (Task 10). "Fora de escopo" items from the spec (credit limit, backfill, WhatsApp alerts, category/graph changes) are correctly not implemented anywhere in this plan.
- **Type consistency:** `CreditCard`/`CreditCardInvoice` field names (`closingDay`, `dueDay`, `creditCardId`, `paid`, `paidAt`) are used identically across Tasks 1, 2, 4, 5, 6, 7, 9. `getInvoiceMonth(purchaseDate, card)` and `getEffectiveMonth(expense, creditCards)` signatures match between their Task 2 definition and every call site in Tasks 5, 6, 9.
- **No placeholders:** every step has real, complete code — no "similar to Task N" shortcuts; the credit-cards page (Task 9) is fully written out rather than deferring to the fixed-expenses page pattern.
