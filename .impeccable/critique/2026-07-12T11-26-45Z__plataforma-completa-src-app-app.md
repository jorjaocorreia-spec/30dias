---
target: plataforma completa (16 páginas autenticadas) — rodada 2
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-07-12T11-26-45Z
slug: plataforma-completa-src-app-app
---
Method: dual-agent (A: general-purpose design-review · B: general-purpose detector-evidence) — rodada 2, após harden/typeset/polish/colorize/layout/audit

## Verificação das correções da rodada 1

| # | Item (rodada 1) | Veredito |
|---|---|---|
| 1 | Confirmação de exclusão inconsistente | **Corrigido** (nenhuma exclusão sem aviso), mas 2 técnicas coexistem (modal `ConfirmDialog` vs. inline expansível) — rebaixado a P2 |
| 2 | Money-Is-Mono | **Corrigido** — `Money.tsx` amplamente adotado; pequena lacuna nos inputs de split |
| 3 | 3 técnicas de modal centrado | **Parcial** — `CenteredModal.tsx` criado e correto em `/goals`, mas `income` e `fixed-expenses` ainda duplicam o padrão manualmente |
| 4 | Cores fora da paleta (#ef4444/#818cf8) | **Parcial** — `#ef4444`/`#818cf8` eliminados como drift (confirmado pelo scan: 83→29 findings), mas cores default de categoria (`data/categories.ts`, `incomeCategories.ts`) e dezenas de hex hardcoded que replicam vars (`var(--red)` ao lado de `#f43f5e` na mesma função) permanecem |
| 5 | Grid de KPIs instável | **Corrigido** — grid de 3 colunas estável + tile "Atenção" expansível, bem implementado |
| 6 | Emoji no seletor de pagamento | **Corrigido** — ícones Lucide (CreditCard/Zap/Landmark/Banknote) |
| 7 | Acessibilidade (toggle de fatura + aria-label) | **Parcial** — o caso citado (fatura paga) está perfeito; mas 3 toggles adicionais (`goals` form ×2, `credit-cards` form) sem `role="switch"`, e Navbar usa só `title` em vez de `aria-label` |
| 8 | prefers-reduced-motion | **Corrigido** — `MotionConfigProvider` no layout raiz |

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Tile "Atenção" não diferencia urgência real (Faturas) de informativo (Conquistas) |
| 2 | Match System / Real World | 4/4 | — |
| 3 | User Control and Freedom | 3/4 | Dois padrões de confirmação (modal vs. inline) tornam o comportamento menos previsível |
| 4 | Consistency and Standards | 2/4 | Três formas de "vermelho": `text-red-400`, `var(--red)`, `#f43f5e` hardcoded; dois padrões de modal; toggles com/sem `role=switch` no mesmo arquivo |
| 5 | Error Prevention | 3/4 | Validação Zod + `superRefine` para cartão de crédito é exemplar |
| 6 | Recognition Rather Than Recall | 4/4 | — |
| 7 | Flexibility and Efficiency | 3/4 | — |
| 8 | Aesthetic and Minimalist Design | 3/4 | Hex hardcoded é "ruído invisível" que já vazou (categoria Saúde em #ef4444) |
| 9 | Error Recovery | 3/4 | Mensagens de erro usam `text-red-400` off-palette |
| 10 | Help and Documentation | 4/4 | — |
| **Total** | | **32/40** | **Good — resolver a área fraca restante** |

## Anti-Patterns Verdict

**LLM assessment**: Não é AI slop — decisões de produto reais (competência vs. caixa, splits, parcelamento). O sintoma agora é "componentização inacabada": `ConfirmDialog`, `CenteredModal` e `Money` foram criados corretamente mas adotados apenas no primeiro lugar óbvio, não varridos pela plataforma inteira — sinal de correção "arquivo por arquivo" em vez de sistemática.

**Deterministic scan**: 83→29 findings (-65%). O drift `#ef4444` foi 100% eliminado fora dos contextos legítimos (QUICK_COLORS, categorias-array). Porém o `border-left` decorativo (`side-tab`) em `ExpenseForm.tsx:616` ("Sua parte", `borderLeft: '3px solid #06b6d4'`) **não foi corrigido** — segue violando a regra "sem faixa lateral colorida" do próprio DESIGN.md. `design-system-radius` (Navbar bottom sheet, scrollbar) e `layout-transition` (sidebar/app-main) seguem intocados, como esperado (baixa prioridade, fora do escopo desta rodada).

## Overall Impression

Ganho real de 24→32/40. As correções sistêmicas (harden, layout, prefers-reduced-motion) foram bem executadas de ponta a ponta. As correções "de componente compartilhado" (ConfirmDialog, CenteredModal, Money, cores) resolveram o problema no ponto exato apontado pela crítica anterior, mas não generalizaram a correção para instâncias irmãs do mesmo padrão em outras páginas — a lacuna clássica de "corrigir o sintoma citado, não a causa raiz".

## What's Working

1. Tile "Atenção" no dashboard — implementação elegante, sem layout shift, resolve o problema de grid instável de forma exemplar.
2. `Money`/`ConfirmDialog` seguem exatamente as regras do design system onde adotados — prova de compreensão correta, só falta cobertura.
3. `superRefine` no Zod exigindo cartão de crédito quando a forma de pagamento exige — rigor de prevenção de erro raro em apps deste porte.

## Priority Issues

**[P1] Hex hardcoded duplicando as CSS vars em ~9 arquivos**
- **Why it matters**: o mesmo valor de cor expresso como `var(--red)` e como `#f43f5e` na mesma função (`dashboard/page.tsx:280,356`) é uma bomba-relógio de manutenção — a próxima mudança de paleta só vai propagar pela metade.
- **Fix**: grep-and-replace sistemático de todo hex que coincide com uma CSS var, fora dos arrays de escolha do usuário.
- **Suggested command**: /impeccable colorize

**[P1] Categorias default com cor off-palette permanente**
- **Why it matters**: ao contrário do picker do usuário, isso é dado de seed herdado por todo usuário novo — aparece permanentemente no gráfico de pizza e badges (`data/categories.ts:7` Saúde, `data/incomeCategories.ts:8` Vendas, ambos `#ef4444`).
- **Fix**: trocar para `var(--red)`/`#f43f5e` ou outro tom da paleta oficial.
- **Suggested command**: /impeccable colorize

**[P2] Dois padrões de confirmação de exclusão coexistindo (modal vs. inline)**
- **Why it matters**: mesma ação (excluir um registro financeiro), duas sensações diferentes, sem racional documentado — mina a promessa de "confiança através de precisão".
- **Fix**: decidir e documentar a regra, ou unificar via `ConfirmDialog` também nas listas (`expenses`, `credit-cards`, `fixed-expenses`, `income`).
- **Suggested command**: /impeccable polish

**[P2] `CenteredModal` criado mas não adotado em `income`/`fixed-expenses`**
- **Why it matters**: exatamente a duplicação de código que a extração do componente deveria eliminar.
- **Fix**: migrar os modais hand-rolled de `income/page.tsx:699-773` e `fixed-expenses/page.tsx:403-407` para `CenteredModal`.
- **Suggested command**: /impeccable polish

**[P2] `border-left` decorativo remanescente em `ExpenseForm.tsx:616`**
- **Why it matters**: violação direta e não corrigida da regra "sem faixa lateral colorida" do próprio DESIGN.md, na seção "Sua parte".
- **Fix**: substituir a faixa lateral por fundo tintado completo ou ícone líder, sem borda lateral espessa.
- **Suggested command**: /impeccable polish

**[P2] Cobertura incompleta de `role="switch"`/`aria-checked`**
- **Why it matters**: mesmo componente visual de toggle com semântica de acessibilidade inconsistente entre instâncias (`goals` form ×2, `credit-cards` form).
- **Fix**: aplicar `role="switch" aria-checked aria-label` nos 3 toggles restantes.
- **Suggested command**: /impeccable audit

**[P3] Botões icon-only na Navbar usam só `title`, nunca `aria-label`**
- **Why it matters**: `title` não garante nome acessível consistente entre leitores de tela.
- **Fix**: adicionar `aria-label` equivalente ao `title` já presente em `Navbar.tsx:154,163,194,241,330`.
- **Suggested command**: /impeccable audit

## Persona Red Flags

**Alex (Power User)**: não teria problema funcional, mas notaria ao longo de semanas a inconsistência de confirmação (modal em `/goals`, um clique a mais em `/expenses`) — o tipo de detalhe que um usuário frequente acumula como atrito, contrariando a promessa "confiança através de precisão".

**Sam (Acessibilidade)**: o toggle de fatura paga (o achado mais grave da rodada anterior) está corrigido. Mas os 3 toggles restantes sem `role="switch"` ainda deixam lacunas reais para leitor de tela — o PRODUCT.md cita WCAG AA como padrão, então é uma promessa parcialmente cumprida, não um nice-to-have.

## Minor Observations

- `goals/page.tsx:759` usa `#10b981` hardcoded ao lado de `<Money>` — poderia ser `var(--accent)` sem custo.
- `summary/page.tsx` concentra a maior quantidade de hex hardcoded da plataforma (>15 ocorrências) — bom ponto de partida se revisitar o item de cores.
- `ExpenseForm.tsx:555,588` (inputs de valor de participante no split) não herdam `var(--font-dm-mono)` como o campo principal.

## Questions to Consider

- Vale adicionar ao CLAUDE.md uma regra explícita "toda cor vem de `var(--*)`, nunca hex literal fora de arrays de picker" e "todo modal centrado usa `CenteredModal`", já que os componentes corretos já existem mas a convenção não virou obrigatória?
- A dualidade de padrões de confirmação é uma decisão deliberada (lista densa vs. entidade única) ou acidente de implementação? Se deliberada, merece uma linha no DESIGN.md.
- Há usuários reais de leitor de tela hoje? Se WCAG AA é promessa e não aspiração, vale um passe dedicado grep por todo `role="switch"` faltante em vez de correção incremental.
