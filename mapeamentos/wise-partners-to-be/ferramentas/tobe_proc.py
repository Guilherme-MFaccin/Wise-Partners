# Parte 2 do to-be: negócio, processos, funis, perguntas e ideias. Executado dentro de tobe.py (usa d, S, B, U, add).
DE_FLUXO = next(x["id"] for x in d["decisoes"] if x["texto"].startswith("Passo a passo detalhado"))
DE_FUNIL = next(x["id"] for x in d["decisoes"] if x["texto"].startswith("Cada processo repetitivo"))
PERG = []  # (chave, texto, tipo, opcoes, alvo, bloco)

def Q(chave, texto, tipo, opcoes, alvo, bloco):
    PERG.append((chave, texto, tipo, opcoes, alvo, bloco))

# ================================================================ modelo de negócio (canvas do programa)
OF1 = add("ofertas", "OF", nome="Parceria Comercial", tipo="servico", clientes=["Empresas que vendem para a mesma indústria que a Wise atende (softwares e serviços)"],
          canais=["Link exclusivo de indicação", "Portal do parceiro", "Grupo de WhatsApp"], status="declarado",
          evidencias=[S("s1", "o portal gera a minuta do contrato (Parceria Comercial ou Parceria Institucional) em PDF e em Word", "User Story 4")])
OF2 = add("ofertas", "OF", nome="Parceria Institucional", tipo="servico", clientes=["Associações, feiras e entidades que reúnem indústrias"],
          canais=["Mentoria e palestra no calendário da entidade"], status="declarado",
          evidencias=[S("s2", "Parceria institucional não usa scorecard nem nível por resultado nesta versão.", "Apêndice A")])

F = {}
def fato(chave, tema, texto, status, evs):
    F[chave] = add("fatos", "F", tema=tema, texto=texto, status=status, evidencias=evs)

fato("papel", "estrategia", "Papel da Wise no ecossistema: orquestradora de um sub-ecossistema pequeno de parceiros que vendem para a indústria e participante nos ecossistemas dos parceiros maiores (ERPs com programa de canais próprio), sempre controlando a relação com o cliente industrial e a qualidade da indicação.",
     "hipotese", [B("ecosystem-economy", "Declarar por escrito qual papel a Wise exerce"), B("ecosystem-economy", "Adotar um papel híbrido"), B("winning-the-right-game", "a Wise deve assumir o papel de seguidora")])
fato("clientes", "cliente", "O programa tem dois clientes: o parceiro, que é cliente do programa e precisa receber valor antes de indicar, e a indústria, consumidora final do valor criado pelos dois.",
     "hipotese", [B("channel-advantage", "Tratar o parceiro como cliente do programa"), B("winning-the-right-game", "Escrever a proposta de valor pelo benefício que o consumidor final recebe")])
fato("valor", "proposta_de_valor", "Arquitetura de valor ao parceiro: demanda de volta pela Prateleira de RFP, carteira ativa com o Base Ativa e o evento, credibilidade com trilha, certificado e selo, proteção da indicação por 180 dias com SLA, e comissão por resultado.",
     "declarado", [S("s2", "A indicação fica protegida por 180 dias desde a última interação", "User Story 6"), S("s2", "ao passar no teste, recebe o próprio certificado em PDF e o selo de capacitação", "User Story 10"),
                   B("winning-the-right-game", "Montar a arquitetura de valor do programa em elementos"), B("ecossistema-de-parceiros", "Não apoiar a proposta apenas em comissão")])
fato("canal", "canal", "Toda indicação entra por um único registro central: o link exclusivo do parceiro ou o registro no portal; o grupo de WhatsApp é o canal de conversa e a mensagem nele também vale como registro de origem.",
     "declarado", [S("s2", "Cada parceiro comercial assinado recebe um link exclusivo de indicação (e um QR Code) para usar com os próprios clientes.", "User Story 6"),
                   B("channel-advantage", "Registrar toda indicação em um único sistema central")])
fato("receita", "receita", "Como o programa gera valor: a Wise ganha clientes novos no ICP; paga ao parceiro 40% da primeira mensalidade (Wise Makers e Tríade) ou 6% do projeto (Swallow), e 10% ao responsável da parceria.",
     "declarado", [S("s1", "o sistema calcula 40% da primeira mensalidade para o parceiro e 10% para o responsável pela parceria", "User Story 6, cenário 1"),
                   S("s1", "para a Swallow, 6% do valor do projeto para o parceiro e 2% para o responsável", "User Story 6, cenário 2")])
fato("captura", "receita", "Regra de captura de valor: nada é cobrado do parceiro para entrar ou aparecer na prateleira; a Wise só paga quando a indicação vira resultado, e o valor pode ser calibrado pela qualidade da indicação.",
     "hipotese", [B("platform-revolution", "Não cobrar parceiros por entrada"), B("co-opetition", "amarrar a remuneração à nota de qualidade"), B("channel-advantage", "Calibrar os 40% da primeira mensalidade")])
