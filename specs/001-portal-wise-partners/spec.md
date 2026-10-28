# Feature Specification: Portal Wise Partners

**Feature Branch**: `001-portal-wise-partners`

**Created**: 2026-10-23

**Status**: Ready for planning

**Input**: User description: "Criar um portal web para governar o programa de parcerias Wise Partners, substituindo o RD Station. O portal organiza os parceiros por setor (categoria de prateleira), com campos próprios de cada categoria, registra pontos de contato, próximos passos, classificação, contrapartidas, contratos, indicações e comissões das três empresas do grupo, gera contratos em PDF e Word, envia alertas por e-mail e mantém um painel para a reunião semanal. Parceiros têm um portal próprio. Consultores e gerentes de conta registram pedidos de RFP de clientes, recebem recomendação de parceiros por IA e geram uma página exclusiva, montada por IA em blocos, com a identidade visual da Wise, em que o cliente vê a ficha de pelo menos 3 opções por categoria na perspectiva da Wise e fala com cada parceiro pelo WhatsApp. Tudo construído de uma vez, para cerca de 100 parceiros até meados de 2027."

## Contexto

O Wise Partners é o programa de parcerias da Wise Makers, consultoria de estruturação comercial de Maringá/PR, que faz parte de um grupo com a Tríade (marketing e geração de demanda) e a Swallow (produção audiovisual). Hoje há cerca de 20 parceiros em conversa, nenhum contrato assinado e a meta de chegar a cerca de 100 até meados de 2027.

As informações estão espalhadas entre conversas de IA, WhatsApp, e-mail, documentos e um RD Station que não é usado no dia a dia e é compartilhado com outras empresas do grupo. Problemas relatados: follow-ups esquecidos, perda de contexto de cada parceiro, falta de visão geral para a reunião semanal entre o Gerente de Parcerias e o Diretor, dificuldade de lembrar o diferencial de cada parceiro e risco de não conseguir apresentar os parceiros de forma organizada quando um cliente precisar.

Os documentos de referência do programa estão em `referencias/` (playbook, modelos de contrato, design system e dossiês). Onde o playbook falar em "carteira industrial", vale o ICP descrito no Apêndice A.

**Públicos**

| Público | Quem | O que faz |
|---|---|---|
| Administrador | Guilherme Faccin (Gerente de Parcerias), Igor Makoto (Diretor) | Tudo, incluindo configuração, usuários e aprovações. Só Igor aprova assinaturas |
| Time de parcerias | Quem conduz parceiros | Cadastra e atualiza parceiros, registra contatos, contratos, indicações e comissões; único papel interno, além dos administradores, que vê comissões |
| Consultor ou gerente de conta | Consultores da Wise e gerentes de conta da Wise, da Tríade e da Swallow | Consulta parceiros, registra pedidos de RFP, gera páginas de RFP, registra indicações, sem ver comissões |
| Comercial | Time comercial do grupo | Consulta a prateleira e registra indicações, sem ver comissões |
| Financeiro | Responsável financeiro | Recebe aviso de comissões a pagar; acesso opcional à tela de comissões |
| Parceiro | Usuários da empresa parceira | Acompanha a parceria, propõe atualização da própria ficha, indica clientes, vê os RFPs em que foi apresentado |
| Cliente | Cliente da Wise ou do grupo | Não tem conta. Abre a página de RFP enviada pelo consultor |

## User Scenarios & Testing *(mandatory)*

Todas as histórias fazem parte da primeira versão. As prioridades indicam a ordem de construção e de validação.

### User Story 1 - Carteira de parceiros organizada por setor (Priority: P1)

O Gerente de Parcerias abre o portal e vê os parceiros agrupados por categoria de prateleira. Em cada categoria, vê quantos parceiros existem, em que etapa estão, quantos estão assinados e se a categoria tem as 3 opções que o programa exige. Abre a ficha de qualquer parceiro e encontra em um só lugar: dados da empresa, perfil comum, campos específicos da categoria, contatos, tipo de parceria, nível, pacote, diferenciais, etapa, próximo passo, linha do tempo, documentos, contrapartidas, indicações e comissões.

**Why this priority**: É a base de tudo e resolve a perda de contexto e o esquecimento dos diferenciais.

**Independent Test**: Cadastrar 20 parceiros em categorias diferentes e verificar a visão por categoria, os filtros, os campos específicos de cada categoria e a ficha completa, no computador e no celular.

**Acceptance Scenarios**:

1. **Given** parceiros em várias categorias, **When** o usuário abre a visão por categoria, **Then** vê cada categoria com o total de parceiros, o total de assinados e um aviso nas que têm menos de 3 assinados.
2. **Given** um parceiro com mais de uma solução, **When** ele é cadastrado em uma categoria principal e outras secundárias, **Then** aparece em todas, com a principal identificada, e a ficha mostra os campos específicos de cada uma delas.
3. **Given** um parceiro na categoria ERP, **When** o usuário abre a ficha, **Then** vê os campos específicos de ERP definidos em `categorias-campos.md` (por exemplo, módulos, modelo de implantação, mínimo de usuários) além do perfil comum.
4. **Given** a lista de parceiros, **When** o usuário filtra por tipo, categoria, nível, pacote, etapa, status de atividade, responsável, cidade ou por um campo específico da categoria, **Then** a lista mostra só os que atendem a todos os filtros.
5. **Given** a ficha, **When** aberta no celular, **Then** todas as seções são legíveis e editáveis sem rolagem horizontal.

---

### User Story 2 - Registro de pontos de contato e próximos passos (Priority: P1)

Depois de uma reunião, ligação, mensagem ou e-mail, o usuário registra o contato em menos de 1 minuto: escolhe o tipo, cola um texto ou uma transcrição já feita (Gemini, gravador do celular), ou envia um print ou documento. A IA resume, lê o texto do print, sugere o próximo passo com data e aponta mudanças (por exemplo, "parceiro pediu minuta", "carteira informada: 60 clientes"). O usuário revisa, ajusta e confirma.

**Why this priority**: Mantém o portal vivo e resolve o esquecimento de follow-ups e o contexto espalhado.

