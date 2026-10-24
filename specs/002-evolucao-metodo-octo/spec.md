# Feature Specification: Portal Wise Partners 2.0, evolução do programa pelo Método Octo

**Feature Branch**: `002-evolucao-metodo-octo`

**Created**: 2026-10-23

**Status**: Ready for planning

**Depends on**: `specs/001-portal-wise-partners` (implementada; migrações 0001 a 0009 aplicadas, sem dados reais)

**Input**: User description: "Atualizar o Portal Wise Partners para a versão 2.0 com base no livro Ecossistema de Parceiros: Método Octo® (Juliana Tubino e Nara Vaz Guimarães, 2023), considerando que todo o web app já foi programado a partir da especificação anterior. Incluir: avaliação de maturidade de cada parceiro nos 8 eixos; ROI do canal de parcerias como canal de aquisição, com custo-hora calculado sobre a remuneração de R$ 4.500,00 por mês, horas registradas no próprio app, comissões e outros custos, com os custos em dados detalhados; modelo de atuação e proposta de valor em 4 pontos; scorecard de entrada mais sofisticado, mantendo 3 níveis baseados nos clientes no ICP; funil de recrutamento com qualificação, nutrição e origem; onboarding de 30, 60 e 90 dias com ativação na primeira indicação no ICP que virou reunião; trilhas para o parceiro aprender a vender a Wise dentro do portal; várias pessoas por parceiro com certificados; comunicados; plano de ações conjuntas nos dois sentidos, sem verba de marketing; cruzamento de carteiras com as devidas precauções e ajuste de contrato; proteção da indicação por 180 dias; SLA de indicações; link exclusivo de indicação; nota de qualidade da indicação; acompanhamento do cliente indicado aos 6 e 12 meses; níveis híbridos com revisão trimestral e carência; requisitos visíveis ao parceiro; ranking visível e premiação anual; faixas de desempenho e régua de atendimento; desligamento formal; regras do programa no portal; comissões fixas; carteira e metas por pessoa; painel por etapa da jornada com todos os indicadores sugeridos; relação de atividades por esforço. Tudo de uma vez, com urgência."

## Contexto

A versão 1 do portal está construída e testada com dados fictícios. Ela organiza parceiros por categoria, registra contatos, funil, contratos, contrapartidas, indicações, comissões, Base Ativa, portal do parceiro e páginas de RFP. Esta feature acrescenta ao portal o que o Método Octo propõe para um programa de parceiros, adaptado à realidade da Wise, e altera a versão 1 somente nos pontos listados em "Alterações em requisitos da v1".

O Wise Partners é um canal de aquisição de clientes. Por isso esta versão coloca no centro dois números: clientes fechados no ICP por meio de parceiros e o retorno sobre o investimento do canal (princípio VIII da constituição 2.0.0).

**Fase atual do programa.** Pelo livro, um programa passa por quatro fases: experimentação, tração, crescimento acelerado e otimização. O Wise Partners está em **experimentação**: há 21 parceiros em conversa, nenhum contrato assinado, nenhum cliente fechado via parceiro e as hipóteses de perfil de parceiro e de proposta de valor ainda estão sendo validadas. Nesta fase o livro espera investimento maior que o retorno; o portal precisa mostrar isso sem alarme e indicar quando o programa cumpre os critérios para passar à tração (Apêndice L).

**Como os 8 eixos do método viram funcionalidades** (nomes de tela seguem os termos da Wise, princípio de identidade da constituição)

| Eixo do método | O que entra nesta versão | Histórias |
|---|---|---|
| 1. Visão e Estratégia | Resultado do canal (ROI), fase do programa, número principal | 1, 2, 7 |
| 2. Design e Modelos | Modelo de atuação, proposta de valor em 4 pontos | 9 |
| 3. Atração e Recrutamento | Scorecard de entrada, nível de entrada, qualificação, nutrição, origem, horas combinadas | 3, 9 |
| 4. Capacitação | Onboarding em 90 dias com ativação, trilhas de venda, certificados por pessoa, comunicados | 5, 10, 13 |
| 5. Ida ao mercado conjunta | Link de indicação, nota de qualidade, proteção de 180 dias, SLA, acompanhamento do cliente, ações conjuntas, cruzamento de carteiras | 6, 11, 14 |
| 6. Programa de Parceiros | Nível híbrido com revisão trimestral, requisitos visíveis, faixas, régua, desligamento, regras publicadas, ranking e premiação | 4, 12, 13 |
| 7. Time de Parceiros | Carteira e metas por pessoa, esforço por atividade | 2, 15 |
| 8. Gestão do Ecossistema | Painel por etapa da jornada, indicadores por fase, satisfação, matriz de maturidade | 7, 8 |

**Públicos novos ou alterados**

| Público | Mudança |
|---|---|
| Administrador | Único público que vê remuneração, custo-hora, custos e ROI e que lança custos diretos. Confirma rebaixamentos; desligamentos só com aprovação do Diretor |
| Time de parcerias | Registra scorecard, matriz de maturidade, ações conjuntas e acompanhamento dos clientes indicados. Não vê custos nem ROI (com uma só pessoa no time, o custo agregado revelaria o custo-hora dela) |
| Pessoa do parceiro | Cada usuário do parceiro faz as trilhas, recebe o próprio certificado, responde à pesquisa de satisfação e lê os comunicados |
| Contato indicado pelo link | Pessoa da empresa indicada que preenche o formulário do link exclusivo do parceiro. Não tem conta e vê só a confirmação do envio |

## User Scenarios & Testing *(mandatory)*

Todas as histórias entram nesta versão. P1 a P3 indicam a ordem de construção e validação.

### User Story 1 - Resultado do canal: ROI e número principal (Priority: P1)

O Gerente de Parcerias e o Diretor abrem a tela de resultado do canal e veem, para o período escolhido (mês, trimestre, ano, desde o início ou datas livres): clientes fechados no ICP via parceiros, receita atribuída ao canal, custo total do canal separado em comissões, horas da equipe e custos diretos, ROI, custo por cliente adquirido e tempo de retorno do investimento. Os mesmos números aparecem por parceiro, por nível, por modelo de atuação e por empresa do grupo. Um aviso explica o que é esperado para a fase atual do programa.

**Why this priority**: É o motivo do programa existir como canal de aquisição e a principal decisão de investimento do Diretor.

**Independent Test**: Com custo-hora cadastrado, atividades, uma indicação fechada com valor e um custo direto lançado, conferir que receita, custo e ROI do período batem com a planilha modelo `referencias/planilhas/Modelo_Custos_ROI_Canal.xlsx` para as mesmas entradas.

**Acceptance Scenarios**:

1. **Given** um período com 1 cliente fechado no ICP pela Wise Makers com mensalidade de R$ 6.000,00 e prazo de 12 meses, comissões de R$ 2.400,00 ao parceiro e R$ 600,00 ao responsável, 40 horas de atividades do Guilherme e R$ 500,00 de custos diretos, **When** o administrador abre o resultado do canal com margem de contribuição de 100%, **Then** vê receita atribuída de R$ 72.000,00, custo total de R$ 4.318,18 (2.400 + 600 + 40 × 20,45 + 500, com o custo-hora sem arredondamento), ROI de 1.567% e custo por cliente de R$ 4.318,18.
2. **Given** a fase do programa em experimentação e ROI negativo, **When** a tela abre, **Then** aparece o aviso de que investimento maior que retorno é esperado nesta fase e quais critérios faltam para a fase de tração.
3. **Given** atividades de uma pessoa sem custo-hora cadastrado, **When** o ROI é calculado, **Then** as horas aparecem somadas, o custo dessas horas fica marcado como "não informado" e o ROI mostra o aviso de que está subestimando o custo.
4. **Given** qualquer papel que não seja administrador, **When** tenta abrir o resultado do canal ou a planilha de custos, **Then** o acesso é negado na camada de dados; o parceiro nunca vê a tela.
5. **Given** a tela de resultado, **When** o administrador escolhe exportar, **Then** recebe uma planilha com uma linha por lançamento de custo e de receita do período, com as colunas da planilha de custos (FR-106).

---

### User Story 2 - Custos do canal e esforço por atividade (Priority: P1)

Cada pessoa interna tem uma remuneração mensal de referência, da qual o portal calcula o custo-hora (remuneração dividida pelas horas mensais de referência, 220 por padrão). Cada atividade registrada no portal, seja por um ponto de contato, um encontro, uma revisão ou um registro avulso, tem o esforço estimado pelo catálogo de atividades (Apêndice N), ajustável no registro. O portal mantém a planilha de custos detalhada: horas por pessoa, atividade e parceiro com o custo calculado; comissões ao parceiro e ao responsável; e custos diretos lançados à mão (eventos, kits, deslocamento, ferramentas, impressos, outros), ligados ou não a um parceiro ou a uma ação conjunta. Trabalho geral do programa, sem parceiro, também é registrado e entra no custo do canal.

**Why this priority**: Sem horas e custos registrados, o ROI da História 1 não existe.

**Independent Test**: Cadastrar remuneração de R$ 4.500,00 para o Guilherme, registrar uma reunião de apresentação de 75 minutos e um custo direto de R$ 120,00 ligado ao mesmo parceiro, e conferir as duas linhas na planilha de custos com R$ 25,57 e R$ 120,00.

**Acceptance Scenarios**:

1. **Given** remuneração de R$ 4.500,00 e 220 horas mensais de referência, **When** o administrador salva, **Then** o custo-hora do Guilherme é R$ 20,45 e só administradores enxergam os dois valores.
2. **Given** um ponto de contato do tipo reunião online, **When** a pessoa registra, **Then** o portal sugere o tipo de atividade e os minutos do catálogo, aceita ajuste e grava a atividade com o custo calculado na data do registro.
3. **Given** a remuneração alterada em um mês, **When** a planilha de custos é aberta, **Then** atividades anteriores mantêm o custo-hora da época e as novas usam o valor novo.
4. **Given** um custo direto recorrente (ferramenta mensal), **When** lançado como recorrente, **Then** aparece uma linha por mês até ser encerrado.
5. **Given** a planilha de custos, **When** filtrada por parceiro, pessoa, tipo de custo, atividade ou período, **Then** mostra as linhas e o total do filtro, e exporta exatamente o que está na tela.
6. **Given** horas de gestão geral do programa, **When** o ROI por parceiro é calculado, **Then** o custo geral aparece à parte e, se o administrador ativar o rateio, é dividido igualmente entre os parceiros assinados do período.

---

### User Story 3 - Scorecard de entrada e nível de entrada (Priority: P1)

Antes da proposta, o time de parcerias preenche o scorecard do parceiro: sete critérios (Apêndice A), cada um com nota 0, 0,5 ou 1 por uma régua descrita na tela. Três critérios são essenciais e pesam o dobro. O portal calcula a nota de potencial (0 a 100%) e a nota de qualidade (os seis critérios além da base no ICP). O nível de entrada continua definido pela faixa de clientes no ICP (Elite 50 ou mais, Premium 15 a 49, Select menos de 15), ajustado pela qualidade: com nota de qualidade abaixo de 50%, o parceiro entra um nível abaixo, nunca abaixo de Select. Nota zero em complementaridade ou em alinhamento de valores torna o parceiro "não elegível" por sugestão, e a decisão é do administrador.

**Why this priority**: O nível define pacote, régua e expectativa de resultado; a regra atual, só pela carteira, é simples demais para a decisão de entrada.

**Independent Test**: Preencher o scorecard de um parceiro com 60 clientes no ICP e qualidade de 37,5% e conferir nível de entrada Premium; preencher um essencial com zero e conferir a sugestão de não elegível.

