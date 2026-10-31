# Parte 3 do to-be: fluxos dos funis, perguntas, ideias e formulário. Executado dentro de tobe.py.

# saídas apontando para chaves internas viram ids reais
for p in d["processos"]:
    for s in p.get("saidas", []):
        if s["para"].startswith("P-") and s["para"][2:] in P:
            s["para"] = P[s["para"][2:]]
# no to-be o desenho dos dois lados de cada passagem é o mesmo: a entrada espelha a saída
for p in d["processos"]:
    for s in p.get("saidas", []):
        alvo = next((x for x in d["processos"] if x["id"] == s["para"]), None)
        if alvo is not None and not any(e.get("de") == p["id"] for e in alvo.get("entradas", [])):
            alvo.setdefault("entradas", []).append({"nome": s["nome"], "de": p["id"]})

def no(i, tipo, nome="", raia=GP, **kw):
    return {"id": i, "tipo": tipo, **({"nome": nome} if nome else {}), "raia": raia, **kw}

def L(*pares):
    return [{"de": a, "para": b, **({"rotulo": r[0]} if r else {})} for a, b, *r in pares]

def fluxo(chave, evs, raias, nos, ligacoes, mensagens=(), externos=(), status="declarado"):
    proc_obj = next(x for x in d["processos"] if x["id"] == P[chave])
    proc_obj["fluxo"] = {"status": status, "evidencias": evs, "raias": raias, "externos": list(externos), "nos": nos, "ligacoes": ligacoes, "mensagens": list(mensagens)}
    proc_obj["fluxo_dispensado"] = None

H = {"status": "hipotese"}
AUTO = {"sistema": SI_POR, "modo": "automatico"}
SIS = {"sistema": SI_POR, "modo": "sistema"}

# ---------------- 1. Captar parceiros (funil Recrutamento)
fluxo("F1", [S("s2", "O funil ganha a etapa \"qualificação\" (scorecard), entre \"reunião realizada\" e \"proposta com o decisor\", e o estado \"nutrição\" para quem ainda não é a hora", "User Story 9"),
             S("s1", "Perdas são registradas com motivo.", "User Story 4"), U("EV-0106")],
      [GP], [no("i1", "inicio", "Revisão mensal da lista", gatilho="tempo"),
             no("s0", "subprocesso", "Montar a lista de candidatos", processo=P["F1_lista"], **H),
             no("s1", "subprocesso", "Abordar candidato", processo=P["F1_abordar"]),
             no("e1", "espera", "Resposta do candidato", evento="mensagem"),
             no("s2", "subprocesso", "Apresentar o programa e mapear interesses", processo=P["F1_apresentar"]),
             no("s3", "subprocesso", "Qualificar candidato no scorecard", processo=P["F1_qualificar"]),
             no("g1", "decisao", "Candidato elegível?"),
             no("g2", "decisao", "Candidato quer seguir agora?"),
             no("s4", "subprocesso", "Nutrir candidato", processo=P["F1_nutrir"]),
             no("s5", "subprocesso", "Negociar e formalizar o termo", processo=P["F1_formalizar"]),
             no("f1", "fim", "Candidato não elegível"), no("f2", "fim", "Candidato sem interesse"), no("f3", "fim", "Termo assinado")],
      L(("i1", "s0"), ("s0", "s1"), ("s1", "e1"), ("e1", "s2"), ("s2", "s3"), ("s3", "g1"), ("g1", "g2", "Sim"), ("g1", "f1", "Não"),
        ("g2", "s5", "Sim"), ("g2", "s4", "Agora não"), ("g2", "f2", "Não"), ("s4", "s2"), ("s5", "f3")),
      [{"de": "s1", "para": "X1", "rotulo": "Abordagem"}, {"de": "X1", "para": "e1", "rotulo": "Resposta"}, {"de": "s5", "para": "X1", "rotulo": "Minuta do termo"}],
      [{"id": "X1", "nome": "Empresa candidata"}])

