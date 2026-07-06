@AGENTS.md

# 30dias — Projeto

MVP+ completo. Build: `npm run build`. Dev: `npm run dev` → `http://localhost:3000`. Produção: `https://jorge-30dias.27pl2o.easypanel.host`

Fintech premium de gestão financeira pessoal com **foco mensal** e acompanhamento semanal dentro do mês. App **responsivo com igual peso** mobile/desktop.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** (sem plugins, CSS vars para design system)
- **Zustand** com `persist` (chave: `30dias-storage`)
- **React Hook Form** + **Zod** | **Recharts** | **Framer Motion**
- **lucide-react** (atenção: `Chrome` não existe — usar SVG inline) | **nanoid**

## Arquitetura de pastas

```
src/
├── app/
│   ├── layout.tsx / globals.css / page.tsx
│   └── (app)/
│       ├── layout.tsx              # Guard auth + Navbar
│       ├── dashboard/page.tsx
│       ├── expenses/{page,new,[id]}/page.tsx
│       ├── categories/page.tsx
│       ├── establishments/page.tsx
│       ├── fixed-expenses/page.tsx
│       ├── goals/page.tsx
│       ├── income/page.tsx
│       ├── budget/page.tsx
│       ├── summary/page.tsx
│       ├── integrations/page.tsx
│       └── help/{page.tsx,[slug]/page.tsx}
├── components/layout/{Navbar,ThemeProvider}.tsx
├── components/ui/{CategoryIcon,ExpenseForm}.tsx
├── store/useAppStore.ts
├── lib/weekHelpers.ts
├── data/{categories,incomeCategories,seedExpenses,helpContent}.ts
└── types/index.ts
```

## Modelos de dados

```ts
type PaymentMethod = 'credit_card' | 'pix' | 'ted' | 'cash'

interface ExpenseParticipant {
  id: string; name: string; amount: number; paid: boolean; paidAt?: string  // YYYY-MM-DD
  shares?: number   // partes que essa pessoa representa (ex: casal = 2); padrão 1
}
interface Expense {
  id: string; amount: number; categoryId: string; description: string
  date: string            // YYYY-MM-DD
  weekKey: string         // YYYY-WNN
  paymentMethod: PaymentMethod
  notes?: string; establishmentId?: string; creditCardId?: string
  fixedExpenseId?: string; fixedExpenseMonthId?: string
  sharedWith?: ExpenseParticipant[]   // definido quando a despesa é dividida
  userShares?: number                 // partes do próprio usuário no split (ex: casal = 2); padrão 1
  installmentGroupId?: string         // nanoid compartilhado entre todas as parcelas do mesmo parcelamento
  installmentCurrent?: number         // número da parcela (1-based)
  installmentTotal?: number           // total de parcelas
}
interface Category { id: string; name: string; icon: string; color: string; isDefault?: boolean }
// IncomeCategory tem a mesma forma que Category
interface Establishment { id: string; name: string; categoryId: string }
interface FixedExpense {
  id: string; description: string; suggestedAmount: number; categoryId: string  // suggestedAmount obrigatório (> 0)
  establishmentId?: string; paymentMethod: PaymentMethod; notes?: string
  isActive: boolean; createdAt: string   // YYYY-MM-DD
  dueDateDay?: number      // dia do mês do vencimento (1–31)
  reminderEnabled?: boolean
}
interface FixedExpenseMonth { id: string; fixedExpenseId: string; month: string; amount: number }
interface CreditCard {
  id: string; name: string              // ex: "Nubank", "Inter"
  closingDay: number         // 1–31, dia de fechamento do ciclo
  dueDay: number             // 1–31, dia de vencimento da fatura
  color: string; isActive: boolean; createdAt: string          // YYYY-MM-DD
}
interface CreditCardInvoice {
  id: string; creditCardId: string
  month: string              // YYYY-MM — mês de VENCIMENTO da fatura
  paid: boolean; paidAt?: string            // YYYY-MM-DD
}
interface FinancialGoal {
  id: string; name: string; targetAmount: number; deadline: string  // YYYY-MM
  icon: string; color: string; notes?: string
  weeklyAmount?: number      // override manual; senão auto-calculado
  deductFromBudget: boolean  // se true, subtrai do orçamento mensal
  isActive: boolean; createdAt: string; completedAt?: string  // YYYY-MM-DD
}
interface GoalContribution { id: string; goalId: string; month: string; amount: number }
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'; monthlyBudget: number
  budgetMode: 'fixed' | 'per_category'; categoryBudgets: Record<string, number>  // valores mensais
  currency: string; whatsappNumber?: string
  availableMode?: 'budget' | 'income'   // modo do card "Disponível" no dashboard; padrão 'budget'
}
interface IncomeSource {
  id: string; description: string; expectedAmount: number; categoryId: string
  paymentMethod: PaymentMethod; notes?: string; isActive: boolean; createdAt: string
}
interface IncomeEntry {
  id: string; incomeSourceId?: string; categoryId: string; description: string
  amount: number; month: string   // YYYY-MM
  receivedDate?: string; paymentMethod: PaymentMethod; notes?: string
}
interface UserAchievement { id: string; achievementId: string; unlockedAt: string }  // YYYY-MM-DD
```

