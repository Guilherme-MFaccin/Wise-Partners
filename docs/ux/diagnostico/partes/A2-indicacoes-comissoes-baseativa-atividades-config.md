# Avaliação A (revisão de design): Indicações, Comissões, Base Ativa, Atividades e Configurações

Parte A2 da crítica Impeccable do Portal Wise Partners, branch `ux-fundacao`. Só diagnóstico: nada em `src/` ou `supabase/` foi alterado.

## Como foi feito

* Método: `critique.md`, seção "Assessment A: Design Review", com o guia de pontuação de Nielsen, a avaliação de carga cognitiva, as personas e a escala de gravidade P0 a P3 (P0 crítico, P1 alto, P2 médio, P3 baixo). O detector `impeccable detect` não foi rodado e nenhuma saída da Avaliação B foi lida.
* Regras de referência: skill `wise-design-system` (com `tokens.md`) e skill `wise-dashboards` (com `mapa-de-telas.md` e `graficos.md`), que prevalecem sobre gosto genérico. Divergências já catalogadas na tabela "Diferenças a corrigir" do `DESIGN.md` são citadas pelo número (ex.: "DESIGN #10") e não repetidas.
* Web Interface Guidelines da Vercel: a busca de `command.md` funcionou, mas a ferramenta devolveu um resumo das regras por seção (acessibilidade, foco, formulários, conteúdo, navegação e estado, tema escuro, locale, texto), não o texto literal. As regras foram aplicadas a partir desse resumo e do conhecimento das diretrizes.
* Capturas: as de `docs/ux/capturas/antes/<tela>-<largura>.jpg` (375, 768 e 1440 px, dados de demonstração) e capturas extras feitas para esta parte, com prefixo `a2-`:
  * `a2-base-ativa-em-ciclo-375.jpg` e `-1440.jpg`, `a2-base-ativa-concluidos-1440.jpg` (abas que a rota sozinha não abre);
  * `a2-indicacoes-detalhe-375.jpg` e `-1440.jpg` (painel lateral do detalhe);
  * `a2-comissoes-todas-375.jpg` (aba Todas), `a2-comissoes-consultor-375.jpg` e `a2-configuracoes-consultor-375.jpg` (sem permissão, como consultora);
  * `a2-indicacoes-consultor-1440.jpg`, `a2-configuracoes-parametros-1440.jpg`, `a2-atividades-lista-1440.jpg`.
* Medições feitas no navegador: a tabela de Indicações tem 1.304 px de conteúdo em 1.150 px visíveis a 1440 px; a aba Todas de Comissões tem 70.751 px de altura a 375 px; Indicações tem 8.564 px a 1440 px e 18.715 px a 375 px.

**Base Ativa não está quebrada.** A captura curta (900 px) é a aba padrão "Fila", que tem um único parceiro (Fomento Já). O ciclo em andamento (Mantiqueira, 2 de 6 encontros) e o concluído (Sistemas Araucária, com evento final e certificado) existem e aparecem nas abas "Em ciclo" e "Concluídos" (`a2-base-ativa-em-ciclo-1440.jpg`, `a2-base-ativa-concluidos-1440.jpg`). O problema é de desenho: a tela abre escondendo o que mais importa (ver Base Ativa, problema 1).

**Problemas comuns às cinco telas** (citados aqui uma vez e referidos nas tabelas como "comum"):

