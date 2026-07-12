---
target: plataforma completa (16 páginas autenticadas)
total_score: 24
p0_count: 2
p1_count: 3
timestamp: 2026-07-12T02-25-58Z
slug: plataforma-completa-src-app-app
---
Method: dual-agent (A: general-purpose design-review · B: general-purpose detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Nenhum estado de loading/erro em nenhuma página; toggle de modo de orçamento muda instantaneamente sem confirmação |
| 2 | Match System / Real World | 3/4 | Vocabulário pt-BR natural; docked por 4 termos de saldo sobrepostos no dashboard |
| 3 | User Control and Freedom | 2/4 | Confirmação de exclusão varia de "modal" a "nenhuma" dependendo da página |
| 4 | Consistency and Standards | 1/4 | Menor nota: padrão de modal centrado, cor de erro, chrome de botão de exclusão e cópia de toast divergem entre páginas irmãs |
| 5 | Error Prevention | 2/4 | Bloqueio de exclusão de cartão em uso só é comunicado por `title=` (tooltip nativo), invisível em mobile/leitor de tela |
| 6 | Recognition Rather Than Recall | 3/4 | Autocomplete bom; dica de cota semanal renderizada em `--text-dim` (contraste mínimo) apesar de ser informação funcional |
| 7 | Flexibility and Efficiency | 3/4 | Sidebar colapsável, quick-add inline, captura por WhatsApp texto/áudio |
| 8 | Aesthetic and Minimalist Design | 3/4 | Páginas individuais calmas; dashboard acumula até 7 KPIs + 4-5 cards + 2 gráficos numa rolagem contínua |
| 9 | Error Recovery | 2/4 | Estado vazio bom em `/expenses/[id]`; erros de validação usam vermelho hardcoded inconsistente |
| 10 | Help and Documentation | 3/4 | `/help` genuinamente bem estruturado; TOC mobile some sem substituto (`display:none` <1024px) |
| **Total** | | **24/40** | **Acceptable — melhorias significativas necessárias antes que usuários fiquem satisfeitos** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Não é "AI slop" na superfície — a linguagem visual (mesh orbs, glass, emerald/violeta/âmbar/cyan, Syne/DM Mono/Nunito) é distintiva e bem executada onde é seguida fielmente (`AchievementCelebrationModal.tsx` é o único arquivo que implementa o padrão de modal centrado do CLAUDE.md à risca). Mas falha o "product slop test": um usuário fluente em Linear/Notion/Stripe pausaria repetidamente diante de inconsistências — fluxo de exclusão que é linha inline numa página e modal completo noutra, seletor de forma de pagamento em emoji ao lado de um seletor de categoria em ícones Lucide no mesmo formulário, valores monetários ora em DM Mono ora em fonte padrão. A regra mais violada é a que o próprio sistema mais se orgulha: **The Money-Is-Mono Rule** — o campo de valor principal do `ExpenseForm`, a lista de `/expenses`, e a totalidade de `/goals` (zero usos de DM Mono em 793 linhas) não seguem a regra.

**Deterministic scan (Assessment B):** 83 findings via `detect.mjs` — 78 advisory, 5 warning. Destaques verificados no código-fonte (não são falsos positivos):
- `ExpenseForm.tsx:609` — `borderLeft: '3px solid #06b6d4'` decorativo, violação direta da regra "sem faixa lateral colorida" do próprio DESIGN.md.
- 76 ocorrências de `design-system-color`: drift sistemático de `#ef4444` (33x) usado como cor de erro em quase toda a plataforma, enquanto o token oficial `--red: #f43f5e` do DESIGN.md praticamente não é usado em lugar nenhum.
- `Navbar.tsx:320` — bottom sheet mobile com `border-radius: 20px 20px 0 0`, fora da escala documentada.
- `.gradient-text` (globals.css:145) sinalizado pelo detector mas é uso intencional/documentado — falso positivo confirmado.
- Sem servidor de dev ativo nesta rodada → evidência de navegador pulada; scan CLI foi a única fonte determinística.

## Overall Impression

O sistema visual "Bloom"/"The Quiet Ledger" tem identidade real e, quando seguido à risca, funciona muito bem — mas essa disciplina não sobrevive ao contato com as ~16 páginas do app. O problema central não é estética, é **consistência de implementação**: a mesma decisão de design (modal, exclusão, cor de erro, tipografia monetária) foi tomada de formas diferentes em páginas irmãs, o que é especialmente custoso para uma marca cujo pilar central é "confiança através de precisão". A maior oportunidade não é redesenhar nada — é extrair os padrões já corretos (o modal de `AchievementCelebrationModal.tsx`, o card âmbar de `fixed-expenses`/`goals`) em componentes compartilhados e aplicá-los em todo lugar.

## What's Working

1. **`AchievementCelebrationModal.tsx`** é referência: segue o padrão de modal centrado do CLAUDE.md à risca, usa `var(--bg-modal)` corretamente, e mantém o tom sóbrio (zero emoji) mesmo sendo a tela de "conquistas" — prova que o sistema funciona quando implementado fielmente.
2. **Card âmbar "Pendentes"** em `fixed-expenses` e `goals` é consistente entre si e executa exatamente o princípio de design "tornar visível o que está pendente".
3. **`/help`** tem arquitetura de informação real (busca, blocos tipados, TOC) — diferencial raro para um app financeiro deste porte.
4. **Quick-add inline** de categoria/estabelecimento no `ExpenseForm` — fricção mínima de fato, como o PRODUCT.md promete.

## Priority Issues

**[P0] Confirmação de exclusão inconsistente entre páginas de CRUD irmãs**
- **Why it matters**: é uma fintech; perda de dado irreversível sem aviso em algumas páginas mina diretamente o pilar "confiável". Usuário aprende "o app sempre confirma" em `/goals` e apaga algo sem aviso em `/establishments` ou `/expenses/[id]`.
- **Fix**: padronizar em um único padrão (modal com cópia de cascata, como em `/goals`, ou confirmação inline como em `/fixed-expenses`/`/credit-cards`) e aplicar em todas as páginas de CRUD.
- **Suggested command**: /impeccable harden

**[P0] "Money-Is-Mono Rule" (regra própria do sistema) violada na maioria das exibições monetárias**
- **Why it matters**: DESIGN.md chama isso do "sinal visual mais forte de que um número é real"; é a regra mais central e mais desrespeitada — inclusive no campo de valor principal do formulário de despesa.
- **Fix**: auditar todo `formatCurrency()`/`%` e aplicar `var(--font-dm-mono)`; considerar um componente `<Money>` compartilhado para tornar o desvio estruturalmente impossível.
- **Suggested command**: /impeccable typeset

**[P1] Padrão de modal centrado diverge estruturalmente entre páginas apesar de haver um padrão "correto" documentado**
- **Why it matters**: o CLAUDE.md existe justamente porque esse bug (translate+scale quebrando centralização) já ocorreu; com 3 técnicas coexistindo, o próximo modal tem chance de cara-ou-coroa de seguir o padrão certo.
- **Fix**: extrair um componente `<CenteredModal>` a partir da implementação de `AchievementCelebrationModal.tsx` e migrar `categories`, `goals`, `fixed-expenses` para usá-lo.
- **Suggested command**: /impeccable polish

**[P1] Cores fora da paleta vazam em múltiplos lugares apesar do sistema estrito de 5 matizes**
- **Why it matters**: "Function-Not-Decoration Rule" existe para manter cor com significado; um sexto matiz ad hoc (`#818cf8`) e três hex diferentes para "vermelho/erro" (`#ef4444` quase em todo lugar, `--red:#f43f5e` documentado mas não usado, `text-red-400` do Tailwind isolado) corroem essa regra.
- **Fix**: substituir todo `#ef4444`/hex de vermelho por `var(--red)` consistentemente; decidir conscientemente sobre `#818cf8` (dobrar em `--violet` ou formalizar).
- **Suggested command**: /impeccable colorize

**[P1] Grid de KPIs do Dashboard é estruturalmente instável e denso, sem mecanismo de colapso**
- **Why it matters**: o job-to-be-done central ("saber quanto sobra até o fim do mês com mínima fricção") é prejudicado numa tela que pode inflar para 7 tiles + 4-5 cards + 2 gráficos silenciosamente conforme o estado dos dados.
- **Fix**: agrupar os 4 KPIs condicionais (A Receber, Faturas a pagar, Metas, Conquistas) num único tile "Atenção" expansível, mantendo os 3 primários sempre em 3 colunas estáveis.
- **Suggested command**: /impeccable layout

**[P2] Seletor de forma de pagamento usa emoji cru ao lado de um seletor de categoria em ícones Lucide, no mesmo formulário**
- **Why it matters**: PRODUCT.md proíbe explicitamente "excesso de emojis"; dois controles visualmente similares e adjacentes usando duas linguagens de ícone diferentes é exatamente a inconsistência que o brief pede para evitar.
- **Fix**: substituir os 4 emojis de forma de pagamento por ícones Lucide (CreditCard, Zap, Landmark, Banknote).
- **Suggested command**: /impeccable typeset

**[P2] Acessibilidade: controles icon-only sem `aria-label`, toggles customizados sem `role="switch"`**
- **Why it matters**: falha diretamente o compromisso WCAG AA do próprio DESIGN.md; o toggle de "fatura paga" em `/credit-cards` é um `<span onClick>` sem `tabIndex` — um usuário de teclado/leitor de tela não consegue pagar uma fatura de jeito nenhum.
- **Fix**: adicionar `aria-label` em todo botão icon-only; converter toggles customizados em `<button role="switch" aria-checked>` reais.
- **Suggested command**: /impeccable audit

**[P3] `prefers-reduced-motion` é um compromisso documentado no PRODUCT.md mas não está implementado em lugar nenhum**
- **Why it matters**: é a lacuna mais clara entre documentação e código encontrada nesta revisão — Framer Motion é usado em praticamente todas as 16 páginas sem esse fallback.
- **Fix**: usar o hook `useReducedMotion()` do Framer Motion nas variantes de animação compartilhadas.
- **Suggested command**: /impeccable harden

## Persona Red Flags

**Alex (Power User)**: ao checar o saldo do mês, Alex vai notar os quatro rótulos de saldo sobrepostos ("Disponível"/"Saldo do mês"/"Saldo em caixa"/"Saldo real") na mesma tela e precisar parar para rededuzir qual é "o real" — o momento mais claro de "pausaria diante de um componente sutilmente estranho" da plataforma inteira. Ao pagar uma fatura, o toggle é um `<span>` sem chrome de botão nem confirmação — indistinguível de um filtro, abaixo do padrão que um power user espera para uma ação financeira com essas implicações.

**Sam (Acessibilidade)**: os cards clicáveis do dashboard (A Receber, Faturas, Metas, Conquistas) são `<motion.div onClick>`, não `<button>` — **não focáveis via teclado**, então Sam não consegue abrir o drawer "A Receber" de jeito nenhum. Mais grave: o toggle de "fatura paga" em `/credit-cards` é um `<span onClick>` sem `tabIndex` nem handler de teclado — **Sam não consegue pagar/confirmar uma fatura sem mouse**, um dos três fluxos centrais do produto totalmente inacessível.

## Minor Observations

- Copy de "resetar para o período atual" varia: "Atual" (dashboard) vs. "Hoje" (summary).
- Verbo de sucesso no toast varia por entidade: "adicionada" / "criada" / "cadastrado" nas três páginas de CRUD.
- Botão de salvar em `/budget` usa `rounded-xl` enquanto todo outro CTA primário do app usa `rounded-2xl`.
- Blocos de código em artigos de `/help` não usam `var(--font-dm-mono)` apesar da convenção do CLAUDE.md incluir "labels técnicas" na regra do mono.
- Riqueza de estado vazio varia: `/expenses` (uma linha de texto) vs. `/establishments` (ícone+título+descrição) vs. `/categories` (nenhum, porque sempre há defaults).
- O gradiente de marca documentado no CLAUDE.md (emerald→violeta) e o realmente usado nos CTAs (emerald→cyan, igual ao `.gradient-text`) divergem — vale reconciliar a própria documentação.

## Questions to Consider

- Se "Saldo em caixa" e "Saldo do mês" são regimes intencionalmente separados, por que ficam empilhados com chrome de card quase idêntico? Um único toggle "Ver por: Competência / Caixa" não honraria melhor a regra "nunca misturar sem rótulo explícito" reduzindo o acúmulo de quatro rótulos?
- Por que o sistema de conquistas é o único momento genuinamente celebratório do app, quando pagar uma fatura ou fechar um mês dentro do orçamento são arguivelmente mais significativos para a promessa de marca do que desbloquear um badge?
- A variação atual entre modal/inline/nenhuma confirmação de exclusão é uma decisão intencional por tipo de entidade, ou apenas deriva orgânica de páginas construídas independentemente?
- O token `--red: #f43f5e` existe no `globals.css` mas praticamente nunca é usado nas 16 páginas — foi um rebrand posterior que nunca foi propagado?