**Independent Test**: Registrar 10 contatos de tipos diferentes, incluindo uma transcrição longa e um print de WhatsApp, e verificar linha do tempo, resumo, próximo passo e data do último contato.

**Acceptance Scenarios**:

1. **Given** a ficha de um parceiro, **When** o usuário registra um contato com tipo, data, participantes e texto, **Then** o contato aparece na linha do tempo e a data do último contato é atualizada.
2. **Given** uma transcrição colada, **When** o usuário pede o resumo, **Then** a IA devolve resumo, decisões, pendências de cada lado, sugestão de próximo passo com data e sugestões de atualização da ficha, e nada é gravado até a confirmação.
3. **Given** um print de conversa enviado, **When** o usuário pede a leitura, **Then** a IA extrai o texto da imagem, com datas e autores das mensagens, para revisão.
4. **Given** um próximo passo com data, **When** a data passa sem novo contato, **Then** o próximo passo fica marcado como vencido.
5. **Given** qualquer tela, **When** o usuário toca em "registrar contato", **Then** abre o registro rápido com busca do parceiro.

---

### User Story 3 - Painel semanal, relatório do Diretor e alertas por e-mail (Priority: P1)

Na reunião semanal, o Gerente de Parcerias e o Diretor pautam a conversa pelo painel: distância até a meta de assinados, funil por etapa, follow-ups vencidos, parceiros esfriando, negociações paradas, contrapartidas atrasadas, indicações e comissões do período, fila do Base Ativa e categorias sem as 3 opções. Todo dia útil às 7h, cada responsável recebe um e-mail com o que precisa de ação. Toda semana, o Diretor recebe um relatório do programa inteiro.

**Why this priority**: Resolve a falta de visão geral e o esquecimento com o menor esforço.

**Independent Test**: Com dados de teste que incluam follow-ups vencidos, parceiros mornos e indicações paradas, verificar o painel, o e-mail diário de cada responsável e o relatório semanal do Diretor.

**Acceptance Scenarios**:

1. **Given** dados do programa, **When** o usuário abre o painel, **Then** vê os indicadores acima, cada um com acesso aos parceiros que o compõem.
2. **Given** o painel, **When** o usuário escolhe um período, **Then** os indicadores de indicações, contratos e comissões são recalculados.
3. **Given** pendências de vários responsáveis, **When** são 7h de um dia útil, **Then** cada responsável recebe um único e-mail com os próprios itens, agrupados por tipo, com link para cada ficha; quem não tem pendência não recebe.
4. **Given** a semana encerrada, **When** chega o horário configurado, **Then** o Diretor recebe o relatório semanal com os indicadores do painel, as mudanças da semana e os pontos de atenção.
5. **Given** o painel, **When** o usuário pede a "pauta da semana", **Then** o sistema gera um texto com os pontos para a reunião, pronto para copiar.

---

### User Story 4 - Negociação, aprovação e geração do contrato (Priority: P2)

O parceiro percorre as etapas do funil. Na negociação, o usuário preenche o Quadro de Identificação e o portal gera a minuta do contrato (Parceria Comercial ou Parceria Institucional) em PDF e em Word, a partir dos modelos oficiais. Igor aprova no portal. O contrato é enviado para assinatura no Autentique fora do portal, e o PDF assinado é anexado. Perdas são registradas com motivo.

**Why this priority**: Organiza o caminho até a meta de assinaturas, elimina o preenchimento manual da minuta e garante a aprovação do Diretor.

**Independent Test**: Levar um parceiro de "sem contato" a "onboarding", gerar a minuta, aprovar, anexar o contrato assinado e verificar histórico e tarefas de onboarding.

**Acceptance Scenarios**:

1. **Given** o Quadro de Identificação preenchido, **When** o usuário gera a minuta, **Then** recebe o contrato do tipo certo em PDF e em Word, com todos os campos preenchidos e as opções marcadas, salvo como nova versão na ficha.
2. **Given** um campo obrigatório do Quadro vazio, **When** o usuário tenta gerar a minuta, **Then** o sistema aponta o que falta.
3. **Given** um parceiro em "proposta com o decisor", **When** alguém tenta passar para "fechamento" sem aprovação de Igor, **Then** o sistema bloqueia; só o usuário Igor consegue aprovar.
4. **Given** a aprovação registrada, **When** o contrato assinado é anexado, **Then** o parceiro pode passar para "onboarding" e o sistema cria as tarefas do pacote com prazo de 2 dias úteis e envia o convite de acesso ao responsável do parceiro.
5. **Given** um parceiro que desistiu, **When** o usuário registra a perda, **Then** precisa escolher o motivo (não elegível, sem interesse, parceria encerrada).
6. **Given** um parceiro com programa de parceiros próprio, **When** o usuário registra o instrumento dele (nome, comissão que paga, exigências como cadastro ou atividade econômica), **Then** isso aparece no Quadro e no contrato gerado.

---

### User Story 5 - Classificação, pacote, contrapartidas e status de atividade (Priority: P2)

O usuário informa quantos clientes da carteira do parceiro estão no ICP da Wise, e o sistema sugere o nível. O usuário escolhe o pacote disponível para o nível, e o sistema carrega as contrapartidas do pacote, com periodicidade e forma de comprovação. A cada comprovação, o usuário (ou o parceiro, pelo portal) anexa a evidência e a Wise valida. Atrasos geram alerta, nunca punição. O status de atividade é calculado sozinho.

**Why this priority**: Aplica as regras do programa, equilibra a relação com o parceiro e mostra a saúde de cada um sem trabalho manual.

**Independent Test**: Cadastrar parceiros dos três níveis com datas de último contato e contrapartidas diferentes, e verificar sugestão de nível, lista de contrapartidas, alertas e status calculado.

**Acceptance Scenarios**:

1. **Given** a carteira no ICP informada, **When** o valor é 50 ou mais, **Then** o sistema sugere Elite; de 15 a 49, Premium; abaixo de 15, Select. Ajuste manual exige motivo.
2. **Given** um parceiro Premium, **When** o usuário escolhe o pacote, **Then** só os pacotes C e B ficam disponíveis.
3. **Given** um pacote escolhido, **When** salvo, **Then** as contrapartidas do Apêndice D para aquele pacote e nível são criadas com as próximas datas de comprovação.
4. **Given** uma comprovação enviada pelo parceiro, **When** a Wise a valida, **Then** a contrapartida fica em dia até a próxima data; se recusada, volta para pendente com o motivo.
5. **Given** uma contrapartida vencida, **When** o status é recalculado, **Then** aparece como atrasada no painel, no e-mail do responsável e no portal do parceiro, e nenhuma entrega é suspensa.
6. **Given** um parceiro Elite sem contato ou indicação há 31 dias, **When** o status é recalculado, **Then** passa para morno, e o motivo da inatividade fica obrigatório.
7. **Given** um parceiro morno, **When** um contato ou indicação é registrado, **Then** volta para ativo; o nível nunca muda por inatividade.
8. **Given** carteira no ICP acima de 100, ou 3 indicações que viraram reunião em 90 dias, **When** os dados mudam, **Then** o sistema sugere a marcação de parceiro estratégico, visível só para o time interno.

---

### User Story 6 - Indicações e comissões das três empresas (Priority: P2)

Um usuário interno ou o parceiro registra uma indicação: do parceiro para a Wise Makers, a Tríade ou a Swallow, ou de uma dessas empresas para o parceiro. A indicação guarda cliente, origem, aderência ao ICP, etapa, valores e comissões. O sistema calcula a comissão devida ao parceiro e a do responsável pela parceria conforme a regra de cada empresa, avisa o financeiro por e-mail quando há comissão a pagar e registra a comissão a receber do parceiro conforme o instrumento dele. Quando a indicação vai da Wise para o parceiro, qualquer um dos dois pode atualizar o resultado, mas a responsabilidade de manter o registro é da Wise.

**Why this priority**: É o resultado do programa: mostra quem traz negócio, de que qualidade, e controla o que pagar e receber.

**Independent Test**: Registrar indicações nos dois sentidos para as três empresas, fechar algumas e verificar comissões, aviso ao financeiro e indicadores de qualidade por parceiro.

**Acceptance Scenarios**:

1. **Given** uma indicação do parceiro para a Wise Makers, **When** o contrato é fechado e a primeira mensalidade informada, **Then** o sistema calcula 40% da primeira mensalidade para o parceiro e 10% para o responsável pela parceria, ambos "aguardando compensação".
2. **Given** uma indicação para a Tríade, **When** fechada, **Then** o cálculo usa 40% da primeira parcela para o parceiro e 10% para o responsável; para a Swallow, 6% do valor do projeto para o parceiro e 2% para o responsável.
3. **Given** a compensação do primeiro pagamento registrada, **When** a comissão passa para "a pagar", **Then** o financeiro recebe um e-mail com parceiro, cliente, empresa, valor, dados para nota fiscal e link.
4. **Given** um cliente já registrado em outra indicação, **When** alguém tenta registrá-lo de novo, **Then** o sistema avisa e aplica o primeiro registro, com exceção justificada por administrador para contato sem interação há 6 meses ou mais.
5. **Given** uma indicação da Wise para o parceiro, **When** o parceiro atualiza o resultado pelo portal, **Then** a atualização fica pendente de confirmação da Wise, e o responsável Wise é avisado; indicações sem atualização há 30 dias entram nos alertas do responsável.
6. **Given** as indicações de um parceiro, **When** o usuário abre os indicadores, **Then** vê total, percentual no ICP, percentual com reunião, percentual fechado, receita gerada por empresa, comissão paga e a receber.
7. **Given** um usuário consultor, gerente de conta ou comercial, **When** abre uma indicação, **Then** não vê nenhum valor de comissão.
8. **Given** uma indicação registrada ou atualizada, **When** salva, **Then** o status de atividade do parceiro é recalculado.

---

### User Story 7 - Atividades e Base Ativa (Priority: P2)

Cada ponto de contato e entrega tem um tipo (reunião, check-in, encontro do Base Ativa, documento enviado, evento). O portal mostra o histórico de atividades por parceiro e por pessoa, com tempo estimado apenas como informação, sem limite de horas. Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.

**Why this priority**: Dá visibilidade do esforço por parceiro e organiza o Base Ativa, sem exigir apontamento de horas.

**Independent Test**: Registrar atividades de vários tipos e acompanhar um parceiro do pacote A da fila até a conclusão do ciclo.

**Acceptance Scenarios**:

1. **Given** atividades registradas, **When** o usuário abre a ficha ou o painel, **Then** vê quantidade de atividades por tipo e tempo estimado por parceiro no período, sem alerta de limite.
2. **Given** um parceiro com pacote A assinado, **When** entra em onboarding, **Then** vai para a fila do Base Ativa, com estratégicos à frente e, depois, ordem de assinatura; o administrador decide quando iniciar cada ciclo.
3. **Given** um parceiro em ciclo, **When** dois encontros seguidos são registrados como não realizados por indisponibilidade dele, **Then** o ciclo é marcado como suspenso e o responsável é avisado.
4. **Given** um ciclo concluído com o evento final registrado, **When** salvo, **Then** o portal registra o certificado metodológico do responsável do parceiro e agenda a revisão em 6 meses.

---

### User Story 8 - Portal do parceiro (Priority: P3)

O responsável do parceiro entra com e-mail e senha e vê: resumo da parceria (nível, pacote, início), entregas e contrapartidas com o que está em dia e pendente, onde enviar comprovações, indicações feitas e recebidas com status e comissões, os pedidos de RFP em que foi apresentado (com o nome do cliente), materiais (certificado, selos, apresentações), calendário da mentoria mensal e dos eventos, páginas institucionais da Wise Makers, da Tríade e da Swallow e o botão de acesso ao Wise Hub. Ele propõe atualizações da ficha de apresentação, que só valem depois de validadas pela Wise, e registra novas indicações para qualquer das três empresas.

**Why this priority**: Dá transparência ao parceiro e reduz o trabalho da Wise para manter fichas e indicações atualizadas, mas depende de parceiros assinados.

**Independent Test**: Criar dois parceiros com usuários próprios e verificar isolamento de dados, proposta de alteração de ficha com validação, envio de comprovação e registro de indicação.

**Acceptance Scenarios**:

