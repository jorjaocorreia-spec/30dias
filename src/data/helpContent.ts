export type Block =
  | { type: 'p'; text: string }
  | { type: 'callout'; variant: 'tip' | 'info' | 'warning'; title?: string; text: string }
  | { type: 'steps'; items: { title: string; desc: string }[] }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; text: string }
  | { type: 'h3'; text: string }

export interface Section {
  id: string
  title: string
  blocks: Block[]
}

export interface HelpArticle {
  slug: string
  title: string
  iconName: string
  description: string
  category: 'inicio' | 'financas' | 'analise' | 'integracoes'
  sections: Section[]
}

export const helpCategories: Record<HelpArticle['category'], string> = {
  inicio: 'Começando',
  financas: 'Finanças',
  analise: 'Análise & Organização',
  integracoes: 'Integrações',
}

export const helpArticles: HelpArticle[] = [
  // ─── PRIMEIROS PASSOS ───────────────────────────────────────────────────────
  {
    slug: 'primeiros-passos',
    title: 'Primeiros Passos',
    iconName: 'Zap',
    description: 'Crie sua conta, configure o orçamento e registre sua primeira despesa.',
    category: 'inicio',
    sections: [
      {
        id: 'o-que-e',
        title: 'O que é o 7Dias',
        blocks: [
          { type: 'p', text: 'O 7Dias é uma plataforma de gestão financeira pessoal baseada em ciclos semanais. Em vez de pensar em meses — longos e abstratos —, você controla seus gastos semana a semana: um recorte de tempo natural e muito mais fácil de manter.' },
          { type: 'p', text: 'A ideia central é simples: defina quanto pode gastar por semana e acompanhe em tempo real se está dentro do limite. Com o tempo, padrões emergem e fica mais fácil tomar decisões conscientes com seu dinheiro.' },
          { type: 'callout', variant: 'info', title: 'Por que semanas?', text: 'Semanas são o ritmo natural do cotidiano — compras, saídas, academia. Meses são longos demais para ajustes rápidos. Com semanas, você corrige o rumo antes que o problema fique grande.' },
        ],
      },
      {
        id: 'criando-conta',
        title: 'Criando sua conta',
        blocks: [
          { type: 'steps', items: [
            { title: 'Acesse a plataforma', desc: 'Abra o 7Dias no navegador do celular ou do computador.' },
            { title: 'Escolha o método de login', desc: 'Entre com Google (mais rápido) ou crie uma conta com e-mail e senha.' },
            { title: 'Confirme o e-mail', desc: 'Se optar por e-mail e senha, verifique sua caixa de entrada para confirmar o cadastro.' },
            { title: 'Pronto!', desc: 'Você será redirecionado para o Dashboard, já com categorias padrão criadas automaticamente.' },
          ]},
          { type: 'callout', variant: 'tip', title: 'Dica', text: 'Use o login com Google para evitar uma senha a mais para lembrar. O acesso é instantâneo e seguro.' },
        ],
      },
      {
        id: 'configurando-orcamento',
        title: 'Configurando o orçamento semanal',
        blocks: [
          { type: 'p', text: 'Antes de registrar gastos, defina quanto você pode gastar por semana. Esse número é o coração do 7Dias — tudo gira em torno dele.' },
          { type: 'steps', items: [
            { title: 'Acesse Orçamento', desc: 'No menu lateral (computador) ou no menu inferior (celular), clique em "Orçamento".' },
            { title: 'Escolha o modo', desc: '"Valor fixo" cria um limite único para todos os gastos. "Por categoria" permite limites separados para Alimentação, Transporte, etc.' },
            { title: 'Defina o valor', desc: 'Digite o valor em reais por semana. Uma boa referência: divida sua renda mensal disponível por 4.' },
            { title: 'Salve', desc: 'Clique em "Salvar" e volte ao Dashboard — o orçamento já estará ativo.' },
          ]},
          { type: 'callout', variant: 'tip', title: 'Não sabe qual valor usar?', text: 'Comece com R$ 500/semana e ajuste após 2 a 3 semanas observando seus gastos reais. Mais importante do que acertar de primeira é ter um número de referência.' },
        ],
      },
      {
        id: 'primeira-despesa',
        title: 'Registrando sua primeira despesa',
        blocks: [
          { type: 'steps', items: [
            { title: 'Clique em "Adicionar"', desc: 'No menu, clique no ícone "+" ou em "Adicionar" para abrir o formulário de nova despesa.' },
            { title: 'Preencha o valor', desc: 'Digite o valor gasto em reais (ex: 47,50). Apenas números são aceitos.' },
            { title: 'Selecione a categoria', desc: 'Escolha o tipo de gasto: Alimentação, Transporte, Saúde, Diversão, etc.' },
            { title: 'Adicione uma descrição', desc: 'Escreva algo que identifique o gasto (ex: "Mercado da semana", "Gasolina sexta").' },
            { title: 'Confirme a data', desc: 'A data atual já vem preenchida. Altere se o gasto foi em outro dia.' },
            { title: 'Salve', desc: 'Clique em "Adicionar despesa". O Dashboard atualiza imediatamente.' },
          ]},
          { type: 'callout', variant: 'tip', title: 'Atalho pelo WhatsApp', text: 'Você pode registrar gastos enviando mensagens como "gastei 47 no mercado". Configure seu número em Integrações para ativar esse recurso.' },
        ],
      },
      {
        id: 'entendendo-semanas',
        title: 'Entendendo os ciclos semanais',
        blocks: [
          { type: 'p', text: 'O 7Dias organiza finanças em semanas de segunda a domingo. Cada semana é um ciclo independente com seu próprio saldo de orçamento.' },
          { type: 'list', items: [
            'O Dashboard sempre abre na semana atual',
            'Use as setas ← → para navegar entre semanas passadas e futuras',
            'Despesas fixas são lançadas automaticamente toda segunda-feira',
            'O orçamento recomeça do zero toda semana — gastos da semana passada não "acumulam"',
            'O balanço mensal (receitas - despesas) agrega todas as semanas do mês',
          ]},
          { type: 'callout', variant: 'info', text: 'Se você gastou menos de R$ 300 numa semana mas o limite é R$ 500, os R$ 200 sobrando não passam para a próxima semana. Isso é intencional: ajuda a criar hábitos consistentes em vez de compensações.' },
        ],
      },
      {
        id: 'proximos-passos',
        title: 'Próximos passos sugeridos',
        blocks: [
          { type: 'p', text: 'Com a conta criada e o orçamento configurado, explore os módulos nesta ordem para extrair o máximo do 7Dias:' },
          { type: 'list', items: [
            '1. Cadastre suas despesas fixas mensais (aluguel, academia, streaming, internet)',
            '2. Registre suas fontes de renda em Receitas',
            '3. Explore o Dashboard e entenda os gráficos e KPIs',
            '4. Analise padrões no Resumo após a primeira semana completa',
            '5. Configure o WhatsApp para registrar gastos com uma mensagem rápida',
          ]},
        ],
      },
    ],
  },

  // ─── DASHBOARD ──────────────────────────────────────────────────────────────
  {
    slug: 'dashboard',
    title: 'Dashboard',
    iconName: 'LayoutDashboard',
    description: 'Entenda cada elemento da tela principal e como ler seus dados financeiros.',
    category: 'inicio',
    sections: [
      {
        id: 'visao-geral',
        title: 'Visão geral',
        blocks: [
          { type: 'p', text: 'O Dashboard é a tela principal do 7Dias. Ele mostra um resumo completo da sua semana atual: quanto gastou, quanto ainda tem disponível, como os gastos se distribuem ao longo dos dias e por categoria.' },
          { type: 'p', text: 'Toda vez que você lança uma despesa, o Dashboard atualiza imediatamente — sem precisar recarregar a página.' },
        ],
      },
      {
        id: 'navegacao-semanas',
        title: 'Navegando entre semanas',
        blocks: [
          { type: 'p', text: 'No topo do Dashboard há um seletor de semana com três controles:' },
          { type: 'list', items: [
            '← (seta esquerda): vai para a semana anterior',
            'Semana atual (texto no centro): exibe o intervalo de datas (ex: "19 mai – 25 mai")',
            '→ (seta direita): vai para a próxima semana',
          ]},
          { type: 'callout', variant: 'tip', text: 'Clique no texto da semana para voltar rapidamente para a semana atual de qualquer ponto no tempo.' },
        ],
      },
      {
        id: 'kpis',
        title: 'Os cards de KPI',
        blocks: [
          { type: 'p', text: 'Logo abaixo do seletor de semana ficam os cards com os indicadores principais (KPIs):' },
          { type: 'table', headers: ['Card', 'O que mostra'], rows: [
            ['Gasto', 'Total gasto na semana atual (usando o valor efetivo de despesas divididas)'],
            ['Disponível', 'Orçamento restante. Verde = dentro do limite, vermelho = acima'],
            ['Despesas', 'Quantidade de despesas registradas na semana'],
            ['A Receber', 'Aparece quando há valores pendentes de divisão de despesas no mês corrente'],
          ]},
          { type: 'callout', variant: 'info', title: 'Valor efetivo', text: 'Se uma despesa foi dividida, apenas "sua parte" entra nos cálculos de gasto e disponível. O valor total pago aparece na lista de despesas, mas não afeta seu orçamento.' },
        ],
      },
      {
        id: 'barra-orcamento',
        title: 'Barra de orçamento',
        blocks: [
          { type: 'p', text: 'Abaixo dos KPIs, uma barra de progresso mostra visualmente quanto do orçamento foi consumido:' },
          { type: 'list', items: [
            'Verde: dentro do orçamento (0% a 79%)',
            'Âmbar/laranja: atenção — acima de 80% do limite',
            'Vermelho: orçamento estourado — 100% ou mais gasto',
          ]},
          { type: 'p', text: 'A barra exibe o percentual exato (ex: "67% do orçamento usado") e os valores: gasto / limite total.' },
        ],
      },
      {
        id: 'saldo-mensal',
        title: 'Saldo mensal',
        blocks: [
          { type: 'p', text: 'O card de saldo mensal mostra três valores do mês corrente:' },
          { type: 'list', items: [
            'Receitas: total de receitas registradas no mês',
            'Despesas: total de despesas no mês (valor efetivo)',
            'Saldo: Receitas − Despesas. Verde = positivo, vermelho = negativo',
          ]},
          { type: 'callout', variant: 'tip', text: 'Para ter um saldo mensal preciso, registre suas receitas em Receitas. Sem receitas cadastradas, o saldo fica zerado ou negativo.' },
        ],
      },
      {
        id: 'projecao-mensal',
        title: 'Projeção mensal',
        blocks: [
          { type: 'p', text: 'O card de projeção estima quanto você vai gastar até o fim do mês com base no ritmo atual. O cálculo considera os dias decorridos e o total gasto até agora.' },
          { type: 'callout', variant: 'info', text: 'A projeção é mais precisa a partir do meio do mês. Na primeira semana, o número pode variar muito conforme novos gastos entram.' },
        ],
      },
      {
        id: 'grafico-diario',
        title: 'Gráfico de gastos diários',
        blocks: [
          { type: 'p', text: 'O gráfico de barras exibe os gastos de cada dia da semana atual (segunda a domingo). Cada barra representa o total gasto naquele dia.' },
          { type: 'list', items: [
            'Barra verde sólida: dia selecionado (mostra lista de despesas abaixo)',
            'Barra verde transparente: dia de hoje (quando não selecionado)',
            'Barra cinza: outros dias',
          ]},
          { type: 'p', text: 'Clique em qualquer barra para filtrar e ver apenas as despesas daquele dia na lista abaixo do gráfico. Clique novamente para desselecionar.' },
          { type: 'callout', variant: 'tip', text: 'Use o filtro de dia para revisar o que foi gasto em uma data específica sem precisar abrir a página de Despesas.' },
        ],
      },
      {
        id: 'grafico-categoria',
        title: 'Gráfico por categoria',
        blocks: [
          { type: 'p', text: 'O gráfico de pizza exibe como os gastos da semana se distribuem entre as categorias. Ao lado, uma legenda mostra o nome da categoria, o valor e o percentual.' },
          { type: 'callout', variant: 'info', text: 'Apenas categorias com gastos na semana aparecem no gráfico. Se não houve gasto em Transporte, essa categoria não aparece.' },
        ],
      },
      {
        id: 'card-a-receber',
        title: 'Card "A Receber"',
        blocks: [
          { type: 'p', text: 'Quando você tem despesas divididas com outras pessoas que ainda não pagaram no mês corrente, o card "A Receber" aparece automaticamente no painel de KPIs.' },
          { type: 'p', text: 'Clique nele para abrir o drawer de divisões pendentes, onde você pode:' },
          { type: 'list', items: [
            'Ver todas as divisões do mês com o nome de cada participante',
            'Marcar um participante como "Pago" ou "Pendente"',
            'Ver a data em que o pagamento foi registrado',
            'Acompanhar o total pendente vs total a receber no mês',
          ]},
        ],
      },
      {
        id: 'boas-praticas-dashboard',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Abra o Dashboard toda manhã para saber quanto ainda tem disponível na semana',
            'Use o filtro de dia antes de dormir para checar se não esqueceu nenhum gasto',
            'Se a barra ficar âmbar antes de quarta-feira, revise seus gastos do restante da semana',
            'O saldo mensal negativo é um sinal para ajustar o orçamento ou reduzir gastos variáveis',
          ]},
        ],
      },
    ],
  },

  // ─── DESPESAS ───────────────────────────────────────────────────────────────
  {
    slug: 'despesas',
    title: 'Despesas',
    iconName: 'ShoppingCart',
    description: 'Registre, edite, filtre e organize todos os seus gastos.',
    category: 'financas',
    sections: [
      {
        id: 'visao-geral',
        title: 'Visão geral',
        blocks: [
          { type: 'p', text: 'A página de Despesas exibe todas as suas despesas com filtros avançados. É onde você revisa o histórico completo, edita lançamentos e exclui registros incorretos.' },
          { type: 'p', text: 'Para registrar uma nova despesa, use o botão "+" no menu — ele abre o formulário diretamente.' },
        ],
      },
      {
        id: 'registrando-despesa',
        title: 'Registrando uma despesa',
        blocks: [
          { type: 'steps', items: [
            { title: 'Abra o formulário', desc: 'Clique em "Adicionar" no menu ou acesse /expenses/new diretamente.' },
            { title: 'Digite o valor', desc: 'Informe o valor em reais. Use ponto ou vírgula como separador decimal (ex: 47,50 ou 47.50).' },
            { title: 'Selecione o estabelecimento (opcional)', desc: 'Se você cadastrou locais, selecione aqui — a categoria é preenchida automaticamente.' },
            { title: 'Escolha a categoria', desc: 'Selecione entre as categorias disponíveis. Se precisar de uma nova, clique em "Nova categoria" ao lado.' },
            { title: 'Escreva a descrição', desc: 'Uma descrição curta e clara (máximo 100 caracteres). Ex: "Almoço com colegas", "Conta de luz".' },
            { title: 'Confirme a data', desc: 'A data atual já vem preenchida. Altere se o gasto foi em outro dia.' },
            { title: 'Escolha o meio de pagamento', desc: 'Cartão de crédito, Pix, TED ou Dinheiro.' },
            { title: 'Salve', desc: 'Clique em "Adicionar despesa" para salvar.' },
          ]},
          { type: 'callout', variant: 'tip', title: 'Notas opcionais', text: 'O campo "Notas" (opcional) é ótimo para informações extras: número do recibo, observações sobre o gasto, lembrete para reembolso.' },
        ],
      },
      {
        id: 'campos-formulario',
        title: 'Campos do formulário explicados',
        blocks: [
          { type: 'table', headers: ['Campo', 'Obrigatório', 'Descrição'], rows: [
            ['Valor (R$)', 'Sim', 'Valor total pago. Se dividida, este é o valor total — não a sua parte.'],
            ['Estabelecimento', 'Não', 'Local onde a despesa ocorreu. Ao selecionar, a categoria é preenchida automaticamente.'],
            ['Categoria', 'Sim', 'Tipo de gasto. Usada para gráficos, filtros e orçamento por categoria.'],
            ['Descrição', 'Sim', 'Texto livre para identificar o gasto (máx. 100 caracteres).'],
            ['Data', 'Sim', 'Data em que o gasto ocorreu. Padrão: hoje.'],
            ['Meio de pagamento', 'Sim', 'Cartão, Pix, TED ou Dinheiro. Usado para relatórios futuros.'],
            ['Notas', 'Não', 'Campo livre para observações adicionais.'],
          ]},
        ],
      },
      {
        id: 'meios-pagamento',
        title: 'Meios de pagamento',
        blocks: [
          { type: 'table', headers: ['Opção', 'Quando usar'], rows: [
            ['Cartão de crédito', 'Compras no crédito (faturas futuras)'],
            ['Pix', 'Transferências e pagamentos instantâneos'],
            ['TED', 'Transferências bancárias tradicionais'],
            ['Dinheiro', 'Pagamentos em espécie'],
          ]},
          { type: 'callout', variant: 'info', text: 'O meio de pagamento não afeta os cálculos de orçamento — é apenas uma informação para seu controle e relatórios. Registre sempre o que foi de fato utilizado.' },
        ],
      },
      {
        id: 'usando-estabelecimentos',
        title: 'Usando estabelecimentos no formulário',
        blocks: [
          { type: 'p', text: 'O campo de estabelecimento tem autocomplete: conforme você digita, sugestões aparecem. Ao selecionar um local cadastrado, a categoria é preenchida automaticamente.' },
          { type: 'p', text: 'Se o local ainda não existe, clique em "Novo local" logo abaixo do campo para criá-lo e já usá-lo na despesa.' },
          { type: 'callout', variant: 'tip', text: 'Cadastre os locais que você frequenta regularmente (mercado, academia, posto de gasolina). Isso acelera muito o lançamento de despesas.' },
        ],
      },
      {
        id: 'editando-excluindo',
        title: 'Editando e excluindo despesas',
        blocks: [
          { type: 'p', text: 'Na lista de despesas, cada item tem dois botões de ação:' },
          { type: 'list', items: [
            'Lápis (editar): abre o formulário preenchido com os dados da despesa',
            'Lixeira (excluir): pede confirmação antes de deletar definitivamente',
          ]},
          { type: 'callout', variant: 'warning', title: 'Atenção', text: 'A exclusão é irreversível. Se excluir uma despesa por engano, precisará relançá-la manualmente.' },
        ],
      },
      {
        id: 'filtros',
        title: 'Filtros na lista de despesas',
        blocks: [
          { type: 'p', text: 'No topo da página de Despesas há quatro filtros combináveis:' },
          { type: 'table', headers: ['Filtro', 'Opções'], rows: [
            ['Tipo', 'Todas | Variáveis | Fixas (🔁) | Divididas (👥)'],
            ['Data inicial', 'Qualquer data — filtra despesas a partir desta data'],
            ['Data final', 'Qualquer data — filtra despesas até esta data'],
            ['Categoria', 'Todas as categorias disponíveis'],
          ]},
          { type: 'callout', variant: 'tip', text: 'Combine data inicial + final para ver gastos de um mês específico. Ex: 01/05 a 31/05 mostra todas as despesas de maio.' },
        ],
      },
      {
        id: 'boas-praticas-despesas',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Lance despesas no mesmo dia — a memória falha e datas erradas distorcem os relatórios',
            'Seja consistente com as categorias: "Farmácia" sempre em Saúde, "Ifood" sempre em Alimentação',
            'Use a descrição para identificar o gasto sem precisar abrir os detalhes (ex: "Mercado Dia" é melhor que "Compras")',
            'Para despesas de cartão de crédito, lance na data da compra, não no vencimento da fatura',
            'Use o filtro "Divididas" para revisar quem ainda deve para você',
          ]},
        ],
      },
    ],
  },

  // ─── DESPESAS FIXAS ─────────────────────────────────────────────────────────
  {
    slug: 'despesas-fixas',
    title: 'Despesas Fixas',
    iconName: 'Repeat2',
    description: 'Gerencie despesas recorrentes mensais e sincronize automaticamente com seu orçamento semanal.',
    category: 'financas',
    sections: [
      {
        id: 'o-que-sao',
        title: 'O que são despesas fixas',
        blocks: [
          { type: 'p', text: 'Despesas fixas são gastos que se repetem todo mês: aluguel, academia, Netflix, plano de celular, internet. Em vez de lançar esses valores manualmente todo mês, você cria um template uma vez e o 7Dias cuida do resto.' },
          { type: 'p', text: 'O sistema funciona em dois níveis: o template (despesa fixa) define o padrão, e o registro mensal define o valor real daquele mês — que pode variar (conta de luz, por exemplo).' },
          { type: 'callout', variant: 'info', title: 'Como funciona a sincronização', text: 'Quando você confirma o valor de uma despesa fixa para um mês, o 7Dias divide automaticamente por 4 e lança entradas semanais toda segunda-feira do mês. Assim o impacto no orçamento fica diluído ao longo das semanas.' },
        ],
      },
      {
        id: 'criando-template',
        title: 'Criando um template de despesa fixa',
        blocks: [
          { type: 'steps', items: [
            { title: 'Acesse Fixas', desc: 'Clique em "Fixas" no menu.' },
            { title: 'Clique em "Nova fixa"', desc: 'O formulário abre como painel lateral (computador) ou bottom sheet (celular).' },
            { title: 'Preencha a descrição', desc: 'Nome da despesa (ex: "Academia SmartFit", "Netflix", "Aluguel").' },
            { title: 'Valor sugerido (opcional)', desc: 'Valor padrão mensal. Será usado como referência, mas você pode ajustar a cada mês.' },
            { title: 'Dia de vencimento (opcional)', desc: 'Dia do mês em que essa conta vence (1 a 31). Usado para lembretes via WhatsApp.' },
            { title: 'Ative lembretes (opcional)', desc: 'Se preencheu o dia de vencimento e tem WhatsApp configurado, ative para receber alertas 1 dia antes e no dia.' },
            { title: 'Selecione a categoria', desc: 'Escolha a categoria correspondente ou crie uma nova.' },
            { title: 'Escolha o estabelecimento (opcional)', desc: 'Vincule a um local se quiser organização extra.' },
            { title: 'Salve', desc: 'O template é criado e aparece na lista. Ainda não gera despesas — você precisa confirmar o valor para cada mês.' },
          ]},
        ],
      },
      {
        id: 'registrando-mes',
        title: 'Registrando o valor do mês',
        blocks: [
          { type: 'p', text: 'Todo mês você precisa confirmar o valor real de cada despesa fixa. Isso serve tanto para meses com valor variável quanto para confirmar que a despesa ocorreu.' },
          { type: 'steps', items: [
            { title: 'Seção Pendentes', desc: 'No topo da página, as despesas fixas ainda não registradas no mês aparecem com borda laranja.' },
            { title: 'Clique em "Registrar"', desc: 'Um modal abre solicitando o valor para o mês em questão.' },
            { title: 'Confirme o valor', desc: 'O valor sugerido já vem preenchido. Altere se o valor real foi diferente (conta de luz variável, por exemplo).' },
            { title: 'Confirme', desc: 'O sistema divide o valor por 4 e lança entradas semanais automaticamente. Uma nota mostra: "= R$ X/semana — lançado nas segundas de [mês]".' },
          ]},
          { type: 'callout', variant: 'tip', text: 'Registre os valores fixos sempre no início do mês para ter o orçamento correto desde a primeira semana.' },
        ],
      },
      {
        id: 'secao-pendentes',
        title: 'Seção Pendentes',
        blocks: [
          { type: 'p', text: 'A seção Pendentes aparece automaticamente no topo da página quando há despesas fixas ativas sem registro no mês atual.' },
          { type: 'p', text: 'Ela tem fundo âmbar (alaranjado) para chamar atenção. Cada item pendente mostra o nome da despesa e o valor sugerido. Clique em "Registrar" para confirmar.' },
          { type: 'callout', variant: 'info', text: 'Despesas inativas não aparecem em Pendentes. Se você pausou uma despesa fixa (como uma academia em férias), ela não aparece como pendente.' },
        ],
      },
      {
        id: 'sincronizacao',
        title: 'Sincronização automática (como funciona por dentro)',
        blocks: [
          { type: 'p', text: 'Ao confirmar o valor de uma despesa fixa para um mês, o sistema:' },
          { type: 'list', items: [
            '1. Divide o valor mensal por 4 (arredondado para 2 casas decimais)',
            '2. Localiza todas as segundas-feiras do mês selecionado',
            '3. Cria uma despesa para cada segunda com o valor calculado',
            '4. As despesas geradas aparecem com o ícone 🔁 na lista de despesas',
          ]},
          { type: 'callout', variant: 'info', title: 'Exemplo', text: 'Academia de R$ 120/mês → R$ 30/semana. Em um mês com 4 segundas: quatro despesas de R$ 30 são criadas automaticamente.' },
          { type: 'callout', variant: 'warning', text: 'Se você editar o valor mensal depois de já ter confirmado, as entradas semanais antigas são removidas e recriadas com o novo valor.' },
        ],
      },
      {
        id: 'lembretes-whatsapp',
        title: 'Lembretes de vencimento via WhatsApp',
        blocks: [
          { type: 'p', text: 'Se você preencheu o dia de vencimento e tem o número de WhatsApp cadastrado em Integrações, pode ativar lembretes automáticos.' },
          { type: 'list', items: [
            'Lembrete 1 dia antes do vencimento: "Amanhã vence [nome], valor: R$ X"',
            'Lembrete no dia do vencimento: "Hoje vence [nome], valor: R$ X"',
            'Os lembretes chegam às 8h da manhã (horário de Brasília)',
            'Se o dia de vencimento for no dia 31 em um mês com 30 dias, o lembrete ocorre no dia 30',
          ]},
          { type: 'callout', variant: 'tip', text: 'Ative lembretes apenas para despesas com datas de vencimento fixas: aluguel, cartão de crédito, financiamentos. Para despesas como Netflix (débito automático), lembretes são dispensáveis.' },
        ],
      },
      {
        id: 'historico-meses',
        title: 'Histórico de meses',
        blocks: [
          { type: 'p', text: 'Cada template de despesa fixa pode ser expandido clicando no ícone de seta (chevron). No painel expandido você vê:' },
          { type: 'list', items: [
            'Histórico de meses: lista de todos os meses já registrados com o valor e equivalente semanal',
            'Botões de editar e excluir por mês (exclusão remove as despesas semanais geradas)',
            '"Registrar novos meses": lista meses ainda não registrados com botão "Registrar"',
          ]},
        ],
      },
      {
        id: 'ativar-pausar',
        title: 'Ativando e pausando templates',
        blocks: [
          { type: 'p', text: 'Cada template tem um toggle Ativa/Inativa. Use isso quando uma despesa fixa for temporária:' },
          { type: 'list', items: [
            'Inativar: a despesa não aparece em Pendentes e não gera novas entradas semanais',
            'Reativar: volta a aparecer em Pendentes e pode ser registrada normalmente',
            'Use "Inativar" em vez de excluir quando quiser pausar temporariamente (férias, período sem academia)',
          ]},
        ],
      },
      {
        id: 'boas-praticas-fixas',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Cadastre todas as suas despesas fixas de uma vez na primeira configuração',
            'Registre os valores no início de cada mês para ter o orçamento correto desde a semana 1',
            'Use o valor sugerido apenas como referência — sempre confirme o valor real',
            'Para assinaturas em dólar (Netflix, Spotify), registre o valor convertido do mês (varia com o câmbio)',
            'Inative despesas fixas paradas em vez de excluir — assim preserva o histórico',
          ]},
        ],
      },
    ],
  },

  // ─── DESPESAS DIVIDIDAS ─────────────────────────────────────────────────────
  {
    slug: 'despesas-divididas',
    title: 'Despesas Divididas',
    iconName: 'Users',
    description: 'Divida gastos com outras pessoas, acompanhe quem pagou e controle seu orçamento.',
    category: 'financas',
    sections: [
      {
        id: 'o-que-e',
        title: 'O que são despesas divididas',
        blocks: [
          { type: 'p', text: 'Despesas divididas permitem registrar gastos compartilhados com outras pessoas — jantar em grupo, presente coletivo, hospedagem com amigos — e acompanhar quem já reembolsou sua parte.' },
          { type: 'p', text: 'O ponto principal: apenas "sua parte" entra no seu orçamento. O valor total é registrado para controle, mas o impacto financeiro real é só a parcela que você efetivamente arca.' },
        ],
      },
      {
        id: 'como-dividir',
        title: 'Como dividir uma despesa',
        blocks: [
          { type: 'steps', items: [
            { title: 'Abra o formulário de despesa', desc: 'Nova despesa ou edite uma existente.' },
            { title: 'Ative "Dividir com outras pessoas"', desc: 'O toggle aparece no formulário. Ao ativar, um painel de participantes é exibido.' },
            { title: 'Adicione participantes', desc: 'Clique em "Adicionar participante", insira o nome e o valor que essa pessoa deve pagar.' },
            { title: 'Repita para cada pessoa', desc: 'Adicione quantos participantes precisar.' },
            { title: 'Verifique "Sua parte"', desc: 'No rodapé do painel, "Sua parte" mostra automaticamente: valor total − soma dos participantes.' },
            { title: 'Salve', desc: 'Clique em "Adicionar despesa". A despesa aparece com o ícone 👥 na lista.' },
          ]},
          { type: 'callout', variant: 'info', title: 'Exemplo', text: 'Jantar de R$ 200. Você pagou tudo. Divide com Maria (R$ 60) e João (R$ 80). Sua parte = R$ 200 − R$ 60 − R$ 80 = R$ 60. Apenas R$ 60 entram no seu orçamento.' },
        ],
      },
      {
        id: 'dividir-igual',
        title: 'Dividir igualmente',
        blocks: [
          { type: 'p', text: 'O botão "Dividir igual" distribui o valor total proporcionalmente entre todos os participantes (incluindo você).' },
          { type: 'steps', items: [
            { title: 'Adicione os participantes', desc: 'Insira todos os nomes primeiro (sem preencher valores).' },
            { title: 'Clique em "Dividir igual"', desc: 'O sistema calcula: valor total ÷ (número de participantes + 1) para cada pessoa.' },
            { title: 'Ajuste se necessário', desc: 'Você pode editar individualmente qualquer valor após a divisão automática.' },
          ]},
          { type: 'callout', variant: 'tip', text: 'Use "Dividir igual" quando todos vão pagar a mesma quantia. Para divisões desiguais (alguém comeu mais, alguém não bebeu), ajuste manualmente.' },
        ],
      },
      {
        id: 'partes-desiguais',
        title: 'Divisões com partes desiguais (shares)',
        blocks: [
          { type: 'p', text: 'Cada participante tem um campo de "partes" (shares) que permite representar divisões proporcionais. Por padrão é 1 parte por pessoa.' },
          { type: 'p', text: 'Exemplo de uso: casal num hotel. O quarto custa R$ 400, mas divide com mais 2 pessoas. Você e o parceiro(a) compartilham um quarto → 2 partes para vocês, 1 para cada amigo.' },
          { type: 'list', items: [
            'Shares = 1: uma parte (padrão)',
            'Shares = 2: duas partes (equivale a duas pessoas no mesmo item)',
            'Shares = 0.5: meia parte (consumiu menos, deve metade)',
          ]},
          { type: 'p', text: '"Dividir igual" respeita os shares de cada participante ao calcular os valores. Um participante com 2 shares recebe o dobro do valor de quem tem 1 share.' },
        ],
      },
      {
        id: 'acompanhar-pagamentos',
        title: 'Acompanhando quem pagou',
        blocks: [
          { type: 'p', text: 'Na lista de despesas, clique na despesa dividida para expandir o painel de participantes. Cada participante mostra:' },
          { type: 'list', items: [
            'Nome e valor devido',
            'Status: "Pendente" (laranja) ou "Pago" (verde)',
            'Data do pagamento (quando marcado como pago)',
          ]},
          { type: 'p', text: 'Clique em "Pendente" ou "Pago" para alternar o status. Ao marcar como pago, a data é registrada automaticamente.' },
          { type: 'callout', variant: 'tip', text: 'No Dashboard, o card "A Receber" mostra o total pendente do mês. Abra-o para ver todas as divisões de uma vez e marcar pagamentos sem precisar entrar em cada despesa.' },
        ],
      },
      {
        id: 'impacto-orcamento',
        title: 'Impacto no orçamento',
        blocks: [
          { type: 'p', text: 'O 7Dias usa o "valor efetivo" em todos os cálculos de orçamento:' },
          { type: 'list', items: [
            'Valor efetivo = valor total − soma dos valores dos participantes',
            'A barra de orçamento do Dashboard usa o valor efetivo',
            'O card "Gasto" do Dashboard usa o valor efetivo',
            'O saldo mensal usa o valor efetivo',
            'O Resumo usa o valor efetivo',
          ]},
          { type: 'callout', variant: 'info', text: 'O valor total da despesa aparece na lista (para transparência), mas não "inflaciona" seu orçamento. Você só é debitado pela sua parte real.' },
        ],
      },
      {
        id: 'boas-praticas-divisao',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Lance a despesa completa no momento do pagamento (você pagou tudo), não espere o reembolso',
            'Use o campo "Notas" para registrar o contexto: "Jantar aniversário da Ana — 4 pessoas"',
            'Marque como pago assim que receber o reembolso (Pix, transferência)',
            'Use "A Receber" no Dashboard para ter uma visão mensal consolidada de tudo que ainda está pendente',
            'Se todos pagaram sua parte na hora, não precisa usar despesas divididas — registre apenas sua parte diretamente',
          ]},
        ],
      },
    ],
  },

  // ─── ORÇAMENTO ──────────────────────────────────────────────────────────────
  {
    slug: 'orcamento',
    title: 'Orçamento',
    iconName: 'Wallet',
    description: 'Configure limites semanais por valor fixo ou por categoria e entenda como as fixas entram automaticamente.',
    category: 'financas',
    sections: [
      {
        id: 'modos',
        title: 'Dois modos de orçamento',
        blocks: [
          { type: 'p', text: 'O 7Dias oferece dois modos de orçamento. Você pode trocar entre eles a qualquer momento:' },
          { type: 'table', headers: ['Modo', 'Ideal para'], rows: [
            ['Valor fixo', 'Quem quer simplicidade: um único limite semanal para tudo'],
            ['Por categoria', 'Quem quer controle granular: limites separados por Alimentação, Transporte, etc.'],
          ]},
          { type: 'callout', variant: 'warning', title: 'Atenção ao trocar de modo', text: 'Ao trocar de Valor fixo para Por categoria (ou vice-versa), os valores digitados no modo anterior são descartados. As despesas não são afetadas — apenas as configurações de limite.' },
        ],
      },
      {
        id: 'modo-fixo',
        title: 'Modo: Valor fixo',
        blocks: [
          { type: 'p', text: 'No modo Valor fixo há um único campo: o orçamento semanal discricionário em reais.' },
          { type: 'p', text: 'O orçamento efetivo total é calculado automaticamente:' },
          { type: 'list', items: [
            'Discricionário: valor que você digitou',
            'Fixas (🔒 automático): soma semanal (÷4) das despesas fixas ativas no mês',
            'Total efetivo = Discricionário + Fixas',
          ]},
          { type: 'callout', variant: 'info', title: 'Exemplo', text: 'Você define R$ 500/semana. Suas fixas confirmadas somam R$ 200/mês → R$ 50/semana. Orçamento efetivo = R$ 550/semana. A barra de progresso usa R$ 550 como 100%.' },
        ],
      },
      {
        id: 'modo-categoria',
        title: 'Modo: Por categoria',
        blocks: [
          { type: 'p', text: 'No modo Por categoria, cada categoria de despesa tem seu próprio limite semanal. A tabela mostra:' },
          { type: 'table', headers: ['Coluna', 'Descrição'], rows: [
            ['Categoria', 'Nome e ícone da categoria'],
            ['Fixas (🔒)', 'Valor semanal automático de despesas fixas dessa categoria (somente leitura)'],
            ['Discricionário', 'Limite que você define para gastos variáveis da categoria'],
            ['Total efetivo', 'Fixas + Discricionário para essa categoria'],
          ]},
          { type: 'callout', variant: 'tip', text: 'A coluna "Fixas" só aparece quando você tem despesas fixas confirmadas com categoria correspondente. Se não houver fixas, a tabela fica mais simples.' },
        ],
      },
      {
        id: 'fixas-no-orcamento',
        title: 'Como as despesas fixas entram no orçamento',
        blocks: [
          { type: 'p', text: 'As despesas fixas são adicionadas automaticamente ao orçamento assim que você confirma o valor de um mês. Você não precisa fazer nada manualmente.' },
          { type: 'p', text: 'O cálculo: valor mensal confirmado ÷ 4 = contribuição semanal. Se você alterar o valor mensal da fixa, o orçamento recalcula na hora.' },
          { type: 'callout', variant: 'info', text: 'O cadeado 🔒 ao lado das fixas no orçamento indica que esse valor é automático — não é editável diretamente. Para alterar, vá em Fixas e edite o valor mensal confirmado.' },
        ],
      },
      {
        id: 'estimativa-mensal',
        title: 'Estimativa mensal',
        blocks: [
          { type: 'p', text: 'Em ambos os modos, o card "Estimativa mensal" mostra uma projeção de quanto você gastará no mês se mantiver o ritmo configurado:' },
          { type: 'list', items: [
            'Cálculo: (orçamento semanal + fixas semanais) × 4',
            'É uma estimativa — o gasto real pode variar',
            'Use como referência para saber se o orçamento cabe na sua renda',
          ]},
        ],
      },
      {
        id: 'barra-progresso',
        title: 'Interpretando a barra de progresso',
        blocks: [
          { type: 'p', text: 'A barra no Dashboard mostra quanto do orçamento semanal já foi usado:' },
          { type: 'list', items: [
            '0% a 79%: verde — dentro do planejado',
            '80% a 99%: âmbar/laranja — atenção, fique de olho',
            '100% ou mais: vermelho — orçamento estourado',
          ]},
          { type: 'callout', variant: 'tip', text: 'Se a barra ficar laranja antes de quarta-feira, avalie os gastos pendentes da semana. Se ficar vermelha no início da semana, considere revisar o orçamento ou adiar compras não essenciais.' },
        ],
      },
      {
        id: 'quando-usar-cada-modo',
        title: 'Quando usar cada modo',
        blocks: [
          { type: 'p', text: 'Use Valor fixo se:' },
          { type: 'list', items: [
            'Você está começando e quer simplicidade',
            'Sua vida financeira não tem grandes variações por categoria',
            'Você prefere um número único para checar no dia a dia',
          ]},
          { type: 'p', text: 'Use Por categoria se:' },
          { type: 'list', items: [
            'Você quer controlar especificamente quanto gasta em Alimentação, Lazer, etc.',
            'Tem categorias onde costuma extrapolar (ex: Lazer sempre passa do esperado)',
            'Quer alinhar o orçamento com metas por área de vida',
          ]},
        ],
      },
    ],
  },

  // ─── RECEITAS ───────────────────────────────────────────────────────────────
  {
    slug: 'receitas',
    title: 'Receitas',
    iconName: 'TrendingUp',
    description: 'Gerencie fontes de renda recorrentes e registros mensais para acompanhar seu saldo.',
    category: 'financas',
    sections: [
      {
        id: 'visao-geral',
        title: 'Visão geral',
        blocks: [
          { type: 'p', text: 'O módulo de Receitas funciona de forma espelhada às Despesas Fixas: você cria fontes recorrentes (salário, freelances, aluguéis) e registra o valor real recebido a cada mês.' },
          { type: 'p', text: 'Isso permite que o saldo mensal (receitas − despesas) seja calculado com precisão no Dashboard.' },
        ],
      },
      {
        id: 'fontes-vs-avulsas',
        title: 'Fontes recorrentes vs entradas avulsas',
        blocks: [
          { type: 'table', headers: ['Tipo', 'Quando usar'], rows: [
            ['Fonte recorrente', 'Renda que se repete todo mês: salário, aluguel de imóvel, freela fixo'],
            ['Entrada avulsa', 'Renda esporádica: venda de algo, bônus, presente em dinheiro, serviço pontual'],
          ]},
          { type: 'callout', variant: 'info', text: 'Fontes recorrentes aparecem em Pendentes todo mês (assim como despesas fixas), lembrando de você registrar o valor recebido. Entradas avulsas são lançadas diretamente sem template.' },
        ],
      },
      {
        id: 'criando-fonte',
        title: 'Criando uma fonte recorrente',
        blocks: [
          { type: 'steps', items: [
            { title: 'Acesse Receitas', desc: 'Clique em "Receitas" no menu.' },
            { title: 'Clique em "Nova fonte"', desc: 'O formulário abre no painel inferior (celular) ou lateral (computador).' },
            { title: 'Preencha a descrição', desc: 'Nome da fonte (ex: "Salário CLT", "Aluguel Kitnet", "Freela Design").' },
            { title: 'Valor esperado (opcional)', desc: 'Valor médio mensal. Serve como referência no modal de registro.' },
            { title: 'Selecione a categoria', desc: 'Salário, Freelance, Investimentos, Aluguel, Vendas ou Outros.' },
            { title: 'Meio de recebimento', desc: 'Pix, TED, Cartão ou Dinheiro.' },
            { title: 'Salve', desc: 'A fonte aparece na lista e passará a aparecer em Pendentes todo mês.' },
          ]},
        ],
      },
      {
        id: 'registrando-mes',
        title: 'Registrando receitas do mês',
        blocks: [
          { type: 'p', text: 'Há duas formas de registrar uma receita no mês:' },
          { type: 'h3', text: '1. Via Pendentes (fontes recorrentes)' },
          { type: 'steps', items: [
            { title: 'Veja a seção Pendentes', desc: 'Fontes sem registro no mês selecionado aparecem no topo com fundo âmbar.' },
            { title: 'Clique em "Registrar"', desc: 'Modal abre com a fonte pré-selecionada e o valor esperado preenchido.' },
            { title: 'Confirme ou ajuste o valor', desc: 'Altere se recebeu diferente do esperado (variação de freela, adiantamento, etc.).' },
            { title: 'Confirme', desc: 'O registro aparece na lista do mês.' },
          ]},
          { type: 'h3', text: '2. Entrada avulsa' },
          { type: 'steps', items: [
            { title: 'Clique em "Nova receita"', desc: 'Abre um modal de nova receita.' },
            { title: 'Escolha o modo', desc: '"Avulsa" (sem fonte) ou "De uma fonte" (vincula a uma fonte existente).' },
            { title: 'Preencha os campos', desc: 'Descrição, valor, categoria, meio de recebimento, data (opcional), notas.' },
            { title: 'Salve', desc: 'A receita entra no mês atual ou no mês selecionado.' },
          ]},
        ],
      },
      {
        id: 'seletor-mes',
        title: 'Navegando por meses',
        blocks: [
          { type: 'p', text: 'No topo da página há um seletor de mês com setas ← →. Use para ver o histórico de receitas de meses anteriores ou para registrar receitas de meses específicos.' },
          { type: 'callout', variant: 'info', text: 'Ao mudar o mês, a seção Pendentes atualiza para mostrar fontes sem registro naquele mês específico — não apenas o mês atual.' },
        ],
      },
      {
        id: 'saldo-mensal',
        title: 'Saldo mensal',
        blocks: [
          { type: 'p', text: 'O total de receitas do mês selecionado é exibido no cabeçalho do seletor de mês. No Dashboard, o card "Saldo mensal" usa esse total para calcular: Receitas − Despesas = Saldo.' },
          { type: 'callout', variant: 'tip', text: 'Para ter um saldo mensal preciso, registre as receitas no mês em que elas foram recebidas, não no mês de competência. Ex: salário de maio recebido em 5 de maio → registre em maio.' },
        ],
      },
      {
        id: 'categorias-receita',
        title: 'Categorias de receita',
        blocks: [
          { type: 'p', text: 'As categorias de receita são independentes das categorias de despesa. As padrões são:' },
          { type: 'table', headers: ['Categoria', 'Uso sugerido'], rows: [
            ['Salário', 'Renda de emprego CLT ou PJ fixo'],
            ['Freelance', 'Projetos e serviços pontuais'],
            ['Investimentos', 'Dividendos, rendimentos, juros'],
            ['Aluguel', 'Renda de imóveis alugados'],
            ['Vendas', 'Venda de itens, produtos'],
            ['Outros', 'Qualquer receita que não se encaixe acima'],
          ]},
          { type: 'p', text: 'Para criar categorias de receita personalizadas, vá em Categorias — há uma aba separada para categorias de receita.' },
        ],
      },
      {
        id: 'boas-praticas-receitas',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Registre o salário assim que cair na conta — assim o saldo do mês fica correto desde o início',
            'Use "valor esperado" nas fontes como meta, não como valor fixo. Freelas variam.',
            'Crie uma fonte para cada contrato ou cliente regular, não apenas "Freelance genérico"',
            'Registre até pequenas fontes (venda de roupa, Pix de amigo): impactam o saldo real',
            'Use notas para registrar o período da fatura ou o cliente pagador',
          ]},
        ],
      },
    ],
  },

  // ─── RESUMO ─────────────────────────────────────────────────────────────────
  {
    slug: 'resumo',
    title: 'Resumo',
    iconName: 'BarChart2',
    description: 'Analise gastos por semana com gráficos, breakdown por categoria e histórico comparativo.',
    category: 'analise',
    sections: [
      {
        id: 'visao-geral',
        title: 'Visão geral',
        blocks: [
          { type: 'p', text: 'A página de Resumo é a ferramenta analítica do 7Dias. Enquanto o Dashboard mostra o presente, o Resumo mostra padrões ao longo do tempo: como você gastou em cada semana, onde vai o seu dinheiro e como está a evolução.' },
        ],
      },
      {
        id: 'navegacao',
        title: 'Navegando por semanas',
        blocks: [
          { type: 'p', text: 'O Resumo tem o mesmo seletor de semana do Dashboard: setas ← → para navegar e um botão "Atual" para voltar à semana corrente.' },
          { type: 'callout', variant: 'tip', text: 'No histórico (seção abaixo), cada linha tem uma seta → que leva diretamente para o Resumo daquela semana. Use para comparar detalhes de semanas específicas.' },
        ],
      },
      {
        id: 'card-total',
        title: 'Card de total da semana',
        blocks: [
          { type: 'p', text: 'O card principal mostra o total gasto na semana com três informações de contexto:' },
          { type: 'list', items: [
            'Limite: seu orçamento semanal configurado',
            'Disponível (verde) ou Acima do limite (vermelho): diferença entre limite e gasto real',
            'Comparativo com semana anterior: seta verde ▼ se gastou menos, seta vermelha ▲ se gastou mais, com o percentual de variação',
          ]},
        ],
      },
      {
        id: 'grafico-area',
        title: 'Gráfico de área',
        blocks: [
          { type: 'p', text: 'O gráfico de área mostra a evolução dos gastos dia a dia ao longo da semana. O eixo X são os 7 dias (seg a dom), o eixo Y são os valores.' },
          { type: 'p', text: 'A área preenchida ajuda a identificar visualmente em que dias os gastos foram mais concentrados e se o ritmo foi uniforme ou errático.' },
        ],
      },
      {
        id: 'breakdown-categoria',
        title: 'Breakdown por categoria',
        blocks: [
          { type: 'p', text: 'A seção de breakdown mostra como o gasto total da semana se distribuiu entre as categorias, em dois formatos:' },
          { type: 'list', items: [
            'Mini donut (círculo): visão proporcional — qual fatia cada categoria representa',
            'Barras horizontais: lista com ícone, nome, valor e percentual de cada categoria, ordenadas do maior para o menor',
          ]},
          { type: 'callout', variant: 'tip', text: 'Compare o breakdown de diferentes semanas para identificar categorias "problemáticas": aquelas que frequentemente consomem uma parcela desproporcional do orçamento.' },
        ],
      },
      {
        id: 'lista-despesas',
        title: 'Lista de despesas da semana',
        blocks: [
          { type: 'p', text: 'Abaixo dos gráficos, todas as despesas da semana são listadas em ordem cronológica (mais recente primeiro). Cada item mostra:' },
          { type: 'list', items: [
            'Ícone colorido da categoria',
            'Descrição da despesa',
            'Categoria e data',
            'Valor (efetivo, descontando divisões)',
          ]},
        ],
      },
      {
        id: 'historico-semanal',
        title: 'Histórico semanal',
        blocks: [
          { type: 'p', text: 'A seção de histórico exibe as últimas semanas com um resumo rápido de cada uma:' },
          { type: 'table', headers: ['Coluna', 'O que mostra'], rows: [
            ['Período', 'Datas de início e fim da semana (ex: "1 jan – 7 jan")'],
            ['Total', 'Valor total gasto na semana'],
            ['Barra', 'Progresso visual em relação ao orçamento (verde / laranja / vermelho)'],
            ['% do orçamento', 'Percentual do limite semanal utilizado'],
            ['Despesas', 'Quantidade de despesas registradas'],
            ['→', 'Botão para ir direto ao Resumo daquela semana'],
          ]},
          { type: 'p', text: 'Por padrão, as últimas 6 semanas são exibidas. Clique em "Ver mais" para expandir todo o histórico.' },
        ],
      },
      {
        id: 'como-usar-habitos',
        title: 'Como usar o Resumo para revisar hábitos',
        blocks: [
          { type: 'list', items: [
            'Reserve 10 minutos todo domingo para revisar o Resumo da semana que passou',
            'Identifique a categoria que mais pesou e pergunte-se: "Era necessário?" ou "Posso otimizar?"',
            'Compare 3 a 4 semanas seguidas para distinguir exceção de padrão',
            'Se uma semana ficou muito acima do limite, analise o dia causador no gráfico de área',
            'Use o comparativo (▼▲%) para se motivar: semana melhor que a anterior é progresso',
          ]},
        ],
      },
    ],
  },

  // ─── CATEGORIAS ─────────────────────────────────────────────────────────────
  {
    slug: 'categorias',
    title: 'Categorias',
    iconName: 'Tag',
    description: 'Crie e organize categorias para classificar seus gastos de forma significativa.',
    category: 'analise',
    sections: [
      {
        id: 'o-que-sao',
        title: 'O que são categorias',
        blocks: [
          { type: 'p', text: 'Categorias são a forma de classificar seus gastos. Elas aparecem nos gráficos, filtros e no orçamento por categoria. Uma boa estrutura de categorias torna os relatórios muito mais úteis.' },
          { type: 'callout', variant: 'info', text: 'O 7Dias tem categorias de despesa (usadas em gastos) e categorias de receita (usadas em fontes de renda). São independentes e gerenciadas na mesma página de Categorias, mas em abas separadas.' },
        ],
      },
      {
        id: 'categorias-padrao',
        title: 'Categorias padrão',
        blocks: [
          { type: 'p', text: 'Ao criar sua conta, o 7Dias cria automaticamente as seguintes categorias de despesa:' },
          { type: 'table', headers: ['Categoria', 'Uso típico'], rows: [
            ['Alimentação', 'Mercado, restaurantes, delivery, cafés'],
            ['Transporte', 'Gasolina, Uber, ônibus, estacionamento'],
            ['Saúde', 'Farmácia, consultas, academia, plano de saúde'],
            ['Diversão', 'Cinema, shows, bares, jogos, viagens'],
            ['Compras', 'Roupas, eletrônicos, móveis, presentes'],
            ['Educação', 'Cursos, livros, assinaturas educacionais'],
            ['Contas', 'Aluguel, luz, internet, água, telefone'],
            ['Outros', 'Gastos que não se enquadram nas demais'],
          ]},
          { type: 'callout', variant: 'warning', text: 'Categorias padrão têm a tag "Padrão" e podem ser editadas (nome, ícone, cor), mas ao excluir uma delas um aviso é exibido, pois as despesas vinculadas continuam existindo sem categoria correspondente.' },
        ],
      },
      {
        id: 'criando-categoria',
        title: 'Criando uma categoria',
        blocks: [
          { type: 'steps', items: [
            { title: 'Acesse Categorias', desc: 'Clique em "Categorias" no menu.' },
            { title: 'Clique em "Nova"', desc: 'O formulário abre como bottom sheet (celular) ou inline (computador).' },
            { title: 'Digite o nome', desc: 'Escolha um nome claro e específico (ex: "Pets" é melhor que "Outros gastos").' },
            { title: 'Escolha o ícone', desc: 'Selecione entre os 27 ícones disponíveis. Clique para selecionar.' },
            { title: 'Escolha a cor', desc: 'Selecione entre as 8 cores disponíveis. A cor aparece no gráfico de pizza e na lista.' },
            { title: 'Salve', desc: 'Clique em "Salvar". A categoria fica disponível imediatamente no formulário de despesas.' },
          ]},
          { type: 'callout', variant: 'tip', text: 'Você também pode criar categorias diretamente no formulário de nova despesa, clicando em "Nova categoria" ao lado da seleção de categorias. Útil quando você está lançando e percebe que falta uma.' },
        ],
      },
      {
        id: 'icones-disponiveis',
        title: 'Ícones disponíveis',
        blocks: [
          { type: 'p', text: 'Os 27 ícones disponíveis cobrem os principais tipos de gasto:' },
          { type: 'list', items: [
            'Alimentação e bebidas: Garfo e faca (Utensils), Café (Coffee), Carrinho (ShoppingCart)',
            'Transporte: Carro (Car), Bicicleta (Bike), Combustível (Fuel), Avião (Plane)',
            'Saúde e bem-estar: Coração (Heart), Haltere (Dumbbell), Atividade (Activity), Pílula (Pill)',
            'Casa e utilitários: Casa (Home), Raio (Zap), Wifi (Wifi)',
            'Lazer e entretenimento: Televisão (Tv), Música (Music), Controle (Gamepad2)',
            'Compras e presentes: Sacola (ShoppingBag), Presente (Gift), Tesoura (Scissors)',
            'Trabalho e educação: Pasta (Briefcase), Livro (BookOpen), Documento (FileText)',
            'Outros: Celular (Smartphone), Pata (PawPrint), Bebê (Baby), Mais (MoreHorizontal)',
          ]},
        ],
      },
      {
        id: 'editando-excluindo',
        title: 'Editando e excluindo',
        blocks: [
          { type: 'p', text: 'Clique no ícone de lápis ao lado de uma categoria para editar nome, ícone ou cor. As despesas vinculadas são atualizadas automaticamente.' },
          { type: 'p', text: 'Clique na lixeira para excluir. Um modal de confirmação é exibido. Após a exclusão:' },
          { type: 'list', items: [
            'A categoria é removida da lista',
            'As despesas vinculadas continuam existindo, mas aparecem sem categoria',
            'Não é possível desfazer a exclusão',
          ]},
          { type: 'callout', variant: 'tip', text: 'Em vez de excluir, considere renomear. Se "Outros" ficou genérico demais, renomeie para "Pets" e reclassifique as despesas antigas.' },
        ],
      },
      {
        id: 'boas-praticas-categorias',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Comece com as categorias padrão e crie personalizadas apenas quando sentir falta de uma específica',
            'Não crie categorias demais — 8 a 12 costuma ser o ideal para gráficos legíveis',
            'Use categorias que reflitam áreas de vida, não fornecedores (ex: "Alimentação", não "iFood" e "Mercado")',
            'Seja consistente: "Farmácia" sempre em Saúde, "Corrida" sempre em Transporte',
            'Revise as categorias após 1 mês de uso e consolide as que têm poucos gastos',
          ]},
        ],
      },
    ],
  },

  // ─── ESTABELECIMENTOS ───────────────────────────────────────────────────────
  {
    slug: 'estabelecimentos',
    title: 'Estabelecimentos',
    iconName: 'Store',
    description: 'Cadastre locais frequentes para lançar despesas mais rápido com categoria automática.',
    category: 'analise',
    sections: [
      {
        id: 'o-que-sao',
        title: 'O que são estabelecimentos',
        blocks: [
          { type: 'p', text: 'Estabelecimentos são os locais onde você realiza seus gastos: supermercado, academia, restaurante, posto de gasolina. Ao cadastrá-los e vinculá-los a uma categoria, o formulário de despesas preenche a categoria automaticamente quando você seleciona o local.' },
          { type: 'callout', variant: 'tip', text: 'Se você vai ao mesmo mercado toda semana, cadastrar "Mercado Dia" com categoria "Alimentação" economiza um clique a cada lançamento. Pequeno, mas ao longo de centenas de despesas faz diferença.' },
        ],
      },
      {
        id: 'criando-local',
        title: 'Criando um local',
        blocks: [
          { type: 'steps', items: [
            { title: 'Acesse Estabelecimentos', desc: 'Clique em "Locais" no menu.' },
            { title: 'Clique em "Novo"', desc: 'O formulário aparece.' },
            { title: 'Digite o nome', desc: 'Use um nome que você reconhecerá facilmente (ex: "Mercado Extra", "Academia BioRitmo", "Posto Shell Av. Paulista").' },
            { title: 'Selecione a categoria', desc: 'Escolha a categoria padrão desse local. Ao selecionar o estabelecimento numa despesa, essa categoria é preenchida automaticamente.' },
            { title: 'Salve', desc: 'O estabelecimento está pronto para uso.' },
          ]},
          { type: 'callout', variant: 'tip', text: 'Você também pode criar estabelecimentos diretamente no formulário de nova despesa, clicando em "Novo local". Assim não precisa sair do fluxo de lançamento.' },
        ],
      },
      {
        id: 'usando-no-formulario',
        title: 'Usando no formulário de despesa',
        blocks: [
          { type: 'p', text: 'No formulário de nova despesa, o campo "Estabelecimento" tem autocomplete: comece a digitar o nome e as sugestões aparecem.' },
          { type: 'p', text: 'Ao clicar no estabelecimento sugerido, dois campos são preenchidos automaticamente:' },
          { type: 'list', items: [
            'Categoria: definida no cadastro do estabelecimento',
            'Campo de estabelecimento: preenchido com o local selecionado',
          ]},
          { type: 'callout', variant: 'info', text: 'A categoria preenchida automaticamente pode ser alterada. O preenchimento automático é apenas uma sugestão.' },
        ],
      },
      {
        id: 'editando-excluindo',
        title: 'Editando e excluindo',
        blocks: [
          { type: 'p', text: 'Na lista de estabelecimentos, cada item tem botões de editar (lápis) e excluir (lixeira).' },
          { type: 'p', text: 'Ao excluir um estabelecimento:' },
          { type: 'list', items: [
            'O local é removido da lista de autocomplete',
            'Despesas que já usavam esse estabelecimento continuam existindo normalmente',
            'O campo "Estabelecimento" nessas despesas ficará sem vínculo, mas os dados não são perdidos',
          ]},
        ],
      },
      {
        id: 'boas-praticas-locais',
        title: 'Boas práticas',
        blocks: [
          { type: 'list', items: [
            'Cadastre apenas os locais que você frequenta com regularidade (ao menos 1x por mês)',
            'Seja específico no nome: "Mercado Extra Consolação" em vez de apenas "Mercado"',
            'Para aplicativos de delivery (iFood, Rappi), um único registro "iFood" com categoria Alimentação é suficiente',
            'Revise os estabelecimentos a cada 3 meses e exclua os que não usa mais',
            'Para farmácias e postos, especifique a rede: "Droga Raia", "Posto BR" — mais fácil de identificar',
          ]},
        ],
      },
    ],
  },

  // ─── WHATSAPP ───────────────────────────────────────────────────────────────
  {
    slug: 'whatsapp',
    title: 'Integração WhatsApp',
    iconName: 'Smartphone',
    description: 'Registre despesas e consulte seu financeiro enviando mensagens de texto simples.',
    category: 'integracoes',
    sections: [
      {
        id: 'o-que-e',
        title: 'O que é a integração',
        blocks: [
          { type: 'p', text: 'A integração com WhatsApp permite registrar despesas e consultar seu financeiro sem precisar abrir o app. Basta enviar uma mensagem de texto natural para o número do 7Dias.' },
          { type: 'p', text: 'O sistema usa inteligência artificial para interpretar a mensagem, extrair o valor, a categoria provável e a data, e registrar automaticamente na plataforma.' },
          { type: 'callout', variant: 'info', title: 'Requisito', text: 'Você precisa ter um número de WhatsApp cadastrado nas Integrações e a plataforma precisa ter o webhook configurado. Se não receber resposta, verifique a configuração em Integrações.' },
        ],
      },
      {
        id: 'configurando',
        title: 'Configurando o número',
        blocks: [
          { type: 'steps', items: [
            { title: 'Acesse Integrações', desc: 'Clique em "Integrações" no menu.' },
            { title: 'Localize o card WhatsApp', desc: 'O card mostra o status atual (Configurado / Pendente).' },
            { title: 'Informe seu número', desc: 'Digite no formato internacional sem espaços ou símbolos: 5511999999999 (55 = Brasil, 11 = DDD, número com 9 dígitos).' },
            { title: 'Clique em Salvar', desc: 'O número é validado e salvo. O status muda para "Configurado".' },
            { title: 'Envie uma mensagem de teste', desc: 'Mande "ajuda" para o número do 7Dias e você deve receber a lista de comandos disponíveis.' },
          ]},
          { type: 'callout', variant: 'warning', text: 'Insira o número exatamente no formato 5511999999999. Não use +, parênteses, hífens ou espaços. Certifique-se de incluir o 9 após o DDD para celulares.' },
        ],
      },
      {
        id: 'registrando-mensagem',
        title: 'Registrando despesas por mensagem',
        blocks: [
          { type: 'p', text: 'Basta escrever o gasto em linguagem natural. A IA identifica o valor, o local/descrição e o meio de pagamento:' },
          { type: 'table', headers: ['Mensagem enviada', 'Interpretação'], rows: [
            ['"gastei 47 reais no mercado"', 'R$ 47,00 · Alimentação · hoje'],
            ['"paguei a academia 90 no cartão"', 'R$ 90,00 · Saúde · hoje · Cartão'],
            ['"uber 18,50 pix"', 'R$ 18,50 · Transporte · hoje · Pix'],
            ['"almoço 35 reais sexta-feira"', 'R$ 35,00 · Alimentação · sexta passada'],
            ['"farmácia 28"', 'R$ 28,00 · Saúde · hoje'],
          ]},
          { type: 'callout', variant: 'info', text: 'Após o registro, o bot responde confirmando: "✅ R$ 47,00 · Alimentação · 26/05 lançado com sucesso!" Se algo estiver errado, você pode corrigir abrindo o app.' },
        ],
      },
      {
        id: 'comandos-consulta',
        title: 'Comandos de consulta',
        blocks: [
          { type: 'p', text: 'Além de registrar despesas, você pode consultar informações enviando palavras-chave:' },
          { type: 'table', headers: ['Comando', 'Resposta'], rows: [
            ['semana', 'Saldo da semana atual: total gasto, disponível e % do orçamento'],
            ['mês', 'Balanço do mês corrente: receitas, despesas e saldo'],
            ['a receber', 'Lista de divisões pendentes no mês — valores que outras pessoas devem a você'],
            ['resumo', 'Visão compacta: semana + mês em uma mensagem só'],
            ['ajuda', 'Lista completa de comandos disponíveis'],
          ]},
          { type: 'callout', variant: 'tip', text: 'Os comandos são insensíveis a maiúsculas e aceitam variações: "semana", "Semana", "SEMANA" — todos funcionam.' },
        ],
      },
      {
        id: 'dicas-linguagem',
        title: 'Dicas de linguagem natural',
        blocks: [
          { type: 'p', text: 'A IA foi treinada para entender variações comuns do português brasileiro. Algumas dicas para melhores resultados:' },
          { type: 'list', items: [
            'Sempre inclua o valor: "gastei no mercado" sem valor não funciona',
            'Use palavras-chave de local/categoria: "mercado", "farmácia", "academia", "gasolina", "uber", "ifood" ajudam na classificação',
            'Meios de pagamento reconhecidos: "cartão", "crédito", "pix", "dinheiro", "ted"',
            'Para datas relativas: "ontem", "segunda", "sexta" funcionam bem',
            'Valores com vírgula ou ponto: 47,50 e 47.50 são ambos aceitos',
          ]},
          { type: 'callout', variant: 'info', text: 'A categoria é inferida pelo contexto da mensagem. Se a IA classificar errado, abra o app e edite a despesa. Com o tempo, você aprende quais palavras geram as melhores interpretações.' },
        ],
      },
      {
        id: 'problemas',
        title: 'Solução de problemas',
        blocks: [
          { type: 'table', headers: ['Problema', 'Solução'], rows: [
            ['Não recebo resposta', 'Verifique se o número foi salvo corretamente em Integrações'],
            ['Número errado cadastrado', 'Vá em Integrações, edite o campo e salve novamente'],
            ['Despesa criada com valor errado', 'Edite no app em Despesas → selecione a despesa → Editar'],
            ['Categoria incorreta', 'Edite a despesa no app e corrija a categoria manualmente'],
            ['Mensagem não foi processada', 'Aguarde alguns segundos e reenvie. Se persistir, use o app diretamente'],
          ]},
        ],
      },
    ],
  },
]
