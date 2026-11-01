# Hierarquia to-be v2 (executado dentro de tobe2_base.py)
P = {}
def proc(k, nome, pai, ordem, descricao, dono, gatilho, entrega, cliente, evs, status="declarado", tipo=None, part=(), sist=(), freq="",
         regras=(), quadro=None, hipoteses=()):
    obj = {"nome": nome, "pai": P.get(pai), "ordem": ordem, "descricao": descricao, "dono": dono, "participantes": list(part),
           "gatilho": gatilho, "entradas": [], "saidas": [{"nome": entrega[0], "para": entrega[1]}] if entrega else [], "cliente": cliente,
           "sistemas": list(sist) or [SI_POR], "indicadores": [], "frequencia": freq, "dores": [], "regras": list(regras), "status": status,
           "hipoteses": list(hipoteses), "evidencias": evs, "situacao": "no_papel", "fluxo_dispensado": None}
    if tipo: obj["tipo"] = tipo
    if quadro: obj["quadro"] = quadro
    P[k] = add("processos", "P", **obj)
    return P[k]

J, OPS, FILA, AGENDA = "Quadro da jornada do parceiro", "Quadro de oportunidades do ecossistema", "Fila única de tarefas (por exceção)", "Agenda de rituais"

# ======================= 1. ARQUITETAR O ECOSSISTEMA (gestão)
proc("M1", "Arquitetar o ecossistema", None, 1, "Decidir o papel da Wise, o valor entregue à indústria, quem é o parceiro ideal e as regras do jogo. É o primeiro movimento do Método Octo.", GP,
     "Planejamento anual ou mudança de fase", ("Desenho do programa publicado", "EXT:Parceiros e time"), "Diretor e parceiros",
     [F(PP, 0, 0), F(PP, 0, 2), F(EP, 5, 1)], status="hipotese", tipo="gestao", part=[DIR], freq="Anual e a cada mudança de fase", quadro=AGENDA)
proc("1.1", "Mapear a rede de valor e o papel da Wise", "M1", 1, "Desenhar quem são clientes, fornecedores, concorrentes e complementadores do grupo, e em que categorias a Wise lidera ou segue.", GP,
     "Planejamento anual", ("Rede de valor e papel por categoria", "P-1.3"), "Diretor", [F(EJ, 0, 0), F(EJ, 7, 3), F(EP, 5, 4)], status="hipotese", part=[DIR], freq="Anual")
proc("1.1.1", "Desenhar a rede de valor do grupo", "1.1", 1, "Indústrias no topo, parceiros como fornecedores de acesso, outras consultorias e programas de canais dos ERPs como concorrentes, softwares e entidades como complementadores; cada parceiro com papéis múltiplos por escopo.", GP,
     "Planejamento anual", ("Rede de valor do grupo", "P-1.1.2"), "Diretor", [F(EJ, 0, 0), F(EJ, 0, 1), F(EJ, 0, 3)], status="hipotese")
proc("1.1.2", "Definir o papel da Wise por categoria", "1.1", 2, "Líder onde a demanda das indústrias do grupo dá legitimidade; seguidora inteligente onde o parceiro já tem programa de canais próprio.", GP,
     "Rede de valor desenhada", ("Papel por categoria", "P-1.3"), "Diretor", [F(EJ, 7, 1), F(EP, 5, 3)], status="hipotese")
proc("1.1.3", "Testar a legitimidade antes de abrir categoria", "1.1", 3, "Antes de abrir uma categoria nova, perguntar se ela aceita a liderança da Wise e se os parceiros atuais continuam aceitando o próprio papel.", GP,
     "Proposta de categoria nova", ("Categoria aberta ou adiada", "P-1.3"), "Diretor", [F(EJ, 7, 3), F(EJ, 7, 4)], status="hipotese")
proc("1.2", "Desenhar a arquitetura de valor para a indústria", "M1", 2, "Escrever a proposta de valor à indústria em cinco elementos (Descobrir, Comparar e decidir, Implantar integrado, Pertencer e aprender, Confiar) e mapear que pilar e que parceiro preenche cada um.", GP,
     "Planejamento anual", ("Matriz parceiro por elemento de valor", "P-2.3"), "Diretor", [F(EJ, 5, 0), F(EJ, 5, 1), F(EJ, 5, 5)], status="hipotese", freq="Anual")
proc("1.3", "Definir o perfil de parceiro ideal", "M1", 3, "Escrever o perfil comercial e o institucional a partir do ICP da Wise, com critérios essenciais e desejáveis.", GP,
     "Planejamento anual", ("Perfil e scorecard publicados", "P-3.2"), "Time de parcerias",
     [S("s2", "Antes da proposta, o time de parcerias preenche o scorecard do parceiro: sete critérios (Apêndice A), cada um com nota 0, 0,5 ou 1 por uma régua descrita na tela.", "User Story 3"), F(PP, 2, 1), F(PP, 2, 2)], freq="Anual")
proc("1.4", "Desenhar a oferta e as regras do programa", "M1", 4, "Níveis, pacotes, contrapartidas, comissão com critério objetivo, regulamento, política de dados e termo-quadro.", GP,
     "Planejamento anual ou mudança de regra", ("Regras publicadas", "P-2.7"), "Parceiros",
     [S("s2", "O portal do parceiro ganha a página \"Regras do programa\", gerada a partir da configuração", "User Story 13"), D("Q-0020")], part=[DIR])