### Receitas
- `IncomeSource` = template recorrente; `IncomeEntry` = registro real do mês (avulso quando sem `incomeSourceId`)
- Deletar fonte → cascata remove `incomeEntries` vinculados
- `getMonthlyBalance(month)` → `{ income, expenses, balance }`
- Categorias de receita separadas das de despesa (`incomeCategories` no store). Defaults: Salário, Freelance, Investimentos, Aluguel, Vendas, Outros

### Despesas fixas
- `FixedExpense` = template; `FixedExpenseMonth` = valor real confirmado por mês
- `syncFixedExpenses()` gera **uma** `Expense` por `FixedExpenseMonth` (não 4 semanais) — data = `fem.date` > `dueDateDay` do template normalizado pro mês > dia 1º; idempotente via `fixedExpenseMonthId` (`alreadyExists` guard)
- Chamar após qualquer mutação em `fixedExpenseMonths` e em `onRehydrateStorage`
- Deletar template → remove `fixedExpenseMonths` + `expenses` vinculados
- `dueDateDay` + `reminderEnabled`: lembrete WhatsApp 1 dia antes e no dia do vencimento. Ver seção "Lembretes de vencimento"
- **`creditCardId?`** no template: obrigatório na UI quando `paymentMethod === 'credit_card'` (seletor em `/fixed-expenses`, mesmo padrão do `ExpenseForm`). `syncFixedExpenses()` copia esse valor pra `Expense.creditCardId` gerada. **Sem isso, a despesa fixa cai no fallback "compra + 1 mês" de `getEffectiveMonth`, mês após mês, permanentemente** — foi a causa raiz de um bug real onde despesas fixas antigas (antes da feature de cartões existir) inflavam o GASTOS do mês seguinte. Migration: `supabase/migrations/20260705c_fixed_expense_credit_card.sql`

### Despesas parceladas
- `installmentGroupId` = nanoid gerado uma vez, copiado para todas as N parcelas do mesmo parcelamento
- `installmentCurrent` / `installmentTotal` — identificam a posição da parcela (ex: 3/12)
- Ao registrar, o `ExpenseForm` gera N `Expense` via `addExpenses` (batch insert — 1 round-trip)
- Cada parcela cai no dia `dueDayOfMonth` do mês correspondente; meses curtos (fev) usam o último dia
- Helper `addMonthsToDate(baseDate, months, dueDayOfMonth)` em `weekHelpers.ts` cuida dos edge cases
- Helper `isInstallment(expense)` → `(installmentTotal ?? 1) > 1`
- Última parcela absorve o resíduo de centavo: `total - parcela × (N-1)`
- Cada parcela é independente após criação — editar/excluir individualmente
- `addExpenses(items[])` no store — insere um array de despesas em um único `supabase.insert(rows)`
- Migration: `supabase/migrations/20260611_expense_installments.sql` (já aplicada)

### Despesas divididas (split)
- `amount` = valor total pago; `sharedWith` = partes de cada participante
- `getEffectiveAmount(expense)` em `weekHelpers.ts` → `amount - soma(sharedWith)` = parte do usuário
- **Todos os cálculos de orçamento e saldo usam `getEffectiveAmount`** (cálculos mensais, getMonthlyBalance)
- `markParticipantAsPaid(expenseId, participantId, paid)` — registra pagamento com data
- `getSharedPendingTotal(month?)` — total a receber no mês (usado no card do dashboard)
- Coluna `shared_with JSONB` na tabela `expenses` do Supabase (já migrada)
- **`shares`** em `ExpenseParticipant`: quantas partes essa pessoa representa (casal = 2). "Dividir igual" distribui proporcionalmente; arredondamento ocorre após multiplicar (nunca antes)
- **`userShares`** em `Expense`: partes do próprio usuário no split. Contador `+`/`−` na linha "Sua parte" do form. `getEffectiveAmount` continua correto pois retorna o resto após subtrair os participantes

### Cartões de crédito

