# Fluxos to-be v3 (executado dentro de tobe3_base.py)
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

# --- Atrair e selecionar
fluxo("M4", [F(PP, 1, 0), D2("Q-0010"), D("Q-0008")], [GP, DIR],
      [no("i1", "inicio", "Candidato identificado"), sub("s1", "4.1"), no("t1", "tarefa", "Agendar a primeira reunião", **WPP),
       no("e1", "espera", "Resposta do candidato", evento="mensagem"), sub("s2", "4.2"), no("g1", "decisao", "Candidato elegível?"),
       no("g2", "decisao", "Candidato quer seguir agora?"), sub("s3", "4.5"), sub("s4", "4.3"), sub("s5", "4.4"),
       no("f1", "fim", "Candidato não elegível"), no("f2", "fim", "Candidato sem interesse"), no("f3", "fim", "Termo assinado")],
      L(("i1", "s1"), ("s1", "t1"), ("t1", "e1"), ("e1", "s2"), ("s2", "g1"), ("g1", "g2", "Sim"), ("g1", "f1", "Não"),
        ("g2", "s4", "Sim"), ("g2", "s3", "Agora não"), ("g2", "f2", "Não"), ("s3", "s4"), ("s4", "s5"), ("s5", "f3")),
      [{"de": "t1", "para": "X1", "rotulo": "Convite"}, {"de": "X1", "para": "e1", "rotulo": "Resposta"}], [X_CAND], status="confirmado")

# --- Negociar e formalizar: texto único, Diretor só assina
fluxo("4.4", [D2("Q-0011"), F(AN, 7, 0), A("EV-0107"), S("s1", "O contrato é enviado para assinatura no Autentique fora do portal, e o PDF assinado é anexado.", "User Story 4")],
      [GP, DIR],
      [no("i1", "inicio", "Plano conjunto acordado no workshop"), no("t1", "tarefa", "Preencher o termo-quadro", **SIS),
       no("t2", "tarefa", "Enviar a minuta pedindo críticas", **WPP), no("e1", "espera", "Críticas do candidato", evento="mensagem"),
       no("g1", "decisao", "As duas partes aprovam?"), no("t3", "tarefa", "Ajustar a minuta", **SIS),
       no("t4", "tarefa", "Assinar o termo", raia=DIR, sistema=SI_AUT, modo="sistema"), no("e2", "espera", "Assinatura do parceiro", evento="mensagem"),
       no("t5", "tarefa", "Anexar o termo assinado", **SIS), no("f1", "fim", "Termo assinado")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "e1"), ("e1", "g1"), ("g1", "t3", "Não"), ("t3", "t2"), ("g1", "t4", "Sim"), ("t4", "e2"), ("e2", "t5"), ("t5", "f1")),
      [{"de": "t2", "para": "X1", "rotulo": "Minuta"}, {"de": "X1", "para": "e1", "rotulo": "Críticas"}, {"de": "X1", "para": "e2", "rotulo": "Termo assinado"}], [X_CAND], status="confirmado")

# --- Integrar e ativar
fluxo("M5", [A("EV-0110"), VP(CS, 4), D2("Q-0010")], [GP, RESP_P],
      [no("i1", "inicio", "Termo assinado"), sub("s1", "5.1"), sub("s2", "5.2"), sub("s3", "5.3", **H),
       no("g1", "decisao", "Parceiro ativado em 90 dias?"), no("t1", "tarefa", "Estender o plano até 120 dias", **AUTO),
       no("g2", "decisao", "Parceiro ativado em 120 dias?"), no("f1", "fim", "Parceiro ativado"), no("f2", "fim", "Parceiro não ativado")],
      L(("i1", "s1"), ("s1", "s2"), ("s2", "s3"), ("s3", "g1"), ("g1", "f1", "Sim"), ("g1", "t1", "Não"), ("t1", "g2"), ("g2", "f1", "Sim"), ("g2", "f2", "Não")), status="confirmado")

