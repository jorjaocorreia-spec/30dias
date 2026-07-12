---
name: 30dias
description: Fintech premium de gestão financeira pessoal com foco mensal, dark-only, glassmorphism discreto sobre mesh background.
colors:
  bg: "#0F0F14"
  bg-card: "rgba(255, 255, 255, 0.04)"
  bg-raised: "rgba(255, 255, 255, 0.07)"
  bg-input: "rgba(255, 255, 255, 0.07)"
  bg-modal: "#1A1A26"
  border: "rgba(255, 255, 255, 0.08)"
  border-hover: "rgba(255, 255, 255, 0.15)"
  text: "#F0EDF8"
  text-muted: "rgba(240, 237, 248, 0.5)"
  text-dim: "rgba(240, 237, 248, 0.22)"
  accent: "#10b981"
  accent-light: "rgba(16, 185, 129, 0.15)"
  accent-glow: "rgba(16, 185, 129, 0.35)"
  violet: "#8b5cf6"
  violet-light: "rgba(139, 92, 246, 0.15)"
  amber: "#f59e0b"
  amber-light: "rgba(245, 158, 11, 0.15)"
  cyan: "#06b6d4"
  cyan-light: "rgba(6, 182, 212, 0.15)"
  red: "#f43f5e"
  red-light: "rgba(244, 63, 94, 0.12)"
typography:
  display:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  mono:
    fontFamily: "DM Mono, 'Courier New', monospace"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Nunito, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "16px"
  lg: "16px"
  pill: "12px"
  full: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, {colors.accent}, {colors.cyan})"
    textColor: "#ffffff"
    rounded: "16px"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "linear-gradient(135deg, {colors.accent}, {colors.cyan})"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  card:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: 30dias — "The Quiet Ledger"

## 1. Overview

**Creative North Star: "The Quiet Ledger"**

30dias vive num fundo quase preto, iluminado por dois orbes difusos de mesh — emerald e violeta — que respiram lentamente atrás de cards de vidro quase transparentes. É um livro-caixa que não grita: os números fazem o trabalho, o resto do sistema visual existe para não atrapalhar. A confiança vem da precisão — contraste correto, tipografia monoespaçada nos valores, hierarquia clara — não de efeitos chamativos. O sistema rejeita explicitamente o visual de "SaaS de planilha corporativo frio" (cinza, sem alma, template de admin genérico) e também o tom "gamificado infantilizado" (emojis em excesso, cores berrantes, ludicidade); mesmo a página de conquistas usa o mesmo verniz sóbrio do resto do produto.

Há um único tema — dark-only, sem alternância — porque o produto é usado em qualquer hora do dia e a sensação deve ser sempre a mesma: cofre calmo, não vitrine.

**Key Characteristics:**
- Dark-only absoluto: fundo `#0F0F14`, nunca claro.
- Glassmorphism comedido: cards em `rgba(255,255,255,0.04)`, blur pesado (20px) só nas barras de navegação fixas.
- Mesh background com orbes emerald + violeta (+ cyan/âmbar extras no shell autenticado), sempre atrás do conteúdo (`z-index: 0`), nunca competindo por atenção.
- Três papéis tipográficos nunca confundidos: Syne para títulos, DM Mono para todo valor monetário/percentual, Nunito para o resto da UI.
- Cor com função, não decoração: emerald = dinheiro/sucesso, violeta = dado secundário, âmbar = atenção/pendência, cyan = acento de saldo, vermelho = erro/limite.

## 2. Colors

A paleta é escura e de baixa saturação por padrão, pontuada por acentos funcionais que carregam significado — nunca ornamento gratuito.

### Primary
- **Emerald** (`#10b981`): a cor do dinheiro e do sucesso. Usada em CTAs primários, valores positivos, ícone da marca, indicadores de progresso de metas.

### Secondary
- **Violet** (`#8b5cf6`): dado secundário e o segundo tom do gradiente de marca (`linear-gradient(135deg, #10b981, #8b5cf6)`). Usado com moderação — orbe de mesh, acentos de dados alternativos.

### Tertiary
- **Amber** (`#f59e0b`): estado de atenção — seções "Pendentes" (despesas fixas, faturas a pagar, metas em aberto), avisos de vencimento.
- **Cyan** (`#06b6d4`): acento de saldo — segundo tom do `.gradient-text` (`linear-gradient(135deg, #10b981, #06b6d4)`), usado em KPIs de saldo/disponível.

