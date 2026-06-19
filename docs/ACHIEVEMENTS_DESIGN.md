# Sistema de Conquistas (Achievements) — Design

## Entendimento

- **Objetivo:** gamificação com dois eixos — engajamento de uso do app e incentivo a bons hábitos financeiros (metas, orçamento, registro consistente).
- **UI:** página dedicada `/achievements` + card resumo no Dashboard.
- **Mecânica:** badges binários (desbloqueado/bloqueado), sem pontos/XP/nível. Marcos independentes, sem tiers progressivos.
- **Notificação:** toast/modal no app web + mensagem no WhatsApp ao desbloquear.
- **Arquitetura:** checagem centralizada server-side, chamada tanto pelo app web (após mutações no store) quanto pelo webhook do WhatsApp (após extração de despesa) — única fonte de verdade.
- **Catálogo:** hardcoded em `src/data/achievements.ts`; apenas os desbloqueios do usuário ficam no Supabase.

## Assumptions

1. Conquistas são permanentes — não relockam se o hábito for quebrado depois.
2. Conquistas bloqueadas são visíveis com descrição e progresso (não são "secretas").
3. Streaks (ex: dias seguidos) são derivados das datas já existentes nos registros, sem campo novo de "last active day".

## Modelo de dados

### Tabela `user_achievements` (Supabase)

```sql
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);
-- RLS: auth.uid() = user_id
```

Migration: `supabase/migrations/20260619_user_achievements.sql`.

### Catálogo `src/data/achievements.ts`

```ts
interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'usage' | 'consistency' | 'goals' | 'budget' | 'milestones'
  check: (ctx: AchievementContext) => { unlocked: boolean; progress?: number; target?: number }
}
```

`AchievementContext` = snapshot do usuário (despesas, receitas, metas + contribuições, orçamento/preferências, fixas) lido em uma única query batelada.

## Motor de checagem

**Endpoint:** `POST /api/achievements/check`

1. Recebe `userId`.
2. Busca snapshot do usuário via service role (mesmo padrão do cron de lembretes) + lista de `achievement_id`s já desbloqueados.
3. Roda `check(ctx)` de cada item do catálogo ainda não desbloqueado.
4. Insert idempotente em `user_achievements` para os que retornarem `unlocked: true`.
5. Retorna apenas as conquistas **recém-desbloqueadas** nessa chamada.

**Chamadores:**
- App web: fire-and-forget após mutações relevantes no `useAppStore` (despesas, receitas, contribuições de meta, conclusão de meta, confirmação de fixa). Resposta com itens novos dispara o modal de celebração.
- WhatsApp webhook: chamada direta (mesmo processo Next.js) após `extractExpense` salvar com sucesso; desbloqueios disparam mensagem via `sendMessage.ts`.

Centralizar em uma function Next.js (em vez de trigger/Edge Function em SQL/Deno) reaproveita os mesmos types TS (`Expense`, `FinancialGoal` etc) usados no resto do app.

## Catálogo proposto (MVP, ~22 itens)

**Uso/Onboarding:** primeira despesa, primeira receita, categoria própria criada, primeiro estabelecimento, WhatsApp conectado.

**Consistência:** 7 dias seguidos, 30 dias seguidos, 4 semanas seguidas com registro, mês com todas as fixas confirmadas, 50 despesas no total.

**Metas:** primeira meta criada, primeira meta concluída, 3 metas concluídas, 3 meses seguidos contribuindo para a mesma meta, meta de R$ 5.000+ concluída.

**Orçamento:** primeiro mês dentro do orçamento, 3 meses seguidos dentro do orçamento, redução de gasto vs mês anterior, orçamento por categoria configurado.

**Marcos:** R$ 1.000 em despesas históricas, R$ 10.000 em despesas históricas, primeira despesa dividida, primeira despesa parcelada.

Lista é extensível sem migration — basta adicionar itens ao array.

## UI

- **`/achievements`:** grid de cards agrupados por categoria (padrão visual de `/categories`), desbloqueados coloridos com data, bloqueados em `--text-dim` com barra de progresso quando aplicável. Header com contador "X de N desbloqueadas".
- **Card no Dashboard:** mostra conquista mais recente ou próxima mais perto de completar; segue padrão dos cards condicionais existentes (`lg:grid-cols-4`).
- **Modal de celebração:** Framer Motion, padrão de modal centrado já documentado no CLAUDE.md (wrapper estático + `motion.div` interno, fundo `--bg-modal`), fila simples se múltiplas desbloqueadas juntas.
- **WhatsApp:** mensagem de texto via `sendMessage.ts`:
  ```
  🏆 Conquista desbloqueada!
  *[Título]*
  [Descrição]
  ```

## Decision Log

| Decisão | Alternativas consideradas | Por quê |
|---|---|---|
| Badges binários, sem pontos/XP/nível | Pontos + nível (Bronze/Prata/Ouro) | Mais simples; usuário pediu só badges |
| Marcos independentes, sem tiers | Tiers por tema (10/100/500) | Mais simples de definir/exibir |
| Catálogo hardcoded em TS | Tabela Supabase editável | Segue padrão de categories.ts; sem necessidade de admin UI (YAGNI) |
| Apenas `user_achievements` no Supabase | Guardar catálogo todo no banco | Reduz superfície de migration; catálogo versionado no git |
| Checagem server-side centralizada | Lógica duplicada client + webhook | Despesas chegam por dois caminhos que não compartilham o store; única fonte de verdade |
| Disparo após cada mutação relevante | Checagem só ao abrir página | Notificação precisa ser quase imediata |
| Conquistas permanentes | Podem ser perdidas (relock) | Punir regressão desmotiva mais do que motiva |
| Conquistas bloqueadas visíveis com progresso | Conquistas secretas | Transparência motiva mais ação |
| Notificação dupla (toast + WhatsApp) | Apenas uma | Usuário confirmou ambas; reaproveita infra existente |
