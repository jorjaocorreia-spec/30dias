@AGENTS.md

# 7Dias — Projeto

MVP+ completo. Build: `npm run build`. Dev: `npm run dev` → `http://localhost:3000`. Produção: `https://jorge-7dias.27pl2o.easypanel.host`

Fintech premium de gestão financeira pessoal por ciclos semanais. App **responsivo com igual peso** mobile/desktop.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** (sem plugins, CSS vars para design system)
- **Zustand** com `persist` (chave: `7dias-storage`)
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
  notes?: string; establishmentId?: string
  fixedExpenseId?: string; fixedExpenseMonthId?: string
  sharedWith?: ExpenseParticipant[]   // definido quando a despesa é dividida
  userShares?: number                 // partes do próprio usuário no split (ex: casal = 2); padrão 1
}
interface Category { id: string; name: string; icon: string; color: string; isDefault?: boolean }
// IncomeCategory tem a mesma forma que Category
interface Establishment { id: string; name: string; categoryId: string }
interface FixedExpense {
  id: string; description: string; suggestedAmount: number; categoryId: string
  establishmentId?: string; paymentMethod: PaymentMethod; notes?: string
  isActive: boolean; createdAt: string   // YYYY-MM-DD
  dueDateDay?: number      // dia do mês do vencimento (1–31)
  reminderEnabled?: boolean
}
interface FixedExpenseMonth { id: string; fixedExpenseId: string; month: string; amount: number }
interface FinancialGoal {
  id: string; name: string; targetAmount: number; deadline: string  // YYYY-MM
  icon: string; color: string; notes?: string
  weeklyAmount?: number      // override manual; senão auto-calculado
  deductFromBudget: boolean  // se true, subtrai do orçamento semanal
  isActive: boolean; createdAt: string; completedAt?: string  // YYYY-MM-DD
}
interface GoalContribution { id: string; goalId: string; month: string; amount: number }
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'; weeklyBudget: number
  budgetMode: 'fixed' | 'per_category'; categoryBudgets: Record<string, number>
  currency: string; whatsappNumber?: string
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
```

### Receitas
- `IncomeSource` = template recorrente; `IncomeEntry` = registro real do mês (avulso quando sem `incomeSourceId`)
- Deletar fonte → cascata remove `incomeEntries` vinculados
- `getMonthlyBalance(month)` → `{ income, expenses, balance }`
- Categorias de receita separadas das de despesa (`incomeCategories` no store). Defaults: Salário, Freelance, Investimentos, Aluguel, Vendas, Outros

### Despesas fixas
- `FixedExpense` = template; `FixedExpenseMonth` = valor real confirmado por mês
- `syncFixedExpenses()` gera entradas semanais (segundas) com `amount = Math.round((fem.amount / 4) * 100) / 100`
- Chamar após qualquer mutação em `fixedExpenseMonths` e em `onRehydrateStorage`
- Deletar template → remove `fixedExpenseMonths` + `expenses` vinculados
- `dueDateDay` + `reminderEnabled`: lembrete WhatsApp 1 dia antes e no dia do vencimento. Ver seção "Lembretes de vencimento"

### Despesas divididas (split)
- `amount` = valor total pago; `sharedWith` = partes de cada participante
- `getEffectiveAmount(expense)` em `weekHelpers.ts` → `amount - soma(sharedWith)` = parte do usuário
- **Todos os cálculos de orçamento e saldo usam `getEffectiveAmount`** (buildWeekSummary, getMonthlyBalance)
- `markParticipantAsPaid(expenseId, participantId, paid)` — registra pagamento com data
- `getSharedPendingTotal(month?)` — total a receber no mês (usado no card do dashboard)
- Coluna `shared_with JSONB` na tabela `expenses` do Supabase (já migrada)
- **`shares`** em `ExpenseParticipant`: quantas partes essa pessoa representa (casal = 2). "Dividir igual" distribui proporcionalmente; arredondamento ocorre após multiplicar (nunca antes)
- **`userShares`** em `Expense`: partes do próprio usuário no split. Contador `+`/`−` na linha "Sua parte" do form. `getEffectiveAmount` continua correto pois retorna o resto após subtrair os participantes

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

### Budget automático de fixas
- `getFixedWeeklyContribution(month?)` → soma semanal (÷4) das fixas ativas confirmadas
- `getFixedCategoryContribution(month?)` → mesmo agrupado por `categoryId`
- `effectiveBudget = weeklyBudget + fixedWeekly + goalDeductWeekly` (modo fixo) | `sum(categoryBudgets) + sum(fixedByCategory) + goalDeductWeekly` (por categoria)

## Design system

CSS vars em `globals.css` (`:root` e `.dark`): `--bg`, `--bg-card`, `--bg-input`, `--border`, `--text`, `--text-muted`, `--accent` (#10b981), `--accent-light`, `--glass`, `--shadow`

Gradiente de marca: `linear-gradient(135deg, #10b981, #06b6d4)` | `.gradient-text` | `.glass`

## weekHelpers.ts

- `weekKey` = `YYYY-WNN` (ISO). Helpers: `getCurrentWeekKey`, `getWeekKey(date)`, `getWeekStart`, `getWeekDays`, `buildWeekSummary`, `getPreviousWeekKey/getNextWeekKey`, `getEffectiveAmount`, `getWeeksUntilDeadline(deadline)`
- `formatCurrency` (pt-BR BRL), `formatDate` (pt-BR + dia da semana)
- **`toLocalDateKey(d)`** — YYYY-MM-DD em hora local. **NUNCA** `.toISOString().split('T')[0]` (retorna UTC → bug de dia no Brasil)
- `getTodayKey()` = `toLocalDateKey(new Date())`
- `getMondaysBetween(from, to)` — todas as segundas-feiras inclusive

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
| `/dashboard` | KPIs, progresso orçamento, card projeção do mês, BarChart diário (clique = filtro dia), PieChart categoria, FAB |
| `/expenses` | Lista com filtro categoria/período/tipo/divididas, editar/excluir inline, painel de participantes inline |
| `/expenses/new` e `/expenses/[id]` | `ExpenseForm` sem/com `initialData` |
| `/categories` | CRUD, bottom sheet (mobile)/inline (lg), picker ícone+cor, exclusão com modal |
| `/establishments` | CRUD; selecionar preenche categoria no `ExpenseForm` |
| `/fixed-expenses` | Templates + confirmação mensal, seção Pendentes (amber), histórico |
| `/goals` | Metas financeiras: seção Pendentes (amber), cards com barra de progresso + sugestão semanal, modal de contribuição mensal, histórico expandível, concluir/pausar/excluir |
| `/income` | Fontes recorrentes + entradas mensais, seção Pendentes (amber), saldo mensal |
| `/budget` | Modo fixo: discricionário + fixas (🔒 auto) + metas (🎯 auto, se deductFromBudget) + total. Modo categoria: idem. Ambos os modos exibem card **Estimativa mensal** = `(semanal + fixas + metas) × 4` + bloco informativo para metas sem dedução |
| `/summary` | Total, AreaChart, donut, barras animadas por categoria, histórico semanal paginado |
| `/integrations` | Card WhatsApp: salvar número, exemplos de mensagens para registro, lista de comandos de consulta |
| `/help` | Central de ajuda: índice com busca e cards agrupados por categoria |
| `/help/[slug]` | Artigo de ajuda com sumário lateral, blocos tipados (callout, steps, tabelas) e navegação prev/next |

**Dashboard — card "A Receber":** aparece automaticamente quando `getSharedPendingTotal()` > 0 no mês corrente.
**Dashboard — card "Metas":** aparece automaticamente quando há metas ativas (`isActive && !completedAt`); mostra % médio de progresso + quantidade. Click → `/goals`.
**Dashboard — KPI grid:** passa de `lg:grid-cols-3` para `lg:grid-cols-4` quando há card "A Receber" ou card "Metas" (mobile sempre 2 cols).

**Dashboard — card "Projeção do mês":** aparece quando há ≥1 despesa no mês corrente. Calcula `(totalSpentThisMonth / daysElapsed) × daysInMonth` e exibe delta vs renda (verde/vermelho). Mostra "Nd de dados" para transparência. Posicionado entre "Saldo do mês" e os gráficos.

**Dashboard — filtro dia:** `selectedDay` inicia `getTodayKey()`, reseta ao mudar semana. Barras: selecionado=`#10b981`, hoje=`rgba(16,185,129,0.25)`, outros=`var(--bg-input)`. `dailyData` usa `toLocalDateKey`.

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
- Datas: exibir com `new Date(date + 'T12:00:00')`. Salvar `weekKey` via `getWeekKey(date)`.
- Store Zustand: usar `(set, get)` quando a action lê estado após mutação. `get().syncFixedExpenses()` após mutações em `fixedExpenseMonths`.
- Recharts Tooltip: `(v) => [formatCurrency(Number(v)), 'Label']`
- `z.number()` + `register('amount', { valueAsNumber: true })` em campos monetários
- `(app)` route group não adiciona segmento à URL

## Backlog

- [ ] Exportar dados como CSV
- [ ] Gráfico de evolução mensal (receitas vs despesas)

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
  - URL: `https://jorge-7dias.27pl2o.easypanel.host/api/cron/fixed-expense-reminders?secret=CRON_SECRET`
  - `CRON_SECRET`: gerar com `openssl rand -hex 32` e adicionar no Easypanel

## WhatsApp — detalhes técnicos

- **Evolution API v2.3.7**: `https://jorge-evolution-api.27pl2o.easypanel.host`, instância `7dias`
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
curl -X POST https://jorge-evolution-api.27pl2o.easypanel.host/webhook/set/7dias \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{"webhook":{"enabled":true,"url":"https://jorge-7dias.27pl2o.easypanel.host/api/webhook/whatsapp?secret=7dias-webhook-secret-2025","webhook_by_events":false,"webhook_base64":false,"events":["MESSAGES_UPSERT"]}}'
```

## Deploy

- Easypanel: `http://31.97.248.13:3000/` → projeto `jorge`, serviço `7dias`
- Nixpacks + Node 20 (`NIXPACKS_NODE_VERSION=20`). Repo: `https://github.com/jorjaocorreia-spec/7dias.git` (branch `main`)
- **Restrição:** apenas projeto `jorge` pode ser alterado na VPS
- Env vars necessárias: `NIXPACKS_NODE_VERSION`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WEBHOOK_SECRET`, `CRON_SECRET`
- ⚠️ Não misturar bloco raw com variáveis individuais — causa duplicatas e sobrescrita silenciosa