proc("1.4.1", "Definir níveis, pacotes e contrapartidas", "1.4", 1, "Três níveis com os mesmos critérios do recrutamento; pacotes com contrapartidas dos dois lados.", GP,
     "Revisão anual das regras", ("Tabela de níveis e pacotes", "P-1.4.3"), "Parceiros",
     [S("s2", "Cada nível tem requisitos em três grupos (Apêndice B): resultado (indicações qualificadas ou clientes fechados no ICP em 180 dias), capacitação (pessoas certificadas) e regras", "User Story 4"), F(PP, 3, 3)])
proc("1.4.2", "Publicar o critério objetivo da comissão", "1.4", 2, "Mostrar ao parceiro a base da regra: a comissão comparada ao LTV do cliente e às referências de mercado, a mesma regra para todos, sem exceção por parceiro.", GP,
     "Revisão anual das regras", ("Critério da comissão no regulamento", "P-1.4.3"), "Parceiros", [F(AN, 6, 0), F(AN, 6, 1), F(EJ, 3, 1), D("Q-0006", validacao=False)], status="hipotese")
proc("1.4.3", "Escrever o regulamento e a política de dados", "1.4", 3, "Regulamento em três partes (quem participa, como se divide o valor, como se resolvem conflitos, com sanções graduadas) e política de dados (só dados de empresa, consentimento, nenhum uso da carteira para outros fins).", GP,
     "Mudança de regra", ("Regulamento e política publicados", "P-2.7"), "Parceiros", [D("Q-0020"), F(EP, 3, 1), F(EP, 3, 2)], status="confirmado", part=[DIR])
proc("1.4.4", "Manter o termo-quadro modular", "1.4", 4, "Um termo-quadro único com campos em branco (nível, pacote, contrapartidas, metas, SLA, proteção, saída) que vira o texto vivo de cada parceria.", GP,
     "Mudança de regra ou de modelo de contrato", ("Termo-quadro atualizado", "P-3.5"), "Time de parcerias", [F(AN, 7, 0), F(AN, 7, 1), F(EP, 7, 5)], status="hipotese")
proc("1.5", "Definir a fase e as metas do programa", "M1", 5, "Registrar a fase, os portões da próxima e as metas do programa e de cada pessoa. O Diretor define as metas.", DIR,
     "Início de cada trimestre", ("Fase, portões e metas registrados", "P-2.4"), "Time de parcerias",
     [D("Q-0021"), D("Q-0003"), S("s2", "A fase do programa fica registrada e o portal mostra quando os critérios da próxima fase foram atingidos.", "User Story 7")], status="confirmado", part=[GP], freq="Trimestral")
proc("1.5.1", "Diagnosticar a maturidade do programa nos oito eixos", "1.5", 1, "Autodiagnóstico do programa nos oito eixos do Método Octo, para equilibrar o esforço antes de refinar.", GP,
     "Uma vez por ano", ("Octógono de maturidade e plano", "P-1.5.2"), "Diretor", [F(PP, 0, 0), F(PP, 0, 1), F(PP, 0, 3)], status="hipotese", freq="Anual")
proc("1.5.2", "Definir os portões da próxima fase", "1.5", 2, "Fixar os limiares de ativação, liquidez das oportunidades, qualidade da combinação e confiança que permitem passar de fase.", DIR,
     "Diagnóstico de maturidade feito", ("Portões da fase", "P-2.4"), "Time de parcerias", [F(EJ, 6, 0), F(EP, 7, 3), F(EP, 4, 0)], status="hipotese", part=[GP])

# ======================= 2. GERIR O PROGRAMA POR RITUAIS (gestão)
proc("M2", "Gerir o programa por rituais", None, 2, "Trocar a leitura de muitos quadros por uma agenda de rituais e uma fila de exceções: diário, semanal, mensal, trimestral e anual.", GP,
     "Calendário do programa", ("Decisões e tarefas do período", "EXT:Diretor"), "Diretor", [F(CV, 5, 1), F(AN, 0, 3), F(EP, 7, 2)], status="hipotese", tipo="gestao", part=[DIR], quadro=AGENDA)
proc("2.1", "Tratar a fila diária de exceções", "M2", 1, "Abrir a fila única, ordenada por prazo, com o que fugiu da regra: SLA vencendo, marco atrasado, régua atrasada, parceiro em risco, pedido parado. O Gerente é dono de tudo e cobra quem executa pelo WhatsApp.", GP,
     "Início de cada dia de trabalho no programa", ("Exceções tratadas", "P-2.2"), "Gerente de Parcerias", [F(CV, 2, 4), F(EP, 0, 2), D("Q-0013")], status="hipotese", freq="Diária", quadro=FILA)
proc("2.2", "Conduzir a revisão semanal do programa", "M2", 2, "Revisar com o Diretor o painel e as pendências, e levar à reunião comercial do grupo três perguntas: que oportunidades novas têm parceiro, que negócios parados podem usar um parceiro, que pedidos a parceiros estão sem retorno.", GP,
     "Toda terça-feira", ("Pendências priorizadas e pedidos aos parceiros", "P-2.1"), "Diretor",
     [S("s1", "Na reunião semanal, o Gerente de Parcerias e o Diretor pautam a conversa pelo painel", "User Story 3"), F(CV, 5, 1)], part=[DIR, CONS], freq="Semanal", quadro=AGENDA)
