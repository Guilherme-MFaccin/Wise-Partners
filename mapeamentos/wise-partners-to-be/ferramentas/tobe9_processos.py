# Hierarquia to-be v7 (executado dentro de tobe9_base.py). Cada processo traz o que o portal faz nele.
P = {}
def proc(k, nome, pai, ordem, descricao, portal, dono, gatilho, entrega, cliente, evs, status="declarado", tipo=None, part=(), sist=(), freq="",
         regras=(), quadro=None, hipoteses=(), principios=()):
    desc = descricao + (f" No portal: {portal}" if portal else "")
    obj = {"nome": nome, "pai": P.get(pai), "ordem": ordem, "descricao": desc, "dono": dono, "participantes": list(part),
           "gatilho": gatilho, "entradas": [], "saidas": [{"nome": entrega[0], "para": entrega[1]}] if entrega else [], "cliente": cliente,
           "sistemas": list(sist) or [SI_POR], "indicadores": [], "frequencia": freq, "dores": [], "regras": list(regras), "status": status,
           "hipoteses": list(hipoteses), "evidencias": evs, "situacao": "no_papel", "fluxo_dispensado": None,
           "principios": [PR[p] for p in principios], "portal": portal}
    if tipo: obj["tipo"] = tipo
    if quadro: obj["quadro"] = quadro
    P[k] = add("processos", "P", **obj)
    return P[k]

J, OPS, FILA, AGENDA = "Quadro da jornada do parceiro", "Quadro de oportunidades do ecossistema", "Fila única de tarefas (por exceção)", "Agenda de rituais"

# ======================= M1 ARQUITETAR O ECOSSISTEMA (gestão)
proc("M1", "Arquitetar o ecossistema", None, 1, "Decidir uma vez por ano, ou quando a fase muda, o papel da Wise, o valor entregue, o parceiro ideal, as regras e o modelo econômico do canal.",
     "guarda o desenho vigente (perfil, regras, termo-quadro, fase) e o publica na área do parceiro.", GP, "Planejamento anual ou mudança de fase", ("Desenho do programa publicado", "EXT:Parceiros e time"), "Diretor e parceiros",
     [F(PP, 0, 0), F(PP, 0, 2), D2("Q-0001")], status="confirmado", tipo="gestao", part=[DIR], freq="Anual e a cada mudança de fase", quadro=AGENDA, principios=["cac", "pouco", "simples"])
proc("1.1", "Mapear a rede de valor e o papel da Wise", "M1", 1, "Desenhar clientes, fornecedores, concorrentes e complementadores do grupo e decidir, por categoria, onde a Wise lidera e onde segue.",
     "registra o papel por categoria e os papéis de cada parceiro por escopo.", GP, "Planejamento anual", ("Papel por categoria", "P-1.3"), "Diretor", [D2("Q-0003"), F(EJ, 0, 0), F(EJ, 7, 3)], status="confirmado", principios=["pouco"])
proc("1.2", "Desenhar a arquitetura de valor para a indústria", "M1", 2, "Revisar os cinco elementos de valor e a cobertura de cada um por pilar e por parceiro.",
     "mostra a matriz de parceiros por elemento e onde a cobertura está fraca.", GP, "Planejamento anual", ("Matriz de cobertura dos elementos", "P-1.3"), "Diretor", [D2("Q-0004"), F(EJ, 5, 0)], status="confirmado")
proc("1.3", "Definir o perfil de parceiro ideal", "M1", 3, "Escrever o perfil comercial e o institucional a partir do ICP, com critérios do scorecard e a regra de só aceitar quem a Wise indicaria ao seu melhor cliente.",
     "guarda o perfil e o scorecard usados na qualificação.", GP, "Planejamento anual", ("Perfil e scorecard", "P-4.2"), "Time de parcerias",
     [S("s2", "Antes da proposta, o time de parcerias preenche o scorecard do parceiro: sete critérios (Apêndice A), cada um com nota 0, 0,5 ou 1 por uma régua descrita na tela.", "User Story 3"), VP(RE, 1), F(PP, 2, 1)], principios=["pouco"])
proc("1.4", "Definir as regras do programa", "M1", 4, "Níveis, pacotes, contrapartidas, regra única de comissão, contrapartida da Prateleira, regulamento curto e política de dados, todos poucos e estáveis.",
     "gera a página de regras do parceiro a partir da configuração e versiona cada mudança com vigência de 30 dias.", GP, "Planejamento anual ou mudança de regra", ("Regras publicadas", "P-2.5"), "Parceiros",
     [D2("Q-0005"), D2("Q-0015"), D("Q-0020"), VP(BB, 11), VP(KS, 5)], status="confirmado", part=[DIR], principios=["simples", "governanca"])
proc("1.5", "Definir o modelo econômico do canal", "M1", 5, "Fixar como se calcula o CAC do Wise Partners: comissões, horas e custos diretos divididos pelos clientes fechados vindos de parceiros. Ninguém informa o CAC de outros canais.",
     "calcula o CAC do Wise Partners a cada mês a partir de comissões, horas e custos diretos.", GP, "Planejamento anual", ("Fórmula do CAC do Wise Partners", "P-3.1"), "Diretor",
     [D3("Q-0005"), D2("Q-0015"), F(PP, 4, 2)], status="confirmado", part=[DIR], principios=["cac"])
proc("1.6", "Definir a fase e as metas do programa", "M1", 6, "Registrar a fase e os portões da próxima; o Diretor define as metas, que entram quando fizer sentido.",
     "mostra a distância de cada portão e registra as metas do programa e por pessoa.", DIR, "Início de cada trimestre", ("Fase, portões e metas", "P-3.5"), "Time de parcerias",
     [D("Q-0021"), D2("Q-0013"), S("s2", "A fase do programa fica registrada e o portal mostra quando os critérios da próxima fase foram atingidos.", "User Story 7")], status="confirmado", part=[GP], freq="Trimestral", principios=["fases"])

# ======================= M2 GERIR O PROGRAMA POR RITUAIS (gestão)
proc("M2", "Gerir o programa por rituais", None, 2, "Uma agenda de rituais e uma fila de exceções no lugar de muitos quadros.",
     "monta a pauta de cada ritual com os dados do período e cria as tarefas que saem dele.", GP, "Calendário do programa", ("Decisões e tarefas do período", "EXT:Diretor"), "Diretor",
     [D2("Q-0008"), F(CV, 5, 1), VP(BB, 7)], status="confirmado", tipo="gestao", part=[DIR], quadro=AGENDA, principios=["ritmos", "excecao"])
proc("2.1", "Tratar a fila diária de exceções", "M2", 1, "Abrir a fila única ordenada por prazo e tratar só o que fugiu da regra; quando outra pessoa executa, o Gerente combina por WhatsApp ou pessoalmente.",
     "gera a fila a partir das regras (marco atrasado, régua atrasada, mudança de tipo no cubo, oportunidade parada, retorno pendente ao parceiro) e prepara a mensagem.", GP,
     "Início de cada dia de trabalho no programa", ("Exceções tratadas", "P-2.2"), "Gerente de Parcerias", [D2("Q-0006"), VP(CS, 2), F(CV, 2, 4)], status="confirmado", freq="Diária", quadro=FILA, principios=["excecao"])
