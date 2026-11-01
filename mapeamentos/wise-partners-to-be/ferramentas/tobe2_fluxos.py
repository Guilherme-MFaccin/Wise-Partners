# Fluxos to-be v2 (executado dentro de tobe2_base.py)
for p in d["processos"]:
    for s in p.get("saidas", []):
        if s["para"].startswith("P-") and s["para"][2:] in P:
            s["para"] = P[s["para"][2:]]
for p in d["processos"]:
    for s in p.get("saidas", []):
        alvo = next((x for x in d["processos"] if x["id"] == s["para"]), None)
        if alvo is not None and not any(e.get("de") == p["id"] for e in alvo["entradas"]):
            alvo["entradas"].append({"nome": s["nome"], "de": p["id"]})

def no(i, tipo, nome="", raia=GP, **kw):
    return {"id": i, "tipo": tipo, **({"nome": nome} if nome else {}), "raia": raia, **kw}
def L(*pares):
    return [{"de": a, "para": b, **({"rotulo": r[0]} if r else {})} for a, b, *r in pares]
def fluxo(k, evs, raias, nos, lig, msgs=(), ext=(), status="declarado"):
    p = next(x for x in d["processos"] if x["id"] == P[k])
    p["fluxo"] = {"status": status, "evidencias": evs, "raias": raias, "externos": list(ext), "nos": nos, "ligacoes": lig, "mensagens": list(msgs)}
def sub(i, k, raia=GP, **kw):
    nome = next(x["nome"] for x in d["processos"] if x["id"] == P[k])
    return no(i, "subprocesso", nome, raia, processo=P[k], **kw)
H = {"status": "hipotese"}
AUTO = {"sistema": SI_POR, "modo": "automatico"}
SIS = {"sistema": SI_POR, "modo": "sistema"}
WPP = {"sistema": SI_WPP, "modo": "sistema"}
X_CAND, X_PARC, X_CLI = {"id": "X1", "nome": "Empresa candidata"}, {"id": "X1", "nome": "Parceiro"}, {"id": "X2", "nome": "Cliente industrial"}

# --- Atrair e selecionar (colunas do quadro da jornada na fase Começar)
fluxo("M3", [F(PP, 1, 0), F(PP, 2, 5), D("Q-0008"), D("Q-0009")], [GP, DIR],
      [no("i1", "inicio", "Candidato identificado"), sub("s1", "3.1"),
       no("t1", "tarefa", "Agendar a primeira reunião", **WPP), no("e1", "espera", "Resposta do candidato", evento="mensagem"),
       sub("s2", "3.3"), sub("s3", "3.2"), no("g1", "decisao", "Candidato elegível?"), no("g2", "decisao", "Candidato quer seguir agora?"),
       sub("s4", "3.6"), sub("s5", "3.4"), sub("s6", "3.5"),
       no("f1", "fim", "Candidato não elegível"), no("f2", "fim", "Candidato sem interesse"), no("f3", "fim", "Termo assinado")],
      L(("i1", "s1"), ("s1", "t1"), ("t1", "e1"), ("e1", "s2"), ("s2", "s3"), ("s3", "g1"), ("g1", "g2", "Sim"), ("g1", "f1", "Não"),
        ("g2", "s5", "Sim"), ("g2", "s4", "Agora não"), ("g2", "f2", "Não"), ("s4", "s2"), ("s5", "s6"), ("s6", "f3")),
      [{"de": "t1", "para": "X1", "rotulo": "Convite para reunião"}, {"de": "X1", "para": "e1", "rotulo": "Resposta"}], [X_CAND])