- `CreditCard` = template do cartão (nome, dia de fechamento, dia de vencimento); `CreditCardInvoice` = instância mensal auto-gerada, com `paid`/`paidAt` para confirmação manual
- `getInvoiceMonth(purchaseDate, card)` em `weekHelpers.ts` — calcula o mês (`YYYY-MM`) de vencimento da fatura a partir do dia da compra e do fechamento/vencimento do cartão
- `getEffectiveMonth(expense, creditCards)` em `weekHelpers.ts` — mês efetivo de uma despesa para fins de saldo: despesas não-cartão usam a data da compra; despesas de cartão usam o mês de vencimento da fatura; despesas de cartão sem `creditCardId` (legado) caem no fallback "compra + 1 mês"
- **Somente `getMonthlyBalance` e os cálculos de "Disponível"/"GASTOS" do dashboard usam `getEffectiveMonth`** — orçamento por categoria, gráficos e a listagem de `/expenses` continuam por data da compra, propositalmente
- `syncCreditCardInvoices()` gera faturas automaticamente a partir das despesas de cartão, chamada após `addExpense`, `addExpenses`, `updateExpense` e no `onRehydrateStorage` — idem ao padrão de `syncFixedExpenses()`
- Excluir um cartão é bloqueado (no-op) se houver despesas vinculadas (`creditCardId`) — o usuário deve desativar (`isActive: false`) em vez de excluir
- Página `/credit-cards`: CRUD de cartões + histórico de faturas por cartão com confirmação manual de pagamento; cada fatura é expansível e lista as despesas que a compõem (data, descrição/categoria, valor) para conferência
- Migration: `supabase/migrations/20260705_credit_cards.sql`
- **`inv.paid`/`paidAt` são só um marcador manual** — não alteram `getMonthlyBalance`/GASTOS/Orçamento (que seguem por competência via `getEffectiveMonth`, mês de vencimento da fatura). Confirmar pagamento não muda nenhum valor de planejamento, só alimenta o regime de caixa abaixo
- `getPendingInvoicesTotal(month?)` — soma das faturas **não pagas** que vencem no mês; alimenta o card "Faturas a pagar" no dashboard (aparece só quando > 0, clique leva a `/credit-cards`)
- `getCashBalance(month)` — **regime de caixa real**, separado do `getMonthlyBalance` (competência): despesas não-cartão contam pela data da compra; faturas de cartão só entram no mês em que forem marcadas como pagas (`paidAt`), nunca no mês de vencimento. Usado só no card "Saldo em caixa" do dashboard — não afeta orçamento, categorias ou GASTOS
- **Dois regimes coexistem de propósito:** "Saldo do mês"/GASTOS/Orçamento = competência (planejamento, conta a despesa no mês de vencimento da fatura mesmo sem pagar); "Saldo em caixa" = regime de caixa (dinheiro que de fato saiu da conta). Não fundir os dois — cada um serve a um propósito diferente

### Metas financeiras
- `FinancialGoal` = template com alvo, prazo e config; `GoalContribution` = contribuição mensal registrada pelo usuário
- Deletar meta → cascata remove `goalContributions` vinculados
- `getGoalProgress(goalId)` → `{ contributed, remaining, weeklyNeeded, weeksLeft, percentage, effectiveWeekly }`
  - `effectiveWeekly = goal.weeklyAmount ?? weeklyNeeded` (auto se não houver override)
  - `weeklyNeeded = remaining / weeksLeft` calculado por `getWeeksUntilDeadline(deadline)` em `weekHelpers.ts`
- `getGoalWeeklyTotal(deductOnly?)` → soma das semanais de metas ativas (deductOnly=true filtra só as que deduzem)
- Metas com `deductFromBudget=true` aparecem na página de Orçamento como linha "🎯 Metas (automático)"
- Migration: `supabase/migrations/20260527_financial_goals.sql` (já aplicada)
- **Atenção:** para limpar `completedAt` ao reabrir uma meta, passar `null` (não `undefined`) em `updateFinancialGoal`. `dbUpdate` usa `Object.entries` que inclui `undefined`, mas o JSON.stringify o descarta → campo não vira NULL no banco. `null` é serializado corretamente.