# --- Esteira de oportunidades
fluxo("M6", [D2("Q-0002"), D2("Q-0014"), F(EP, 0, 0), VP(RE, 6)], [GP, CONS, FIN],
      [no("i1", "inicio", "Oportunidade chega por uma das portas", gatilho="mensagem"), sub("s1", "6.1"), no("g1", "decisao", "Oportunidade válida?"),
       no("t1", "tarefa", "Explicar o motivo ao parceiro", **WPP), sub("s2", "6.2"), sub("s3", "6.3", **H), no("g2", "decisao", "Cliente fechou?", raia=CONS),
       sub("s4", "6.7", raia=FIN), sub("s5", "6.8"),
       no("f1", "fim", "Oportunidade recusada"), no("f2", "fim", "Cliente fechado, comissão paga e checado"), no("f3", "fim", "Oportunidade perdida")],
      L(("i1", "s1"), ("s1", "g1"), ("g1", "t1", "Não"), ("t1", "f1"), ("g1", "s2", "Sim"), ("s2", "s3"), ("s3", "g2"), ("g2", "s4", "Sim"), ("s4", "s5"), ("s5", "f2"), ("g2", "f3", "Não")),
      [{"de": "X1", "para": "i1", "rotulo": "Indicação, pedido ou jogada"}, {"de": "t1", "para": "X1", "rotulo": "Motivo"}, {"de": "s3", "para": "X1", "rotulo": "Retorno a cada etapa"},
       {"de": "s4", "para": "X1", "rotulo": "Comissão"}], [X_PARC], status="confirmado")

# --- Fechar o ciclo com o parceiro
fluxo("6.3", [VP(RE, 6), VP(GT, 5), VP(BB, 4)], [GP],
      [no("i1", "inicio", "Oportunidade muda de etapa"), no("t1", "tarefa", "Preparar a mensagem de retorno", **AUTO),
       no("t2", "tarefa", "Enviar o retorno no grupo do parceiro", **WPP), no("g1", "decisao", "A oportunidade terminou?"),
       no("t3", "tarefa", "Mostrar ao parceiro o impacto gerado", **WPP), no("f1", "fim", "Parceiro informado da etapa"), no("f2", "fim", "Parceiro informado do desfecho e do impacto")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "g1"), ("g1", "f1", "Não"), ("g1", "t3", "Sim"), ("t3", "f2")),
      [{"de": "t2", "para": "X1", "rotulo": "Retorno da etapa"}, {"de": "t3", "para": "X1", "rotulo": "Desfecho e impacto"}], [X_PARC], status="hipotese")

# --- Prateleira
fluxo("6.4", [S("s1", "Given a página publicada, When salva, Then o sistema cria uma indicação da empresa do consultor para cada parceiro apresentado, com origem \"pedido de RFP\"", "User Story 9, cenário 6"), D2("Q-0015")],
      [GP, CONS],
      [no("i1", "inicio", "Consultor relata a necessidade do cliente", raia=CONS), no("t1", "tarefa", "Registrar o pedido do cliente", **SIS),
       no("t2", "tarefa", "Recomendar parceiros por categoria", **AUTO), no("g1", "decisao", "Há parceiros assinados na categoria?"), no("t3", "tarefa", "Registrar a categoria a prospectar", **AUTO),
       no("t4", "tarefa", "Combinar a contrapartida com cada fornecedor", **WPP), no("t5", "tarefa", "Publicar a página do cliente", **SIS),
       no("e1", "espera", "Cliente escolhe falar com um parceiro", evento="mensagem"), no("t6", "tarefa", "Avisar o consultor e o parceiro", **AUTO),
       no("f1", "fim", "Categoria sem fornecedor"), no("f2", "fim", "Cliente em contato com o parceiro")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "g1"), ("g1", "t4", "Sim"), ("g1", "t3", "Não"), ("t3", "f1"), ("t4", "t5"), ("t5", "e1"), ("e1", "t6"), ("t6", "f2")),
      [{"de": "t4", "para": "X1", "rotulo": "Pedido de contrapartida"}, {"de": "X2", "para": "e1", "rotulo": "Clique em falar com o parceiro"}, {"de": "t6", "para": "X1", "rotulo": "Aviso de contato"}],
      [X_PARC, X_CLI], status="confirmado")