1. **Given** um usuário do parceiro A, **When** navega ou tenta acessar endereços de outro parceiro, **Then** nunca vê dados do parceiro B.
2. **Given** a ficha de apresentação, **When** o parceiro altera diferenciais, cases ou campos da categoria, **Then** a alteração fica pendente, a ficha publicada não muda e o responsável Wise é avisado; ao aprovar, a nova versão passa a valer.
3. **Given** um parceiro com pacote B ou A, **When** abre o portal, **Then** vê o botão de acesso ao Wise Hub, que abre a plataforma do Hub em outra aba; parceiros do pacote C não veem o botão.
4. **Given** o formulário de indicação, **When** o parceiro escolhe a empresa de destino (Wise Makers, Tríade ou Swallow), preenche o cliente e declara o consentimento, **Then** a indicação entra como nova e o responsável Wise é avisado.
5. **Given** pedidos de RFP em que o parceiro foi apresentado, **When** ele abre a área de RFPs, **Then** vê data, cliente, necessidade resumida e se o cliente clicou para falar com ele, sem ver os outros parceiros apresentados.
6. **Given** o portal do parceiro, **When** ele navega, **Then** nunca vê a marcação de estratégico, anotações internas, comissões de outros, nem a comissão do responsável pela parceria.
7. **Given** um usuário do parceiro que saiu da empresa, **When** o responsável do parceiro o desativa, **Then** ele perde o acesso e o histórico é mantido.

---

### User Story 9 - Pedido de RFP com recomendação por IA e página exclusiva do cliente (Priority: P3)

O cliente nunca faz o pedido sozinho. Quando precisa de um fornecedor fora do escopo da Wise, ele fala com o consultor ou o gerente de conta, que registra o pedido: cliente, necessidade em texto livre, porte, região, prazo e restrições. A IA identifica as categorias envolvidas (uma necessidade pode cruzar várias, como ERP e BPM) e recomenda, em cada categoria, os parceiros assinados mais aderentes, com justificativa. O consultor ajusta a seleção (no mínimo 3 por categoria sempre que houver 3 ou mais assinados) e a IA monta uma página em blocos com a identidade da Wise: abertura com a necessidade, um bloco por categoria, a ficha de cada parceiro na perspectiva da Wise, o aviso de relação comercial e o contato do consultor. O consultor revisa e publica. O cliente abre o link direto, sem senha, e em cada ficha encontra um botão que abre o WhatsApp do parceiro com uma mensagem pronta.

**Why this priority**: Transforma a prateleira em valor para o cliente e para os parceiros. Depende de parceiros assinados e com fichas preenchidas.

**Independent Test**: Com 5 parceiros assinados em ERP e 3 em BPM, registrar um pedido que cruza as duas categorias, obter a recomendação, publicar a página, abrir pelo celular, clicar em um botão de WhatsApp e verificar indicações, cliques e notificações.

**Acceptance Scenarios**:

1. **Given** um pedido com a necessidade descrita, **When** o consultor pede a recomendação, **Then** a IA sugere as categorias e, em cada uma, parceiros assinados ordenados por aderência com justificativa curta, considerando os campos específicos da categoria, o tipo e o porte de cliente atendido, a região e os diferenciais; nunca sugere parceiro sem contrato assinado.
2. **Given** uma categoria com 3 ou mais assinados, **When** o consultor tenta publicar com menos de 3 opções nela, **Then** o sistema bloqueia e explica a regra; com menos de 3 assinados, permite e registra a exceção.
3. **Given** a seleção confirmada, **When** a IA monta a página, **Then** ela usa apenas os blocos padrão (abertura, categoria, ficha do parceiro, aviso de relação comercial, contato do consultor), com textos baseados na ficha "visão da Wise" de cada parceiro, e o consultor pode editar qualquer texto antes de publicar.
4. **Given** a página publicada, **When** o cliente abre o link no computador ou no celular, **Then** vê a identidade visual da Wise e as fichas, sem comissões, nível, pacote, status interno ou anotações, e sem recomendação de nome único.
5. **Given** a ficha de um parceiro na página, **When** o cliente clica em "falar com este parceiro", **Then** abre o WhatsApp do contato comercial do parceiro com a mensagem: "Olá, sou cliente da Wise Makers e preciso resolver {problema resumido}. Eles indicaram o contato de vocês para eu conhecer melhor a solução.", o clique é registrado, e o consultor e o parceiro são avisados.
6. **Given** a página publicada, **When** salva, **Then** o sistema cria uma indicação da empresa do consultor para cada parceiro apresentado, com origem "pedido de RFP", e registra cada abertura do link.
7. **Given** um link com 30 dias, **When** vence ou é revogado, **Then** deixa de mostrar o conteúdo e exibe uma mensagem neutra com o contato do consultor; o consultor pode renovar por mais 30 dias.
8. **Given** um pedido sem fornecedor em alguma categoria, **When** registrado, **Then** a necessidade entra no relatório de categorias a prospectar.

---

### User Story 10 - Importação inicial, documentos e contexto para IA (Priority: P3)

Antes do uso, o administrador importa os parceiros atuais (planilha), os documentos já produzidos (dossiês, apresentações, resumos, contratos) e as informações dos dossiês. A qualquer momento, um botão na ficha gera o "contexto do parceiro" em texto para colar em uma conversa de IA, e outro exporta a ficha em PDF.

**Why this priority**: O portal começa com os dados reais e se conecta ao trabalho que o time já faz com IA.

**Independent Test**: Importar `dados-iniciais/parceiros.csv` e os dossiês, conferir os parceiros criados e gerar o contexto de um parceiro com histórico.

**Acceptance Scenarios**:

1. **Given** uma planilha no formato de importação, **When** o administrador importa, **Then** o sistema mostra prévia com erros por linha e só grava após confirmação.
2. **Given** um dossiê em PDF, **When** o administrador o anexa à ficha e pede a extração, **Then** a IA propõe dados, contatos, linha do tempo e pendências para revisão antes de gravar.
3. **Given** uma ficha com histórico, **When** o usuário pede o "contexto do parceiro", **Then** recebe texto com dados, classificação, etapa, linha do tempo resumida, pendências, documentos e próximos passos, pronto para copiar.
4. **Given** uma ficha, **When** exportada em PDF, **Then** segue a identidade visual da Wise.