**Acceptance Scenarios**:

1. **Given** um parceiro com 60 clientes no ICP e nota de qualidade de 75% (6 de 8 pontos), **When** o scorecard é salvo, **Then** o nível de entrada sugerido é Elite.
2. **Given** um parceiro com 60 clientes no ICP e nota de qualidade de 37,5% (3 de 8 pontos), **When** salvo, **Then** o nível de entrada sugerido é Premium e o motivo mostra "qualidade abaixo de 50%".
3. **Given** um parceiro com 10 clientes no ICP e qualidade de 87,5% (7 de 8 pontos), **When** salvo, **Then** o nível de entrada é Select, porque a qualidade nunca eleva acima da faixa da base.
4. **Given** o critério essencial "complementaridade com a oferta da Wise" com nota zero, **When** salvo, **Then** o portal sugere "não elegível" e só um administrador pode seguir com a negociação, registrando motivo. Nota 0 na base no ICP não gera essa sugestão.
5. **Given** um parceiro em "qualificação", **When** o usuário tenta passar para "proposta com o decisor" sem scorecard completo, **Then** o portal impede e mostra os critérios faltantes.
6. **Given** o nível de entrada sugerido, **When** o usuário escolhe outro nível, **Then** o portal exige motivo (regra da v1 mantida).

---

### User Story 4 - Nível por resultado com revisão trimestral (Priority: P1)

Depois da entrada, o nível acompanha o resultado. Cada nível tem requisitos em três grupos (Apêndice B): resultado (indicações qualificadas ou clientes fechados no ICP em 180 dias), capacitação (pessoas certificadas) e regras (contrato vigente, contrapartidas e ações em dia). Quando o parceiro cumpre todos os requisitos de um nível acima, sobe na hora, com aviso a ele e ao responsável. Na revisão trimestral, quem não cumpre os requisitos do nível atual entra em observação por um trimestre, com aviso do que falta. Na revisão seguinte, se ainda não cumprir, o portal propõe descer um nível, e a decisão é de uma pessoa, com motivo. O parceiro vê no portal os requisitos do próximo nível e o quanto já cumpriu.

**Why this priority**: É a mudança de regra mais importante desta versão e afeta pacote, régua, ranking, contrato e portal do parceiro.

**Independent Test**: Simular um parceiro Premium que atinge 6 indicações qualificadas, 2 pessoas certificadas e 1 ação conjunta do lado do parceiro concluída nos últimos 90 dias e conferir a subida imediata para Elite; simular um Premium sem resultado em duas revisões seguidas e conferir observação e depois proposta de rebaixamento, sem mudança automática.

**Acceptance Scenarios**:

1. **Given** um parceiro Premium que passa a cumprir os três grupos de requisitos do Elite, **When** o requisito é atingido, **Then** o nível muda para Elite no mesmo dia, o histórico registra "subida por resultado" e parceiro e responsável recebem aviso; o pacote só muda se o parceiro escolher um pacote superior.
2. **Given** a revisão trimestral no primeiro dia útil de janeiro, abril, julho ou outubro, **When** um parceiro não cumpre os requisitos do nível atual, **Then** fica "em observação" até a próxima revisão e recebe no portal e por e-mail a lista do que falta.
3. **Given** um parceiro em observação que ainda não cumpre os requisitos na revisão seguinte, **When** a revisão roda, **Then** o portal cria uma proposta de rebaixamento de um nível para o responsável, e nada muda até alguém confirmar ou manter o nível com motivo.
4. **Given** um parceiro assinado há menos de 180 dias ou pausado, **When** a revisão roda, **Then** ele fica fora da avaliação de rebaixamento e o portal registra o motivo da isenção.
5. **Given** um rebaixamento confirmado de Elite para Premium com pacote A, **When** salvo, **Then** o pacote passa para B ao fim do ciclo do Base Ativa em curso ou 30 dias após a confirmação, o que vier depois, e as contrapartidas exclusivas do pacote A deixam de ser cobradas nessa data.
6. **Given** o portal do parceiro, **When** ele abre "Meu nível", **Then** vê o nível atual pelo nome, os requisitos do nível acima com o que já cumpriu em cada grupo e, se estiver em observação, o prazo e o que falta.
7. **Given** um parceiro sem nenhum contato registrado há 90 dias, **When** o status muda para dormente, **Then** o nível não muda por esse motivo (princípio IV.4).

---

### User Story 5 - Onboarding em 90 dias e ativação (Priority: P1)

Ao entrar em onboarding, além das tarefas do pacote da v1, o portal cria o plano de 90 dias com quatro encontros (alinhamento, vendas, produto e pós-venda) e os marcos de 30, 60 e 90 dias (Apêndice F). O parceiro vê o plano no portal. O onboarding termina na ativação: a primeira indicação do parceiro com ICP confirmado pela Wise que virou reunião. Na ativação, o parceiro passa para a etapa "parceria ativa". Sem ativação em 90 dias, o responsável recebe alerta e o plano ganha uma extensão até 120 dias; sem ativação em 120 dias, o parceiro fica marcado como "não ativado".

**Why this priority**: Pelo livro, o parceiro precisa ganhar dinheiro nos primeiros 90 dias; parceiro que não ativa vira custo.

**Independent Test**: Assinar um parceiro fictício, conferir os quatro encontros e marcos criados, registrar uma indicação no ICP com reunião e conferir a ativação automática com a data.

**Acceptance Scenarios**:

1. **Given** um parceiro que entra em onboarding, **When** a etapa muda, **Then** o portal cria as tarefas do pacote (v1), os quatro encontros com data limite (7, 30, 60 e 90 dias) e os marcos de 30, 60 e 90 dias.
2. **Given** um encontro de onboarding realizado, **When** registrado, **Then** o portal cria o ponto de contato e a atividade com o esforço do catálogo.
3. **Given** a primeira indicação do parceiro para o grupo com ICP confirmado e data de reunião, **When** salva, **Then** o parceiro é ativado na data da reunião, sai do onboarding para "parceria ativa" e o tempo até a ativação é gravado.
4. **Given** 90 dias de onboarding sem ativação, **When** a rotina diária roda, **Then** o responsável recebe alerta, o plano é estendido até 120 dias e um próximo passo de retomada é criado.
5. **Given** 120 dias sem ativação, **When** a rotina roda, **Then** o parceiro fica marcado como "não ativado" no painel, sem mudança de nível nem de contrato.

---

### User Story 6 - Indicações com link exclusivo, qualidade, proteção e SLA (Priority: P1)

Cada parceiro comercial assinado recebe um link exclusivo de indicação (e um QR Code) para usar com os próprios clientes. Quem abre o link vê uma página com a identidade da Wise e a logo do parceiro, preenche os dados da empresa e da necessidade, responde às perguntas do ICP e dá o próprio consentimento; a indicação entra atribuída ao parceiro. Toda indicação ganha uma nota de qualidade (Apêndice E) e passa por validação da Wise, que confirma a aderência ao ICP. A indicação fica protegida por 180 dias desde a última interação: nesse prazo vale o primeiro registro; depois dele, novo registro do mesmo cliente é aceito e atribuído a quem reengajou, com aviso ao primeiro parceiro. O SLA de indicações (Apêndice E) define prazos para validar, fazer o primeiro contato, dar retorno ao parceiro e atualizar; o portal alerta cada prazo vencido. Indicações fechadas geram checagens aos 6 e 12 meses para registrar se o cliente segue ativo e a satisfação dele.

**Why this priority**: Indicação é a matéria-prima do canal; qualidade, atribuição justa e resposta rápida são o que mantém o parceiro indicando.

**Independent Test**: Abrir o link de um parceiro fictício em janela anônima, enviar uma indicação, conferir a atribuição, a nota e os prazos do SLA; enviar o mesmo CNPJ por outro parceiro antes e depois de 180 dias simulados.

**Acceptance Scenarios**:

1. **Given** o link exclusivo de um parceiro assinado, **When** um contato preenche e envia o formulário, **Then** a indicação entra para a Wise Makers com origem "link do parceiro", consentimento do próprio titular registrado e aviso ao responsável e ao parceiro.
2. **Given** um cliente indicado pelo parceiro X há 100 dias e com interação há 40 dias, **When** o parceiro Y indica o mesmo cliente, **Then** o registro é recusado pela regra do primeiro registro; no link público, o contato vê a mesma confirmação neutra de sempre e o responsável recebe aviso de tentativa duplicada, sem atribuição a Y.
3. **Given** um cliente sem interação há 181 dias, **When** o parceiro Y o indica, **Then** a indicação é aceita e atribuída a Y, a anterior fica com proteção expirada e o parceiro X recebe aviso.
4. **Given** uma indicação nova, **When** passam 2 dias úteis sem validação e primeiro contato registrados, **Then** o responsável recebe alerta de SLA vencido e a indicação aparece no painel como fora do prazo.
5. **Given** uma indicação aberta, **When** passam 15 dias sem atualização, **Then** o responsável recebe alerta (antes 30 dias na v1).
6. **Given** uma indicação recebida pelo parceiro (sentido grupo para parceiro), **When** passam 2 dias úteis sem primeiro contato informado pelo parceiro, **Then** o parceiro recebe lembrete no portal e por e-mail, e o responsável Wise vê o atraso.
7. **Given** uma indicação fechada, **When** completa 6 e 12 meses da data de fechamento, **Then** o responsável recebe a tarefa de registrar se o cliente segue ativo e a satisfação do cliente de 0 a 10.
8. **Given** o link de um parceiro desligado ou com contrato encerrado, **When** alguém abre, **Then** vê aviso de link indisponível e nada é gravado.

---

### User Story 7 - Painel por etapa da jornada, fase do programa e satisfação (Priority: P1)

O painel semanal passa a ser organizado pelas quatro etapas da jornada do parceiro (captação, onboarding, relacionamento e produção) mais o resultado do canal, com cerca de 6 indicadores em destaque por etapa e a lista completa à parte (Apêndice L). O administrador escolhe quais indicadores ficam em destaque e define metas. A fase do programa fica registrada e o portal mostra quando os critérios da próxima fase foram atingidos. Uma pesquisa trimestral de satisfação dos parceiros (nota de 0 a 10 e comentário) é enviada a cada pessoa do parceiro pelo portal e por e-mail.

**Why this priority**: É o instrumento da reunião semanal e do relatório do Diretor.

**Independent Test**: Com dados fictícios em todas as etapas, conferir os indicadores em destaque, a lista completa, as metas e o cálculo da satisfação dos parceiros.

**Acceptance Scenarios**:

1. **Given** o painel, **When** aberto, **Then** mostra, para o período, os indicadores em destaque das quatro etapas e do canal, cada um com valor, meta (quando houver) e comparação com o período anterior.
2. **Given** a lista completa de indicadores, **When** o administrador marca um como destaque ou define meta, **Then** o painel e o relatório semanal passam a usar essa escolha.
3. **Given** o primeiro dia útil do trimestre, **When** a rotina roda, **Then** cada pessoa ativa de parceiro assinado recebe a pesquisa de satisfação, que pode ser respondida uma vez por trimestre.
4. **Given** as respostas do trimestre, **When** o painel calcula a satisfação dos parceiros, **Then** mostra o NPS (promotores menos detratores), o número de respostas e os comentários, sem identificar a pessoa para quem não é administrador ou time de parcerias.
5. **Given** os critérios de passagem para tração atingidos, **When** o painel abre, **Then** aparece a sugestão de mudar a fase, que só muda com confirmação do administrador.
6. **Given** o relatório semanal do Diretor, **When** enviado, **Then** inclui o número principal, o ROI do trimestre e os indicadores em destaque.

