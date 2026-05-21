@AGENTS.md

# 7Dias — Documento do Projeto

## Visão geral

7Dias é uma plataforma web fintech premium para gestão financeira pessoal com foco em ciclos semanais. O objetivo principal é permitir que o usuário controle despesas, acompanhe gastos e planeje a semana financeira de forma simples, elegante e motivadora.

---

## Status atual: MVP+ Seguro em Produção ✓

Build passa sem erros (`npm run build`). Dev server: `npm run dev` → `http://localhost:3000`.
App em produção: `https://jorge-7dias.27pl2o.easypanel.host`

**Decisão de plataforma:** o app é **responsivo com igual peso** entre mobile e desktop. Não é mobile-first puro nem desktop-first.

---

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** (sem plugins, CSS vars para o design system)
- **Zustand** com `persist` (chave localStorage: `7dias-storage`)
- **React Hook Form** + **Zod** (validação de formulários)
- **Recharts** (AreaChart, BarChart, PieChart, Cell, Tooltip)
- **Framer Motion** (animações de entrada e progresso)
- **lucide-react** (ícones — atenção: `Chrome` não existe, usar SVG inline)
- **nanoid** (geração de IDs)

---

## Arquitetura de pastas

```
src/
├── app/
│   ├── layout.tsx                    # Root layout: Geist font, ThemeProvider
│   ├── globals.css                   # CSS vars do design system (light/dark)
│   ├── page.tsx                      # Landing/Login page (rota /)
│   └── (app)/                        # Route group autenticado
│       ├── layout.tsx                # Guard de auth + Navbar lateral
│       ├── dashboard/page.tsx        # Dashboard principal
│       ├── expenses/
│       │   ├── page.tsx              # Lista de despesas com filtros
│       │   ├── new/page.tsx          # Nova despesa
│       │   └── [id]/page.tsx         # Editar/excluir despesa
│       ├── categories/page.tsx       # CRUD de categorias
│       ├── establishments/page.tsx   # CRUD de estabelecimentos
│       ├── fixed-expenses/page.tsx   # Despesas fixas (templates + meses)
│       ├── income/page.tsx           # Receitas (fontes recorrentes + entradas mensais)
│       └── summary/page.tsx          # Resumo semanal
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Sidebar responsiva (w-16 mobile, w-56 lg)
│   │   └── ThemeProvider.tsx         # Aplica classe .dark no <html>
│   └── ui/
│       ├── CategoryIcon.tsx          # Mapeia string → ícone Lucide (30 ícones)
│       └── ExpenseForm.tsx           # Formulário de despesa (nova/editar)
├── store/
│   └── useAppStore.ts                # Store Zustand com persist
├── lib/
│   └── weekHelpers.ts                # Lógica de semanas ISO (weekKey: YYYY-WNN)
├── data/
│   ├── categories.ts                 # DEFAULT_CATEGORIES + CATEGORY_COLORS
│   ├── incomeCategories.ts           # DEFAULT_INCOME_CATEGORIES + INCOME_CATEGORY_COLORS
│   └── seedExpenses.ts               # Despesas de exemplo (últimos 7 dias)
├── hooks/                            # (reservado para hooks futuros)
└── types/
    └── index.ts                      # Todos os tipos do app
```

---

## Modelos de dados