proc("2.2", "Revisar o programa com o Igor", "M2", 2, "Toda semana, o Gerente e o Igor passam pelo painel da semana (poucos números estratégicos) e pela lista de casos, parceiro a parceiro, e decidem o próximo passo de cada caso.",
     "monta o painel da semana e a lista de casos (parceiros que mudaram de tipo, oportunidades paradas, decisões pendentes), cada caso com o histórico e a jogada sugerida; registra a decisão de cada caso.", GP, "Uma vez por semana", ("Decisões da semana por caso", "P-2.1"), "Diretor",
     [D3("Q-0008"), VP(CS, 8), F(PP, 4, 5), F(PP, 4, 4)], status="confirmado", part=[DIR], freq="Semanal", quadro=AGENDA, hipoteses=["indicadores"], principios=["ritmos", "governanca", "cac"])
proc("2.3", "Conduzir a mesa mensal do portfólio", "M2", 3, "Ver o portfólio inteiro pelo cubo (tipo de cada parceiro e quem mudou de tipo) e decidir onde pôr as horas do mês.",
     "mostra o cubo, as mudanças de tipo e a jogada sugerida para cada parceiro.", GP, "Primeira semana do mês", ("Plano de atenção do mês", "P-2.1"), "Gerente de Parcerias",
     [D2("Q-0007"), FTC(6), VF(CS, 0, 0)], status="confirmado", freq="Mensal", quadro=AGENDA, principios=["atencao", "medir"])
proc("2.4", "Conduzir o fechamento trimestral", "M2", 4, "Revisar níveis, pulso da relação, saúde do ecossistema e portões, e agendar as revisões conjuntas do trimestre.",
     "roda as apurações, mostra o resultado e agenda as revisões.", GP, "Primeiro dia útil de janeiro, abril, julho e outubro", ("Trimestre fechado", "P-3.5"), "Diretor e parceiros",
     [S("s2", "Revisão: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre.", "Apêndice B")], part=[DIR], freq="Trimestral", quadro=AGENDA, principios=["ritmos", "medir"])
proc("2.5", "Publicar regras e comunicados", "M2", 5, "Publicar mudanças de regra com vigência mínima de 30 dias e comunicados, com aprovação do Diretor.",
     "versiona a regra e registra a publicação; o comunicado vai pela comunidade.", GP, "Mudança de regra, evento ou material novo", ("Comunicado publicado", "P-M8"), "Parceiros",
     [D("Q-0022"), S("s2", "Mudança de regra que afeta parceiros tem data de vigência de no mínimo 30 dias e gera um comunicado.", "User Story 13")], status="confirmado", part=[DIR])

# ======================= M3 MEDIR E APRENDER (gestão)
proc("M3", "Medir e aprender", None, 3, "Medir o programa e cada parceiro por fatores objetivos e transformar a medida em decisão: CAC, cubo, nível, saúde do ecossistema e portões.",
     "calcula tudo o que dá para calcular com os dados que já tem e pede ao Gerente só o que não dá.", GP, "Fechamento do mês e do trimestre", ("Medidas e decisões", "P-M2"), "Diretor e Gerente de Parcerias",
     [VP(KS, 0), VP(CS, 1), D2("Q-0009")], status="hipotese", tipo="gestao", part=[DIR], principios=["medir", "cac"])
proc("3.1", "Apurar o CAC e o valor devolvido", "M3", 1, "As duas medidas-mãe, com o mesmo peso. CAC: comissões, horas e custos diretos divididos pelos clientes fechados vindos de parceiros, com receita e LTV atribuídos ao Wise Partners. Valor devolvido: desfechos devolvidos, oportunidades enviadas de volta aos parceiros, apresentações feitas e acessos dados.",
     "calcula as duas a cada mês e a tendência do trimestre, sem nenhum número informado de fora do programa.", GP, "Fechamento do mês", ("CAC e valor devolvido", "P-2.2"), "Diretor",
     [S("s2", "clientes fechados no ICP via parceiros, receita atribuída ao canal, custo total do canal separado em comissões, horas da equipe e custos diretos, ROI", "User Story 1"), D2("Q-0015"), D3("Q-0005"), D4("Q-0014")], freq="Mensal", principios=["cac", "valor_antes"])
proc("3.2", "Classificar os parceiros no cubo", "M3", 2, "Ler cada parceiro em Valor (receita e pipeline ponderado em 12 meses), Ritmo (recência e frequência de ações de valor) e Relação (pulso trimestral, retorno mútuo e equilíbrio entre dar e receber); o tipo sai da tabela de oito células.",
     "calcula Valor e Ritmo todo dia, Relação a cada trimestre, e avisa quando um parceiro muda de tipo.", GP, "Diariamente pelo portal; revisão na mesa mensal", ("Tipo e jogada de cada parceiro", "P-7.1"), "Gerente de Parcerias",
     [FTC(6), FTC(7), VF(CS, 1, 1), VF(GT, 0, 0), D2("Q-0009"), D2("Q-0016")], status="hipotese", freq="Contínua", principios=["medir", "reciprocidade"])
proc("3.3", "Ouvir o pulso da relação", "M3", 3, "Três perguntas de 1 a 5, respondidas pelo parceiro e pelo Gerente sobre o outro lado (daria referência positiva, a parceria cumpre o combinado, há equilíbrio no que cada lado dá), mais a nota de satisfação.",
     "envia a pesquisa, junta as respostas e alimenta o fator Relação.", GP, "Fechamento trimestral", ("Pulso de cada parceria", "P-3.2"), "Parceiros",
     [FTC(16), S("s2", "Uma pesquisa trimestral de satisfação dos parceiros (nota de 0 a 10 e comentário) é enviada a cada pessoa do parceiro pelo portal e por e-mail.", "User Story 7")], status="hipotese", freq="Trimestral", principios=["medir"])
proc("3.4", "Revisar o nível dos parceiros", "M3", 4, "Apurar requisitos, colocar em observação ou propor descida; a subida acontece na hora.",
     "apura os requisitos, avisa o parceiro do que falta e registra a decisão do Gerente com motivo.", GP, "Primeiro dia útil do trimestre", ("Nível revisto", "EXT:Parceiro"), "Parceiro",
     [A("EV-0109"), S("s2", "Na revisão seguinte, se ainda não cumprir, o portal propõe descer um nível; a decisão é de uma pessoa, com motivo.", "Apêndice B")], status="confirmado", freq="Trimestral")