### Edge Cases

* Parceiro em várias categorias: uma ficha, uma categoria principal, campos específicos de todas as categorias marcadas.
* Mesmo cliente indicado por dois parceiros: vale o primeiro registro; exceção justificada para contato sem interação há 6 meses ou mais.
* Pessoa que é contato de duas empresas parceiras: um contato vinculado às duas fichas.
* Carteira do parceiro muda: nível ajustado manualmente, com motivo e histórico; nunca por inatividade.
* Parceiro pausado de comum acordo: sem alertas de inatividade até a data de retomada.
* Contrato encerrado: o parceiro sai das recomendações na hora; páginas de RFP antigas mostram o parceiro como indisponível, sem botão de WhatsApp.
* Link de RFP encaminhado pelo cliente a terceiros: a página abre (acesso sem senha, por decisão de negócio), por isso não mostra dados pessoais do cliente além do nome da empresa e da necessidade resumida.
* Parceiro sem WhatsApp comercial cadastrado: o botão mostra o e-mail comercial no lugar e a publicação avisa o consultor.
* Proposta de alteração de ficha enviada pelo parceiro enquanto outra está pendente: a nova substitui a anterior, com histórico.
* Indicação com dados pessoais sem consentimento declarado: não pode ser salva.
* Regra alterada (comissão, prazos, contrapartidas): vale para registros novos; os antigos mantêm o valor da época.
* Instituição pública: sem comissão em nenhuma direção e sem uso de marca sem autorização formal registrada.
* Indicação para a Tríade ou a Swallow de um cliente que já é cliente dessas empresas: o usuário marca "cliente existente" e não há comissão, salvo exceção de administrador.

## Requirements *(mandatory)*

### Functional Requirements

**Usuários, papéis e acesso**

* **FR-001**: O sistema DEVE oferecer os papéis administrador, time de parcerias, consultor ou gerente de conta, comercial, financeiro e usuário de parceiro, com usuários internos vinculados a uma empresa do grupo (Wise Makers, Tríade ou Swallow).
* **FR-002**: O sistema DEVE autenticar todos os usuários com conta por e-mail e senha. A conta é criada por quem dá o acesso, com uma senha provisória que o portal pede para trocar; a pessoa pode criar uma senha nova pelo link "Esqueci minha senha" ou receber uma senha provisória nova de quem gerencia o acesso. (Alterado em 28/10/2026; antes: link de acesso por e-mail, sem senha.)
* **FR-003**: O sistema DEVE garantir que usuários de parceiro acessem apenas dados da própria empresa, inclusive arquivos e exportações.
* **FR-004**: O sistema DEVE mostrar valores de comissão apenas a administradores, ao time de parcerias e, na tela de comissões a pagar, ao financeiro; o parceiro vê apenas as próprias comissões, nunca a do responsável pela parceria.
* **FR-005**: O sistema DEVE ocultar de parceiros e clientes a marcação de parceiro estratégico, anotações internas e dados de outros parceiros e clientes.
* **FR-006**: O sistema DEVE permitir que só o usuário configurado como Diretor aprove assinaturas.
* **FR-007**: O sistema DEVE registrar em histórico cada concessão e revogação de acesso.

**Cadastro e ficha do parceiro**

* **FR-010**: O sistema DEVE manter para cada parceiro: razão social, nome fantasia, CNPJ, site, cidade e estado, redes sociais, tipo de parceria (comercial ou institucional), natureza jurídica, perfil institucional (Ecossistema, Convocador, Viveiro, Vitrine), categorias (uma principal e outras secundárias), categoria de empresa, origem do contato, responsável interno (um por parceiro) e quem tem a relação de origem.
* **FR-011**: O sistema DEVE manter o perfil comum a todos os parceiros e os campos específicos de cada categoria definidos em `categorias-campos.md`, com tipos de campo (texto, número, faixa, lista, múltipla escolha, sim ou não), editáveis pelo administrador sem programação.
* **FR-012**: O sistema DEVE manter contatos com nome, cargo, e-mail, telefone, WhatsApp, papel na negociação (decisor, interlocutor, responsável pela parceria, contato comercial para clientes, ponte) e observações, permitindo vincular um contato a mais de uma empresa.
* **FR-013**: O sistema DEVE manter a ficha de apresentação para RFP: o que a empresa faz, diferenciais, tipo e porte de cliente atendido, regiões, cases, materiais e o texto "visão da Wise", com versão publicada e versão proposta pendente de validação.
* **FR-014**: O sistema DEVE oferecer visão por categoria (principal), quadro por etapa, lista com filtros (incluindo campos específicos da categoria) e busca por nome, CNPJ ou contato.
* **FR-015**: O sistema DEVE indicar em cada categoria o total de parceiros assinados e sinalizar as que têm menos de 3.
* **FR-016**: O sistema DEVE armazenar documentos por parceiro (dossiê, apresentação, resumo, minuta, contrato assinado, certificado, comprovação, outros), com tipo, versão, data e autor.

**Pontos de contato e próximos passos**

* **FR-020**: O sistema DEVE registrar pontos de contato com tipo (reunião presencial, reunião online, ligação, WhatsApp, e-mail, evento, documento enviado, outro), data, participantes, texto e anexos (imagem, PDF, documento de texto).
* **FR-021**: O sistema DEVE oferecer, sob demanda, resumo por IA de textos e transcrições já feitas, com decisões, pendências, próximo passo sugerido e sugestões de atualização da ficha, gravando somente após confirmação.
* **FR-022**: O sistema DEVE extrair por IA o texto de prints de conversas enviados como imagem, para revisão.
* **FR-023**: O sistema DEVE manter para cada parceiro um próximo passo ativo com descrição, data e responsável, e marcá-lo como vencido quando a data passar sem novo registro.
* **FR-024**: O sistema DEVE atualizar a data do último contato a cada contato ou indicação confirmados.
* **FR-025**: O sistema DEVE oferecer registro rápido de contato a partir de qualquer tela, otimizado para celular.

**Funil, aprovação e contrato**