```ts
type PaymentMethod = 'credit_card' | 'pix' | 'ted' | 'cash'

interface Expense {
  id: string                   // nanoid
  amount: number
  categoryId: string
  description: string
  date: string                 // YYYY-MM-DD
  notes?: string
  weekKey: string              // YYYY-WNN (gerado por getWeekKey(date))
  paymentMethod: PaymentMethod
  establishmentId?: string     // vínculo com Establishment
  fixedExpenseId?: string      // vínculo com FixedExpense (template)
  fixedExpenseMonthId?: string // vínculo com FixedExpenseMonth (mês confirmado)
}

interface Category {
  id: string
  name: string
  icon: string         // nome do componente Lucide (ex: 'Utensils')
  color: string        // hex
  isDefault?: boolean
}

interface Establishment {
  id: string
  name: string
  categoryId: string   // preenche categoria automaticamente ao selecionar
}

interface FixedExpense {
  id: string
  description: string
  suggestedAmount: number  // valor sugerido para agilizar registro mensal (editável)
  categoryId: string
  establishmentId?: string
  paymentMethod: PaymentMethod
  notes?: string
  isActive: boolean
  createdAt: string        // YYYY-MM-DD
}

interface FixedExpenseMonth {
  id: string
  fixedExpenseId: string
  month: string   // YYYY-MM
  amount: number  // valor real confirmado para aquele mês
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  weeklyBudget: number
  currency: string     // padrão 'BRL'
}

interface IncomeCategory {
  id: string
  name: string
  icon: string         // nome do componente Lucide (ex: 'Briefcase')
  color: string        // hex
  isDefault?: boolean
}

interface IncomeSource {
  id: string
  description: string
  expectedAmount: number   // valor esperado (pré-preenchido ao registrar cada mês)
  categoryId: string       // referencia IncomeCategory
  paymentMethod: PaymentMethod
  notes?: string
  isActive: boolean
  createdAt: string        // YYYY-MM-DD
}

interface IncomeEntry {
  id: string
  incomeSourceId?: string  // undefined = receita avulsa (sem fonte recorrente)
  categoryId: string       // referencia IncomeCategory
  description: string
  amount: number
  month: string            // YYYY-MM
  receivedDate?: string    // YYYY-MM-DD opcional
  paymentMethod: PaymentMethod
  notes?: string
}
```

### Arquitetura de receitas

- **Fonte recorrente (`IncomeSource`)**: template de receita recorrente (salário, aluguel recebido, etc.) com valor esperado e metadados. Pode ser ativo/inativo.
- **Entrada mensal (`IncomeEntry`)**: registro real de uma receita em determinado mês. Pode ou não estar vinculado a uma fonte (`incomeSourceId` opcional).
- **Receita avulsa**: `IncomeEntry` sem `incomeSourceId` — para Pix esporádico, venda, etc.
- Ao deletar uma fonte: remove também todos os `incomeEntries` vinculados (cascata no store).
- `getMonthlyBalance(month)` → `{ income, expenses, balance }` — helper no store que agrega receitas do mês e despesas cujo `date` começa com o mês.
- Categorias de receita são **separadas** das categorias de despesa (`incomeCategories` vs `categories` no store). Defaults: Salário, Freelance, Investimentos, Aluguel, Vendas, Outros.
- Dashboard exibe card "Saldo do Mês" (receitas − despesas do mês corrente) com link para `/income`.

### Arquitetura de despesas fixas

- **Template (`FixedExpense`)**: define a despesa recorrente com valor sugerido e metadados. Pode ser ativo/inativo.
- **Confirmação mensal (`FixedExpenseMonth`)**: o usuário confirma o valor real de cada mês. Um template pode ter vários meses confirmados.
- **Entradas geradas (`Expense`)**: `syncFixedExpenses()` gera automaticamente entradas semanais (toda segunda-feira) para cada mês confirmado ativo, com `amount = Math.round((fem.amount / 4) * 100) / 100`.
- `syncFixedExpenses()` é chamado após qualquer mutação em `fixedExpenseMonths` e ao hidratar o store (`onRehydrateStorage`).
- Ao deletar um template: remove também todos os `fixedExpenseMonths` e `expenses` vinculados.
- Ao deletar/atualizar um `FixedExpenseMonth`: remove os `expenses` com `fixedExpenseMonthId` correspondente e regenera via `syncFixedExpenses`.

---

## Design system (globals.css)

```css
/* CSS vars — aplicadas em :root e .dark */
--bg, --bg-card, --bg-input  /* fundos hierárquicos */
--border                      /* bordas */
--text, --text-muted          /* tipografia */
--accent (#10b981)            /* verde esmeralda */
--accent-light                /* fundo suave do accent */
--glass                       /* glassmorphism */
--shadow
```

- Dark mode: classe `.dark` no `<html>` — toggle manual via `ThemeProvider`
- Gradiente de marca: `linear-gradient(135deg, #10b981, #06b6d4)` (esmeralda → ciano)
- Classe utilitária `.gradient-text` para textos degradê
- Classe `.glass` para glassmorphism

---

## Lógica semanal (weekHelpers.ts)