# --- Negociar e formalizar o termo (texto único e fila do Diretor)
fluxo("3.5", [D("Q-0009"), A("EV-0107"), F(AN, 7, 0), F(AN, 7, 1), F(AN, 6, 5), S("s1", "O contrato é enviado para assinatura no Autentique fora do portal, e o PDF assinado é anexado.", "User Story 4")],
      [GP, DIR],
      [no("i1", "inicio", "Plano conjunto acordado no workshop"),
       no("t1", "tarefa", "Registrar interesses, alternativas e pacote gatilho", **SIS),
       no("t2", "tarefa", "Preencher o termo-quadro", **SIS),
       no("t3", "tarefa", "Enviar o rascunho pedindo críticas", **WPP),
       no("e1", "espera", "Críticas do candidato", evento="mensagem"),
       no("g1", "decisao", "Rascunho ainda melhora?"),
       no("t4", "tarefa", "Revisar o rascunho"),
       no("g0", "decisao", "Termos dentro do pacote gatilho?"),
       no("t5", "tarefa", "Responder sim ou não à assinatura", raia=DIR, **SIS),
       no("g2", "decisao", "Assinatura aprovada?", raia=DIR),
       no("t6", "tarefa", "Enviar o termo para assinatura digital", sistema=SI_AUT, modo="sistema"),
       no("e2", "espera", "Termo assinado", evento="mensagem"),
       no("t7", "tarefa", "Anexar o termo assinado", **SIS),
       no("f1", "fim", "Termo assinado"), no("f2", "fim", "Negociação encerrada sem acordo")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "t3"), ("t3", "e1"), ("e1", "g1"), ("g1", "t4", "Sim"), ("t4", "t3"), ("g1", "g0", "Não"),
        ("g0", "t5", "Sim"), ("g0", "f2", "Não"), ("t5", "g2"), ("g2", "t6", "Sim"), ("g2", "t4", "Não"), ("t6", "e2"), ("e2", "t7"), ("t7", "f1")),
      [{"de": "t3", "para": "X1", "rotulo": "Rascunho do termo"}, {"de": "X1", "para": "e1", "rotulo": "Críticas"},
       {"de": "t6", "para": "X1", "rotulo": "Termo para assinatura"}, {"de": "X1", "para": "e2", "rotulo": "Termo assinado"}], [X_CAND])
for n in next(x for x in d["processos"] if x["id"] == P["3.5"])["fluxo"]["nos"]:
    if n["id"] in ("g0", "t5"): n["status"] = "hipotese"

# --- Integrar e ativar (marcos dentro do card)
fluxo("M4", [A("EV-0110"), F(PP, 1, 3), D("Q-0011"), D("Q-0012"),
             S("s2", "Sem ativação em 90 dias, o responsável recebe alerta e o plano ganha uma extensão até 120 dias; sem ativação em 120 dias, o parceiro fica marcado como \"não ativado\".", "User Story 5")],
      [GP, RESP_P],
      [no("i1", "inicio", "Termo assinado"), sub("s1", "4.1"),
       no("t1", "tarefa", "Conduzir o encontro de alinhamento", descricao="Até 7 dias."), sub("s2", "4.3"),
       no("t2", "tarefa", "Conduzir o encontro de vendas", descricao="Até 30 dias."), sub("s3", "4.4", raia=RESP_P),
       no("t3", "tarefa", "Conduzir o encontro de produto", descricao="Até 60 dias."), no("t4", "tarefa", "Conduzir o encontro de pós-venda", descricao="Até 90 dias."),
       no("g1", "decisao", "Parceiro ativado em 90 dias?"), no("t5", "tarefa", "Estender o plano até 120 dias", **AUTO), no("g2", "decisao", "Parceiro ativado em 120 dias?"),
       no("f1", "fim", "Parceiro ativado"), no("f2", "fim", "Parceiro não ativado")],
      L(("i1", "s1"), ("s1", "t1"), ("t1", "s2"), ("s2", "t2"), ("t2", "s3"), ("s3", "t3"), ("t3", "t4"), ("t4", "g1"),
        ("g1", "f1", "Sim"), ("g1", "t5", "Não"), ("t5", "g2"), ("g2", "f1", "Sim"), ("g2", "f2", "Não")), status="confirmado")