* **FR-030**: O sistema DEVE controlar as etapas sem contato, contato feito, retornou, reunião agendada, reunião realizada, proposta com o decisor, fechamento, onboarding, e as perdas não elegível, sem interesse, parceria encerrada.
* **FR-031**: O sistema DEVE impedir a passagem para "fechamento" sem aprovação do Diretor registrada no portal.
* **FR-032**: O sistema DEVE manter o Quadro de Identificação conforme os modelos de contrato em `referencias/contratos/` (comercial e institucional), com validação de campos obrigatórios.
* **FR-033**: O sistema DEVE gerar a minuta do contrato em PDF e em Word a partir do Quadro e do modelo vigente, guardando cada geração como versão na ficha.
* **FR-034**: O sistema DEVE permitir anexar o contrato assinado no Autentique, sem integração, e registrar a data de assinatura.
* **FR-035**: O sistema DEVE gerar, ao entrar em onboarding, as tarefas do pacote com prazo de 2 dias úteis e enviar o convite de acesso ao responsável do parceiro.
* **FR-036**: O sistema DEVE alertar negociações paradas (4 dias úteis em "contato feito" e 7 dias em "proposta com o decisor", configuráveis).

**Classificação, pacote, contrapartidas e status**

* **FR-040**: O sistema DEVE registrar a carteira estimada no ICP da Wise e sugerir o nível conforme as faixas configuradas, permitindo ajuste manual com motivo.
* **FR-041**: O sistema DEVE manter o ICP da Wise como critérios configuráveis (Apêndice A) e usá-los para marcar a aderência de cada indicação.
* **FR-042**: O sistema DEVE restringir os pacotes ao nível do parceiro.
* **FR-043**: O sistema DEVE criar as contrapartidas do pacote a partir do catálogo do Apêndice D, com periodicidade, forma de comprovação, próxima data e estados pendente, enviada, validada, recusada e atrasada.
* **FR-044**: O sistema DEVE permitir que parceiro e Wise enviem comprovações e que só a Wise valide ou recuse, com motivo.
* **FR-045**: O sistema DEVE apenas alertar contrapartidas atrasadas, sem suspender entregas.
* **FR-046**: O sistema DEVE calcular o status de atividade (ativo, morno, dormente) pelos prazos do Apêndice A e permitir o status pausado com data de retomada.
* **FR-047**: O sistema DEVE exigir o motivo da inatividade quando o status não for ativo.
* **FR-048**: O sistema DEVE sugerir a marcação de parceiro estratégico pelos critérios configurados, com decisão de administrador.
* **FR-049**: O sistema NUNCA DEVE alterar o nível automaticamente por inatividade.

**Indicações e comissões**

* **FR-050**: O sistema DEVE registrar indicações nos dois sentidos entre o parceiro e cada empresa do grupo (Wise Makers, Tríade, Swallow), com cliente, contato, origem, data, responsável, aderência ao ICP, cliente existente ou novo, etapa, valores e observações.
* **FR-051**: O sistema DEVE exigir a declaração de consentimento para compartilhar dados pessoais do cliente indicado.
* **FR-052**: O sistema DEVE aplicar a regra do primeiro registro a clientes duplicados, com exceção justificada por administrador.
* **FR-053**: O sistema DEVE calcular, para indicações do parceiro ao grupo, a comissão do parceiro e a do responsável pela parceria conforme a regra configurada por empresa (Apêndice A), com os estados aguardando fechamento, aguardando compensação, a pagar, nota fiscal recebida e paga.
* **FR-054**: O sistema DEVE enviar e-mail ao financeiro cada vez que uma comissão passar para "a pagar".
* **FR-055**: O sistema DEVE registrar a comissão a receber pelo grupo conforme o instrumento do parceiro, com os mesmos estados.
* **FR-056**: O sistema DEVE permitir que o parceiro atualize o resultado das indicações recebidas, deixando a atualização pendente de confirmação da Wise, e alertar o responsável Wise sobre indicações sem atualização há 30 dias.
* **FR-057**: O sistema DEVE mostrar indicadores de qualidade por parceiro (História 6, cenário 6).

**Atividades e Base Ativa**

* **FR-060**: O sistema DEVE manter um catálogo configurável de tipos de atividade com duração estimada (Apêndice C) e mostrar atividades e tempo estimado por parceiro, por pessoa e por período, sem limite de horas.
* **FR-061**: O sistema DEVE controlar a fila do Base Ativa (estratégicos primeiro, depois ordem de assinatura), o ciclo (6 encontros e evento final), os estados (na fila, em ciclo, concluído, suspenso) e a suspensão após 2 encontros seguidos não realizados, com início decidido por administrador.

**Painel, relatórios e alertas**

* **FR-065**: O sistema DEVE oferecer o painel semanal com os indicadores da História 3 e gerar a pauta em texto.
* **FR-066**: O sistema DEVE enviar todo dia útil às 7h (horário de Brasília, configurável) um e-mail por responsável com follow-ups vencidos, mudanças de status de atividade, negociações paradas, contrapartidas atrasadas, indicações paradas, propostas de alteração de ficha e aprovações pendentes; sem pendências, nenhum e-mail.
* **FR-067**: O sistema DEVE enviar ao Diretor um relatório semanal do programa, em dia e horário configuráveis.
* **FR-068**: O sistema DEVE permitir que cada usuário escolha quais alertas recebe, exceto os obrigatórios do seu papel.

**Portal do parceiro**

* **FR-070**: O sistema DEVE oferecer ao parceiro: resumo da parceria, entregas, contrapartidas com envio de comprovação, indicações feitas e recebidas com as próprias comissões, RFPs em que foi apresentado (com nome do cliente, data, necessidade resumida e cliques), materiais, calendário da mentoria mensal e dos eventos, páginas institucionais da Wise Makers, da Tríade e da Swallow e formulário de indicação para as três empresas.
* **FR-071**: O sistema DEVE mostrar aos parceiros dos pacotes B e A um botão que abre o Wise Hub em outra aba, pelo endereço configurado. O Wise Hub é uma plataforma separada; o portal não gerencia usuários nem dados do Hub.
* **FR-072**: O sistema DEVE permitir que o responsável do parceiro convide e desative usuários da própria empresa.
* **FR-073**: O sistema DEVE permitir que o parceiro proponha alterações da ficha de apresentação e dos campos da categoria, publicadas só após validação da Wise.