* C1. Nenhuma tela usa o kit (`PageHeader`, `KpiTile`, `HeroMetric`, `ChartCard`, `DataTable`, `FilterBar`, `EmptyState`): DESIGN #14.
* C2. Estados genéricos: "Carregando..." em texto (sem esqueleto e com três pontos em vez de reticências), erro que mostra a mensagem técnica do banco sem "tentar de novo", vazio sem ação. DESIGN #15, `wise-design-system` §6, `web-design-guidelines` (texto de carregamento, mensagens de erro acionáveis). Arquivo: `src/components/comum/Estados.tsx`.
* C3. Sem `tabular-nums` em valores e tabelas (DESIGN #10); raios, bordas e superfícies soltos (DESIGN #1 a #3); `text-red-300` e `sky` soltos (DESIGN #6).
* C4. Rótulos de campo não associados aos controles: os componentes locais `Filtro` e `Campo` e os diálogos usam `<Label>` sem `htmlFor` ao lado do controle, e os `SelectTrigger` dos filtros não têm nome acessível; leitor de tela anuncia só "Todos" ou "Todas". `web-design-guidelines` (form controls need labels), `PRODUCT.md` Accessibility.
* C5. Sem `color-scheme: dark` em `index.html` nem no CSS: o ícone de calendário dos campos de data some no fundo escuro (`base-ativa-1440.jpg`, `indicacoes-1440.jpg`). `web-design-guidelines` (Dark Mode & Theming). Observação: o formato `mm/dd/yyyy` nas capturas vem do idioma do Chromium de captura; num navegador em português aparece `dd/mm/aaaa`.
* C6. No celular, o botão flutuante global "Registrar contato" (56 px, com brilho menta em sombra) cobre conteúdo e controles das telas (filtro Período em `indicacoes-375.jpg`, colunas do cartão em `comissoes-375.jpg`, selects em `a2-base-ativa-em-ciclo-375.jpg`) e não há respiro inferior para ele. `wise-design-system` §2 e Regra Plana (sombra decorativa), `web-design-guidelines` (safe areas e layout).
* C7. Filtros e abas fora da URL (parcial ou total) em quatro das cinco telas. `wise-dashboards` §5, `web-design-guidelines` (Navigation & State).
* C8. Somas, agrupamentos e regras calculados no componente (SLA, "parada", totais de comissão, horas por grupo). `wise-dashboards` §6.

---

## 1. Indicações (`/app/indicacoes`)

**Pergunta da tela** (mapa de telas): "As indicações estão virando clientes e a Wise está respondendo no prazo?"

**Responde?** Não. A tela é um bloco de 11 filtros e uma tabela de 93 linhas. Não há número principal (clientes fechados no ICP), nem taxas (qualificadas, dentro do SLA), nem funil, nem tendência. Para saber se a Wise responde no prazo é preciso marcar "SLA vencido" e contar as linhas. A pergunta não aparece no cabeçalho; a descrição diz o que a tela é ("Indicações nos dois sentidos..."), não o que responde.

**Especificidade de design:** genérica. É uma tela de CRUD que serviria a qualquer sistema com "registros e filtros". O que é próprio da Wise (SLA do Apêndice E, proteção, ICP, três empresas do grupo, sentido da indicação) aparece só como pílulas e colunas, sem composição que conte a história do funil de indicações.

| Heurística de Nielsen | Nota | Motivo |
|---|---|---|
| 1. Visibilidade do estado | 2 | Contagem de resultados e marcadores de SLA existem; carregamento em texto, nenhum resumo de situação |
| 2. Correspondência com o mundo real | 2 | "Recebida" e "Enviada" só são explicadas numa legenda no fim da tabela (depois de 93 linhas); "ICP", "SLA", "proteção expirada" sem explicação |
| 3. Controle e liberdade | 3 | "Limpar filtros", detalhe em painel lateral que fecha com Esc e mantém a lista |
| 4. Consistência e padrões | 2 | Caixas de seleção redondas parecem botões de opção; data em formato diferente do padrão de tabela; plural "indicação(ões)" |
| 5. Prevenção de erros | 2 | Formulário do detalhe é sobrescrito quando a consulta recarrega; valores em `type=number` com ponto decimal |
| 6. Reconhecer em vez de lembrar | 2 | Filtros ativos não aparecem como fichas; é preciso lembrar o que está marcado |
| 7. Flexibilidade e eficiência | 1 | Sem busca por cliente, sem ordenação, sem exportação, sem visões salvas, sem "minhas" |
| 8. Estética e minimalismo | 1 | Sem hierarquia: filtros e tabela com o mesmo peso, dezenas de pílulas vermelhas, página de 8.564 px |
| 9. Recuperação de erros | 1 | Erro de carga mostra a mensagem técnica sem ação (comum C2) |
| 10. Ajuda e documentação | 2 | Legenda de sentido e descrição existem, mas longe de onde são necessárias |
| **Total** | **18/40** | **Ruim** (reforma grande necessária) |

**Carga cognitiva:** alta (4 falhas no checklist: foco único, divisão em grupos, hierarquia visual, poucas escolhas). Ponto de decisão com 11 controles de filtro visíveis ao mesmo tempo (7 seleções e 4 caixas), o dobro do limite de 4 a 7. No celular os 11 controles ocupam a primeira tela inteira antes do primeiro resultado. Cada linha da tabela carrega até 6 marcadores possíveis (aguardando, SLA vencido com lista de prazos, parada, qualificada ou ICP, link, proteção expirada).

**Jornada emocional:** o Gerente de Parcerias abre a tela e é recebido por uma parede de filtros e uma faixa de pílulas vermelhas, sem saber se o quadro é bom ou ruim; não há momento de alívio ("está tudo em dia") nem prioridade clara ("comece por estas 3").

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| A tela não tem as camadas 1 a 3: falta o número principal (clientes fechados no ICP no período, contra período anterior e meta), os indicadores de apoio (indicações, qualificadas %, dentro do SLA %, ciclo médio, nota média) e os gráficos de explicação (funil com taxa e tempo entre etapas, indicações por semana com período anterior, por empresa do grupo) | alto | `wise-dashboards` §2 e §3 camadas 1 a 3; `mapa-de-telas.md` Indicações; `PRODUCT.md` princípios 1 e 2 | `indicacoes-1440.jpg` (1440) | Abrir com `HeroMetric` e 4 a 5 `KpiTile` alimentados por uma RPC de período, seguidos de `ChartCard` com o funil em barras horizontais (sem trapézio) e a área semanal; pergunta da tela no `PageHeader` |
| A camada de ação não existe: SLA vencido e indicações paradas aparecem espalhados como pílulas vermelhas nas linhas, sem uma lista de trabalho ordenada por urgência | alto | `wise-dashboards` §3 camada 4 ("lista de pendências fica na camada 4, ordenada por urgência, com próximo passo clicável"); Nielsen #8 | `indicacoes-1440.jpg` (1440), linhas a partir de 17/10/2026 | Bloco "Responder hoje" acima da tabela: SLA vencendo hoje ou vencido e paradas há 15 dias, ordenadas pelo prazo, com a ação ("Validar", "Registrar primeiro contato") direto na linha |
| 93 linhas despejadas de uma vez, sem paginação, ordenação de coluna, busca por nome do cliente nem exportação; a página tem 8.564 px no desktop e 18.715 px no celular | alto | `wise-design-system` §5 (`DataTable` com ordenação, filtro, paginação e exportação); `web-design-guidelines` (listas grandes virtualizadas ou paginadas); Nielsen #7 | `indicacoes-1440.jpg` (1440), `indicacoes-375.jpg` (375) | Trocar por `DataTable` (TanStack) com busca por cliente, ordenação, paginação no cliente, exportação CSV e densidade de 40 px por linha |
| No celular, 7 seletores e 4 caixas ocupam a primeira tela inteira (cerca de 960 px) antes do primeiro resultado, e o botão flutuante cobre o campo Período | alto | `wise-dashboards` §5 (`FilterBar`); carga cognitiva (parede de opções, mais de 8 itens); persona celular | `indicacoes-375.jpg` (375) | Filtros recolhidos num botão "Filtros (n)" que abre uma folha; fichas removíveis para filtros ativos; atalhos de visão no topo ("SLA vencido", "Paradas", "Minhas", "Qualificadas") |
| O formulário "Atualizar andamento" copia os dados do registro num `useEffect(() => setF(doRegistro(i)), [i])`; qualquer recarga da consulta (volta de foco na janela, invalidação por outra ação) apaga o que estava sendo digitado, sem aviso | alto | `web-design-guidelines` (avisar antes de perder alterações não salvas); Nielsen #5 | `a2-indicacoes-detalhe-1440.jpg` (1440); `src/components/indicacoes/DetalheIndicacao.tsx:172` | Reiniciar o formulário só quando o `id` muda ou depois de salvar; marcar "alterações não salvas" e pedir confirmação ao fechar o painel com mudanças |
| Rótulos dos filtros e do formulário do detalhe não estão ligados aos controles; os selects são anunciados como "Todos" ou "Todas" sem dizer de qual filtro | alto | comum C4; `web-design-guidelines` (Accessibility, Forms) | `src/pages/app/Indicacoes.tsx:303` (`Filtro`), `DetalheIndicacao.tsx` (`Campo`) | `Label htmlFor` com `id` no controle, ou `aria-labelledby` no `SelectTrigger`; o kit `FilterBar` deve resolver isso uma vez |
| A tabela corta colunas no desktop: 1.304 px de conteúdo em 1.150 px visíveis, "Valor base" aparece cortado e "Responsável" fica escondido atrás de uma rolagem horizontal sem sinal | médio | `web-design-guidelines` (Content Handling, rolagem horizontal indesejada); `wise-design-system` §4 densidade | `indicacoes-1440.jpg` (1440), cabeçalho "Valor bas" | Coluna do cliente fixa, Sentido e Origem como ícone com dica ou só filtro, escolha de colunas no `DataTable`; marcadores fora da célula do cliente para a linha manter 40 px |
| Filtro só parcialmente na URL: parceiro, período, aguardando, paradas e SLA entram; sentido, empresa, etapa, origem, ICP e qualificadas não. Ir para a ficha de um parceiro e voltar perde a seleção | médio | comum C7; `wise-dashboards` §5 | `src/pages/app/Indicacoes.tsx:39` a `58` | Todo o estado de filtro na URL (`?sentido=&empresa=&etapa=...`), lido e escrito pela `FilterBar` |
| Pílulas "SLA vencido: Validação e primeiro contato" em vermelho, quebrando em duas linhas, aparecem em dezenas de linhas; o vermelho perde o valor de sinal e vira textura | médio | `wise-design-system` §2 (cor com significado, sinal e não decoração); Nielsen #8 | `indicacoes-1440.jpg` (1440) | Uma coluna "Prazo" com ícone e texto curto ("vencido há 3 dias"), ordenável; a lista de ação (camada 4) concentra o vermelho |
| O painel de detalhe começa com 11 campos cadastrais; o que pede ação (SLA vencido, validação do ICP pendente, próximo passo) só aparece abaixo da dobra | médio | `wise-dashboards` §3 (ordem de importância); `PRODUCT.md` princípio 3 | `a2-indicacoes-detalhe-1440.jpg` (1440), `a2-indicacoes-detalhe-375.jpg` (375) | Topo do painel com etapa, prazo de SLA mais próximo e um botão do próximo passo; dados cadastrais recolhidos numa seção abaixo |
| A consultora vê as 93 indicações do grupo sem filtro "Minhas" ou "Responsável" | médio | `PRODUCT.md` Users (consultor); Nielsen #7 | `a2-indicacoes-consultor-1440.jpg` (1440) | Visão padrão "Minhas" para consultor e comercial, filtro por responsável para os demais |
| Regras de SLA e de "parada" calculadas no front com `Date.now()` (`prazosSla`, `indicacaoParada`), espelhando a função do banco | médio | comum C8; `wise-dashboards` §6 | `src/components/indicacoes/dados.ts:122` a `169` | O banco devolve `sla_vencidos` e `parada` prontos na consulta da lista |
| Caixas de seleção dos filtros rápidos desenhadas redondas, iguais a botões de opção, embora possam ser combinadas | baixo | Nielsen #4 (padrões da plataforma) | `indicacoes-1440.jpg` (1440), canto superior direito dos filtros | Caixa quadrada com raio de 4 a 6 px, ou trocar por fichas alternáveis |
| Datas na tabela como `24/10/2026` (a regra pede `24 out 2026` em tabelas); nota `0` em branco e negrito para indicação ainda não avaliada; plural "indicação(ões)" | baixo | `wise-design-system` §8 (formato de data, voz) e §6 (zero em tom secundário); comum C3 | `indicacoes-1440.jpg` (1440), coluna Nota | Usar o formato de tabela do `formato.ts`; zero em `text-tertiary`; "93 indicações" ou "1 indicação" |

**Pontos fortes**

1. Os links de outras telas chegam com filtro aplicado (`?paradas=1`, `?sla=1`, `?aguardando=1`, `?parceiro=`), e o detalhe abre por `?id=`: dá para compartilhar um link que cai direto na indicação.
2. No celular a tabela vira cartões legíveis, com cliente, etapa, parceiro e empresa, em vez de uma tabela espremida.
3. O detalhe respeita o acesso: comissões só são consultadas para quem pode vê-las, e a validação aparece só para parcerias ou o responsável.

**Alertas por persona**

* Gerente de Parcerias: não consegue responder em 5 segundos "estamos dentro do SLA?"; precisa marcar uma caixa e contar linhas. Para preparar a reunião semanal não há taxa, tendência nem exportação.
* Diretor: não tem nenhum número para ler; a tela não serve ao relatório semanal.
* Financeiro: não usa esta tela (correto), mas o "Valor base" que gera comissão fica cortado na tabela do desktop.
* Consultor: vê as 93 indicações do grupo e não acha as próprias; não há busca pelo nome do cliente que acabou de atender.
* Acessibilidade (Sam): filtros sem nome acessível e caixas de seleção com aparência de opção única.

---

## 2. Comissões (`/app/comissoes`)

**Pergunta da tela** (mapa de telas): "Quanto devemos pagar e receber, e quando?"

**Responde?** Em parte. "Quanto" está nos quatro totais do topo. "Quando" não: não há linha do tempo das comissões nos próximos 90 dias, nem previsão por semana, nem data esperada de pagamento por item. Os totais não têm período (o "Pagas" é o acumulado de sempre), então não respondem "quanto pagamos este mês".

**Especificidade de design:** genérica. Lista de cartões com rótulo e valor, que serviria a qualquer controle de contas. O que é da Wise (três empresas, regras de base de cálculo, beneficiário parceiro, responsável ou grupo, nota fiscal do parceiro) está presente nos dados, mas não organiza a tela.

| Heurística de Nielsen | Nota | Motivo |
|---|---|---|
| 1. Visibilidade do estado | 2 | Totais e selos de estado presentes; sem período nem data esperada de pagamento |
| 2. Correspondência com o mundo real | 2 | "Aguardando fechamento ou compensação" e "A receber do parceiro" (beneficiário "grupo") exigem conhecer o modelo; comissão do responsável interno misturada com a do parceiro |
| 3. Controle e liberdade | 3 | Diálogo com Cancelar; parcerias pode corrigir o estado |
| 4. Consistência e padrões | 2 | "Sem permissão" diferente de Configurações; selo âmbar para estado normal |
| 5. Prevenção de erros | 2 | Diálogo de confirmação existe, mas "Marcar como paga" não pede data nem valor pago e o financeiro não desfaz |
| 6. Reconhecer em vez de lembrar | 2 | Para fechar o pagamento de um parceiro é preciso lembrar quais cartões são dele |
| 7. Flexibilidade e eficiência | 1 | Sem agrupamento por parceiro, ação em lote, exportação ou filtro fora da aba "Todas" |
| 8. Estética e minimalismo | 2 | Cartões claros, mas altos (cerca de 230 px cada) e repetitivos |
| 9. Recuperação de erros | 1 | Comum C2 |
| 10. Ajuda e documentação | 1 | Nenhuma explicação dos estados nem do fluxo nota fiscal e pagamento |
| **Total** | **18/40** | **Ruim** |

**Carga cognitiva:** moderada (3 falhas: divisão em grupos, memória de trabalho, revelação progressiva). Cada cartão expõe até 8 pares rótulo e valor mais o bloco de nota fiscal; para pagar um parceiro o financeiro precisa reunir de cabeça vários cartões espalhados (ponte de memória). A aba "Todas" mostra 5 filtros de uma vez, aceitável.

**Jornada emocional:** é a tela de maior risco (dinheiro saindo). Hoje não há momento de segurança: nada confirma "estes são todos os pagamentos de outubro e somam R$ X", e no celular o próprio valor aparece quebrado.

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| Não responde "quando": falta a linha do tempo de comissões por estado nos próximos 90 dias (barras por semana empilhadas por estado) e a data esperada de pagamento em cada item | alto | `wise-dashboards` §3 camada 3; `mapa-de-telas.md` Comissões; `graficos.md` ("Comissões nos próximos 90 dias") | `comissoes-1440.jpg` (1440) | `ChartCard` com barras semanais empilhadas (a pagar, aguardando, a receber), título de leitura ("R$ 29 mil devem virar pagamento nas próximas 4 semanas"), clique na barra filtra a lista |
| Valores em moeda quebram no meio do número nos indicadores do topo a 375 px ("R$ 60.450,0" numa linha e "0" na seguinte), por `break-words` no `Indicador` | alto | `wise-design-system` §3 (números com `tabular-nums`) e §4 (passar em 375 px); `web-design-guidelines` (Content Handling) | `comissoes-375.jpg` (375), `a2-comissoes-todas-375.jpg` (375) | Valor com `whitespace-nowrap` e `tabular-nums`, tamanho que caiba em meia coluna ou indicadores em uma coluna no celular; abreviar ("R$ 60,5 mil") com valor completo na dica |
| A lista "A pagar" é uma pilha de cartões, um por comissão, sem agrupamento nem total por parceiro (o parceiro emite uma nota pelo total), sem exportação e sem ação em lote | alto | `wise-design-system` §5 (`DataTable` com exportação); `wise-dashboards` §3 camada 5; Nielsen #7 | `comissoes-1440.jpg` (1440) | `DataTable` agrupada por beneficiário com subtotal, dados de nota fiscal no cabeçalho do grupo, seleção múltipla para "Marcar como paga" e exportação CSV para o financeiro |
| A aba "Todas" no celular gera uma página de 70.751 px: todas as comissões em cartões, sem paginação | alto | `web-design-guidelines` (listas grandes); `wise-design-system` §4 densidade | `a2-comissoes-todas-375.jpg` (375) | Paginação ou carregamento por demanda; no celular, linha compacta (parceiro, valor, estado) que abre o detalhe |
| Totais sem período e sem comparação: "Pagas R$ 56.550,00" soma tudo desde sempre; o mapa pede "pagas no período". Os totais são somados no componente (`somar`) | médio | `wise-dashboards` §3 ("todo número tem contexto") e §6; `PRODUCT.md` princípio 2 | `comissoes-1440.jpg` (1440) | Seletor de período (mês corrente por padrão) e totais por RPC com comparação ao período anterior; "A pagar" e "A receber" continuam como saldo atual, rotulados assim |
| Filtros só existem na aba "Todas" e não vão para a URL; em "A pagar" não dá para ver só um parceiro ou só a Tríade | médio | comum C7; `wise-dashboards` §5 | `comissoes-1440.jpg` (1440) | `FilterBar` única acima das abas, com estado na URL, valendo para as três abas |
| Comissão do "Responsável pela parceria" (pagamento a pessoa da equipe) aparece misturada, com o mesmo desenho, na lista e na soma "A pagar" das comissões de parceiros | médio | Nielsen #2 e #4; `wise-dashboards` §2 (bloco que não ajuda a pergunta vai para aba ou grupo) | `comissoes-1440.jpg` (1440), primeiro cartão | Separar por beneficiário (parceiros, equipe, a receber) em grupos ou abas, cada um com seu subtotal |
| "Marcar como paga" só pede uma observação: não registra a data efetiva do pagamento nem confere o valor, e o financeiro não consegue desfazer um clique errado | médio | Nielsen #5 e #3; `web-design-guidelines` (confirmar ou permitir desfazer ação destrutiva) | `src/components/comissoes/EstadoComissaoDialog.tsx` | Diálogo de pagamento com data (padrão hoje), valor pago e referência; "Desfazer" no aviso de sucesso por alguns segundos |
| Rótulos de filtro e do diálogo ("Novo estado", "Observação") não ligados aos controles | médio | comum C4 | `src/pages/app/Comissoes.tsx:208`, `EstadoComissaoDialog.tsx:64` | Mesma correção de Indicações |
| Selo "A pagar" em âmbar (alerta) para o estado normal do fluxo; o âmbar deveria marcar só o que está atrasado (por exemplo, a pagar há mais de 30 dias) | baixo | `wise-design-system` §2 (cores semânticas só com significado) | `comissoes-1440.jpg` (1440) | Selo neutro para "A pagar" e âmbar só quando passar do prazo combinado |
| "Sem permissão" com cadeado de 16 px desalinhado e sem caminho de volta; Configurações usa outro padrão ("Acesso restrito", sem cabeçalho) | baixo | `wise-design-system` §6 (estado sem permissão); Nielsen #4 | `a2-comissoes-consultor-375.jpg` (375), `a2-configuracoes-consultor-375.jpg` (375) | Um único `EmptyState` de permissão, com cabeçalho, motivo e link "Voltar ao painel" |

**Pontos fortes**

1. O modo financeiro mostra só o que esse papel pode fazer, com verbos claros ("Nota fiscal recebida", "Marcar como paga"), e o banco valida de novo.
2. Os dados para a nota fiscal (razão social, CNPJ, cidade) estão no próprio cartão da comissão do parceiro: o financeiro não precisa abrir a ficha.
3. A aba fica na URL (`?aba=`), e o detalhe da indicação leva direto para a aba "Todas".

**Alertas por persona**

* Financeiro: não consegue montar o pagamento de um parceiro sem somar cartões de cabeça; não exporta para o banco ou planilha; no celular o valor aparece quebrado; um clique errado em "Marcar como paga" não tem volta.
* Gerente de Parcerias: não sabe quanto vai cair no mês nem cobrar o que está "Aguardando compensação" há muito tempo; não há ordenação por idade.
* Diretor: não vê o custo de comissões do período nem a tendência, que alimentam o ROI.
* Consultor: recebe "Sem permissão" sem caminho de volta (correto bloquear, mas a saída falta).

---

## 3. Base Ativa (`/app/base-ativa`)

**Pergunta da tela** (mapa de telas): "Quem está no ciclo, quem está na fila e quando cada um começa?"

**Responde?** Não de uma vez. A tela abre na aba "Fila" com um único item e parece vazia (`base-ativa-1440.jpg`, página com a altura da janela). Quem está em ciclo exige um clique; a previsão de início do primeiro da fila está vazia; não há linha do tempo horizontal dos ciclos. Para responder à pergunta são três cliques e nenhuma visão de calendário.

**Especificidade de design:** parcialmente específica no conteúdo (encontros 1 a 6, evento final, certificado metodológico, revisão em 6 meses, suspensão por duas faltas), genérica na forma: abas e cartões de formulário. O componente que a skill pede (linha do tempo horizontal própria) é exatamente o que tornaria a tela da Wise.

| Heurística de Nielsen | Nota | Motivo |
|---|---|---|
| 1. Visibilidade do estado | 1 | Encontro 3 de 17/10/2026 continua "Previsto" em 24/10/2026, sem alerta; ciclos em andamento escondidos na aba |
| 2. Correspondência com o mundo real | 2 | "Entrega do pacote A" e "Estratégicos à frente na fila" sem explicação |
| 3. Controle e liberdade | 2 | Diálogos com Cancelar; retomar ciclo só para admin; previsão salva sozinha ao sair do campo |
| 4. Consistência e padrões | 2 | Ciclo em andamento em modo de edição permanente, concluído em modo leitura; selo "Concluído" azul |
| 5. Prevenção de erros | 2 | Diálogos explicam consequências; mas nada impede marcar "Realizado" um encontro com data futura e a previsão grava sem confirmação |
| 6. Reconhecer em vez de lembrar | 1 | Próximo encontro, atrasos e datas de início não ficam visíveis; é preciso abrir cada aba |
| 7. Flexibilidade e eficiência | 1 | Sem visão de agenda, sem aba na URL, um botão salvar por encontro |
| 8. Estética e minimalismo | 2 | Cartão do concluído é limpo; o em andamento é uma parede de 18 controles |
| 9. Recuperação de erros | 1 | Comum C2 |
| 10. Ajuda e documentação | 2 | Descrição e diálogos explicam as regras do ciclo |
| **Total** | **16/40** | **Ruim** |

**Carga cognitiva:** moderada (3 falhas: hierarquia visual, memória de trabalho, revelação progressiva). O cartão em ciclo mostra 6 blocos com 3 controles cada (data, situação, observação) mais um botão de salvar por bloco: 24 elementos interativos para registrar um único encontro.

**Jornada emocional:** a primeira impressão é de tela vazia ou quebrada (o próprio time suspeitou disso). O fim é bom: o cartão do ciclo concluído, com evento, certificado e revisão agendada, é o momento mais satisfatório das cinco telas.

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| A tela não mostra os três grupos juntos: abre na aba "Fila" (1 item) e esconde ciclos em andamento e concluídos; não existe a linha do tempo horizontal dos ciclos (encontros 1 a 6 e evento) nem a previsão de início de cada parceiro da fila | alto | `mapa-de-telas.md` Base Ativa; `graficos.md` ("Base Ativa: linha do tempo horizontal"); `wise-dashboards` §2 | `base-ativa-1440.jpg` (1440), `base-ativa-375.jpg` (375), `a2-base-ativa-em-ciclo-1440.jpg` (1440) | Uma visão única: faixa "Em ciclo" com a linha do tempo de 12 semanas por parceiro (6 marcos e o evento, hoje marcado), depois "Fila" ordenada com previsão de início; suspensos e concluídos numa seção recolhida ou aba |
| Encontro vencido não é sinalizado: o Encontro 3 (17/10/2026) segue "Previsto" em cinza no dia 24/10/2026; não há alerta de atraso nem destaque do próximo encontro | alto | `wise-design-system` §2 (âmbar para alerta com significado); Nielsen #1 | `a2-base-ativa-em-ciclo-1440.jpg` (1440) | Estado "Atrasado" em âmbar quando a data passou sem registro, com a ação "Registrar resultado"; "Próximo encontro: 31 out" no cabeçalho do ciclo; o item entra na lista de pendências do painel |
| Ciclo em andamento é uma parede de formulários sempre abertos: 6 encontros com data, situação, observação e um botão de salvar só com ícone cada, desabilitado em contraste baixo | médio | Nielsen #8; carga cognitiva (uma coisa por vez); `wise-design-system` §4 densidade | `a2-base-ativa-em-ciclo-1440.jpg` (1440), `a2-base-ativa-em-ciclo-375.jpg` (375) | Linha de leitura por encontro (número, data, situação) e edição só no encontro clicado, num painel ou linha expandida com "Salvar encontro" escrito |
| A aba ativa vive em `useState`: não há link para "Em ciclo" a partir do painel ou da ficha, e recarregar volta para "Fila" | médio | comum C7; `wise-dashboards` §5 | `src/pages/app/BaseAtiva.tsx:14` | Seção ou aba na URL (`?visao=em_ciclo`) |
| A previsão de início na fila grava ao sair do campo, sem botão e sem sinal de "salvo" além do aviso passageiro; o campo vazio não diz o que acontece se ficar sem data | médio | Nielsen #1 e #5; `web-design-guidelines` (Forms) | `base-ativa-1440.jpg` (1440) | Mostrar a previsão como texto ("Previsto para 10 nov", ou "Sem previsão" em tom secundário) com ação "Definir previsão" que abre um campo com Salvar |
| Descrição com jargão interno ("Entrega do pacote A", "Estratégicos à frente na fila, depois a ordem de assinatura") no lugar da pergunta da tela | baixo | `wise-dashboards` §2 (pergunta no `PageHeader`); Nielsen #2 | `base-ativa-1440.jpg` (1440) | Pergunta como subtítulo; regras da fila numa dica "Como a fila é ordenada" |
| Posição "1º" em círculo menta grande e selo "Estratégico" menta: menta usado como decoração; selo "Concluído" em azul (informação) em vez de sucesso | baixo | `wise-design-system` §2 (menta é sinal; cores semânticas com significado) | `base-ativa-1440.jpg` (1440), `a2-base-ativa-concluidos-1440.jpg` (1440) | Posição em número neutro com `tabular-nums`; "Estratégico" em selo neutro com ícone; "Concluído" em sucesso |
| No celular as quatro abas quebram em duas linhas centralizadas, e a aba "Suspensos (0)" tem o mesmo peso das outras | baixo | `wise-design-system` §4 e §6 (zero em tom secundário) | `base-ativa-375.jpg` (375) | Seletor segmentado com rolagem horizontal ou contagens zeradas em tom terciário |

**Pontos fortes**

1. Os diálogos dizem a consequência antes do clique ("ao salvar, o ciclo é concluído, o certificado metodológico do responsável é registrado e a revisão fica agendada para 6 meses").
2. O cartão do ciclo concluído resume bem o fim do processo: evento, data de conclusão, certificado e revisão.
3. A regra de suspensão (duas faltas seguidas do parceiro) é explicada no próprio aviso, com a ação "Retomar" para quem pode.

**Alertas por persona**

* Gerente de Parcerias: ao abrir a tela não vê o encontro de 17/10 que ficou sem registro; descobre só se abrir a aba e ler cada linha. Registrar um encontro pelo celular entre reuniões exige rolar por 6 blocos de formulário com o botão flutuante por cima.
* Diretor: não tem uma visão de agenda para responder ao parceiro "quando começa o meu ciclo?".
* Financeiro: não usa a tela.
* Consultor: vê a tela pelo menu, mas sem a previsão de início (só administradores a definem) não consegue responder ao parceiro dele.

---

## 4. Atividades (`/app/atividades`)

**Pergunta da tela** (mapa de telas, "Atividades e horas"): "Onde o tempo da equipe está indo?"

**Responde?** Em parte. A visão "Por parceiro" mostra para onde foram as horas no período, ordenado do maior para o menor, e há abas por pessoa, tipo e etapa. Faltam a comparação com o período anterior, a distribuição no tempo (mapa de calor por dia) e a ligação entre as horas e o resultado. A pergunta não está no cabeçalho.

**Especificidade de design:** genérica. Indicadores de contagem e uma lista de barras, desenho que serviria a qualquer apontamento de horas. A divisão por etapa da jornada (do Método Octo) é o elemento próprio, mas fica numa aba secundária e num filtro.

| Heurística de Nielsen | Nota | Motivo |
|---|---|---|
| 1. Visibilidade do estado | 2 | Período escolhido visível; indicadores sem comparação |
| 2. Correspondência com o mundo real | 3 | Linguagem natural ("Tempo estimado", "Parceiros envolvidos"), nota honesta sobre estimativa |
| 3. Controle e liberdade | 2 | Atividade registrada com erro não pode ser editada nem excluída nesta tela |
| 4. Consistência e padrões | 2 | Lista em cartões, outras telas em tabela; seletores sem rótulo |
| 5. Prevenção de erros | 3 | Minutos preenchidos pelo tipo, validação simples antes de registrar |
| 6. Reconhecer em vez de lembrar | 3 | Visões em abas com nome claro |
| 7. Flexibilidade e eficiência | 1 | Sem URL, sem exportação, sem aprofundamento da barra para a lista |
| 8. Estética e minimalismo | 2 | Estrutura limpa, mas 20 barras menta de largura total |
| 9. Recuperação de erros | 1 | Comum C2 |
| 10. Ajuda e documentação | 2 | Nota informativa e descrição do diálogo |
| **Total** | **21/40** | **Aceitável** (melhorias significativas necessárias) |

**Carga cognitiva:** moderada (2 falhas: hierarquia visual e divisão em grupos). Há duas camadas de escolha empilhadas (período, etapa e 5 abas de visão), dentro do limite, mas os quatro indicadores têm o mesmo peso e nenhum é o principal.

**Jornada emocional:** neutra. A nota "Tempo estimado apenas informativo. Não há limite de horas nem alerta." tranquiliza quem registra; falta o fecho que diria se o tempo está indo para onde deveria.

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| Faltam as explicações pedidas: horas por etapa da jornada como gráfico principal, horas por parceiro em barra horizontal com aprofundamento e mapa de calor por dia; nada compara com o período anterior | alto | `mapa-de-telas.md` Atividades e horas; `graficos.md` ("Horas por dia", "Horas por etapa e por parceiro"); `wise-dashboards` §3 camada 3 | `atividades-1440.jpg` (1440) | `ChartCard` de horas por etapa (barra empilhada por semana) com título de leitura, `BarList` por parceiro com clique para a lista filtrada, mapa de calor de calendário em escala menta sequencial |
| Indicadores sem contexto: 25 atividades, 21 h, 20 parceiros e R$ 434,09 sem período anterior, média ou meta | médio | `wise-dashboards` §3 ("todo número tem contexto"); `PRODUCT.md` princípio 2 | `atividades-1440.jpg` (1440) | `KpiTile` com delta contra o período anterior de mesma duração e minigráfico; destacar "Tempo estimado" como número principal da tela |
| 20 barras menta a 70% de largura total, uma por parceiro: o menta cobre boa parte da área e deixa de ser sinal; a barra não leva a lugar nenhum (só o nome é link para a ficha) | médio | `wise-design-system` §2 (mais de 10% de menta é excesso); `wise-dashboards` §4 (uma série em destaque, demais neutras) e §5 (clique aprofunda) | `atividades-1440.jpg` (1440) | Barras neutras (`--chart-muted`) com destaque menta só no primeiro ou no filtrado; clique na linha abre a lista daquele parceiro no período; mostrar 10 e "ver todos" |
| Período, etapa e visão em `useState`: não dá para compartilhar "horas da captação nos últimos 90 dias" nem voltar sem perder a seleção | médio | comum C7; `wise-dashboards` §5 | `src/pages/app/Atividades.tsx:62` a `65` | Estado na URL (`?de=&ate=&etapa=&visao=`) |
| Atividade registrada não pode ser corrigida nem excluída na visão "Lista" | médio | Nielsen #3 (desfazer); `PRODUCT.md` princípio 3 | `a2-atividades-lista-1440.jpg` (1440) | Ação "Editar" e "Excluir" (com confirmação) na linha para quem registrou e para administradores |
| No celular os nomes de parceiro são cortados ("Contábi...", "Fomento...", "Manutenç...") porque a contagem, as horas e o custo disputam a mesma linha | médio | `web-design-guidelines` (Content Handling); `wise-design-system` §4 (375 px) | `atividades-375.jpg` (375) | Nome na primeira linha inteira, métricas na segunda com `tabular-nums` |
| Agrupamento, somas e custo calculados no componente | médio | comum C8; `wise-dashboards` §6 | `src/pages/app/Atividades.tsx:85` a `113` | RPC que devolve os grupos e totais do período, com comparação |
| Período e etapa em dois seletores empilhados em linhas separadas, sem rótulo visível, e a nota informativa solta à direita | baixo | `wise-dashboards` §5 (`FilterBar`); Nielsen #8 | `atividades-1440.jpg` (1440) | Uma `FilterBar` numa linha (período, etapa, pessoa) com a nota como dica do indicador de tempo |
| Título "Atividades" e descrição do que a tela é ("Esforço por parceiro, por pessoa...") em vez da pergunta; no indicador de custo, a linha de contexto é usada para "Visível só para administradores" | baixo | `wise-dashboards` §2 | `atividades-1440.jpg` (1440) | "Atividades e horas" com a pergunta como subtítulo; aviso de visibilidade num ícone de cadeado com dica |

**Pontos fortes**

1. O registro é rápido: escolher o tipo preenche os minutos, e o diálogo explica que contatos registrados já geram atividade (evita registro duplicado).
2. O custo só é pedido ao banco para administradores; para os demais nem é consultado.
3. A nota "Tempo estimado apenas informativo" é honesta e evita leitura de controle de ponto.

**Alertas por persona**

* Gerente de Parcerias: vê para onde foram as horas, mas não se isso mudou em relação ao mês anterior nem em que dias; um registro errado fica para sempre.
* Diretor: o custo das horas aparece sem relação com resultado; para isso precisa ir a Resultado do canal, e não há link.
* Financeiro: sem acesso, correto.
* Consultor: registra atividade, mas não consegue corrigir a que digitou errado.

---

## 5. Configurações (`/app/configuracoes`)

**Pergunta da tela** (proposta, não está no mapa): "As regras do programa estão certas e completas, e onde eu mudo cada uma?"

**Responde?** Não. Não há visão de conjunto das regras vigentes nem sinal do que está incompleto (o parâmetro `app_url`, usado nos links de e-mail e da página de RFP, está vazio e nada avisa). Para achar uma regra é preciso varrer 24 abas sem agrupamento nem busca.

**Especificidade de design:** genérica. Painel de administração com abas e formulários; o conteúdo é muito específico (comissões por empresa, níveis, scorecard, régua, SLA e proteção, pontos, fase do programa), mas a organização segue as tabelas do banco, não a rotina do programa.

| Heurística de Nielsen | Nota | Motivo |
|---|---|---|
| 1. Visibilidade do estado | 2 | Aviso de sucesso por cartão; nenhum sinal de cartão alterado e não salvo; parâmetro vazio sem alerta |
| 2. Correspondência com o mundo real | 1 | Chaves do banco em monoespaçado (`app_url`, `aviso_desligamento_dias`), descrição "lista de {data, titulo, local, link}", editor de JSON cru |
| 3. Controle e liberdade | 2 | Trocar de aba descarta edições sem aviso; sem desfazer |
| 4. Consistência e padrões | 2 | Exclusão com `confirm()` do navegador num lugar, sem confirmação noutro; padrão de acesso restrito diferente de Comissões |
| 5. Prevenção de erros | 1 | Edição perdida ao trocar de aba; JSON digitado à mão; remoção de meta sem confirmação |
| 6. Reconhecer em vez de lembrar | 1 | 24 abas planas, sem grupos nem busca |
| 7. Flexibilidade e eficiência | 1 | Um botão salvar por cartão, sem busca, sem atalhos |
| 8. Estética e minimalismo | 1 | Parede de abas (4 linhas no desktop, cerca de 470 px no celular) e formulários de peso igual |
| 9. Recuperação de erros | 2 | Mensagens nomeiam o problema ("JSON inválido.", "Informe um número.") sem dizer onde |
| 10. Ajuda e documentação | 2 | Aviso "Mudanças de regra valem só para registros novos" e descrições por parâmetro |
| **Total** | **15/40** | **Ruim** |

**Carga cognitiva:** alta (5 falhas: foco único, divisão em grupos, hierarquia, poucas escolhas, revelação progressiva). O ponto de decisão inicial tem 24 opções visíveis, seis vezes o limite de memória de trabalho.

**Jornada emocional:** mudar uma regra de comissão ou de nível é um momento de alto risco, e a tela não dá segurança: não mostra o valor atual em linguagem de negócio, não mostra o que muda e pode descartar a edição sem avisar.

| Problema | Gravidade | Regra violada | Captura de referência | Correção sugerida |
|---|---|---|---|---|
| 24 abas planas na mesma faixa, ocupando 4 linhas no desktop e cerca de 470 px no celular, sem agrupamento nem busca | alto | Carga cognitiva (parede de opções, mais de 8 itens); Nielsen #6 e #8; `mapa-de-telas.md` (agrupar pela rotina, não pelo nome das tabelas) | `configuracoes-1440.jpg` (1440), `configuracoes-375.jpg` (375) | Navegação lateral em 5 ou 6 grupos (Comissões e empresas; Níveis e requisitos; Jornada e régua; Indicações e SLA; Resultado e metas; Sistema), com busca por nome de regra; no celular, lista de grupos que abre cada seção |
| Edições não salvas somem sem aviso ao trocar de aba: o `TabsContent` do Radix desmonta a aba inativa, e cada cartão guarda o próprio rascunho | alto | `web-design-guidelines` (avisar antes de perder alterações não salvas); Nielsen #5 | `src/pages/app/Configuracoes.tsx:65` a `92` | Marcar cartões alterados ("Alterações não salvas"), bloquear a troca de seção com confirmação, ou manter o rascunho fora do componente |
| Jargão técnico exposto: nome da chave do banco em monoespaçado abaixo de cada parâmetro, descrição "lista de {data, titulo, local, link}" e, para valores sem editor próprio, um campo de JSON cru | alto | Nielsen #2; `wise-design-system` §8 (voz); carga cognitiva (barreira de jargão) | `a2-configuracoes-parametros-1440.jpg` (1440) | Esconder a chave (dica para administradores técnicos), reescrever descrições em linguagem de negócio, editor estruturado para todo valor de lista ou objeto |
| Parâmetro essencial vazio sem alerta: `app_url` (endereço dos links de e-mail e da página de RFP) está vazio e a tela não marca como obrigatório nem pendente | médio | Nielsen #1 e #5; `wise-design-system` §6 (estado parcial sinalizado) | `a2-configuracoes-parametros-1440.jpg` (1440) | Selo "Não configurado" em âmbar e um resumo no topo ("2 regras precisam de atenção") |
| Remover meta com um "x" de 12 px sem confirmação; demais exclusões usam o `confirm()` nativo do navegador; botão "Excluir" em `text-red-300` | médio | `web-design-guidelines` (confirmar ação destrutiva; alvos de toque); Nielsen #4; DESIGN #6 | `src/components/config/SecoesV2.tsx:471`, `TabelaConfig.tsx:197` | `AlertDialog` do kit para toda exclusão, alvo mínimo de 44 px no celular, cor `state-danger` |
| Botão "Salvar" desabilitado em menta translúcido, parecido com o habilitado; não há indicação de qual cartão tem mudança pendente | médio | Nielsen #1; `wise-design-system` §2 (contraste e menta como sinal) | `configuracoes-1440.jpg` (1440), `configuracoes-375.jpg` (375) | Salvar oculto ou neutro até haver mudança; quando houver, menta pleno e contorno no cartão alterado |
| Cada aba é uma pilha de formulários abertos de mesmo peso (empresas com todos os campos expostos), sem um resumo legível da regra vigente ("Wise Makers: 40% para o parceiro, 10% para o responsável, sobre a primeira mensalidade") | médio | Nielsen #8; `wise-dashboards` §2 | `configuracoes-1440.jpg` (1440) | Modo leitura com a regra em uma frase e ação "Editar" que abre o formulário |
| Aviso informativo com borda e fundo menta e ícone menta: o menta, que é sinal de ação ou meta batida, usado para uma nota | baixo | `wise-design-system` §2 (informação usa o azul `state-info`) | `configuracoes-1440.jpg` (1440) | Aviso em `state-info` com fundo suave |
| "Acesso restrito" sem cabeçalho de página e sem caminho de volta, diferente do "Sem permissão" de Comissões | baixo | `wise-design-system` §6; Nielsen #4 | `a2-configuracoes-consultor-375.jpg` (375) | Mesmo `EmptyState` de permissão para as duas telas |

**Pontos fortes**

1. O aviso "Mudanças de regra valem só para registros novos; os registros existentes mantêm os valores da época" responde à maior dúvida de quem edita uma regra.
2. A aba fica na URL (`?aba=parametros`), e o time de parcerias vê tudo em modo leitura, com a permissão real no banco.
3. Publicar uma nova versão das regras pede confirmação, e requisitos futuros são versionados.

**Alertas por persona**

* Gerente de Parcerias (leitura): para conferir uma regra antes de responder a um parceiro precisa adivinhar em qual das 24 abas ela está.
* Diretor (administrador): ao ajustar o percentual de comissão, troca de aba para conferir o nível e perde a edição sem aviso.
* Financeiro: sem acesso, mas é quem mais precisa ler a regra de base de cálculo das comissões; não há uma versão de leitura para esse papel.
* Consultor: recebe "Acesso restrito" sem saída.

---

## Contagem

| Tela | Crítico | Alto | Médio | Baixo | Total | Nielsen |
|---|---|---|---|---|---|---|
| Indicações | 0 | 6 | 6 | 2 | 14 | 18/40 |
| Comissões | 0 | 4 | 5 | 2 | 11 | 18/40 |
| Base Ativa | 0 | 2 | 3 | 3 | 8 | 16/40 |
| Atividades | 0 | 1 | 6 | 2 | 9 | 21/40 |
| Configurações | 0 | 3 | 4 | 2 | 9 | 15/40 |
| **Total** | **0** | **16** | **24** | **11** | **51** | |

Mais os 8 problemas comuns (C1 a C8), que valem para as cinco telas e em boa parte já estão na tabela "Diferenças a corrigir" do `DESIGN.md`.

Nenhum problema foi classificado como crítico: todas as tarefas podem ser concluídas hoje, com esforço. Os mais próximos de crítico são a quebra do valor em moeda no celular (Comissões) e a perda silenciosa de edição (Indicações e Configurações), porque podem levar a pagamento ou regra errados.

## Os 5 problemas principais destas telas

1. **Nenhuma das quatro telas de indicador responde à sua pergunta** (Indicações, Comissões, Base Ativa, Atividades): falta a camada de número principal e apoio com contexto e, sobretudo, a camada de explicação com gráfico (funil e tendência de indicações, comissões nos próximos 90 dias, linha do tempo da Base Ativa, horas por etapa e por dia). São listas com filtros, exatamente o padrão da versão 1 que `wise-dashboards` §1 manda abandonar. Gravidade alta.
2. **Pendências escondidas no meio dos dados em vez de uma lista de ação** (camada 4): SLA vencido e indicações paradas espalhados em pílulas vermelhas por 93 linhas; o encontro da Base Ativa de 17/10 sem registro aparece como "Previsto" e não como atrasado. O usuário não vê o que fazer hoje. Gravidade alta.
3. **Comissões não servem ao financeiro**: sem agrupamento e subtotal por parceiro, sem exportação, sem ação em lote, "Marcar como paga" sem data nem desfazer, aba "Todas" com 70.751 px no celular e valores em moeda quebrados no meio do número a 375 px. Gravidade alta.
4. **Edição perdida sem aviso**: o formulário de andamento da indicação é sobrescrito quando a consulta recarrega, e as Configurações descartam o rascunho ao trocar de aba; somado a rótulos não associados aos campos (comum C4), os formulários de maior risco são os menos seguros. Gravidade alta.
5. **Configurações como parede de 24 abas com jargão de banco**: chaves técnicas, JSON cru, nenhum resumo da regra vigente nem alerta de parâmetro essencial vazio. É onde se mudam comissão, níveis e SLA, e a tela não ajuda a achar nem a conferir. Gravidade alta.