---

### User Story 8 - Matriz de maturidade por parceiro (Priority: P2)

O time de parcerias avalia cada parceiro nos 8 eixos da matriz de maturidade (Apêndice J), com nota de 1 a 5 por eixo. O portal sugere a nota de cada eixo a partir dos dados que já tem (scorecard, capacitação, indicações, ações conjuntas, régua, ROI) e a pessoa confirma ou ajusta. A média define a categoria do parceiro: fundação, desenvolvimento ou escala. A ficha mostra o radar dos 8 eixos; a carteira pode ser filtrada pela categoria; uma visão do programa mostra o radar médio dos parceiros assinados e quantos estão em cada categoria. Não há rotina obrigatória de reavaliação.

**Why this priority**: Organiza o olhar sobre cada parceiro e mostra onde investir esforço, mas depende dos dados das histórias P1.

**Independent Test**: Avaliar dois parceiros, conferir radar, categoria, sugestão por eixo e radar médio do programa; conferir que o parceiro não vê a avaliação.

**Acceptance Scenarios**:

1. **Given** a ficha de um parceiro, **When** o usuário abre a avaliação de maturidade, **Then** vê os 8 eixos com a régua de 1 a 5, a nota sugerida e o porquê de cada sugestão.
2. **Given** as notas confirmadas, **When** salvas, **Then** o portal grava a avaliação com data e autor, calcula a média e a categoria (fundação abaixo de 2,5; desenvolvimento de 2,5 a 3,9; escala a partir de 4,0) e desenha o radar.
3. **Given** a lista de parceiros, **When** filtrada por categoria de maturidade ou por eixo abaixo de uma nota, **Then** mostra só os que atendem.
4. **Given** a visão do programa, **When** aberta, **Then** mostra o radar médio dos parceiros comerciais assinados e a distribuição por categoria.
5. **Given** um usuário de parceiro, **When** acessa qualquer tela ou exportação, **Then** não vê avaliação, notas nem categoria de maturidade.

---

### User Story 9 - Modelo de atuação, proposta de valor e recrutamento (Priority: P2)

A ficha ganha o modelo de atuação do parceiro (um ou mais: indicador, co-venda, implementador ou parceiro técnico, tecnologia ou integração, institucional ou comunidade) e a proposta de valor da parceria em quatro pontos: o que o parceiro quer ganhar, o que a Wise oferece, como esse valor é entregue e o valor criado para cada lado e para o cliente. O funil ganha a etapa "qualificação" (scorecard), entre "reunião realizada" e "proposta com o decisor", e o estado "nutrição" para quem ainda não é a hora, com data de retomada e cadência de contato. A origem do parceiro passa a ser estruturada (prospecção ativa, procura espontânea, indicação de parceiro, indicação interna, evento, outra), e a ficha registra as horas por semana que o responsável do parceiro combinou dedicar no primeiro mês.

**Why this priority**: Melhora a qualidade da entrada e a leitura do funil, e alimenta scorecard, IA e indicadores.

**Independent Test**: Cadastrar um parceiro com dois modelos, proposta de valor, origem "evento" e horas combinadas; movê-lo para nutrição e conferir a retomada; conferir a conversão por origem no painel.

**Acceptance Scenarios**:

1. **Given** a ficha, **When** o usuário marca modelos de atuação e preenche os quatro pontos da proposta de valor, **Then** os dados aparecem na ficha, no contexto do parceiro para IA e, no portal do parceiro, em "Nossa parceria", com proposta de alteração sujeita à validação da Wise (regra da v1).
2. **Given** um parceiro em qualquer etapa antes do fechamento, **When** movido para "nutrição" com data de retomada, **Then** sai do quadro ativo, não fica morno nem dormente durante a nutrição e ganha um próximo passo de contato na cadência configurada (30 dias por padrão) e na data de retomada.
3. **Given** a origem "indicação de parceiro", **When** o usuário escolhe o parceiro de origem, **Then** a ficha registra o vínculo e o painel conta essa origem na conversão.
4. **Given** o painel de captação, **When** aberto, **Then** mostra a conversão do funil por origem, do primeiro contato à assinatura.
5. **Given** horas combinadas informadas, **When** o scorecard é preenchido, **Then** o critério "disponibilidade de tempo do responsável" vem sugerido a partir delas.

---

### User Story 10 - Trilhas de venda, pessoas e certificados (Priority: P2)

O portal do parceiro ganha a área de capacitação, com trilhas criadas pela Wise. A primeira é "Como vender a Wise Makers" (Apêndice G). Cada trilha tem módulos com vídeo (arquivo ou link), PDF ou texto, e um teste ao final com nota mínima. Cada pessoa do parceiro faz a trilha com o próprio login e, ao passar no teste, recebe o próprio certificado em PDF e o selo de capacitação. As trilhas ficam só no portal, nunca no Wise Hub, porque o Hub é aberto à carteira do parceiro. O número de pessoas certificadas alimenta os requisitos de nível, a matriz e o ranking.

**Why this priority**: Parceiro que sabe vender a Wise indica melhor; é requisito dos níveis Premium e Elite.

**Independent Test**: Criar uma trilha com dois módulos e teste, fazer a trilha com duas pessoas do mesmo parceiro, uma aprovada e outra reprovada, e conferir certificado, contagem de certificados e progresso.

**Acceptance Scenarios**:

1. **Given** uma trilha publicada, **When** uma pessoa do parceiro abre a capacitação, **Then** vê os módulos, o progresso e o teste liberado só depois de concluir todos os módulos.
2. **Given** um teste respondido com nota igual ou maior que a mínima (70% por padrão), **When** enviado, **Then** a pessoa recebe o certificado em PDF com o nome dela, a trilha, a data e a identidade Wise, e o selo para download.
3. **Given** nota abaixo da mínima, **When** enviado, **Then** a pessoa pode refazer o teste após 24 horas, sem limite de tentativas.
4. **Given** um vídeo enviado como arquivo, **When** a pessoa assiste, **Then** o arquivo é servido por link temporário e só para usuários de parceiros assinados.
5. **Given** um parceiro com duas pessoas certificadas, **When** a revisão de nível roda, **Then** o requisito de capacitação do Elite aparece como cumprido.
6. **Given** a trilha alterada pela Wise, **When** publicada nova versão, **Then** certificados anteriores continuam válidos e mostram a versão em que foram obtidos.

---

### User Story 11 - Plano de ações conjuntas nos dois sentidos (Priority: P2)

As contrapartidas da v1 passam a fazer parte de um plano de ações conjuntas por parceiro, com ações dos dois lados: as do parceiro (catálogo da v1) e as da Wise (catálogo novo, Apêndice H). Cada ação tem lado, tipo, data prevista, responsável, estado, comprovação, resultado (alcance, inscritos, indicações geradas) e custo direto, quando houver. O plano aparece em calendário na ficha, no portal do parceiro e numa visão geral. Não há verba de marketing para parceiros.

**Why this priority**: Torna visível a reciprocidade da parceria e alimenta requisitos de nível, matriz, ROI e ranking.

**Independent Test**: Assinar um parceiro do pacote B, conferir as ações dos dois lados geradas, concluir uma ação da Wise com custo e uma do parceiro com comprovação e indicação ligada, e conferir resultado e custo.

**Acceptance Scenarios**:

1. **Given** um parceiro assinado, **When** as contrapartidas são geradas (v1), **Then** as ações da Wise do pacote são geradas junto, com lado "Wise" e datas previstas.
2. **Given** uma ação da Wise concluída, **When** registrada com custo direto, **Then** o custo entra na planilha de custos ligado ao parceiro e à ação.
3. **Given** uma indicação registrada com a ação conjunta de origem, **When** salva, **Then** a ação mostra a indicação no resultado.
4. **Given** uma ação da Wise atrasada, **When** a rotina diária roda, **Then** o responsável Wise recebe alerta, e o parceiro vê no portal que a ação está atrasada.
5. **Given** o calendário geral, **When** filtrado por mês, lado ou tipo, **Then** mostra as ações de todos os parceiros com estado.

---

### User Story 12 - Faixas de desempenho, régua de atendimento e desligamento (Priority: P2)

O portal classifica, entre os parceiros comerciais assinados, as faixas internas de desempenho pela pontuação do ranking: destaque (5% do topo, no mínimo 1), potencial (15% seguintes, no mínimo 1) e base (os demais). Cada pacote e cada faixa têm uma régua de atendimento (Apêndice C) com a cadência mínima de acompanhamento e o tipo de suporte; o portal alerta quando a régua atrasa. Parceiros que cumprem os critérios de risco (Apêndice D) entram no fluxo de desligamento: duas tentativas de retomada registradas, sugestão de desligamento, aprovação do Diretor, aviso formal de 30 dias gerado pelo portal e encerramento.

**Why this priority**: Concentra o esforço caro onde há retorno e evita parceiros parados que consomem tempo.

**Independent Test**: Com 20 parceiros fictícios pontuados, conferir 1 destaque, 3 potenciais e 16 base; simular um parceiro em risco e percorrer o fluxo até o encerramento.

**Acceptance Scenarios**:

1. **Given** 20 parceiros comerciais assinados com pontos, **When** as faixas são recalculadas, **Then** 1 fica em destaque, 3 em potencial e 16 em base, empates decididos pela regra do Apêndice K, e só usuários internos veem a faixa.
2. **Given** um parceiro do pacote B sem reunião de acompanhamento há 37 dias, **When** a rotina roda, **Then** o responsável recebe alerta de régua atrasada (cadência mensal mais 7 dias de tolerância).
3. **Given** um parceiro assinado há 200 dias, sem indicação qualificada e sem ação ou contrapartida comprovada em 180 dias, **When** a rotina roda, **Then** ele entra "em risco" e o portal cria a primeira tentativa de retomada como próximo passo.
4. **Given** duas tentativas de retomada registradas com 15 dias ou mais de intervalo e 30 dias sem resposta após a segunda, **When** a rotina roda, **Then** o portal sugere o desligamento ao Diretor; nada muda sem a aprovação dele.
5. **Given** o desligamento aprovado, **When** o administrador gera o aviso, **Then** o portal produz o texto do aviso formal com a data de encerramento (30 dias), tira o parceiro das novas recomendações de RFP na hora e, na data, passa a etapa para "parceria encerrada", revoga link de indicação e acessos e preserva comissões e indicações abertas.
6. **Given** um parceiro em risco que registra uma indicação qualificada ou comprova uma ação, **When** salvo, **Then** o fluxo de desligamento é cancelado e o histórico registra o motivo.
7. **Given** um parceiro com conflito de interesse comprovado, **When** o administrador abre o desligamento por inadequação com motivo, **Then** o fluxo vai direto para a aprovação do Diretor, sem tentativas de retomada, e segue os passos de aviso e encerramento.

---

### User Story 13 - Regras do programa, comunicados, ranking e premiação (Priority: P3)

O portal do parceiro ganha a página "Regras do programa", gerada a partir da configuração: níveis, requisitos, pacotes e benefícios, comissão da Wise ao parceiro, proteção da indicação, SLA, régua de atendimento, critérios de desligamento, ranking e premiação. Mudança de regra que afeta parceiros tem data de vigência de no mínimo 30 dias e gera um comunicado. A Wise envia comunicados (mudança de regra, evento, material novo, outro) a todos ou a um recorte por nível, pacote, categoria ou tipo, por e-mail e no portal, com histórico e confirmação de leitura. O ranking do ano e do trimestre mostra posição, nome e pontos (Apêndice K); cada parceiro pode pedir para aparecer sem o nome. A premiação anual é registrada no portal e gera selo para o vencedor.