# ---------------- 2. Negociar e formalizar o termo
fluxo("F1_formalizar", [S("s1", "Na negociação, o usuário preenche o Quadro de Identificação e o portal gera a minuta do contrato", "User Story 4"),
                        S("s1", "O contrato é enviado para assinatura no Autentique fora do portal, e o PDF assinado é anexado.", "User Story 4"), U("EV-0106"), U("EV-0107"),
                        B("getting-to-yes", "Conduzir a minuta do termo como texto único"), B("getting-to-yes", "Registrar, para cada negociação, a melhor alternativa")],
      [GP, DIR], [no("i1", "inicio", "Candidato qualificado quer seguir"),
                  no("t1", "tarefa", "Criar o grupo de WhatsApp da parceria", sistema=SI_WPP, modo="sistema"),
                  no("t2", "tarefa", "Registrar interesses, decisores e alternativas", descricao="Interesses dos dois lados, quem decide no candidato, a melhor alternativa de cada lado e o pacote gatilho que exige o Diretor.", **H, **SIS),
                  no("t3", "tarefa", "Preencher o quadro de identificação", **SIS),
                  no("t4", "tarefa", "Gerar a minuta do termo", **AUTO),
                  no("t5", "tarefa", "Colher as críticas do candidato à minuta", descricao="A minuta circula como texto único: pede-se crítica, não concessão.", **H),
                  no("g0", "decisao", "Candidato aceita os termos?"),
                  no("t6", "tarefa", "Aprovar a assinatura", raia=DIR, **SIS),
                  no("g1", "decisao", "Assinatura aprovada?", raia=DIR),
                  no("t7", "tarefa", "Ajustar a minuta"),
                  no("t8", "tarefa", "Enviar o termo para assinatura", sistema=SI_AUT, modo="sistema"),
                  no("e1", "espera", "Termo assinado pelo candidato", evento="mensagem"),
                  no("t9", "tarefa", "Anexar o termo assinado", **SIS),
                  no("f1", "fim", "Termo assinado"), no("f2", "fim", "Negociação perdida")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "t3"), ("t3", "t4"), ("t4", "t5"), ("t5", "g0"), ("g0", "t6", "Sim"), ("g0", "f2", "Não"),
        ("t6", "g1"), ("g1", "t8", "Sim"), ("g1", "t7", "Não"), ("t7", "t6"), ("t8", "e1"), ("e1", "t9"), ("t9", "f1")),
      [{"de": "t1", "para": "X1", "rotulo": "Convite para o grupo"}, {"de": "t5", "para": "X1", "rotulo": "Minuta para críticas"},
       {"de": "t8", "para": "X1", "rotulo": "Termo para assinatura"}, {"de": "X1", "para": "e1", "rotulo": "Termo assinado"}],
      [{"id": "X1", "nome": "Empresa candidata"}])
Q("negociacao", "Na negociação, o que o portal deve apoiar? (os livros recomendam os quatro)", "multipla",
  ["Registrar interesses e quem decide no candidato", "Registrar a melhor alternativa de cada lado e um pacote gatilho que exige o Diretor",
   "Circular a minuta como texto único, pedindo críticas e não concessões", "Workshop curto de alinhamento com a diretoria do candidato antes de assinar"],
  [P["F1_formalizar"] + ".fluxo"], "Captar parceiros")

# ---------------- 3. Integrar parceiro (funil Onboarding)
fluxo("F2", [S("s2", "o portal cria o plano de 90 dias com quatro encontros (alinhamento, vendas, produto e pós-venda) e os marcos de 30, 60 e 90 dias (Apêndice F)", "User Story 5"),
             S("s2", "Sem ativação em 90 dias, o responsável recebe alerta e o plano ganha uma extensão até 120 dias; sem ativação em 120 dias, o parceiro fica marcado como \"não ativado\".", "User Story 5"), U("EV-0110")],
      [GP, RESP], [no("i1", "inicio", "Termo assinado"),
                   no("s1", "subprocesso", "Entregar os itens de entrada do pacote", processo=P["F2_entrada"]),
                   no("t1", "tarefa", "Conduzir o encontro de alinhamento", descricao="Até 7 dias: objetivos, proposta de valor, régua, metas dos 90 dias, link de indicação e convite para a trilha."),
                   no("s2", "subprocesso", "Cruzar carteiras com o parceiro", processo=P["F2_cruzar"], **H),
                   no("t2", "tarefa", "Conduzir o encontro de vendas", descricao="Até 30 dias."),
                   no("s3", "subprocesso", "Capacitar e certificar pessoas do parceiro", raia=RESP, processo=P["F2_capacitar"]),
                   no("t3", "tarefa", "Conduzir o encontro de produto", descricao="Até 60 dias."),
                   no("t4", "tarefa", "Conduzir o encontro de pós-venda", descricao="Até 90 dias."),
                   no("g1", "decisao", "Parceiro ativado em 90 dias?"),
                   no("t5", "tarefa", "Estender o plano até 120 dias", **AUTO),
                   no("g2", "decisao", "Parceiro ativado em 120 dias?"),
                   no("f1", "fim", "Parceiro ativado"), no("f2", "fim", "Parceiro não ativado")],
      L(("i1", "s1"), ("s1", "t1"), ("t1", "s2"), ("s2", "t2"), ("t2", "s3"), ("s3", "t3"), ("t3", "t4"), ("t4", "g1"),
        ("g1", "f1", "Sim"), ("g1", "t5", "Não"), ("t5", "g2"), ("g2", "f1", "Sim"), ("g2", "f2", "Não")))