proc("2.3", "Conduzir a mesa mensal do portfólio", "M2", 3, "Olhar o portfólio inteiro numa só tela (nível, segmento de atenção, saúde, tipo de parceria, próxima jogada) e decidir onde pôr as horas do mês.", GP,
     "Primeira terça do mês", ("Plano de atenção do mês", "P-2.1"), "Diretor", [F(AN, 3, 0), F(PP, 7, 2), F(AN, 3, 2)], status="hipotese", part=[DIR], freq="Mensal", quadro=AGENDA)
proc("2.4", "Conduzir o fechamento trimestral", "M2", 4, "Revisar níveis, saúde das parcerias, satisfação e ranking, e preparar as revisões conjuntas e as decisões do Diretor.", GP,
     "Primeiro dia útil de janeiro, abril, julho e outubro", ("Decisões do trimestre", "P-2.8"), "Diretor e parceiros",
     [S("s2", "Revisão: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre.", "Apêndice B")], part=[DIR], freq="Trimestral", quadro=AGENDA)
proc("2.4.1", "Revisar o nível dos parceiros", "2.4", 1, "Apurar requisitos, colocar em observação ou propor descida; subida acontece na hora, fora do ritual.", GP,
     "Primeiro dia útil do trimestre", ("Nível revisto", "EXT:Parceiro"), "Parceiro", [A("EV-0109"), S("s2", "Na revisão seguinte, se ainda não cumprir, o portal propõe descer um nível; a decisão é de uma pessoa, com motivo.", "Apêndice B")],
     status="confirmado", freq="Trimestral")
proc("2.4.2", "Avaliar a saúde das parcerias", "2.4", 2, "Nota de três fatores por parceiro (qualidade da parceria, inovação colaborativa, criação de valor), calculada pelo portal sempre que possível, e as três perguntas: nos recomendaria, melhorou a satisfação dos clientes, houve ganho real.", GP,
     "Fechamento trimestral", ("Saúde e tipo de cada parceria", "P-6.7"), "Diretor", [F(AN, 1, 5), F(AN, 1, 0), F(AN, 2, 2)], status="hipotese", freq="Trimestral")
proc("2.4.3", "Ouvir a satisfação dos parceiros", "2.4", 3, "Pesquisa trimestral de 0 a 10 com comentário para cada pessoa dos parceiros.", GP, "Fechamento trimestral", ("Notas tratadas", "P-2.4.2"), "Parceiros",
     [S("s2", "Uma pesquisa trimestral de satisfação dos parceiros (nota de 0 a 10 e comentário) é enviada a cada pessoa do parceiro pelo portal e por e-mail.", "User Story 7")], freq="Trimestral")
proc("2.4.4", "Apurar o ranking e o reconhecimento", "2.4", 4, "Calcular o ranking do trimestre e do ano e liberar os reconhecimentos de nível.", GP, "Fechamento trimestral", ("Ranking publicado", "P-6.5"), "Parceiros",
     [S("s2", "A premiação anual é registrada no portal e gera selo para o vencedor.", "User Story 13")], freq="Trimestral")
proc("2.5", "Apurar o resultado econômico do canal", "M2", 5, "DRE do canal: clientes fechados via parceiros, receita e LTV atribuídos, comissões, horas e custos diretos, custo por cliente e retorno.", GP,
     "Fechamento de cada mês", ("Resultado do canal", "EXT:Diretor"), "Diretor",
     [S("s2", "clientes fechados no ICP via parceiros, receita atribuída ao canal, custo total do canal separado em comissões, horas da equipe e custos diretos, ROI", "User Story 1"), F(PP, 4, 2)], part=[DIR], freq="Mensal")
proc("2.6", "Apurar o custo de servir por parceiro", "M2", 6, "Todo mês, somar as horas registradas por atividade e parceiro e comparar o custo de servir com o retorno de cada parceiro.", GP,
     "Fechamento de cada mês", ("Custo de servir por parceiro", "P-2.3"), "Gerente de Parcerias",
     [D("Q-0004"), S("s2", "Cada pessoa interna tem uma remuneração mensal de referência, da qual o portal calcula o custo-hora", "User Story 2")], status="confirmado")
proc("2.7", "Publicar regras e comunicados", "M2", 7, "Publicar mudanças de regra com vigência mínima de 30 dias e comunicados, com aprovação do Diretor.", GP,
     "Mudança de regra, evento ou material novo", ("Comunicado publicado na comunidade e no portal", "EXT:Parceiros"), "Parceiros",
     [D("Q-0022"), S("s2", "Mudança de regra que afeta parceiros tem data de vigência de no mínimo 30 dias e gera um comunicado.", "User Story 13")], status="confirmado", part=[DIR])
proc("2.8", "Decidir na fila do Diretor", "M2", 8, "O Diretor recebe só perguntas de sim ou não, cada uma com a proposta completa: assinatura, desligamento, descida de nível, exceção de regra.", DIR,
     "Proposta pronta para decisão", ("Decisão registrada", "P-2.1"), "Gerente de Parcerias", [F(AN, 7, 1), F(AN, 6, 5)], status="hipotese", part=[GP], quadro=FILA)

# ======================= 3. ATRAIR E SELECIONAR PARCEIROS
proc("M3", "Atrair e selecionar parceiros", None, 3, "Do candidato na lista ao termo assinado: consciência, educação, seleção e decisão de ingresso da jornada do parceiro.", GP,
     "Candidato entra na lista", ("Termo assinado", "P-M4"), "Empresa parceira",
     [F(PP, 1, 0), S("s2", "O funil ganha a etapa \"qualificação\" (scorecard), entre \"reunião realizada\" e \"proposta com o decisor\", e o estado \"nutrição\" para quem ainda não é a hora", "User Story 9")],
     tipo="finalistico", part=[DIR], quadro=J)