proc("3.5", "Medir a saúde do ecossistema e os portões", "M3", 5, "Três medidas do programa (produtividade, robustez, criação de nicho) e a distância de cada portão de fase.",
     "calcula as três medidas e mostra cada portão em verde ou vermelho.", GP, "Fechamento trimestral", ("Saúde do programa e portões", "P-1.6"), "Diretor",
     [VF(KS, 0, 0), VF(KS, 0, 2), D2("Q-0013")], status="hipotese", freq="Trimestral", principios=["medir", "fases"])

# ======================= M4 ATRAIR E SELECIONAR PARCEIROS
proc("M4", "Atrair e selecionar parceiros", None, 4, "Do candidato na lista ao termo assinado.",
     "mantém a lista, transforma o candidato em card na primeira reunião e guarda a ficha, o scorecard e o texto único.", GP, "Candidato identificado", ("Termo assinado", "P-M5"), "Empresa parceira",
     [F(PP, 1, 0), D2("Q-0010")], status="confirmado", tipo="finalistico", part=[DIR], quadro=J, principios=["simples", "governanca"])
proc("4.1", "Manter a lista de candidatos", "M4", 1, "Lista de candidatos vindos de forma orgânica, de clientes do grupo, de fornecedores que já estão nas indústrias atendidas, de categorias pedidas sem fornecedor e de eventos; reativar laços dormentes antes de buscar contatos novos.",
     "é uma tabela, não um quadro; o candidato só vira card depois da primeira reunião.", GP, "Candidato identificado", ("Candidato com reunião agendada", "P-4.2"), "Gerente de Parcerias",
     [D2("Q-0010"), D("Q-0008"), VP(GT, 3)], status="confirmado")
proc("4.2", "Qualificar candidato", "M4", 2, "Scorecard, ficha de jogo (papéis na rede de valor e quem ganha com a entrada dele), estimativa de sobreposição de carteiras e leitura do comportamento: quem só toma se reconhece pelo que faz, não pela simpatia.",
     "calcula o scorecard e o nível de entrada e guarda a ficha de jogo e a sobreposição estimada.", GP, "Primeira reunião realizada", ("Candidato qualificado ou não elegível", "P-4.3"), "Gerente de Parcerias",
     [D2("Q-0010"), S("s2", "Nota de potencial = soma ponderada ÷ 10, em porcentagem.", "Apêndice A"), VP(GT, 6), VP(RE, 1)], status="confirmado", hipoteses=["descricao"], principios=["reciprocidade"])
proc("4.3", "Conduzir o workshop de alinhamento", "M4", 3, "Conversa mais longa com a diretoria do candidato: o que cada lado faz, o que é sucesso para ele na unidade de medida dele e o caso de negócio (quantos negócios saem da carteira, quanto ganha, que demanda recebe de volta).",
     "monta o caso de negócio com a sobreposição estimada e a regra de comissão.", GP, "Candidato qualificado quer seguir", ("Plano conjunto e caso de negócio", "P-4.4"), "Candidato",
     [D2("Q-0010"), D("Q-0009"), VP(CS, 0), F(PP, 6, 4)], status="confirmado", principios=["valor_antes"])
proc("4.4", "Negociar e formalizar o termo", "M4", 4, "Texto único: o Gerente propõe a minuta como rascunho, recebe críticas e ajusta até as duas partes aprovarem; o Diretor assina; assinatura digital.",
     "gera a minuta a partir do termo-quadro, guarda as versões e anexa o termo assinado.", GP, "Plano conjunto acordado", ("Termo assinado", "P-M5"), "Empresa parceira",
     [D2("Q-0011"), A("EV-0107"), F(AN, 7, 0)], status="confirmado", part=[DIR], sist=[SI_POR, SI_AUT, SI_WPP], principios=["governanca"])
proc("4.5", "Nutrir candidato", "M4", 5, "Pausa com data de retomada e cadência, com gestos de valor sem pedido.",
     "lembra a data de retomada e sugere um gesto (conteúdo, convite, oportunidade).", GP, "Candidato pede para retomar depois", ("Candidato retomado", "P-4.3"), "Candidato",
     [S("s2", "o estado \"nutrição\" para quem ainda não é a hora, com data de retomada e cadência de contato", "User Story 9"), A("EV-0108"), VP(GT, 1)], principios=["valor_antes"])

# ======================= M5 INTEGRAR E ATIVAR PARCEIRO
proc("M5", "Integrar e ativar parceiro", None, 5, "Do termo assinado à ativação em até 90 dias (extensão até 120), entregando o primeiro valor em fatias.",
     "cria o plano de 90 dias com marcos dentro do card do parceiro e marca a ativação sozinho quando a primeira indicação no ICP vira reunião.", GP, "Termo assinado", ("Parceiro ativado", "P-M7"), "Empresa parceira",
     [A("EV-0110"), VP(CS, 4), F(PP, 1, 3)], status="confirmado", tipo="finalistico", part=[RESP_P], quadro=J, principios=["primeiro_valor"])
proc("5.1", "Preparar a entrada do parceiro", "M5", 1, "Primeira entrega em até 2 dias úteis, conforme o pacote: no C, grupo na comunidade, ficha na Prateleira com a apresentação de vendas do parceiro e link exclusivo; no B, também certificado, selo, Hub e convites à mentoria e às formações; no A, também a entrada na fila da Base Ativa.",
     "publica a ficha, guarda a apresentação no perfil e gera o link e os acessos.", GP, "Termo assinado", ("Parceiro com acesso e ficha publicada", "P-5.2"), "Empresa parceira",
     [D("Q-0012"), S("s2", "| Até 2 dias úteis | Tarefas do pacote (v1) | Prateleira, grupo, dados, Hub, certificado e selo conforme o pacote |", "Apêndice F"), D4("Q-0017"), A("EV-0038")], status="confirmado", sist=[SI_POR, SI_WPP])
proc("5.2", "Conduzir o encontro de alinhamento", "M5", 2, "Registrar o que é sucesso para o parceiro, cruzar carteiras revelando só as coincidências e escolher a primeira oportunidade concreta.",
     "processa o cruzamento e sugere as primeiras jogadas.", GP, "Até 7 dias da assinatura", ("Primeira oportunidade escolhida", "P-6.1"), "Empresa parceira",
     [D2("Q-0010"), D("Q-0011"), VP(CS, 0), F(CV, 0, 5)], status="confirmado", part=[RESP_P], principios=["primeiro_valor", "valor_antes"])
proc("5.3", "Ensinar o parceiro a indicar", "M5", 3, "Mostrar o perfil do cliente ideal, as frases que reconhecem a dor na conversa com o cliente dele e o gesto de indicar sem atrito; encontros de vendas, produto e pós-venda.",
     "libera a trilha, o kit de cada empresa e o simulador de ganho; registra cada encontro como marco.", GP, "Encontro de alinhamento feito", ("Pessoas preparadas para indicar", "P-5.4"), "Pessoas do parceiro",
     [VP(RE, 2), VP(RE, 5), D("Q-0012")], status="hipotese", part=[RESP_P], principios=["ensinar"])
