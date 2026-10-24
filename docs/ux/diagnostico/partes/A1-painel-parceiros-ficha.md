# A1. Avaliação de design: Painel, Parceiros e Ficha do parceiro

Avaliação A (revisão de design) da crítica Impeccable. Só diagnóstico: nada foi alterado em `src/` nem em `supabase/`. O detector não foi executado e nenhuma saída da avaliação B foi lida.

**Como foi feito**

* Método: `impeccable/reference/critique.md`, parte "Assessment A" com o guia de heurísticas, carga cognitiva, personas e gravidade (P0 = crítico, P1 = alto, P2 = médio, P3 = baixo).
* Regras de referência: skills `wise-design-system` (com `tokens.md`) e `wise-dashboards` (com `mapa-de-telas.md` e `graficos.md`), que prevalecem sobre gosto genérico; `web-design-guidelines` da Vercel (o `command.md` foi baixado com WebFetch, mas veio resumido pela ferramenta, sem o texto integral; apliquei as regras do resumo e o que conheço da lista original).
* Contexto: `PRODUCT.md` e `DESIGN.md` (a tabela "Diferenças a corrigir" é citada como "DESIGN #n").
* Evidência: capturas de `docs/ux/capturas/antes/` em 375, 768 e 1440 px com o seed de demonstração (usuário Guilherme Faccin, administrador). Capturas novas feitas para esta avaliação, com o mesmo script: `painel-lista-*`, `ficha-elite-nivel-*`, `ficha-elite-onboarding-*`, `ficha-elite-linha-do-tempo-*`, `ficha-elite-indicacoes-*`.
* Código lido: `src/pages/app/Painel.tsx`, `src/components/painel/*`, `src/components/gestao/Indicadores.tsx` e `FasePrograma.tsx`, `src/pages/app/Parceiros.tsx`, `src/components/parceiros/*` e `ficha/*` (cabeçalho, linha do tempo e abas citadas), `src/pages/app/FichaParceiro.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/comum/{Cabecalho,Estados,Selos}.tsx`.

Posições em pixels referem-se à captura de página inteira na largura indicada.

---

## 1. Painel (`/app`, abas "Por etapa da jornada" e "Lista completa")

### Pergunta da tela

**"O programa está andando para a meta e o que preciso fazer hoje?"** (mapa-de-telas, Painel)

**Responde?** Só em parte, e com esforço.

* "Andando para a meta": os números existem, mas o leitor precisa montar a resposta sozinho. A aba padrão é uma grade de 32 cartões do mesmo tamanho. O número principal ("Clientes fechados no ICP (número principal)", 2 contra meta 6) é o 20º cartão, em y≈1.810 px a 1440 e y≈3.540 px a 375. "13 de 100 assinados" é o primeiro cartão de Captação, com o mesmo peso de "Nota média do scorecard".
* "O que preciso fazer hoje": **não aparece na aba padrão**. A camada de ação (aprovações, follow-ups vencidos, parceiros esfriando, negociações paradas, contrapartidas atrasadas) só existe na aba "Lista completa", espalhada em 6 cartões separados, com desenho de cartão de número.

### Especificidade de design

**Genérica.** A aba "Por etapa da jornada" é o padrão que a `wise-dashboards` §1 descreve como o problema a resolver: "uma grade de cards iguais, cada um com um número e uma lista. O olho não sabe por onde começar". Tirando os rótulos (Captação, Onboarding, NPS), a composição serve para qualquer SaaS. O que é próprio do produto (fase do programa com critérios para passar a Tração, etapas da jornada do Método Octo) está no conteúdo, não no desenho. A marca aparece só na cor (fundo quase preto e menta), e ainda assim espalhada demais.

### Heurísticas de Nielsen

| # | Heurística | Nota | Justificativa |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | 2 | Período mostrado ("17/10/2026 a 24/10/2026") e período de comparação explicado. Carregando é só texto e spinner, e cada número não diz se é do período ou acumulado |
| 2 | Correspondência com o mundo real | 2 | Termos do método sem explicação ("Régua em dia", "Faixa Base/Destaque/Potencial", "Tração"). Níveis por letra ("A (Elite)") |
| 3 | Controle e liberdade | 3 | Abas, período e "Abrir a lista completa" quando falta permissão. Mudança de fase pede confirmação |
| 4 | Consistência e padrões | 2 | As duas abas parecem dois produtos (v1 com blocos e barras, v2 com cartões). O mesmo indicador aparece com valores diferentes (fase "Parceiros ativados 9 de 5" contra cartão "Parceiros ativados 1") |
| 5 | Prevenção de erros | 3 | Pouca ação destrutiva. "Mudar para Tração" usa `confirm()` nativo |
| 6 | Reconhecer em vez de lembrar | 2 | A meta fica "em Configurações, Indicadores e metas". Para comparar etapas é preciso guardar números de 32 cartões na cabeça |
| 7 | Flexibilidade e eficiência | 2 | "Pauta da semana" e links para listas filtradas ajudam. Período e subaba fora da URL, sem atalho Ctrl/Cmd+K |
| 8 | Estética e minimalismo | 1 | 32 cartões iguais, todos com estrela de "Destaque" e borda menta. Nove repetem o valor atual em "Período anterior" |
| 9 | Reconhecer, diagnosticar e recuperar erros | 1 | `ErroCarga` mostra `erro.message` cru, sem "tentar de novo" |
| 10 | Ajuda e documentação | 2 | Notas úteis no lugar ("A sugestão é do portal; a decisão é do administrador", "Atraso gera alerta, nunca suspensão"). Os indicadores não têm definição |
| | **Total** | **20/40** | Aceitável (no limite inferior) |

### Carga cognitiva

Falhas no checklist: **6 de 8** (carga alta).