# --- Classificar no cubo (leitura contínua)
fluxo("3.2", [FTC(6), FTC(7), VF(CS, 1, 1), D2("Q-0009"), D2("Q-0016")], [GP],
      [no("i1", "inicio", "Leitura diária do portal", gatilho="tempo"), no("t1", "tarefa", "Calcular o Valor de cada parceiro", **AUTO),
       no("t2", "tarefa", "Calcular o Ritmo de cada parceiro", **AUTO), no("g1", "decisao", "É fechamento trimestral?"),
       no("t3", "tarefa", "Calcular a Relação com o pulso", **AUTO), no("t4", "tarefa", "Ler o tipo na tabela de oito células", **AUTO),
       no("g2", "decisao", "O parceiro mudou de tipo?"), no("t5", "tarefa", "Criar a tarefa da jogada do novo tipo", **AUTO),
       no("f1", "fim", "Tipo mantido"), no("f2", "fim", "Tipo atualizado e jogada criada")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "g1"), ("g1", "t3", "Sim"), ("g1", "t4", "Não"), ("t3", "t4"), ("t4", "g2"), ("g2", "f1", "Não"), ("g2", "t5", "Sim"), ("t5", "f2")), status="hipotese")

# --- Base Ativa
fluxo("7.4", [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7"),
              A("EV-0050"), A("EV-0092"), A("EV-0093"), A("EV-0094"), A("EV-0095"), A("EV-0096"), A("EV-0097"), A("EV-0098")], [GP, RESP_P],
      [no("i1", "inicio", "Parceiro de pacote A assinado"), no("g1", "decisao", "Há horas disponíveis?"), no("t1", "tarefa", "Colocar o parceiro na fila com a data prevista", **SIS),
       no("e1", "espera", "Vez do parceiro na fila", evento="tempo"), no("t2", "tarefa", "Diagnosticar a base do parceiro"), no("t3", "tarefa", "Categorizar a carteira", raia=RESP_P),
       no("t4", "tarefa", "Definir estrutura e anúncio da comunidade"), no("t5", "tarefa", "Definir oferta e nutrição", sistema=SI_HUB, modo="sistema"),
       no("t6", "tarefa", "Planejar formação e evento"), no("t7", "tarefa", "Preparar roteiro, divulgação e logística do evento"),
       no("t8", "tarefa", "Promover o evento da comunidade", raia=RESP_P), no("t9", "tarefa", "Emitir o certificado metodológico", **SIS), no("f1", "fim", "Comunidade validada")],
      L(("i1", "g1"), ("g1", "t2", "Sim"), ("g1", "t1", "Não"), ("t1", "e1"), ("e1", "t2"), ("t2", "t3"), ("t3", "t4"), ("t4", "t5"), ("t5", "t6"), ("t6", "t7"), ("t7", "t8"), ("t8", "t9"), ("t9", "f1")))