# --- Esteira de oportunidades (quadro de oportunidades)
fluxo("M5", [F(EP, 0, 0), F(CV, 6, 1), F(CV, 7, 1), D("Q-0014"), D("Q-0016"), D("Q-0013")], [GP, CONS, FIN],
      [no("i1", "inicio", "Oportunidade chega por uma das portas", gatilho="mensagem"), sub("s1", "5.1"),
       no("g1", "decisao", "Oportunidade válida?"), no("t1", "tarefa", "Informar o motivo ao parceiro", **WPP),
       sub("s2", "5.2"), sub("s3", "5.3"), no("g2", "decisao", "Cliente fechou?", raia=CONS),
       sub("s4", "5.7", raia=FIN), sub("s5", "5.8"), no("t2", "tarefa", "Informar a perda ao parceiro", **WPP),
       no("f1", "fim", "Oportunidade recusada"), no("f2", "fim", "Cliente fechado, comissão paga e checado"), no("f3", "fim", "Oportunidade perdida")],
      L(("i1", "s1"), ("s1", "g1"), ("g1", "t1", "Não"), ("t1", "f1"), ("g1", "s2", "Sim"), ("s2", "s3"), ("s3", "g2"),
        ("g2", "s4", "Sim"), ("s4", "s5"), ("s5", "f2"), ("g2", "t2", "Não"), ("t2", "f3")),
      [{"de": "X1", "para": "i1", "rotulo": "Indicação, pedido ou jogada"}, {"de": "t1", "para": "X1", "rotulo": "Motivo da recusa"},
       {"de": "s3", "para": "X1", "rotulo": "Retorno a cada etapa"}, {"de": "t2", "para": "X1", "rotulo": "Motivo da perda"}, {"de": "s4", "para": "X1", "rotulo": "Comissão"}],
      [X_PARC], status="hipotese")

# --- Atender pela Prateleira
fluxo("5.4", [S("s1", "Given a página publicada, When salva, Then o sistema cria uma indicação da empresa do consultor para cada parceiro apresentado, com origem \"pedido de RFP\"", "User Story 9, cenário 6"), D("Q-0019"), D("Q-0013")],
      [GP, CONS],
      [no("i1", "inicio", "Consultor relata a necessidade do cliente", raia=CONS),
       no("t1", "tarefa", "Registrar o pedido do cliente", **SIS), no("t2", "tarefa", "Recomendar parceiros por categoria", **AUTO),
       no("g1", "decisao", "Há parceiros assinados na categoria?"), no("t3", "tarefa", "Registrar a categoria a prospectar", **AUTO),
       no("t4", "tarefa", "Ajustar a seleção e resgatar as apresentações dos parceiros", **SIS), no("t5", "tarefa", "Publicar a página do cliente", **SIS),
       no("t6", "tarefa", "Enviar o link ao consultor", **WPP), no("e1", "espera", "Cliente escolhe falar com um parceiro", evento="mensagem"),
       no("t7", "tarefa", "Avisar o consultor e o parceiro", **AUTO),
       no("f1", "fim", "Categoria sem fornecedor"), no("f2", "fim", "Cliente em contato com o parceiro")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "g1"), ("g1", "t4", "Sim"), ("g1", "t3", "Não"), ("t3", "f1"), ("t4", "t5"), ("t5", "t6"), ("t6", "e1"), ("e1", "t7"), ("t7", "f2")),
      [{"de": "X2", "para": "e1", "rotulo": "Clique em falar com o parceiro"}, {"de": "t7", "para": "X1", "rotulo": "Aviso de contato"}], [X_PARC, X_CLI])

# --- Base Ativa
fluxo("6.1", [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7"),
              A("EV-0050"), A("EV-0092"), A("EV-0093"), A("EV-0094"), A("EV-0095"), A("EV-0096"), A("EV-0097"), A("EV-0098")],
      [GP, RESP_P],
      [no("i1", "inicio", "Parceiro de pacote A assinado"), no("g1", "decisao", "Há horas disponíveis?"),
       no("t1", "tarefa", "Colocar o parceiro na fila com a data prevista", **SIS), no("e1", "espera", "Vez do parceiro na fila", evento="tempo"),
       no("t2", "tarefa", "Diagnosticar a base do parceiro"), no("t3", "tarefa", "Categorizar a carteira", raia=RESP_P),
       no("t4", "tarefa", "Definir estrutura e anúncio da comunidade"), no("t5", "tarefa", "Definir oferta e nutrição", sistema=SI_HUB, modo="sistema"),
       no("t6", "tarefa", "Planejar formação e evento"), no("t7", "tarefa", "Preparar roteiro, divulgação e logística do evento"),
       no("t8", "tarefa", "Promover o evento da comunidade", raia=RESP_P), no("t9", "tarefa", "Emitir o certificado metodológico", **SIS),
       no("f1", "fim", "Comunidade validada")],
      L(("i1", "g1"), ("g1", "t2", "Sim"), ("g1", "t1", "Não"), ("t1", "e1"), ("e1", "t2"), ("t2", "t3"), ("t3", "t4"), ("t4", "t5"), ("t5", "t6"), ("t6", "t7"), ("t7", "t8"), ("t8", "t9"), ("t9", "f1")))

