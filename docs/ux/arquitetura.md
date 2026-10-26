# Arquitetura de informação: Portal Wise Partners

Plano de UX, fase 2, prompt 2.1. Branch `ux-fundacao`. Só documento: nenhum código foi alterado.

Fontes: `docs/ux/diagnostico.md`, skill `wise-dashboards` (com `mapa-de-telas.md` e `graficos.md`), `specs/002-evolucao-metodo-octo/spec.md` (histórias 1 a 15 e Apêndice L), matrizes de permissão dos briefings técnicos da 001 (seção 3) e da 002 (seção 5), rotas em `src/App.tsx` e inventário das funções do banco em `supabase/migrations/`.

Como ler:

* A seção 1 define a navegação. A seção 2 é a referência de cada tela para as fases 4 e 5: pergunta, público, cinco camadas, gráficos e de onde vem cada número. As seções 3 e 4 trazem fluxos e esboços. A seção 5 junta, num lugar só, tudo em que esta arquitetura discorda do mapa de telas da skill, com a proposta.
* **Portão:** aprove ou ajuste (seção 6). Esta arquitetura vira a referência das fases seguintes.

Convenções da seção 2:

* "Existe" quer dizer que a função ou consulta já está no banco e entrega o que o bloco precisa. "Ajustar" quer dizer que existe mas precisa mudar de formato (por exemplo, devolver série com comparação em vez de um número). "Criar" quer dizer que não existe.
* Toda função nova segue a skill `wise-dashboards` §6: devolve `{ periodo: [{ x, valor }], comparacao: [...], meta }` ou lista pronta, nunca dado cru para o componente somar. Toda migração nova é aditiva; nenhuma migração aplicada é editada.
* Toda tela tem os cinco estados (carregando, vazio, erro, parcial, sem permissão), que não se repetem tela a tela abaixo. Só aparecem quando há algo específico.

## 1. Navegação

### 1.1 Papéis

| Papel no banco | Quem | Observação |
|---|---|---|
| `admin` | Guilherme (Gerente de Parcerias), Igor (Diretor, com `is_diretor`) | Só o Diretor aprova assinaturas e desligamentos |
| `parcerias` | Time de parcerias (hoje ninguém: o Guilherme tem papel admin) | Lê configurações, não edita |
| `consultor` | Consultores e gerentes de conta do grupo | Monta RFP, registra indicações, nunca vê comissões |
| `comercial` | Comercial do grupo | Lê parceiros e indicações, cria indicações |
| `financeiro` | Responsável financeiro | Comissões a pagar em diante; lê indicações |
| `parceiro` | Pessoas dos parceiros (uma é a responsável) | Só a própria parceria; único dado de outros: o ranking |

### 1.2 Barra lateral interna, por grupos da rotina

Grupos do `mapa-de-telas.md`. Visibilidade conferida com as duas matrizes de permissão (001, seção 3; 002, seção 5). "Sim" quer dizer que o item aparece; a RLS continua sendo a fronteira, o menu só evita levar alguém a uma tela vazia.

| Grupo | Item (rota) | admin | parcerias | consultor | comercial | financeiro | Conferência com a matriz |
|---|---|---|---|---|---|---|---|
| Hoje | Painel (`/app`) | Sim | Sim | Sim | Não | Não | Indicadores, metas e fase: admin, parcerias e consultor leem; comercial e financeiro não. **Hoje o menu mostra o Painel a todos**: para comercial e financeiro a tela abriria sem os números (ver seção 5, D1) |
| Hoje | Pendências (`/app/pendencias`) | Sim | Sim | Não | Não | Não | Igual ao código atual |
| Parceiros | Parceiros (`/app/parceiros`) | Sim | Sim | Sim | Sim | Sim | Financeiro lê só o básico (a RLS já corta) |
| Parceiros | Base Ativa (`/app/base-ativa`) | Sim | Sim | Sim | Sim | Não | Igual ao código atual |
| Parceiros | Capacitação (`/app/capacitacao`) | Sim | Sim | Sim | Sim | Não | Trilhas: comercial lê; edição só admin |
| Parceiros | Comunicados (`/app/comunicados`) | Sim | Sim | Sim | Não | Não | Consultor só lê |
| Ida ao mercado | Indicações (`/app/indicacoes`) | Sim | Sim | Sim | Sim | Sim | Consultor e comercial sem valores de comissão |
| Ida ao mercado | Ações conjuntas (`/app/acoes`) | Sim | Sim | Sim | Não | Não | Consultor só lê |
| Ida ao mercado | Pedidos de RFP (`/app/rfp`) | Sim | Sim | Sim | Sim | Não | Consultor gere os próprios e lê todos; comercial lê |
| Ida ao mercado | Cruzamento (`/app/cruzamento`) | Sim | Sim | Não | Não | Não | Igual ao código atual |
| Resultado | Resultado do canal (`/app/resultado`) | Sim | Não | Não | Não | Não | Só administradores (FR-004 ampliado) |
| Resultado | Custos (`/app/custos`) | Sim | Não | Não | Não | Não | Só administradores |
| Resultado | Comissões (`/app/comissoes`) | Sim | Sim | Não | Não | Sim | Financeiro: "a pagar" em diante |
| Resultado | Atividades e horas (`/app/atividades`) | Sim | Sim | Sim | Sim | Não | Custo em R$ das horas só para admin (`atividades_custo`) |
| Resultado | Maturidade (`/app/maturidade`) | Sim | Sim | Sim | Não | Não | Consultor só lê |
| Resultado | Ranking e faixas (`/app/ranking`) | Sim | Sim | Sim | Não | Não | Faixas são internas |
| Resultado | Meu painel (`/app/meu-painel`) | Sim | Sim | Não | Não | Não | Metas por pessoa: parcerias vê só as próprias |
| Configurar | Configurações (`/app/configuracoes`) | Sim | Sim (só leitura) | Não | Não | Não | Parcerias lê; a tela precisa de modo leitura explícito |
| Configurar | Usuários (`/app/usuarios`) | Sim | Sim (só convidar parceiros) | Não | Não | Não | |
| Configurar | Importação (`/app/importar`) | Sim | Não | Não | Não | Não | |

Fora da barra: ficha do parceiro e detalhe de RFP (abertos por link), Notificações (sino no topo, com a contagem no nome acessível) e Conta (menu do perfil).

Comportamento:

* Grupos com título e recolhíveis; o grupo da tela atual abre sozinho. Com o papel mais amplo (admin) são 20 itens em 5 grupos, sem rolagem a 1440 x 900.
* **Tela inicial por papel** (proposta, seção 5, D1): admin e parcerias no Painel; consultor em Pedidos de RFP; comercial em Parceiros; financeiro em Comissões.
* **Paleta de comandos** (Ctrl ou Cmd mais K) em todas as telas internas: busca de parceiros, indicações e pedidos de RFP; ações "Registrar contato", "Nova indicação", "Novo pedido de RFP", "Novo parceiro" e "Ir para" qualquer item do menu permitido ao papel.
* **Celular:** barra inferior fixa com 4 destinos e a ação central, no lugar do botão flutuante que hoje cobre filtros e abas (diagnóstico, C6): Início do papel, Parceiros, **Registrar contato** (ação central, só para quem registra: admin, parcerias, consultor), Indicações, Mais (abre a lista agrupada acima). Para consultor, o primeiro destino é Pedidos de RFP.
* Link "Pular para o conteúdo" antes da barra, título do documento por rota ("Indicações, Portal Wise Partners").