### Conquistas (achievements)
- Catálogo de ~23 conquistas hardcoded em `src/lib/achievements.ts` (`ACHIEVEMENTS`), com `check(ctx)` puro por item. `UserAchievement` no Supabase guarda só o que foi desbloqueado (`achievementId`, `unlockedAt`)
- Categorias: `usage`, `consistency`, `goals`, `budget`, `milestones`
- `useAppStore.checkAchievements()` — monta `AchievementContext` a partir do estado já carregado, roda `evaluateAchievements`, insere novos desbloqueios em `user_achievements` e empilha em `celebrationQueue` (consumida por `AchievementCelebrationModal`, fila simples via `dismissCelebration`)
- Chamado após: `addExpense(s)`, `addIncomeEntry`, `addCategory`, `addEstablishment`, `addFinancialGoal`, `updateFinancialGoal`, `addGoalContribution`, `addFixedExpenseMonth`, `updateFixedExpenseMonth`, `setBudgetMode`, `setWhatsappNumber`, e em `loadUserData`
- WhatsApp: mesma engine roda server-side em `src/lib/achievements-server.ts` (`checkAchievementsForUser`, via `supabaseAdmin`) — chamada pelo webhook após salvar despesa/receita; novos desbloqueios disparam mensagem via `sendWhatsAppMessage`
- `getAchievementStatuses(ctx, unlockedRecords)` → status completo (desbloqueadas + bloqueadas com progresso) usado pela página `/achievements`
- Conquistas são permanentes (não relockam); bloqueadas ficam visíveis com progresso (não são secretas)
- Migration: `supabase/migrations/20260619_user_achievements.sql`
- Design completo: `docs/ACHIEVEMENTS_DESIGN.md`

### Budget automático de fixas

- `getFixedWeeklyContribution(month?)` → soma semanal (÷4) dos `suggestedAmount` das fixas ativas — usado na Navbar para cota semanal
- `getFixedMonthlyContribution(month?)` → soma dos `suggestedAmount` das fixas ativas — usado no Dashboard e na página de Orçamento. **Sempre usa `suggestedAmount`, nunca o valor registrado no mês (`FixedExpenseMonth.amount`)**
- `getFixedCategoryContribution(month?)` → `getFixedWeeklyContribution` agrupado por `categoryId` — Navbar
- `getFixedMonthlyCategoryContribution(month?)` → `getFixedMonthlyContribution` agrupado por `categoryId` — Dashboard. **Idem: sempre `suggestedAmount`**
- **Cota semanal efetiva** (Navbar) = `monthlyBudget / weeksInMonth + fixedWeekly + goalDeductWeekly` (modo fixo) | `sum(categoryBudgets) / weeksInMonth + sum(fixedByCategory) + goalDeductWeekly` (por categoria)
- `weeksInMonth` = `getWeekOfMonth(weekKey).total`
- **Orçamento mensal total** (Dashboard + página Orçamento) = `monthlyBudget + fixedMonthly + goalDeductMonthly`
  - `goalDeductMonthly = getGoalWeeklyTotal(true) × weeksOfMonth.length`

## Design system — Bloom

**Tema único: dark-only.** Não há toggle de tema; `.dark` vars são idênticas a `:root`. ThemeProvider ainda existe mas o botão de alternar foi removido da Navbar.

### Fontes (3 papéis distintos)
Carregadas em `layout.tsx` via `next/font/google`, expostas como CSS vars:
- `--font-syne` → **Syne** — headings, brand, títulos de seção (`font-family: var(--font-syne)`)
- `--font-dm-mono` → **DM Mono** — todos os valores monetários, percentuais, labels técnicas (`font-family: var(--font-dm-mono)`)
- `--font-ui` = `var(--font-nunito)` → **Nunito** — texto UI, navegação, body (padrão em `body`)

### CSS vars (`globals.css`)
```
--bg: #0F0F14                           fundo escuro (mesh base)
--bg-card: rgba(255,255,255,0.04)       cards glass (semi-transparente)
--bg-raised: rgba(255,255,255,0.07)     elementos elevados
--bg-input: rgba(255,255,255,0.07)      inputs
--bg-modal: #1A1A26                     modais e bottom sheets (sólido, sem transparência)
--border: rgba(255,255,255,0.08)        bordas glass
--border-hover: rgba(255,255,255,0.15)  hover
--text: #F0EDF8                         texto principal
--text-muted: rgba(240,237,248,0.5)     texto secundário
--text-dim: rgba(240,237,248,0.22)      texto mínimo

--accent: #10b981                       emerald (money/success)
--accent-light: rgba(16,185,129,0.15)   bg de badges/active
--accent-glow: rgba(16,185,129,0.35)    box-shadow glow
--violet: #8b5cf6 / --violet-light      roxo (dados secundários)
--amber: #f59e0b / --amber-light        âmbar (atenção/semana)
--cyan: #06b6d4 / --cyan-light          cyan (saldo/acento)
--red: #f43f5e / --red-light            vermelho (erros/limite)
--glass-shadow                          sombra padrão para cards glass
```

### Glassmorphism
- `app-sidebar`, `app-topbar`, `app-bottomnav` têm `backdrop-filter: blur(20px)` em `globals.css`
- Classe utilitária `.glass` aplica `backdrop-filter: blur(12px)` a qualquer elemento
- Cards usam `background: var(--bg-card)` (rgba transparente) — a mesh abaixo fica visível