* Foco único: falha. Fase do programa, 6 subabas e 32 cartões disputam a atenção.
* Agrupamento em blocos de até 4: falha. São 6 ou 7 cartões por etapa.
* Proximidade: ok. As etapas estão agrupadas sob títulos.
* Hierarquia visual: falha. Não há um elemento principal.
* Uma coisa por vez: ok.
* Escolhas mínimas: falha. São 2 abas, mais 6 subabas, mais 4 períodos, mais "Ver todos" em cada seção: 13 controles antes do primeiro número.
* Memória de trabalho: falha. Para saber se "Meta: 6" é do trimestre, é preciso lembrar de Configurações. Para saber o que fazer hoje, é preciso trocar de aba.
* Revelação progressiva: falha. "Destaques" mostra os 32 indicadores, porque todos estão marcados como destaque.

**Jornada emocional:** começa com o cartão "Fase do programa" e os critérios (bom pico: "Critérios para Tração"). Depois vem um vale longo e plano de cartões iguais, sem um "fechamento" da semana. O final da página é "Participação dos parceiros na receita nova da Wise: Sem dados" (efeito final fraco).

### Problemas

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| Sem hierarquia: a aba padrão é uma grade de 32 cartões iguais em 3 colunas (6 + 6 + 7 + 7 + 6), todos com estrela "Destaque" e borda menta. O número principal, "Clientes fechados no ICP (número principal)", é o 20º cartão, com o mesmo `text-2xl` dos outros, em y≈1.810 px (1440) e y≈3.540 px (375) | crítico | wise-dashboards §1 e §3 camada 1 (um `HeroMetric`); wise-design-system §5 (`HeroMetric`); DESIGN #12 | painel-1440.jpg, painel-375.jpg | Montar as 5 camadas. No topo, `HeroMetric` de clientes fechados no ICP (Baloo 2 48, 6 colunas, com meta, período anterior e área do período). Ao lado, 4 `KpiTile` (assinados contra meta, ativados, indicações qualificadas, SLA). As etapas da jornada ficam abaixo, como explicação |
| "O que preciso fazer hoje" fica fora da aba padrão. A camada de ação só existe em "Lista completa", partida em 6 cartões (Aprovações pendentes 2, Follow-ups 0, Esfriando 5, Negociações paradas 0, Contrapartidas atrasadas 71, Contratos 0), com número grande colorido e lista truncada em 6 itens ("e mais 65") | alto | wise-dashboards §3 camada 4 ("lista de pendências não é indicador"); mapa-de-telas Painel, Ação ("lista única ... ordenada por urgência, com filtro por tipo") | painel-lista-1440.jpg | Lista única de trabalho do dia logo abaixo dos KPIs, na mesma tela. Cada linha com tipo (ícone e rótulo), parceiro, atraso em dias e ação ("Aprovar", "Registrar contato"), ordenada por urgência, com filtro por tipo e link "Ver todas em Pendências" |
| Nenhum gráfico. "Conversão indicação, reunião, proposta e venda" é uma lista chave e valor em ordem invertida (Vendas 0, Reuniões 1, Propostas 0, Indicações 5), sem taxa entre etapas. "Parceiros assinados contra meta" é uma barra fina de 6 px sem projeção | alto | wise-dashboards §3 camada 3 e §4; graficos.md (funil em barras horizontais decrescentes com taxa; bullet com projeção para assinados) | painel-1440.jpg (seções Captação e Produção) | `ChartCard` com funil de barras horizontais e taxas entre etapas, com clique para a lista filtrada. Bullet de assinados com marca da meta e projeção tracejada. Área de indicações por semana com período anterior |
| A cor e a seta da comparação ignoram o sentido do indicador: alta sempre em menta, queda sempre em âmbar (`Indicadores.tsx:77-80`). "Saída de parceiros 1, ↗ Período anterior: 0" aparece com seta menta, ou seja, uma piora pintada como sinal bom. O texto mostra só o valor anterior, sem o delta | alto | wise-design-system §2 (cor semântica só com significado) e §5 (`KpiTile`: delta com seta e cor semântica) | painel-1440.jpg (Relacionamento, "Saída de parceiros") | Campo `melhor: "maior" ou "menor"` no catálogo do indicador. Delta em número e percentual ("+1, pior que o período anterior") com cor pelo efeito, e neutro quando não muda |
| Escopos misturados sem rótulo. O cartão Fase diz "Parceiros ativados · 9 de 5" e "Clientes fechados no ICP via parceiros · 10 de 3" (acumulado), enquanto os cartões dizem "Parceiros ativados 1" e "Clientes fechados 2" (7 dias). "Meta: 6" não diz o período. O padrão é 7 dias, as metas são trimestrais e o seletor do painel (`OPCOES_CURTAS`) não oferece "Este trimestre" | médio | wise-dashboards §3 ("todo número tem contexto"); Nielsen #2 e #4 | painel-1440.jpg (cartão Fase e Onboarding) | Rotular cada número com o escopo ("no período", "desde o início", "meta do trimestre"). Incluir trimestre no seletor. Na barra de meta, mostrar o realizado do trimestre, e não o da semana |
| A comparação não informa nada em boa parte dos cartões: 9 repetem o valor atual ("38,9%, Período anterior: 38,9%") porque comparam estoque acumulado com janela de 7 dias; 5 mostram só "Sem dados" | médio | wise-dashboards §3; Nielsen #8; wise-design-system §6 (estado parcial sinalizado) | painel-1440.jpg | Para indicadores de estoque, comparar com o início do período. Ocultar a linha quando não houver mudança. "Sem dados" com motivo e ação ("Cadastre o ciclo de venda direta em Configurações") |
| Período e subaba vivem só no estado do componente (`useState` em `Painel.tsx:26` e `PainelJornada.tsx:37`). Recarregar ou compartilhar volta para "Últimos 7 dias, Destaques" | médio | wise-dashboards §5 ("período e filtros vivem na URL"); web-design-guidelines: reflect UI state in URL | painel-1440.jpg | `?de=&ate=&etapa=` na URL, como já é feito com `?aba=lista` |
| Menta usado como decoração: borda `menta-500/25` e estrela menta nos 32 cartões, 11 barras menta no "Funil por etapa" da lista, links "Ver todos" em menta e dois botões menta na mesma tela ("Registrar contato" e "Pauta da semana") | médio | wise-design-system §2 (menta é sinal; mais de 10% da área é excesso) | painel-1440.jpg, painel-lista-1440.jpg | Menta só no herói, na série principal e no número que bateu a meta. Barras de contexto em `--chart-muted`. Uma ação primária por tela |
| Celular: o primeiro número aparece em y≈985 px (antes dele: cabeçalho, período, abas, cartão Fase de ~300 px, nota de comparação e 6 subabas em 3 linhas). A página tem 5.449 px | médio | wise-dashboards §3 (celular com herói e KPIs primeiro); cognitive load #7 | painel-375.jpg | No celular: herói e 4 KPIs no topo, Fase recolhida numa linha ("Experimentação, 2 de 3 critérios para Tração"), subabas com rolagem horizontal |
| O botão flutuante de 56 px cobre os valores alinhados à direita durante a rolagem (no "Funil por etapa", cobre os totais de "Reunião realizada" e "Qualificação") | baixo | web-design-guidelines: sticky/fixed UI must not cover content | painel-lista-375.jpg | Valores à esquerda da barra no celular, ou botão menor ancorado numa barra inferior com área reservada |
| "Distribuição por nível" mostra "A (Elite)", "B (Premium)", "C (Select)". A ficha usa "A · Elite" e o selo usa "Elite" | baixo | wise-design-system §2 (nível pelo nome); Nielsen #4 | painel-1440.jpg (Relacionamento) | Nome do nível com a cor de nível do gráfico (`tokens.md`, Níveis), em barra horizontal |
| O subtítulo descreve a tela ("Indicadores por etapa da jornada do parceiro para a reunião semanal do Wise Partners") em vez de trazer a pergunta | baixo | wise-dashboards §2 | painel-1440.jpg | `PageHeader` com a pergunta como subtítulo e o período como contexto |
| "Pauta da semana" usa o ícone Sparkles, que sugere IA (a pauta é montada a partir dos dados, sem IA), e ocupa o lugar da ação primária do cabeçalho | baixo | wise-design-system §1 (nada de enfeite); Nielsen #2 | painel-1440.jpg | Ícone de documento ou calendário e variante secundária. A primária da tela é a lista do dia |