**Why this priority**: Transparência e reconhecimento, que dependem das regras e pontuações das outras histórias.

**Independent Test**: Alterar um requisito de nível, conferir a vigência mínima, o comunicado sugerido e a página de regras atualizada; conferir ranking com um parceiro anônimo.

**Acceptance Scenarios**:

1. **Given** o administrador altera um requisito de nível, **When** salva, **Then** o portal exige data de vigência a partir de 30 dias, cria uma versão nova das regras e abre o rascunho de comunicado aos parceiros afetados.
2. **Given** um comunicado enviado ao recorte "Premium", **When** enviado, **Then** cada pessoa ativa dos parceiros Premium recebe e-mail e vê o comunicado no portal; o administrador vê quem leu.
3. **Given** o ranking do ano, **When** um parceiro abre, **Then** vê a própria posição e os 10 primeiros com nome e pontos; quem pediu anonimato aparece como "Parceiro Wise".
4. **Given** o ranking, **When** consultado por qualquer público externo, **Then** nunca mostra nível, valores, clientes, comissões ou faixa interna.
5. **Given** a premiação anual registrada, **When** salva, **Then** o vencedor recebe o selo da premiação nos materiais do portal e o histórico registra a categoria e o ano.

---

### User Story 14 - Cruzamento de carteiras (Priority: P3)

O parceiro pode, se quiser, cruzar a carteira dele com a da Wise para descobrir oportunidades em comum, seguindo a matriz de mapeamento de contas do livro (Apêndice I). Ele aceita o termo específico do cruzamento, escolhe um arquivo com CNPJs e o tipo de cada empresa (cliente ou prospect). O navegador extrai só os CNPJs, sem nomes de pessoas. O servidor compara com a base da Wise, descarta a lista do parceiro no mesmo processamento e guarda só as coincidências por 180 dias. O parceiro vê os totais por quadrante. O time de parcerias vê as empresas coincidentes que já são da base da Wise e decide, caso a caso, o que vira indicação ou ação conjunta.

**Why this priority**: Gera oportunidades novas, mas depende de base da Wise organizada, de aceite contratual e de cuidado com dados.

**Independent Test**: Carregar a base fictícia da Wise, fazer um cruzamento com um arquivo de 50 CNPJs com 5 coincidências e provar que nenhuma tabela, log ou arquivo guarda os 45 CNPJs não coincidentes.

**Acceptance Scenarios**:

1. **Given** um parceiro comercial assinado com o contrato v2, **When** abre o cruzamento, **Then** vê o termo específico e só segue depois de aceitar; o aceite fica registrado com versão do termo, pessoa e data.
2. **Given** um arquivo com 50 CNPJs, **When** enviado, **Then** o parceiro vê os totais nos quatro quadrantes e o time de parcerias vê as 5 empresas coincidentes com o quadrante de cada uma.
3. **Given** o cruzamento concluído, **When** auditado, **Then** não existe no banco, no armazenamento ou nos logs nenhum CNPJ do parceiro que não coincidiu.
4. **Given** coincidências com mais de 180 dias que não viraram indicação nem ação, **When** a rotina roda, **Then** são apagadas.
5. **Given** o parceiro pede exclusão, **When** o administrador confirma, **Then** as coincidências daquele parceiro são apagadas na hora.
6. **Given** um parceiro institucional ou sem contrato v2, **When** tenta cruzar, **Then** o portal não oferece a função.

---

### User Story 15 - Carteira e metas por pessoa (Priority: P3)

Cada pessoa responsável por parceiros (administrador ou time de parcerias) tem a própria carteira (parceiros dos quais é responsável) e metas trimestrais: novos parceiros assinados, parceiros ativados, clientes fechados no ICP pela carteira e receita atribuída. O painel pessoal mostra o andamento das metas, a régua da carteira e as horas dedicadas. Hoje só o Gerente de Parcerias está no time; a estrutura já serve para quando houver mais pessoas.

**Why this priority**: Útil, mas com uma pessoa só o painel geral já cobre a rotina.

**Independent Test**: Definir metas do trimestre para o Guilherme e conferir o andamento no painel pessoal com dados fictícios.

**Acceptance Scenarios**:

1. **Given** metas trimestrais cadastradas para uma pessoa, **When** ela abre o painel pessoal, **Then** vê realizado contra meta em cada indicador, com a carteira e as horas do trimestre.
2. **Given** a troca de responsável de um parceiro no meio do trimestre, **When** o painel calcula, **Then** os resultados contam para quem era responsável na data de cada evento.

---

### Edge Cases

* Parceiro com scorecard preenchido na v1 inexistente: parceiros já cadastrados antes desta versão ficam com nível de entrada igual ao nível atual até alguém preencher o scorecard; o portal sinaliza "scorecard pendente".
* Base no ICP alterada depois da assinatura: o nível de entrada é recalculado; se ficar acima do nível atual, o portal sugere a subida, que depende de confirmação; se ficar abaixo, nada muda até a revisão trimestral.
* Parceiro que cumpre os requisitos de dois níveis acima: sobe direto para o mais alto que cumpre.
* Indicação pelo link sem CNPJ: entra com nota de completude menor; a duplicidade é verificada pela razão social normalizada, como na v1.
* Indicação pelo link com o mesmo CNPJ enviada duas vezes pelo mesmo parceiro em 24 horas: a segunda é descartada e o contato vê a confirmação neutra.
* Link de indicação usado em massa: limite de envios por endereço de origem e campo oculto contra robôs; acima do limite, a página pede para tentar mais tarde e nada é gravado.
* Pessoa do parceiro desativada: mantém certificados no histórico do parceiro, mas deixa de contar como pessoa certificada nos requisitos de nível.
* Remuneração não informada para alguém que registra atividades (por exemplo, o Diretor): horas entram no relatório, custo fica "não informado" e o ROI mostra o aviso.
* Fechamento com valor só da primeira mensalidade (indicação da v1): a receita usa a mensalidade vezes o prazo padrão configurado (12 meses) até alguém informar o prazo real.
* Indicação fechada para a Tríade ou a Swallow: a receita atribuída é o valor total informado da venda; sem ele, usa a base da comissão.
* Desligamento de parceiro com ciclo do Base Ativa em curso: vale o prazo de 30 dias; ao aprovar, o Diretor pode registrar a decisão de aguardar o fim do ciclo, e a data de encerramento passa a ser a do fim do ciclo.
* Parceiro pausado: fica fora da revisão de nível, do fluxo de desligamento e da régua durante a pausa.
* Mudança de fase do programa: indicadores em destaque sugeridos para a nova fase são aplicados só com confirmação do administrador.
* Cruzamento com arquivo acima de 5.000 linhas, sem coluna de CNPJ ou com CNPJs inválidos: o navegador recusa antes de enviar e mostra as linhas com problema.
* Parceiro que pede anonimato no ranking e ganha a premiação: a premiação só é divulgada aos outros parceiros com autorização dele.
* Rebaixamento confirmado durante a vigência de uma regra antiga: vale a regra que estava vigente no início do trimestre avaliado.

## Requirements *(mandatory)*

### Functional Requirements

Os requisitos desta feature são numerados a partir de FR-101. Requisitos da v1 não citados em "Alterações em requisitos da v1" continuam valendo sem mudança.

**Resultado do canal e custos (Histórias 1 e 2)**

* **FR-101**: O sistema DEVE manter, para cada pessoa interna, a remuneração mensal de referência com data de vigência e calcular o custo-hora pela divisão da remuneração pelas horas mensais de referência (220 por padrão, configurável), multiplicada pelo fator de encargos (1,0 por padrão, configurável).
* **FR-102**: O sistema DEVE mostrar remuneração, custo-hora, custo de atividades, custos diretos, planilha de custos e resultado do canal apenas a administradores, inclusive em colunas de tabelas que outros papéis leem.
* **FR-103**: O sistema DEVE gravar em cada atividade o custo-hora vigente na data da atividade e o custo calculado.
* **FR-104**: O sistema DEVE permitir registrar atividades sem parceiro, como trabalho geral do programa, e incluí-las no custo do canal.
* **FR-105**: O sistema DEVE manter lançamentos de custo direto com data, categoria (evento, kit e brindes, deslocamento, impressos, ferramentas, mídia, outro), valor, descrição, comprovante opcional, parceiro opcional, ação conjunta opcional e recorrência mensal opcional.
* **FR-106**: O sistema DEVE oferecer a planilha de custos com uma linha por hora registrada, comissão, custo direto e receita atribuída, com filtros por período, parceiro, pessoa, tipo de custo e atividade, total do filtro e exportação em planilha.
* **FR-107**: O sistema DEVE calcular a receita atribuída ao canal por indicação fechada no sentido parceiro para o grupo: para a Wise Makers, mensalidade vezes o prazo do contrato em meses, limitado ao horizonte de receita configurado (12 meses por padrão); para Tríade e Swallow, o valor total da venda informado. Somam-se as comissões recebidas pelo grupo de parceiros, já pagas.
* **FR-108**: O sistema DEVE calcular, por período, ROI do canal (receita atribuída vezes a margem de contribuição, menos o custo total, dividido pelo custo total), custo por cliente adquirido no ICP e tempo de retorno em meses, conforme o Apêndice M.
* **FR-109**: O sistema DEVE mostrar o resultado do canal por parceiro, nível, modelo de atuação, empresa do grupo e origem do parceiro, com o custo geral do programa à parte e rateio igual entre parceiros assinados quando o administrador ativar.
* **FR-110**: O sistema DEVE sinalizar quando o ROI usa horas sem custo-hora informado.
* **FR-111**: O sistema DEVE mostrar na tela de resultado o número principal (clientes fechados no ICP via parceiros) e os números secundários: parceiros assinados, indicações que viraram reunião e receita atribuída.
* **FR-112**: O sistema DEVE manter o catálogo de atividades por esforço do Apêndice N, com etapa da jornada, tipo e minutos estimados, e sugerir o tipo e os minutos em todo registro que gere atividade.

**Scorecard e nível de entrada (História 3)**

* **FR-113**: O sistema DEVE manter os critérios do scorecard de entrada (Apêndice A) com régua de 0, 0,5 e 1, marcação de essencial e peso, editáveis pelo administrador.
* **FR-114**: O sistema DEVE calcular a nota de potencial e a nota de qualidade e sugerir o nível de entrada conforme o Apêndice A.
* **FR-115**: O sistema DEVE sugerir "não elegível" quando complementaridade ou alinhamento de valores tiver nota zero e permitir seguir só por decisão de administrador com motivo.
* **FR-116**: O sistema DEVE exigir scorecard completo para passar de "qualificação" para "proposta com o decisor".
* **FR-117**: O sistema DEVE guardar cada scorecard com data, autor e versão dos critérios.

**Nível por resultado (História 4)**

* **FR-118**: O sistema DEVE manter os requisitos de cada nível em três grupos (resultado, capacitação e regras), com janela de apuração (180 dias por padrão), conforme o Apêndice B.
* **FR-119**: O sistema DEVE subir o nível no dia em que o parceiro cumprir todos os requisitos de um nível acima, registrar "subida por resultado" e avisar parceiro e responsável.
* **FR-120**: O sistema DEVE rodar a revisão trimestral no primeiro dia útil de janeiro, abril, julho e outubro, colocar em observação quem não cumpre os requisitos do nível atual e propor rebaixamento de um nível a quem continuar sem cumprir na revisão seguinte.
* **FR-121**: O sistema NUNCA DEVE rebaixar um nível sem confirmação de administrador ou do time de parcerias, com motivo.
* **FR-122**: O sistema DEVE isentar da avaliação de rebaixamento os parceiros assinados há menos de 180 dias e os pausados, registrando a isenção.
* **FR-123**: O sistema DEVE ajustar o pacote incompatível com o nível novo ao fim do ciclo do Base Ativa em curso ou 30 dias após a confirmação, o que vier depois, e desativar nessa data as contrapartidas e ações exclusivas do pacote anterior.
* **FR-124**: O sistema DEVE mostrar ao parceiro, em "Meu nível", os requisitos do nível acima com o progresso em cada grupo e, em observação, o prazo e o que falta.

