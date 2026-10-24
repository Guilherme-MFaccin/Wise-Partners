---
name: wise-dashboards
description: Arquitetura de informação, desenho de painéis, escolha de gráficos e camada de dados para telas de indicadores do Portal Wise Partners. Use ao criar ou refazer qualquer tela que mostre números, listas de trabalho, funil, ranking, ROI, maturidade, ou qualquer gráfico, e ao escrever funções SQL ou hooks que alimentam essas telas.
---

# Painéis e visualização de dados do Portal Wise Partners

Complementa a skill `wise-design-system`, que define cores, fontes e componentes. Leia `referencias/mapa-de-telas.md` para saber o que cada tela precisa responder e `referencias/graficos.md` para a escolha de gráfico por indicador.

## 1. O problema que esta skill resolve

A versão 1 do portal mostra tudo do mesmo jeito: uma grade de cards iguais, cada um com um número e uma lista. O olho não sabe por onde começar, nada se compara com nada e não existe gráfico. Toda tela nova ou refeita precisa sair desse padrão.

## 2. Cada tela responde a uma pergunta

Antes de desenhar, escreva a pergunta da tela em uma frase, do ponto de vista de quem usa (exemplo do painel: "O programa está andando para a meta e o que eu preciso fazer hoje?"). A pergunta vai no `PageHeader` como subtítulo e num comentário no topo do componente da página. Bloco que não ajuda a responder a pergunta sai da tela ou vai para uma aba.

## 3. Hierarquia em cinco camadas, sempre nesta ordem

1. **Número principal** (`HeroMetric`): um só. O que define se a semana foi boa.
2. **Indicadores de apoio** (`KpiTile`): 3 a 6, cada um com comparação (período anterior, meta ou média) e, quando fizer sentido, minigráfico.
3. **Explicação** (`ChartCard`): 1 a 3 gráficos que mostram o porquê do número (tendência, composição, onde a conversão cai).
4. **Ação** (listas de trabalho): o que precisa ser feito, ordenado por urgência, com o próximo passo clicável.
5. **Detalhe** (`DataTable` ou aba): os dados completos, filtráveis e exportáveis.

Regras de composição:

* Tamanho do bloco segue a importância. Nunca mais de 6 cards iguais lado a lado.
* Lista de pendências não é indicador: fica na camada 4, com desenho de lista, não de card de número.
* Desktop em grade de 12 colunas: herói de 4 a 6 colunas, KPIs de 3, gráfico principal de 8, gráfico secundário de 4. Celular em coluna única, com herói e KPIs primeiro e gráficos com altura fixa de 220 px.
* Todo número tem contexto: comparação, meta ou referência. Número sozinho só para contagem de pendências.

## 4. Gráficos

* Biblioteca: **shadcn chart** (Recharts) com `ChartContainer` e `ChartConfig`, cores sempre de `--chart-*` (ver `tokens.md` da skill de design). Não instalar outra biblioteca de gráfico sem justificativa no plano.
* Carregar os gráficos com `React.lazy` por rota, para não pesar a primeira tela.
* Escolha pelo que se quer mostrar (detalhes em `graficos.md`): tendência, linha ou área; comparação entre categorias, barra horizontal ordenada; etapa a etapa, funil em barras horizontais com a taxa de passagem entre etapas; parte de um todo com 2 ou 3 partes, barra empilhada de 100%; perfil em vários eixos, radar; distribuição no tempo, mapa de calor de calendário; progresso contra meta, barra de meta (bullet).
* **Proibido**: pizza com mais de 3 fatias, rosca decorativa, 3D, eixo duplo, gráfico sem título de leitura, legenda longe das séries quando há 4 ou menos (use rótulo direto), barras que não começam no zero.
* Uma série em destaque (menta), as demais neutras ou suaves. Meta como linha de referência tracejada com rótulo.
* Eixos discretos: grade horizontal leve, sem grade vertical, rótulos em `--chart-axis`, números abreviados ("12 mil", "R$ 1,2 mi").
* Tooltip em pt-BR com valor, comparação e unidade.
* Acessibilidade: `role="img"` com `aria-label` que resume a leitura, alternância "ver dados" que mostra a tabela, padrões ou rótulos além da cor quando houver mais de 2 séries.

## 5. Interação

* Período e filtros vivem na URL (`?de=&ate=&nivel=`), para compartilhar e voltar.
* Seletor de período padrão por tela, com comparação automática ao período anterior de mesma duração.
* Clicar numa barra, etapa ou fatia leva à lista filtrada correspondente (aprofundamento). Nada é só enfeite.
* Paleta de comandos (`cmdk`, já instalado) com busca de parceiros, indicações e ações rápidas pelo atalho Ctrl ou Cmd mais K.

## 6. Camada de dados

* O banco entrega os números prontos para desenhar. Funções SQL devolvem séries no formato `{ periodo: [{ x, valor }], comparacao: [...], meta }`. Componente não soma, não agrupa e não calcula taxa.
* Um hook por indicador ou por tela (`useIndicador(chave, periodo)`, `usePainelJornada(periodo)`), com chaves de cache padronizadas em `src/lib/chaves.ts`.
* Respostas de RPC validadas com zod antes de chegar à tela; erro de formato vira estado de erro, não tela quebrada.
* Formatação só por `src/lib/formato.ts` (moeda, percentual, número abreviado, datas).
* Prefetch ao passar o mouse em links de lista para fichas e detalhes.
* A RLS continua sendo a fronteira de acesso; o front nunca esconde dado sensível só na interface.

## 7. Verificação

1. Capturas em 375, 768 e 1440 px com dados fictícios em três cenários: vazio, normal e extremo (nomes longos, 200 parceiros, valores de sete dígitos).
2. Conferir cada número da tela com a consulta SQL equivalente.
3. Conferir a leitura do gráfico: o título descreve o que o gráfico mostra.
4. Rodar a crítica e a auditoria de design (Impeccable `critique` e `audit`) e corrigir o que for crítico ou alto.