### Neutral
- **Void** (`#0F0F14`): fundo base de toda a aplicação.
- **Ghost White** (`#F0EDF8`): texto principal, alto contraste sobre o fundo escuro.
- **Muted Ghost** (`rgba(240,237,248,0.5)`): texto secundário — labels, sub-textos.
- **Dim Ghost** (`rgba(240,237,248,0.22)`): texto mínimo — placeholders, elementos quase invisíveis de propósito.
- **Glass Card** (`rgba(255,255,255,0.04)`): fundo de cards, quase transparente para deixar o mesh visível por trás.
- **Raised Glass** (`rgba(255,255,255,0.07)`): elementos elevados e inputs — um degrau acima do card.
- **Modal Solid** (`#1A1A26`): único fundo verdadeiramente sólido do sistema, reservado a modais e bottom sheets.
- **Hairline Border** (`rgba(255,255,255,0.08)`): toda borda de card/input em repouso.

### Named Rules
**The Function-Not-Decoration Rule.** Cada cor de acento tem exatamente um significado (emerald=dinheiro/sucesso, âmbar=pendência, vermelho=erro/limite, violeta/cyan=dado secundário). Nunca reutilizar uma cor de acento para um significado diferente do seu papel estabelecido.

**The Modal-Is-Solid Rule.** Todo o resto do sistema é semi-transparente (`--bg-card`, `--bg-raised`); só modais e bottom sheets usam `--bg-modal` sólido. Nunca usar `--bg-card` num modal — quebra a legibilidade sobre o mesh em movimento atrás dele.

## 3. Typography

**Display Font:** Syne (com fallback `system-ui, sans-serif`)
**Body Font:** Nunito (com fallback `system-ui, -apple-system, sans-serif`)
**Label/Mono Font:** DM Mono (com fallback `'Courier New', monospace`)

**Character:** Um trio com papéis estritamente separados, não uma paleta de escolha livre — Syne dá peso geométrico aos títulos, DM Mono dá precisão técnica a todo número que representa dinheiro, e Nunito carrega o resto da interface com calor humano discreto.

### Hierarchy
- **Display** (Syne, 700, 1.25rem–1.5rem, 1.2): títulos de seção, brand na navbar, cabeçalhos de página.
- **Headline** (Syne, 600, 1.125rem, 1.25): sub-títulos de card, nomes de categoria em destaque.
- **Body** (Nunito, 400, 0.9375rem, 1.5): texto de UI padrão, navegação, corpo de formulários. Nunca ultrapassar 65–75ch em blocos de texto corrido.
- **Mono/Label** (DM Mono, 500, 0.875rem–1.5rem, 1.3): todo valor monetário, percentual e label técnica (datas curtas, contadores). O peso visual da confiança do produto mora aqui.

### Named Rules
**The Money-Is-Mono Rule.** Todo valor monetário e percentual usa `var(--font-dm-mono)`, sem exceção — é o sinal visual mais forte de que um número é "real" (dinheiro) e não apenas um rótulo de UI.

## 4. Elevation

O sistema não usa camadas tonais estilo Material. A profundidade vem de duas fontes combinadas: transparência progressiva (`--bg-card` → `--bg-raised` → `--bg-modal` sólido) e uma sombra difusa escura única aplicada a superfícies flutuantes, nunca uma escala de sombras clara/múltipla.

### Shadow Vocabulary
- **Glass Shadow** (`box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`): sombra padrão de qualquer card ou superfície de vidro em repouso; o inset highlight simula a borda superior de um vidro real.
- **Glass Shadow Hover** (`box-shadow: 0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)`): resposta a hover/foco — a superfície "sobe" ficando mais opaca e a sombra mais larga e escura.

### Named Rules
**The Blur-Is-Structural Rule.** `backdrop-filter: blur(20px)` é reservado às três barras de navegação fixas (`app-sidebar`, `app-topbar`, `app-bottomnav`) — elas precisam permanecer legíveis sobre conteúdo rolante. Cards de conteúdo usam no máximo `blur(12px)` (`.glass`) e só quando decorativo, nunca por padrão.

## 5. Components