proc("3.1", "Manter a lista de candidatos", "M3", 1, "Lista filtrável, não quadro: candidatos vindos de forma orgânica, de clientes do grupo, de fornecedores que já estão nas indústrias atendidas, de categorias pedidas sem fornecedor e de eventos. Só vira card depois da primeira reunião.", GP,
     "Candidato identificado", ("Candidato com reunião agendada", "P-3.2"), "Gerente de Parcerias", [D("Q-0008"), F(PP, 6, 1), F(CV, 3, 3)], status="confirmado", hipoteses=["regras"])
proc("3.2", "Qualificar candidato", "M3", 2, "Pontuar o scorecard, desenhar a ficha de jogo (rede de valor e PARTS) e estimar a sobreposição de carteiras antes de investir horas.", GP,
     "Reunião agendada ou realizada", ("Nível de entrada sugerido ou não elegível", "P-3.3"), "Diretor",
     [S("s2", "Antes da proposta, o time de parcerias preenche o scorecard do parceiro: sete critérios (Apêndice A), cada um com nota 0, 0,5 ou 1 por uma régua descrita na tela.", "User Story 3")])
proc("3.2.1", "Pontuar o scorecard", "3.2", 1, "Sete critérios com nota 0, 0,5 ou 1; nota de potencial, de qualidade e nível de entrada.", GP, "Reunião realizada", ("Nota e nível sugerido", "P-3.2.2"), "Diretor",
     [S("s2", "Nota de potencial = soma ponderada ÷ 10, em porcentagem.", "Apêndice A")])
proc("3.2.2", "Preencher a ficha de jogo do candidato", "3.2", 2, "Papéis do candidato na rede de valor, quem ganha com a entrada dele, valor que ele adiciona e regras de escopo onde ele concorre com o grupo.", GP,
     "Scorecard pontuado", ("Ficha de jogo do candidato", "P-3.4"), "Diretor", [F(EJ, 1, 1), F(EJ, 1, 3), F(EJ, 0, 4)], status="hipotese")
proc("3.2.3", "Estimar a sobreposição de carteiras", "3.2", 3, "Antes do workshop, estimar quantos clientes da carteira do candidato estão no ICP e em comum com o grupo, para dimensionar o potencial.", GP,
     "Candidato qualificado", ("Sobreposição estimada", "P-3.4"), "Diretor", [F(EP, 6, 5), F(CV, 0, 0), F(CV, 2, 0)], status="hipotese")
proc("3.3", "Apresentar o programa e mapear interesses", "M3", 3, "Reunião que começa pelo problema e pelos interesses do candidato; registro de interesses, decisores e da decisão que a Wise está pedindo.", GP,
     "Reunião agendada", ("Interesses e decisores registrados", "P-3.4"), "Candidato", [D("Q-0009"), F(AN, 5, 0), F(AN, 5, 1), F(AN, 4, 3)], status="confirmado")
proc("3.4", "Conduzir o workshop de alinhamento", "M3", 4, "Conversa mais longa com a diretoria do candidato, antes da minuta, para alinhar o que cada lado faz e montar o caso de negócio do parceiro: quantos negócios saem da carteira dele, quanto ganha, que demanda recebe de volta.", GP,
     "Candidato quer seguir", ("Plano conjunto e caso de negócio do parceiro", "P-3.5"), "Candidato", [D("Q-0009"), F(PP, 6, 4), F(PP, 6, 5), F(AN, 1, 3)], status="confirmado", hipoteses=["descricao"])
proc("3.5", "Negociar e formalizar o termo", "M3", 5, "Texto único: o termo-quadro preenchido circula como rascunho pedindo críticas, com interesses, alternativas e pacote gatilho registrados; o Diretor responde sim ou não; assinatura digital.", GP,
     "Plano conjunto acordado", ("Termo assinado", "P-M4"), "Empresa parceira",
     [D("Q-0009"), A("EV-0107"), S("s1", "Na negociação, o usuário preenche o Quadro de Identificação e o portal gera a minuta do contrato", "User Story 4"), F(AN, 7, 0)], status="confirmado", part=[DIR], sist=[SI_POR, SI_AUT, SI_WPP])
proc("3.6", "Nutrir candidato", "M3", 6, "Pausa com data de retomada e cadência de contato; gestos de valor sem pedido.", GP, "Candidato pede para retomar depois", ("Candidato retomado", "P-3.3"), "Candidato",
     [S("s2", "o estado \"nutrição\" para quem ainda não é a hora, com data de retomada e cadência de contato", "User Story 9"), A("EV-0108")])

# ======================= 4. INTEGRAR E ATIVAR PARCEIRO
proc("M4", "Integrar e ativar parceiro", None, 4, "Do termo assinado à ativação (primeira indicação no ICP que virou reunião), em até 90 dias, com extensão até 120.", GP,
     "Termo assinado", ("Parceiro ativado", "P-M6"), "Empresa parceira",
     [A("EV-0110"), S("s2", "O onboarding termina na ativação: a primeira indicação do parceiro com ICP confirmado pela Wise que virou reunião.", "User Story 5"), F(PP, 1, 1)],
     status="confirmado", tipo="finalistico", part=[RESP_P], quadro=J)