- `weekKey` no formato `YYYY-WNN` (ISO week number)
- `getCurrentWeekKey()` — semana atual
- `getWeekKey(date)` — converte data em weekKey
- `getWeekStart(weekKey)` — retorna Monday da semana
- `getWeekDays(weekKey)` — array com os 7 dias (Seg–Dom)
- `buildWeekSummary(weekKey, expenses, budget)` — agrega totais, byCategory, byDay
- `getPreviousWeekKey / getNextWeekKey` — navegação entre semanas
- `formatCurrency(amount)` — `Intl.NumberFormat` pt-BR BRL
- `formatDate(dateStr)` — data formatada pt-BR com dia da semana
- `toLocalDateKey(d: Date)` — converte Date para `YYYY-MM-DD` usando **hora local** (evita UTC offset — NUNCA usar `.toISOString().split('T')[0]` pois retorna UTC e causa bug de dia errado no Brasil)
- `getTodayKey()` — atalho para `toLocalDateKey(new Date())`
- `getMondaysBetween(from: Date, to: Date): Date[]` — retorna todas as segundas-feiras entre duas datas (inclusive). Avança até a próxima segunda se `from` não for segunda.

---

## Categorias padrão

**Despesas:** `food`, `transport`, `bills`, `health`, `leisure`, `shopping`, `education`, `other`

**Receitas:** `income-salary`, `income-freelance`, `income-investments`, `income-rent`, `income-sales`, `income-other`

Ícones Lucide disponíveis em `CategoryIcon.tsx` (30 ícones):
`Utensils, Car, FileText, Heart, Gamepad2, ShoppingBag, BookOpen, MoreHorizontal, Dumbbell, Activity, Tv, Music, Coffee, Plane, Home, Smartphone, Zap, Wifi, Gift, Scissors, PawPrint, Pill, ShoppingCart, Briefcase, Bike, Fuel, Baby, TrendingUp, Laptop`

---

## Autenticação

Supabase Auth (email/password + Google OAuth). JWT armazenado no localStorage com chave `sb-[ref]-auth-token`. Guard em `(app)/layout.tsx` redireciona para `/` se não autenticado. `login()`, `loginWithGoogle()`, `logout({ scope: 'global' })` e `loadUserData()` no store.

## Segurança (implementado)

- **RLS**: todas as 9 tabelas protegidas por `auth.uid() = user_id` — auditado e testado
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy em `next.config.ts`
- **Logout global**: `signOut({ scope: 'global' })` invalida refresh token no servidor
- **Rate limits Supabase**: token refresh 10/5min, sign-ins 5/5min
- **CORS**: Redirect URLs restritas ao domínio de produção + localhost
- **Testes E2E de segurança**: XSS, RLS anon, IDOR1/2, proteção de rotas (39 testes Playwright + 18 testes RLS audit + k6)

---

## Páginas implementadas

| Rota | Função |
|------|--------|
| `/` | Landing com hero, 3 features, auth mock (Google SVG inline, Apple, email) |
| `/dashboard` | KPIs (3 cards), barra de progresso do orçamento, BarChart diário (clicar em barra filtra despesas do dia), PieChart por categoria, lista de despesas do dia selecionado (padrão: hoje), FAB fixo |
| `/expenses` | Lista completa de despesas com filtro por categoria e período, editar/excluir inline |
| `/expenses/new` | `ExpenseForm` sem initialData |
| `/expenses/[id]` | `ExpenseForm` com initialData + botão excluir |
| `/categories` | Lista, form deslizante (mobile: bottom sheet, lg: inline) com picker de ícone (28 opções, grid 7 cols) e cor; clicar no lápis foca o form automaticamente |
| `/establishments` | CRUD de estabelecimentos — nome + categoria padrão. Selecionar no `ExpenseForm` preenche categoria automaticamente |
| `/fixed-expenses` | Templates de despesas fixas + confirmação mensal. Seção "Pendentes" (amber) + histórico por template + modal de registro mensal |
| `/income` | Receitas mensais. Seletor de mês, fontes recorrentes com seção "Pendentes" (amber), lista de entradas do mês, modal para receita avulsa ou vinculada a fonte, histórico por fonte |
| `/summary` | Total + comparação vs semana anterior, AreaChart, donut + legenda, breakdown de categorias com barras animadas, lista completa de despesas |

