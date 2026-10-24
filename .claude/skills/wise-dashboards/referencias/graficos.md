# Gráfico por indicador

Escolha recomendada para os indicadores do Apêndice L do spec 002 e da v1. Todos com shadcn chart (Recharts), exceto onde indicado.

| Indicador | Mostrar | Gráfico | Observação |
|---|---|---|---|
| Parceiros assinados contra meta | Progresso | Barra de meta (bullet) com marca da meta e projeção no ritmo atual | Projeção tracejada até a data da meta |
| Conversão do funil de recrutamento | Etapa a etapa | Barras horizontais decrescentes com a taxa entre etapas ao lado | Não usar o FunnelChart trapezoidal |
| Conversão por origem | Comparação | Barras horizontais agrupadas ou tabela com barra embutida | Ordenar pela taxa |
| Tempo médio até assinatura e até ativação | Valor e tendência | `KpiTile` com minigráfico de linha | |
| Parceiros ativados e não ativados | Composição | Barra empilhada de 100% por mês de assinatura (coorte) | |
| Marcos de 30, 60 e 90 dias | Progresso por parceiro | Tabela com `Stepper` compacto por linha | |
| Pessoas certificadas | Contagem e tendência | `KpiTile` com minigráfico de barras | |
| Ativos sobre assinados | Proporção | `KpiTile` com percentual e barra fina | |
| Satisfação dos parceiros (NPS) | Composição | Barra empilhada de 100% (detratores, neutros, promotores) com o NPS em número | Cores divergentes |
| Régua em dia, ações em dia | Proporção | `KpiTile` com percentual e lista dos atrasados ao clicar | |
| Distribuição por nível e por faixa | Composição | Barras horizontais com cores de nível | Faixa só para internos |
| Saída de parceiros | Tendência | Linha mensal | |
| Clientes fechados no ICP (número principal) | Valor, tendência e meta | `HeroMetric` com área do período e linha do período anterior | |
| Conversão indicação, reunião, proposta, venda | Etapa a etapa | Barras horizontais decrescentes com taxa e tempo médio entre etapas | Clique abre a lista filtrada |
| Indicações dentro do SLA | Proporção e tendência | `KpiTile` com percentual e minigráfico semanal | Meta de 90% como referência |
| Ciclo de venda via parceiro contra direto | Comparação | Duas barras horizontais com rótulo direto | |
| Receita atribuída por parceiro e por nível | Ranking | `BarList` ordenado | |
| Clientes ativos aos 6 e 12 meses | Retenção | Barra empilhada de 100% por marco | |
| Eficiência de vendas | Tendência | Linha mensal | |
| Indicações por semana | Tendência com comparação | Área da série atual e linha suave do período anterior | |
| Indicações por empresa do grupo | Composição no tempo | Barra empilhada por semana ou mês | 3 séries no máximo |
| ROI | Valor e tendência | `HeroMetric` com linha trimestral; aviso da fase | Valor negativo em tom neutro na fase de experimentação |
| Receita contra custo | Decomposição | Cascata (barras flutuantes com Recharts) | Receita, comissões, horas, diretos, resultado |
| Custo por tipo | Composição no tempo | Barra empilhada mensal | |
| ROI por parceiro | Comparação com sinal | Barra horizontal divergente com zero ao centro | |
| Horas por dia | Distribuição no tempo | Mapa de calor de calendário (componente próprio em SVG ou grade CSS) | Escala sequencial menta |
| Horas por etapa e por parceiro | Comparação | Barras horizontais | |
| Maturidade de um parceiro | Perfil | Radar de 8 eixos, escala 1 a 5 | Comparar com a média do programa em linha tracejada |
| Maturidade do programa | Perfil e distribuição | Radar médio e barra empilhada por categoria | |
| Matriz parceiros por eixo | Padrão | Mapa de calor (tabela com fundo sequencial) | |
| Ranking | Ordem | `BarList` com posição e pontos | |
| Comissões nos próximos 90 dias | Linha do tempo | Barras por semana empilhadas por estado | |
| Base Ativa | Agenda | Linha do tempo horizontal (componente próprio) | |
| Categorias com menos de 3 opções | Cobertura | Barra de cobertura por categoria (0 a 3+) | |

## Detalhes de implementação

* Paleta, grade e eixo pelos tokens `--chart-*`.
* Altura padrão: 280 px no desktop, 220 px no celular; minigráficos com 32 px.
* `ResponsiveContainer` dentro do `ChartContainer` do shadcn; animação de entrada de até 300 ms e desligada com `prefers-reduced-motion`.
* Números abreviados nos eixos, valor completo no tooltip.
* Cada gráfico tem a versão em tabela ("ver dados") para leitores de tela e para conferência.
