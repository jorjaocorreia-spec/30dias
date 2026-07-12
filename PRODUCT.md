# Product

## Register

product

## Platform

web

## Users

Indivíduos controlando as próprias finanças pessoais mês a mês — não um dashboard de casal ou família como caso central, embora o app suporte despesas divididas como recurso complementar. O contexto de uso é rotineiro e leve: registrar um gasto rapidamente (pelo app ou por uma mensagem de WhatsApp, em texto ou áudio), depois voltar ao dashboard para entender como o mês está indo. O job a ser feito é simples de enunciar e difícil de sustentar: saber, com o mínimo de fricção possível, quanto sobra até o fim do mês.

## Product Purpose

30dias é uma fintech premium de gestão financeira pessoal com foco mensal e acompanhamento semanal dentro do mês. Cobre despesas (incluindo fixas, parceladas e divididas), receitas, orçamento, metas financeiras e cartões de crédito, com dois regimes de cálculo coexistindo de propósito (competência para orçamento/GASTOS, caixa real para saldo em caixa). Sucesso é o usuário confiar no número que o app mostra o suficiente para tomar decisões de gasto no dia a dia, sem precisar abrir uma planilha paralela.

## Positioning

Gestão financeira com foco mensal (não apenas semanal como a maioria dos apps) combinada a registro por WhatsApp — texto ou áudio — direto na conversa, sem precisar abrir o app para lançar um gasto.

## Brand Personality

Premium, calmo, confiável. O tom é sóbrio e adulto — o app é onde o usuário confirma que está no controle, não onde é entretido. Isso já se reflete no design system "Bloom": dark-only, mesh background sutil, glassmorphism discreto, paleta emerald/violeta/âmbar/cyan sobre fundo escuro, tipografia com papéis bem distintos (Syne para títulos, DM Mono para valores monetários, Nunito para UI). A confiabilidade também se expressa na precisão dos números: os dois regimes de cálculo (competência vs. caixa) nunca são fundidos, e cada tela mostra exatamente o que promete mostrar.

## Anti-references

Não deve parecer um SaaS genérico de planilha/dashboard corporativo frio (cinza, sem personalidade, template de admin). Também não deve parecer um app "gamificado" infantilizado — sem excesso de emojis, cores berrantes ou tom lúdico; o registro de conquistas (`/achievements`) existe, mas com o mesmo verniz sóbrio do resto do produto, não como mecânica de jogo.

## Design Principles

- **Dois regimes, nunca fundidos**: competência (planejamento) e caixa (dinheiro que saiu de fato) são conceitos diferentes e a UI deve deixar isso sempre claro, nunca misturar os números.
- **Fricção mínima no registro, clareza máxima na leitura**: lançar um gasto deve ser tão rápido quanto mandar uma mensagem de WhatsApp; entender o mês deve ser tão claro quanto olhar um único número.
- **Confiança visual através de precisão, não de decoração**: o peso do design "premium" vem da tipografia certa, do contraste correto e da consistência dos valores — não de efeitos visuais chamativos.
- **Peso igual mobile/desktop**: nenhuma plataforma é tratada como secundária; um único breakpoint (`lg:`) organiza a mudança estrutural, não um design mobile "reduzido".
- **Mostrar, não esconder, o estado pendente**: seções âmbar (fixas pendentes, faturas a pagar, metas em aberto) tornam visível o que ainda precisa de atenção, em vez de escondê-lo atrás de outra tela.

## Accessibility & Inclusion

Nível WCAG AA como padrão razoável: contraste adequado (corpo de texto ≥4.5:1, texto grande ≥3:1) mesmo no tema dark-only, e suporte a `prefers-reduced-motion` nas animações (Framer Motion). Sem exigências adicionais formais além disso por enquanto.