proc("5.4", "Declarar a ativação ou estender o plano", "M5", 4, "Ativado na primeira indicação no ICP que virou reunião; sem ativação em 90 dias, extensão até 120; depois, não ativado.",
     "marca a ativação sozinho e avisa os marcos de 90 e 120 dias.", GP, "Primeira reunião gerada ou marco de 90 dias", ("Parceiro ativado ou não ativado", "P-M7"), "Empresa parceira",
     [S("s2", "Sem ativação em 90 dias, o responsável recebe alerta e o plano ganha uma extensão até 120 dias; sem ativação em 120 dias, o parceiro fica marcado como \"não ativado\".", "User Story 5")])

# ======================= M6 GERAR OPORTUNIDADES NO ECOSSISTEMA
proc("M6", "Gerar oportunidades no ecossistema", None, 6, "A interação central: cada oportunidade compartilhada percorre uma esteira única até o cliente fechado, a comissão paga e a checagem do cliente.",
     "um card por oportunidade, com a porta como etiqueta; registra cada etapa e prepara a mensagem de retorno ao parceiro.", GP, "Uma das cinco portas gera uma oportunidade",
     ("Cliente fechado e comissão paga", "EXT:Parceiro"), "Parceiro e empresas do grupo", [D2("Q-0002"), F(EP, 0, 0), F(CV, 7, 1)], status="confirmado", tipo="finalistico", part=[CONS, FIN], quadro=OPS, principios=["interacao"])
proc("6.1", "Receber e qualificar a oportunidade", "M6", 1, "Registrar com a porta de origem, agradecer e confirmar ao parceiro, validar duplicidade, ICP e proteção.",
     "registra pelo link, pelo cruzamento ou à mão, envia a confirmação e calcula a nota de qualidade.", GP, "Oportunidade chega por uma das portas", ("Oportunidade qualificada ou recusada", "P-6.2"), "Parceiro",
     [S("s2", "Toda indicação ganha uma nota de qualidade (Apêndice E) e passa por validação da Wise, que confirma a aderência ao ICP.", "User Story 6"), VP(RE, 6)], principios=["ciclo"])
proc("6.2", "Entregar o lead ao closer", "M6", 2, "O Gerente leva o lead ao closer da empresa do grupo que vai atender e combina com ele, pessoalmente, como e quando atender; o lead indicado é tratado como especial, sem ligação fria. Gerente e closer conversam quando há indicação ou proposta nova, sem reunião fixa e sem SLA.",
     "registra para quem foi o lead e quando.", GP, "Oportunidade qualificada", ("Lead com o closer", "P-6.3"), "Closer", [D2("Q-0014"), D3("Q-0008"), VP(RE, 7)], status="confirmado", part=[CONS], principios=["simples"])
proc("6.3", "Fechar o ciclo com o parceiro", "M6", 3, "O closer avisa o Gerente por WhatsApp a cada mudança de etapa; o Gerente registra a etapa e devolve ao parceiro (primeiro contato, proposta, fechamento ou perda) e, no fim, o impacto gerado.",
     "registra a etapa informada pelo Gerente, prepara a mensagem para ele personalizar e mandar no grupo do parceiro, e mostra no painel da semana as oportunidades paradas há mais de 15 dias.", GP, "Aviso do closer sobre mudança de etapa", ("Parceiro informado", "EXT:Parceiro"), "Parceiro",
     [VP(RE, 6), VP(GT, 5), VP(BB, 4), D4("Q-0016"), VP(NE, 9, 0)], status="hipotese", part=[CONS], sist=[SI_POR, SI_WPP], principios=["ciclo", "pessoa_a_pessoa"])
proc("6.4", "Atender necessidade do cliente pela Prateleira", "M6", 4, "O consultor relata a necessidade, o Gerente registra o pedido e publica a página do cliente; o fornecedor que entra no pedido dá uma contrapartida não financeira.",
     "recomenda parceiros por categoria, monta a página e registra a contrapartida combinada.", GP, "Cliente do grupo precisa de fornecedor fora do escopo da Wise", ("Cliente em contato com o parceiro", "EXT:Cliente industrial"), "Cliente industrial",
     [S("s1", "O cliente nunca faz o pedido sozinho. Quando precisa de um fornecedor fora do escopo da Wise, ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9"), D2("Q-0015")], status="confirmado", part=[CONS], principios=["valor_antes"])
proc("6.5", "Indicar cliente do grupo ao parceiro", "M6", 5, "Demanda de volta: o parceiro que recebe boas oportunidades indica melhor.",
     "registra a indicação de volta e conta no equilíbrio de dar e receber.", GP, "Cliente do grupo precisa de uma solução do parceiro", ("Resultado registrado", "EXT:Parceiro"), "Parceiro",
     [S("s1", "Quando a indicação vai da Wise para o parceiro, qualquer um dos dois pode atualizar o resultado, mas a responsabilidade de manter o registro é da Wise.", "User Story 6"), VP(RE, 11)], principios=["reciprocidade", "valor_antes"])
proc("6.6", "Gerar jogadas a partir do cruzamento de carteiras", "M6", 6, "Cada coincidência do cruzamento vira uma jogada: apresentar o parceiro a cliente do grupo, pedir indicação de cliente do parceiro, combinar ação numa conta comum.",
     "sugere as jogadas por célula da matriz de contas.", GP, "Coincidências do cruzamento", ("Oportunidades criadas", "P-6.1"), "Parceiro e grupo", [D2("Q-0002"), F(CV, 0, 0), F(CV, 0, 1)], status="confirmado")
proc("6.7", "Pagar a comissão", "M6", 7, "Regra única: calcular quando o cliente fecha, aguardar a compensação do primeiro pagamento, receber a nota e pagar.", "calcula e avisa o financeiro.", FIN,
     "Primeiro pagamento compensado", ("Comissão paga", "EXT:Parceiro"), "Parceiro", [D2("Q-0005"), S("s1", "O sistema calcula a comissão devida ao parceiro e a do responsável pela parceria conforme a regra de cada empresa, avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6")], status="confirmado", part=[GP])
proc("6.8", "Checar o cliente aos 6 e 12 meses", "M6", 8, "Tarefa do Gerente, executada pelo consultor que atende o cliente.", "cria a tarefa e registra o retorno.", GP, "6 e 12 meses do fechamento", ("Checagem registrada", "P-3.2"), "Parceiro",
     [D("Q-0013")], status="confirmado", part=[CONS])

# ======================= M7 DESENVOLVER O PARCEIRO
proc("M7", "Desenvolver o parceiro", None, 7, "Depois da ativação: cada parceiro recebe a jogada do seu tipo no cubo, com intensidade proporcional ao valor e ao potencial.",
     "sugere a jogada do tipo, agenda as revisões e acompanha o plano de ações.", GP, "Parceiro ativado", ("Parceiro em crescimento", "P-2.3"), "Empresa parceira",
     [D2("Q-0016"), FTC(6)], status="confirmado", tipo="finalistico", part=[RESP_P], quadro=J, principios=["atencao", "medir"])