### Mesh background
- 2 orbs via `body::before` / `body::after` (emerald + violeta, animados em `@keyframes meshOrb`)
- 2 orbs adicionais via JSX em `(app)/layout.tsx` (cyan + âmbar, `@keyframes meshOrbAlt`)
- Todos fixed, z-index 0, pointer-events none — não interferem com interação

### Gradiente de marca
`linear-gradient(135deg, #10b981, #8b5cf6)` (emerald→violeta) — usado no ícone do brand na Navbar.
`.gradient-text`: `linear-gradient(135deg, #10b981, #06b6d4)` (emerald→cyan) — para texto em destaque.

## weekHelpers.ts

- `weekKey` = `YYYY-WNN` (ISO). Helpers: `getCurrentWeekKey`, `getWeekKey(date)`, `getWeekStart`, `getWeekDays`, `buildWeekSummary`, `getPreviousWeekKey/getNextWeekKey`, `getEffectiveAmount`, `getWeeksUntilDeadline(deadline)`
- `formatCurrency` (pt-BR BRL), `formatDate` (pt-BR + dia da semana)
- **`toLocalDateKey(d)`** — YYYY-MM-DD em hora local. **NUNCA** `.toISOString().split('T')[0]` (retorna UTC → bug de dia no Brasil)
- `getTodayKey()` = `toLocalDateKey(new Date())`
- `getMondaysBetween(from, to)` — todas as segundas-feiras inclusive
- `isInstallment(expense)` → `(installmentTotal ?? 1) > 1`
- `addMonthsToDate(baseDate, months, dueDayOfMonth)` — avança N meses fixando o dia; trata meses curtos
- `getInvoiceMonth(purchaseDate, card)` — mês (`YYYY-MM`) de vencimento da fatura de um cartão a partir da data da compra
- `getEffectiveMonth(expense, creditCards)` — mês efetivo de uma despesa para saldo (compra ou fatura, conforme cartão)

## Categorias e ícones

**Despesas:** `food, transport, bills, health, leisure, shopping, education, other`
**Receitas:** `income-salary, income-freelance, income-investments, income-rent, income-sales, income-other`
**Ícones disponíveis (31):** `Utensils Car FileText Heart Gamepad2 ShoppingBag BookOpen MoreHorizontal Dumbbell Activity Tv Music Coffee Plane Home Smartphone Zap Wifi Gift Scissors PawPrint Pill ShoppingCart Briefcase Bike Fuel Baby TrendingUp Laptop Target`

## Auth & Segurança

- Supabase Auth (email/password + Google OAuth). Guard em `(app)/layout.tsx`. Store: `login()`, `loginWithGoogle()`, `logout({ scope: 'global' })`, `loadUserData()`
- RLS em 11 tabelas (`auth.uid() = user_id`). Security headers em `next.config.ts`. `signOut({ scope: 'global' })` invalida refresh token no servidor.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing + auth (Google SVG inline, Apple, email) |
| `/dashboard` | Navegação por mês (← →). KPIs mensais (gastos, disponível, receitas + condicionais A Receber/Metas). Saldo do mês. Barra de orçamento mensal. Projeção (só mês atual). BarChart semanal — 4–5 barras por mês, clique seleciona semana e exibe despesas. PieChart por categoria (mensal). |
| `/expenses` | Lista com filtro categoria/período/tipo/divididas/parceladas, editar/excluir inline, painel de participantes inline. Badge âmbar `X/Yx` em despesas parceladas |
| `/expenses/new` e `/expenses/[id]` | `ExpenseForm` sem/com `initialData` |
| `/categories` | CRUD, bottom sheet (mobile)/inline (lg), picker ícone+cor, exclusão com modal |
| `/establishments` | CRUD; selecionar preenche categoria no `ExpenseForm` |
| `/fixed-expenses` | Templates + confirmação mensal, seção Pendentes (amber), histórico |
| `/credit-cards` | Cartões de crédito: CRUD de cartões (nome, fechamento, vencimento), histórico de faturas por cartão com confirmação manual de pagamento |
| `/goals` | Metas financeiras: seção Pendentes (amber), cards com barra de progresso + sugestão semanal, modal de contribuição mensal, histórico expandível, concluir/pausar/excluir |
| `/income` | Fontes recorrentes + entradas mensais, seção Pendentes (amber), saldo mensal |
| `/budget` | Modo fixo: discricionário mensal + fixas (🔒 auto) + metas (🎯 auto, se deductFromBudget) + total mensal. Modo categoria: idem. Dica de cota semanal (≈ R$ X/sem · N semanas este mês) exibida abaixo de cada campo. Inputs são valores mensais diretamente. |
| `/summary` | Total, AreaChart, donut, barras animadas por categoria, histórico semanal paginado |
| `/achievements` | Grid de conquistas por categoria (desbloqueadas com data, bloqueadas com barra de progresso), progresso geral no topo |
| `/integrations` | Card WhatsApp: salvar número, exemplos de mensagens para registro, lista de comandos de consulta |
| `/help` | Central de ajuda: índice com busca e cards agrupados por categoria |
| `/help/[slug]` | Artigo de ajuda com sumário lateral, blocos tipados (callout, steps, tabelas) e navegação prev/next |

