# Mapa de telas

Para cada tela: a pergunta, o público e as cinco camadas (herói, apoio, explicação, ação, detalhe). Telas marcadas com (002) nascem na feature `specs/002-evolucao-metodo-octo`; as demais já existem na v1 e devem ser refeitas com este desenho.

## Navegação interna proposta

Agrupar a barra lateral pela rotina, não pelo nome das tabelas:

| Grupo | Itens |
|---|---|
| Hoje | Painel, Pendências |
| Parceiros | Parceiros (categorias, funil, lista), Base Ativa, Capacitação (002), Comunicados (002) |
| Ida ao mercado | Indicações, Ações conjuntas (002), Pedidos de RFP, Cruzamento de carteiras (002) |
| Resultado | Resultado do canal (002), Custos (002), Comissões, Atividades e horas, Maturidade (002), Ranking (002), Meu painel (002) |
| Configurar | Configurações, Usuários, Importação |

Itens aparecem conforme o papel (regras de acesso da constituição). Paleta de comandos em todas as telas internas.

## Telas internas

**Painel** (refeito na 002 por etapa da jornada)
* Pergunta: o programa está andando para a meta e o que preciso fazer hoje?
* Herói: clientes fechados no ICP via parceiros no período, contra o período anterior e a meta.
* Apoio: parceiros assinados contra meta; parceiros ativados; indicações qualificadas; indicações dentro do SLA (%); satisfação dos parceiros.
* Explicação: abas por etapa da jornada (captação, onboarding, relacionamento, produção, canal), cada uma com os indicadores em destaque do Apêndice L; na aba produção, funil indicação, reunião, proposta e venda com taxa entre etapas.
* Ação: lista única de trabalho do dia (aprovações, follow-ups vencidos, SLA vencido, régua atrasada, negociações paradas), ordenada por urgência, com filtro por tipo.
* Detalhe: botão "Pauta da semana" e lista completa de indicadores.

**Resultado do canal** (002, só administradores)
* Pergunta: o canal de parcerias se paga?
* Herói: ROI do período.
* Apoio: receita atribuída, custo total, custo por cliente no ICP, tempo de retorno, horas no período.
* Explicação: cascata de receita para custo (receita, menos comissões, menos horas, menos custos diretos, resultado); custo por tipo ao longo dos meses (barra empilhada); ROI por parceiro (barra horizontal ordenada, zero ao centro, divergente).
* Ação: parceiros com mais horas e nenhum resultado.
* Detalhe: link para Custos; aviso da fase do programa.

**Custos** (002, só administradores)
* Pergunta: para onde está indo o investimento do programa?
* Apoio: total por tipo (horas, comissões, diretos) contra o período anterior.
* Explicação: horas por etapa da jornada (barra empilhada por mês); mapa de calor de horas por dia.
* Detalhe: `DataTable` da planilha de custos com filtros e exportação.

**Parceiros**
* Pergunta: como está a carteira e onde cada parceiro está?
* Apoio: total por etapa, assinados, ativados, categorias com menos de 3 opções.
* Explicação: visão por categoria com barra de cobertura (assinados contra o mínimo de 3); quadro do funil com contagem e tempo médio por etapa.
* Detalhe: lista com filtros salvos (nível, faixa, maturidade, status, responsável).

**Ficha do parceiro**
* Pergunta: o que preciso saber e fazer com este parceiro agora?
* Cabeçalho fixo: nome, logo, nível (`NivelBadge`), etapa, status de atividade, responsável, próximo passo e ação rápida de registro.
* Resumo: indicações e clientes fechados (com minigráfico), progresso para o próximo nível (`Stepper` com os três grupos), onboarding (marcos), radar de maturidade pequeno, horas e ROI do parceiro (só administradores).
* Abas: linha do tempo, ficha e campos, contrato, ações conjuntas, indicações, scorecard, nível e revisões, maturidade, documentos.

**Indicações**
* Pergunta: as indicações estão virando clientes e a Wise está respondendo no prazo?
* Herói: clientes fechados no ICP no período.
* Apoio: indicações, qualificadas (%), dentro do SLA (%), ciclo médio de venda, nota média de qualidade.
* Explicação: funil com taxas e tempo entre etapas; indicações por semana com período anterior; por empresa do grupo (barra empilhada).
* Ação: indicações com SLA vencendo hoje e paradas há mais de 15 dias.
* Detalhe: tabela com filtros e linha que abre o detalhe lateral.

**Comissões**
* Pergunta: quanto devemos pagar e receber, e quando?
* Apoio: a pagar, pagas no período, a receber, recebidas.
* Explicação: linha do tempo de comissões por estado nos próximos 90 dias.
* Detalhe: tabela por estado.

**Base Ativa**
* Pergunta: quem está no ciclo, quem está na fila e quando cada um começa?
* Explicação: linha do tempo horizontal dos ciclos (encontros 1 a 6 e evento), fila ordenada com previsão.

**Atividades e horas**
* Pergunta: onde o tempo da equipe está indo?
* Explicação: horas por etapa da jornada e por parceiro (barra horizontal), mapa de calor por dia.

**Maturidade** (002)
* Pergunta: em que eixos o programa e cada parceiro estão fracos?
* Herói: radar médio dos parceiros comerciais assinados.
* Explicação: distribuição por categoria (fundação, desenvolvimento, escala); matriz parceiros por eixo como mapa de calor (linhas parceiros, colunas eixos, cor sequencial).

**Ranking** (002)
* Pergunta: quem está gerando mais resultado neste ano e trimestre?
* Explicação: `BarList` com pontos, faixa interna como selo (só interno), premiações do ano.

**Ações conjuntas** (002)
* Pergunta: o que está combinado com cada parceiro e o que está atrasado?
* Explicação: calendário mensal com lado (Wise ou parceiro) por cor e estado por ícone; lista de atrasadas.

**Meu painel** (002)
* Pergunta: estou batendo as minhas metas do trimestre?
* Apoio: realizado contra meta por indicador (barra de meta).

## Portal do parceiro

**Início**
* Pergunta (do parceiro): como está a minha parceria e o que faço agora?
* Herói: nível pelo nome, com o progresso para o próximo nível em três grupos.
* Apoio: indicações feitas no ano, clientes fechados, comissões recebidas.
* Explicação: plano de onboarding (se em andamento) como `Stepper`; ações da semana dos dois lados.
* Ação: indicar um cliente (link exclusivo e formulário), comprovar uma ação, responder à pesquisa, ler comunicados.

**Meu nível, Capacitação, Ranking, Indicações**: mesmas regras, sempre com o próximo passo explícito.

## Páginas públicas

**Página de RFP** (`/r/:token`) e **link de indicação** (`/i/:token`): são vitrines da marca, não telas de sistema. Baloo 2 no título, textura escura da marca só no topo, uma coluna, botões grandes, carregamento instantâneo, nada de menus internos. Na RFP, fichas de parceiro comparáveis lado a lado no desktop e empilhadas no celular, com o botão de WhatsApp sempre visível.