### 1.3 Portal do parceiro

O mapa da skill não define a navegação do portal; proposta (seção 5, D8), pelos trabalhos do parceiro:

| Grupo | Itens (rota) | Regra de visibilidade |
|---|---|---|
| (topo) | Início (`/parceiro`) | Todos |
| Vender | Indicar um cliente (`/parceiro/indicar`), Minhas indicações (`/parceiro/indicacoes`), Pedidos de RFP (`/parceiro/rfps`), Cruzamento de carteiras (`/parceiro/cruzamento`) | Cruzamento só para parceiro comercial |
| Minha parceria | Meu nível (`/parceiro/nivel`), Onboarding (`/parceiro/onboarding`), Nossa parceria (`/parceiro/parceria`), Regras do programa (`/parceiro/regras`) | Onboarding só com plano ativo |
| Aprender | Capacitação (`/parceiro/capacitacao`), Materiais e agenda (`/parceiro/materiais`) | Todos |
| Juntos | Ações conjuntas (`/parceiro/acoes`), Comunicados (`/parceiro/comunicados`, com contagem de não lidos), Ranking (`/parceiro/ranking`), Pesquisa de satisfação (`/parceiro/pesquisa`) | Pesquisa aparece em destaque só no trimestre em aberto |
| Minha empresa | Ficha de apresentação (`/parceiro/ficha`), Usuários (`/parceiro/usuarios`) | Usuários só para a pessoa responsável |

Celular (uso principal do parceiro): barra inferior com Início, Indicações, **Indicar** (ação central), Capacitação, Mais. Um só nome para a ação: "Indicar um cliente" (hoje convivem "Indicar" e "Nova indicação").

### 1.4 Páginas públicas

`/r/:token` (página de RFP) e `/i/:token` (link de indicação do parceiro): sem menu, sem conta, vitrine da marca. Entram num pacote de JavaScript próprio, sem o layout interno (diagnóstico B, 97% do JS da RFP é o app inteiro).

## 2. Telas

### 2.0 O que o inventário do banco mostrou

Levantamento de todas as funções em `supabase/migrations/` e de como cada página busca dados. Quatro fatos mudam o desenho:

1. **Nenhuma função devolve série no tempo.** `painel_v2` dá dois pontos por indicador (período e período anterior); `resultado_canal` agrupa por dimensão, nunca por semana ou mês. Todo minigráfico, área do herói e gráfico de tendência precisa de função nova.
2. **21 dos 40 indicadores do `painel_v2` ignoram o período** (são estoque de hoje: assinados contra meta, régua em dia, distribuição por nível e outros), então o "anterior" sai igual ao valor. A comparação que a skill exige é falsa nesses indicadores. Proposta: tabela `retratos_indicadores` (data, chave, valor), gravada pela `rotina_diaria`, que vira a fonte das séries e das comparações de estoque. A história começa a contar do dia em que a rotina passar a gravar.
3. **Muita conta no componente.** As piores: Pendências refaz no cliente a régua e o SLA lendo 16 tabelas (`Pendencias.tsx:437-485`), porque `pendencias_diarias` só roda pelo servidor; Indicações recalcula o SLA (`indicacoes/dados.ts:140-169`) e usa 15 dias fixos para "parada" quando o banco tem a configuração `indicacao_parada_dias`; Atividades, Maturidade, Comissões, Capacitação, Cruzamento e o quadro do funil somam e agrupam no cliente.
4. **Nenhuma lista pagina no servidor.** No Supabase hospedado, acima de 1.000 linhas a consulta é cortada sem aviso (diagnóstico C). Indicações, Comissões, Atividades e Parceiros passam a usar consulta paginada com contagem exata.

Também não existe `src/lib/chaves.ts` (chaves de cache) nem validação com zod das respostas: as duas entram na fase 3.

Legenda da coluna "Fonte": **Existe**, **Ajustar** ou **Criar**, como nas convenções acima. Nomes de funções novas são propostas.

### 2.1 Painel (`/app`)

* **Pergunta:** o programa está andando para a meta e o que eu preciso fazer hoje?
* **Público:** admin e parcerias (todo o conteúdo); consultor (lê, sem a aba Resultado).

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Herói | Clientes fechados no ICP via parceiros no trimestre, contra o anterior e a meta | Área do período e linha do anterior | Valor: **Existe** (`painel_v2`, chave `clientes_icp`). Série: **Criar** `indicador_serie(chave, inicio, fim, grao)` |
| Apoio | Assinados contra meta; parceiros ativados; indicações qualificadas; dentro do SLA (%) | Bullet com projeção (assinados); minigráficos semanais | Valores: **Existe** (`painel_v2`). Comparação dos de estoque e minigráficos: **Criar** (`retratos_indicadores` e `indicador_serie`). Projeção: **Criar** (campo `projecao` na série) |
| Ação | "O que fazer hoje": aprovações (as do Diretor primeiro), SLA vencido, follow-ups vencidos, régua atrasada, negociações paradas, contrapartidas atrasadas, marcos atrasados; 8 primeiros | Nenhum (lista) | **Criar** `minhas_pendencias(p_parceiro uuid = null)`: lista ordenada por urgência `{tipo, parceiro, titulo, atraso_dias, acao, link}`, com a RLS de quem pede. Substitui as listas de `painel_semanal` e o cálculo no cliente de Pendências |
| Ação | Fase do programa e critérios da próxima | Barras de progresso por critério | **Existe** (`sugerir_fase`) |
| Explicação | Abas por etapa com os indicadores em destaque do Apêndice L e dois gráficos por aba (seção 4.1) | Funil de recrutamento e de indicações em barras horizontais com taxa; coorte de ativação em barra de 100%; NPS em barra de 100%; distribuição por nível | Indicadores: **Existe** (`painel_v2`). Funis com taxa e tempo entre etapas: **Criar** `funil_recrutamento(inicio, fim)` e `funil_indicacoes(inicio, fim, empresa)`. Coorte: **Criar** `coorte_ativacao()`. NPS: **Ajustar** (expor `nps` por período, hoje revogada) |
| Detalhe | Todos os indicadores; Pauta da semana | Nenhum | Lista: **Existe** (`painel_v2`). Pauta: **Ajustar** (hoje montada no cliente em `painel/pauta.ts`; vira `pauta_semana()` no banco, aproveitando `relatorio_semanal_v2`) |

### 2.2 Pendências (`/app/pendencias`)