proc("4.1", "Preparar a entrada do parceiro", "M4", 1, "Em até 2 dias úteis: grupo na comunidade, cadastro, ficha na Prateleira com a apresentação de vendas do parceiro, link exclusivo e acessos.", GP,
     "Termo assinado", ("Parceiro com acesso e ficha publicada", "P-4.2"), "Empresa parceira",
     [S("s2", "| Até 2 dias úteis | Tarefas do pacote (v1) | Prateleira, grupo, dados, Hub, certificado e selo conforme o pacote |", "Apêndice F")], sist=[SI_POR, SI_WPP, SI_HUB])
proc("4.1.1", "Incluir o parceiro na comunidade Wise Partners", "4.1", 1, "Criar o grupo do parceiro dentro da comunidade no WhatsApp, se ainda não existe desde a negociação.", GP, "Termo assinado", ("Grupo na comunidade", "P-6.4"), "Empresa parceira",
     [D("Q-0012"), A("EV-0106")], status="confirmado", sist=[SI_WPP])
proc("4.1.2", "Recolher a apresentação de vendas do parceiro", "4.1", 2, "Guardar no perfil do parceiro a apresentação comercial dele, para o Gerente resgatar quando for apresentá-lo a um cliente.", GP, "Termo assinado", ("Apresentação no perfil", "P-M8"), "Gerente de Parcerias",
     [D("Q-0012")], status="confirmado")
proc("4.1.3", "Entregar o link exclusivo e os acessos", "4.1", 3, "Link exclusivo e QR Code, acesso ao portal para as pessoas do parceiro.", GP, "Termo assinado", ("Link e acessos entregues", "EXT:Parceiro"), "Empresa parceira",
     [S("s2", "Cada parceiro comercial assinado recebe um link exclusivo de indicação (e um QR Code) para usar com os próprios clientes.", "User Story 6")])
proc("4.2", "Conduzir o plano de ativação de 90 dias", "M4", 2, "Quatro encontros (alinhamento, vendas, produto, pós-venda) e marcos de 30, 60 e 90 dias, como marcos dentro do card do parceiro, não como quadro próprio.", GP,
     "Entrada preparada", ("Marcos cumpridos", "P-4.5"), "Empresa parceira",
     [S("s2", "o portal cria o plano de 90 dias com quatro encontros (alinhamento, vendas, produto e pós-venda) e os marcos de 30, 60 e 90 dias (Apêndice F)", "User Story 5"), F(PP, 1, 3)], part=[RESP_P])
proc("4.3", "Cruzar carteiras no encontro de alinhamento", "M4", 3, "No primeiro encontro, cruzar a carteira do parceiro com a do grupo revelando só as coincidências e escolher as primeiras jogadas, para dar ao parceiro uma vitória cedo.", GP,
     "Encontro de alinhamento", ("Primeiras jogadas escolhidas", "P-5.6"), "Empresa parceira", [D("Q-0011"), F(CV, 0, 3), F(CV, 0, 5)], status="confirmado", part=[RESP_P])
proc("4.4", "Capacitar o parceiro a vender o grupo", "M4", 4, "Seção do portal em que o parceiro aprende a vender a Wise Makers, a Tríade e a Swallow: trilhas e certificação, material de vendas de cada empresa e quanto ganha por indicação.", GP,
     "Convite para a trilha no encontro de alinhamento", ("Pessoas certificadas e kit em uso", "P-2.4.1"), "Pessoas do parceiro", [D("Q-0012"), S("s2", "O portal do parceiro ganha a área de capacitação, com trilhas criadas pela Wise.", "User Story 10")], status="confirmado", part=[RESP_P])
proc("4.4.1", "Liberar trilhas e certificação", "4.4", 1, "Cada pessoa faz a trilha com o próprio login e recebe certificado e selo.", GP, "Convite para a trilha", ("Pessoas certificadas", "P-2.4.1"), "Pessoas do parceiro",
     [S("s2", "Cada pessoa do parceiro faz a trilha com o próprio login e, ao passar no teste, recebe o próprio certificado em PDF e o selo de capacitação.", "User Story 10")])
proc("4.4.2", "Disponibilizar o kit de vendas das três empresas", "4.4", 2, "Material de vendas da Wise Makers, da Tríade e da Swallow no portal do parceiro.", GP, "Material novo ou parceiro novo", ("Kit disponível", "EXT:Parceiro"), "Pessoas do parceiro",
     [D("Q-0012")], status="confirmado")
proc("4.4.3", "Mostrar ao parceiro quanto ganha por indicação", "4.4", 3, "Simulador de comissão por empresa do grupo (40% da primeira mensalidade na Wise Makers e na Tríade, 6% do projeto na Swallow).", GP, "Parceiro abre a área de capacitação", ("Ganho simulado", "EXT:Parceiro"), "Pessoas do parceiro",
     [D("Q-0012"), D("Q-0005")], status="confirmado")
proc("4.5", "Declarar a ativação ou estender o plano", "M4", 5, "Na primeira indicação no ICP que virou reunião o parceiro é ativado; sem ativação em 90 dias, extensão até 120; depois, não ativado.", GP,
     "Marco de 90 dias ou primeira reunião gerada", ("Parceiro ativado ou não ativado", "P-M6"), "Empresa parceira",
     [S("s2", "Sem ativação em 90 dias, o responsável recebe alerta e o plano ganha uma extensão até 120 dias; sem ativação em 120 dias, o parceiro fica marcado como \"não ativado\".", "User Story 5")])