### Pontos fortes

1. Todo indicador da v2 já traz comparação com o período anterior e meta quando existe, e o período de comparação vem escrito por extenso. A base de "número com contexto" está pronta; falta hierarquia.
2. O cartão "Fase do programa" é específico do produto e útil: critérios para a próxima fase com ícone e texto além da cor ("9 de 5", "3 de 5"), e a decisão fica com o administrador.
3. Na "Lista completa", quase tudo leva a algum lugar: etapa do funil abre `/app/parceiros?etapa=`, categoria abre a lista filtrada, os totais de indicações abrem o período. O aprofundamento da `wise-dashboards` §5 já existe.

### Personas

* **Gerente de Parcerias no celular, entre reuniões:** abre o painel para saber o que fazer e encontra o cartão Fase e 6 subabas. Para ver os follow-ups vencidos, precisa trocar para "Lista completa" e rolar até y≈1.000 px. O botão "+" para registrar contato está no polegar (bom), mas cobre números durante a rolagem.
* **Diretor na reunião semanal:** não consegue dizer em 5 segundos se a semana foi boa. O número que define isso está no 20º cartão, sem tendência. As 2 aprovações que só ele pode dar não aparecem na aba padrão. "Parceiros ativados 1" contra "9 de 5" no cartão de cima gera a pergunta "qual dos dois?" na reunião.
* **Consultor procurando parceiro para um cliente:** o painel não é a tela dele, e nada aponta o caminho. Não há busca nem paleta Ctrl/Cmd+K para pular direto para um parceiro ou uma categoria.

---

## 2. Parceiros (`/app/parceiros?vista=categorias`, `funil`, `lista`)

### Pergunta da tela

**"Como está a carteira e onde cada parceiro está?"** (mapa-de-telas, Parceiros)

**Responde?** A segunda metade sim, a primeira não. "Onde cada parceiro está" é respondido pelo funil (coluna) e pela lista (coluna Etapa). "Como está a carteira" não tem resposta: nenhuma das três vistas traz a camada de apoio do mapa (total por etapa, assinados, ativados, categorias com menos de 3 opções). O aviso de cobertura aparece em 21 de 22 cartões comerciais e, por isso, deixa de ser lido.

### Especificidade de design

**Mista.** A visão por categoria é própria do produto: "categoria de prateleira" com a regra das 3 opções e a estrela de categoria principal vêm do método e da página de RFP. O quadro do funil e a lista com filtros são genéricos (kanban e tabela de CRM qualquer), sem tempo por etapa, taxa de passagem ou próximo passo em destaque.

### Heurísticas de Nielsen