* **Pergunta:** o que está atrasado ou esperando por mim, em ordem de urgência?
* **Público:** admin e parcerias.
* Camadas: apoio com contagem por tipo (fichas de filtro); ação é a tela inteira (a mesma lista do Painel, completa, com filtro por tipo, responsável e parceiro, e ação na linha); detalhe ao abrir cada item.
* Fonte: **Criar** `minhas_pendencias` (a mesma do Painel). Remove o cálculo de régua e SLA no cliente.

### 2.3 Parceiros (`/app/parceiros`: categorias, funil, lista)

* **Pergunta:** como está a carteira e onde cada parceiro está?
* **Público:** todos os internos (financeiro com o básico).

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Apoio | Assinados contra a meta de 100; ativados; em negociação; categorias com menos de 3 assinados (de 22) | Bullet nos assinados | **Criar** `carteira_resumo()` |
| Explicação, categorias | Cartão por categoria com barra de cobertura (0, 1, 2, 3 ou mais assinados), ordenado da menor cobertura para a maior; até 8 nomes e "Ver os N" | Barra de cobertura de 3 segmentos | **Criar** `cobertura_categorias()`. Hoje `VisaoCategorias.tsx:79` conta no cliente |
| Explicação, funil | Colunas na ordem do funil com contagem e dias médios na etapa; rolagem por coluna | Nenhum além da contagem | **Criar** `funil_recrutamento` (a mesma do Painel, com tempo médio por etapa). Hoje `QuadroFunil.tsx:28-72` conta no cliente |
| Detalhe, lista | `DataTable` com filtros salvos (nível, faixa, maturidade, status, responsável, categoria) na URL, paginação no servidor e exportação | Nenhum | **Ajustar**: consulta paginada com contagem (`range` e `count=exact`) em vez de `useCarteira` com a carteira inteira |

### 2.4 Ficha do parceiro (`/app/parceiros/:id`)

* **Pergunta:** o que eu preciso saber e fazer com este parceiro agora?
* **Público:** todos os internos (o que cada um lê está na matriz; ROI e horas só admin).

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Cabeçalho | Nome, nível, etapa, status de atividade, responsável, próximo passo, "Registrar contato" | Nenhum | Dados: **Existe** (`useParceiro`, `proximos_passos`) |
| Ação | Faixa de alertas: régua atrasada, marcos atrasados, abaixo dos requisitos do nível, contrapartidas e ações atrasadas, indicações com SLA vencido | Nenhum | **Criar**: `minhas_pendencias(p_parceiro)` (a mesma função, filtrada pelo parceiro) |
| Herói e apoio (aba Resumo) | Indicações e clientes fechados em 12 meses, taxa de conversão, valor atribuído | Barras mensais | **Criar** `parceiro_resultado_mensal(p_parceiro)`. Hoje `AbaIndicacoes.tsx:50-59` calcula as taxas no cliente |
| Explicação (aba Resumo) | Nível com os três grupos e o que falta; marcos do onboarding; régua (última e próxima reunião); radar de maturidade com a média do programa | `Stepper`; radar pequeno | Nível e régua: **Existe** (`situacao_nivel`). Marcos: **Existe** (`planos_onboarding`, `marcos_onboarding`). Radar: **Existe** (`avaliacoes_maturidade`); média do programa: **Criar** `maturidade_programa()` |
| Explicação (só admin) | Horas e ROI do parceiro | `KpiTile` | **Ajustar** `resultado_canal`: aceitar `p_parceiro` para não trazer a carteira inteira |
| Detalhe | Abas: Linha do tempo, Indicações (paginada), Ações conjuntas, Nível e revisões, Onboarding, Maturidade, Scorecard, Contrato, Dados e cadastro, Documentos | Conforme a aba | **Existe**, com paginação a **Ajustar** na aba Indicações |

### 2.5 Indicações (`/app/indicacoes`)

* **Pergunta:** as indicações estão virando clientes e a Wise está respondendo no prazo?
* **Público:** todos os internos; valores de comissão só admin e parcerias; financeiro lê.

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Herói | Clientes fechados no ICP vindos de indicações no período, contra o anterior; recorte por empresa do grupo | Área com linha do anterior | **Criar** `indicacoes_resumo(inicio, fim, empresa)` e `indicador_serie` |
| Apoio | Indicações; qualificadas (%); dentro do SLA (%); ciclo médio de venda; nota média de qualidade | Minigráficos semanais | **Criar** `indicacoes_resumo` (valores e comparação) |
| Explicação | Funil indicação, reunião, proposta, venda com taxa e tempo; indicações por semana com o período anterior; por empresa do grupo | Barras horizontais; área e linha; barra empilhada por semana | **Criar** `funil_indicacoes` e `indicacoes_por_semana(inicio, fim)` |
| Ação | "Responder hoje": SLA vencendo hoje ou vencido e paradas há mais de N dias (configuração), com a ação na linha | Nenhum | **Criar** `minhas_pendencias` (tipos SLA e parada). Remove o SLA refeito no cliente (`dados.ts:140-169`) e os 15 dias fixos (`dados.ts:121-126`) |
| Detalhe | `DataTable` paginada no servidor, busca por cliente, ordenação, filtros na URL, exportação; linha focável que abre o detalhe lateral | Nenhum | **Criar** view `v_indicacoes_lista` com estado do SLA e "parada" calculados no banco; paginação com contagem |

### 2.6 Comissões (`/app/comissoes`)

* **Pergunta:** quanto devemos pagar e receber, e quando?
* **Público:** admin, parcerias, financeiro (a pagar em diante).

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Herói | A pagar agora: valor e número de parceiros | Nenhum | **Criar** `comissoes_resumo(inicio, fim)` |
| Apoio | Pagas no período; a receber; recebidas no período (contra o anterior) | Minigráficos | **Criar** `comissoes_resumo`. Hoje `Comissoes.tsx:85-95` soma no cliente |
| Explicação | Próximos 90 dias por semana, empilhado por estado | Barras empilhadas por semana | **Criar** `comissoes_linha_tempo(dias)`. A tabela `comissoes` não guarda data prevista (só `a_pagar_em`, `nf_recebida_em` e `paga_em`): a previsão sai da regra de cada empresa e da data de fechamento da indicação, ou de uma coluna nova `previsto_em` |
| Ação | A pagar agrupado por beneficiário, com subtotal, dados de nota fiscal e "Marcar como paga" em lote | Nenhum | **Criar** `comissoes_a_pagar_por_beneficiario()`; marcar em lote: **Ajustar** (`atualizar_estado_comissao` aceita um id; criar a versão em lote na mesma transação) |
| Detalhe | `DataTable` por estado, paginada, exportação CSV | Nenhum | **Ajustar**: paginação com contagem |

### 2.7 Base Ativa (`/app/base-ativa`)