# ---------------- 4. Tratar indicação do parceiro (funil Indicações)
fluxo("F3_indicacao", [S("s2", "| Parceiro para o grupo | Confirmação de recebimento ao parceiro | Imediata, automática |", "Apêndice E"),
                       S("s2", "| Parceiro para o grupo | Validação (duplicidade e ICP) e primeiro contato com o cliente | 2 dias úteis |", "Apêndice E"),
                       S("s2", "| Parceiro para o grupo | Retorno ao parceiro sobre o primeiro contato | 5 dias úteis do registro |", "Apêndice E"),
                       B("nearbound", "Fechar o ciclo com o parceiro a cada indicação")],
      [GP, CONS], [no("i1", "inicio", "Indicação recebida", gatilho="mensagem"),
                   no("t1", "tarefa", "Confirmar o recebimento ao parceiro", **AUTO),
                   no("t2", "tarefa", "Validar duplicidade e ICP", descricao="Até 2 dias úteis.", **SIS),
                   no("g1", "decisao", "Indicação válida?"),
                   no("t3", "tarefa", "Informar o motivo da recusa ao parceiro"),
                   no("t4", "tarefa", "Contatar o cliente indicado", raia=CONS, descricao="Até 2 dias úteis do registro. Quem faz este contato ainda é decisão em aberto.", **H),
                   no("t5", "tarefa", "Retornar ao parceiro sobre o primeiro contato", descricao="Até 5 dias úteis do registro."),
                   no("t6", "tarefa", "Atualizar a indicação a cada etapa da venda", raia=CONS, descricao="No mínimo a cada 15 dias corridos.", **SIS),
                   no("g2", "decisao", "Cliente fechou?", raia=CONS),
                   no("s1", "subprocesso", "Pagar comissão ao parceiro", processo=P["F3_comissao"]),
                   no("t7", "tarefa", "Informar a perda ao parceiro"),
                   no("f1", "fim", "Indicação recusada"), no("f2", "fim", "Cliente fechado e comissão paga"), no("f3", "fim", "Indicação perdida")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "g1"), ("g1", "t4", "Sim"), ("g1", "t3", "Não"), ("t3", "f1"), ("t4", "t5"), ("t5", "t6"), ("t6", "g2"),
        ("g2", "s1", "Sim"), ("g2", "t7", "Não"), ("s1", "f2"), ("t7", "f3")),
      [{"de": "X1", "para": "i1", "rotulo": "Indicação"}, {"de": "t1", "para": "X1", "rotulo": "Confirmação de recebimento"}, {"de": "t3", "para": "X1", "rotulo": "Motivo da recusa"},
       {"de": "t4", "para": "X2", "rotulo": "Primeiro contato"}, {"de": "t5", "para": "X1", "rotulo": "Retorno sobre o primeiro contato"},
       {"de": "t7", "para": "X1", "rotulo": "Motivo da perda"}, {"de": "s1", "para": "X1", "rotulo": "Comissão"}],
      [{"id": "X1", "nome": "Parceiro"}, {"id": "X2", "nome": "Cliente indicado"}])