**Dashboard — navegação mensal:** estado `monthKey` (YYYY-MM). Ao trocar mês, `selectedWeekKey` reseta para a semana atual (se no mês) ou a última semana do mês. Projeção só renderiza quando `isCurrentMonth`.

**Dashboard — card "A Receber":** aparece quando `getSharedPendingTotal(monthKey)` > 0 no mês selecionado. Abre drawer já no `monthKey` selecionado.
**Dashboard — card "Faturas a pagar":** aparece quando `getPendingInvoicesTotal(monthKey)` > 0. Click → `/credit-cards`. Puramente informativo, não entra em nenhum cálculo de orçamento.
**Dashboard — seção "Saldo em caixa":** card separado do "Saldo do mês" (competência), logo abaixo dele. Usa `getCashBalance(monthKey)` — regime de caixa real (ver seção Cartões de crédito). Mostra badge "fatura pendente" (clicável → `/credit-cards`) quando há faturas não pagas no mês.
**Dashboard — card "Metas":** aparece quando há metas ativas (`isActive && !completedAt`); mostra % médio de progresso + quantidade. Click → `/goals`.
**Dashboard — KPI grid:** passa de `lg:grid-cols-3` para `lg:grid-cols-4` quando há card "A Receber" ou card "Metas" (mobile sempre 2 cols).

**Dashboard — card "Projeção do mês":** aparece apenas no mês atual quando `totalMonthlyExpenses > 0`. Calcula `(totalMonthlyExpenses / daysElapsed) × daysInMonth` e exibe delta vs renda. Mostra "Nd de dados" para transparência. Posicionado entre "Saldo do mês" e os gráficos.

**Dashboard — card "Disponível":** toggle **ORÇ / RENDA** persiste em `preferences.availableMode` via `setAvailableMode`. `availableBase = availableMode === 'income' ? monthBalance.income : totalMonthlyBudget`; `remaining = availableBase - totalMonthlyExpenses`. Sub-texto muda entre `"do orçamento"` / `"da renda"` / `"acima do limite"` / `"acima da renda"`. Quando `income === 0` e modo RENDA: exibe `"—"` + `"sem renda registrada"`.

**Dashboard — filtro semana:** `selectedWeekKey` inicia na semana atual. Barras do chart semanal: selecionada=`#10b981`, semana atual=`rgba(16,185,129,0.25)`, outras=`var(--bg-input)`. Clicar uma barra muda `selectedWeekKey` e exibe as despesas daquela semana na lista abaixo.

## Layout responsivo

| Elemento | Mobile | Desktop (lg:) |
|----------|--------|---------------|
| Nav | Bottom tab bar + top bar | Sidebar `w-56` (12 itens) |
| Main | `pt-14 pb-20` | `ml-56` |
| KPIs | 2 cols | 3 cols |
| Gráficos | Empilhados | Side-by-side (5 cols grid) |

**Único breakpoint:** `lg:` (1024px). Sem `md:` para layout estrutural.

## Convenções críticas