* **Pergunta:** quem está no ciclo, quem está na fila, quando cada um começa e o que vence esta semana?
* **Público:** admin, parcerias, consultor, comercial.

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Apoio | Em ciclo; na fila; encontros nesta semana; encontros atrasados | Nenhum | **Criar** `base_ativa_agenda()` |
| Ação | Encontros atrasados (âmbar, "Registrar resultado") e dos próximos 7 dias | Nenhum | **Criar** `base_ativa_agenda` (inclui o estado "atrasado", que hoje não existe) |
| Explicação | Linha do tempo de 12 semanas por parceiro em ciclo (6 encontros e o evento, hoje marcado); fila ordenada com previsão de início | Linha do tempo horizontal (componente próprio) | Ciclos e encontros: **Existe** (`ciclos_base_ativa`, `base_ativa_encontros`). Fila: **Existe** (`v_fila_base_ativa`) |
| Detalhe | Suspensos e concluídos, recolhidos | Nenhum | **Existe** |

### 2.8 Atividades e horas (`/app/atividades`)

* **Pergunta:** onde o tempo da equipe está indo?
* **Público:** admin, parcerias, consultor, comercial; custo em R$ só admin.

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Herói | Horas no período contra o anterior | Área | **Criar** `horas_serie(inicio, fim, grao)` |
| Apoio | Atividades; horas por parceiro ativo; parceiros sem contato no período; custo das horas (só admin) | Nenhum | **Criar** `horas_resumo(inicio, fim)` |
| Explicação | Horas por etapa da jornada por semana; horas por parceiro (aprofunda para a lista filtrada); mapa de calor por dia | Barra empilhada; barras horizontais; calendário em escala menta | **Criar** `horas_por(inicio, fim, agrupar)` e `horas_por_dia(inicio, fim)`. Hoje `Atividades.tsx:85-113` agrupa e soma no cliente |
| Detalhe | Lista de atividades paginada, com filtros e exportação | Nenhum | **Ajustar**: paginação com contagem |

### 2.9 Resultado do canal (`/app/resultado`, só admin)

* **Pergunta:** o canal de parcerias se paga?

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Aviso | Fase do programa e o que é esperado nela; critérios que faltam | Nenhum | **Existe** (`resultado_canal.fase`, `sugerir_fase`) |
| Herói | ROI do período | Linha trimestral | Valor: **Existe** (`resultado_canal`). Série: **Criar** `resultado_canal_serie(inicio, fim, grao)` |
| Apoio | Receita atribuída; custo total; custo por cliente no ICP; tempo de retorno | Nenhum | **Existe** (`resultado_canal.total`); comparação com o período anterior: **Ajustar** (devolver `anterior`) |
| Explicação | Cascata receita, comissões, horas, custos diretos, resultado; custo por tipo por mês; ROI por parceiro | Cascata; barra empilhada mensal; barra divergente | Cascata: **Existe** (componentes do `total`). Por mês: **Criar** (`resultado_canal_serie`). Por parceiro: **Existe** (`p_agrupar = 'parceiro'`) |
| Ação | Parceiros com mais horas e nenhum resultado no período | Nenhum | **Ajustar**: `resultado_canal` por parceiro já traz horas e clientes; acrescentar o filtro no banco |
| Detalhe | Tabela por recorte (parceiro, nível, origem, empresa, modelo de atuação) com exportação | Nenhum | **Existe** (`resultado_canal` com `p_agrupar`; `planilha_custos` para exportar) |

### 2.10 Custos (`/app/custos`, só admin)

* **Pergunta:** para onde está indo o investimento do programa?
* Apoio: total por tipo (horas, comissões, diretos) contra o período anterior, **Ajustar** `resultado_canal` (devolver `anterior`). Explicação: horas por etapa por mês e mapa de calor de horas por dia, **Criar** (`horas_por`, `horas_por_dia`, as mesmas de Atividades). Detalhe: planilha de custos em `DataTable` com filtros e exportação, **Existe** (`planilha_custos`); remunerações e custos diretos em abas, **Existe**.

### 2.11 Maturidade (`/app/maturidade`)

* **Pergunta:** em que eixos o programa e cada parceiro estão fracos?
* **Público:** admin, parcerias, consultor.
* Herói: radar médio dos parceiros comerciais assinados. Explicação: distribuição por categoria (fundação, desenvolvimento, escala) em barra empilhada; matriz parceiros por eixo como mapa de calor. Ação: parceiros sem avaliação ou com avaliação antiga. Detalhe: lista com filtro por categoria.
* Fonte: **Criar** `maturidade_programa()` (radar médio, distribuição, matriz, sem avaliação). Hoje `Maturidade.tsx:67-97` calcula tudo no cliente.

### 2.12 Ranking e faixas (`/app/ranking`)

* **Pergunta:** quem está gerando mais resultado neste ano e trimestre?
* **Público:** admin, parcerias, consultor.
* Apoio: quantos em cada faixa (destaque, potencial, base). Explicação: `BarList` com posição e pontos, faixa como selo interno. Detalhe: premiações do ano.
* Fonte: ranking **Existe** (`ranking`); contagem por faixa **Ajustar** (hoje `Ranking.tsx:64-70` no cliente; devolver junto); premiações **Existe**.

### 2.13 Ações conjuntas (`/app/acoes`)

* **Pergunta:** o que está combinado com cada parceiro e o que está atrasado?
* **Público:** admin, parcerias; consultor lê.
* Apoio: ações em dia (%), atrasadas da Wise, atrasadas do parceiro. Ação: atrasadas dos dois lados, com "Concluir" ou "Cobrar". Explicação: calendário mensal com lado por cor e estado por ícone. Detalhe: lista filtrável.
* Fonte: **Existe** (`v_acoes_conjuntas`, `concluir_acao_wise`); percentual em dia: **Existe** no `painel_v2` (`acoes_em_dia`), com série a **Criar** pelos retratos.

### 2.14 Meu painel (`/app/meu-painel`)

* **Pergunta:** estou batendo as minhas metas do trimestre?
* **Público:** admin e parcerias (cada um a própria carteira; admin escolhe a pessoa).
* Apoio: realizado contra meta em bullet para assinados, ativados, clientes no ICP e receita. Ação: régua da carteira (atrasados primeiro). Detalhe: carteira e horas.
* Fonte: **Existe** (`painel_pessoal`); projeção no ritmo atual: **Ajustar** (calcular no banco, hoje `MeuPainel.tsx:119` faz o percentual no cliente).

### 2.15 Demais telas internas

Telas de trabalho sem indicadores. Mesmo assim, cada uma abre com `PageHeader` e a pergunta.