Q("primeiro_contato", "Quem faz o primeiro contato com o cliente indicado (até 2 dias úteis)?", "escolha",
  ["O consultor ou comercial da empresa que vai atender (recomendado: quem fecha é dono da conta)", "O Gerente de Parcerias, que depois passa ao consultor", "Depende da empresa do grupo"],
  [P["F3_indicacao"] + ".fluxo"], "Gerar negócios")

# ---------------- 5. Atender pedido de fornecedor pela prateleira (funil Pedidos da prateleira)
fluxo("F3_rfp", [S("s1", "O cliente nunca faz o pedido sozinho. Quando precisa de um fornecedor fora do escopo da Wise, ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9"),
                 S("s1", "Given a página publicada, When salva, Then o sistema cria uma indicação da empresa do consultor para cada parceiro apresentado, com origem \"pedido de RFP\"", "User Story 9, cenário 6"),
                 S("s1", "Given um pedido sem fornecedor em alguma categoria, When registrado, Then a necessidade entra no relatório de categorias a prospectar.", "User Story 9, cenário 8")],
      [CONS], [no("i1", "inicio", "Cliente pede um fornecedor", raia=CONS, gatilho="mensagem"),
               no("t1", "tarefa", "Registrar o pedido do cliente", raia=CONS, **SIS),
               no("t2", "tarefa", "Recomendar parceiros por categoria", raia=CONS, **AUTO),
               no("g1", "decisao", "Há parceiros assinados na categoria?", raia=CONS),
               no("t3", "tarefa", "Registrar a categoria a prospectar", raia=CONS, **AUTO),
               no("t4", "tarefa", "Ajustar a seleção de parceiros", raia=CONS, descricao="No mínimo 3 por categoria sempre que houver 3 ou mais assinados.", **SIS),
               no("t5", "tarefa", "Montar a página do cliente", raia=CONS, **AUTO),
               no("t6", "tarefa", "Revisar e publicar a página", raia=CONS, **SIS),
               no("e1", "espera", "Cliente escolhe falar com um parceiro", raia=CONS, evento="mensagem"),
               no("t7", "tarefa", "Avisar o consultor e o parceiro", raia=CONS, **AUTO),
               no("f1", "fim", "Categoria sem fornecedor", raia=CONS), no("f2", "fim", "Cliente em contato com o parceiro", raia=CONS)],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "g1"), ("g1", "t4", "Sim"), ("g1", "t3", "Não"), ("t3", "f1"), ("t4", "t5"), ("t5", "t6"), ("t6", "e1"), ("e1", "t7"), ("t7", "f2")),
      [{"de": "X1", "para": "i1", "rotulo": "Necessidade"}, {"de": "t6", "para": "X1", "rotulo": "Link da página"},
       {"de": "X1", "para": "e1", "rotulo": "Clique em falar com o parceiro"}, {"de": "t7", "para": "X2", "rotulo": "Aviso de contato"}],
      [{"id": "X1", "nome": "Cliente industrial"}, {"id": "X2", "nome": "Parceiro"}])

# ---------------- 6. Conduzir o ciclo do Base Ativa (funil Base Ativa)
fluxo("F4_base", [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7"),
                  U("EV-0050"), U("EV-0092"), U("EV-0093"), U("EV-0094"), U("EV-0095"), U("EV-0096"), U("EV-0097"), U("EV-0098"), U("EV-0051")],
      [GP, RESP], [no("i1", "inicio", "Parceiro de pacote A assinado"),
                   no("g1", "decisao", "Há horas disponíveis?"),
                   no("t1", "tarefa", "Colocar o parceiro na fila com a data prevista", **SIS),
                   no("e1", "espera", "Vez do parceiro na fila", evento="tempo"),
                   no("t2", "tarefa", "Diagnosticar a base do parceiro"),
                   no("t3", "tarefa", "Categorizar a carteira", raia=RESP),
                   no("t4", "tarefa", "Definir estrutura e anúncio da comunidade"),
                   no("t5", "tarefa", "Definir oferta e nutrição", sistema=SI_HUB, modo="sistema"),
                   no("t6", "tarefa", "Planejar formação e evento"),
                   no("t7", "tarefa", "Preparar roteiro, divulgação e logística do evento"),
                   no("t8", "tarefa", "Promover o evento da comunidade", raia=RESP),
                   no("t9", "tarefa", "Emitir o certificado metodológico", **SIS),
                   no("f1", "fim", "Comunidade validada")],
      L(("i1", "g1"), ("g1", "t2", "Sim"), ("g1", "t1", "Não"), ("t1", "e1"), ("e1", "t2"), ("t2", "t3"), ("t3", "t4"), ("t4", "t5"), ("t5", "t6"),
        ("t6", "t7"), ("t7", "t8"), ("t8", "t9"), ("t9", "f1")))