- **Layout estrutural em CSS puro** (`globals.css`): classes `app-sidebar`, `app-topbar`, `app-bottomnav`, `app-main` com media queries. Tailwind v4 + Turbopack é imprevisível para classes responsivas estruturais.
- **Componentes usam `style={}` inline** para cor/bg/padding. Tailwind só para utilitários (`flex`, `items-center`, `rounded-xl`, `gap-*`). **Nunca** `dark:` prefix — usar CSS vars.
- **Tipografia:** aplicar `fontFamily: 'var(--font-syne)'` em headings/títulos de seção; `fontFamily: 'var(--font-dm-mono)'` em valores monetários e percentuais. Nunca hardcode de nome de fonte.
- **Dark-only:** não adicionar lógica de tema claro. O toggle foi removido da Navbar; `UserPreferences.theme` existe no store mas não é mais exposto na UI.
- **Bottom nav mobile:** exibe os 4 primeiros `navItems` (dashboard, adicionar, despesas, fixas) + botão "Mais", que abre bottom sheet com o restante agrupado por `section` (`financial`, `config`). **Todo item novo deve usar `section: 'financial'` ou `'config'`** — itens com `section: 'main'` além dos 4 primeiros não aparecem em lugar nenhum no mobile (o bottom sheet só itera `financial`/`config`).
- Datas: exibir com `new Date(date + 'T12:00:00')`. Salvar `weekKey` via `getWeekKey(date)`.
- Store Zustand: usar `(set, get)` quando a action lê estado após mutação. `get().syncFixedExpenses()` após mutações em `fixedExpenseMonths`.
- Recharts Tooltip: `(v) => [formatCurrency(Number(v)), 'Label']`
- `z.number()` + `register('amount', { valueAsNumber: true })` em campos monetários
- `(app)` route group não adiciona segmento à URL
- **Modais centrados com Framer Motion:** nunca usar `transform: translate(-50%, -50%)` ou `translate: '-50% -50%'` diretamente no `motion.div` com `scale` — o Framer Motion sobrescreve `transform`, quebrando o centramento. Padrão correto: wrapper estático com `fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none` + `motion.div` interno com `pointerEvents: 'auto'` e `maxWidth`. Backdrop separado em `z-40`. Fundo do modal: sempre `var(--bg-modal)` (sólido), nunca `var(--bg-card)` (semi-transparente).

## Backlog

- [ ] Exportar dados como CSV
- [ ] Gráfico de evolução mensal (receitas vs despesas)
- [x] Mensagem de boas-vindas via WhatsApp ao cadastrar número: quando o usuário salva o número pela primeira vez na página `/integrations`, o bot deve enviar automaticamente uma mensagem se apresentando e listando todos os comandos disponíveis (mesma estrutura do intent `help`)
- [ ] **Sistema de avisos inteligentes + Dashboard de Insights (a planejar):** duas camadas complementares. **(1) Avisos proativos:** notificações contextuais — recebimentos chegando em breve, vencimentos próximos, proximidade de limite de orçamento semanal/por categoria. **(2) Insights analíticos:** em vez de só mostrar números, gerar frases interpretativas — ex: "Seus gastos com alimentação aumentaram 23% em relação ao mês anterior", "Você ultrapassou o orçamento de lazer em R$ 180", "Sua taxa de poupança caiu de 18% para 11%", "Mantendo o ritmo atual, sua reserva acabará em 8 meses". Diferencial do produto: o app não apenas exibe dados, ele interpreta e alerta. Definir: UI dedicada (feed de insights, cards no dashboard), canais (in-app, WhatsApp), engine de cálculo de tendências e regras de disparo.
- [ ] **CRUD de categorias de receita (a planejar):** tela de gerenciamento de categorias de receita nos mesmos moldes da página `/categories` (despesas) — criar, editar, excluir, picker de ícone e cor. Hoje as `incomeCategories` são defaults fixos no store; a implementação exigirá persistência no Supabase e migração similar à de categorias de despesa.
- [ ] **Resumo mensal em `/summary` (a planejar):** adicionar visão por mês ao resumo — permitir navegar entre meses e ver desempenho consolidado (receitas, despesas, saldo, breakdown por categoria). Hoje o resumo foca em semanas; a visão mensal complementa para análise de médio prazo.
- [ ] **Fluxo de caixa futuro (a planejar):** projeção financeira para 30, 60 e 90 dias mostrando saldo atual, contas a vencer (despesas fixas com `dueDateDay`), receitas previstas (`IncomeSources` ativas) e saldo projetado por período. Permite ao usuário saber quanto terá daqui a N dias, não apenas quanto tem hoje. Definir: engine de projeção, UI de linha do tempo, alertas de saldo negativo projetado.
- [ ] **Motor de inteligência financeira — visão estratégica (a planejar):** combinação de Fluxo de Caixa + Orçamento + Metas + Insights Automáticos como diferencial competitivo. O objetivo é que a plataforma responda automaticamente as perguntas que a maioria dos apps não responde: *"Estou melhor ou pior que o mês passado?"*, *"Estou gastando acima do meu padrão?"*, *"Quando atingirei minha meta?"*, *"Quanto realmente sobra da minha renda?"*, *"Qual categoria está destruindo meu orçamento?"*. Isso eleva o produto de "controle financeiro" para "conselheiro financeiro automatizado". Quando planejado, avaliar quais dessas respostas são derivadas dos itens já no backlog (fluxo de caixa, insights analíticos, essencialidade) e quais exigem novas features.
- [ ] **Classificação de essencialidade de despesas (a planejar):** permitir ao usuário classificar cada despesa em 3 níveis — **Essencial**, **Importante** e **Supérfluo**. Viabiliza análises como "quanto gasto em supérfluos por semana/mês", filtros e gráficos por essencialidade, e insights de onde cortar gastos. Definir: campo no modelo `Expense`, UI no formulário, filtros na lista, visualizações no dashboard/resumo.