| Tela | Pergunta | Público | Desenho | Fonte |
|---|---|---|---|---|
| Pedidos de RFP (`/app/rfp`) | Quais pedidos estão abertos e algum cliente já clicou? | Admin, parcerias, consultor (os próprios em destaque), comercial lê | Apoio: abertos, publicados, cliques na semana. Ação: "Novo pedido"; páginas a vencer. Detalhe: lista com cliques e aberturas por pedido | Lista: **Existe** (`pedidos_rfp`, `paginas_rfp`). Contagens: **Ajustar** (hoje `Rfps.tsx:53-57` soma cliques no cliente; criar `pedidos_rfp_resumo()`) |
| Detalhe de RFP (`/app/rfp/:id`) | Esta página está pronta para o cliente? | Quem gere o pedido | Etapas: cliente e necessidade, escolha por categoria em fichas comparáveis, texto, pré-visualização (celular, computador, prévia do WhatsApp), publicar | **Existe** (`rfp_candidatos`, `publicar_pagina_rfp`, `renovar_pagina_rfp`, `revogar_pagina_rfp`) |
| Capacitação (`/app/capacitacao`) | Os parceiros estão se capacitando? | Admin edita; parcerias, consultor e comercial leem | Apoio: pessoas certificadas (contra o trimestre anterior), parceiros com ao menos 1 certificado. Detalhe: trilhas, progresso por parceiro, certificados | Trilhas: **Existe**. Progresso: **Criar** `capacitacao_resumo()` (hoje `ProgressoTrilha.tsx:36-84` no cliente) |
| Comunicados (`/app/comunicados`) | O que já foi comunicado e quem leu? | Admin e parcerias escrevem; consultor lê | Lista com taxa de leitura; editor com público (todos ou recorte) e pré-visualização | **Existe** (`comunicados`, `enviar_comunicado`); taxa de leitura **Ajustar** (view `v_comunicados_resumo`) |
| Cruzamento (`/app/cruzamento`) | Quais coincidências viram oportunidade? | Admin, parcerias | Apoio: coincidências por quadrante. Ação: coincidências sem decisão. Detalhe: cruzamentos por parceiro | **Existe** (`coincidencias_cruzamento`, `decidir_coincidencia`); somas **Ajustar** (hoje no cliente) |
| Configurações (`/app/configuracoes`) | Quais são as regras do programa e o que muda se eu alterar uma? | Admin edita; parcerias lê | Navegação lateral em 6 grupos com busca (Comissões e empresas; Níveis e requisitos; Jornada e régua; Indicações e SLA; Resultado e metas; Sistema); valor atual em linguagem de negócio; aviso de alteração não salva; publicação com vigência | **Existe** (tabelas de catálogo, `configuracoes`, `publicar_regras`) |
| Usuários (`/app/usuarios`) | Quem tem acesso e com qual papel? | Admin; parcerias convida parceiros | Lista com papel e situação; convite | **Existe** |
| Importação (`/app/importar`) | Os parceiros atuais entraram sem erro? | Admin | Passos: arquivo, conferência linha a linha, resultado | **Existe** |
| Notificações e Conta | O que mudou para mim? / Meus dados e alertas | Todos | Lista agrupada por dia; preferências de alerta | **Existe** |

### 2.16 Portal do parceiro, Início (`/parceiro`)

* **Pergunta (do parceiro):** como está a nossa parceria e o que eu faço agora?
* **Público:** pessoas do parceiro (o responsável vê também os usuários).

| Camada | Conteúdo | Gráfico | Fonte |
|---|---|---|---|
| Herói | Nível pelo nome, estado (em dia ou em risco até a revisão) e os três grupos de requisitos | `Stepper` | **Existe** (`meu_nivel`: `atual`, `acima`, `em_observacao_ate`). Data da próxima revisão: **Ajustar** (acrescentar `proxima_revisao`) |
| Apoio | Indicações feitas no ano contra o anterior; clientes fechados e taxa; comissões recebidas e a receber | Nenhum | **Criar** `minha_parceria_resumo(ano)`. Hoje `Inicio.tsx:52-64` conta no cliente e soma conjuntos que não se somam (diagnóstico A3) |
| Ação | Indicar um cliente (barra inferior); "Para fazer agora": comprovar ação, responder pesquisa, comunicados novos, trilha em andamento | Nenhum | **Criar** `minhas_pendencias_parceiro()` |
| Explicação | Onboarding em andamento ("O que a Wise está preparando para vocês" e marcos); ações da semana dos dois lados | `Stepper` | **Existe** (`usePlanoOnboarding`, `useAcoesWise`, `useMinhasContrapartidas`) |
| Detalhe | Nossa parceria resumida, recolhida | Nenhum | **Existe** |

### 2.17 Portal do parceiro, Minhas indicações (`/parceiro/indicacoes`)

* **Pergunta:** como estão as minhas indicações e quanto eu ganho com elas?
* Apoio: feitas no ano contra o anterior, clientes fechados, comissão a receber e recebida, **Criar** (`minha_parceria_resumo`, a mesma da Início). Ação: "Precisam da sua atualização" (recebidas sem atualização há N dias), **Criar** (view `v_minhas_indicacoes` com `proximo_passo` e `parada`). Detalhe: abas Feitas e Recebidas, com a linha "Agora: ..." em cada cartão, busca e paginação, **Ajustar**.

### 2.18 Portal do parceiro, demais telas

| Tela | Pergunta | Desenho | Fonte |
|---|---|---|---|
| Meu nível | O que falta para subir e o que me mantém no nível? | Herói com o nível e o estado; requisitos do próximo nível com quantidade e a ação ao lado; data da próxima revisão | **Existe** (`meu_nivel`); `proxima_revisao` a **Ajustar** |
| Onboarding | Em que ponto estamos dos 90 dias? | `Stepper` com encontros e marcos; o que é da Wise e o que é do parceiro, separados | **Existe** (`planos_onboarding`, `marcos_onboarding`) |
| Nossa parceria | O que combinamos? | Pacote, benefícios, responsável na Wise, modelo de atuação e proposta de valor, com "Propor alteração" | **Existe** (`parceiros`, `propostas_ficha`) |
| Regras do programa | Quais são as regras e o que muda? | Regra vigente e a próxima com data de vigência, em linguagem do parceiro | **Existe** (`regras_publicadas`) |
| Indicar um cliente | Como indico agora? | Duas saídas: preencher (3 passos, tela cheia) ou mandar o link exclusivo (copiar, WhatsApp, QR) | **Existe** (`registrar_indicacao`, `links_indicacao`) |
| Pedidos de RFP | Em que pedidos fui apresentado e houve clique? | Lista com cliente, data, necessidade resumida, aberturas e cliques | **Existe** (`meus_rfps`) |
| Cruzamento | Quantas oportunidades temos em comum? | Termo, envio do arquivo, totais por quadrante, histórico com exclusão | **Existe** (`situacao_cruzamento` e afins) |
| Capacitação e Trilha | Quem já está certificado e o que falta? | Trilhas com progresso por pessoa; módulo, teste e certificado | **Existe**; percentuais **Ajustar** (hoje `Capacitacao.tsx:46-141` no cliente) |
| Materiais e agenda | O que posso usar para vender e quando é a próxima mentoria mensal? | Agenda primeiro, materiais por empresa do grupo depois | **Existe** |
| Ações conjuntas | O que combinamos e o que eu preciso comprovar? | Atrasadas e a comprovar primeiro; calendário depois | **Existe** |
| Comunicados | O que a Wise avisou? | Não lidos primeiro; marcar como lido ao abrir | **Existe** |
| Ranking | Em que posição estamos? | Top 10 e a própria linha destacada; premiações | **Existe** (`ranking`, `premiacoes_publicas`) |
| Pesquisa | Como avalio a parceria neste trimestre? | Nota de 0 a 10 e comentário, uma vez por trimestre | **Existe** (`responder_pesquisa`) |
| Ficha de apresentação | Como a minha empresa aparece para os clientes? | Campos da categoria com pré-visualização do cartão da RFP; proposta de alteração | **Existe** |
| Usuários | Quem da minha empresa tem acesso? | Só a pessoa responsável; convidar e desativar | **Existe** |