### Dashboard — filtro por dia
- `selectedDay` (estado local) inicia com `getTodayKey()` e reseta ao mudar de semana
- Clicar em barra do BarChart: `onClick={(data: any) => setSelectedDay(data.date)}`
- Cor das barras: dia selecionado = `#10b981`; hoje (sem seleção) = `rgba(16,185,129,0.25)`; demais = `var(--bg-input)`
- `dailyData` gerado com `toLocalDateKey(d)` (não `toISOString`) para evitar bug de timezone

### Despesas fixas — fluxo
1. Criar template em `/fixed-expenses` (descrição, valor sugerido, categoria, método, ativo/inativo)
2. Para cada mês ativo: clicar "Registrar" → informar valor real daquele mês → confirmar
3. `syncFixedExpenses()` gera automaticamente entradas semanais (segundas-feiras) com `amount = valor_mês / 4`
4. Entradas aparecem no dashboard, resumo e lista de despesas com badge `🔁 Fixa` (roxo)
5. Seção "Pendentes" lista meses sem confirmação desde `createdAt` até mês atual

---

## Layout responsivo (mobile + desktop com igual peso)

| Elemento | Mobile | Desktop (`lg:`) |
|----------|--------|-----------------|
| Navegação | Bottom tab bar fixa + top bar com logo/ações | Sidebar lateral `w-56` (9 itens: Dashboard, Adicionar, Despesas, Fixas, Receitas, Orçamento, Categorias, Locais, Resumo) |
| Main content | `pt-14 pb-20` (compensa top+bottom bar) | `ml-56` (compensa sidebar) |
| Cards KPI | 2 colunas | 3 colunas |
| Gráficos | Empilhados | Side-by-side (5 cols grid) |
| Formulários | Full-width, `max-w-lg mx-auto` | Idem — formulários não precisam de layout wide |
| Categorias form | Bottom sheet animado com overlay | Inline na página |
| Padding páginas | `px-4 py-5` | `lg:px-8 lg:py-8` |

**Regras de breakpoint:** usar apenas `lg:` (1024px) como único breakpoint de mudança de layout. Não usar `md:` para layout estrutural — evita estados intermediários quebrados.

## Convenções importantes

- **NÃO usar classes responsivas do Tailwind para layout estrutural** (ex: `hidden lg:flex`). O Tailwind v4 + Turbopack tem comportamento imprevisível. Usar CSS media queries diretas em `globals.css` para sidebar, topbar, bottomnav e espaçamentos do main content.
- **Layout crítico usa classes CSS puras definidas em `globals.css`**: `app-sidebar`, `app-topbar`, `app-bottomnav`, `app-main`. Os media queries estão lá, não no componente.
- **Componentes de página usam `style={}` inline** para cor, background, padding, tamanhos — não depender de Tailwind para esses valores.
- Tailwind v4 pode ser usado para utilitários simples (`flex`, `items-center`, `rounded-xl`, `gap-*`, etc.) mas não para o layout de grid principal.
- Nunca usar Tailwind `dark:` prefix — usar CSS vars (`var(--text)`, etc.)
- Datas sempre em `YYYY-MM-DD`; ao exibir, usar `new Date(date + 'T12:00:00')` para evitar timezone shift
- **NUNCA usar `.toISOString().split('T')[0]`** para obter data atual — retorna UTC e causa bug (ex: mostra dia 20 quando é dia 19 no Brasil). Usar sempre `getTodayKey()` ou `toLocalDateKey(d)`.
- `weekKey` sempre gerado via `getWeekKey(date)` ao salvar/editar despesa
- Store Zustand: usar `(set, get)` (não só `set`) quando a action precisa ler estado após mutação. `get().syncFixedExpenses()` é o padrão para sincronizar após mutações em `fixedExpenseMonths`.
- Ícones do lucide-react: verificar que o export existe antes de usar (ex: `Chrome` não existe)
- Recharts `Tooltip formatter`: tipar como `(v) => [formatCurrency(Number(v)), 'Label']`
- `z.number()` com `register('amount', { valueAsNumber: true })` para campos monetários
- Route group `(app)` não adiciona segmento à URL — não criar pastas duplicadas em `src/app/`
- Dark mode: classe `dark` aplicada no `<html>` no servidor (root layout). ThemeProvider sincroniza com preferência salva via `useEffect`.