| # | Heurística | Nota | Justificativa |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | 3 | Contagem por coluna, "40 de 40 parceiros", aviso de sucesso ao trocar de etapa, vista na URL |
| 2 | Correspondência com o mundo real | 3 | Linguagem da equipe (prateleira, nutrição, retomada). Pacote com letras A, B e C confunde com nível |
| 3 | Controle e liberdade | 3 | "Limpar filtros", troca de vista e voltar funcionam. Troca de etapa sem desfazer |
| 4 | Consistência e padrões | 2 | Pacote "A · Base Ativa" ao lado do nível "Elite". Subtítulo de categorias nas 3 vistas. Linha da tabela não clicável, cartão do celular clicável |
| 5 | Prevenção de erros | 2 | Um seletor de etapa em cada um dos 40 cartões do funil grava ao escolher |
| 6 | Reconhecer em vez de lembrar | 3 | Filtros visíveis com rótulos. Etapa escondida na visão por categoria no celular |
| 7 | Flexibilidade e eficiência | 2 | Busca por nome, CNPJ ou contato (boa). Sem ordenação, exportação, filtros salvos nem filtros na URL |
| 8 | Estética e minimalismo | 2 | 21 pílulas âmbar iguais, 21 cartões institucionais vazios, 40 seletores no funil |
| 9 | Reconhecer, diagnosticar e recuperar erros | 1 | Erro de carga mostra a mensagem crua, sem "tentar de novo". O bloqueio do scorecard é bem explicado (exceção boa) |
| 10 | Ajuda e documentação | 2 | Subtítulo explica a estrela. A regra das 3 opções é dita só no painel |
| | **Total** | **23/40** | Aceitável |

### Carga cognitiva

Falhas no checklist: **4 de 8** (carga alta).

* Agrupamento: falha. São 22 cartões comerciais mais 24 institucionais numa rolagem só.
* Hierarquia visual: falha. Não há resumo, e o âmbar está em quase todos os cartões.
* Escolhas mínimas: falha. A lista mostra busca, 8 seletores e o "Campo da categoria" ao mesmo tempo: 10 decisões antes do primeiro resultado.
* Revelação progressiva: falha. Todos os filtros ficam abertos; no celular ocupam ~1.000 px.

Passam: foco único por vista, proximidade, uma coisa por vez e memória de trabalho.

**Jornada emocional:** a visão por categoria abre com ERP cheio (7 parceiros, 4 assinados), e logo em seguida vem uma parede de avisos âmbar. A sensação é "tudo está errado", sem indicar por onde começar. O funil termina em "Perdas", o que é honesto, mas não traz nenhum fechamento positivo (assinados, ativados).

### Problemas

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| Sem camada de apoio: nenhuma vista mostra total por etapa, assinados, ativados nem quantas categorias estão abaixo de 3 opções. O usuário conta à mão nos cartões | alto | mapa-de-telas, Parceiros (Apoio); wise-dashboards §3 camada 2 | parceiros-categorias-1440.jpg | Faixa de 4 `KpiTile` acima das abas, comum às 3 vistas: "Assinados 13 de 100", "Ativados", "Em negociação", "Categorias com menos de 3: 21 de 22", cada uma com link para a vista filtrada |
| A pílula âmbar "Menos de 3 assinados" aparece em 21 dos 22 cartões comerciais. Uma categoria com 0 assinados e outra com 2 têm o mesmo desenho, e a ordem é alfabética, não por cobertura | alto | graficos.md ("Categorias com menos de 3 opções: barra de cobertura por categoria, 0 a 3+"); wise-design-system §2 (cor com significado); cognitive load #5 | parceiros-categorias-1440.jpg | Barra de cobertura de 3 segmentos em cada cartão (cheio = assinado) e ordenação por cobertura (0 primeiro). O aviso âmbar fica só no resumo |
| O funil não mostra tempo médio por etapa nem taxa de passagem. Com 10 colunas em 2 linhas de 5 a 1440, a leitura vira um Z ("Reunião realizada" volta para "Qualificação" à esquerda). As colunas têm alturas muito diferentes ("Parceria ativa" com 9 cartões, ~900 px). A 375 são 10 seções empilhadas, com 7.495 px | alto | mapa-de-telas, Parceiros ("quadro do funil com contagem e tempo médio por etapa"); wise-dashboards §3 | parceiros-funil-1440.jpg, parceiros-funil-375.jpg | Cabeçalho de coluna com contagem e dias médios na etapa. No desktop, colunas de largura fixa (~260 px) numa faixa com rolagem horizontal, na ordem do funil. No celular, etapas recolhíveis com contagem, abrindo só a escolhida |
| Um seletor de etapa em cada cartão do funil (40 seletores na tela, um por parceiro). Ele repete a etapa da própria coluna e grava ao escolher, sem desfazer (`SeletorEtapa.tsx:51-65`; só perda e nutrição pedem dados) | médio | Nielsen #5; web-design-guidelines: confirm or undo for destructive actions; cognitive load #5 | parceiros-funil-1440.jpg | Menu "Mover para..." no cartão (ou arrastar, com alternativa de teclado) e aviso com "Desfazer" por alguns segundos |
| Lista: busca, 8 seletores e "Campo da categoria" sempre abertos. No celular são ~1.000 px antes do primeiro parceiro. Os filtros ficam em `useState` (`ListaParceiros.tsx:54`), e não há filtros salvos | médio | mapa-de-telas, Parceiros ("lista com filtros salvos"); wise-dashboards §5; web-design-guidelines: URL state; cognitive load (até 4 opções por decisão) | parceiros-lista-375.jpg, parceiros-lista-1440.jpg | `FilterBar` com busca e 3 filtros principais (etapa, nível, responsável), "Mais filtros" numa gaveta, chips dos filtros ativos, estado na URL e filtros salvos ("Meus parceiros esfriando") |
| Os seletores de filtro não têm nome acessível: o `Campo` usa `Label` sem `htmlFor`, e o `SelectTrigger` anuncia só "Todos". A busca não tem rótulo, só placeholder (`ListaParceiros.tsx:116-133`) | médio | web-design-guidelines: form controls need a label; PRODUCT, Accessibility (uso completo por teclado e leitor) | parceiros-lista-1440.jpg | `id` no trigger com `htmlFor` no rótulo (ou `aria-label` com o nome do filtro) e `aria-label="Buscar parceiros"` |
| A tabela não tem ordenação, exportação nem linha clicável (só o nome é link). As linhas têm ~75 px porque "Guilherme Faccin" e "Reunião agendada" quebram em 2 linhas e o cabeçalho "Último contato" quebra. A categoria é cortada ("Consultoria de imple...") e o subtítulo repete o nome ("Comercial · Algoritmo Certo Ciê...") | médio | wise-design-system §4 (linha de 40 px) e §5 (`DataTable`: ordenação, exportação, linha clicável) | parceiros-lista-1440.jpg | `DataTable` com colunas ordenáveis (último contato, etapa, nível), larguras mínimas sem quebra, linha inteira clicável, exportar CSV e subtítulo só com a razão social quando for diferente |
| O pacote usa as letras dos níveis: "A · Base Ativa", "B · Formação", "C · Prateleira". Fomento Já mostra "Elite" sobre "A · Base Ativa" e Pinhão Software mostra "Premium" com "C · Prateleira". O filtro de nível diz "Elite / Institucional A" | médio | wise-design-system §2 (nível pelo nome); Nielsen #2 e #4 | parceiros-lista-1440.jpg | Pacote só pelo nome ("Base Ativa"), em selo de desenho diferente do selo de nível. Filtro "Elite", "Premium", "Select" |
| A pílula "Ativo" em menta aparece em 33 dos 40 cartões e linhas, e o status "Dormente" usa vermelho de perigo para o que é um alerta | médio | wise-design-system §2 (menta é sinal; perigo só com significado) | parceiros-funil-1440.jpg, parceiros-lista-1440.jpg | "Ativo" em tom neutro (é o normal). Morno em alerta e dormente em alerta forte com ícone. O menta fica para o que pede ação ou bateu a meta |
| As 24 categorias institucionais, 21 com "0 parceiros · 0 assinados", ocupam cerca de 35% da página (de y≈1.960 a 3.100 de 3.206 px) | médio | wise-dashboards §2 (bloco que não responde à pergunta sai ou vai para aba); wise-design-system §6 | parceiros-categorias-1440.jpg | Mostrar só categorias com parceiros e resumir as vazias numa linha ("Sem parceiros ainda: Sistema S, IEL e institutos, mais 19"), com opção de expandir |
| Selos Premium e Select com texto branco, datas da tabela em "13/09/2026" (a regra é "13 set 2026" em tabela) e números sem `tabular-nums` | baixo | wise-design-system §3 e §8; tokens.md (Níveis); DESIGN #8 e #10 | parceiros-lista-1440.jpg | Texto `#c7d6ff` e `#d9f99d` nos selos, `formato.ts` com data curta para tabelas e `tabular-nums` na coluna |
| O subtítulo é o mesmo nas 3 vistas e fala só da visão por categoria ("A estrela marca a categoria principal de cada parceiro"), mesmo no funil e na lista | baixo | wise-dashboards §2 | parceiros-funil-1440.jpg | Pergunta da tela como subtítulo. A legenda da estrela vai para dentro da visão por categoria |
| A estrela de categoria secundária usa `text-white/15` (~1,3:1 sobre o card). Os nomes de parceiro nos cartões de categoria são links de ~20 px de altura no celular | baixo | wise-design-system §2 (3:1 para elementos gráficos); web-design-guidelines (alvos de toque) | parceiros-categorias-375.jpg | Estrela vazada em `text-tertiary` ou rótulo "secundária". Linha inteira clicável com 44 px no celular |