### 2.19 Páginas públicas

| Tela | Pergunta | Desenho | Fonte |
|---|---|---|---|
| Página de RFP (`/r/:token`) | Quais são as opções para o meu problema e com quem eu falo? | Topo com a marca e o título em Baloo 2; introdução; por categoria, fichas comparáveis (cidade e UF, porte atendido, nível pelo nome, prazo típico, experiência no setor, mesmos campos na mesma ordem); "Falar com este parceiro" sempre visível; aviso da relação comercial; contato do consultor fixo. Erro de rede separado de link vencido, com "Tentar de novo" e contato da Wise | Página: **Existe** (Edge `rfp-publica`, `rfp_pagina_publica`). Campos fixos nas fichas: **Ajustar** (incluir cidade, UF e os campos da categoria nos blocos publicados). Prévia no WhatsApp: **Criar** (metas Open Graph) |
| Link de indicação (`/i/:token`) | Como indico um cliente para a Wise por este parceiro? | Logo do parceiro e da Wise; formulário em passos; consentimento; confirmação neutra | **Existe** (Edge `indicacao-publica`) |
| Entrar (`/entrar`) | Como entro no portal? | Link mágico por e-mail; mensagem clara de link enviado e de link vencido | **Existe** |

### 2.20 Funções e mudanças no banco, em resumo

Tudo em migração nova e aditiva, com teste de RLS por papel, na fase 3:

* **Séries:** tabela `retratos_indicadores` (gravada pela `rotina_diaria`); `indicador_serie(chave, inicio, fim, grao)`; `resultado_canal_serie(inicio, fim, grao)`; `horas_serie`.
* **Resumos por tela:** `carteira_resumo`, `cobertura_categorias`, `indicacoes_resumo`, `comissoes_resumo`, `base_ativa_agenda`, `horas_resumo`, `maturidade_programa`, `capacitacao_resumo`, `pedidos_rfp_resumo`, `minha_parceria_resumo`.
* **Explicação:** `funil_recrutamento`, `funil_indicacoes`, `indicacoes_por_semana`, `coorte_ativacao`, `comissoes_linha_tempo`, `horas_por`, `horas_por_dia`, `parceiro_resultado_mensal`.
* **Ação:** `minhas_pendencias(p_parceiro)` (Painel, Pendências, ficha e Indicações), `minhas_pendencias_parceiro()` (portal), `comissoes_a_pagar_por_beneficiario`, marcar comissões como pagas em lote, `pauta_semana`.
* **Listas paginadas:** views `v_indicacoes_lista` e `v_minhas_indicacoes`, mais paginação com contagem em Parceiros, Comissões e Atividades.
* **Ajustes:** `anterior` em `resultado_canal`; `p_parceiro` em `resultado_canal`; `proxima_revisao` em `meu_nivel`; contagem por faixa em `ranking`; NPS por período; campos fixos nos blocos da RFP.
* **Segurança (achado do inventário):** `atualizar_estrategico_sugerido(p_parceiro)` é `security definer`, muda estado e nunca teve a execução revogada (`20261023000004_regras.sql:289`): hoje qualquer usuário logado pode chamá-la. O efeito é pequeno (recalcula a sugestão de estratégico a partir dos dados), mas a revogação entra na primeira migração da fase 3.

## 3. Fluxos principais

Cada fluxo diz o passo, a tela e o que precisa existir. Meta de cada um entre parênteses.

### 3.1 Registrar contato pelo celular (Guilherme, entre reuniões; menos de 1 minuto)

1. Em qualquer tela interna, toca em **Registrar contato** no centro da barra inferior (ou Ctrl ou Cmd mais K, "Registrar contato", no computador; ou o botão no cabeçalho da ficha, já com o parceiro escolhido).
2. Abre uma folha de baixo para cima. O campo de parceiro já vem focado, com os **recentes** e os **esfriando** primeiro; busca por nome fantasia ou razão social.
3. Escolhe o canal em botões grandes (WhatsApp, ligação, reunião, e-mail, evento). Data e hora já vêm como agora; o esforço vem sugerido pelo catálogo de atividades (Apêndice N) e pode ser ajustado.
4. Escreve o resumo num campo só. Opcional: "Próximo passo" com data sugerida (hoje mais 7 dias) e responsável (ele mesmo).
5. **Salvar** fecha a folha e mostra um aviso com "Desfazer" e "Abrir ficha". O parceiro sai da lista "esfriando" do painel na hora.

Requisitos: rascunho preservado se a rede cair ou a folha fechar sem querer; teclado do celular sem zoom (fonte de 16 px nos campos); nenhum campo obrigatório além de parceiro, canal e resumo.

### 3.2 Preparar a reunião semanal (Guilherme com Igor; 10 minutos)

1. Segunda de manhã chega o relatório semanal por e-mail com o número principal, o ROI e os indicadores em destaque (FR-141), com link para o Painel.
2. No **Painel**, o herói e os KPIs mostram o trimestre contra o anterior e a meta; o bloco "O que fazer hoje" mostra primeiro o que só o Diretor resolve (aprovações de assinatura e desligamento).
3. **Pauta da semana** (botão no cabeçalho do Painel) monta a pauta: decisões do Diretor, números da semana por etapa, parceiros em risco e em observação, propostas de rebaixamento, régua atrasada, critérios da próxima fase do programa.
4. Na reunião, Igor aprova ou recusa direto na pauta (com motivo quando recusa); cada decisão vira registro na ficha do parceiro.
5. A pauta é exportada em PDF ou copiada como texto para o WhatsApp; as decisões viram próximos passos com data.

### 3.3 Montar uma página de RFP (consultor; durante ou logo depois da reunião com o cliente)

1. **Pedidos de RFP** (tela inicial do consultor) → "Novo pedido". Preenche cliente, necessidade em uma frase e as categorias.
2. Para cada categoria, o portal lista os **parceiros assinados elegíveis** em fichas comparáveis (cidade e UF, porte atendido, nível pelo nome, experiência no setor). O consultor marca de 3 em diante; com menos de 3 elegíveis, a tela explica por quê (regra IV.2 da constituição) e não deixa recomendar nome único.
3. Escreve a introdução para o cliente (com sugestão gerada e editável) e escolhe a validade do link.
4. **Pré-visualiza como o cliente** em celular e computador, com a prévia do WhatsApp (título, descrição e imagem).
5. **Publica**: copia o link ou envia pelo WhatsApp. O pedido mostra visualizações e cliques por parceiro; o clique em "Falar com este parceiro" gera a indicação, que entra no SLA (FR-087).