# ======================= 5. GERAR OPORTUNIDADES NO ECOSSISTEMA
proc("M5", "Gerar oportunidades no ecossistema", None, 5, "A interação central do programa: cada oportunidade compartilhada (indicação, pedido da Prateleira, jogada do cruzamento, contato do Base Ativa, indicação do grupo ao parceiro) percorre uma esteira única com passagens de bastão e dono da conta, até o fechamento, a comissão e a checagem do cliente.", GP,
     "Uma das quatro portas gera uma oportunidade", ("Cliente fechado e comissão paga", "EXT:Parceiro"), "Parceiro e empresas do grupo",
     [F(EP, 0, 0), F(EP, 0, 1), F(CV, 6, 0), F(CV, 7, 1)], status="hipotese", tipo="finalistico", part=[CONS, FIN], quadro=OPS)
proc("5.1", "Receber e qualificar a oportunidade", "M5", 1, "Registrar a oportunidade com a porta de origem, confirmar o recebimento ao parceiro, validar duplicidade, ICP e proteção.", GP,
     "Oportunidade registrada por link, portal, WhatsApp, cruzamento ou Base Ativa", ("Oportunidade qualificada ou recusada", "P-5.2"), "Parceiro",
     [S("s2", "Toda indicação ganha uma nota de qualidade (Apêndice E) e passa por validação da Wise, que confirma a aderência ao ICP.", "User Story 6"), F(CV, 7, 1)])
proc("5.2", "Passar a oportunidade a quem vende", "M5", 2, "Briefing de uma página ao consultor ou comercial da empresa que vai atender, que faz o primeiro contato em até 2 dias úteis e passa a ser o dono da conta.", GP,
     "Oportunidade qualificada", ("Primeiro contato feito pelo dono da conta", "P-5.3"), "Consultor ou comercial", [D("Q-0014"), D("Q-0016"), F(CV, 6, 1), F(CV, 6, 2)], status="confirmado", part=[CONS])
proc("5.3", "Retornar ao parceiro a cada etapa da venda", "M5", 3, "O Gerente cobra o andamento de quem vende e devolve ao parceiro cada etapa (primeiro contato em 5 dias úteis, depois a cada mudança e no mínimo a cada 15 dias), pelo WhatsApp.", GP,
     "Primeiro contato feito", ("Oportunidade fechada ou perdida, parceiro informado", "P-5.7"), "Parceiro",
     [S("s2", "| Parceiro para o grupo | Retorno ao parceiro sobre o primeiro contato | 5 dias úteis do registro |", "Apêndice E"), D("Q-0013"), F(CV, 5, 5)], status="confirmado", part=[CONS], sist=[SI_POR, SI_WPP])
proc("5.4", "Atender necessidade do cliente pela Prateleira", "M5", 4, "O consultor relata a necessidade, o Gerente registra o pedido, recebe a recomendação de parceiros, publica a página do cliente e acompanha o contato.", GP,
     "Cliente do grupo precisa de fornecedor fora do escopo da Wise", ("Cliente em contato com o parceiro", "EXT:Cliente industrial"), "Cliente industrial",
     [S("s1", "O cliente nunca faz o pedido sozinho. Quando precisa de um fornecedor fora do escopo da Wise, ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9"), D("Q-0013")], part=[CONS])
proc("5.5", "Indicar cliente do grupo ao parceiro", "M5", 5, "Demanda de volta: registrar a indicação de um cliente do grupo ao parceiro e acompanhar o resultado.", GP,
     "Cliente do grupo precisa de uma solução do parceiro", ("Resultado registrado", "EXT:Parceiro"), "Parceiro",
     [S("s1", "Quando a indicação vai da Wise para o parceiro, qualquer um dos dois pode atualizar o resultado, mas a responsabilidade de manter o registro é da Wise.", "User Story 6")], part=[CONS])
proc("5.6", "Gerar jogadas a partir do cruzamento de carteiras", "M5", 6, "Cada célula da matriz de contas (clientes, oportunidades e prospects de cada lado) é uma jogada: apresentar o parceiro a cliente do grupo, pedir indicação de cliente do parceiro, combinar ações em contas comuns.", GP,
     "Coincidências do cruzamento", ("Oportunidades criadas", "P-5.1"), "Parceiro e grupo", [F(CV, 0, 0), F(CV, 0, 1), F(CV, 4, 5)], status="hipotese")
proc("5.7", "Pagar a comissão", "M5", 7, "Calcular a comissão quando o cliente fecha, aguardar a compensação do primeiro pagamento, receber a nota fiscal do parceiro e pagar.", FIN,
     "Primeiro pagamento do cliente compensado", ("Comissão paga", "EXT:Parceiro"), "Parceiro",
     [S("s1", "O sistema calcula a comissão devida ao parceiro e a do responsável pela parceria conforme a regra de cada empresa, avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6"), D("Q-0005")], part=[GP])
proc("5.8", "Checar o cliente aos 6 e 12 meses", "M5", 8, "Tarefa do Gerente, executada pelo consultor que atende o cliente: o cliente segue ativo e satisfeito?", GP,
     "6 e 12 meses do fechamento", ("Checagem registrada", "P-2.4.2"), "Parceiro", [D("Q-0013"), S("s2", "Indicações fechadas geram checagens aos 6 e 12 meses para registrar se o cliente segue ativo e a satisfação dele.", "User Story 6")],
     status="confirmado", part=[CONS])