**Onboarding e ativação (História 5)**

* **FR-125**: O sistema DEVE criar, na entrada em onboarding, o plano de 90 dias do Apêndice F, com quatro encontros e três marcos, visível na ficha e no portal do parceiro.
* **FR-126**: O sistema DEVE ativar o parceiro na data da reunião da primeira indicação dele para o grupo com ICP confirmado pela Wise, quando essa data chegar (reunião marcada para o futuro só ativa no dia), mover o parceiro para a etapa "parceria ativa" e gravar o tempo até a ativação.
* **FR-127**: O sistema DEVE alertar aos 90 dias sem ativação, estender o plano até 120 dias e marcar "não ativado" aos 120 dias, sem alterar nível ou contrato.

**Indicações (História 6)**

* **FR-128**: O sistema DEVE gerar para cada parceiro comercial assinado um link exclusivo de indicação, difícil de adivinhar, com QR Code, revogável e regenerável, e revogá-lo no encerramento da parceria.
* **FR-129**: A página do link DEVE ter a identidade da Wise e a logo do parceiro, pedir razão social, CNPJ, nome, cargo, e-mail e telefone do contato, necessidade, as perguntas do ICP e o consentimento do próprio titular, e mostrar apenas uma confirmação neutra após o envio, inclusive em caso de duplicidade.
* **FR-130**: O sistema DEVE proteger a página do link com limite de envios por origem e campo oculto contra robôs, sem gravar envios recusados.
* **FR-131**: O sistema DEVE calcular a nota de qualidade de cada indicação (Apêndice E) e considerar "qualificada" a indicação com ICP confirmado pela Wise, CNPJ e necessidade informados.
* **FR-132**: O sistema DEVE permitir que o time de parcerias e o responsável confirmem ou corrijam a aderência ao ICP informada no registro.
* **FR-133**: O sistema DEVE proteger a indicação por 180 dias contados da última interação registrada com o cliente, recusar novo registro do mesmo cliente para a mesma empresa do grupo dentro do prazo e, depois dele, aceitar e atribuir a quem reengajou, marcar a anterior como "proteção expirada" e avisar o primeiro parceiro.
* **FR-134**: O sistema DEVE controlar os prazos do SLA de indicações do Apêndice E nos dois sentidos, mostrar o prazo de cada etapa na indicação e no portal do parceiro e alertar os prazos vencidos.
* **FR-135**: O sistema DEVE criar, para cada indicação fechada, as checagens de 6 e 12 meses com "cliente segue ativo" e satisfação de 0 a 10.
* **FR-136**: O sistema DEVE permitir ligar uma indicação à ação conjunta que a originou.

**Painel, fase e satisfação (História 7)**

* **FR-137**: O sistema DEVE organizar o painel pelas etapas captação, onboarding, relacionamento e produção, mais o resultado do canal, com a lista de indicadores do Apêndice L, marcação de destaque e meta por indicador, editáveis pelo administrador.
* **FR-138**: O sistema DEVE registrar a fase do programa, sugerir a passagem quando os critérios do Apêndice L forem atingidos e mudar só com confirmação do administrador.
* **FR-139**: O sistema DEVE enviar a pesquisa trimestral de satisfação a cada pessoa ativa de parceiro assinado, aceitar uma resposta por pessoa por trimestre e calcular o NPS.
* **FR-140**: O sistema DEVE mostrar comentários da pesquisa com o nome da pessoa só a administradores e ao time de parcerias.
* **FR-141**: O sistema DEVE incluir no relatório semanal do Diretor o número principal, o ROI do trimestre e os indicadores em destaque.

**Matriz de maturidade (História 8)**

* **FR-142**: O sistema DEVE permitir avaliar cada parceiro nos 8 eixos do Apêndice J, com nota de 1 a 5, nota sugerida pelos dados e justificativa da sugestão.
* **FR-143**: O sistema DEVE guardar cada avaliação com data e autor, calcular média e categoria (fundação, desenvolvimento, escala) e mostrar o radar na ficha.
* **FR-144**: O sistema DEVE oferecer filtro por categoria de maturidade e por nota de eixo, e a visão do programa com radar médio e distribuição por categoria.
* **FR-145**: O sistema DEVE manter avaliação, notas e categoria invisíveis a parceiros e clientes.

**Modelo, proposta de valor e recrutamento (História 9)**

* **FR-146**: O sistema DEVE manter na ficha o modelo de atuação (múltipla escolha, lista configurável) e a proposta de valor em quatro campos: valor desejado pelo parceiro, oferta de valor da Wise, como o valor é entregue e valor criado.
* **FR-147**: O sistema DEVE mostrar modelo e proposta de valor ao parceiro em "Nossa parceria", com alteração por proposta sujeita a validação (FR-073 da v1).
* **FR-148**: O sistema DEVE incluir a etapa "qualificação" entre "reunião realizada" e "proposta com o decisor" e a etapa "parceria ativa" depois de "onboarding".
* **FR-149**: O sistema DEVE oferecer a etapa de pausa "nutrição", com data de retomada obrigatória, cadência de contato configurável e próximos passos automáticos, sem cálculo de morno ou dormente durante a nutrição.
* **FR-150**: O sistema DEVE manter a origem estruturada do parceiro (tipo e detalhe, com vínculo ao parceiro ou à pessoa de origem) e mostrar a conversão do funil por origem.
* **FR-151**: O sistema DEVE registrar as horas por semana combinadas com o responsável do parceiro para o primeiro mês e usá-las na sugestão do critério de disponibilidade do scorecard.

**Capacitação (História 10)**

* **FR-152**: O sistema DEVE permitir que administradores criem trilhas com módulos (vídeo por arquivo ou link, PDF, texto) e teste de múltipla escolha com nota mínima, com versão e publicação.
* **FR-153**: O sistema DEVE registrar o progresso de cada pessoa do parceiro por módulo, liberar o teste ao fim dos módulos e permitir nova tentativa após 24 horas.
* **FR-154**: O sistema DEVE emitir certificado em PDF e selo por pessoa aprovada, com nome, trilha, versão, data e identidade Wise.
* **FR-155**: O sistema DEVE servir os arquivos das trilhas só a usuários de parceiros assinados, por link temporário, e nunca publicá-los no Wise Hub ou em página pública.
* **FR-156**: O sistema DEVE contar pessoas certificadas ativas por parceiro e usar a contagem em requisitos de nível, matriz e ranking.

**Ações conjuntas (História 11)**

* **FR-157**: O sistema DEVE manter o catálogo de ações da Wise por pacote (Apêndice H) e gerar, junto com as contrapartidas da v1, as ações da Wise de cada parceiro assinado.
* **FR-158**: O sistema DEVE mostrar contrapartidas e ações da Wise como um único plano de ações conjuntas, sem que ações da Wise contem como obrigação, atraso ou comprovação do parceiro, com lado, tipo, data prevista, responsável, estado, comprovação, resultado e custo direto.
* **FR-159**: O sistema DEVE alertar ações da Wise atrasadas ao responsável Wise e mostrá-las como atrasadas ao parceiro.
* **FR-160**: O sistema DEVE oferecer o calendário de ações por parceiro, no portal do parceiro e geral, com filtros por mês, lado, tipo e estado.

**Faixas, régua e desligamento (História 12)**

* **FR-161**: O sistema DEVE calcular diariamente as faixas internas destaque, potencial e base pela pontuação do ranking do ano, conforme o Apêndice C.
* **FR-162**: O sistema DEVE manter a régua de atendimento por pacote e por faixa (Apêndice C) e alertar a régua atrasada.
* **FR-163**: O sistema DEVE identificar parceiros em risco pelos critérios do Apêndice D, sem contar os períodos de pausa na janela de 180 dias, conduzir as tentativas de retomada, sugerir o desligamento ao Diretor e exigir a aprovação dele.
* **FR-164**: O sistema DEVE gerar o texto do aviso formal de desligamento com a data de encerramento, retirar o parceiro das novas recomendações de RFP ao gerar o aviso e encerrar a parceria na data, revogando link de indicação e acessos e preservando comissões e indicações abertas.
* **FR-165**: O sistema DEVE cancelar o fluxo de desligamento quando o parceiro em risco registrar indicação qualificada ou comprovar ação.
* **FR-166**: O sistema DEVE permitir o desligamento por inadequação (descumprimento grave, conflito de interesse, risco de reputação), sem tentativas de retomada, com motivo, aprovação do Diretor e aviso de 30 dias.

**Regras, comunicados, ranking e premiação (História 13)**

* **FR-167**: O sistema DEVE gerar a página "Regras do programa" a partir da configuração vigente, com versão, data de vigência e lista de mudanças, sem nunca mostrar a comissão do responsável pela parceria.
* **FR-168**: O sistema DEVE exigir vigência de no mínimo 30 dias para mudanças de regra que afetam parceiros e abrir o rascunho de comunicado aos afetados.
* **FR-169**: O sistema DEVE enviar comunicados a todos ou a recortes por nível, pacote, categoria e tipo de parceria, por e-mail e no portal, com histórico e confirmação de leitura por pessoa.
* **FR-170**: O sistema DEVE calcular a pontuação do ranking (Apêndice K) por ano e trimestre e mostrar ao parceiro a própria posição e os 10 primeiros com nome e pontos, respeitando o anonimato pedido.
* **FR-171**: O sistema DEVE registrar a premiação anual por categoria e ano, com selo para o vencedor.

**Cruzamento de carteiras (História 14)**

* **FR-172**: O sistema DEVE manter a base da Wise para o cruzamento (CNPJ e tipo: cliente ou prospect, por empresa do grupo), importada por administradores e visível só a administradores e ao time de parcerias.
* **FR-173**: O sistema DEVE exigir aceite do termo de cruzamento, com versão, pessoa e data, a cada envio, e oferecer a função só a parceiros comerciais assinados com contrato v2 ou aditivo.
* **FR-174**: O navegador DEVE extrair do arquivo apenas CNPJs válidos e o tipo de cada empresa, recusar arquivos com menos de 20 ou mais de 5.000 CNPJs válidos e enviar só a raiz do CNPJ (8 dígitos) e o tipo. O servidor DEVE aceitar no máximo 1 cruzamento por parceiro a cada 30 dias, para que ninguém descubra clientes da Wise enviando poucos CNPJs de cada vez.
* **FR-175**: O servidor DEVE comparar em memória, gravar só as coincidências e os totais por quadrante e nunca gravar, registrar em log ou armazenar a lista do parceiro.
* **FR-176**: O sistema DEVE mostrar ao parceiro só os totais por quadrante e ao time de parcerias as empresas coincidentes da base da Wise, com o quadrante e a ação sugerida.
* **FR-177**: O sistema DEVE apagar coincidências com mais de 180 dias que não viraram indicação nem ação, e apagar na hora as de um parceiro que pedir exclusão.

**Carteira e metas por pessoa (História 15)**

* **FR-178**: O sistema DEVE manter metas trimestrais por pessoa interna que seja responsável por parceiros (administrador ou time de parcerias) e mostrar o painel pessoal com realizado contra meta, carteira, régua e horas.
* **FR-179**: O sistema DEVE atribuir os resultados à pessoa que era responsável pelo parceiro na data de cada evento.