**RFP para clientes**

* **FR-080**: O sistema DEVE permitir que consultores e gerentes de conta registrem pedidos de RFP com cliente, necessidade em texto livre, porte, região, prazo e restrições.
* **FR-081**: O sistema DEVE identificar por IA as categorias envolvidas e recomendar, em cada uma, parceiros assinados com justificativa, permitindo ajuste da seleção.
* **FR-082**: O sistema DEVE exigir no mínimo 3 opções por categoria quando houver 3 ou mais assinados e registrar a exceção quando houver menos.
* **FR-083**: O sistema DEVE montar por IA uma página em blocos padronizados (abertura, bloco por categoria, ficha de parceiro, aviso de relação comercial, contato do consultor), editável pelo consultor antes de publicar.
* **FR-084**: O sistema DEVE publicar a página em um endereço exclusivo e difícil de adivinhar, acessível sem senha, válido por 30 dias, renovável e revogável.
* **FR-085**: A página DEVE seguir a identidade visual da Wise e nunca mostrar comissões, nível, pacote, status, anotações ou dados de outros clientes.
* **FR-086**: Cada ficha da página DEVE ter um botão que abre o WhatsApp do contato comercial do parceiro com a mensagem pronta descrita na História 9, registrar o clique e avisar consultor e parceiro.
* **FR-087**: O sistema DEVE criar uma indicação da empresa do consultor para cada parceiro apresentado, com origem "pedido de RFP", e registrar as aberturas da página.
* **FR-088**: O sistema DEVE registrar pedidos sem fornecedor no relatório de categorias a prospectar.

**Configuração, importação e exportação**

* **FR-090**: O sistema DEVE permitir que administradores editem todas as regras listadas no princípio III da constituição.
* **FR-091**: O sistema DEVE aplicar mudanças de regra só a registros novos.
* **FR-092**: O sistema DEVE importar parceiros, contatos e categorias por planilha, com prévia e validação por linha.
* **FR-093**: O sistema DEVE extrair por IA dados de dossiês em PDF para revisão antes de gravar.
* **FR-094**: O sistema DEVE gerar o "contexto do parceiro" em texto e exportar a ficha em PDF com a identidade da Wise.
* **FR-095**: O sistema DEVE exportar todos os dados em formato aberto para backup, semanalmente e sob demanda.
* **FR-096**: O sistema DEVE registrar o histórico de alterações descrito na constituição (princípio VI).

### Key Entities *(include if feature involves data)*

* **Empresa do grupo**: Wise Makers, Tríade, Swallow, com regra de comissão própria.
* **Parceiro**: empresa ou instituição do programa, com tipo, categorias, perfil comum, campos da categoria, nível, pacote, etapa, status, responsável, ficha de apresentação (publicada e proposta) e marcação estratégica interna.
* **Categoria e campo da categoria**: setor de prateleira ou perfil institucional, com a lista de campos específicos e seus tipos.
* **Contato**: pessoa ligada a um ou mais parceiros, com papel.
* **Ponto de contato**: interação com tipo, data, participantes, texto, anexos, resumo e tempo estimado.
* **Próximo passo**: ação com data e responsável.
* **Documento**: arquivo do parceiro com tipo, versão e autor.
* **Negociação e aprovação**: etapa, histórico, aprovação do Diretor, motivo de perda.
* **Quadro de Identificação e contrato gerado**: dados contratuais e versões da minuta em PDF e Word.
* **Contrapartida**: item do catálogo por pacote e nível, com periodicidade, comprovações e estado.
* **Indicação**: cliente, sentido, empresa do grupo, origem, aderência ao ICP, etapa, valores e comissões com estados.
* **Cliente**: empresa indicada ou atendida em RFP, com contato e consentimento.
* **Pedido de RFP e página de RFP**: necessidade, categorias, parceiros recomendados e selecionados, blocos da página, link, validade, aberturas e cliques.
* **Atividade e tipo de atividade**: esforço registrado com duração estimada.
* **Ciclo do Base Ativa**: posição na fila, encontros, evento, estado.
* **Usuário e papel**: pessoa com acesso, vinculada a uma empresa do grupo ou a um parceiro.
* **Configuração do programa**: regras administráveis.
* **Registro de histórico**: alteração com autor, data, valor anterior e novo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

* **SC-001**: 100% dos parceiros em conversa cadastrados no portal até 2 semanas após a entrada em uso; o RD Station deixa de ser usado para parceiros.
* **SC-002**: Registrar um ponto de contato com próximo passo leva menos de 1 minuto no celular em 9 de cada 10 registros.
* **SC-003**: Nenhum follow-up fica vencido por mais de 1 dia útil sem aparecer no e-mail do responsável.
* **SC-004**: A reunião semanal é pautada só pelo painel em 4 de 4 semanas seguidas.
* **SC-005**: Um consultor publica uma página de RFP com 3 opções por categoria em menos de 10 minutos a partir do pedido do cliente.
* **SC-006**: Em teste de acesso, nenhum parceiro, cliente, consultor, gerente de conta ou comercial vê dado que não deveria ver, incluindo comissões.
* **SC-007**: O portal suporta 100 parceiros, 2.000 pontos de contato por ano e 300 usuários de parceiros sem perda perceptível de velocidade.
* **SC-008**: 90% dos parceiros assinados têm ficha de apresentação e campos da categoria preenchidos antes de aparecer em uma página de RFP.
* **SC-009**: Toda comissão a pagar gera e-mail ao financeiro no mesmo dia em que muda de estado.
* **SC-010**: Uma minuta de contrato completa é gerada em menos de 2 minutos a partir do Quadro preenchido.

## Assumptions