# --- Reter ou encerrar pelo tipo
fluxo("M9", [D2("Q-0016"), FTC(2), S("s2", "Sugestão de desligamento: 30 dias depois da segunda tentativa sem resposta ou sem nova atividade do parceiro.", "Apêndice D")], [GP],
      [no("i1", "inicio", "Parceiro entra num tipo de risco"), no("g1", "decisao", "Qual é o tipo?"),
       no("t1", "tarefa", "Levar uma oportunidade pronta ao parceiro", **WPP), no("t2", "tarefa", "Ouvir o parceiro e decidir em 15 dias se vale", descricao="Ligação, não mensagem."),
       no("t3", "tarefa", "Recrutar de novo com um foco único", **WPP), no("t4", "tarefa", "Decidir sem insistir"),
       no("e1", "espera", "30 dias", evento="tempo"), no("g2", "decisao", "O Ritmo voltou a ser alto?"), no("t5", "tarefa", "Sugerir o desligamento", **AUTO),
       no("t6", "tarefa", "Decidir o desligamento com motivo", **SIS, **H), no("g3", "decisao", "Desligar?"), no("t7", "tarefa", "Comunicar o encerramento em conversa e por escrito"),
       no("e2", "espera", "30 dias de aviso", evento="tempo"), no("t8", "tarefa", "Encerrar a parceria e revogar acessos", **AUTO),
       no("f1", "fim", "Parceiro retomado"), no("f2", "fim", "Parceiro mantido em observação"), no("f3", "fim", "Parceria encerrada")],
      L(("i1", "g1"), ("g1", "t1", "Âncora esfriando"), ("g1", "t2", "Valioso em risco"), ("g1", "t3", "Cordial seletivo"), ("g1", "t4", "Desertor"),
        ("t1", "e1"), ("t2", "e1"), ("t3", "e1"), ("t4", "t5"), ("e1", "g2"), ("g2", "f1", "Sim"), ("g2", "t5", "Não"), ("t5", "t6"), ("t6", "g3"),
        ("g3", "f2", "Não"), ("g3", "t7", "Sim"), ("t7", "e2"), ("e2", "t8"), ("t8", "f3")),
      [{"de": "t1", "para": "X1", "rotulo": "Oportunidade"}, {"de": "t3", "para": "X1", "rotulo": "Convite com foco único"}, {"de": "t7", "para": "X1", "rotulo": "Aviso formal"}], [X_PARC], status="hipotese")

# --- Revisar o nível
fluxo("3.4", [S("s2", "Isentos: assinados há menos de 180 dias e pausados.", "Apêndice B"), A("EV-0109")], [GP],
      [no("i1", "inicio", "Primeiro dia útil do trimestre", gatilho="tempo"), no("t1", "tarefa", "Apurar os requisitos de cada parceiro", **AUTO),
       no("g0", "decisao", "Parceiro isento?"), no("g1", "decisao", "Cumpre o nível atual?"), no("g2", "decisao", "Já estava em observação?"),
       no("t2", "tarefa", "Colocar em observação e avisar o que falta", **AUTO), no("t3", "tarefa", "Propor a descida de nível", **AUTO),
       no("t4", "tarefa", "Decidir a descida com motivo", **SIS), no("g3", "decisao", "Descer de nível?"),
       no("f0", "fim", "Parceiro isento"), no("f1", "fim", "Nível mantido"), no("f2", "fim", "Parceiro em observação"), no("f3", "fim", "Nível rebaixado")],
      L(("i1", "t1"), ("t1", "g0"), ("g0", "f0", "Sim"), ("g0", "g1", "Não"), ("g1", "f1", "Sim"), ("g1", "g2", "Não"), ("g2", "t2", "Não"), ("t2", "f2"),
        ("g2", "t3", "Sim"), ("t3", "t4"), ("t4", "g3"), ("g3", "f3", "Sim"), ("g3", "f1", "Não")),
      [{"de": "t2", "para": "X1", "rotulo": "Aviso do que falta"}, {"de": "t4", "para": "X1", "rotulo": "Aviso de nível"}], [X_PARC], status="confirmado")

# --- Fila diária
fluxo("2.1", [D2("Q-0006"), VP(CS, 2), D2("Q-0014")], [GP],
      [no("i1", "inicio", "Início do dia de trabalho no programa", gatilho="tempo"), no("t1", "tarefa", "Abrir a fila ordenada por prazo", **SIS),
       no("g1", "decisao", "Quem executa a tarefa?"), no("t2", "tarefa", "Concluir a tarefa e registrar o resultado", **SIS),
       no("t3", "tarefa", "Combinar com quem executa, pessoalmente ou por mensagem"), no("e1", "espera", "Retorno de quem executa", evento="mensagem"),
       no("t4", "tarefa", "Registrar o retorno na tarefa", **SIS), no("g2", "decisao", "Ainda há tarefa vencendo hoje?"), no("f1", "fim", "Fila do dia tratada")],
      L(("i1", "t1"), ("t1", "g1"), ("g1", "t2", "O Gerente"), ("g1", "t3", "Closer, financeiro ou parceiro"), ("t3", "e1"), ("e1", "t4"),
        ("t2", "g2"), ("t4", "g2"), ("g2", "t1", "Sim"), ("g2", "f1", "Não")),
      [{"de": "t3", "para": "X1", "rotulo": "Pedido"}, {"de": "X1", "para": "e1", "rotulo": "Retorno"}], [{"id": "X1", "nome": "Quem executa (closer, financeiro ou parceiro)"}], status="confirmado")