Botões, cards e inputs são discretos e confiáveis, com brilho comedido: o gradiente de marca aparece só na ação primária de cada tela, nunca como decoração ambiente.

### Buttons
- **Shape:** cantos bem arredondados (`rounded-2xl`, 16px) nos CTAs principais; 8px nos botões secundários/pequenos.
- **Primary:** fundo `linear-gradient(135deg, #10b981, #06b6d4)`, texto branco, padding generoso (`py-4` full-width em formulários). É o único lugar onde o gradiente de marca aparece como preenchimento sólido de um elemento interativo.
- **Ghost/ação rápida:** fundo `--accent-light`, texto `--accent`, sem borda, `border-radius: 8px`, padding compacto (`4px 8px`) — usado para ações secundárias inline (ex.: "adicionar rápido" em formulários).
- **Hover / Focus:** `hover:opacity-90` nos primários; transições suaves, nunca abruptas.

### Cards / Containers
- **Corner Style:** 16px de raio como padrão de card.
- **Background:** `--bg-card` (semi-transparente) em repouso; nunca sólido fora de modais.
- **Shadow Strategy:** Glass Shadow em repouso, Glass Shadow Hover em interação (ver Elevation).
- **Border:** `1px solid var(--border)`, clareando para `--border-hover` em hover.

### Inputs / Fields
- **Style:** fundo `--bg-input` (mesmo tom de `--bg-raised`), `border-radius: 16px`, borda `--border`.
- **Focus:** borda clareia para `--border-hover`; sem glow adicional por padrão.
- **Toggle/Switch:** trilho de 44×24px com `border-radius: 12px`, thumb circular de 18×18px (`border-radius: 50%`) em branco — o único lugar onde um elemento branco sólido aparece fora do texto.

### Navigation
- Sidebar (desktop, `224px`, colapsável para `60px`) e topbar/bottomnav (mobile) compartilham o mesmo tratamento visual: fundo quase opaco (`rgba(8,8,14,0.75–0.85)`), `blur(20px)`, borda hairline no limite com o conteúdo. Bottom nav mobile mostra os 4 itens mais usados + um botão "Mais" que abre bottom sheet (fundo `--bg-modal` sólido) para o restante.

### Mesh Background (signature component)
Dois orbes via `body::before`/`body::after` (emerald 700px + violeta 600px, `filter: blur(120px)`, opacidade 0.12–0.14, `@keyframes meshOrb` 12–15s) mais dois orbes extras (cyan + âmbar) injetados via JSX no shell autenticado. Sempre `position: fixed`, `z-index: 0`, `pointer-events: none` — presença ambiente, nunca interativa.

## 6. Do's and Don'ts

### Do:
- **Do** manter o fundo em `#0F0F14` sempre — não há tema claro e não deve haver.
- **Do** usar `var(--font-dm-mono)` em todo valor monetário/percentual, sem exceção (The Money-Is-Mono Rule).
- **Do** reservar o gradiente `linear-gradient(135deg, #10b981, #06b6d4 ou #8b5cf6)` para um único elemento de destaque por tela (CTA primário ou brand icon) — nunca aplicado a múltiplos elementos na mesma view.
- **Do** usar `--bg-modal` sólido (`#1A1A26`) em todo modal e bottom sheet; nunca `--bg-card` transparente nesses contextos.
- **Do** usar seções âmbar (`--amber`, `--amber-light`) para tornar visível o que está pendente (fixas, faturas, metas) em vez de escondê-lo.

### Don't:
- **Don't** introduzir um toggle de tema claro ou qualquer lógica de tema além do dark-only atual.
- **Don't** usar `border-left`/`border-right` colorido como faixa decorativa em cards ou list items.
- **Don't** aplicar `backdrop-filter: blur()` a cards de conteúdo por padrão — reservado às barras de navegação fixas (The Blur-Is-Structural Rule).
- **Don't** deixar o visual aproximar-se de um "SaaS de planilha corporativo frio": nada de cinza sem vida, template de admin genérico, ausência de personalidade.
- **Don't** infantilizar a interface com excesso de emojis, cores berrantes ou tom lúdico — nem mesmo na página de conquistas.
- **Don't** misturar os dois regimes de cálculo (competência vs. caixa) numa mesma exibição visual sem rótulo explícito de qual é qual.