# --- Reter ou encerrar
fluxo("M7", [S("s2", "Segunda tentativa: no mínimo 15 dias depois da primeira, registrada como ponto de contato.", "Apêndice D"),
             S("s2", "Sugestão de desligamento: 30 dias depois da segunda tentativa sem resposta ou sem nova atividade do parceiro.", "Apêndice D"), F(AN, 2, 3), F(AN, 7, 5)],
      [GP, DIR],
      [no("i1", "inicio", "Parceiro em risco"), no("t1", "tarefa", "Propor reunião com uma oportunidade concreta", **WPP), no("e1", "espera", "15 dias", evento="tempo"),
       no("t2", "tarefa", "Ligar para o parceiro na segunda tentativa", descricao="Conversa difícil por voz, não por texto."), no("e2", "espera", "30 dias", evento="tempo"),
       no("g1", "decisao", "Parceiro voltou a ter atividade?"), no("t3", "tarefa", "Sugerir o desligamento", **AUTO),
       no("t4", "tarefa", "Responder sim ou não ao desligamento", raia=DIR, **SIS), no("g2", "decisao", "Desligamento aprovado?", raia=DIR),
       no("t5", "tarefa", "Comunicar o encerramento em conversa e por escrito"), no("e3", "espera", "30 dias de aviso", evento="tempo"),
       no("t6", "tarefa", "Encerrar a parceria e revogar acessos", **AUTO),
       no("f1", "fim", "Parceiro retomado"), no("f2", "fim", "Parceiro mantido"), no("f3", "fim", "Parceria encerrada")],
      L(("i1", "t1"), ("t1", "e1"), ("e1", "t2"), ("t2", "e2"), ("e2", "g1"), ("g1", "f1", "Sim"), ("g1", "t3", "Não"), ("t3", "t4"), ("t4", "g2"),
        ("g2", "f2", "Não"), ("g2", "t5", "Sim"), ("t5", "e3"), ("e3", "t6"), ("t6", "f3")),
      [{"de": "t1", "para": "X1", "rotulo": "Convite com oportunidade"}, {"de": "t5", "para": "X1", "rotulo": "Aviso formal"}], [X_PARC])
for n in next(x for x in d["processos"] if x["id"] == P["M7"])["fluxo"]["nos"]:
    if n["id"] in ("t1", "t2"): n["status"] = "hipotese"

# --- Revisar o nível (ritual trimestral)
fluxo("2.4.1", [S("s2", "Isentos: assinados há menos de 180 dias e pausados.", "Apêndice B"), A("EV-0109")], [GP],
      [no("i1", "inicio", "Primeiro dia útil do trimestre", gatilho="tempo"), no("t1", "tarefa", "Apurar os requisitos de cada parceiro", **AUTO),
       no("g0", "decisao", "Parceiro isento?"), no("g1", "decisao", "Cumpre o nível atual?"), no("g2", "decisao", "Já estava em observação?"),
       no("t2", "tarefa", "Colocar em observação e avisar o que falta", **AUTO), no("t3", "tarefa", "Propor a descida de nível", **AUTO),
       no("t4", "tarefa", "Decidir a descida com motivo", **SIS), no("g3", "decisao", "Descer de nível?"),
       no("f0", "fim", "Parceiro isento"), no("f1", "fim", "Nível mantido"), no("f2", "fim", "Parceiro em observação"), no("f3", "fim", "Nível rebaixado")],
      L(("i1", "t1"), ("t1", "g0"), ("g0", "f0", "Sim"), ("g0", "g1", "Não"), ("g1", "f1", "Sim"), ("g1", "g2", "Não"), ("g2", "t2", "Não"), ("t2", "f2"),
        ("g2", "t3", "Sim"), ("t3", "t4"), ("t4", "g3"), ("g3", "f3", "Sim"), ("g3", "f1", "Não")),
      [{"de": "t2", "para": "X1", "rotulo": "Aviso do que falta"}, {"de": "t4", "para": "X1", "rotulo": "Aviso de nível"}], [X_PARC], status="confirmado")