**Acesso, histórico e exportação**

* **FR-180**: O sistema DEVE aplicar RLS a todas as tabelas novas e cobrir com testes cada linha nova da matriz de permissões do briefing técnico.
* **FR-181**: O sistema DEVE registrar em histórico os eventos novos listados no princípio VI da constituição 2.0.0.
* **FR-182**: O backup semanal DEVE incluir as tabelas novas, sem remuneração individual nos arquivos exportados para fora do papel administrador.

### Alterações em requisitos da v1

| Requisito da v1 | Como fica |
|---|---|
| FR-003 | Exceção: o parceiro vê o ranking do programa, com posição, nome e pontos dos outros parceiros (FR-170) |
| FR-004 | Acrescenta: remuneração, custo-hora, custos e resultado do canal só para administradores (FR-102) |
| FR-005 | Acrescenta faixa de desempenho, matriz de maturidade e fluxo de desligamento entre os dados ocultos de parceiros e clientes; dados de outros parceiros continuam ocultos, salvo o ranking (FR-170) |
| FR-010 | Origem passa a ser estruturada (FR-150); acrescenta modelo de atuação, proposta de valor e horas combinadas (FR-146, FR-151) |
| FR-030 | Etapas: acrescenta "qualificação", "nutrição" e "parceria ativa" (FR-148, FR-149) |
| FR-035 | Além das tarefas do pacote, cria o plano de 90 dias (FR-125) |
| FR-040 | O nível sugerido passa a ser o nível de entrada, calculado pela base no ICP e pelo scorecard (FR-114); o ajuste manual com motivo continua, e mudanças feitas pelas regras de nível (subida por resultado, rebaixamento confirmado) gravam o motivo automaticamente |
| FR-042 | Exceção temporária: depois de um rebaixamento confirmado, o pacote anterior vale até a data do FR-123, registrada como pacote pendente |
| FR-043 | Contrapartidas passam a integrar o plano de ações conjuntas, junto com as ações da Wise (FR-158) |
| FR-049 | Substituído por FR-119 a FR-122: o nível muda por resultado, com carência e confirmação para descer, e nunca por falta de contato |
| FR-052 | A exceção ao primeiro registro por administrador deixa de existir: dentro de 180 dias vale o primeiro registro, sem exceção; depois, a proteção expira sozinha (FR-133) |
| FR-056 | O alerta de indicação sem atualização passa de 30 para 15 dias, dentro do SLA (FR-134) |
| FR-057 | Os indicadores de qualidade passam a usar a nota de qualidade e a indicação qualificada (FR-131) |
| FR-073 | Ampliado: o parceiro também propõe alteração do modelo de atuação e da proposta de valor (FR-147) |
| FR-060 | Catálogo ampliado pelo Apêndice N, com custo calculado por atividade (FR-103, FR-112) |
| FR-065 | Painel reorganizado por etapa da jornada (FR-137); os blocos da v1 continuam disponíveis na lista completa |
| FR-066 | E-mail diário acrescenta SLA vencido, régua atrasada, ações da Wise atrasadas, onboarding sem ativação, parceiros em risco, propostas de rebaixamento e checagens de 6 e 12 meses |
| FR-067 | Relatório semanal acrescenta número principal, ROI e indicadores em destaque (FR-141) |
| FR-070 | Portal do parceiro acrescenta: Meu nível, Nossa parceria, plano de onboarding, capacitação, link de indicação, ações conjuntas, regras do programa, comunicados, ranking, pesquisa de satisfação e cruzamento de carteiras |
| FR-071 | Mantido. As trilhas de venda ficam no portal e nunca no Wise Hub (FR-155) |
| FR-087 | A indicação criada pela RFP segue o SLA (FR-134) e conta na nota de qualidade |
| FR-090 | Configuração ampliada a todos os itens do princípio III da constituição 2.0.0 |
| FR-091 | Regras de nível, régua, SLA e desligamento passam a valer para todos os parceiros a partir da vigência publicada (FR-168), e não só para registros novos; as demais regras continuam valendo só para registros novos |
| FR-095 | Backup inclui as tabelas novas (FR-182) |
| Apêndice A da v1 | Níveis passam a ter nível de entrada (Apêndice A desta feature) e requisitos de permanência (Apêndice B); comissões, ICP, pacotes e estratégico não mudam |
| Apêndice C da v1 | Substituído pelo Apêndice N |

### Key Entities *(include if feature involves data)*

* **Remuneração da pessoa**: valor mensal de referência com vigência, horas de referência e fator de encargos, de onde sai o custo-hora.
* **Custo direto**: lançamento de custo com categoria, valor, data, recorrência, parceiro e ação opcionais.
* **Parâmetros do canal**: horizonte de receita, prazo padrão do contrato, margem de contribuição, rateio do custo geral, ciclo médio da venda direta.
* **Scorecard**: notas por critério, nota de potencial, nota de qualidade, nível de entrada sugerido, versão dos critérios.
* **Requisito de nível e revisão de nível**: requisitos por grupo e nível; resultado de cada revisão por parceiro (cumpre, observação, proposta de rebaixamento, isento), com decisão e motivo.
* **Plano de onboarding**: encontros, marcos, extensão, data de ativação, situação (em andamento, ativado, não ativado).
* **Link de indicação**: token, parceiro, empresas do grupo atendidas, estado, envios.
* **Nota e validação da indicação**: aderência confirmada, nota de qualidade, qualificada, prazos do SLA, proteção.
* **Checagem do cliente indicado**: 6 ou 12 meses, ativo, satisfação.
* **Indicador e meta**: indicador do catálogo, etapa da jornada, destaque, meta por período.
* **Fase do programa**: fase vigente, histórico, critérios de passagem.
* **Resposta de satisfação**: pessoa, trimestre, nota, comentário.
* **Avaliação de maturidade**: notas dos 8 eixos, sugestões, média, categoria, autor e data.
* **Modelo de atuação e proposta de valor**: atributos do parceiro.
* **Origem do parceiro**: tipo, detalhe, parceiro ou pessoa de origem.
* **Trilha, módulo, teste, progresso e certificado**: conteúdo versionado e resultado por pessoa.
* **Ação conjunta**: item do plano com lado, tipo, datas, estado, comprovação, resultado e custo; inclui as contrapartidas da v1.
* **Faixa e régua**: faixa interna por parceiro; cadência por pacote e faixa.
* **Fluxo de desligamento**: em risco, tentativas, sugestão, aprovação, aviso, encerramento.
* **Versão das regras e comunicado**: regras publicadas com vigência; comunicado com recorte, envios e leituras.
* **Pontuação, ranking e premiação**: pontos por evento, posição por período, anonimato, prêmios.
* **Base da Wise, aceite e coincidência do cruzamento**: CNPJ e tipo da base Wise; aceite do termo; coincidências com quadrante e validade.
* **Meta por pessoa**: indicador, trimestre, valor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-101**: Para as mesmas entradas, receita, custo e ROI do portal batem com a planilha modelo `Modelo_Custos_ROI_Canal.xlsx` até o centavo.
* **SC-102**: Depois de 4 semanas de uso, 100% das atividades de pessoas com remuneração cadastrada têm custo calculado e 90% dos pontos de contato têm atividade com esforço.
* **SC-103**: 100% dos parceiros que chegam a "proposta com o decisor" têm scorecard completo.
* **SC-104**: Em cada revisão trimestral, 100% dos parceiros comerciais assinados são avaliados ou isentos com motivo, e nenhum rebaixamento acontece sem confirmação registrada.
* **SC-105**: Depois de 2 meses de uso, 90% das indicações têm validação e primeiro contato dentro do SLA.
* **SC-106**: Toda indicação enviada pelo link aparece para o responsável em até 1 minuto, com atribuição correta, e nenhuma indicação duplicada dentro da proteção de 180 dias é atribuída a outro parceiro.
* **SC-107**: Todo parceiro assinado tem o plano de 90 dias criado no mesmo dia da entrada em onboarding, e a data de ativação é gravada sem ação manual.
* **SC-108**: O parceiro chega aos requisitos do próximo nível em até 2 toques a partir da tela inicial do portal.
* **SC-109**: Em teste de auditoria, nenhum CNPJ não coincidente de um cruzamento existe em tabela, log ou arquivo.
* **SC-110**: Em teste de acesso, nenhum papel além de administrador vê remuneração, custo-hora, custos ou resultado do canal; nenhum parceiro, cliente ou contato do link vê faixa, matriz, fluxo de desligamento, dados de outros parceiros além do ranking ou dados de cruzamento de outro parceiro.
* **SC-111**: A reunião semanal é pautada pelo painel por etapa da jornada em 4 de 4 semanas seguidas.
* **SC-112**: Um certificado é emitido em até 1 minuto depois da aprovação no teste.

## Assumptions

* Esta feature é implementada sobre o código da v1 (migrações 0001 a 0009), com migrações novas e aditivas a partir de 0010. Como não há dados reais, valores calculados de parceiros de teste podem ser recalculados livremente.
* Os dados reais continuam em `specs/001-portal-wise-partners/dados-iniciais/parceiros.csv` (21 parceiros), sem mudança de conteúdo, e entram depois dos testes de acesso desta versão.
* Remuneração de referência inicial: Guilherme Faccin, R$ 4.500,00 por mês, 220 horas mensais e fator de encargos 1,0, conforme pedido, o que dá custo-hora de R$ 20,45. Se a Wise quiser incluir encargos e benefícios, basta mudar o fator. A remuneração do Diretor e de consultores entra quando informada.
* Margem de contribuição inicial de 100%, ou seja, o ROI parte da receita. A Wise pode informar a margem real da consultoria para um ROI sobre margem.
* Prazo padrão do contrato de consultoria: 12 meses, usado quando a indicação não informar o prazo real. Horizonte de receita: 12 meses.
* Meta anual de clientes fechados no ICP via parceiros: não há número definido; o painel mostra o indicador sem meta até o administrador cadastrar uma.
* A meta de 100 parceiros assinados até 30/06/2027 continua configurada.
* Os valores iniciais de scorecard, requisitos de nível, SLA, régua, desligamento, pontuação e fases (apêndices) são proposta inicial, todos editáveis; devem ser revistos na primeira revisão trimestral com dados reais.
* O cruzamento de carteiras só é oferecido a quem assinar o contrato comercial v2 (`referencias/contratos/`) ou aditivo com a cláusula 10.4. O contrato institucional não muda.
* O conteúdo da trilha "Como vender a Wise Makers" é produzido pela Wise; o portal entrega a estrutura e o Apêndice G traz o roteiro. Se hoje houver no Wise Hub vídeos que ensinam a vender a Wise, eles passam para a trilha do portal.
* Não há verba de marketing para parceiros, canal de chamados nem comissão escalonada; comissões seguem fixas.
* A satisfação dos clientes indicados é registrada pelo responsável nas checagens de 6 e 12 meses; o cliente não recebe pesquisa.
* O ciclo médio da venda direta, para comparar com o ciclo via parceiro, é um parâmetro informado pela Wise.

## Apêndice A. Scorecard de entrada e nível de entrada

Cada critério recebe 0, 0,5 ou 1. Essenciais pesam 2, desejáveis pesam 1. Pontuação máxima: 10.

