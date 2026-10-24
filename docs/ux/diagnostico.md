# Diagnóstico de UX: Portal Wise Partners (estado atual)

Plano de UX, fase 1, prompt 1.2. Branch `ux-fundacao`, 24/10/2026. Só diagnóstico: nenhum arquivo de `src/`, `supabase/migrations/` ou `index.html` foi alterado.

Como ler este arquivo:

* A seção 5 traz os **10 problemas mais importantes do portal inteiro**. Se tiver pouco tempo, comece por ela.
* As seções 3 e 4 trazem, tela por tela, os problemas **críticos e altos**, com a regra violada e a captura de referência.
* Os problemas **médios e baixos** (171 no total, somando as cinco avaliações) estão nos relatórios completos em `docs/ux/diagnostico/partes/`, com a mesma estrutura (problema, gravidade, regra, captura, correção sugerida).
* **Portão:** marque o que você discorda (seção 6). Nada da fase 2 em diante começa antes disso.

## 1. Método

| Avaliação | O que fez | Telas | Relatório |
|---|---|---|---|
| A1 | Crítica de design do Impeccable (`critique`, Avaliação A): heurísticas de Nielsen, carga cognitiva, personas, gravidade | Painel, Parceiros (categorias, funil, lista), ficha do parceiro Elite assinado | `partes/A1-painel-parceiros-ficha.md` |
| A2 | Mesmo método | Indicações, Comissões, Base Ativa, Atividades, Configurações | `partes/A2-indicacoes-comissoes-baseativa-atividades-config.md` |
| A3 | Mesmo método, com a skill `mobile-native` | Portal do parceiro (Início, Indicações) e página pública de RFP | `partes/A3-portal-rfp.md` |
| B | Detector do Impeccable (código e página renderizada, com overlay), `audit` do Impeccable, skills `accessibility`, `performance` e `web-design-guidelines`: contraste medido, alvos de toque, teclado, árvore de acessibilidade, peso de JS por rota, LCP da RFP em 4G lento | As 13 telas | `partes/B-detector-auditoria.md` |
| C | `break-ui`: as mesmas telas com dados extremos (textos longos, valores enormes, listas vazias e gigantes, caracteres especiais) num banco separado | As 13 telas | `partes/C-break-ui.md` |