# ---------------- 7. Revisar o nível dos parceiros (lista trimestral)
fluxo("G_nivel", [S("s2", "Revisão: primeiro dia útil de janeiro, abril, julho e outubro. Quem não cumpre o nível atual fica em observação por um trimestre.", "Apêndice B"),
                  S("s2", "Na revisão seguinte, se ainda não cumprir, o portal propõe descer um nível; a decisão é de uma pessoa, com motivo.", "Apêndice B"),
                  S("s2", "Isentos: assinados há menos de 180 dias e pausados.", "Apêndice B"), U("EV-0109")],
      [GP], [no("i1", "inicio", "Primeiro dia útil do trimestre", gatilho="tempo"),
             no("t1", "tarefa", "Apurar os requisitos de cada parceiro", **AUTO),
             no("g0", "decisao", "Parceiro isento?"),
             no("g1", "decisao", "Cumpre o nível atual?"),
             no("g2", "decisao", "Já estava em observação?"),
             no("t2", "tarefa", "Colocar em observação e avisar o que falta", **AUTO),
             no("t3", "tarefa", "Propor a descida de nível", **AUTO),
             no("t4", "tarefa", "Decidir a descida com motivo", **SIS),
             no("g3", "decisao", "Descer de nível?"),
             no("f0", "fim", "Parceiro isento"), no("f1", "fim", "Nível mantido"), no("f2", "fim", "Parceiro em observação"), no("f3", "fim", "Nível rebaixado")],
      L(("i1", "t1"), ("t1", "g0"), ("g0", "f0", "Sim"), ("g0", "g1", "Não"), ("g1", "f1", "Sim"), ("g1", "g2", "Não"), ("g2", "t2", "Não"), ("t2", "f2"),
        ("g2", "t3", "Sim"), ("t3", "t4"), ("t4", "g3"), ("g3", "f3", "Sim"), ("g3", "f1", "Não")),
      [{"de": "t2", "para": "X1", "rotulo": "Aviso do que falta"}, {"de": "t4", "para": "X1", "rotulo": "Aviso de nível"}], [{"id": "X1", "nome": "Parceiro"}])

# ---------------- 8. Reter ou encerrar a parceria (funil Parceiros em risco)
fluxo("F5", [S("s2", "Primeira tentativa de retomada: próximo passo criado na hora, com mensagem sugerida que propõe uma reunião.", "Apêndice D"),
             S("s2", "Segunda tentativa: no mínimo 15 dias depois da primeira, registrada como ponto de contato.", "Apêndice D"),
             S("s2", "Sugestão de desligamento: 30 dias depois da segunda tentativa sem resposta ou sem nova atividade do parceiro.", "Apêndice D"),
             S("s2", "Aviso formal: texto gerado pelo portal, enviado pelo responsável, com encerramento em 30 dias (cláusula 13.4 do contrato).", "Apêndice D")],
      [GP, DIR], [no("i1", "inicio", "Parceiro em risco"),
                  no("t1", "tarefa", "Propor reunião de retomada", **SIS),
                  no("e1", "espera", "15 dias", evento="tempo"),
                  no("t2", "tarefa", "Registrar a segunda tentativa de retomada", **SIS),
                  no("e2", "espera", "30 dias", evento="tempo"),
                  no("g1", "decisao", "Parceiro voltou a ter atividade?"),
                  no("t3", "tarefa", "Sugerir o desligamento", **AUTO),
                  no("t4", "tarefa", "Aprovar o desligamento", raia=DIR, **SIS),
                  no("g2", "decisao", "Desligamento aprovado?", raia=DIR),
                  no("t5", "tarefa", "Enviar o aviso formal"),
                  no("e3", "espera", "30 dias de aviso", evento="tempo"),
                  no("t6", "tarefa", "Encerrar a parceria e revogar acessos", **AUTO),
                  no("f1", "fim", "Parceiro retomado"), no("f2", "fim", "Parceiro mantido"), no("f3", "fim", "Parceria encerrada")],
      L(("i1", "t1"), ("t1", "e1"), ("e1", "t2"), ("t2", "e2"), ("e2", "g1"), ("g1", "f1", "Sim"), ("g1", "t3", "Não"), ("t3", "t4"), ("t4", "g2"),
        ("g2", "f2", "Não"), ("g2", "t5", "Sim"), ("t5", "e3"), ("e3", "t6"), ("t6", "f3")),
      [{"de": "t1", "para": "X1", "rotulo": "Convite para reunião"}, {"de": "t2", "para": "X1", "rotulo": "Segunda tentativa"}, {"de": "t5", "para": "X1", "rotulo": "Aviso formal"}],
      [{"id": "X1", "nome": "Parceiro"}])