# --- Fechamento trimestral
fluxo("2.4", [S("s2", "Revisão: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre.", "Apêndice B"), VF(KS, 0, 0)], [GP, DIR],
      [no("i1", "inicio", "Primeiro dia útil do trimestre", gatilho="tempo"), sub("s1", "3.4"), sub("s2", "3.3", **H), sub("s3", "3.5", **H),
       no("t1", "tarefa", "Agendar as revisões conjuntas do trimestre", **SIS), no("t2", "tarefa", "Enviar ao Diretor o resumo do trimestre", **SIS), no("f1", "fim", "Trimestre fechado")],
      L(("i1", "s1"), ("s1", "s2"), ("s2", "s3"), ("s3", "t1"), ("t1", "t2"), ("t2", "f1")))

# --- Revisão conjunta
fluxo("7.2", [D("Q-0017"), D("Q-0018"), F(AN, 0, 3)], [GP, DIR],
      [no("i1", "inicio", "Data da revisão pela cadência", gatilho="tempo"), no("t1", "tarefa", "Montar a pauta com os dados do parceiro", **AUTO),
       no("g1", "decisao", "Parceiro Elite?"), no("t2", "tarefa", "Convidar o Diretor", **WPP), no("t3", "tarefa", "Conduzir a revisão com o parceiro"),
       no("t4", "tarefa", "Registrar a ata e as ações", **SIS), no("f1", "fim", "Plano do próximo período combinado")],
      L(("i1", "t1"), ("t1", "g1"), ("g1", "t2", "Sim"), ("g1", "t3", "Não"), ("t2", "t3"), ("t3", "t4"), ("t4", "f1")),
      [{"de": "t3", "para": "X1", "rotulo": "Pauta e resultados"}], [X_PARC], status="confirmado")

for p in d["processos"]:
    if not p.get("fluxo") and not any(x.get("pai") == p["id"] for x in d["processos"]):
        p["fluxo_dispensado"] = f"{DE_FLUXO}: não vira quadro, fila ou ritual próprio; fica no nível de dono, gatilho e entregas"

# ---------------------------------------------------------------- objetos
OBJ = {}
for k, nome, cria, usa, encerra, estados, evs, status in [
    ("parceiro", "Parceiro (um card na jornada, do candidato ao encerramento)", "M4", ["M5", "M7", "M8"], "M9",
     ["Candidato em conversa", "Em negociação", "Em integração (marcos dentro do card)", "Ativo (tipo do cubo)", "Em risco (tipo de risco)", "Encerrado"], [D2("Q-0006"), F(AN, 0, 0)], "confirmado"),
    ("oportunidade", "Oportunidade compartilhada (um card por oportunidade, com a porta de origem)", "6.1", ["6.2", "6.3", "6.4", "6.6"], "6.7",
     ["Recebida", "Qualificada", "Com o closer", "Em venda", "Fechada", "Perdida", "Recusada"], [D2("Q-0002"), F(EP, 0, 1)], "confirmado"),
    ("tarefa", "Tarefa (fila única por exceção, dono sempre o Gerente de Parcerias)", "2.1", ["2.2", "2.3"], "2.1", ["Aberta", "Aguardando quem executa", "Concluída"], [D2("Q-0006"), D("Q-0013")], "confirmado"),
]:
    OBJ[k] = add("objetos", "OB", nome=nome, ciclo={"cria": P[cria], "usa": [P[u] for u in usa], "encerra": P[encerra]}, estados=estados, status=status, evidencias=evs)