fato("mve", "estrategia", "Sequência de lançamento: primeiro a Prateleira de RFP com 3 a 5 parceiros âncora e as indicações por link; o Base Ativa abre só quando os gatilhos ficarem verdes, depois de um ciclo rodado na base da própria Wise.",
     "hipotese", [B("winning-the-right-game", "Fixar por escrito a ordem de lançamento dos pilares"), B("nearbound", "Só vender ao parceiro o ciclo e o método que a Wise já executou"),
                  B("ecossistema-de-parceiros", "Lançar um programa mínimo viável (MVCP)")])
fato("ativos", "estrategia", "O que conta é parceiro ativo, não parceiro assinado: a meta de assinaturas vem acompanhada de uma meta de ativação (primeira indicação no ICP que virou reunião).",
     "hipotese", [B("ecossistema-de-parceiros", "Não escalar o número de parceiros antes"), B("channel-advantage", "Medir a taxa de parceiros ativos")])
fato("tempo", "recurso", "Capacidade: o Gerente de Parcerias tem 12 horas por mês para o programa; o tempo humano vai para os parceiros destaque e potencial, e a cauda longa é atendida pelo portal (régua automática, comunicados, trilhas).",
     "hipotese", [S("s2", "Destaque | 5% do topo, no mínimo 1 |", "Apêndice C"), B("ecosystem-led-growth", "Automatizar a avaliação, o onboarding e a gestão dos parceiros de cauda longa"),
                  B("bech-partner-channels", "Segmentar a base de parceiros em estrelas")])
fato("tipos", "parceiro", "Tipos de parceiro e papel de cada um: softwares e serviços para a indústria recomendam, validam e indicam; associações e feiras abrem acesso à audiência; nenhum parceiro vende ou entrega a consultoria da Wise.",
     "declarado", [S("s2", "A ficha ganha o modelo de atuação do parceiro (um ou mais: indicador, co-venda, implementador ou parceiro técnico, tecnologia ou integração, institucional ou comunidade)", "User Story 9"),
                   B("nearbound", "Classificar cada parceiro pelo papel que realmente exerce"), B("ecossistema-de-parceiros", "Enquadrar associações, feiras e entidades")])
fato("oferta", "oferta", "O programa oferece duas parcerias: a Comercial, com três pacotes por nível (C Prateleira, B Formação e A Base Ativa) e contrapartidas, e a Institucional, para entidades.",
     "declarado", [S("s1", "O usuário escolhe o pacote disponível para o nível, e o sistema carrega as contrapartidas do pacote, com periodicidade e forma de comprovação.", "User Story 5"),
                   S("s1", "o portal gera a minuta do contrato (Parceria Comercial ou Parceria Institucional) em PDF e em Word", "User Story 4")])
fato("cliente_decl", "cliente", "Quem recebe o resultado: as empresas parceiras, organizadas por categoria de prateleira, e os clientes industriais do grupo, que recebem fornecedores verificados.",
     "declarado", [S("s1", "O Gerente de Parcerias abre o portal e vê os parceiros agrupados por categoria de prateleira.", "User Story 1"),
                   S("s1", "O cliente nunca faz o pedido sozinho.", "User Story 9")])
d["modelo_operacional"] = {"integracao": "alta", "padronizacao": "alta", "tipo": "unificacao",
    "justificativa": "Proposta: as três empresas do grupo tratam a indicação do mesmo jeito (registro, SLA e retorno ao parceiro), mesmo vendendo cada uma a sua oferta.",
    "status": "hipotese", "evidencias": [B("winning-the-right-game", "Tratar Wise Makers, Tríade e Swallow como um ecossistema interno")]}