proc("7.1", "Aplicar a jogada do tipo", "M7", 1, "Para cada um dos oito tipos (Embaixador, Gerador sob tensão, Âncora esfriando, Valioso em risco, Promissor, Ativo sem tração, Cordial seletivo, Desertor), uma ação, uma abordagem e uma cadência; o Potencial decide se o esforço vale.",
     "mostra a jogada e cria as tarefas da cadência do tipo.", GP, "Mudança de tipo ou mesa mensal", ("Jogada em curso", "P-2.1"), "Empresa parceira",
     [D2("Q-0016"), FTC(3), FTC(2)], status="hipotese", principios=["atencao"])
proc("7.2", "Revisar a parceria com o parceiro", "M7", 2, "Revisão conjunta com pauta montada pelo portal; trimestral para todos os ativos e mensal para os destaques; o Diretor participa nas dos parceiros Elite. As ações nascem da ata.",
     "monta a pauta com os dados do parceiro e transforma a ata em ações.", GP, "Data da revisão pela cadência", ("Plano do próximo período", "P-7.3"), "Empresa parceira",
     [D("Q-0017"), D("Q-0018"), F(AN, 0, 3)], status="confirmado", part=[DIR, RESP_P], quadro=AGENDA, principios=["ritmos"])
proc("7.3", "Planejar e executar ações conjuntas", "M7", 3, "Plano de ações dos dois lados, com data, responsável, comprovação e resultado.",
     "mostra o plano em calendário e conta cada ação como ação de valor no Ritmo.", GP, "Revisão conjunta ou data da ação", ("Ação comprovada", "P-3.2"), "Empresa parceira",
     [S("s2", "Cada ação tem lado, tipo, data prevista, responsável, estado, comprovação, resultado (alcance, inscritos, indicações geradas) e custo direto, quando houver.", "User Story 11")], part=[RESP_P], quadro=AGENDA)