### 3.4 Parceiro indicando um cliente (parceiro, no celular; 2 minutos)

1. Na **Início**, toca em **Indicar um cliente** (centro da barra inferior, sempre à vista).
2. Escolhe entre "Preencher agora" e "Mandar meu link para o cliente" (copiar, WhatsApp ou QR Code do link exclusivo).
3. "Preencher agora" abre um formulário em tela cheia, em 3 passos com progresso: empresa (nome, cidade, CNPJ opcional); necessidade e empresa do grupo (Wise Makers, Tríade, Swallow); perguntas do ICP e consentimento. Rótulos sempre visíveis, nunca só no placeholder.
4. Ao enviar, a confirmação diz o que acontece agora ("A Wise valida em até N dias úteis e você recebe um aviso") e que a indicação fica protegida por 180 dias. Se o cliente já está protegido por outra indicação, a mensagem diz isso sem expor o outro parceiro.
5. A indicação aparece em **Minhas indicações** no bloco "Em andamento", com a linha "Agora: a Wise valida até DD/MM".

### 3.5 Parceiro vendo o que falta para subir de nível (parceiro; 30 segundos)

1. Na **Início**, o herói mostra o nível pelo nome (Elite, Premium, Select), o estado ("em dia" ou "em risco até a revisão de DD/MM") e os três grupos de requisitos como etapas: resultado, capacitação e regras, cada um "cumprido" ou "falta".
2. Toca em **Ver o que falta** e abre **Meu nível**: para o próximo nível, cada requisito com quantidade ("Faltam 2 indicações qualificadas em 180 dias", "Falta 1 pessoa certificada", "Contrapartidas em dia: sim").
3. Cada requisito que falta tem a ação ao lado: "Indicar um cliente", "Fazer a trilha", "Comprovar ação".
4. A tela mostra a data da próxima revisão trimestral e, se o parceiro estiver em observação, até quando e o que evita o rebaixamento.
5. Quando cumpre tudo, sobe na hora (US4): aviso no portal e por e-mail, e a Início mostra o novo nível na próxima visita.

## 4. Esboços em texto (grade de 12 colunas)

Notação: `[n]` é a largura em colunas a 1440 px. No celular (375 px) tudo vira coluna única, na ordem listada, com gráficos de 220 px de altura.

### 4.1 Painel (`/app`)

```text
[12] PageHeader  "Painel" | O programa está andando para a meta e o que eu preciso fazer hoje?
                 à direita: período (padrão: trimestre atual, compara com o anterior) · Pauta da semana
[6]  HeroMetric  Clientes fechados no ICP via parceiros      [3] KpiTile Assinados x meta (bullet com projeção)
                 3 · meta 8 · +1 sobre o trimestre anterior    [3] KpiTile Parceiros ativados
                 área do período e linha do anterior           [3] KpiTile Indicações qualificadas
                                                               [3] KpiTile Dentro do SLA (%) com meta de 90%
[8]  O que fazer hoje (lista única por urgência)              [4] Fase do programa
     filtro por tipo: aprovações · SLA · follow-up ·               Experimentação → Tração
     régua · paradas · contrapartidas                              5 ativados: 3 de 5
     linha: ícone · parceiro · atraso em dias · ação               3 clientes no ICP: 3 de 3
     8 primeiros + "Ver todas em Pendências (71)"                  5 respostas NPS: 2 de 5
[12] Abas por etapa: Captação · Onboarding · Relacionamento · Produção · Resultado (só admin)
     dentro de cada aba:
     [8] ChartCard principal da etapa                          [4] ChartCard secundário
     [4][4][4] até 6 KpiTile em destaque da etapa (Apêndice L), em 2 linhas
[12] Rodapé: "Todos os indicadores" (DataTable: indicador, valor, anterior, meta, etapa; exportação)
```

Gráficos por aba: Captação, funil de recrutamento em barras horizontais com taxa (principal) e conversão por origem (secundário); Onboarding, coorte de ativados e não ativados por mês de assinatura (principal) e marcos de 30, 60 e 90 dias (secundário); Relacionamento, distribuição por nível e faixa (principal) e NPS em barra de 100% (secundário); Produção, funil indicação, reunião, proposta e venda com taxa e tempo (principal) e SLA semanal (secundário); Resultado, ROI trimestral (principal) e custo por tipo (secundário), com link para Resultado do canal.

Celular: cabeçalho, período, herói, KPIs em 2 x 2, "O que fazer hoje" com 5 itens, fase recolhida, seletor de etapa no lugar das abas, um gráfico por vez.

### 4.2 Ficha do parceiro (`/app/parceiros/:id`)

```text
[12] Cabeçalho fixo ao rolar
     logo · Nome fantasia (h1) · razão social
     NivelBadge Elite · etapa Parceria ativa · status Esfriando (âmbar) · responsável Guilherme
     Próximo passo: Reunião de alinhamento, 30/10, Guilherme   [ou: "Nenhum. Definir"]
     à direita: Registrar contato (primário) · menu (Exportar PDF, Gerar minuta, Desligar)
[12] Faixa de alertas (só quando houver; cada um com link e ação)
     Régua atrasada há 132 dias [Agendar reunião] · 2 marcos atrasados [Ver onboarding] ·
     Abaixo dos requisitos de Elite, revisão em 15/01 [Ver nível]
[12] Abas: Resumo · Linha do tempo · Indicações · Ações conjuntas · Nível e revisões ·
     Onboarding · Maturidade · Scorecard · Contrato · Dados e cadastro · Documentos
Aba Resumo (só leitura):
[8]  Resultado: indicações e clientes fechados, 12 meses     [4] Nível: Stepper dos 3 grupos
     (barras mensais, taxa de conversão, valor atribuído)         com "falta" em cada grupo
[4]  Onboarding: marcos 30, 60, 90   [4] Régua: última e próxima reunião, cadência   [4] Maturidade: radar pequeno
[6]  Horas e ROI do parceiro (só admin)                      [6] Ações conjuntas: próximas 3 e atrasadas
[12] Últimos 3 contatos (com "Ver linha do tempo")
```

Celular: cabeçalho compacto (nome, nível, status, próximo passo), alertas empilhados, abas num seletor, blocos do Resumo em coluna, "Registrar contato" na barra inferior já com o parceiro escolhido.

### 4.3 Resultado do canal (`/app/resultado`, só admin)