# --- Fila diária de exceções
fluxo("2.1", [F(CV, 2, 4), F(EP, 0, 2), D("Q-0013"), F(CV, 5, 5)], [GP],
      [no("i1", "inicio", "Início do dia de trabalho no programa", gatilho="tempo"), no("t1", "tarefa", "Abrir a fila ordenada por prazo", **SIS),
       no("g1", "decisao", "Quem executa a tarefa?"), no("t2", "tarefa", "Concluir a tarefa e registrar o resultado", **SIS),
       no("t3", "tarefa", "Cobrar o executor com a mensagem pronta", **WPP), no("e1", "espera", "Retorno do executor", evento="mensagem"),
       no("t4", "tarefa", "Registrar o retorno na tarefa", **SIS), no("g2", "decisao", "Ainda há tarefa vencendo hoje?"),
       no("f1", "fim", "Fila do dia tratada")],
      L(("i1", "t1"), ("t1", "g1"), ("g1", "t2", "O Gerente"), ("g1", "t3", "Consultor, comercial, financeiro ou parceiro"), ("t3", "e1"), ("e1", "t4"),
        ("t2", "g2"), ("t4", "g2"), ("g2", "t1", "Sim"), ("g2", "f1", "Não")),
      [{"de": "t3", "para": "X1", "rotulo": "Pedido com prazo"}, {"de": "X1", "para": "e1", "rotulo": "Retorno"}], [{"id": "X1", "nome": "Executor (consultor, comercial, financeiro ou parceiro)"}], status="hipotese")

# --- Fechamento trimestral
fluxo("2.4", [S("s2", "Revisão: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre.", "Apêndice B"), F(AN, 1, 5), F(CV, 5, 3)],
      [GP, DIR],
      [no("i1", "inicio", "Primeiro dia útil do trimestre", gatilho="tempo"), sub("s1", "2.4.1"), sub("s2", "2.4.3"), sub("s3", "2.4.2", **H), sub("s4", "2.4.4"),
       no("t1", "tarefa", "Agendar as revisões conjuntas do trimestre", **SIS), no("t2", "tarefa", "Enviar ao Diretor as decisões do trimestre", **SIS),
       no("f1", "fim", "Trimestre fechado")],
      L(("i1", "s1"), ("s1", "s2"), ("s2", "s3"), ("s3", "s4"), ("s4", "t1"), ("t1", "t2"), ("t2", "f1")))

# --- Revisão conjunta com o parceiro
fluxo("6.3", [D("Q-0017"), D("Q-0018"), F(AN, 0, 3), F(AN, 0, 4), F(AN, 1, 5)], [GP, DIR],
      [no("i1", "inicio", "Data da revisão pela cadência", gatilho="tempo"), no("t1", "tarefa", "Montar a pauta com os dados do parceiro", **AUTO),
       no("g1", "decisao", "Parceiro Elite?"), no("t2", "tarefa", "Convidar o Diretor", **WPP),
       no("t3", "tarefa", "Conduzir a revisão com o parceiro"), no("t4", "tarefa", "Registrar a ata e as ações", **SIS),
       no("f1", "fim", "Plano do próximo período combinado")],
      L(("i1", "t1"), ("t1", "g1"), ("g1", "t2", "Sim"), ("g1", "t3", "Não"), ("t2", "t3"), ("t3", "t4"), ("t4", "f1")),
      [{"de": "t3", "para": "X1", "rotulo": "Pauta e resultados"}], [X_PARC], status="confirmado")

# leaves sem fluxo: dispensa pela decisão do patrocinador
for p in d["processos"]:
    if not p.get("fluxo") and not any(x.get("pai") == p["id"] for x in d["processos"]):
        p["fluxo_dispensado"] = f"{DE_FLUXO}: não vira quadro, fila ou ritual próprio; fica no nível de dono, gatilho e entregas"