* Todas as histórias entram na primeira versão.
* Até 15 usuários internos no início; usuários de parceiros crescem com as assinaturas.
* Transcrições de reuniões chegam prontas (Gemini, gravador do celular) e são coladas ou anexadas; o portal não transcreve áudio.
* E-mails, WhatsApp e Instagram entram por registro manual (texto colado ou print).
* Não há domínio próprio ainda; o endereço público é configurável.
* O endereço do Wise Hub é um parâmetro de configuração.
* O e-mail do financeiro é um parâmetro de configuração.
* Os modelos de contrato em `referencias/contratos/` são a versão vigente, já com o ICP da Wise, e podem ser substituídos pelo administrador.
* A comissão do responsável pela parceria é interna e nunca aparece para o parceiro.
* Os dados iniciais vêm de `dados-iniciais/parceiros.csv`, dos dossiês em `referencias/dossies/` e da tabela de carteira do playbook.

## Apêndice A. Regras do programa (valores iniciais da configuração)

**ICP da Wise Makers**: dois ou mais vendedores; faturamento a partir de R$ 250 mil por mês; necessidade de estruturação comercial; vende produto, não só serviço; não é varejo de ticket baixo e giro alto (loja de roupa, de calçados). Varejo com ticket e pedidos mais altos entra.

**Níveis da Parceria Comercial** (clientes da carteira no ICP da Wise)

| Código | Nome | Faixa | Morno após | Dormente após |
|---|---|---|---|---|
| A | Elite | 50 ou mais | 30 dias | 60 dias |
| B | Premium | 15 a 49 | 60 dias | 120 dias |
| C | Select | menos de 15, ou empresa em início | 90 dias | 180 dias |

Institucionais: A e B usam os prazos do Premium; C usa os do Select.

**Pacotes**

| Pacote | Disponível para | Entregas da Wise |
|---|---|---|
| C · Prateleira | Select, Premium, Elite | Prateleira recíproca, comissão, grupo de WhatsApp, acompanhamento trimestral |
| B · Formação | Premium, Elite | C mais certificado e selo, acesso ao Wise Hub com as duas marcas, mentoria mensal aberta à carteira, convite a eventos, acompanhamento mensal |
| A · Base Ativa | Elite | B mais Base Ativa conforme fila, palco mediante acordo, acompanhamento quinzenal no ciclo |

**Regras de comissão por empresa do grupo** (indicação do parceiro para o grupo)

| Empresa | Base de cálculo | Parceiro | Responsável pela parceria |
|---|---|---|---|
| Wise Makers | Primeira mensalidade da consultoria | 40% | 10% |
| Tríade | Primeira parcela | 40% | 10% |
| Swallow | Valor do projeto | 6% | 2% |

Pagamento após a compensação do primeiro pagamento do cliente, sem repasse mínimo, para CNPJ com nota fiscal, sem devolução, sem incidência em renovações. O que o parceiro paga ao grupo segue o instrumento dele.

**Parceiro estratégico**: carteira no ICP acima de 100, ou 3 indicações que viraram reunião em 90 dias.

**RFP**: no mínimo 3 opções por categoria sempre que houver; nunca nome único; aviso de relação comercial; só parceiros assinados; link de 30 dias renovável.

## Apêndice B. Categorias e campos

As 22 categorias comerciais, os 4 perfis institucionais com as 24 categorias institucionais, o perfil comum e os campos específicos de cada categoria estão em `categorias-campos.md`. Marketing e performance digital não são categoria de prateleira, porque são escopo da Tríade.

## Apêndice C. Tipos de atividade (duração estimada, só informativa)

| Tipo | Duração estimada |
|---|---|
| Mensagem ou follow-up | 5 min |
| Ligação | 15 min |
| Reunião de apresentação (45 min mais preparação) | 1 h 15 min |
| Check-in mensal | 45 min |
| Check-in trimestral | 30 min |
| Encontro do Base Ativa (com preparação) | 1 h 30 min |
| Evento ou palestra | 3 h |
| Documento enviado (minuta, resumo, proposta) | 30 min |
| Preparação de dossiê ou apresentação personalizada | 1 h |
| Revisão semanal com o Diretor | 30 min |

## Apêndice D. Catálogo inicial de contrapartidas

Contrapartida não cumprida gera alerta, nunca suspensão. Comprovação por link, print ou arquivo, validada pela Wise.

| Contrapartida | Pacote C | Pacote B | Pacote A | Comprovação |
|---|---|---|---|---|
| Contrato assinado e responsável nomeado | Na assinatura | Na assinatura | Na assinatura | Contrato e cadastro do responsável |
| Manter a Wise entre as opções de consultoria comercial apresentadas aos clientes | Contínuo | Contínuo | Contínuo | Declaração na revisão trimestral |
| Anúncio da parceria (post no feed e stories, arte fornecida pela Wise) | Uma vez, até 15 dias após a assinatura | Igual | Igual | Link ou print |
| Wise na página de parceiros ou no rodapé do site | Até 30 dias após a assinatura e contínuo | Igual | Igual | Link |
| Participação nas reuniões de acompanhamento | Trimestral | Mensal | Quinzenal no ciclo, mensal fora dele | Registro da reunião |
| Divulgação da mentoria mensal e do Wise Hub à carteira | | Mensal | Mensal | Print do envio |
| Stories sobre a mentoria ou o Hub | | Mensal | Mensal | Print |
| Conteúdo conjunto (post, live ou artigo) | | Trimestral | Bimestral | Link |
| Usuários ativos no Wise Hub (meta informada pela Wise) | | Premium: 10 em 90 dias. Elite: 25 em 90 dias | Elite: 25 em 90 dias | Relatório do Hub anexado pela Wise |
| Responsável com 2 a 4 horas semanais durante o ciclo | | | Durante o ciclo | Presença nos encontros |
| Evento com a base no fim do ciclo, com a Wise integrada (fala, marca e inscrição com opção de contato com a Wise) | | | Uma vez por ciclo | Registro do evento |
| Wise integrada nos eventos da comunidade formada no Base Ativa | | | Contínuo após o ciclo | Registro do evento |
| Case ou depoimento ao fim do ciclo | | | Uma vez por ciclo | Link ou arquivo |

Para instituições, o catálogo inicial é: divulgação das ações com 15 dias de antecedência, público mínimo combinado por ação, inscrição com opção de contato com a Wise e avaliação ao fim de cada ação; para instituições privadas, também anúncio da parceria e marca da Wise no material.