# ---------------------------------------------------------------- glossário: os oito tipos do cubo e os termos centrais
TIPOS = FTJ["proposta"]["tipos"]
for t in TIPOS:
    add("glossario", "GL", termo="Tipo " + t["nome"], definicao=f"{t['regra']}. Ação: {t['acao']} Abordagem: {t['abordagem']} Cadência: {t['cadencia']}", sinonimos=[], evidencias=[FTC(6), FTC(2)])
for termo, definicao, evs in [
    ("Valor (fator do cubo)", next(f["definicao"] + " " + f["como_medir_no_portal"] for f in FTJ["proposta"]["fatores"] if f["nome"].startswith("Valor")), [FTC(6)]),
    ("Ritmo (fator do cubo)", next(f["definicao"] + " " + f["como_medir_no_portal"] for f in FTJ["proposta"]["fatores"] if f["nome"].startswith("Ritmo")), [VF(CS, 1, 1)]),
    ("Relação (fator do cubo)", next(f["definicao"] + " " + f["como_medir_no_portal"] for f in FTJ["proposta"]["fatores"] if f["nome"].startswith("Relação")), [FTC(16), VF(GT, 0, 0)]),
    ("Potencial", next(f["definicao"] + " " + f["como_medir_no_portal"] for f in FTJ["proposta"]["fatores"] if f["nome"].startswith("Potencial")), [FTC(0, 7)]),
    ("Oportunidade compartilhada", "Unidade de valor do programa: uma indústria com necessidade conhecida conectada, com contexto, a quem resolve.", [F(EP, 0, 1)]),
    ("Parceiro ativo", "Parceiro que já teve a primeira indicação no ICP que virou reunião.", [A("EV-0110")]),
    ("Exceção", "O que fugiu da regra e por isso vira tarefa na fila; o que segue a regra não gera trabalho.", [VP(CS, 2)]),
    ("Texto único", "Minuta que circula como rascunho pedindo críticas até as duas partes aprovarem; o Diretor só assina.", [D2("Q-0011")]),
]:
    add("glossario", "GL", termo=termo, definicao=definicao, sinonimos=[], evidencias=evs)

add("cadeias_de_valor", "CV", nome="Jornada do parceiro: do candidato ao parceiro em crescimento", gatilho="Candidato identificado", valor="Parceiro ativo, gerando e recebendo oportunidades",
    stakeholder="Empresa parceira", ofertas=[OF1, OF2],
    etapas=[{"nome": "Atrair e selecionar", "processos": [P["M4"]]}, {"nome": "Integrar e ativar", "processos": [P["M5"]]}, {"nome": "Desenvolver", "processos": [P["M7"]]},
            {"nome": "Pertencer", "processos": [P["M8"]]}, {"nome": "Reter ou encerrar", "processos": [P["M9"]]}],
    status="confirmado", evidencias=[F(PP, 1, 0), D2("Q-0006")])
add("cadeias_de_valor", "CV", nome="Da necessidade da indústria ao cliente fechado com CAC menor", gatilho="Uma das quatro portas gera uma oportunidade",
    valor="Cliente novo para o grupo com custo de aquisição menor que os canais ativos, demanda e comissão para o parceiro", stakeholder="Indústria e parceiro", ofertas=[OF1],
    etapas=[{"nome": "Receber e qualificar", "processos": [P["6.1"]]}, {"nome": "Entregar ao closer", "processos": [P["6.2"]]}, {"nome": "Fechar o ciclo com o parceiro", "processos": [P["6.3"]]},
            {"nome": "Vender (fora do escopo)", "processos": []}, {"nome": "Pagar e checar", "processos": [P["6.7"], P["6.8"]]}, {"nome": "Apurar o CAC", "processos": [P["3.1"]]}],
    status="confirmado", evidencias=[D2("Q-0015"), F(EP, 0, 0)])
