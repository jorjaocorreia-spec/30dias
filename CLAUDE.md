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
│       ├── income/page.tsx
│       ├── budget/page.tsx
│       └── summary/page.tsx
├── components/layout/{Navbar,ThemeProvider}.tsx
├── components/ui/{CategoryIcon,ExpenseForm}.tsx
├── store/useAppStore.ts
├── lib/weekHelpers.ts
├── data/{categories,incomeCategories,seedExpenses}.ts
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
}
interface FixedExpenseMonth { id: string; fixedExpenseId: string; month: string; amount: number }
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

### Despesas divididas (split)
- `amount` = valor total pago; `sharedWith` = partes de cada participante
- `getEffectiveAmount(expense)` em `weekHelpers.ts` → `amount - soma(sharedWith)` = parte do usuário
- **Todos os cálculos de orçamento e saldo usam `getEffectiveAmount`** (buildWeekSummary, getMonthlyBalance)
- `markParticipantAsPaid(expenseId, participantId, paid)` — registra pagamento com data
- `getSharedPendingTotal(month?)` — total a receber no mês (usado no card do dashboard)
- Coluna `shared_with JSONB` na tabela `expenses` do Supabase (já migrada)
- **`shares`** em `ExpenseParticipant`: quantas partes essa pessoa representa (casal = 2). "Dividir igual" distribui proporcionalmente; arredondamento ocorre após multiplicar (nunca antes)
- **`userShares`** em `Expense`: partes do próprio usuário no split. Contador `+`/`−` na linha "Sua parte" do form. `getEffectiveAmount` continua correto pois retorna o resto após subtrair os participantes

### Budget automático de fixas
- `getFixedWeeklyContribution(month?)` → soma semanal (÷4) das fixas ativas confirmadas
- `getFixedCategoryContribution(month?)` → mesmo agrupado por `categoryId`
- `effectiveBudget = weeklyBudget + fixedWeekly` (modo fixo) | `sum(categoryBudgets) + sum(fixedByCategory)` (por categoria)

## Design system

CSS vars em `globals.css` (`:root` e `.dark`): `--bg`, `--bg-card`, `--bg-input`, `--border`, `--text`, `--text-muted`, `--accent` (#10b981), `--accent-light`, `--glass`, `--shadow`

Gradiente de marca: `linear-gradient(135deg, #10b981, #06b6d4)` | `.gradient-text` | `.glass`

## weekHelpers.ts

- `weekKey` = `YYYY-WNN` (ISO). Helpers: `getCurrentWeekKey`, `getWeekKey(date)`, `getWeekStart`, `getWeekDays`, `buildWeekSummary`, `getPreviousWeekKey/getNextWeekKey`, `getEffectiveAmount`
- `formatCurrency` (pt-BR BRL), `formatDate` (pt-BR + dia da semana)
- **`toLocalDateKey(d)`** — YYYY-MM-DD em hora local. **NUNCA** `.toISOString().split('T')[0]` (retorna UTC → bug de dia no Brasil)
- `getTodayKey()` = `toLocalDateKey(new Date())`
- `getMondaysBetween(from, to)` — todas as segundas-feiras inclusive

## Categorias e ícones

**Despesas:** `food, transport, bills, health, leisure, shopping, education, other`
**Receitas:** `income-salary, income-freelance, income-investments, income-rent, income-sales, income-other`
**Ícones disponíveis (30):** `Utensils Car FileText Heart Gamepad2 ShoppingBag BookOpen MoreHorizontal Dumbbell Activity Tv Music Coffee Plane Home Smartphone Zap Wifi Gift Scissors PawPrint Pill ShoppingCart Briefcase Bike Fuel Baby TrendingUp Laptop`

## Auth & Segurança

- Supabase Auth (email/password + Google OAuth). Guard em `(app)/layout.tsx`. Store: `login()`, `loginWithGoogle()`, `logout({ scope: 'global' })`, `loadUserData()`
- RLS em 9 tabelas (`auth.uid() = user_id`). Security headers em `next.config.ts`. `signOut({ scope: 'global' })` invalida refresh token no servidor.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing + auth (Google SVG inline, Apple, email) |
| `/dashboard` | KPIs, progresso orçamento, BarChart diário (clique = filtro dia), PieChart categoria, FAB |
| `/expenses` | Lista com filtro categoria/período/tipo/divididas, editar/excluir inline, painel de participantes inline |
| `/expenses/new` e `/expenses/[id]` | `ExpenseForm` sem/com `initialData` |
| `/categories` | CRUD, bottom sheet (mobile)/inline (lg), picker ícone+cor, exclusão com modal |
| `/establishments` | CRUD; selecionar preenche categoria no `ExpenseForm` |
| `/fixed-expenses` | Templates + confirmação mensal, seção Pendentes (amber), histórico |
| `/income` | Fontes recorrentes + entradas mensais, seção Pendentes (amber), saldo mensal |
| `/budget` | Modo fixo: discricionário + fixas (🔒 auto) + total. Modo categoria: coluna fixas readonly |
| `/summary` | Total, AreaChart, donut, barras animadas por categoria, histórico semanal paginado |

**Dashboard — card "A Receber":** aparece automaticamente quando `getSharedPendingTotal()` > 0 no mês corrente. KPI grid passa de 3 para 4 colunas nesse caso (mobile: 2×2).

**Dashboard — filtro dia:** `selectedDay` inicia `getTodayKey()`, reseta ao mudar semana. Barras: selecionado=`#10b981`, hoje=`rgba(16,185,129,0.25)`, outros=`var(--bg-input)`. `dailyData` usa `toLocalDateKey`.

## Layout responsivo

| Elemento | Mobile | Desktop (lg:) |
|----------|--------|---------------|
| Nav | Bottom tab bar + top bar | Sidebar `w-56` (9 itens) |
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

## WhatsApp — detalhes técnicos

- **Evolution API v2.3.7**: `https://jorge-evolution-api.27pl2o.easypanel.host`, instância `7dias`
- Route handler: `src/app/api/webhook/whatsapp/route.ts`
- Extração: `src/lib/whatsapp/extractExpense.ts` (Claude Haiku, JSON puro sem markdown)
- Envio: `src/lib/whatsapp/sendMessage.ts` (`POST /message/sendText/{instance}`)

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
- Env vars necessárias: `NIXPACKS_NODE_VERSION`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WEBHOOK_SECRET`
- ⚠️ Não misturar bloco raw com variáveis individuais — causa duplicatas e sobrescrita silenciosa