---

## Próximas melhorias (backlog)

### Prioridade média — produto
- [ ] Exportar dados como CSV
- [ ] Gráfico de evolução mensal (receitas vs despesas ao longo dos meses)

### Integração WhatsApp + IA
- [ ] Criar instância na Evolution API (aguardando chip do bot)
- [ ] Conectar número do bot via QR Code (aguardando chip)
- [ ] Configurar webhook na instância apontando para `/api/webhook/whatsapp`
- [ ] Testar fluxo end-to-end com chip real

**Itens concluídos:**
- [x] Filtro de despesas por categoria → `/expenses`
- [x] Lista completa de despesas com editar/excluir → `/expenses`
- [x] Despesas fixas mensais com valor variável → Template + FixedExpenseMonth
- [x] Estabelecimentos com auto-preenchimento de categoria → `/establishments`
- [x] Ícones de categoria expandidos (30 ícones)
- [x] Módulo de receitas → `/income` com fontes recorrentes + entradas avulsas + saldo mensal no Dashboard
- [x] Backend + sync em nuvem → Supabase (9 tabelas, RLS, Auth)
- [x] Deploy VPS Hostinger → Easypanel + Nixpacks + GitHub (Node 20)
- [x] Segurança completa → RLS auditado, headers, rate limits, IDOR, logout global
- [x] Suite de testes E2E → 57 testes Playwright + k6 load test (50 VUs, p95 72ms)
- [x] Página de orçamento → `/budget` com modo valor fixo + por categoria
- [x] Alerta visual no dashboard → banner âmbar a 80%, vermelho a 100% (modo fixo + por categoria)
- [x] Histórico de semanas anteriores → seção em `/summary` com lista paginada (6/página), barra de uso e clique para navegar
- [x] Integração WhatsApp (backend completo) → webhook `/api/webhook/whatsapp`, extração Claude Haiku, Evolution API helper, página `/integrations`, coluna `whatsapp_number` em `user_preferences`

---

## Objetivo do MVP

Construir a primeira versão funcional com foco exclusivo em:
- criação de despesas
- categorização de despesas
- edição de despesas
- exclusão de despesas
- visualização de gastos semanais
- histórico de gastos

Todo o produto deve reforçar a lógica de que a **semana** é a unidade central de controle financeiro.

## Público-alvo e proposta de valor

Usuários que precisam de disciplina financeira em ciclos curtos, gosto por experiência minimalista e necessidade de uma visão clara e rápida do próprio gasto semanal. O produto deve ser percebido como calmo, confiável e premium.

## Deploy (VPS Hostinger + Easypanel)

- **Painel:** Easypanel em `http://31.97.248.13:3000/` — projeto `jorge`, serviço `7dias`
- **Build:** Nixpacks (auto-detecta Next.js) — **Node.js 20** obrigatório (`NIXPACKS_NODE_VERSION=20` como variável de ambiente no serviço)
- **Repositório:** `https://github.com/jorjaocorreia-spec/7dias.git` (privado, branch `main`)
- **Auth GitHub:** token embutido na Git URL do Easypanel (`https://TOKEN@github.com/...`)
- **Porta:** 3000 | **Build:** `npm run build` | **Start:** `npm start`
- **Restrição crítica:** apenas o projeto `jorge` pode ser alterado — nenhum outro projeto da VPS deve ser tocado
- Evolution API já rodando na VPS (projeto `n8n`) — será usada para integração WhatsApp

---

## Skills disponíveis (D:\7Dias\.claude\skills\)

Skills instaladas localmente organizadas por área de uso no projeto.

### Stack principal (usar no dia a dia)
| Skill | Quando usar |
|-------|-------------|
| `nextjs-app-router-patterns` | Dúvidas sobre App Router, layouts, route groups, server/client components |
| `nextjs-best-practices` | Boas práticas gerais de Next.js |
| `react-best-practices` | Padrões React, hooks, performance |
| `react-state-management` | Zustand, contexto, estado derivado |
| `zustand-store-ts` | Padrões específicos de Zustand com TypeScript |
| `typescript-pro` | Tipos avançados, generics, utilitários |
| `zod-validation-expert` | Schemas de validação com Zod + React Hook Form |
| `tailwind-design-system` | Design tokens, CSS vars, sistema visual |
| `tailwind-patterns` | Utilitários Tailwind, responsive sem layout estrutural |