Q("canvas", "Você aprova este desenho do modelo de negócio? A Wise orquestra um ecossistema pequeno e controla a relação com a indústria; o parceiro é cliente do programa e recebe valor antes de indicar; nada é cobrado do parceiro; o que conta é parceiro ativo, não assinado.", "escolha",
  ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo (comente)"], [F["papel"], F["clientes"], F["captura"], F["ativos"], "NEGOCIO.cliente"], "Modelo de negócio")
Q("sequencia", "Em que ordem os pilares entram no ar?", "escolha",
  ["Prateleira e indicações já; Base Ativa só depois de gatilhos e de um ciclo rodado na base da Wise (recomendado pelos livros)", "Os três pilares desde o primeiro parceiro", "Outra ordem (comente)"], [F["mve"]], "Modelo de negócio")
Q("meta_ativos", "Como fica a meta de dezembro?", "escolha",
  ["10 assinados e também uma meta de ativados (recomendado)", "Só os 10 assinados", "Trocar a meta para parceiros ativados"], [F["ativos"]], "Modelo de negócio")
Q("cauda", "Como dividir as 12 horas mensais?", "escolha",
  ["Tempo humano nos parceiros destaque e potencial; o restante atendido pelo portal (recomendado)", "Atenção próxima a todos enquanto forem poucos, e dividir depois", "Outra regra (comente)"], [F["tempo"]], "Modelo de negócio")
Q("tres_empresas", "As três empresas do grupo tratam a indicação do mesmo jeito (mesmo registro, mesmo SLA, mesmo retorno ao parceiro)?", "escolha",
  ["Sim, igual nas três; a venda é livre (recomendado)", "Só a Wise Makers segue o processo por enquanto", "Não sei: perguntar ao Igor"], ["NEGOCIO.modelo_operacional"], "Modelo de negócio")

# ================================================================ processos
P = {}
def proc(chave, nome, pai, ordem, descricao, dono, gatilho, saidas, cliente, evs, status="declarado", tipo=None, participantes=(), sistemas=(SI_POR,),
         regras=(), indicadores=(), frequencia="", funil=None, hipoteses=(), dispensar=True):
    obj = {"nome": nome, "pai": P.get(pai), "ordem": ordem, "descricao": descricao, "dono": dono, "participantes": list(participantes),
           "gatilho": gatilho, "entradas": [], "saidas": saidas, "cliente": cliente, "sistemas": list(sistemas), "indicadores": list(indicadores),
           "frequencia": frequencia, "dores": [], "regras": list(regras), "status": status, "hipoteses": list(hipoteses), "evidencias": evs,
           "situacao": "no_papel", "fluxo_dispensado": None}
    if tipo:
        obj["tipo"] = tipo
    if funil:
        obj["funil"] = funil
    P[chave] = add("processos", "P", **obj)
    return P[chave]

def sai(nome, para):
    return [{"nome": nome, "para": para}]

# ---------------- gestão
proc("G", "Governar o programa de parceiros", None, 1, "Dar direção, metas, regras e medida ao programa.", GP, "", [], "Diretoria da Wise Makers",
     [S("s2", "O painel semanal passa a ser organizado pelas quatro etapas da jornada do parceiro (captação, onboarding, relacionamento e produção)", "User Story 7")], tipo="gestao", participantes=[DIR])
proc("G_ipp", "Definir o perfil de parceiro ideal e a proposta de valor", "G", 1, "Escrever quem é o parceiro ideal, o modelo de atuação de cada tipo e a proposta de valor em quatro pontos, e revisar com dados.", GP,
     "Início de cada ano ou mudança de fase do programa", sai("Perfil de parceiro ideal e proposta de valor publicados", "EXT:Time de parcerias"), "Time de parcerias e Diretor",
     [S("s2", "a proposta de valor da parceria em quatro pontos: o que o parceiro quer ganhar, o que a Wise oferece, como esse valor é entregue e o valor criado para cada lado e para o cliente", "User Story 9"),
      B("ecossistema-de-parceiros", "Definir o perfil de parceiro ideal a partir do ICP"), B("bech-partner-channels", "Escrever o perfil de parceiro ideal como uma descrição de vaga")], frequencia="Anual, com revisão por fase")
proc("G_metas", "Planejar metas e fase do programa", "G", 2, "Definir metas trimestrais do programa e de cada pessoa, e registrar quando os critérios da próxima fase são atingidos.", GP,
     "Início de cada trimestre", sai("Metas do trimestre e fase registradas no portal", "EXT:Time de parcerias"), "Diretor e time de parcerias",
     [S("s2", "A fase do programa fica registrada e o portal mostra quando os critérios da próxima fase foram atingidos.", "User Story 7"),
      S("s2", "tem a própria carteira (parceiros dos quais é responsável) e metas trimestrais", "User Story 15")], participantes=[DIR], frequencia="Trimestral")
proc("G_semanal", "Revisar o programa semanalmente", "G", 3, "Pautar a reunião semanal pelo painel: distância até a meta, funil, follow-ups vencidos, parceiros esfriando, indicações e comissões.", GP,
     "Toda terça-feira", sai("Pendências priorizadas da semana", "EXT:Time de parcerias"), "Diretor",
     [S("s1", "Na reunião semanal, o Gerente de Parcerias e o Diretor pautam a conversa pelo painel", "User Story 3")], participantes=[DIR], frequencia="Semanal")
proc("G_nivel", "Revisar o nível dos parceiros", "G", 4, "Apurar os requisitos de nível de cada parceiro no início do trimestre, colocar em observação ou propor descida, e classificar as faixas de desempenho.", GP,
     "Primeiro dia útil de janeiro, abril, julho e outubro", sai("Nível e faixa de cada parceiro revistos", "EXT:Parceiro"), "Parceiro",
     [S("s2", "Revisão: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre.", "Apêndice B"), U("EV-0109")],
     status="confirmado", regras=["O nível de entrada vem da carteira no ICP; depois da entrada, acompanha o resultado", "Subida na hora em que os requisitos forem cumpridos; descida só depois de um trimestre em observação, decidida por uma pessoa com motivo"],
     frequencia="Trimestral", funil="Revisão de nível (lista)", dispensar=False)
proc("G_regras", "Publicar regras e comunicados", "G", 5, "Manter as regras do programa no portal com vigência mínima de 30 dias para mudanças e enviar comunicados por recorte.", GP,
     "Mudança de regra, evento ou material novo", sai("Comunicado enviado e lido", "EXT:Parceiro"), "Parceiros",
     [S("s2", "Mudança de regra que afeta parceiros tem data de vigência de no mínimo 30 dias e gera um comunicado.", "User Story 13"), B("platform-revolution", "Escrever o regulamento do programa em três partes")])
proc("G_roi", "Apurar o resultado e o ROI do canal", "G", 6, "Calcular clientes fechados via parceiros, receita atribuída, custo do canal (comissões, horas e custos diretos), ROI e custo por cliente.", GP,
     "Fechamento de cada mês", sai("Resultado do canal no período", "EXT:Diretoria"), "Diretor",
     [S("s2", "clientes fechados no ICP via parceiros, receita atribuída ao canal, custo total do canal separado em comissões, horas da equipe e custos diretos, ROI", "User Story 1")], participantes=[DIR], frequencia="Mensal")
proc("G_sat", "Ouvir a satisfação dos parceiros", "G", 7, "Enviar a pesquisa trimestral de satisfação a cada pessoa dos parceiros e tratar os comentários.", GP,
     "Uma vez por trimestre", sai("Notas e comentários tratados", "EXT:Parceiro"), "Parceiros",
     [S("s2", "Uma pesquisa trimestral de satisfação dos parceiros (nota de 0 a 10 e comentário) é enviada a cada pessoa do parceiro pelo portal e por e-mail.", "User Story 7")], frequencia="Trimestral")
proc("G_ranking", "Apurar o ranking e premiar parceiros", "G", 8, "Calcular o ranking do trimestre e do ano e registrar a premiação anual com selo.", GP,
     "Fim de cada trimestre e do ano", sai("Ranking publicado e prêmio anual", "EXT:Parceiro"), "Parceiros",
     [S("s2", "A premiação anual é registrada no portal e gera selo para o vencedor.", "User Story 13"), B("co-opetition", "Recompensar a lealdade em espécie")], frequencia="Trimestral e anual")

# ---------------- captar
proc("F1", "Captar parceiros", None, 2, "Do candidato mapeado ao termo assinado.", GP, "Empresa candidata entra na lista", sai("Termo assinado", "P-F2"), "Empresa parceira",
     [S("s2", "O funil ganha a etapa \"qualificação\" (scorecard), entre \"reunião realizada\" e \"proposta com o decisor\", e o estado \"nutrição\" para quem ainda não é a hora", "User Story 9")],
     tipo="finalistico", participantes=[DIR], funil="Recrutamento", dispensar=False)
proc("F1_lista", "Montar a lista de candidatos", "F1", 1, "Montar uma lista nominal e longa de candidatos a partir dos fornecedores que os clientes do grupo já usam, das categorias pedidas sem fornecedor e de eventos.", GP,
     "Revisão mensal da lista ou categoria sem fornecedor", sai("Candidatos na etapa Sem contato", "P-F1_abordar"), "Gerente de Parcerias",
     [B("nearbound", "Montar a lista de parceiros-alvo de forma nominal"), B("winning-the-right-game", "Usar o carryover"), B("bech-partner-channels", "Manter lista longa com pelo menos dez vezes"),
      S("s1", "Given um pedido sem fornecedor em alguma categoria, When registrado, Then a necessidade entra no relatório de categorias a prospectar.", "User Story 9, cenário 8")],
     status="hipotese", participantes=[CONS], frequencia="Mensal")
Q("lista", "Como a lista de candidatos é montada?", "multipla",
  ["Perguntando aos clientes do grupo quais sistemas e fornecedores usam e confiam (pergunta fixa no diagnóstico dos consultores)", "Fornecedores que já aparecem nas indústrias atendidas pelo grupo",
   "Categorias pedidas na prateleira sem fornecedor", "Eventos e Expo+Indústria", "Prospecção ativa por perfil"], [P["F1_lista"]], "Captar parceiros")
proc("F1_abordar", "Abordar candidato", "F1", 2, "Fazer o primeiro contato com o candidato e agendar a reunião de apresentação.", GP, "Candidato na etapa Sem contato",
     sai("Reunião agendada", "P-F1_apresentar"), "Candidato", [S("s1", "O parceiro percorre as etapas do funil.", "User Story 4")], sistemas=[SI_POR, SI_WPP])
proc("F1_apresentar", "Apresentar o programa e mapear interesses", "F1", 3, "Conduzir a reunião de 45 minutos começando pelo problema e pelos interesses do candidato, e registrar interesses, decisores e a decisão que a Wise está pedindo.", GP,
     "Reunião agendada", sai("Reunião realizada com interesses registrados", "P-F1_qualificar"), "Candidato",
     [S("s2", "a proposta de valor da parceria em quatro pontos: o que o parceiro quer ganhar, o que a Wise oferece, como esse valor é entregue e o valor criado para cada lado e para o cliente", "User Story 9"),
      B("getting-to-yes", "Na reunião de apresentação, abrir pelo problema e pelos interesses"), B("getting-to-yes", "Negociar interesses e não posições")])
proc("F1_qualificar", "Qualificar candidato no scorecard", "F1", 4, "Pontuar os sete critérios do scorecard, calcular o nível de entrada e sinalizar não elegível.", GP,
     "Reunião realizada", sai("Nível de entrada sugerido ou não elegível", "P-F1_formalizar"), "Diretor",
     [S("s2", "Antes da proposta, o time de parcerias preenche o scorecard do parceiro: sete critérios (Apêndice A), cada um com nota 0, 0,5 ou 1 por uma régua descrita na tela.", "User Story 3")])
proc("F1_formalizar", "Negociar e formalizar o termo", "F1", 5, "Gerar a minuta pelo portal a partir do quadro de identificação, colher críticas, obter a aprovação do Diretor e a assinatura digital.", GP,
     "Candidato qualificado quer seguir", sai("Termo assinado", "P-F2"), "Empresa parceira",
     [S("s1", "Na negociação, o usuário preenche o Quadro de Identificação e o portal gera a minuta do contrato", "User Story 4"), U("EV-0107"), U("EV-0106")],
     participantes=[DIR], sistemas=[SI_POR, SI_AUT, SI_WPP], dispensar=False)
proc("F1_nutrir", "Nutrir candidato", "F1", 6, "Manter o candidato que ainda não é a hora em pausa, com data de retomada e cadência de contato, oferecendo valor sem pedir nada.", GP,
     "Candidato pede para retomar depois", sai("Candidato retomado na negociação", "P-F1_apresentar"), "Candidato",
     [S("s2", "o estado \"nutrição\" para quem ainda não é a hora, com data de retomada e cadência de contato", "User Story 9"), U("EV-0108"), B("nearbound", "Na etapa de nutrição, fazer pequenos gestos sem pedido")])

# ---------------- integrar
proc("F2", "Integrar parceiro", None, 3, "Do termo assinado à ativação: primeira indicação com ICP confirmado que virou reunião.", GP, "Termo assinado",
     sai("Parceiro ativado", "P-F4"), "Empresa parceira",
     [S("s2", "O onboarding termina na ativação: a primeira indicação do parceiro com ICP confirmado pela Wise que virou reunião.", "User Story 5"), U("EV-0110")],
     status="confirmado", tipo="finalistico", participantes=[RESP], funil="Onboarding", dispensar=False)
proc("F2_entrada", "Entregar os itens de entrada do pacote", "F2", 1, "Fazer em até 2 dias úteis as entregas de entrada do pacote: prateleira, grupo, dados, Hub, certificado e selo.", GP, "Termo assinado",
     sai("Entregas do pacote feitas", "P-F2_encontros"), "Empresa parceira", [S("s2", "| Até 2 dias úteis | Tarefas do pacote (v1) | Prateleira, grupo, dados, Hub, certificado e selo conforme o pacote |", "Apêndice F")], sistemas=[SI_POR, SI_HUB, SI_WPP])
proc("F2_encontros", "Conduzir os encontros do plano de 90 dias", "F2", 2, "Fazer os quatro encontros (alinhamento, vendas, produto e pós-venda) e acompanhar os marcos de 30, 60 e 90 dias.", GP, "Entregas do pacote feitas",
     sai("Marcos cumpridos", "P-F2"), "Empresa parceira",
     [S("s2", "o portal cria o plano de 90 dias com quatro encontros (alinhamento, vendas, produto e pós-venda) e os marcos de 30, 60 e 90 dias (Apêndice F)", "User Story 5")], participantes=[RESP])
proc("F2_capacitar", "Capacitar e certificar pessoas do parceiro", "F2", 3, "Cada pessoa do parceiro faz a trilha no portal e, ao passar no teste, recebe o certificado e o selo.", GP, "Convite das pessoas para a trilha no encontro 1",
     sai("Pessoas certificadas", "P-G_nivel"), "Pessoas do parceiro", [S("s2", "Cada pessoa do parceiro faz a trilha com o próprio login e, ao passar no teste, recebe o próprio certificado em PDF e o selo de capacitação.", "User Story 10")],
     participantes=[RESP])
proc("F2_cruzar", "Cruzar carteiras com o parceiro", "F2", 4, "Comparar a carteira do parceiro com a base da Wise revelando só as coincidências, e transformar coincidências em indicação ou ação conjunta.", GP,
     "Parceiro aceita o termo do cruzamento", sai("Coincidências avaliadas", "P-F3_indicacao"), "Empresa parceira",
     [S("s2", "O servidor compara com a base da Wise, descarta a lista do parceiro no mesmo processamento e guarda só as coincidências por 180 dias.", "User Story 14"),
      B("nearbound", "Antes de pedir indicação, cruzar carteiras"), B("ecosystem-led-growth", "Cruzar a carteira do parceiro com a base e os leads da Wise revelando apenas")],
     participantes=[RESP], hipoteses=["gatilho"])
Q("cruzamento", "Quando o cruzamento de carteiras acontece?", "escolha",
  ["No encontro de alinhamento do onboarding, para dar ao parceiro uma primeira vitória cedo (recomendado)", "Já na qualificação, antes de assinar, para medir o potencial", "Só quando o parceiro pedir (como está na especificação)"],
  [P["F2_cruzar"] + ".gatilho"], "Integrar parceiro")

# ---------------- gerar negócios
proc("F3", "Gerar negócios com o parceiro", None, 4, "Transformar a relação em clientes: indicações nos dois sentidos, prateleira, apoio do parceiro nas vendas da Wise e comissão.", GP,
     "", sai("Clientes fechados e comissão paga", "EXT:Parceiro"), "Parceiro e empresas do grupo",
     [S("s1", "Um usuário interno ou o parceiro registra uma indicação: do parceiro para a Wise Makers, a Tríade ou a Swallow, ou de uma dessas empresas para o parceiro.", "User Story 6")], tipo="finalistico", participantes=[CONS, FIN])
proc("F3_indicacao", "Tratar indicação do parceiro", "F3", 1, "Registrar, confirmar, validar duplicidade e ICP, fazer o primeiro contato, dar retorno ao parceiro e acompanhar até o fechamento.", GP,
     "Parceiro indica um cliente pelo link exclusivo, pelo portal ou pelo grupo", sai("Indicação fechada, perdida ou recusada", "P-F3_comissao"), "Parceiro que indicou",
     [S("s2", "Toda indicação ganha uma nota de qualidade (Apêndice E) e passa por validação da Wise, que confirma a aderência ao ICP.", "User Story 6"),
      S("s2", "| Parceiro para o grupo | Validação (duplicidade e ICP) e primeiro contato com o cliente | 2 dias úteis |", "Apêndice E")],
     participantes=[CONS], funil="Indicações", dispensar=False)
proc("F3_inversa", "Indicar cliente do grupo ao parceiro", "F3", 2, "Registrar a indicação de um cliente da Wise, da Tríade ou da Swallow ao parceiro e acompanhar o resultado.", CONS,
     "Cliente do grupo precisa de uma solução do parceiro", sai("Indicação com resultado registrado", "EXT:Parceiro"), "Parceiro",
     [S("s1", "Quando a indicação vai da Wise para o parceiro, qualquer um dos dois pode atualizar o resultado, mas a responsabilidade de manter o registro é da Wise.", "User Story 6")], participantes=[GP])
proc("F3_rfp", "Atender pedido de fornecedor pela prateleira", "F3", 3, "Registrar a necessidade do cliente, recomendar parceiros com apoio da IA, publicar a página do cliente e acompanhar o contato.", CONS,
     "Cliente do grupo precisa de um fornecedor fora do escopo da Wise", sai("Página do cliente publicada e indicações criadas", "EXT:Cliente industrial"), "Cliente industrial",
     [S("s1", "O cliente nunca faz o pedido sozinho. Quando precisa de um fornecedor fora do escopo da Wise, ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9")],
     participantes=[GP], funil="Pedidos da prateleira", dispensar=False)
proc("F3_apoio", "Pedir apoio do parceiro numa venda da Wise", "F3", 4, "Quando um prospect ou cliente da Wise usa a solução de um parceiro, pedir a ele informação sobre a conta, uma recomendação ao decisor ou uma apresentação, com a mensagem pronta.", CONS,
     "Oportunidade da Wise em conta que é cliente de um parceiro", sai("Apoio do parceiro registrado na oportunidade", "EXT:Parceiro"), "Consultor que vende",
     [B("nearbound", "Modelar a participação do parceiro na venda em três jogadas"), B("nearbound", "Nunca pedir introdução sem entregar ao parceiro o rascunho"),
      B("ecosystem-led-growth", "Criar um ponto único de pedido de apresentação")], status="hipotese", participantes=[GP])
Q("apoio", "Vale criar o processo em que consultores e comercial pedem pelo portal o apoio de um parceiro (informação sobre a conta, recomendação ao decisor ou apresentação), com a mensagem pronta e prazo?", "escolha",
  ["Sim, e registrar a participação do parceiro como 'influenciou', separada de 'indicou' (recomendado)", "Sim, mas sem registrar influência", "Não agora"], [P["F3_apoio"], "NOVO.atribuicao_influencia"], "Gerar negócios")
proc("F3_comissao", "Pagar comissão ao parceiro", "F3", 5, "Calcular a comissão quando o cliente indicado fecha, aguardar a compensação do primeiro pagamento, receber a nota fiscal e pagar.", FIN,
     "Primeiro pagamento do cliente indicado compensado", sai("Comissão paga", "EXT:Parceiro"), "Parceiro que indicou",
     [S("s1", "O sistema calcula a comissão devida ao parceiro e a do responsável pela parceria conforme a regra de cada empresa, avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6")], participantes=[GP])
proc("F3_checar", "Checar cliente indicado aos 6 e 12 meses", "F3", 6, "Registrar se o cliente indicado segue ativo e a satisfação dele, aos 6 e aos 12 meses do fechamento.", GP,
     "6 e 12 meses do fechamento", sai("Checagem registrada", "P-G_nivel"), "Parceiro que indicou",
     [S("s2", "Indicações fechadas geram checagens aos 6 e 12 meses para registrar se o cliente segue ativo e a satisfação dele.", "User Story 6")], participantes=[CONS], hipoteses=["dono"])
Q("checagem", "Quem faz a checagem do cliente indicado aos 6 e 12 meses?", "escolha",
  ["O consultor que atende o cliente, com tarefa gerada pelo portal (recomendado)", "O Gerente de Parcerias", "O comercial da empresa que atende"], [P["F3_checar"] + ".dono"], "Gerar negócios")

# ---------------- desenvolver
proc("F4", "Desenvolver o parceiro", None, 5, "Aumentar o valor da parceria depois da ativação: Base Ativa, ações conjuntas, régua de atendimento, revisão conjunta, maturidade e pacote.", GP,
     "Parceiro ativado", [], "Empresa parceira", [S("s2", "As contrapartidas da v1 passam a fazer parte de um plano de ações conjuntas por parceiro, com ações dos dois lados", "User Story 11")], tipo="finalistico", participantes=[RESP])
proc("F4_base", "Conduzir o ciclo do Base Ativa", "F4", 1, "Para parceiros do pacote A: fila por horas disponíveis, ciclo de 12 semanas com 6 encontros e evento final da comunidade.", GP,
     "Parceiro de pacote A com horas disponíveis", sai("Comunidade validada e certificado metodológico", "EXT:Parceiro"), "Empresa parceira",
     [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7")],
     participantes=[RESP], funil="Base Ativa", dispensar=False)
proc("F4_acao", "Executar ação conjunta do plano", "F4", 2, "Cada ação do plano (do parceiro ou da Wise) com data, responsável, comprovação, resultado e custo direto.", GP,
     "Data prevista da ação no plano", sai("Ação comprovada com resultado", "P-G_nivel"), "Empresa parceira",
     [S("s2", "Cada ação tem lado, tipo, data prevista, responsável, estado, comprovação, resultado (alcance, inscritos, indicações geradas) e custo direto, quando houver.", "User Story 11")], participantes=[RESP])
proc("F4_regua", "Conduzir a reunião de acompanhamento da régua", "F4", 3, "Fazer cada reunião de acompanhamento na cadência do pacote e da faixa, com alerta quando a régua atrasa.", GP,
     "Data da próxima reunião pela régua", sai("Acompanhamento registrado", "P-G_nivel"), "Empresa parceira",
     [S("s2", "Cada pacote e cada faixa têm uma régua de atendimento (Apêndice C) com a cadência mínima de acompanhamento e o tipo de suporte; o portal alerta quando a régua atrasa.", "User Story 12")], participantes=[RESP])
proc("F4_revisao", "Revisar a parceria com o parceiro", "F4", 4, "Revisão conjunta com pauta fixa: metas do período, indicações em andamento, previsão, problemas, planos e três perguntas de saúde da parceria.", GP,
     "Uma vez por trimestre (mensal para destaques)", sai("Plano do próximo período combinado", "P-F4_acao"), "Empresa parceira",
     [S("s2", "| Destaque | 5% do topo, no mínimo 1 | Reunião mensal com plano de negócios conjunto, revisão trimestral com o Diretor", "Apêndice C"),
      B("strategic-alliances", "Fazer uma reunião de revisão periódica por parceiro com pauta fixa"), B("strategic-alliances", "Aplicar por parceiro, a cada trimestre, três perguntas simples")],
     status="hipotese", participantes=[DIR, RESP], frequencia="Trimestral")
Q("revisao", "A revisão conjunta com pauta fixa e três perguntas de saúde (o parceiro nos recomendaria? a parceria melhorou a satisfação dos clientes? houve ganho real?) vale para quem?", "escolha",
  ["Todos os parceiros ativos, trimestral; mensal para os destaques (recomendado)", "Só os destaques, como na especificação", "Não agora"], [P["F4_revisao"]], "Desenvolver o parceiro")
Q("patrocinio", "O Igor será patrocinador executivo de 3 a 5 parceiros principais, presente na revisão trimestral deles?", "escolha",
  ["Sim", "Só dos parceiros Elite", "Não", "Não sei: perguntar ao Igor"], [P["F4_revisao"] + ".participantes"], "Desenvolver o parceiro")
proc("F4_maturidade", "Avaliar a maturidade do parceiro", "F4", 5, "Avaliar o parceiro nos 8 eixos de 1 a 5, a partir das notas sugeridas pelo portal, e montar o plano de evolução.", GP,
     "Quando o time decidir (sem rotina obrigatória)", sai("Categoria de maturidade e plano", "P-F4_acao"), "Empresa parceira",
     [S("s2", "O time de parcerias avalia cada parceiro nos 8 eixos da matriz de maturidade (Apêndice J), com nota de 1 a 5 por eixo.", "User Story 8")])
proc("F4_pacote", "Mudar o pacote do parceiro", "F4", 6, "Registrar a subida ou descida de pacote quando o parceiro passa a entregar a contrapartida do pacote de cima ou quando o nível desce.", GP,
     "Subida de nível ou pedido do parceiro", sai("Pacote novo com contrapartidas carregadas", "P-F4_acao"), "Empresa parceira",
     [S("s2", "Pacote após descida: o maior pacote permitido no nível novo, ao fim do ciclo do Base Ativa em curso ou 30 dias após a confirmação, o que vier depois.", "Apêndice B")])

# ---------------- reter ou encerrar
proc("F5", "Reter ou encerrar a parceria", None, 6, "Tratar parceiros em risco com tentativas de retomada e, sem resposta, desligar de forma formal e amigável.", GP,
     "Parceiro cumpre os critérios de risco", sai("Parceiro retomado ou parceria encerrada", "EXT:Parceiro"), "Empresa parceira",
     [S("s2", "Parceiros que cumprem os critérios de risco (Apêndice D) entram no fluxo de desligamento", "User Story 12")], tipo="finalistico", participantes=[DIR], funil="Parceiros em risco", dispensar=False)
proc("F5_retomar", "Retomar parceiro em risco", "F5", 1, "Duas tentativas de retomada com 15 dias de intervalo, focadas numa oportunidade concreta, antes de qualquer sugestão de desligamento.", GP,
     "Parceiro entra em risco", sai("Parceiro retomado ou sugestão de desligamento", "P-F5_desligar"), "Empresa parceira",
     [S("s2", "Primeira tentativa de retomada: próximo passo criado na hora, com mensagem sugerida que propõe uma reunião.", "Apêndice D"), B("strategic-alliances", "Tratar o parceiro passivo como recrutamento novo")])
proc("F5_desligar", "Desligar parceiro", "F5", 2, "Aprovação do Diretor, aviso formal de 30 dias e encerramento com acessos revogados, preservando comissões e indicações abertas.", GP,
     "Sugestão de desligamento ou pedido de saída", sai("Parceria encerrada", "EXT:Parceiro"), "Empresa parceira",
     [S("s2", "Aviso formal: texto gerado pelo portal, enviado pelo responsável, com encerramento em 30 dias (cláusula 13.4 do contrato).", "Apêndice D"), B("getting-to-yes", "Aceitar como resultado válido")], participantes=[DIR])

# ---------------- suporte
proc("S1", "Manter a prateleira de fornecedores", None, 7, "Manter categorias, fichas e no mínimo 3 parceiros por categoria, com critérios de entrada e permanência iguais para todos.", GP,
     "Parceiro assinado ou categoria sem 3 opções", sai("Prateleira com fichas verificadas", "P-F3_rfp"), "Consultores do grupo e clientes industriais",
     [S("s1", "Em cada categoria, vê quantos parceiros existem, em que etapa estão, quantos estão assinados e se a categoria tem as 3 opções que o programa exige.", "User Story 1"),
      B("platform-revolution", "Curar em duas pontas"), B("platform-revolution", "Limitar o número de fornecedores por categoria")], tipo="suporte", hipoteses=["regras"])
Q("prateleira", "Como a prateleira é curada?", "multipla",
  ["Limite de 3 a 5 fornecedores por categoria", "Permanência depende da nota de qualidade e do retorno dos clientes", "A Wise cadastra e verifica as primeiras fichas antes de abrir aos parceiros", "Sem limite por categoria"],
  [P["S1"] + ".regras"], "Suporte e dados")
proc("S2", "Manter conteúdos, trilhas e modelos", None, 8, "Manter trilhas, materiais, modelos de contrato e textos de e-mail atualizados no portal.", GP,
     "Material novo ou mudança de regra", sai("Conteúdo publicado", "EXT:Parceiro"), "Parceiros e time",
     [S("s2", "O portal do parceiro ganha a área de capacitação, com trilhas criadas pela Wise.", "User Story 10")], tipo="suporte")
proc("S3", "Administrar o portal e os dados", None, 9, "Manter usuários, acessos, configurações, importações e a política de dados do programa (o que se compartilha, com quem e para quê).", GP,
     "Pessoa nova, mudança de configuração ou pedido de dados", sai("Acessos e dados em ordem", "EXT:Time de parcerias"), "Time de parcerias e parceiros",
     [S("s1", "Antes do uso, o administrador importa os parceiros atuais (planilha), os documentos já produzidos", "User Story 10"),
      B("winning-the-right-game", "Publicar uma política de dados do programa"), B("ecosystem-led-growth", "Compartilhar apenas dados de empresa")], tipo="suporte", hipoteses=["regras"])
Q("dados", "Publicar uma política de dados do programa: a Wise não usa a carteira do parceiro para outros fins nem aborda os clientes dele por fora; só se compartilham dados de empresa, nunca de pessoas, e o cruzamento só com consentimento.", "escolha",
  ["Sim, como está", "Sim, com ajustes (comente)", "Não agora"], [P["S3"] + ".regras"], "Suporte e dados")

# ================================================================ dispensa de passo a passo (decisão do patrocinador)
for p in d["processos"]:
    filhos = [x for x in d["processos"] if x.get("pai") == p["id"]]
    if not filhos and not p.get("fluxo") and p["nome"] not in ("Negociar e formalizar o termo", "Revisar o nível dos parceiros", "Tratar indicação do parceiro",
                                                                "Atender pedido de fornecedor pela prateleira", "Conduzir o ciclo do Base Ativa"):
        p["fluxo_dispensado"] = f"{DE_FLUXO}: não vira funil; fica no nível de dono, gatilho e entregas"

exec(open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/tobe_fluxos.py").read())