# ================================================================ decisões de desenho (sem elemento hipotético único)
Q("funis", "Estes são os funis (kanbans) do portal, e as tarefas nascem das etapas deles. Quais você confirma?", "multipla",
  ["Recrutamento (captar parceiros)", "Onboarding (até a ativação)", "Indicações", "Pedidos da prateleira", "Base Ativa", "Parceiros em risco (retomada e desligamento)",
   "Revisão de nível (lista trimestral, não kanban)", "Ações conjuntas (calendário, não kanban)"],
  [P[k] + ".fluxo" for k in ("F1", "F2", "F3_indicacao", "F3_rfp", "F4_base", "F5", "G_nivel")], "Funis e tarefas")
Q("comissao", "Os livros apontam 5 a 15% para quem só indica e 30 a 40% para quem revende; a Wise paga 40% da primeira mensalidade, uma vez. Como fica?", "escolha",
  ["Manter 40% da primeira mensalidade, como no contrato", "Manter 40%, mas só para indicação qualificada pela nota de qualidade", "Revisar o percentual (comente)"],
  [F["receita"], "NOVO.comissao"], "Modelo de negócio")
Q("ancoras", "Os primeiros parceiros (âncoras) recebem condições de fundador com prazo, para atrair os seguintes?", "escolha",
  ["Sim, com prazo definido (comente qual)", "Não, as mesmas regras para todos desde o início"], ["NOVO.parceiros_ancora"], "Captar parceiros")
Q("credito", "Quem fecha um negócio indicado por parceiro recebe crédito integral na própria meta, mesmo com a comissão paga ao parceiro?", "escolha",
  ["Sim (recomendado: ninguém perde por trabalhar com parceiro)", "Não", "Não sei: perguntar ao Igor"], ["NOVO.credito_meta"], "Gerar negócios")
Q("dono_conta", "Quem é o dono do cliente indicado?", "escolha",
  ["Quem fecha é dono durante a venda; depois, a equipe que entrega. O Gerente de Parcerias é dono da relação com o parceiro (recomendado)", "O Gerente de Parcerias até o fechamento", "Outro (comente)"],
  ["NOVO.dono_da_conta"], "Gerar negócios")
Q("metas_dono", "Quem define as metas do programa e a fase?", "escolha", ["O Igor", "Eu", "Nós dois juntos", "Os sócios"], [P["G_metas"] + ".dono"], "Gestão do programa")
Q("comunicados", "Quem decide e publica as regras do programa e os comunicados aos parceiros?", "escolha", ["Eu", "O Igor", "Eu, com aprovação do Igor"], [P["G_regras"] + ".dono"], "Gestão do programa")