| Critério | Tipo | 0 | 0,5 | 1 |
|---|---|---|---|---|
| Base de clientes no ICP da Wise | Essencial | Menos de 5 empresas ou desconhecida | 5 a 49 empresas | 50 ou mais |
| Complementaridade com a oferta da Wise | Essencial | Concorre ou se sobrepõe à consultoria | Complementa em parte dos clientes | Complementa e os clientes dele precisam com frequência de estruturação comercial |
| Alinhamento de valores e de cultura | Essencial | Sinais de conflito (prática comercial agressiva, reputação ruim, promessas que a Wise não cumpre) | Neutro ou pouco conhecido | Alinhado, com referências positivas |
| Capacidade de prospecção e venda | Desejável | Sem time comercial | Time pequeno ou só relacionamento | Time comercial estruturado e contato frequente com a carteira |
| Disponibilidade de tempo do responsável | Desejável | Sem responsável definido | Responsável com menos de 2 horas por semana no primeiro mês | Responsável nomeado com 2 horas ou mais por semana no primeiro mês |
| Presença regional | Desejável | Fora das regiões atendidas | Parte da carteira nas regiões atendidas | Carteira concentrada nas regiões atendidas (padrão: PR, SC e SP, configurável) |
| Reputação e autoridade no setor | Desejável | Pouco conhecido | Reconhecido na região | Referência no setor (eventos, associações, imprensa) |

* **Nota de potencial** = soma ponderada ÷ 10, em porcentagem.
* **Nota de qualidade** = soma ponderada dos seis critérios além da base ÷ 8, em porcentagem.
* **Nível de entrada**: (1) faixa pela base no ICP: Elite 50 ou mais, Premium 15 a 49, Select menos de 15; (2) se a nota de qualidade for menor que 50%, um nível abaixo, nunca abaixo de Select; (3) a qualidade nunca eleva o nível acima da faixa da base.
* **Não elegível (sugestão)**: nota 0 em complementaridade ou em alinhamento de valores. Base no ICP baixa não elimina: o parceiro entra como Select, "empresa em início" (Apêndice A da v1).
* Parceria institucional não usa scorecard nem nível por resultado nesta versão.

## Apêndice B. Requisitos de nível e revisão trimestral

Janela de apuração do resultado: últimos 180 dias. "Indicação qualificada" e "cliente fechado no ICP" contam só no sentido parceiro para o grupo, nas três empresas.

| Grupo | Select | Premium | Elite |
|---|---|---|---|
| Resultado | Nenhum requisito | 3 indicações qualificadas ou 1 cliente fechado no ICP | 6 indicações qualificadas ou 2 clientes fechados no ICP |
| Capacitação | Nenhum requisito | Responsável certificado em "Como vender a Wise Makers" | 2 pessoas certificadas, incluindo o responsável |
| Regras | Contrato vigente e responsável nomeado | Select mais nenhuma contrapartida do lado do parceiro atrasada há mais de 30 dias | Premium mais ao menos 1 ação conjunta do lado do parceiro concluída e comprovada nos últimos 90 dias |

* **Subida**: no dia em que todos os grupos de um nível acima forem cumpridos. Se a base no ICP atualizada levar a um nível de entrada acima do atual, o portal sugere a subida e a pessoa confirma por escrito (cláusula 3.2 do contrato).
* **Revisão**: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre. Na revisão seguinte, se ainda não cumprir, o portal propõe descer um nível; a decisão é de uma pessoa, com motivo.
* **Isentos**: assinados há menos de 180 dias e pausados.
* **Pacote após descida**: o maior pacote permitido no nível novo, ao fim do ciclo do Base Ativa em curso ou 30 dias após a confirmação, o que vier depois.
* **Regra vigente**: vale a regra em vigor no início do trimestre avaliado.

## Apêndice C. Faixas de desempenho e régua de atendimento

**Faixas internas** (parceiros comerciais assinados, pela pontuação do ranking do ano; só quem tem ao menos 1 ponto entra nas duas primeiras)

| Faixa | Quem | Tratamento |
|---|---|---|
| Destaque | 5% do topo, no mínimo 1 | Reunião mensal com plano de negócios conjunto, revisão trimestral com o Diretor, convite para dar opinião sobre o programa e o portal |
| Potencial | 15% seguintes, no mínimo 1 | Reunião mensal, prioridade nas ações conjuntas, incentivo para completar a capacitação |
| Base | Os demais | Cadência do pacote, comunicados, mentoria mensal coletiva e atendimento pelo canal direto |

**Régua por pacote** (cadência do contrato, cláusula 4.7, mais 7 dias de tolerância para o alerta)

| Pacote | Reunião de acompanhamento | Contato mínimo |
|---|---|---|
| C · Prateleira | Trimestral, 30 min | Prazos de status do nível (v1) |
| B · Formação | Mensal, 45 min | Prazos de status do nível (v1) |
| A · Base Ativa | Quinzenal no ciclo, mensal fora dele | Prazos de status do nível (v1) |

Quando faixa e pacote pedirem cadências diferentes, vale a mais frequente.

## Apêndice D. Critérios e fluxo de desligamento

**Em risco** quando o parceiro comercial assinado, não pausado:

1. está assinado há 180 dias ou mais, sem contar períodos de pausa; e
2. nos últimos 180 dias, sem contar períodos de pausa, não teve nenhuma indicação qualificada e nenhuma contrapartida comprovada do lado do parceiro. Não contam as contrapartidas contínuas, as de assinatura e as comprovadas só por declaração na revisão trimestral.

Status morno ou dormente, sozinho, não coloca o parceiro em risco; ele continua gerando só o alerta da v1.

**Fluxo**

1. Primeira tentativa de retomada: próximo passo criado na hora, com mensagem sugerida que propõe uma reunião.
2. Segunda tentativa: no mínimo 15 dias depois da primeira, registrada como ponto de contato.
3. Sugestão de desligamento: 30 dias depois da segunda tentativa sem resposta ou sem nova atividade do parceiro.
4. Aprovação do Diretor no portal.
5. Aviso formal: texto gerado pelo portal, enviado pelo responsável, com encerramento em 30 dias (cláusula 13.4 do contrato).
6. Encerramento na data: etapa "parceria encerrada", motivo "desligamento por inatividade", link de indicação e acessos revogados, comissões geradas e indicações abertas preservadas.

Qualquer indicação qualificada ou ação comprovada durante o fluxo o cancela. Desligamento por inadequação segue os passos 4 a 6, com motivo.

## Apêndice E. Indicações: nota de qualidade, SLA, proteção e link

**Nota de qualidade** (0 a 100)

| Parte | Pontos |
|---|---|
| Aderência ao ICP | 10 por critério atendido, até 50 |
| Completude | CNPJ 7, contato com consentimento 7, necessidade descrita 6, até 20 |
| Resultado | Virou reunião 20, chegou a proposta 5, fechou 5, até 30 |

**Qualificada**: todos os critérios do ICP confirmados pela Wise, com CNPJ e necessidade informados.

**SLA** (dias úteis, salvo indicação)

| Sentido | Etapa | Prazo |
|---|---|---|
| Parceiro para o grupo | Confirmação de recebimento ao parceiro | Imediata, automática |
| Parceiro para o grupo | Validação (duplicidade e ICP) e primeiro contato com o cliente | 2 dias úteis |
| Parceiro para o grupo | Retorno ao parceiro sobre o primeiro contato | 5 dias úteis do registro |
| Parceiro para o grupo | Atualização enquanto aberta | A cada mudança de etapa e no mínimo a cada 15 dias corridos |
| Grupo para o parceiro | Primeiro contato do parceiro com o cliente | 2 dias úteis |
| Grupo para o parceiro | Atualização no portal pelo parceiro | 5 dias úteis do registro e no mínimo a cada 15 dias corridos |

**Proteção**: 180 dias contados da última interação registrada com o cliente. Conta como interação o registro de indicação desse cliente, para qualquer empresa do grupo, e a atualização dela (etapa, valores, datas, observações ou checagem).

**Link exclusivo**: uma por parceiro comercial assinado; atende a Wise Makers por padrão e, se o administrador marcar, também Tríade e Swallow, com escolha da empresa pelo contato. Limite padrão: 10 envios por hora por endereço de origem.

## Apêndice F. Onboarding em 90 dias

| Quando | Item | O que acontece |
|---|---|---|
| Até 2 dias úteis | Tarefas do pacote (v1) | Prateleira, grupo, dados, Hub, certificado e selo conforme o pacote |
| Até 7 dias | Encontro 1, alinhamento | Objetivos dos dois lados, proposta de valor em 4 pontos, régua, metas dos 90 dias, entrega do link de indicação, convite das pessoas para a trilha |
| Até 30 dias | Encontro 2, vendas | Como reconhecer um cliente no ICP, como abordar e indicar, uso do link |
| Marco 30 dias | Marco | Responsável com a trilha iniciada e ao menos 1 indicação registrada |
| Até 60 dias | Encontro 3, produto | Oferta da Wise, mentoria, Hub, cases e objeções |
| Marco 60 dias | Marco | Responsável certificado e ao menos 1 indicação qualificada |
| Até 90 dias | Encontro 4, pós-venda | SLA, acompanhamento do cliente indicado, comissão, revisão dos resultados |
| Marco 90 dias | Marco | Ativação: primeira indicação com ICP confirmado que virou reunião |
| 90 a 120 dias | Extensão | Sem ativação: alerta, próximo passo de retomada e prazo final de 120 dias |

## Apêndice G. Trilha inicial "Como vender a Wise Makers" (roteiro)

1. Quem é a Wise Makers e que problema ela resolve.
2. O cliente ideal: os cinco critérios do ICP, com exemplos de quem entra e de quem não entra.
3. Como perceber a oportunidade na conversa com o próprio cliente.
4. Como apresentar e indicar: roteiro curto, uso do link exclusivo e do formulário do portal.
5. O que a Wise entrega ao cliente, cases e respostas às objeções mais comuns.
6. Depois da indicação: SLA, acompanhamento, comissão e regras do programa.
7. Teste final: 10 perguntas, nota mínima de 70%.

## Apêndice H. Catálogo inicial de ações da Wise

As ações do parceiro são as contrapartidas do Apêndice D da v1.

| Ação da Wise | Pacote C | Pacote B | Pacote A | Comprovação |
|---|---|---|---|---|
| Anúncio da parceria nos canais da Wise (post e stories) | Uma vez, até 15 dias | Igual | Igual | Link ou print |
| Parceiro na prateleira apresentada aos clientes | Contínuo | Contínuo | Contínuo | Registro na página de RFP |
| Destaque do parceiro em comunicação da Wise à base de clientes | | Trimestral | Trimestral | Link ou print |
| Conteúdo conjunto (post, live ou artigo) | | Trimestral | Bimestral | Link |
| Parceiro convidado em mentoria mensal ou evento da Wise | | | Por ação, mediante acordo | Registro do evento |
| Case conjunto quando houver cliente em comum | | Por ação | Por ação | Link ou arquivo |

## Apêndice I. Cruzamento de carteiras: matriz e salvaguardas

**Matriz** (adaptada da matriz de mapeamento de contas do livro)

| | Cliente do parceiro | Prospect do parceiro |
|---|---|---|
| **Cliente da Wise** | Cliente em comum: case conjunto e ação de relacionamento | A Wise pode apresentar o parceiro (indicação do grupo para o parceiro) |
| **Prospect da Wise** | O parceiro pode apresentar a Wise (indicação do parceiro para o grupo) | Ação conjunta de marketing ou de venda |

**Salvaguardas**