Regras de referência, nesta ordem de prioridade: skills `wise-design-system` e `wise-dashboards` (com `mapa-de-telas.md` e `graficos.md`), `DESIGN.md` (seção "Diferenças a corrigir", citada como DESIGN #N), `PRODUCT.md`, `web-design-guidelines`, WCAG 2.2 e as demais skills do kit. As avaliações A e B rodaram isoladas, sem ler uma a outra, como pede o `critique`.

Dados: `supabase/seed_demo.sql` num Postgres local (41 parceiros, 93 indicações, comissões, ciclos da Base Ativa, uma RFP publicada). Usuários: Guilherme (administrador) nas telas internas e Ana (Sistemas Araucária, Elite) no portal. Capturas em 375, 768 e 1440 px em `docs/ux/capturas/antes/` (base: `<tela>-<largura>.jpg`; extras das avaliações: `a2-*`, `b-*`, `ficha-elite-*`, `painel-lista-*`, `portal-*`, `rfp-publica-*`) e, para os dados extremos, em `docs/ux/capturas/extremo/`.

Gravidade: crítico (P0) impede a tarefa; alto (P1) atrapalha muito ou induz a erro; médio (P2) incomoda com solução de contorno; baixo (P3) polimento.

Não testado: leitor de tela real, Lighthouse e axe (substituídos pela árvore de acessibilidade do Chromium), zoom de texto a 200%, aparelho físico (hover preso, teclado virtual, áreas seguras), estados de carregando, erro e sem permissão de forma sistemática (a avaliação C cobriu parte).

## 2. Placar

### 2.1 Por tela

Nielsen: soma de 10 heurísticas de 0 a 4 (máximo 40). Contagens de A (design) e B (técnico) somadas, sem repetir o mesmo problema achado pelas duas.

| Tela | Nielsen | Crítico | Alto | Médio | Baixo |
|---|---|---|---|---|---|
| Painel | 20/40 | 1 | 4 | 6 | 6 |
| Parceiros | 23/40 | 0 | 4 | 9 | 7 |
| Ficha do parceiro | 21/40 | 0 | 5 | 4 | 5 |
| Indicações | 18/40 | 1 | 6 | 6 | 3 |
| Comissões | 18/40 | 0 | 4 | 5 | 4 |
| Base Ativa | 16/40 | 0 | 2 | 3 | 4 |
| Atividades | 21/40 | 0 | 1 | 6 | 3 |
| Configurações | 15/40 | 0 | 4 | 5 | 3 |
| Portal, Início | 20/40 | 0 | 5 | 11 | 6 |
| Portal, Indicações | 20/40 | 0 | 2 | 8 | 4 |
| RFP pública | 25/40 | 0 | 3 | 8 | 6 |
| Transversal (todas) | | 0 | 4 | 8 | 7 |

A tabela não inclui a avaliação C (dados extremos), que somou 5 críticos, 20 altos, 24 médios e 10 baixos, descritos na seção 4.

Faixa de Nielsen: 15 a 25 de 40, todas "aceitável" ou abaixo. A pior é Configurações (15), seguida de Base Ativa (16), Indicações e Comissões (18).

### 2.2 Auditoria técnica (B)

| Dimensão | Nota (0 a 4) | Resumo |
|---|---|---|
| Acessibilidade | 2 | Texto passa AA em todas as telas; falham rótulos (43 controles sem nome), teclado em Indicações, foco a 1,42:1, borda de campo a 1,58:1 |
| Desempenho | 2 | Rotas preguiçosas funcionam; pdf-lib (510 KB gzip) entra no painel, na ficha e em configurações |
| Temas | 2 | 308 raios soltos, 322 brancos translúcidos, 38 cores da paleta Tailwind, 0 `tabular-nums` |
| Responsivo | 3 | Nenhuma rolagem horizontal a 375 px; alvos abaixo de 44 px e páginas muito longas no celular |
| Integridade | 2 | O kit de componentes da skill ainda não existe; defeitos copiados em vários arquivos |
| **Total** | **11/20** | Aceitável: trabalho significativo necessário |

O que está bom e deve ser preservado: identidade escura com menta coerente, contraste de texto (menor razão 5,57:1), nenhuma rolagem horizontal no celular, 44 rotas com carregamento sob demanda, listas que viram cartões no celular, RFP com LCP de 2,2 s em 4G lento.

## 3. Problemas por tela (críticos e altos)

Coluna "Fonte": relatório de origem em `docs/ux/diagnostico/partes/`.

### 3.0 Transversais (valem para todas as telas)

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Nenhuma tela usa o kit da skill (`PageHeader` com a pergunta, `HeroMetric`, `KpiTile`, `ChartCard`, `DataTable`, `FilterBar`, `EmptyState`); cada tela reinventa cartões, filtros e listas | alto | `wise-design-system` §5; `wise-dashboards` §3; CLAUDE.md ("toda tela começa com PageHeader"); DESIGN #14 | `painel-1440.jpg`, `indicacoes-1440.jpg`, `comissoes-1440.jpg` | A2 (C1), B (integridade) |
| Anel de foco global quase invisível (1,42:1) em links, navegação, botões simples e cartões-link | alto | WCAG 2.4.7 e 1.4.11; `wise-design-system` §2 (3:1 para elementos gráficos) | `b-painel-foco-teclado-1440.jpg`; `src/index.css:37` | B, A3 |
| Rótulos de campo não ligados aos controles: 43 controles sem nome acessível (lista de parceiros 9, Indicações 6, ficha 10, Configurações 18); o mesmo `Label` sem `htmlFor` copiado em 5 componentes | alto | WCAG 1.3.1, 3.3.2 e 4.1.2; `web-design-guidelines` (Forms) | `b-parceiros-lista-1440.jpg`; `parceiros/ui.tsx:32`, `Indicacoes.tsx:306`, `TabelaConfig.tsx:227`, `NovaIndicacaoDialog.tsx:291`, `DetalheIndicacao.tsx:270` | B, A2 (C4) |
| Borda de campo com 1,58:1 em todos os `Input` e `Select` | alto | `wise-design-system` §2 (3:1 em bordas de campo); WCAG 1.4.11 | `b-indicacoes-1440.jpg`; `--input` em `src/index.css` | B |
| Estados genéricos: "Carregando..." em texto em vez de esqueleto; erro mostra a mensagem técnica do banco sem "Tentar de novo"; vazio sem ação; não há estado parcial nem sem permissão | médio (sistêmico) | CLAUDE.md (5 estados por tela); `wise-design-system` §6; DESIGN #15 | `src/components/comum/Estados.tsx` | A1, A2 (C2) |

Médios e baixos transversais (detalhe em A1 seção 4, A2 C1 a C8 e B seção 5.1): barra lateral com 20 itens sem grupos e sem paleta Ctrl+K; sem link "pular para o conteúdo"; título do documento igual em todas as telas; sem `prefers-reduced-motion`; sem `tabular-nums`; sem `color-scheme: dark` (ícone de calendário invisível); botão flutuante "Registrar contato" com brilho menta cobrindo controles no celular; filtros fora da URL; somas e regras calculadas no componente em vez do banco; botão `destructive` a 3,71:1; chunk principal de 221 KB gzip em toda rota; fontes de 10 e 11 px; abas de 32 px no celular.

### 3.1 Painel (`/app`)

Pergunta da tela: "o canal está andando e o que eu faço hoje?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Sem hierarquia: a aba padrão é uma grade de 32 cartões iguais, todos marcados "Destaque". O número principal (clientes fechados no ICP) é o 20º cartão, com o mesmo tamanho dos outros, a 1.810 px do topo (1440) e 3.540 px (375) | crítico | `wise-dashboards` §1 e §3 camada 1 (um `HeroMetric`); `wise-design-system` §5; DESIGN #12 | `painel-1440.jpg`, `painel-375.jpg` | A1 |
| "O que preciso fazer hoje" só existe na aba "Lista completa", partido em 6 cartões de número ("Contrapartidas atrasadas 71", "e mais 65") em vez de uma lista única por urgência | alto | `wise-dashboards` §3 camada 4; `mapa-de-telas.md` Painel (Ação) | `painel-lista-1440.jpg` | A1 |
| Nenhum gráfico: o funil é uma lista chave e valor em ordem invertida, sem taxa entre etapas; assinados contra meta é uma barra de 6 px sem projeção | alto | `wise-dashboards` §3 camada 3 e §4; `graficos.md` (funil em barras horizontais, bullet com projeção) | `painel-1440.jpg` | A1 |
| Cor e seta da comparação ignoram o sentido do indicador: "Saída de parceiros 1, ↗ Período anterior: 0" aparece em menta, uma piora pintada de sinal bom; sem delta | alto | `wise-design-system` §2 (cor com significado) e §5 (`KpiTile`) | `painel-1440.jpg` (Relacionamento) | A1 |
| pdf-lib e papaparse (510 KB gzip) carregados para formatar números; 745 KB gzip de JS na tela mais aberta do produto | alto | Skill `performance` (300 KB); `wise-dashboards` §4 | Medido na rede; `gestao/formato.ts:3` | B |

Médios e baixos: 6 e 6 (A1 seção 1, B seção 5.2).

### 3.2 Parceiros (`/app/parceiros`: categorias, funil, lista)

Pergunta da tela: "a carteira está coberta e onde cada parceiro está?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Sem camada de apoio: nenhuma vista mostra assinados contra meta, ativados, total por etapa ou categorias descobertas; o usuário conta à mão | alto | `mapa-de-telas.md` Parceiros (Apoio); `wise-dashboards` §3 camada 2 | `parceiros-categorias-1440.jpg` | A1 |
| A pílula âmbar "Menos de 3 assinados" aparece em 21 de 22 categorias: 0 e 2 assinados têm o mesmo desenho, ordem alfabética em vez de cobertura | alto | `graficos.md` (barra de cobertura 0 a 3+); `wise-design-system` §2 | `parceiros-categorias-1440.jpg` | A1 |
| O funil não mostra tempo médio nem taxa de passagem; 10 colunas em 2 linhas leem em Z a 1440; 10 seções empilhadas e 7.495 px a 375 | alto | `mapa-de-telas.md` Parceiros (quadro com contagem e tempo médio); `wise-dashboards` §3 | `parceiros-funil-1440.jpg`, `parceiros-funil-375.jpg` | A1 |
| Lista: 8 filtros sem nome acessível ("Todos, caixa de combinação" oito vezes) e busca só com `placeholder` | alto | WCAG 1.3.1, 3.3.2 e 4.1.2 | `b-parceiros-lista-1440.jpg`; `ListaParceiros.tsx:117` a `:176` | B |

Médios e baixos: 9 e 7 (A1 seção 2, B seções 5.3 a 5.5).

### 3.3 Ficha do parceiro (Sistemas Araucária, Elite assinado)

Pergunta da tela: "como está este parceiro e qual o próximo passo?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| A "Visão geral" é um formulário de cadastro; não mostra indicações, clientes fechados, progresso de nível, marcos nem maturidade | alto | `mapa-de-telas.md` Ficha (Resumo); `wise-dashboards` §2 e §3 | `ficha-elite-1440.jpg` | A1 |
| Os problemas ficam escondidos em abas (régua atrasada há 132 dias só em Nível, marcos de 30 e 60 dias atrasados só em Onboarding, contrapartidas atrasadas só na aba delas) enquanto o cabeçalho mostra "Ativo" em menta | alto | `mapa-de-telas.md` Ficha (cabeçalho com status e próximo passo); Nielsen #1 | `ficha-elite-nivel-1440.jpg`, `ficha-elite-onboarding-1440.jpg` | A1 |
| Sem próximo passo: o cabeçalho não mostra nada; "Novo próximo passo" só existe na lateral da aba Linha do tempo | alto | `PRODUCT.md` princípio 4; `mapa-de-telas.md` Ficha | `ficha-elite-linha-do-tempo-1440.jpg` | A1 |
| 879 KB gzip de JS na abertura (pdf-lib e docxtemplater importados de forma estática) | alto | Skill `performance` | Medido na rede; `CabecalhoFicha.tsx:11`, `lib/contrato.ts:5` | B |
| 10 campos sem nome acessível | alto | WCAG 1.3.1, 3.3.2 e 4.1.2 | `b-ficha-1440.jpg`; `Classificacao.tsx:80` e `:172` | B |

Médios e baixos: 4 e 5 (A1 seção 3, B seção 5.6).

### 3.4 Indicações (`/app/indicacoes`)

Pergunta da tela: "as indicações estão andando dentro do prazo e quais precisam de mim?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| No computador, as 93 linhas abrem o detalhe só com mouse: nenhum elemento da linha recebe foco, então quem usa teclado não abre nenhuma indicação | crítico | WCAG 2.1.1 (nível A) | `indicacoes-1440.jpg`; `Indicacoes.tsx:254` | B |
| Sem as camadas 1 a 3: não há número principal, indicadores de apoio (qualificadas, dentro do SLA, ciclo médio) nem gráficos (funil com taxas, indicações por semana) | alto | `wise-dashboards` §2 e §3; `mapa-de-telas.md` Indicações; `PRODUCT.md` princípios 1 e 2 | `indicacoes-1440.jpg` | A2 |
| Sem lista de ação: SLA vencido e indicações paradas aparecem espalhados como pílulas vermelhas nas linhas | alto | `wise-dashboards` §3 camada 4 | `indicacoes-1440.jpg` | A2 |
| 93 linhas despejadas sem paginação, ordenação, busca por cliente nem exportação (8.564 px no desktop, 18.715 px no celular) | alto | `wise-design-system` §5 (`DataTable`); `web-design-guidelines` (listas grandes) | `indicacoes-1440.jpg`, `indicacoes-375.jpg` | A2, B |
| No celular, 7 seletores e 4 caixas ocupam a primeira tela inteira antes do primeiro resultado; o botão flutuante cobre o filtro Período | alto | `wise-dashboards` §5 (`FilterBar`); carga cognitiva | `indicacoes-375.jpg` | A2 |
| O formulário "Atualizar andamento" é sobrescrito a cada recarga da consulta: o que está sendo digitado some sem aviso | alto | `web-design-guidelines` (alterações não salvas); Nielsen #5 | `a2-indicacoes-detalhe-1440.jpg`; `DetalheIndicacao.tsx:172` | A2 |
| Filtros e campos do detalhe sem rótulo ligado (anunciados como "Todos") | alto | WCAG 1.3.1, 3.3.2 e 4.1.2 | `Indicacoes.tsx:303` e `:306` | A2, B |

Médios e baixos: 6 e 3 (A2 seção 1, B seção 5.7).

### 3.5 Comissões (`/app/comissoes`)

Pergunta da tela: "quanto devemos, quanto vamos receber e quando?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Não responde "quando": falta a linha do tempo de comissões por estado nos próximos 90 dias e a data esperada de pagamento em cada item | alto | `wise-dashboards` §3 camada 3; `graficos.md` (Comissões nos próximos 90 dias) | `comissoes-1440.jpg` | A2 |
| A 375 px os valores em moeda quebram no meio do número ("R$ 60.450,0" numa linha e "0" na seguinte) | alto | `wise-design-system` §3 (`tabular-nums`) e §4 (passar em 375 px) | `comissoes-375.jpg`, `a2-comissoes-todas-375.jpg` | A2 |
| "A pagar" é uma pilha de cartões, sem agrupamento nem total por parceiro (que emite uma nota pelo total), sem exportação e sem ação em lote | alto | `wise-design-system` §5 (`DataTable`); `wise-dashboards` §3 camada 5 | `comissoes-1440.jpg` | A2 |
| A aba "Todas" no celular gera uma página de 70.751 px, sem paginação | alto | `web-design-guidelines` (listas grandes); `wise-design-system` §4 | `a2-comissoes-todas-375.jpg` | A2 |

Médios e baixos: 5 e 4 (A2 seção 2, B seção 5.8).

### 3.6 Base Ativa (`/app/base-ativa`)

Pergunta da tela: "quem está em ciclo, quem está na fila e o que vence esta semana?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Os três grupos não aparecem juntos: abre na aba "Fila" (1 item) e esconde ciclos em andamento e concluídos; não há linha do tempo dos ciclos nem previsão de início da fila | alto | `mapa-de-telas.md` Base Ativa; `graficos.md` (linha do tempo horizontal); `wise-dashboards` §2 | `base-ativa-1440.jpg`, `a2-base-ativa-em-ciclo-1440.jpg` | A2 |
| Encontro vencido não é sinalizado: o Encontro 3 (17/10) segue "Previsto" em cinza no dia 24/10, sem alerta nem destaque do próximo encontro | alto | `wise-design-system` §2 (âmbar para alerta); Nielsen #1 | `a2-base-ativa-em-ciclo-1440.jpg` | A2 |

Médios e baixos: 3 e 4 (A2 seção 3, B seção 5.9).

### 3.7 Atividades (`/app/atividades`)

Pergunta da tela: "onde está indo o tempo do time de parcerias?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Faltam os gráficos pedidos (horas por etapa da jornada, horas por parceiro com aprofundamento, mapa de calor por dia); nada compara com o período anterior | alto | `mapa-de-telas.md` Atividades e horas; `graficos.md`; `wise-dashboards` §3 camada 3 | `atividades-1440.jpg` | A2 |

Médios e baixos: 6 e 3 (A2 seção 4, B seção 5.10). É a tela interna tecnicamente mais limpa.

### 3.8 Configurações (`/app/configuracoes`)

Pergunta da tela: "quais são as regras do programa e o que muda se eu alterar uma?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| 24 abas planas na mesma faixa (4 linhas no desktop, 470 px no celular), sem grupos nem busca | alto | Carga cognitiva (mais de 8 opções); Nielsen #6 e #8; `mapa-de-telas.md` (agrupar pela rotina) | `configuracoes-1440.jpg`, `configuracoes-375.jpg` | A2 |
| Edição não salva some sem aviso ao trocar de aba | alto | `web-design-guidelines` (alterações não salvas); Nielsen #5 | `Configuracoes.tsx:65` a `:92` | A2 |
| Jargão técnico: chave do banco em monoespaçado sob cada parâmetro, descrição "lista de {data, titulo, local, link}" e campo de JSON cru | alto | Nielsen #2; `wise-design-system` §8 (voz) | `a2-configuracoes-parametros-1440.jpg` | A2 |
| 18 campos sem nome acessível (aba Empresas e comissões) | alto | WCAG 1.3.1, 3.3.2 e 4.1.2 | `b-configuracoes-1440.jpg`; `TabelaConfig.tsx:227` | B |

Médios e baixos: 5 e 3 (A2 seção 5, B seção 5.11).

### 3.9 Portal do parceiro, Início (`/parceiro`)

Pergunta da tela: "como está a nossa parceria e o que eu faço agora?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| A primeira dobra no celular é cadastro estático (parceria, nível, pacote, início, responsável) e um link externo; nada responde "como está" nem "o que faço agora" | alto | `wise-dashboards` §2 e §3; Nielsen #8 | `portal-inicio-dobra-375.jpg` | A3 |
| Sem herói de nível: não mostra o progresso nos três grupos; quando os requisitos não estão cumpridos, esconde o risco atrás de "Veja o que manter em dia" | alto | `mapa-de-telas.md` Início (herói); `wise-dashboards` §3.1; `PRODUCT.md` princípio 4 | `portal-inicio-375.jpg`, `portal-inicio-1440.jpg` | A3 |
| Não existe "Indicar um cliente" na Início; a única ação em destaque é "Acessar o Wise Hub", que leva para fora do portal | alto | `mapa-de-telas.md` Início (ação); `wise-dashboards` §3.4 | `portal-inicio-dobra-375.jpg` | A3 |
| Indicadores errados e sem contexto: "Indicações 9" soma feitas e recebidas sem recorte de ano; "4 pendentes, 4 atrasadas" são conjuntos disjuntos que se leem como subconjunto (há 8 em aberto); faltam clientes fechados e comissões | alto | `wise-dashboards` §3 (todo número tem contexto); `wise-design-system` §5 (`KpiTile`) | `portal-inicio-375.jpg`, `portal-inicio-768.jpg` | A3 |
| "Primeiros passos" mostra tarefas internas da Wise, na voz da Wise ("Solicitar logo, cores e dados cadastrais"), como afazeres do parceiro, com prazo; o parceiro não consegue concluir nenhuma | alto | Nielsen #2; `PRODUCT.md` princípio 4; `wise-design-system` §8 | `portal-inicio-375.jpg` | A3 |

Médios e baixos: 11 e 6 (A3 seção 1, B seção 5.12).

### 3.10 Portal do parceiro, Indicações (`/parceiro/indicacoes`)

Pergunta da tela: "como estão as minhas indicações e quanto eu ganho com elas?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Sem resumo (feitas no ano, fechadas, comissão a receber e recebida) nem próximo passo por indicação; é só uma lista cronológica | alto | `mapa-de-telas.md` Portal, Indicações; `wise-dashboards` §2 e §3 | `portal-indicacoes-375.jpg`, `portal-indicacoes-1440.jpg` | A3 |
| Em "Recebidas", todos os cartões têm "Atualizar resultado" com o mesmo peso, em ordem de data; não aparece qual está parado nem qual espera o parceiro | alto | `wise-dashboards` §3.4 (lista ordenada por urgência); Nielsen #1 | `portal-indicacoes-recebidas-375.jpg` | A3 |

Médios e baixos: 8 e 4 (A3 seção 2, B seção 5.13). Entre os médios: "Indicar" e "Nova indicação" com dois nomes, formulário em diálogo de 90vh com rótulos só em placeholder (`portal-nova-indicacao-375.jpg`).

### 3.11 Página pública de RFP (`/r/:token`)

Pergunta da tela: "quais são as opções para o meu problema e com quem eu falo?"

| Problema | Gravidade | Regra violada | Captura de referência | Fonte |
|---|---|---|---|---|
| Falha de rede ou tempo esgotado vira "Este link não está mais disponível. Fale com o seu consultor", sem "Tentar de novo" e, sem dados, sem o contato do consultor: beco sem saída no 4G lento | alto | `wise-design-system` §6 (erro com "tentar de novo"); Nielsen #9 | `rfp-publica-link-invalido-375.jpg` | A3 |
| Sem metas Open Graph: o link chega pelo WhatsApp com a prévia genérica "Portal Wise Partners", sem imagem | alto | `mapa-de-telas.md` (páginas públicas são vitrine da marca) | Medido no `<head>` da página | A3 |
| As fichas não são comparáveis: texto livre e destaques variáveis, sem campos fixos (cidade e UF, porte, prazo, experiência); no desktop 2 colunas com o terceiro cartão órfão | alto | `mapa-de-telas.md` RFP ("fichas comparáveis lado a lado"); Nielsen #6 | `rfp-publica-1440.jpg`, `rfp-publica-768.jpg`, `rfp-publica-375.jpg` | A3 |

Médios e baixos: 8 e 6 (A3 seção 3, B seção 5.14).

## 4. Dados extremos (break-ui)

Cenário montado num banco separado (`demo_extremo`, script em `partes/C-break-ui-dados.sql`), passando por todas as regras do banco: 200 parceiros, 478 indicações, 849 comissões, 1.075 atividades em 30 dias; razão social de 148 caracteres, nome sem espaço ("um domínio" como nome fantasia), nomes de 1 letra, diacríticos, "&" e apóstrofo, usuária sem nome; vendas de oito dígitos e comissões de sete; um parceiro com 272 indicações; 14 parceiros numa RFP. Capturas em `docs/ux/capturas/extremo/` e recortes em `docs/ux/capturas/extremo/detalhe/`. Quatro capturas de página inteira não existem porque as páginas passam de 65.535 px, o limite do JPEG (Indicações em 375 e Comissões "Todas" nas três larguras); os recortes do topo estão em `detalhe/`.

| Tela | O que quebra | Gravidade | Regra violada | Captura de referência |
|---|---|---|---|---|
| Comissões | Os totais do topo partem o número em 375: "R$ 10.850.92" numa linha e "9,13" na outra; quem lê pode registrar outro valor | crítico | `wise-design-system` §3 (`tabular-nums`); `break-ui` (nunca truncar números) | `extremo/detalhe/comissoes-375-y0.jpg` |
| Painel | Na "Lista completa", os cartões de comissão partem o número do mesmo jeito ("R$ 3.193.27" e "3,13") | crítico | Mesma regra; causa única em `Blocos.tsx:99` (`break-words`) | `extremo/detalhe/painel-lista-375-y3600.jpg` |
| Indicações | Em 1440 a tabela de 10 colunas é mais larga que o cartão: "Valor base" aparece cortado e "Responsável" fica fora, com a barra de rolagem 46 mil px abaixo; em 768 somem cinco colunas | crítico | `break-ui` (nunca truncar valores) | `extremo/detalhe/indicacoes-1440-y0.jpg`, `extremo/detalhe/indicacoes-768-y0.jpg` |
| Atividades | Na visão "Por parceiro" em 375 os números da direita não cedem espaço e o nome fica com 1 a 5 letras ("S…", "Venda…"); 175 nomes cortados sem `title` | crítico | `break-ui` (embrulhar o que identifica) | `extremo/detalhe/atividades-375-y0.jpg` |
| RFP pública | Em 375 um nome sem espaço alarga a grade para 492 px e o lado direito de todos os cartões da categoria some, inclusive o botão "Falar com este parceiro" | crítico | `break-ui` (filho de grid com `min-width:auto`); `ConteudoPaginaRfp.tsx:62` e `:89` | `extremo/detalhe/rfp-publica-375-y0.jpg` |
| Todas as listas | Nenhuma tem paginação: Comissões "Todas" com 394.997 px e 28.798 nós, Atividades 133.641 px, Indicações 108.597 px, funil 34.147 px, lista de parceiros 29.079 px, ficha com 272 indicações 32.087 px, portal 29.209 px. No Supabase hospedado, sem `max_rows` próprio, as consultas acima de 1.000 linhas seriam cortadas sem aviso (inferido pelo código, não reproduzido) | alto | `wise-design-system` §5 (`DataTable`); `wise-dashboards` §7 (200 parceiros) | `extremo/detalhe/comissoes-todas-375-y0.jpg`, `extremo/parceiros-funil-375.jpg` |
| Painel, Parceiros, Ficha | Nomes que identificam a linha cortam enquanto os metadados ocupam o espaço: "Grupo Cam…" em "Parceiros esfriando", 96 nomes iguais no funil ("Consultoria Caram…"), clientes repetidos "Cooperativa Agroindustria…" na ficha; datas cortadas no fim em "Contrapartidas atrasadas" | alto | `break-ui` (embrulhar nomes, truncar metadado, nunca truncar datas) | `extremo/detalhe/painel-lista-375-y1200.jpg`, `extremo/detalhe/parceiros-funil-1440-y0.jpg`, `extremo/detalhe/ficha-indicacoes-1440-y0.jpg` |
| Parceiros, Ficha | Categoria com 55 parceiros estica a grade (1.900 px de vazio ao lado); próximo passo sem limite ocupa 11 linhas no cartão do funil; lista em 768 esconde Status, Responsável e Cidade sem sinal de rolagem; "R$ 3.638.598,43" vaza o cartão da ficha em 375 | alto | `break-ui` (item 10x maior, clamp em prévias); `wise-design-system` §5 (um `KpiTile` canônico) | `extremo/detalhe/parceiros-categorias-1440-y0.jpg`, `extremo/detalhe/parceiros-lista-768-y700.jpg`, `extremo/detalhe/ficha-comissoes-375-y1300.jpg` |
| Base Ativa, Atividades | Nome sem espaço cria rolagem horizontal na página inteira em 375 (453 px e 390 px) | alto | `break-ui` (string inquebrável) | `extremo/detalhe/base-ativa-375-y0.jpg`, `extremo/detalhe/atividades-lista-375-y0.jpg` |
| Atividades | Números sem separador de milhar ("1075", "1665 h 40 min") | alto | `wise-design-system` §3 e §8 | `extremo/detalhe/atividades-375-y0.jpg` |
| Portal, Início | "Olá," sozinho quando o perfil não tem nome (caso real de quem entra por convite); "1 pendentes", "1 atrasadas" | alto | `wise-design-system` §8 (voz) | `extremo/detalhe/portal-375-y0.jpg`, `extremo/detalhe/portal-375-y1200.jpg` |

Frágil no banco (médio): nenhum campo de texto tem limite de tamanho, nem no banco nem nos formulários internos, e `nome_fantasia` aceita espaços nas pontas; a ordenação do banco (`C.UTF-8`) joga "Árvore" e "Ômega" para depois de "Z". Correção proposta em nova migração aditiva, nunca editando as aplicadas.

O que aguentou: valores de oito e nove dígitos em uma coluna; cartão de comissão com textos enormes legível em 375 e 1440; cabeçalho da ficha com nomes longos; zero em tom secundário; escape de "&" e apóstrofo; diacríticos; nenhum travessão e nenhum erro de REST nas capturas.

Decisões que C propõe para a fase 2 (detalhe em `partes/C-break-ui.md`, seção 4): nome do parceiro quebra em até 2 linhas e nunca trunca; paginação no servidor de 50 por página com "Mostrando 50 de 478"; valores nunca quebram, e cartões de valor passam a uma coluna abaixo de 400 px; ordenação com `localeCompare` pt-BR ou collation ICU.

## 5. Os 10 problemas mais importantes do portal inteiro

Critério de ordem: impacto no número principal do programa (clientes fechados no ICP via parceiros) e na rotina de quem mais usa, gravidade, quantas telas atinge e se outras correções dependem dele.

1. **O painel não responde à pergunta dele** (crítico). Abre numa grade de 32 cartões iguais, todos marcados "Destaque". O número principal, clientes fechados no ICP, é o 20º cartão. "O que preciso fazer hoje" só aparece em outra aba, partido em 6 cartões. Viola `wise-dashboards` §1 e §3 (herói, apoio, explicação, ação) e o princípio 1 do `PRODUCT.md`. Capturas: `painel-1440.jpg`, `painel-375.jpg`, `painel-lista-1440.jpg`.
2. **Teclado e formulários falham no básico** (crítico). Em Indicações, no computador, nenhuma das 93 linhas abre com teclado (`Indicacoes.tsx:254`, WCAG 2.1.1, nível A). Em todo o portal, 43 campos não têm nome acessível (o mesmo `Label` sem `htmlFor` copiado em 5 componentes), o anel de foco tem 1,42:1 (`index.css:37`) e a borda de campo tem 1,58:1, abaixo dos 3:1 da skill. Capturas: `indicacoes-1440.jpg`, `b-painel-foco-teclado-1440.jpg`.
3. **Valores e nomes quebram com dados reais** (crítico). Em 375 os totais de Comissões e os cartões de comissão do painel partem o número no meio ("R$ 60.450,0" numa linha e "0" na outra, já com o seed de demonstração; "R$ 10.850.92" e "9,13" com valores maiores), o que pode levar a pagar ou registrar outro valor. Com nomes reais, a página de RFP corta o lado direito dos cartões e o botão "Falar com este parceiro" em 375, Indicações esconde o valor base em 1440 e Atividades reduz nomes a "S…". Viola `wise-design-system` §3 (`tabular-nums`) e §4 (passar em 375 px) e as regras do `break-ui`. Capturas: `comissoes-375.jpg`, `extremo/detalhe/comissoes-375-y0.jpg`, `extremo/detalhe/rfp-publica-375-y0.jpg`, `extremo/detalhe/indicacoes-1440-y0.jpg`.
4. **O kit e os tokens da skill não existem no código** (alto, sistêmico). Nenhuma tela usa `PageHeader`, `HeroMetric`, `KpiTile`, `ChartCard`, `DataTable`, `FilterBar` ou `EmptyState`; há 308 raios soltos, 322 brancos translúcidos, 38 cores da paleta Tailwind, nenhum `tabular-nums` e os estados de carregando, vazio e erro são genéricos. É a causa comum de boa parte dos outros problemas desta lista e precisa vir antes do redesenho das telas. Regra: `wise-design-system` §5, §6 e §9; DESIGN #1 a #15.
5. **Números sem contexto e nenhum gráfico** (alto). Nenhuma das 13 telas tem gráfico: o funil do painel é uma lista invertida sem taxa, a cobertura das categorias é uma pílula repetida em 21 de 22 cartões, Comissões não mostra os próximos 90 dias, Atividades não mostra horas por etapa. Onde há comparação, a seta ignora o sentido ("Saída de parceiros 1, ↗" em menta). No portal, "4 pendentes, 4 atrasadas" engana. Viola `wise-dashboards` §3 e §4, `graficos.md` e o princípio 2 do `PRODUCT.md`. Capturas: `painel-1440.jpg`, `parceiros-categorias-1440.jpg`, `comissoes-1440.jpg`, `portal-inicio-375.jpg`.
6. **A ficha do parceiro esconde o que importa** (alto). A Visão geral é um formulário de cadastro; a régua atrasada há 132 dias, os marcos de onboarding atrasados e o "não cumpre Elite" ficam em abas, enquanto o cabeçalho mostra "Ativo" em menta. Não há próximo passo visível. Viola `mapa-de-telas.md` (Ficha) e o princípio 4. Capturas: `ficha-elite-1440.jpg`, `ficha-elite-nivel-1440.jpg`, `ficha-elite-onboarding-1440.jpg`.
7. **A Início do parceiro não diz como ele está nem leva a indicar** (alto). No celular, a primeira dobra é cadastro estático; o nível não tem herói nem progresso nos três grupos e o risco de rebaixamento fica escondido; não existe "Indicar um cliente" (a ação de destaque leva ao Wise Hub); "Primeiros passos" lista tarefas internas da Wise como se fossem do parceiro. Viola `mapa-de-telas.md` (Início), `wise-dashboards` §3 e o princípio 4. Capturas: `portal-inicio-dobra-375.jpg`, `portal-inicio-375.jpg`.
8. **Listas são pilhas sem paginação, não listas de trabalho** (alto). Indicações despeja 93 linhas sem paginação, busca ou ordenação (18.715 px no celular) e sem bloco "responder hoje" para SLA vencido; Comissões não agrupa por parceiro (que emite uma nota pelo total), não exporta, não marca em lote, a aba "Todas" tem 70.751 px no celular. Com dados em volume (avaliação C), nenhuma lista do portal pagina: Comissões chega a 394.997 px e 28.798 nós, Atividades a 133.641 px, e no Supabase hospedado as consultas acima de 1.000 linhas seriam cortadas sem aviso. Viola `wise-design-system` §5 (`DataTable`) e `wise-dashboards` §3 camada 4. Capturas: `indicacoes-375.jpg`, `a2-comissoes-todas-375.jpg`, `extremo/detalhe/comissoes-todas-375-y0.jpg`.
9. **Edição some sem aviso onde o erro custa dinheiro** (alto). O formulário "Atualizar andamento" da indicação é sobrescrito a cada recarga (`DetalheIndicacao.tsx:172`) e as Configurações descartam o rascunho ao trocar de aba (`Configuracoes.tsx:65` a `:92`). Pode levar a regra de comissão ou andamento errados sem ninguém perceber. Viola `web-design-guidelines` (alterações não salvas) e Nielsen #5.
10. **A página de RFP falha justamente com o cliente** (alto). Erro de rede vira "Este link não está mais disponível", sem "Tentar de novo" e sem contato; o link chega pelo WhatsApp sem prévia (sem Open Graph); as fichas dos parceiros não se comparam (texto livre, grade 2 + 1). É a única vez que esse cliente abre a página. Viola `wise-design-system` §6 e `mapa-de-telas.md` (RFP). Capturas: `rfp-publica-link-invalido-375.jpg`, `rfp-publica-1440.jpg`.

Quase entraram: Configurações com 24 abas planas e jargão de banco (alto); Base Ativa sem encontro atrasado sinalizado e sem os três grupos juntos (alto); pdf-lib de 510 KB gzip carregado no painel, na ficha e em Configurações por um import de formatação (alto); barra lateral com 20 itens sem grupos (médio).

## 6. Portão: o que você precisa marcar

O plano pede: "leia o `diagnostico.md` e marque o que discorda". Para facilitar, responda no chat com:

1. **Os 10 da seção 5:** algum que você tira, rebaixa ou troca por um dos "quase entraram"? Alguma ordem diferente?
2. **Gravidades por tela (seção 3):** algum crítico ou alto que, na sua rotina, não incomoda? Ou algum médio dos relatórios em `partes/` que deveria subir?
3. **Perguntas das telas:** cada tabela da seção 3 abre com a pergunta que a avaliação assumiu para a tela. Se alguma não for a pergunta certa, corrija; ela vira o subtítulo do `PageHeader` na fase 4.

Depois disso começa a fase 2 do plano, que também tem portão: nada de código antes da sua aprovação.