```text
[12] PageHeader "Resultado do canal" | O canal de parcerias se paga?
     à direita: período (padrão: ano atual; mês, trimestre, desde o início, datas livres) · recorte
[12] Aviso da fase (tom neutro): "Em experimentação, investir mais do que retorna é esperado.
     Faltam 2 critérios para a fase de tração." (só quando ROI negativo)
[6]  HeroMetric ROI do período                            [3] KpiTile Receita atribuída
     -62% em tom neutro na experimentação                 [3] KpiTile Custo total
     linha trimestral                                     [3] KpiTile Custo por cliente no ICP
                                                          [3] KpiTile Tempo de retorno (meses)
[8]  ChartCard Cascata: receita, comissões, horas,        [4] ChartCard Custo por tipo, mensal
     custos diretos, resultado                                 (barra empilhada; total de horas no título)
[8]  ChartCard ROI por parceiro (divergente, zero ao      [4] Ação: parceiros com mais horas e
     centro, ordenado)                                         nenhum resultado (lista com link à ficha)
[12] Detalhe: tabela por recorte (parceiro · nível · modelo de atuação · empresa do grupo),
     exportação, link para Custos
```

Celular: cabeçalho, aviso, herói, KPIs 2 x 2, cascata, ação, demais gráficos.

### 4.4 Início do portal do parceiro (`/parceiro`)

```text
Celular (375), na ordem:
  Olá, Ana                                     (sem nome no perfil: "Olá" e o nome da empresa)
  Herói do nível: "Elite" em Baloo 2 · Em dia (ou: Em risco até a revisão de 15/01)
     Stepper: Resultado ✓ · Capacitação falta 1 · Regras ✓   [Ver o que falta]
  3 KpiTile: Indicações no ano (contra o ano anterior) · Clientes fechados (taxa) ·
     Comissões recebidas em R$ (e a receber)
  Para fazer agora: comprovar ação até DD/MM · responder a pesquisa · 2 comunicados novos ·
     concluir a trilha
  Onboarding (só em andamento): "O que a Wise está preparando para vocês" e os marcos
  Ações da semana dos dois lados
  Nossa parceria (recolhido): pacote, início, responsável na Wise com WhatsApp
  Barra inferior: Início · Indicações · [Indicar] · Capacitação · Mais

Computador (1440):
[6]  Herói do nível com Stepper            [6] Para fazer agora
[4][4][4] KpiTile indicações · clientes fechados · comissões
[8]  Onboarding ou Ações da semana          [4] Comunicados recentes
[12] Nossa parceria (resumo, link para a página)
```

## 5. Onde esta arquitetura discorda do mapa de telas da skill

O mapa da skill é a base. Onde ele é omisso, contraditório ou esbarra numa regra de acesso, a proposta está abaixo. Cada item pode ser aceito ou recusado no portão.

| # | O mapa diz | Proposta | Por quê |
|---|---|---|---|
| D1 | Painel para todos os internos, como hoje | Tela inicial por papel: admin e parcerias no Painel, consultor em Pedidos de RFP, comercial em Parceiros, financeiro em Comissões. Painel fora do menu de comercial e financeiro | A matriz da 002 não dá leitura de indicadores, metas e fase a comercial e financeiro: a tela abriria vazia. E o trabalho do consultor (PRODUCT.md) é achar parceiro e montar RFP, não ler o programa |
| D2 | Painel com 5 indicadores de apoio, incluindo satisfação | 4 indicadores de apoio (assinados contra meta, ativados, indicações qualificadas, SLA); satisfação vai para a aba Relacionamento e para a pauta | A grade de 12 colunas com herói de 6 comporta 4 KPIs de 3 colunas sem encolher. O NPS é trimestral e muda devagar: não define se a semana foi boa |
| D3 | Período não definido | Período padrão do Painel: trimestre atual contra o anterior. A pauta continua semanal | As metas são trimestrais (US15) e o número principal é pequeno: numa semana ele é quase sempre zero, o que esvazia o herói |
| D4 | Fase do programa não aparece no Painel | Bloco fixo "Fase do programa" ao lado da lista de trabalho, com os critérios da próxima fase | US7 pede que o portal mostre quando os critérios da próxima fase foram atingidos; hoje isso não tem lugar na tela |
| D5 | Comissões só com apoio, explicação e detalhe | Herói "A pagar agora" (R$ e número de parceiros) e camada de ação: pagamentos agrupados por parceiro, com marcar como paga em lote | É a tela do financeiro, e a pergunta "quanto devemos pagar e quando" tem uma resposta principal. O parceiro emite uma nota pelo total, não por comissão (diagnóstico A2) |
| D6 | Base Ativa e Atividades só com explicação | Base Ativa ganha apoio (em ciclo, na fila, encontros na semana, atrasados) e ação (encontros atrasados e dos próximos 7 dias). Atividades ganha herói (horas no período contra o anterior) e apoio | Sem número e sem ação, o encontro vencido não aparece (diagnóstico A2, alto) |
| D7 | Página de RFP em "uma coluna" e com "fichas lado a lado no desktop" | Seções em coluna única (introdução, categorias, contato); dentro de cada categoria, fichas em grade de 3 a partir de 1024 px, com os mesmos campos na mesma ordem; no celular, empilhadas | As duas frases do mapa se contradizem; esta leitura atende as duas e resolve o cartão órfão da grade 2 mais 1 (diagnóstico A3) |
| D8 | Navegação do portal do parceiro não definida | Grupos Vender, Minha parceria, Aprender, Juntos e Minha empresa, e barra inferior no celular com "Indicar" no centro (seção 1.3) | Hoje são 17 itens soltos e a ação que gera resultado ("Indicar um cliente") não está na Início (diagnóstico A3) |
| D9 | Navegação interna no celular não definida | Barra inferior com "Registrar contato" no centro, no lugar do botão flutuante | O botão flutuante cobre filtros, abas e colunas no celular (diagnóstico A2, C6) |
| D10 | Ficha com "Resumo" e abas | Resumo só de leitura; formulários vão para a aba "Dados e cadastro"; faixa de alertas sob o cabeçalho | A Visão geral atual é um formulário e os problemas ficam escondidos nas abas (diagnóstico A1) |
| D11 | Pendências no grupo Hoje, sem relação com o Painel | Pendências é a versão completa da lista "O que fazer hoje": mesma fonte de dados, mesmos tipos e filtros | Evita duas listas de trabalho que divergem |
| D12 | Indicações com o mesmo herói do Painel | Mantido, com recorte: clientes fechados no ICP vindos das indicações do período, mais o filtro por empresa do grupo | Repetir o número principal é aceitável nesta tela, porque ela explica de onde ele vem; o recorte por empresa é o que o Painel não mostra |

## 6. Portão: o que você precisa decidir

Responda no chat:

1. **Navegação (seção 1):** os grupos, a tela inicial por papel (D1) e a barra inferior no celular (D8, D9) estão certos?
2. **Divergências (seção 5):** quais de D1 a D12 você aceita, recusa ou quer ajustar?
3. **Telas (seção 2):** alguma pergunta de tela, herói ou indicador de apoio que você trocaria? Em especial o período padrão do Painel (D3).
4. **Esboços (seção 4):** a ordem dos blocos do Painel, da ficha, do Resultado do canal e da Início do parceiro.

Depois da aprovação, esta arquitetura vira a referência das fases 3 a 5. Nenhum código antes disso.