* Facultativo, só para parceiros comerciais com contrato v2 ou aditivo, com aceite do termo a cada envio.
* Mínimo de 20 CNPJs por envio e no máximo 1 cruzamento por parceiro a cada 30 dias.
* Só CNPJ de pessoa jurídica e tipo; nenhum nome, e-mail ou telefone de pessoa.
* O navegador envia só a raiz do CNPJ (8 dígitos). O servidor compara em memória e descarta a lista no mesmo processamento; nada da lista vai para tabela, log ou armazenamento.
* Ficam só as coincidências, por até 180 dias, salvo as que viraram indicação ou ação.
* O parceiro vê totais por quadrante; o time de parcerias vê as empresas coincidentes da base da Wise.
* Nenhuma das partes aborda cliente da outra apresentando-se como indicada sem acordo prévio caso a caso.
* Exclusão sob pedido, imediata.

## Apêndice J. Matriz de maturidade por parceiro

| Eixo | 1 | 3 | 5 | Sugestão automática |
|---|---|---|---|---|
| 1. Objetivo comum | Sem objetivo comum registrado | Proposta de valor com os 4 pontos preenchida | Objetivos dos dois lados revistos e com resultado medido | 1 sem proposta; 3 com proposta; 4 com proposta e cliente fechado |
| 2. Modelo e regras | Modelo de atuação indefinido | Modelo definido, contrato assinado e instrumento resolvido | Regras funcionando nos dois sentidos, com indicações e comissões em dia | Pelo modelo, contrato e indicações nos dois sentidos |
| 3. Aderência ao perfil | Nota de potencial do scorecard abaixo de 40% | Nota de potencial de 60% a 74% | Nota de potencial de 90% ou mais | 40 a 59% vale 2; 75 a 89% vale 4 |
| 4. Capacitação | Ninguém na trilha | Responsável certificado | 2 ou mais certificados e ativação no onboarding | 2 com trilha iniciada; 4 com 2 certificados |
| 5. Ida ao mercado conjunta | Nenhuma ação nem indicação | Indicações em um sentido e ações conjuntas feitas | Indicações nos dois sentidos, ações regulares e cruzamento feito | Pelo volume de indicações e ações em 180 dias |
| 6. Programa | Em observação ou contrapartidas atrasadas | Requisitos do nível atual cumpridos | Requisitos do nível acima cumpridos, ou Elite com folga | Pela revisão de nível |
| 7. Relacionamento | Régua atrasada e responsável inativo | Régua em dia | Régua em dia, satisfação 9 ou 10 e responsável ativo dos dois lados | Pela régua e pela pesquisa |
| 8. Gestão e resultado | Sem dados de resultado | Clientes fechados registrados | ROI do parceiro positivo e clientes ativos aos 12 meses | Pelo ROI e pelas checagens |

Notas 2 e 4 são intermediárias. Categoria pela média: fundação abaixo de 2,5; desenvolvimento de 2,5 a 3,9; escala a partir de 4,0.

## Apêndice K. Ranking e premiação

| Evento (sentido parceiro para o grupo) | Pontos |
|---|---|
| Indicação qualificada | 2 |
| Indicação que virou reunião | 3 |
| Cliente fechado no ICP | 10 |
| Pessoa certificada (uma vez por pessoa e trilha) | 2 |
| Ação conjunta do parceiro concluída e comprovada no prazo | 1 |

Ranking do ano (janeiro a dezembro) e do trimestre. Empate: mais clientes fechados, depois assinatura mais antiga.

**Premiação anual** (categorias iniciais, editáveis): Parceiro do ano (maior pontuação), Mais clientes no ICP, Melhor estreante (assinado no ano), Destaque em capacitação (mais pessoas certificadas).

## Apêndice L. Fase do programa e indicadores por etapa da jornada

**Fases e critérios de passagem** (sugestão; confirmação do administrador)

| De | Para | Critérios |
|---|---|---|
| Experimentação | Tração | 5 parceiros ativados, 3 clientes fechados no ICP via parceiros e ao menos 5 respostas na pesquisa de satisfação |
| Tração | Crescimento acelerado | 20 parceiros ativados, conversão de indicação em venda estável por 2 trimestres e 80% dos clientes indicados ativos aos 6 meses |
| Crescimento acelerado | Otimização | Receita via parceiros igual ou maior que 30% da receita nova da Wise e ROI do canal positivo por 2 trimestres |

**Indicadores** (★ = destaque inicial)

| Etapa | Indicadores |
|---|---|
| Captação | ★ Parceiros assinados contra meta; ★ conversão do funil de recrutamento; ★ conversão por origem; ★ tempo médio até a assinatura; ★ nota média do scorecard; ★ perdas por motivo; parceiros em nutrição; negociações paradas |
| Onboarding | ★ Parceiros ativados; ★ tempo até a primeira indicação; ★ tempo até a ativação; ★ marcos de 30, 60 e 90 dias cumpridos; ★ pessoas certificadas; ★ ativados em até 90 dias (%); não ativados |
| Relacionamento | ★ Parceiros ativos sobre assinados; ★ satisfação dos parceiros (NPS); ★ régua em dia (%); ★ contrapartidas e ações em dia (%); ★ distribuição por nível e por faixa; ★ saída de parceiros; parceiros em observação e em risco; propostas de rebaixamento |
| Produção | ★ Clientes fechados no ICP (número principal); ★ conversão indicação, reunião, proposta e venda; ★ indicações dentro do SLA (%); ★ ciclo de venda via parceiro contra venda direta; ★ receita atribuída por parceiro e por nível; ★ clientes ativos aos 6 e 12 meses e satisfação; eficiência de vendas (vendas do mês ÷ parceiros ativos); indicações por parceiro; nota média de qualidade |
| Resultado do canal | ★ ROI; ★ custo total por tipo; ★ custo por cliente no ICP; ★ tempo de retorno; ★ horas por parceiro e por etapa; ★ participação dos parceiros na receita nova da Wise |

## Apêndice M. ROI do canal: fórmulas e parâmetros

**Custo-hora** = remuneração mensal ÷ horas mensais de referência × fator de encargos.
Valor inicial do Guilherme Faccin: R$ 4.500,00 ÷ 220 × 1,0 = **R$ 20,4545... por hora**, exibido como R$ 20,45 (R$ 0,34 por minuto). Os cálculos usam o valor sem arredondamento.

**Custo do canal no período** = horas registradas × custo-hora da época + comissões ao parceiro + comissões ao responsável + custos diretos (inclusive custo geral do programa).
Comissões entram na data de fechamento da indicação, a mesma da receita, para que receita e custo de um cliente caiam no mesmo período.

**Receita atribuída no período** = soma, pelas indicações fechadas no período no sentido parceiro para o grupo, de: Wise Makers, mensalidade × min(prazo do contrato, horizonte); Tríade e Swallow, valor total da venda; mais as comissões recebidas pelo grupo e pagas no período.

**ROI** = (receita atribuída × margem de contribuição − custo do canal) ÷ custo do canal.
**Custo por cliente no ICP** = custo do canal ÷ clientes fechados no ICP no período.
**Tempo de retorno (meses)** = custo do canal acumulado ÷ (receita mensal recorrente dos clientes do canal × margem).

**Parâmetros**: horas mensais de referência 220; fator de encargos 1,0; horizonte de receita 12 meses; prazo padrão do contrato 12 meses; margem de contribuição 100%; rateio do custo geral desligado; ciclo médio da venda direta a informar.

**Exemplo de horas**: 40 horas no mês × R$ 20,4545... = R$ 818,18.

## Apêndice N. Catálogo de atividades por esforço

Substitui o Apêndice C da v1. Minutos estimados, ajustáveis em cada registro.

| Etapa | Atividade | Minutos |
|---|---|---|
| Captação | Pesquisa e preparação da abordagem | 20 |
| Captação | Mensagem ou follow-up | 5 |
| Captação | Ligação | 15 |
| Captação | Reunião de apresentação (45 min mais preparação) | 75 |
| Captação | Preparação de dossiê ou apresentação personalizada | 60 |
| Captação | Preenchimento do scorecard | 15 |
| Captação | Negociação e ajuste de proposta | 45 |
| Captação | Documento enviado (minuta, resumo, proposta) | 30 |
| Captação | Geração e revisão da minuta de contrato | 30 |
| Captação | Aprovação de assinatura com o Diretor | 15 |
| Captação | Contato de nutrição | 10 |
| Onboarding | Tarefas de implantação do pacote | 60 |
| Onboarding | Encontro de alinhamento | 60 |
| Onboarding | Encontro de vendas | 60 |
| Onboarding | Encontro de produto | 60 |
| Onboarding | Encontro de pós-venda | 45 |
| Onboarding | Emissão de certificado e selos | 15 |
| Relacionamento | Check-in mensal | 45 |
| Relacionamento | Check-in trimestral | 30 |
| Relacionamento | Revisão de nível do parceiro | 20 |
| Relacionamento | Avaliação de maturidade | 20 |
| Relacionamento | Tentativa de retomada | 15 |
| Relacionamento | Desligamento (aviso e encerramento) | 45 |
| Relacionamento | Resposta a dúvida do parceiro | 10 |
| Relacionamento | Validação de proposta de ficha ou de comprovação | 5 |
| Ida ao mercado conjunta | Tratamento de indicação (validação e repasse) | 15 |
| Ida ao mercado conjunta | Atualização de indicação | 5 |
| Ida ao mercado conjunta | Checagem do cliente aos 6 ou 12 meses | 10 |
| Ida ao mercado conjunta | Ação conjunta de marketing (arte, post, envio) | 60 |
| Ida ao mercado conjunta | Evento ou palestra | 180 |
| Ida ao mercado conjunta | Encontro do Base Ativa (com preparação) | 90 |
| Ida ao mercado conjunta | Análise de cruzamento de carteiras | 45 |
| Gestão | Revisão semanal com o Diretor | 30 |
| Gestão | Preparação da pauta e do relatório | 20 |
| Gestão | Comunicado à base de parceiros | 30 |
| Gestão | Produção ou atualização de conteúdo de trilha | 120 |
| Gestão | Análise da pesquisa de satisfação | 30 |
| Gestão | Premiação anual | 240 |
| Gestão | Gestão geral do programa (sem parceiro) | 60 |

## Apêndice O. Alterações no contrato comercial (v2)

O contrato institucional não muda. No contrato comercial, versão 2, em `referencias/contratos/`:

| Cláusula | Mudança |
|---|---|
| 3.1 | Nível de entrada pela carteira no perfil, ajustado pela qualificação de entrada das Regras do Programa |
| 3.2 | Revisão trimestral por resultado, capacitação e regras; subida imediata; descida só depois de um trimestre de aviso e por confirmação escrita; nunca pela simples ausência de contato |
| 3.5 | Pacote acompanha o nível na descida, ao fim do ciclo do Base Ativa em curso ou 30 dias após a confirmação |
| 3.6 (nova) | Regras do Programa publicadas no Portal, alteráveis com 30 dias de aviso, sem mudar as comissões |
| 5.4 | Sem meta obrigatória; resultados influenciam só o nível (3.2) e o critério de encerramento (13.3) |
| 9.2 | Proteção de 180 dias desde a última interação; depois dela, atribuição a quem reengajou, com aviso |
| 9.1 | Inclui o formulário do link exclusivo de indicação como registro de origem |
| 9.4 (nova) | Prazos de resposta às indicações (SLA) como obrigação de meio, nos dois sentidos |
| 10.1 | Ressalva o cruzamento de carteiras |
| 10.4 (nova) | Cruzamento de carteiras facultativo, com aceite, só CNPJ, lista descartada, coincidências por até 180 dias |
| 13.3 | Ausência de indicações, por si só, não encerra; encerramento por inatividade segue as Regras do Programa, com tentativas de retomada e o aviso de 13.4 |
| 16.1 | Inclui as confirmações escritas de 3.2 e 3.5 |