# ================================================================ ideias dos livros para depois (fora do desenho mínimo)
for texto, slug, needle in [
    ("Marcar como lead do ecossistema a indicação de empresa que também está na carteira de outro parceiro e comparar a conversão.", "ecosystem-led-growth", "Marcar como lead qualificado pelo ecossistema"),
    ("Alertar quando uma oportunidade da Wise avança sem parceiro anexado e existe parceiro com aquela conta na carteira.", "ecosystem-led-growth", "Gerar alerta para a Gerente de Parcerias"),
    ("Estruturar o cruzamento na matriz 3x3 (prospects, oportunidades e clientes de cada lado), com uma jogada por célula.", "ecosystem-led-growth", "Estruturar o cruzamento na matriz 3x3"),
    ("Registrar o saldo de ajuda dada e recebida com cada parceiro e devolver algo a cada pedido.", "nearbound", "Para cada pedido feito ao parceiro, devolver algo"),
    ("Perguntar ao cliente, em campo aberto, quem o indicou ou influenciou, e cruzar com o registro do portal.", "nearbound", "Perguntar ao cliente em campo aberto"),
    ("Plano de contas conjuntas (5 clientes de cada lado e 5 novos logos em comum) só para parceiros Elite.", "nearbound", "Reservar o plano de contas conjuntas"),
    ("Entrevista estruturada anual com cada parceiro, perguntando que negócio a Wise pode ajudar a fechar hoje.", "channel-advantage", "Fazer ao menos uma entrevista estruturada por parceiro"),
    ("Mesmo preço da consultoria para cliente indicado e cliente direto, para não criar conflito de canal.", "channel-advantage", "Manter o mesmo preço da consultoria"),
    ("Mapear a rede de valor (clientes, fornecedores, complementadores e concorrentes) de cada candidato antes da primeira reunião.", "co-opetition", "Mapear a Value Net da Wise e de cada candidato"),
    ("Auditar a prateleira a cada trimestre pelas quatro causas de falha de mercado.", "platform-revolution", "Auditar a prateleira a cada trimestre"),
    ("Antes de abrir nova categoria de parceiro, testar se a nova categoria aceita a liderança da Wise e se os atuais continuam aceitando o próprio papel.", "winning-the-right-game", "Antes de abrir uma nova categoria de parceiro"),
    ("Montar a planilha do programa como negócio à parte (receita, comissão, custo do time) e ler o resultado por fase.", "ecossistema-de-parceiros", "Projetar o programa de parcerias como um negócio à parte"),
    ("Reunir parceiros que competem entre si no mesmo evento ou comunidade, porque a presença conjunta cria o mercado para todos.", "co-opetition", "Reunir parceiros que competem entre si"),
    ("Monitorar sinais de abandono (menos contatos, ausência em reuniões e eventos) e acionar a revisão antes que o parceiro suma.", "strategic-alliances", "Monitorar sinais de abandono"),
]:
    add("ideias", "ID", texto=texto, processo=None, evidencias=[B(slug, needle)])

# ================================================================ glossário e objetos
for termo, definicao, evs in [
    ("Parceiro ativo", "Parceiro que já teve a primeira indicação com ICP confirmado que virou reunião.", [S("s2", "O onboarding termina na ativação: a primeira indicação do parceiro com ICP confirmado pela Wise que virou reunião.", "User Story 5")]),
    ("Indicação qualificada", "Indicação com todos os critérios do ICP confirmados pela Wise, com CNPJ e necessidade informados.", [S("s2", "Qualificada: todos os critérios do ICP confirmados pela Wise, com CNPJ e necessidade informados.", "Apêndice E")]),
    ("Funil", "Kanban de um processo repetitivo, com as etapas do processo como colunas; as tarefas nascem das etapas.", [U("EV-0009")]),
    ("Faixa de desempenho", "Destaque (5% do topo), potencial (15% seguintes) e base, pela pontuação do ranking.", [S("s2", "destaque (5% do topo, no mínimo 1), potencial (15% seguintes, no mínimo 1) e base (os demais)", "User Story 12")]),
]:
    add("glossario", "GL", termo=termo, definicao=definicao, sinonimos=[], evidencias=evs)