### Pontos fortes

1. A vista ativa fica na URL (`?vista=`), e os links do painel (`?etapa=`, `?categoria=`) abrem a lista já filtrada. O aprofundamento funciona.
2. A visão por categoria é desenho próprio do produto: categoria principal com estrela, selo de nível pelo nome e a regra das 3 opções visível onde o consultor monta a RFP.
3. A lista vira cartões completos no celular (nome, categoria, cidade, nível, pacote, etapa, status, responsável, último contato), e "40 de 40 parceiros" com "Limpar filtros" dá retorno imediato da filtragem.

### Personas

* **Gerente de Parcerias no celular:** para achar um parceiro, a busca da lista está no topo (bom), mas os 8 filtros empurram o resultado para ~1.000 px. No funil, ver quem está em "Parceria ativa" exige rolar ~5.000 px. O seletor de etapa largo em cada cartão fica no caminho do polegar durante a rolagem, com risco de mudar a etapa sem querer.
* **Diretor na reunião semanal:** quer saber quantos assinados, quantos ativados e onde a carteira trava. Nenhuma vista responde sem contar cartões. O funil não diz onde o parceiro fica parado (sem tempo por etapa).
* **Consultor procurando parceiro para um cliente:** a visão por categoria é o caminho certo, mas no celular a etapa do parceiro fica escondida (`hidden sm:inline` em `VisaoCategorias.tsx`). Ele vê "Sistemas Araucária, Elite" e "Rede Varejo Tech, Select" sem saber que o segundo está em "Sem interesse", e pode indicar ao cliente um parceiro que não está assinado. Também não há atalho da categoria para "montar RFP com estes".

---

## 3. Ficha do parceiro Elite assinado (`/app/parceiros/d0000000-0000-4000-a000-000000001001`, Sistemas Araucária)

Abas conferidas: Visão geral, Nível e revisões, Onboarding, Linha do tempo e Indicações.

### Pergunta da tela

**"O que preciso saber e fazer com este parceiro agora?"** (mapa-de-telas, Ficha do parceiro)

**Responde?** Não. O cabeçalho mostra nome, nível, pacote, status, etapa, responsável e último contato ("há 7 horas"), mas:

* não há próximo passo (este parceiro não tem um ativo, e o cabeçalho não diz isso nem oferece criar);
* os problemas reais estão escondidos em abas: régua de atendimento **atrasada há mais de 4 meses** (última reunião 15/05/2026, próxima até 14/06/2026) só na aba Nível; marcos de 30 e 60 dias "Atrasado" só na aba Onboarding; Elite com "Não cumpre" nos três grupos sem dizer a consequência;
* a "Visão geral" é um formulário de cadastro, não um resumo.

### Especificidade de design

**Mista, com o melhor e o pior lado a lado.** A aba Nível (três colunas Select, Premium e Elite com Resultado, Capacitação e Regras e o "Falta:" de cada um) e a aba Onboarding (plano de 90 dias com encontros e marcos) são desenho do Método Octo e não serviriam a outro produto sem mudança. O cabeçalho e a Visão geral são ficha de CRM genérica: campos em grade e formulários abertos.

### Heurísticas de Nielsen

| # | Heurística | Nota | Justificativa |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | 2 | Status "Ativo" em menta e "há 7 horas" no cabeçalho, com a régua atrasada há 4 meses escondida na aba Nível |
| 2 | Correspondência com o mundo real | 2 | Linha do tempo em linguagem de banco ("scorecards: registro criado (A)", "Categoria: registro criado (true)"). "cliente(s) fechado(s) ... (hoje: 2 e 0)" |
| 3 | Controle e liberdade | 3 | "← Parceiros", aba na URL (`?aba=`), diálogos com "Fechar" |
| 4 | Consistência e padrões | 2 | O nível aparece como "Elite", "A · Elite" e "Elite (sugerido)", ao lado do pacote "A · Base Ativa". "Registrar contato" está duas vezes na tela |
| 5 | Prevenção de erros | 2 | Seletor de etapa no cabeçalho grava ao escolher. "Desligamento" é uma aba ao lado de "Documentos" |
| 6 | Reconhecer em vez de lembrar | 2 | São 16 abas, e é preciso abrir Nível e Onboarding para descobrir o que está atrasado |
| 7 | Flexibilidade e eficiência | 3 | "Contexto do parceiro", PDF, registro de contato já com o parceiro, abertura direta por `?aba=` |
| 8 | Estética e minimalismo | 2 | Visão geral com 5 formulários. Linha do tempo de 9.433 px |
| 9 | Reconhecer, diagnosticar e recuperar erros | 1 | `ErroCarga` crua. Parceiro inexistente tem mensagem humana (exceção boa) |
| 10 | Ajuda e documentação | 2 | Descrições úteis nos cartões ("O nível mede potencial ... nunca muda por inatividade"), que contradizem a aba Nível sem explicar |
| | **Total** | **21/40** | Aceitável |

### Carga cognitiva

Falhas no checklist: **5 de 8** (carga alta).