# ---------------------------------------------------------------- objetos com estados (base dos dois quadros e da fila)
OBJ = {}
for k, nome, cria, usa, encerra, estados, evs, status in [
    ("parceiro", "Parceiro (um card na jornada, do candidato ao encerramento)", "M3", ["M4", "M6"], "M7",
     ["Candidato em conversa", "Em negociação", "Em integração (marcos de 30, 60, 90 e 120 dias)", "Ativo gerenciado", "Ativo pelo portal", "Em risco", "Encerrado"],
     [F(AN, 0, 0), F(PP, 1, 0), F(PP, 7, 2)], "hipotese"),
    ("oportunidade", "Oportunidade compartilhada (um card por oportunidade, com a porta de origem como etiqueta)", "5.1", ["5.2", "5.3", "5.4", "5.6"], "5.7",
     ["Recebida", "Qualificada", "Com quem vende", "Em venda", "Fechada", "Perdida", "Recusada"], [F(EP, 0, 1), F(CV, 6, 2), F(CV, 7, 1)], "hipotese"),
    ("tarefa", "Tarefa (fila única por exceção, dono sempre o Gerente de Parcerias)", "2.1", ["2.2", "2.3"], "2.1",
     ["Aberta", "Aguardando executor", "Concluída"], [D("Q-0013"), F(CV, 2, 4)], "hipotese"),
]:
    OBJ[k] = add("objetos", "OB", nome=nome, ciclo={"cria": P[cria], "usa": [P[u] for u in usa], "encerra": P[encerra]}, estados=estados, status=status, evidencias=evs)

for termo, definicao, evs in [
    ("Oportunidade compartilhada", "Unidade de valor do programa: uma indústria com necessidade conhecida conectada, com contexto, a quem resolve; nasce de indicação, Prateleira, cruzamento ou Base Ativa.", [F(EP, 0, 1)]),
    ("Parceiro ativo", "Parceiro que já teve a primeira indicação no ICP que virou reunião.", [A("EV-0110")]),
    ("Parceiro gerenciado", "Parceiro com cadência humana (revisões, mesa do portfólio); os demais são atendidos pelo portal, pela comunidade e por regras.", [F(CV, 2, 3), F(PP, 7, 2)]),
    ("Exceção", "O que fugiu da regra (prazo vencendo, marco atrasado, risco, pedido parado) e por isso vira tarefa na fila; o que segue a regra não gera trabalho.", [F(EP, 3, 3)]),
    ("Ritual", "Encontro de gestão com data fixa (diário, semanal, mensal, trimestral, anual) que agrupa decisões em vez de espalhá-las em quadros.", [F(CV, 5, 1)]),
    ("Texto único", "Termo-quadro da parceria que circula como rascunho pedindo críticas, até virar a proposta que o Diretor aprova com sim ou não.", [F(AN, 7, 0)]),
]:
    add("glossario", "GL", termo=termo, definicao=definicao, sinonimos=[], evidencias=evs)

# cadeias de valor
add("cadeias_de_valor", "CV", nome="Jornada do parceiro: do candidato ao parceiro em crescimento", gatilho="Candidato identificado", valor="Parceiro ativo, gerando e recebendo oportunidades",
    stakeholder="Empresa parceira", ofertas=[OF1, OF2],
    etapas=[{"nome": "Atrair e selecionar", "processos": [P["M3"]]}, {"nome": "Integrar e ativar", "processos": [P["M4"]]},
            {"nome": "Desenvolver", "processos": [P["M6"]]}, {"nome": "Reter ou encerrar", "processos": [P["M7"]]}],
    status="hipotese", evidencias=[F(PP, 1, 0), F(AN, 0, 0)])
add("cadeias_de_valor", "CV", nome="Da necessidade da indústria ao cliente fechado e à comissão paga", gatilho="Uma das quatro portas gera uma oportunidade",
    valor="Indústria atendida por quem resolve, cliente novo para o grupo, demanda e comissão para o parceiro", stakeholder="Indústria e parceiro", ofertas=[OF1],
    etapas=[{"nome": "Receber e qualificar", "processos": [P["5.1"]]}, {"nome": "Passar a quem vende", "processos": [P["5.2"]]},
            {"nome": "Acompanhar e retornar", "processos": [P["5.3"]]}, {"nome": "Vender (fora do escopo)", "processos": []},
            {"nome": "Pagar e checar", "processos": [P["5.7"], P["5.8"]]}],
    status="hipotese", evidencias=[F(EP, 0, 0), F(CV, 6, 0)])