for nome, cria, usa, encerra, evs in [
    ("Parceiro", "F1", ["F2", "F3", "F4"], "F5", [S("s1", "Abre a ficha de qualquer parceiro e encontra em um só lugar", "User Story 1")]),
    ("Indicação", "F3_indicacao", ["F3_comissao", "F3_checar"], "F3_indicacao", [S("s1", "A indicação guarda cliente, origem, aderência ao ICP, etapa, valores e comissões.", "User Story 6")]),
    ("Pedido da prateleira", "F3_rfp", ["S1"], "F3_rfp", [S("s1", "O cliente nunca faz o pedido sozinho.", "User Story 9")]),
    ("Ciclo do Base Ativa", "F4_base", [], "F4_base", [S("s1", "Para parceiros do pacote A, o portal controla a fila do Base Ativa e o ciclo de 12 semanas, com 6 encontros e o evento final.", "User Story 7")]),
]:
    add("objetos", "OB", nome=nome, ciclo={"cria": P[cria], "usa": [P[u] for u in usa], "encerra": P[encerra]}, status="declarado", evidencias=evs)

# ================================================================ cadeias de valor
add("cadeias_de_valor", "CV", nome="Do candidato ao parceiro produtivo", gatilho="Empresa candidata entra na lista", valor="Parceiro ativo, indicando clientes no ICP e recebendo valor do programa",
    stakeholder="Empresa parceira", ofertas=[OF1, OF2],
    etapas=[{"nome": "Captar", "processos": [P["F1"]]}, {"nome": "Integrar", "processos": [P["F2"]]}, {"nome": "Gerar negócios", "processos": [P["F3_indicacao"], P["F3_rfp"]]},
            {"nome": "Desenvolver", "processos": [P["F4_base"], P["F4_acao"], P["F4_regua"]]}, {"nome": "Reter ou encerrar", "processos": [P["F5"]]}],
    status="declarado", evidencias=[S("s2", "O painel semanal passa a ser organizado pelas quatro etapas da jornada do parceiro (captação, onboarding, relacionamento e produção)", "User Story 7")])
add("cadeias_de_valor", "CV", nome="Da indicação ao cliente fechado e à comissão paga", gatilho="Parceiro indica um cliente", valor="Cliente novo no ICP para o grupo e comissão paga ao parceiro",
    stakeholder="Parceiro que indicou", ofertas=[OF1],
    etapas=[{"nome": "Tratar indicação", "processos": [P["F3_indicacao"]]}, {"nome": "Vender ao indicado (fora do escopo)", "processos": []},
            {"nome": "Pagar comissão", "processos": [P["F3_comissao"]]}, {"nome": "Checar o cliente", "processos": [P["F3_checar"]]}],
    status="declarado", evidencias=[S("s1", "O sistema calcula a comissão devida ao parceiro e a do responsável pela parceria conforme a regra de cada empresa", "User Story 6")])
add("cadeias_de_valor", "CV", nome="Da necessidade do cliente industrial ao fornecedor parceiro", gatilho="Cliente do grupo precisa de fornecedor fora do escopo da Wise",
    valor="Cliente atendido por fornecedor verificado e demanda de volta para o parceiro", stakeholder="Cliente industrial", ofertas=[OF1],
    etapas=[{"nome": "Atender o pedido", "processos": [P["F3_rfp"]]}, {"nome": "Manter a prateleira", "processos": [P["S1"]]}],
    status="declarado", evidencias=[S("s1", "O cliente nunca faz o pedido sozinho.", "User Story 9")])

# ================================================================ perguntas e formulário
ORDEM_BLOCOS = ["Modelo de negócio", "Funis e tarefas", "Captar parceiros", "Integrar parceiro", "Gerar negócios", "Desenvolver o parceiro", "Suporte e dados", "Gestão do programa"]
qids = []
for bloco in ORDEM_BLOCOS:
    for chave, texto, tipo, opcoes, alvo, b in PERG:
        if b != bloco:
            continue
        qid = add("perguntas", "Q", texto=texto, tipo=tipo, opcoes=opcoes, alvo=alvo, para=["PE-01"], rodada=1, bloco=bloco, status="em_formulario", formulario="FO-01", respostas=[], chave=chave)
        qids.append(qid)
add("formularios", "FO", titulo="To-be: decisões do patrocinador", rodada=1, para=["PE-01"], canal="artifact", perguntas=qids,
    introducao="Decisões de desenho que só o patrocinador pode tomar.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw", status="enviado", enviado_em=HOJE, prazo="", identificacao=False)
d["historico"].append({"data": HOJE, "evento": "To-be montado a partir das especificações 001 e 002 e de 11 livros; formulário de decisões ao patrocinador"})