# ======================= 6. DESENVOLVER O PARCEIRO E A COMUNIDADE
proc("M6", "Desenvolver o parceiro e a comunidade", None, 6, "Depois da ativação: impacto e crescimento da jornada, com intensidade proporcional ao segmento de atenção do parceiro.", GP,
     "Parceiro ativado", ("Parceiro em crescimento", "P-2.3"), "Empresa parceira",
     [S("s2", "As contrapartidas da v1 passam a fazer parte de um plano de ações conjuntas por parceiro, com ações dos dois lados", "User Story 11"), F(PP, 1, 0)], tipo="finalistico", part=[RESP_P], quadro=J)
proc("6.1", "Conduzir o ciclo do Base Ativa", "M6", 1, "Fila por horas disponíveis, ciclo de 12 semanas com 6 encontros e evento da comunidade; os encontros ficam na agenda e no card do parceiro.", GP,
     "Parceiro de pacote A com horas disponíveis", ("Comunidade validada", "EXT:Parceiro"), "Empresa parceira",
     [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7"), D("Q-0002")], part=[RESP_P], quadro=AGENDA)
proc("6.2", "Planejar e executar ações conjuntas", "M6", 2, "Plano de ações dos dois lados, com data, responsável, comprovação, resultado e custo direto, em calendário.", GP,
     "Revisão conjunta ou data prevista da ação", ("Ação comprovada com resultado", "P-2.4.2"), "Empresa parceira",
     [S("s2", "Cada ação tem lado, tipo, data prevista, responsável, estado, comprovação, resultado (alcance, inscritos, indicações geradas) e custo direto, quando houver.", "User Story 11")], part=[RESP_P], quadro=AGENDA)
proc("6.3", "Revisar a parceria com o parceiro", "M6", 3, "Revisão conjunta com pauta montada pelo portal (resultados, oportunidades abertas, saúde, próximos passos); trimestral para todos os ativos, mensal para os destaques; o Diretor participa nas dos parceiros Elite. As ações nascem da ata.", GP,
     "Data da revisão pela cadência", ("Plano do próximo período", "P-6.2"), "Empresa parceira", [D("Q-0017"), D("Q-0018"), F(AN, 0, 3), F(AN, 0, 4)], status="confirmado", part=[DIR, RESP_P], quadro=AGENDA)
proc("6.4", "Animar a comunidade Wise Partners", "M6", 4, "Dar vida à comunidade no WhatsApp: comunicado do mês, troca de práticas entre parceiros, convites para mentoria e eventos, reconhecimento público.", GP,
     "Calendário mensal da comunidade", ("Comunidade ativa", "EXT:Parceiros"), "Parceiros",
     [D("Q-0012"), B("bech-partner-channels", "Orquestrar troca de práticas e aproximação entre parceiros"), F(CV, 5, 5)], status="hipotese", sist=[SI_WPP], freq="Mensal", quadro=AGENDA)
proc("6.4.1", "Publicar o comunicado do mês na comunidade", "6.4", 1, "Uma mensagem por mês aos parceiros: novidades, resultados do programa, oportunidades e agenda.", GP, "Início do mês", ("Comunicado publicado", "EXT:Parceiros"), "Parceiros",
     [D("Q-0012"), F(CV, 5, 4)], status="hipotese", sist=[SI_WPP], freq="Mensal")
proc("6.4.2", "Promover a troca entre parceiros", "6.4", 2, "Apresentar parceiros complementares entre si e reunir parceiros, inclusive concorrentes, em encontros e eventos, porque a presença conjunta cria o mercado para todos.", GP,
     "Oportunidade de troca identificada", ("Parceiros conectados", "EXT:Parceiros"), "Parceiros",
     [B("co-opetition", "Reunir parceiros que competem entre si"), F(EJ, 1, 5)], status="hipotese", sist=[SI_WPP])
proc("6.4.3", "Abrir a mentoria mensal à carteira dos parceiros", "6.4", 3, "Calendário da mentoria mensal da Wise aberto às carteiras dos parceiros de pacote B e A.", GP, "Calendário mensal", ("Convites enviados", "EXT:Parceiros"), "Carteiras dos parceiros",
     [S("s1", "calendário da mentoria mensal e dos eventos", "User Story 8")], freq="Mensal")
proc("6.5", "Reconhecer o parceiro por nível", "M6", 5, "Benefícios em espécie por nível, divulgados antes: palco no evento, selo, mentoria, prioridade na Prateleira; o melhor agradecimento vai para os melhores.", GP,
     "Mudança de nível ou fechamento do ranking", ("Reconhecimento entregue", "EXT:Parceiro"), "Parceiro", [F(EJ, 2, 3), F(EJ, 2, 4), F(EJ, 2, 5)], status="hipotese")
proc("6.6", "Evoluir o nível e o pacote", "M6", 6, "Subida na hora em que os requisitos do nível acima são cumpridos; pacote acompanha o nível.", GP, "Requisitos do nível acima cumpridos", ("Nível e pacote novos", "P-6.2"), "Parceiro",
     [S("s2", "Quando o parceiro cumpre todos os requisitos de um nível acima, sobe na hora, com aviso a ele e ao responsável.", "User Story 4")])
proc("6.7", "Escolher a jogada pelo tipo de parceria", "M6", 7, "Classificar cada parceria num dos oito tipos (por exemplo, evangelista, pragmático estável, catador de cerejas, desertor) e aplicar a jogada padrão do tipo; o tipo muda com o comportamento.", GP,
     "Fechamento trimestral ou primeira revisão aos 90 dias", ("Jogada do trimestre por parceiro", "P-2.3"), "Gerente de Parcerias", [F(AN, 2, 0), F(AN, 2, 1), F(AN, 2, 3)], status="hipotese")

# ======================= 7. RETER OU ENCERRAR A PARCERIA
proc("M7", "Reter ou encerrar a parceria", None, 7, "Tratar parceiro em risco com retomada focada numa oportunidade concreta e, sem resposta, desligar de forma formal e amigável, passando o cliente sem atrito.", GP,
     "Parceiro cumpre os critérios de risco ou pede saída", ("Parceiro retomado ou parceria encerrada", "EXT:Parceiro"), "Empresa parceira",
     [S("s2", "Parceiros que cumprem os critérios de risco (Apêndice D) entram no fluxo de desligamento", "User Story 12")], tipo="finalistico", part=[DIR], quadro=J)
proc("7.1", "Retomar parceiro em risco", "M7", 1, "Duas tentativas com 15 dias de intervalo, tratando o parceiro como se fosse recrutado de novo, com uma oportunidade concreta na mão.", GP,
     "Parceiro entra em risco", ("Parceiro retomado ou sugestão de desligamento", "P-7.2"), "Empresa parceira",
     [S("s2", "Primeira tentativa de retomada: próximo passo criado na hora, com mensagem sugerida que propõe uma reunião.", "Apêndice D"), F(AN, 2, 3)])
proc("7.2", "Desligar parceiro", "M7", 2, "Aprovação do Diretor, aviso formal de 30 dias por conversa e por escrito, encerramento com acessos revogados e comissões preservadas.", GP,
     "Sugestão de desligamento", ("Parceria encerrada", "EXT:Parceiro"), "Empresa parceira",
     [S("s2", "Aviso formal: texto gerado pelo portal, enviado pelo responsável, com encerramento em 30 dias (cláusula 13.4 do contrato).", "Apêndice D"), F(AN, 2, 4)], part=[DIR])
proc("7.3", "Encerrar a parceria a pedido", "M7", 3, "Saída por decisão de qualquer das partes, com aviso de 30 dias, registrada como encerramento amigável e não como fracasso.", GP,
     "Pedido de saída", ("Parceria encerrada de forma amigável", "EXT:Parceiro"), "Empresa parceira", [A("EV-0046"), B("getting-to-yes", "Aceitar como resultado válido")])

# ======================= SUPORTE
proc("M8", "Manter a Prateleira de fornecedores", None, 8, "Categorias e fichas verificadas, sem limite de fornecedores por categoria; a permanência depende da nota de qualidade e do retorno dos clientes.", GP,
     "Parceiro assinado ou ficha desatualizada", ("Prateleira curada", "P-5.4"), "Consultores e clientes industriais",
     [D("Q-0019"), S("s1", "Em cada categoria, vê quantos parceiros existem, em que etapa estão, quantos estão assinados e se a categoria tem as 3 opções que o programa exige.", "User Story 1"), F(EP, 3, 4)],
     status="confirmado", tipo="suporte", regras=["Sem limite de fornecedores por categoria", "Permanência depende da nota de qualidade e do retorno dos clientes"])
proc("M9", "Gerir conteúdos e capacitação", None, 9, "Manter trilhas, kit de vendas das três empresas, materiais, modelos de contrato e textos de e-mail.", GP,
     "Material novo ou mudança de oferta", ("Conteúdo publicado", "P-4.4"), "Parceiros e time", [S("s2", "O portal do parceiro ganha a área de capacitação, com trilhas criadas pela Wise.", "User Story 10"), D("Q-0012")], tipo="suporte")
proc("M10", "Gerir dados, atribuição e privacidade", None, 10, "Cruzamento com consentimento que revela só coincidências, dados só de empresa, proteção de 180 dias, registro de origem e auditoria de acesso.", GP,
     "Carteira recebida, oportunidade registrada ou pedido de dados", ("Dados protegidos e atribuição registrada", "P-M5"), "Parceiros e grupo",
     [D("Q-0020"), S("s2", "O servidor compara com a base da Wise, descarta a lista do parceiro no mesmo processamento e guarda só as coincidências por 180 dias.", "User Story 14"), F(CV, 0, 4)], status="confirmado", tipo="suporte")
proc("M11", "Alinhar o ecossistema interno do grupo", None, 11, "Combinar com o comercial e a entrega de Wise Makers, Tríade e Swallow o tratamento das oportunidades vindas de parceiros: SLA interno, briefing, dono da conta e crédito integral na meta de quem fecha.", GP,
     "Antes do primeiro parceiro e a cada mudança de regra", ("Rotina interna realinhada", "P-M5"), "Comercial do grupo", [F(EJ, 7, 5), F(CV, 5, 2), D("Q-0015")], status="hipotese", tipo="suporte", part=[DIR, CONS])
proc("M12", "Administrar o portal e os contratos", None, 12, "Usuários, acessos, configurações, importações, versões do termo e vigência dos contratos.", GP,
     "Pessoa nova, mudança de configuração ou contrato", ("Portal e contratos em ordem", "EXT:Time de parcerias"), "Time de parcerias",
     [S("s1", "Antes do uso, o administrador importa os parceiros atuais (planilha), os documentos já produzidos", "User Story 10")], tipo="suporte")