* Hierarquia visual: falha. Na Visão geral, o primeiro bloco é "Dados da empresa" com "Site: Não informado".
* Escolhas mínimas: falha. São 16 abas, mais 4 ações no cabeçalho, mais o seletor de etapa.
* Memória de trabalho: falha. O atraso da régua visto na aba Nível precisa ser lembrado ao voltar para registrar contato.
* Revelação progressiva: falha. Formulários internos (Anotações, Instrumento) ficam abertos na Visão geral.
* Mudança de contexto (violação #8): falha. Para decidir a próxima ação é preciso passar por Nível, Onboarding, Contrapartidas e Linha do tempo.

Passam: foco único dentro de cada aba, agrupamento por cartões e proximidade.

**Jornada emocional:** o cabeçalho tranquiliza ("Ativo", "Parceria ativa", "há 7 horas"), e a aba Nível contradiz ("Não cumpre" em Premium e Elite, "Atrasada"). É um momento de risco (um parceiro Elite em queda) sem nenhuma orientação sobre o que fazer.

### Problemas

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| A "Visão geral" é um formulário de cadastro: Dados da empresa, Classificação com campos editáveis, Status com "Pausar até" e "Motivo da inatividade", Interno com 2 caixas de texto vazias, Instrumento do parceiro com 6 campos e "Salvar instrumento". Não mostra indicações, clientes fechados, progresso de nível, marcos de onboarding nem maturidade | alto | mapa-de-telas, Ficha (Resumo: indicações e clientes fechados com minigráfico, `Stepper` de nível, marcos, radar pequeno); wise-dashboards §2 e §3 | ficha-elite-1440.jpg | Visão geral só de leitura com 4 blocos: Resultado (9 indicações, 2 fechadas, minigráfico), Nível (`Stepper` dos 3 grupos com "Falta"), Onboarding (marcos), Régua (próxima reunião). Os formulários vão para uma aba "Dados e cadastro" |
| Os problemas do parceiro ficam escondidos em abas: régua "Atrasada" (última reunião 15/05/2026, próxima até 14/06/2026) só na aba Nível; marcos de 30 e 60 dias "Atrasado" só em Onboarding; contrapartidas atrasadas só em Contrapartidas. O cabeçalho mostra "Ativo" em menta | alto | mapa-de-telas, Ficha (cabeçalho com status de atividade e próximo passo); Nielsen #1; cognitive load #8 | ficha-elite-nivel-1440.jpg, ficha-elite-onboarding-1440.jpg, ficha-elite-1440.jpg | Faixa de alertas sob o cabeçalho ("Régua atrasada há 132 dias", "2 marcos atrasados", "Abaixo dos requisitos de Elite"), cada um com link para a aba e ação ("Agendar reunião") |
| Sem próximo passo: o parceiro não tem passo ativo, e o cabeçalho não mostra nada. "Novo próximo passo" só existe na coluna lateral da aba Linha do tempo | alto | mapa-de-telas, Ficha ("próximo passo e ação rápida de registro"); PRODUCT, princípio 4 | ficha-elite-1440.jpg, ficha-elite-linha-do-tempo-1440.jpg | Linha fixa no cabeçalho: "Próximo passo: nenhum. Definir" (ou o passo com data e responsável), sempre visível |
| 16 abas em 2 linhas a 1440 e em 7 linhas (~256 px) a 375. "Desligamento" fica entre as abas comuns, com o mesmo peso de "Documentos" | médio | mapa-de-telas, Ficha (9 abas); cognitive load (até 5 opções); Nielsen #5 | ficha-elite-375.jpg, ficha-elite-1440.jpg | 6 abas principais (Visão geral, Linha do tempo, Indicações, Nível, Onboarding, Contrato) mais "Mais". No celular, rolagem horizontal ou seletor. Desligamento vira ação no menu do cabeçalho, com confirmação |
| Linha do tempo de 9.433 px (1440) e 12.795 px (375), sem filtro por tipo. Eventos de auditoria em linguagem de banco ("scorecards: registro criado (A)", "Categoria: registro criado (true)", "Pacote de vazio para A · Base Ativa") vêm antes dos contatos registrados, que são o que importa e ficam no fim | médio | Nielsen #2 e #8; wise-design-system §8 (voz) | ficha-elite-linha-do-tempo-1440.jpg | Filtro "Contatos, Indicações, Mudanças" (padrão: contatos e indicações), auditoria agrupada por dia numa linha recolhida e rótulos humanos ("Scorecard preenchido: nível A") |
| Cabeçalho com 4 ações de peso parecido mais o seletor de etapa. "Registrar contato" aparece em menta duas vezes (barra lateral e cabeçalho), e "Salvar instrumento" é um terceiro botão menta. A etapa aparece duplicada (pílula "Parceria ativa" e seletor "Parceria ativa"). O cabeçalho não é fixo | médio | wise-design-system §2 (menta é sinal); mapa-de-telas, Ficha (cabeçalho fixo); cognitive load (1 primária e 1 ou 2 secundárias) | ficha-elite-1440.jpg | Cabeçalho fixo e compacto ao rolar. "Registrar contato" como única primária. "Contexto" e "PDF" num menu "Exportar". A etapa como seletor com aparência de selo, uma vez só |
| O nível aparece de quatro formas na mesma tela: selo "Elite", "A · Elite" (aba Nível), "Elite (sugerido)" no seletor e pacote "A · Base Ativa". A aba Nível mostra o Elite com "Não cumpre" em Premium e Elite sem dizer o que acontece, enquanto o cartão Classificação diz que o nível "nunca muda por inatividade" | médio | Nielsen #2 e #4; wise-design-system §2 | ficha-elite-nivel-1440.jpg, ficha-elite-1440.jpg | Uma forma só ("Elite"). Na aba Nível, uma frase de consequência ("Mantém Elite até a revisão de janeiro; para manter, faltam 4 indicações qualificadas e 2 certificações") |
| Requisitos em linguagem de sistema: "Falta: 6 indicações qualificadas ou 2 cliente(s) fechado(s) no ICP em 180 dias (hoje: 2 e 0)" | baixo | wise-design-system §8 (voz) | ficha-elite-nivel-1440.jpg | "Faltam 4 indicações qualificadas ou 2 clientes fechados no ICP (últimos 180 dias)" |
| Aba Indicações: "R$ 0,00" com o mesmo peso e cor de "R$ 7.800,00". "Receita gerada por empresa" em pílula menta | baixo | wise-design-system §6 (zero em tom secundário) e §2 | ficha-elite-indicacoes-1440.jpg | Zero em `text-secondary`. Receita por empresa como `BarList` curta |
| Visão geral a 1440: a coluna esquerda termina em y≈950 e deixa ~460 px vazios ao lado de "Atividades com este parceiro". A lista de atividades repete "90 dias: 0 (0 min) · total: 1 (5 min)" em texto miúdo | baixo | wise-design-system §4 (densidade); cognitive load #5 | ficha-elite-1440.jpg | Tabela compacta de 3 colunas (tipo, 90 dias, total) ou só os tipos com movimento nos 90 dias |

### Pontos fortes

1. A aba Nível é o melhor desenho do conjunto: os três níveis lado a lado com Resultado, Capacitação e Regras, ícone e texto além da cor ("Cumpre", "Não cumpre") e um "Falta:" explícito por requisito.
2. A aba Onboarding conta a história dos 90 dias com encontros e marcos em ordem, estado com ícone e texto ("Cumprido", "Atrasado"), datas e link para "a indicação que ativou o parceiro".
3. Ações de trabalho de verdade no cabeçalho: "Registrar contato" já com o parceiro, "Contexto do parceiro" (texto pronto para colar) e PDF. A aba fica na URL (`?aba=nivel`), e no celular a tabela de indicações vira cartões.

### Personas

* **Gerente de Parcerias no celular:** "Registrar contato" está logo abaixo do nome (bom). Para lembrar o que combinou, precisa abrir a Linha do tempo e rolar ~12.000 px passando por auditoria. Não vê no topo que a régua está atrasada há 4 meses; as 16 abas ocupam 256 px antes de qualquer conteúdo.
* **Diretor na reunião semanal:** pergunta "esse Elite está entregando?". A Visão geral não responde (é cadastro). Na aba Nível ele vê "Não cumpre" nos três grupos, mas não sabe se isso derruba o nível, nem quando. Na aba Indicações há números (9 indicações, 22% fechadas), sem tendência.
* **Consultor procurando parceiro para um cliente:** quer saber em 10 segundos o que o parceiro faz e se está apto para a RFP. A "Ficha de apresentação" é a 4ª aba; a Visão geral abre em CNPJ e endereço. "Contexto do parceiro" ajuda, mas fica com o mesmo peso de "Exportar PDF".

---

## 4. Problemas transversais (layout e componentes comuns às três telas)

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| A barra lateral tem 20 itens soltos, sem grupos. A 1440x900 a lista é cortada em "Maturidade", e Cruzamento, Importação, Configurações e Usuários ficam só na rolagem interna. A paleta Ctrl/Cmd+K não existe (`ui/command.tsx` existe, sem nenhum uso) | médio | mapa-de-telas, Navegação (grupos Hoje, Parceiros, Ida ao mercado, Resultado, Configurar); wise-dashboards §5 (paleta de comandos); cognitive load (até 5 itens no topo) | painel-1440.jpg, parceiros-lista-1440.jpg | Agrupar pela rotina, como no mapa, com grupos recolhíveis. Paleta de comandos com busca de parceiros e ações |
| Estados: "Carregando..." com spinner em vez de esqueleto do formato. `ErroCarga` mostra `erro.message` cru, sem "tentar de novo". Não há estado parcial nem sem permissão padronizados (`Estados.tsx`) | médio | wise-design-system §6; DESIGN #15; Nielsen #9 | (código) `src/components/comum/Estados.tsx` | `Skeleton` por formato (cartão, tabela, ficha) e erro com mensagem humana, detalhe técnico recolhido e botão "Tentar de novo" (`refetch`) |
| O botão flutuante usa brilho menta (`shadow-[0_0_24px_rgba(0,225,147,0.35)]`). Os botões são pílula completa | baixo | wise-design-system §1 (sem sombra pesada) e §4 (raio de 10 px em botões); DESIGN #4 e #9 | painel-375.jpg | Sem brilho, `--radius-control` nos botões e círculo só no botão flutuante |
| Detalhes de acessibilidade e tipografia: `Barra` sem `role="progressbar"` e `aria-valuenow` (a meta não é lida por leitor de tela); nenhum `tabular-nums`; `color-scheme: dark` ausente no `:root` (controles nativos, como o campo de data "Pausar até", aparecem com ícone escuro quase invisível); sem link "Pular para o conteúdo"; `transition-all` nas abas; contador do sino em 11 px | baixo | web-design-guidelines (semantic HTML and ARIA, tabular numbers, color-scheme on root, skip link, never transition all); wise-design-system §3; DESIGN #10 e #11 | ficha-elite-1440.jpg (campo de data), painel-1440.jpg | `role="progressbar"` com valores na `Barra`, `tabular-nums` nos KPIs e tabelas, `color-scheme: dark` no `:root`, link de pular, `transition-colors` nas abas e contador em 12 px |

---

## 5. Contagem por gravidade

| Tela | Crítico | Alto | Médio | Baixo | Total |
|---|---|---|---|---|---|
| Painel | 1 | 3 | 5 | 4 | 13 |
| Parceiros | 0 | 3 | 7 | 3 | 13 |
| Ficha do parceiro | 0 | 3 | 4 | 3 | 10 |
| Transversal | 0 | 0 | 2 | 2 | 4 |
| **Total** | **1** | **9** | **18** | **12** | **40** |

Notas de Nielsen: Painel 20/40, Parceiros 23/40, Ficha 21/40 (as três "Aceitável", no terço inferior da faixa).

## 6. Perguntas para provocar

* Se o Diretor só pudesse ver um número na reunião de segunda, qual seria, e por que ele não é o maior elemento do painel?
* A aba "Lista completa" é a v1 mantida por segurança ou é o painel que a equipe usa de verdade? Se é a segunda, a aba padrão está errada.
* "Menos de 3 assinados" em 21 de 22 categorias é um alarme ou é o estado normal da fase de Experimentação? Se é normal, o desenho deveria mostrar progresso, não erro.
* Na ficha, o que a equipe faz primeiro ao abrir um parceiro: editar cadastro ou decidir a próxima conversa? A Visão geral hoje responde à primeira.

## 7. Meus 5 principais problemas

1. **Painel sem hierarquia (crítico).** São 32 cartões iguais, todos marcados como destaque. O número principal, clientes fechados no ICP, é o 20º cartão (y≈1.810 px a 1440). Falta o `HeroMetric` e falta a ordem das 5 camadas (wise-dashboards §1 e §3). Captura: painel-1440.jpg.
2. **"O que preciso fazer hoje" fora da tela principal (alto).** A camada de ação só existe na aba "Lista completa", partida em 6 cartões de número ("Contrapartidas atrasadas 71", "e mais 65"), em vez de uma lista única ordenada por urgência (mapa-de-telas, Painel). Captura: painel-lista-1440.jpg.
3. **A ficha não diz o que fazer com o parceiro agora (alto).** A Visão geral é um formulário de cadastro. Não há próximo passo, e a régua atrasada há 132 dias, os marcos atrasados e o "Não cumpre" do Elite ficam escondidos nas abas Nível e Onboarding, enquanto o cabeçalho mostra "Ativo" em menta. Capturas: ficha-elite-1440.jpg, ficha-elite-nivel-1440.jpg.
4. **Nenhum gráfico nas três telas (alto).** O funil do painel é uma lista chave e valor invertida, sem taxa. O quadro do funil não tem tempo por etapa. A cobertura das categorias não tem barra. Os comparativos têm seta menta até para piora ("Saída de parceiros 1 ↗"). Regras: wise-dashboards §4, graficos.md e wise-design-system §2. Capturas: painel-1440.jpg, parceiros-funil-1440.jpg.
5. **Parceiros sem resumo da carteira, com alerta que virou ruído (alto).** Nenhuma vista traz assinados, ativados e total por etapa. "Menos de 3 assinados" aparece em 21 de 22 categorias, sem barra de cobertura nem ordem por gravidade, e 21 cartões institucionais vazios ocupam cerca de 35% da página. Captura: parceiros-categorias-1440.jpg.