proc("7.4", "Conduzir o ciclo do Base Ativa", "M7", 4, "Fila por horas disponíveis, 12 semanas com 6 encontros e evento da comunidade do parceiro.",
     "controla a fila, a agenda dos encontros e o evento.", GP, "Parceiro de pacote A com horas disponíveis", ("Comunidade do parceiro validada", "EXT:Parceiro"), "Empresa parceira",
     [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7"), D2("Q-0013")], status="confirmado", part=[RESP_P], quadro=AGENDA)
proc("7.5", "Evoluir o nível e o pacote", "M7", 5, "Subida na hora em que os requisitos do nível acima são cumpridos; o pacote acompanha.", "detecta e avisa os dois lados.", GP, "Requisitos cumpridos",
     ("Nível e pacote novos", "P-7.3"), "Parceiro", [S("s2", "Quando o parceiro cumpre todos os requisitos de um nível acima, sobe na hora, com aviso a ele e ao responsável.", "User Story 4")])
proc("7.6", "Manter a cadência de contato com o parceiro", "M7", 6, "Contato curto e frequente, com ritmo pela importância: mensal para quem tem atenção alta, trimestral para os demais ativos, duas a três vezes por ano para candidatos em nutrição e ex-parceiros. Cada contato leva algo de valor (oportunidade, conteúdo ou apresentação); depois de cada encontro, retorno em até 24 horas.",
     "lembra quem passou da cadência sem contato e sugere o que levar; a lembrança entra na fila como exceção.", GP, "Cadência vencida ou encontro realizado", ("Contato feito com algo de valor", "EXT:Parceiro"), "Empresa parceira",
     [VP(NE, 3), VF(NE, 2, 1), VF(NE, 2, 3), VF(NE, 2, 4), VF(NE, 2, 5), VP(CS, 6)], status="hipotese", sist=[SI_WPP, SI_POR], principios=["antes_de_precisar", "atencao"])

# ======================= M8 CULTIVAR A COMUNIDADE WISE PARTNERS
proc("M8", "Cultivar a comunidade Wise Partners", None, 8, "A comunidade no WhatsApp como lugar de pertencer: utilidade primeiro, ritual fixo, reconhecimento por status, rede e acesso, e reciprocidade visível entre parceiros.",
     "registra quem participa, conta contribuições e oportunidades nascidas na comunidade, e prepara o comunicado do mês.", GP, "Calendário da comunidade",
     ("Comunidade ativa", "EXT:Parceiros"), "Parceiros", [D2("Q-0012"), VF(BB, 0, 0), VP(BB, 6)], status="hipotese", tipo="finalistico", sist=[SI_WPP, SI_POR], quadro=AGENDA, principios=["comunidade", "norma_social", "reciprocidade"])
proc("8.1", "Definir o objetivo da comunidade por fase", "M8", 1, "Escolher um ou dois resultados por fase (nesta fase, trazer parceiros e trazer oportunidades) e medir só esses.",
     "mede os dois resultados escolhidos.", GP, "Mudança de fase", ("Objetivo da comunidade", "P-8.2"), "Gerente de Parcerias", [VP(BB, 0), VF(BB, 0, 4)], status="hipotese", principios=["comunidade"])
proc("8.2", "Conduzir os rituais da comunidade", "M8", 2, "Comunicado do mês, encontro trimestral de parceiros e mentoria mensal aberta à carteira, sempre no mesmo formato.",
     "agenda e lembra; registra presença.", GP, "Calendário mensal e trimestral", ("Ritual realizado", "EXT:Parceiros"), "Parceiros",
     [VP(BB, 7), S("s1", "calendário da mentoria mensal e dos eventos", "User Story 8")], status="hipotese", sist=[SI_WPP, SI_POR], freq="Mensal e trimestral", principios=["comunidade", "ritmos"])
proc("8.3", "Tornar visível o dar entre parceiros", "M8", 3, "Pedidos e contribuições abertos na comunidade (quem precisa de quê, quem ajudou quem), favores de cinco minutos e o agradecimento público a quem deu.",
     "registra pedidos e contribuições e alimenta o equilíbrio de dar e receber.", GP, "Pedido ou contribuição de um parceiro", ("Dar registrado e reconhecido", "P-3.2"), "Parceiros",
     [VF(GT, 3, 0), VP(GT, 2), VP(GT, 1)], status="hipotese", sist=[SI_WPP, SI_POR], principios=["reciprocidade"])
proc("8.4", "Reconhecer por status, rede e acesso", "M8", 4, "Reconhecimento que não é dinheiro: destaque público, acesso antecipado a pedidos da Prateleira, convite a palco e apresentação a pessoas.",
     "sugere quem reconhecer a partir do cubo e do ranking.", GP, "Fechamento do mês ou do trimestre", ("Reconhecimento feito", "EXT:Parceiros"), "Parceiros",
     [VP(BB, 10), VP(RE, 4), F(EJ, 2, 4)], status="hipotese", sist=[SI_WPP], principios=["norma_social"])
proc("8.5", "Apresentar parceiros entre si", "M8", 5, "Quando um parceiro menciona um problema, a Wise pensa em quem resolve e apresenta, sem esperar pedido; a troca acontece em torno de uma oportunidade específica, nunca com a lista inteira de contatos; quem apresentou recebe o retorno de como foi.",
     "sugere apresentações a partir do cruzamento de carteiras e das categorias de cada parceiro, e registra cada apresentação feita.", GP, "Problema ou oportunidade que outro parceiro resolve", ("Parceiros apresentados", "EXT:Parceiros"), "Parceiros",
     [VP(NE, 4), VP(NE, 4, 1), VF(NE, 3, 5), VP(NE, 9, 2), VP(NE, 9, 3)], status="hipotese", sist=[SI_WPP, SI_POR], principios=["ponte", "reciprocidade"])
proc("8.6", "Receber parceiros em encontros pequenos", "M8", 6, "Encontros presenciais de seis a dez pessoas, com um convidado âncora que atrai os demais, misturando parceiros, clientes do grupo e gente que o parceiro quer conhecer, sem pauta de venda; também dentro de feiras e eventos do setor, organizados pela Wise. As entidades da Parceria Institucional atuam como conectoras e convidam.",
     "sugere a lista de convidados pelo cubo e pelas categorias e registra presença.", GP, "Calendário trimestral ou evento do setor", ("Encontro realizado", "EXT:Parceiros"), "Parceiros",
     [VP(NE, 5), VP(NE, 5, 3), VF(NE, 5, 1), VF(NE, 5, 3), VF(NE, 5, 4), VF(NE, 5, 5)], status="hipotese", freq="Trimestral", principios=["ponte", "comunidade"])

# ======================= M9 RETER OU ENCERRAR A PARCERIA
proc("M9", "Reter ou encerrar a parceria", None, 9, "Parceiro em risco recebe a abordagem do seu tipo; sem resposta, desligamento formal e amigável, com o cliente passando sem atrito.",
     "detecta o risco pela mudança de tipo e pelos critérios da especificação, e gera o aviso formal.", GP, "Parceiro entra em tipo de risco ou cumpre os critérios de risco",
     ("Parceiro retomado ou parceria encerrada", "EXT:Parceiro"), "Empresa parceira", [D2("Q-0016"), S("s2", "Parceiros que cumprem os critérios de risco (Apêndice D) entram no fluxo de desligamento", "User Story 12")],
     status="confirmado", tipo="finalistico", part=[DIR], quadro=J, principios=["atencao", "governanca"])
proc("9.1", "Retomar parceiro em risco pela abordagem do tipo", "M9", 1, "Âncora esfriando: chegar com oportunidade pronta. Valioso em risco: ouvir primeiro e decidir em 15 dias se vale. Cordial seletivo: recrutar de novo com foco único. Desertor: decidir, sem insistir.",
     "mostra a abordagem e a mensagem sugerida do tipo.", GP, "Parceiro entra em tipo de risco", ("Parceiro retomado ou sugestão de desligamento", "P-9.2"), "Empresa parceira",
     [D2("Q-0016"), FTC(2), FTC(16)], status="hipotese", principios=["atencao"])
proc("9.2", "Desligar parceiro", "M9", 2, "O Gerente decide; o Igor assina o aviso formal de 30 dias, entregue em conversa e por escrito; encerramento com acessos revogados e comissões preservadas.",
     "gera o aviso e revoga os acessos na data.", GP, "Sugestão de desligamento", ("Parceria encerrada", "EXT:Parceiro"), "Empresa parceira",
     [S("s2", "Aviso formal: texto gerado pelo portal, enviado pelo responsável, com encerramento em 30 dias (cláusula 13.4 do contrato).", "Apêndice D"), D2("Q-0011"), D3("Q-0009")], status="confirmado", part=[DIR])
proc("9.3", "Encerrar a parceria a pedido", "M9", 3, "Saída por decisão de qualquer das partes, com aviso de 30 dias, registrada como encerramento amigável e com o motivo para aprender.",
     "registra o motivo da saída.", GP, "Pedido de saída", ("Parceria encerrada de forma amigável", "EXT:Parceiro"), "Empresa parceira", [A("EV-0046"), VP(CS, 11)])

# ======================= SUPORTE
proc("M10", "Manter a Prateleira de fornecedores", None, 10, "Categorias e fichas verificadas, sem limite por categoria; a permanência depende da nota de qualidade e do retorno dos clientes.",
     "guarda as fichas, calcula a nota e marca a permanência.", GP, "Parceiro assinado ou ficha desatualizada", ("Prateleira curada", "P-6.4"), "Consultores e clientes industriais",
     [D("Q-0019"), F(EP, 3, 4)], status="confirmado", tipo="suporte")
proc("M11", "Equipar o parceiro para indicar", None, 11, "Trilhas, kit de vendas das três empresas, perfil do cliente ideal, frases que reconhecem a dor, simulador de ganho e apresentação de vendas de cada parceiro.",
     "é a área do parceiro: tudo em autoatendimento, sem pedir nada ao Gerente.", GP, "Material novo ou parceiro novo", ("Parceiro equipado", "P-5.3"), "Pessoas do parceiro",
     [D("Q-0012"), VP(RE, 5), S("s2", "O portal do parceiro ganha a área de capacitação, com trilhas criadas pela Wise.", "User Story 10")], status="confirmado", tipo="suporte", principios=["ensinar"])
proc("M12", "Operar o portal no centro da gestão", None, 12, "Manter as regras que rodam sozinhas, os dados e a privacidade (cruzamento com consentimento, só dados de empresa), os contratos e os acessos; primeiro fazer à mão e entender, depois automatizar.",
     "é o próprio processo: regras, automações, painéis, versões de contrato, acessos e auditoria.", GP, "Regra nova, pessoa nova, contrato ou pedido de dados", ("Portal confiável", "EXT:Time e parceiros"), "Time de parcerias e parceiros",
     [D2("Q-0001"), D("Q-0020"), VP(CS, 10), VP(KS, 3)], status="confirmado", tipo="suporte", principios=["portal"])


# ======================= SUBPROCESSOS (nível 3): o detalhe dos processos centrais
def subp(k, nome, pai, ordem, descricao, portal, gatilho, entrega, evs, status=None, freq="", part=(), sist=(), principios=()):
    st = status or next(x["status"] for x in d["processos"] if x["id"] == P[pai])
    dono = next(x["dono"] for x in d["processos"] if x["id"] == P[pai])
    cli = next(x["cliente"] for x in d["processos"] if x["id"] == P[pai])
    return proc(k, nome, pai, ordem, descricao, portal, dono, gatilho, entrega, cli, evs, status=st, freq=freq, part=part, sist=sist, principios=principios)

# 1.4 regras
subp("1.4.1", "Definir níveis, pacotes e contrapartidas", "1.4", 1, "Três níveis com os mesmos critérios do recrutamento; pacotes com contrapartidas dos dois lados.", "guarda a tabela e carrega as contrapartidas no card do parceiro.",
     "Revisão anual das regras", ("Tabela de níveis e pacotes", "P-1.4.3"), [S("s2", "Cada nível tem requisitos em três grupos (Apêndice B): resultado (indicações qualificadas ou clientes fechados no ICP em 180 dias), capacitação (pessoas certificadas) e regras", "User Story 4")], status="declarado")
subp("1.4.2", "Fixar a regra única de comissão e a contrapartida da Prateleira", "1.4", 2, "40% e 10% na Wise Makers e na Tríade, 6% e 2% do projeto na Swallow, sem exceção; o não monetário varia por tipo de parceiro; para entrar num pedido da Prateleira, contrapartida não financeira; revisão depois de dois trimestres com dados de permanência.",
     "calcula a comissão sozinho e registra a contrapartida combinada.", "Revisão anual das regras", ("Regra publicada", "P-1.4.3"), [D2("Q-0005"), D2("Q-0015"), D4("Q-0015")])
subp("1.4.3", "Escrever o regulamento curto e a política de dados", "1.4", 3, "Poucas regras (quem participa, como se divide o valor, como se resolvem conflitos) e a política de dados (só dados de empresa, consentimento no cruzamento).",
     "gera a página de regras e versiona cada mudança.", "Mudança de regra", ("Regulamento publicado", "P-2.5"), [D("Q-0020"), VP(BB, 11)])
subp("1.4.4", "Manter o termo-quadro", "1.4", 4, "Termo curto, igual para todos, com campos que mudam por parceiro e saída prevista.", "gera a minuta a partir dos campos.", "Mudança de regra", ("Termo-quadro atualizado", "P-4.4"), [D2("Q-0011"), F(AN, 7, 0)])

# 3.2 cubo
subp("3.2.1", "Calcular o Valor", "3.2", 1, "Receita ganha em 12 meses com origem no parceiro mais o pipeline aberto ponderado pela etapa.", "calcula todo dia.", "Leitura diária", ("Valor alto ou baixo", "P-3.2.4"), [FTC(6)], freq="Diária")
subp("3.2.2", "Calcular o Ritmo", "3.2", 2, "Recência e frequência de ações de valor (indicação, retorno a oportunidade ou pedido da Prateleira, ação de Base Ativa, presença em revisão).", "calcula todo dia.", "Leitura diária", ("Ritmo alto ou baixo", "P-3.2.4"), [VF(CS, 1, 1)], freq="Diária")
subp("3.2.3", "Calcular a Relação", "3.2", 3, "Pulso trimestral, retorno mútuo e equilíbrio entre indicações enviadas e recebidas.", "calcula no fechamento trimestral com o pulso.", "Fechamento trimestral", ("Relação alta ou baixa", "P-3.2.4"), [FTC(16), VF(GT, 0, 0)], freq="Trimestral")
subp("3.2.4", "Ler o tipo e sugerir a jogada", "3.2", 4, "Ler o tipo na tabela de oito células e, se mudou, criar a tarefa da jogada do novo tipo; o Potencial decide a intensidade.", "lê a tabela e cria a tarefa.", "Fator recalculado", ("Tipo e jogada", "P-7.1"), [FTC(6), FTC(2)])

# 4.2 qualificar
subp("4.2.1", "Pontuar o scorecard", "4.2", 1, "Sete critérios com nota 0, 0,5 ou 1, nota de potencial e nível de entrada.", "calcula a nota e o nível.", "Primeira reunião realizada", ("Nota e nível sugerido", "P-4.2.2"),
     [S("s2", "Nota de potencial = soma ponderada ÷ 10, em porcentagem.", "Apêndice A")], status="declarado")
subp("4.2.2", "Preencher a ficha de jogo", "4.2", 2, "Papéis do candidato na rede de valor e quem ganha com a entrada dele.", "guarda a ficha no card.", "Scorecard pontuado", ("Ficha de jogo", "P-4.3"), [D2("Q-0010"), F(EJ, 1, 3)], status="confirmado")
subp("4.2.3", "Estimar a sobreposição de carteiras", "4.2", 3, "Quantos clientes da carteira do candidato estão no ICP e em comum com o grupo.", "estima a partir do que o candidato informa.", "Ficha preenchida", ("Sobreposição estimada", "P-4.3"), [D2("Q-0010"), F(EP, 6, 5)], status="confirmado")
subp("4.2.4", "Ler o comportamento do candidato", "4.2", 4, "O que ele já deu antes de pedir e se a Wise o indicaria a um cliente importante.", "guarda as duas respostas na ficha.", "Ficha preenchida", ("Leitura de comportamento", "P-4.3"), [VP(GT, 6), VP(RE, 1)], status="hipotese")

# 5.1 entrada e 5.3 ensinar
subp("5.1.1", "Incluir o parceiro na comunidade", "5.1", 1, "Grupo do parceiro na comunidade Wise Partners, se ainda não existe desde a negociação.", "registra o grupo no card.", "Termo assinado", ("Parceiro na comunidade", "P-M8"), [D("Q-0012"), A("EV-0106")], sist=[SI_WPP])
subp("5.1.2", "Recolher a apresentação de vendas do parceiro", "5.1", 2, "Guardar no perfil a apresentação comercial dele para o Gerente resgatar quando o apresentar a um cliente.", "guarda no perfil.", "Termo assinado", ("Apresentação no perfil", "P-M10"), [D("Q-0012")])
subp("5.1.3", "Publicar a ficha na Prateleira e entregar o link", "5.1", 3, "Ficha verificada na Prateleira, link exclusivo e acessos.", "publica e gera o link.", "Termo assinado", ("Ficha e link", "P-5.2"),
     [S("s2", "Cada parceiro comercial assinado recebe um link exclusivo de indicação (e um QR Code) para usar com os próprios clientes.", "User Story 6")], status="declarado")
subp("5.3.1", "Mostrar o perfil do cliente ideal de cada empresa", "5.3", 1, "Uma página por empresa do grupo com quem é o cliente ideal.", "mostra na área do parceiro.", "Encontro de vendas", ("Perfil entendido", "P-5.3.2"), [VP(RE, 2)])
subp("5.3.2", "Ensinar as frases que reconhecem a dor", "5.3", 2, "O que o cliente do parceiro diz quando precisa de gestão comercial, de cada empresa do grupo.", "mostra na área do parceiro.", "Encontro de vendas", ("Frases em uso", "P-5.3.3"), [VP(RE, 2), VF(RE, 1, 0)])
subp("5.3.3", "Entregar a mensagem pronta de indicação", "5.3", 3, "Texto pronto para o parceiro apresentar a empresa do grupo ao cliente dele, junto com o link.", "gera a mensagem com o link exclusivo.", "Frases ensinadas", ("Gesto sem atrito", "P-5.4"), [VP(RE, 5)])

# 6.1 receber e qualificar
subp("6.1.1", "Registrar a oportunidade com a porta de origem", "6.1", 1, "Link, cruzamento, Base Ativa, Prateleira ou registro à mão, sempre com o parceiro de origem.", "registra e protege por 180 dias.", "Oportunidade chega", ("Oportunidade registrada", "P-6.1.2"),
     [S("s2", "A indicação fica protegida por 180 dias desde a última interação", "User Story 6")], status="declarado")
subp("6.1.2", "Agradecer e confirmar ao parceiro", "6.1", 2, "Confirmar o recebimento e agradecer na hora.", "envia a confirmação.", "Oportunidade registrada", ("Parceiro agradecido", "P-6.1.3"), [VP(RE, 6)], status="hipotese")
subp("6.1.3", "Validar duplicidade e ICP", "6.1", 3, "Checar se a empresa já está com o grupo e se está no ICP; calcular a nota de qualidade.", "checa duplicidade e calcula a nota.", "Parceiro confirmado", ("Oportunidade qualificada ou recusada", "P-6.2"),
     [S("s2", "Toda indicação ganha uma nota de qualidade (Apêndice E) e passa por validação da Wise, que confirma a aderência ao ICP.", "User Story 6")], status="declarado")

# 8.2 rituais da comunidade
subp("8.2.1", "Publicar o comunicado do mês", "8.2", 1, "Uma mensagem por mês, no mesmo formato: novidades, resultados do programa, oportunidades e agenda.", "prepara o rascunho com os números do mês.", "Início do mês", ("Comunicado publicado", "EXT:Parceiros"), [VP(BB, 7)], sist=[SI_WPP], freq="Mensal")
subp("8.2.2", "Conduzir o encontro trimestral de parceiros", "8.2", 2, "Encontro de troca entre parceiros, com casos e reconhecimento, aberto por uma mensagem gravada do Igor como voz do programa.", "agenda, convida, lembra o Igor de gravar a mensagem e registra presença.", "Fechamento trimestral", ("Encontro realizado", "EXT:Parceiros"), [VP(BB, 7), B("bech-partner-channels", "Orquestrar troca de práticas"), D4("Q-0021"), VP(RE, 10)], freq="Trimestral", part=[DIR])
subp("8.2.3", "Abrir a mentoria mensal à carteira dos parceiros", "8.2", 3, "Calendário da mentoria mensal da Wise aberto às carteiras de pacote B e A.", "envia os convites.", "Calendário mensal", ("Convites enviados", "EXT:Parceiros"), [S("s1", "calendário da mentoria mensal e dos eventos", "User Story 8")], status="declarado", freq="Mensal")
proc("8.2.4", "Convidar os parceiros às formações internas do grupo Tríade", "8.2", 4, "Abrir as formações internas do grupo Tríade como acesso de reconhecimento: só para os parceiros destaque e os de pacote B e A.",
     "envia os convites a partir do calendário de formações e registra presença.", GP, "Formação interna agendada", ("Parceiros convidados", "EXT:Parceiros"), "Parceiros",
     [D3("Q-0012"), D4("Q-0022")], status="confirmado", sist=[SI_WPP, SI_POR], regras=["Só destaques e pacotes B e A"], principios=["comunidade", "norma_social"])

# M10, M11, M12 ganham processos
proc("10.1", "Verificar a ficha do fornecedor", "M10", 1, "Conferir os dados, os casos e a apresentação de vendas antes de publicar na Prateleira.", "mostra a ficha para conferência e publica.", GP, "Parceiro assinado ou ficha alterada", ("Ficha publicada", "P-6.4"), "Consultores", [F(EP, 3, 4), D("Q-0019")], status="confirmado")
proc("10.2", "Revisar a permanência na Prateleira", "M10", 2, "A cada trimestre, quem fica e quem sai da Prateleira, pela nota de qualidade e pelo retorno dos clientes.", "calcula e sinaliza quem está abaixo.", GP, "Fechamento trimestral", ("Prateleira revista", "P-6.4"), "Consultores", [D("Q-0019")], status="confirmado", freq="Trimestral")
proc("11.1", "Manter trilhas e certificação", "M11", 1, "Trilhas por empresa do grupo com teste e certificado.", "entrega a trilha e emite o certificado.", GP, "Material novo", ("Trilha publicada", "P-5.3"), "Pessoas do parceiro",
     [S("s2", "Cada pessoa do parceiro faz a trilha com o próprio login e, ao passar no teste, recebe o próprio certificado em PDF e o selo de capacitação.", "User Story 10")])
proc("11.2", "Manter o kit de vendas e o simulador de ganho", "M11", 2, "Material de vendas da Wise Makers, da Tríade e da Swallow e quanto o parceiro ganha por indicação em cada uma.", "mostra o kit e simula o ganho pela regra única.", GP, "Material ou regra nova", ("Kit e simulador atualizados", "P-5.3"), "Pessoas do parceiro", [D("Q-0012")], status="confirmado")
proc("11.3", "Manter o perfil do cliente ideal e as frases", "M11", 3, "Perfil do cliente ideal e frases que reconhecem a dor, por empresa do grupo.", "mostra na área do parceiro.", GP, "Mudança de oferta", ("Perfil e frases atualizados", "P-5.3"), "Pessoas do parceiro", [VP(RE, 2)], status="hipotese")
proc("12.1", "Manter as regras e automações", "M12", 1, "Cada regra (marcos, régua, cubo, nível, risco, retorno ao parceiro) roda sozinha; primeiro se faz à mão e se entende, depois se automatiza.", "é onde as regras rodam.", GP, "Regra nova ou ajuste", ("Regra rodando", "P-2.1"), "Gerente de Parcerias", [VP(CS, 10), VP(KS, 3)], status="confirmado")
proc("12.2", "Proteger dados e privacidade", "M12", 2, "Cruzamento com consentimento que revela só coincidências, só dados de empresa, auditoria de acesso.", "processa o cruzamento e guarda só as coincidências.", GP, "Carteira recebida ou pedido de dados", ("Dados protegidos", "P-5.2"), "Parceiros",
     [D("Q-0020"), S("s2", "O servidor compara com a base da Wise, descarta a lista do parceiro no mesmo processamento e guarda só as coincidências por 180 dias.", "User Story 14")], status="confirmado")
proc("12.3", "Registrar contrato, versão ou acesso novo", "M12", 3, "Versões do termo, vigência, usuários e permissões.", "guarda as versões e controla os acessos.", GP, "Contrato ou pessoa nova", ("Contratos e acessos em ordem", "EXT:Time e parceiros"), "Time de parcerias",
     [S("s1", "Antes do uso, o administrador importa os parceiros atuais (planilha), os documentos já produzidos", "User Story 10")])