## Lembretes de vencimento (despesas fixas)

- `FixedExpense` tem `dueDateDay?: number` (1–31) e `reminderEnabled?: boolean`
- Migration: `supabase/migrations/20260526_fixed_expense_due_date.sql`
- Endpoint cron: `GET /api/cron/fixed-expense-reminders?secret=CRON_SECRET`
  - Protegido por `CRON_SECRET` env var (header `x-cron-secret` ou query `secret`)
  - Lê despesas ativas com `reminder_enabled = true` direto do Supabase (service role)
  - Verifica se `effectiveDueDay` (normalizado para último dia do mês) == hoje ou amanhã (fuso BRT = UTC-3)
  - Consolida todas as despesas de cada usuário em **uma única mensagem** por dia
  - Usa `fixed_expense_months.amount` do mês corrente quando disponível; fallback = `suggested_amount`
- Agendador externo: **cron-job.org** (gratuito), diariamente às **08:00 BRT (11:00 UTC)**
  - URL: `https://jorge-30dias.27pl2o.easypanel.host/api/cron/fixed-expense-reminders?secret=CRON_SECRET`
  - `CRON_SECRET`: gerar com `openssl rand -hex 32` e adicionar no Easypanel

## WhatsApp — detalhes técnicos

- **Evolution API v2.3.7**: `https://jorge-evolution-api.27pl2o.easypanel.host`, instância `30dias`
- Route handler: `src/app/api/webhook/whatsapp/route.ts`
- Extração: `src/lib/whatsapp/extractExpense.ts` (Claude Haiku, JSON puro sem markdown)
- Envio: `src/lib/whatsapp/sendMessage.ts` (`POST /message/sendText/{instance}`)
- Detecção de intent: `src/lib/whatsapp/detectIntent.ts` (regex, sem custo de IA)
- Handlers de consulta: `src/lib/whatsapp/queryHandlers.ts` (Supabase direto, fuso BRT)

**Fluxo de mensagem recebida:**
1. `detectIntent(text)` classifica a mensagem por keyword matching
2. Se intent ≠ `expense` → chama o handler correspondente → responde e retorna
3. Se intent = `expense` → fluxo de extração via Haiku (comportamento original)

**Intents suportados:**

| Intent | Palavras-chave | Resposta |
|--------|---------------|---------|
| `query_week` | "semana", "semanal" | Gasto + orçamento + % livre da semana atual |
| `query_month` | "mês", "mensal", "balanço" | Receitas / despesas / saldo do mês |
| `query_pending` | "receber", "a receber", "pendente", "cobrar" | Participantes com `paid=false` no mês corrente (máx 5) |
| `query_summary` | "resumo", "como estou" | Combinação compacta de semana + mês |
| `help` | "ajuda", "comandos", "menu" | Lista estática de todos os comandos |
| `expense` | qualquer outra coisa | Extração de despesa via Haiku |

**Quirks Evolution API v2:**
- `remoteJid` pode ser `@lid` → usar `remoteJidAlt` quando `addressingMode === 'lid'`
- Número sem 9° dígito → OR query com 3 variantes: completo, sem `55`, sem `55` + `9` após DDD
- Payload `event` chega como `messages.upsert` (minúsculo), enum é `MESSAGES_UPSERT` — aceitar ambos
- Haiku pode retornar JSON com markdown fences — fazer strip antes do `JSON.parse`

**Reconfigurar webhook:**
```bash
curl -X POST https://jorge-evolution-api.27pl2o.easypanel.host/webhook/set/30dias \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,"url":"https://jorge-30dias.27pl2o.easypanel.host/api/webhook/whatsapp?secret=30dias-webhook-secret-2025","webhook_by_events":false,"webhook_base64":false,"events":["MESSAGES_UPSERT"]}}'
```

## Deploy

- Easypanel: `http://31.97.248.13:3000/` → projeto `jorge`, serviço `30dias`
- Nixpacks + Node 20 (`NIXPACKS_NODE_VERSION=20`). Repo: `https://github.com/jorjaocorreia-spec/30dias.git` (branch `main`)
- **Restrição:** apenas projeto `jorge` pode ser alterado na VPS
- Env vars necessárias: `NIXPACKS_NODE_VERSION`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WEBHOOK_SECRET`, `CRON_SECRET`
- ⚠️ Não misturar bloco raw com variáveis individuais — causa duplicatas e sobrescrita silenciosa