### UI/UX & Design
| Skill | Quando usar |
|-------|-------------|
| `minimalist-ui` | Decisões de design alinhadas à identidade premium/minimalista do app |
| `ui-component` | Criação de componentes reutilizáveis |
| `ui-pattern` | Padrões de interface (bottom sheet, FAB, modal, etc.) |
| `ui-ux-pro-max` | Auditoria de experiência, fluxos de usuário |
| `design-taste-frontend` | Validação de decisões visuais |
| `fixing-accessibility` | Acessibilidade nos componentes |
| `form-cro` | Otimização de formulários (UX de cadastro de despesas) |
| `framer-motion` (via `animejs-animation`) | Animações de entrada, progresso, transições |

### Qualidade de código
| Skill | Quando usar |
|-------|-------------|
| `clean-code` | Revisão de legibilidade e simplicidade |
| `code-reviewer` | Review antes de considerar feature concluída |
| `systematic-debugging` | Debugging estruturado de bugs complexos |
| `debugging-toolkit-smart-debug` | Debug rápido com análise de stack trace |
| `react-component-performance` | Otimização de renders, memoização |
| `testing-patterns` | Padrões de testes unitários/integração |
| `e2e-testing` | Testes end-to-end (fluxos críticos: adicionar despesa, resumo semanal) |

### Backend & Dados (fase Supabase)
| Skill | Quando usar |
|-------|-------------|
| `nextjs-supabase-auth` | Autenticação real substituindo o mock atual |
| `supabase-automation` | Configuração de tabelas, RLS, realtime |
| `database-design` | Modelagem do schema Postgres (migração do localStorage) |
| `postgresql` | Queries, índices, otimizações |
| `api-design-principles` | Design das rotas de API (Next.js Route Handlers) |
| `api-endpoint-builder` | Criação de endpoints REST para o app |

### Integração WhatsApp + IA (fase futura)
| Skill | Quando usar |
|-------|-------------|
| `whatsapp-cloud-api` | Integração com WhatsApp Business API (Meta) — webhook, envio/recebimento de mensagens |
| `whatsapp-automation` | Fluxos automatizados de WhatsApp (confirmações, alertas de orçamento) |
| `claude-api` | Uso da API Anthropic para processar mensagens e extrair dados de despesas |
| `llm-structured-output` | Garantir que o LLM retorne JSON válido para cadastro automático |
| `llm-app-patterns` | Arquitetura de apps com LLM (prompt chaining, fallbacks) |
| `prompt-engineering-patterns` | Prompts para extração de entidade (valor, categoria, estabelecimento) de texto livre |
| `llm-application-dev-ai-assistant` | Construção do assistente financeiro via chat |
| `rag-implementation` | RAG para contexto do usuário (histórico de categorias/estabelecimentos) |
| `agent-orchestrator` | Orquestração do fluxo: receber mensagem → extrair dados → confirmar → salvar |
| `autonomous-agent-patterns` | Agentes que processam mensagens de forma autônoma |
| `fastapi-pro` | Microserviço Python para webhook do WhatsApp (alternativa ao Next.js route handler) |
| `nodejs-backend-patterns` | Backend Node.js para webhook e processamento de mensagens |
| `api-security-best-practices` | Segurança do webhook (validação de assinatura Meta) |

### Deploy & DevOps
| Skill | Quando usar |
|-------|-------------|
| `vercel-deployment` | Deploy alternativo na Vercel (além de Hostinger) |
| `deployment-procedures` | Procedimentos de deploy seguro |
| `deployment-validation-config-validate` | Validar config antes de subir para produção |

### Utilidades gerais
| Skill | Quando usar |
|-------|-------------|
| `context7-auto-research` | Buscar documentação atualizada de libs (Next.js, Supabase, etc.) |
| `deep-research` | Pesquisa técnica aprofundada sobre uma decisão arquitetural |
| `brainstorming` | Explorar ideias de features novas |
| `product-manager` | Priorização de backlog, definição de escopo |
