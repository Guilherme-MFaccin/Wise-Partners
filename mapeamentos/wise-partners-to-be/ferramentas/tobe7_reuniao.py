# Conversa com o Igor em 04/11/2026, já decidida na Rodada 6 (executado dentro de tobe7_base.py).
# Os textos abaixo trazem a versão decidida; a resposta da Rodada 6 sobe cada elemento para confirmado em tobe7_rodada6.py.
# A transcrição é automática, parcial e não separa quem fala; por isso tudo o que vem dela entra como hipótese
# e só vira desenho com a resposta do patrocinador na Rodada 6.
_TR = re.sub(r"\s+", " ", open(BASE + "/fontes/reunioes/2026-11-04-igor.md", encoding="utf-8").read())
def R(gravacao, tempo, trecho):
    t = re.sub(r"\s+", " ", trecho)
    assert t in _TR, f"Trecho não está na transcrição: {t[:80]}"
    k = ("r", t)
    if k not in _cache:
        _cache[k] = ev_raw("entrevista", "Reunião Guilherme e Igor, 04/11/2026 (transcrição automática parcial)", trecho, f"Gravação {gravacao}, {tempo}")
    return _cache[k]

# ---------------------------------------------------------------- fatos novos (hipóteses)
fato("valor_saas", "proposta_de_valor", "Para parceiros de software de gestão (CRM, ERP e afins), o valor central da Wise é a retenção da base deles: o cliente com processo comercial bom usa melhor o software e continua pagando. Por isso a entrega da Wise passa a fazer parte do processo do parceiro, e não fica só como indicação.",
     "hipotese", [R(2, "07:20", "O problema que a gente resolve para o nosso parceiro é ele ter uma base de clientes que depende do software dele, mas para que eles mantenham o contrato com o software deles, eles precisam de uma eficiência comercial."),
                  R(2, "08:48", "O que a gente entrega tem que fazer parte do processo dele."), VP(KS, 1), VP(RE, 11)])
fato("diagnostico_oferta", "oferta", "Entregável padrão, para todos os parceiros desde já: reunião de diagnóstico comercial gratuita, de 40 a 60 minutos, que termina com um mapa de planejamento, só para clientes dentro do ICP da Wise. O Gerente conduz, no máximo um por dia; a agenda online só oferece vagas livres. Logo depois do diagnóstico, o cliente ganha acesso ao Wise Hub. O diagnóstico é a quinta porta de oportunidade do programa.",
     "hipotese", [R(2, "10:31", "Todo cliente dele fazendo diagnóstico conosco para poder fazer uma avaliação da operação."),
                  R(2, "14:50", "A gente oferecer uma reunião de diagnóstico de graça pra cada cliente."), VP(CS, 4), VP(RE, 0)])
fato("hub_politica", "oferta", "O Wise Hub é liberado logo depois do diagnóstico para todo cliente diagnosticado, e o pacote B continua dando o Hub à base do parceiro. O Hub não é oferecido sozinho, como publicidade: plataforma de aulas sem contato gera pouco engajamento e perde valor.",
     "hipotese", [R(2, "12:42", "Será que não ia desvalorizar demais o próprio Wise e Hammer se a gente fizesse isso para todo mundo?"),
                  R(2, "17:31", "só que eu acho que se ter só ela pra oferecer, eu acho que ele não vai gerar o nível de engajamento nos meus casos."), A("EV-0019")])
fato("pesquisa", "estrategia", "Diagnóstico e pesquisa andam juntos até março, com separação clara: a pesquisa do Gerente sobre maturidade comercial e CRM (50 entrevistas de cerca de 40 minutos) usa o roteiro do diagnóstico; no agendamento, o cliente consente com a pesquisa e aceita o acesso ao Wise Hub. O diagnóstico não é pitch de venda: a conversa comercial é separada e só acontece se o cliente pedir.",
     "hipotese", [R(2, "17:31", "Eu preciso, daqui até mais ou menos março, entrevistar 50 empresas para o meu projeto de pesquisa"),
                  R(2, "23:47", "Uma por dia, em dois meses eu mato tudo."), R(2, "23:47", "eles tão ávidos, eles querem mesmo poder oferecer os nossos serviços pra eles")])
fato("comissao_diagnostico", "receita", "Cliente que contrata a Wise depois de um diagnóstico oferecido pelo parceiro conta como indicação do parceiro e gera a comissão da regra única.",
     "hipotese", [A("EV-0033"), D2("Q-0005"), R(2, "25:41", "porque é um possível cliente também pra gente")])
fato("foco_segmento", "parceiro", "Na fase de Experimentação, o recrutamento foca num segmento só: software de gestão para empresas (CRM e ERP à frente). Agências ficam fora porque concorrem com a Wise. O ecossistema continua pequeno: não é para milhares de parceiros.",
     "hipotese", [R(2, "03:12", "O SaaS, eu acho que é melhor. O SaaS de CRM."), R(2, "03:12", "Agência, Saqueagência, ProAge T11... eu acho que acaba concorrendo demais."),
                  R(1, "29:46", "Aí a gente foca, sei lá, ou agora pegar só, sei lá, software de gestão de manutenção."), R(2, "09:49", "O nosso talvez não vai ser escalado para 5 mil parceiros."),
                  B("ecosystem-economy", "Focar em um segmento")])
fato("categorias", "parceiro", "Categorias de parceiro e da Prateleira citadas na conversa. Comerciais: ERP, CRM, PCP, SST, ESG, EPM, consultoria de gestão, design, tecnologia digital, infraestrutura e data center, dados e ciência de dados, software de gestão de manutenção, automação industrial, qualidade e laboratório, eficiência energética, segurança da informação, comércio exterior e logística internacional, jurídico, tributário, contabilidade consultiva e RH. Institucionais: federações e confederações, Sistema S, institutos, associações comerciais e empresariais, associações setoriais, secretarias de indústria e comércio, sindicatos patronais, parques tecnológicos e universidades.",
     "hipotese", [R(2, "03:12", "ERP, CRM, PCP, SST, ESG, EPM, Consultoria de Gestão."), R(2, "04:40", "Secretaria de Indústria e Comércio de Desenvolvimento.")])
fato("escopo_portal", "recurso", "Primeira entrega do portal com os oito blocos do to-be: núcleo (card do parceiro, jornada, oportunidades com as cinco portas e fila única), painel da semana com o Igor, área do parceiro, diagnóstico, plano de ativação de 90 dias, cubo e tipos, cadência de contato e comunidade. A construção vai do núcleo para a borda, e cada regra nova começa em modo manual antes de ser automatizada.",
     "hipotese", [VP(KS, 4), B("platform-revolution", "Manter o núcleo do portal pequeno"), VP(CS, 10)])

# ---------------------------------------------------------------- processos novos (hipóteses)
proc("5.5", "Conduzir o plano de ativação de 90 dias", "M5", 5, "Ação de início logo depois do termo, para o parceiro sentir o valor antes de indicar. Semana 1: anúncio conjunto da parceria, com postagem dos dois lados. Mês 1: treinamento curto de gestão comercial para o time do parceiro e diagnóstico dos dois ou três primeiros clientes dele. Mês 2: divulgação do diagnóstico e do treinamento para a base do parceiro. Mês 3: encontro com a base e as primeiras oportunidades. Vale para todos os pacotes; a Base Ativa segue só no pacote A.",
     "monta o plano de 90 dias pelo pacote, cria as tarefas de cada mês e mostra ao parceiro o que já foi feito.", GP, "Termo assinado", ("Parceiro com o primeiro valor recebido", "P-5.4"), "Empresa parceira",
     [R(1, "00:03", "uma vez o onboard, é fazer o cara ganhar um dinheiro rápido."), R(1, "02:45", "Na vez de esperar 2, 3 meses, já conseguia pregar valor colocado desde o início."),
      R(1, "03:50", "fazer uma postagem conjunto que começou a parceria, fazer umas publicações sobre a parceria, sobre a Wise."), VP(CS, 4)],
     status="hipotese", part=[RESP_P], sist=[SI_POR, SI_WPP], freq="Uma vez por parceiro", principios=["primeiro_valor", "valor_antes"])
proc("6.9", "Conduzir o diagnóstico do cliente do parceiro", "M6", 9, "O cliente do parceiro marca pela agenda online, no link do parceiro, e dá ali os consentimentos; o Gerente confere se a empresa está no ICP, conduz a reunião pelo roteiro, entrega o mapa de planejamento e libera o Wise Hub; se o cliente autorizou, o parceiro recebe o resumo; se o cliente pedir para seguir, vira oportunidade com a origem no parceiro.",
     "recebe o agendamento pelo link do parceiro, registra o diagnóstico, libera o Hub e cria a oportunidade quando há interesse.", GP, "Cliente do parceiro marca o diagnóstico", ("Mapa de planejamento entregue", "EXT:Cliente do parceiro"), "Cliente do parceiro e parceiro",
     [R(2, "14:50", "A gente oferecer uma reunião de diagnóstico de graça pra cada cliente."), R(2, "24:48", "Pro próprio cara do time de CS"), VP(RE, 0)],
     status="hipotese", part=[RESP_P], sist=[SI_POR, SI_HUB], principios=["valor_antes", "interacao"], freq="No máximo um por dia",
     regras=["Só clientes dentro do ICP da Wise", "No máximo um diagnóstico por dia, conduzido pelo Gerente", "Wise Hub liberado logo depois do diagnóstico",
             "Consentimento da pesquisa e aceite do Hub no agendamento", "Resumo ao parceiro só com autorização escrita do cliente, dada no agendamento",
             "Conversa comercial só se o cliente pedir", "Cliente que marcou pelo link do parceiro gera a comissão da regra única se contratar"])
proc("11.4", "Manter o kit de convite ao diagnóstico", "M11", 4, "Página com vídeo da Wise explicando o diagnóstico gratuito e o que o cliente leva, mensagem pronta para o parceiro enviar e agenda online para o cliente marcar sozinho, sempre com o link do parceiro.",
     "gera a página e a mensagem com o link exclusivo do parceiro.", GP, "Parceiro novo ou mudança na oferta", ("Kit de convite publicado", "EXT:Parceiros"), "Parceiros",
     [R(2, "21:04", "A LP é uma oferta talvez bem agressiva."), R(2, "22:50", "fazer o vídeo com o canal LP pro David e eles são mandando link"), VP(RE, 5)],
     status="hipotese", principios=["ensinar"])
_p22 = next(x for x in d["processos"] if x["id"] == P["2.2"])
_p22["descricao"] += " O Igor vê o painel e os casos no portal, só para leitura."
_p22["hipoteses"].append("acesso_do_diretor")
for _k in ("5.5", "6.9", "11.4"):
    _p = next(x for x in d["processos"] if x["id"] == P[_k])
    for _s in _p["saidas"]:
        if _s["para"].startswith("P-") and _s["para"][2:] in P:
            _s["para"] = P[_s["para"][2:]]
            _dest = next(x for x in d["processos"] if x["id"] == _s["para"])
            _dest["entradas"].append({"nome": _s["nome"], "de": _p["id"]})
    if _k == "11.4":
        _p["fluxo_dispensado"] = f"{DE_FLUXO}: não vira quadro, fila ou ritual próprio; fica no nível de dono, gatilho e entregas"

# ---------------------------------------------------------------- passo a passo dos processos novos que viram fila ou agenda
X_CPAR = {"id": "X2", "nome": "Cliente do parceiro"}
fluxo("6.9", [D6("Q-0046"), D6("Q-0047"), D6("Q-0048"), D6("Q-0049"), D6("Q-0050"), D6("Q-0051")], [GP],
      [no("i1", "inicio", "Cliente do parceiro marca o diagnóstico", gatilho="mensagem"), no("t1", "tarefa", "Conferir se a empresa está no ICP da Wise", **SIS),
       no("g1", "decisao", "A empresa está no ICP?"), no("t2", "tarefa", "Avisar o cliente e o parceiro de que o diagnóstico não se aplica", **WPP),
       no("t3", "tarefa", "Conduzir a reunião de diagnóstico pelo roteiro"), no("t4", "tarefa", "Entregar o mapa de planejamento", **SIS),
       no("t5", "tarefa", "Liberar o acesso ao Wise Hub", sistema=SI_HUB, modo="sistema"), no("g2", "decisao", "O cliente autorizou o resumo ao parceiro?"),
       no("t6", "tarefa", "Enviar o resumo ao parceiro", **WPP), no("g3", "decisao", "O cliente pediu para seguir com a Wise?"),
       no("t7", "tarefa", "Registrar a oportunidade com a origem no parceiro", **SIS),
       no("f1", "fim", "Diagnóstico não aplicável"), no("f2", "fim", "Diagnóstico entregue"), no("f3", "fim", "Oportunidade aberta")],
      L(("i1", "t1"), ("t1", "g1"), ("g1", "t2", "Não"), ("t2", "f1"), ("g1", "t3", "Sim"), ("t3", "t4"), ("t4", "t5"), ("t5", "g2"),
        ("g2", "t6", "Sim"), ("g2", "g3", "Não"), ("t6", "g3"), ("g3", "t7", "Sim"), ("g3", "f2", "Não"), ("t7", "f3")),
      [{"de": "X2", "para": "i1", "rotulo": "Agendamento e consentimentos"}, {"de": "t2", "para": "X2", "rotulo": "Aviso"}, {"de": "t4", "para": "X2", "rotulo": "Mapa de planejamento"},
       {"de": "t5", "para": "X2", "rotulo": "Acesso ao Hub"}, {"de": "t6", "para": "X1", "rotulo": "Resumo autorizado"}], [X_PARC, X_CPAR], status="confirmado")

fluxo("5.5", [D6("Q-0053"), R(1, "02:45", "Na vez de esperar 2, 3 meses, já conseguia pregar valor colocado desde o início.")], [GP, RESP_P],
      [no("i1", "inicio", "Termo assinado"), no("t1", "tarefa", "Montar o plano de 90 dias pelo pacote", **AUTO),
       no("t2", "tarefa", "Publicar o anúncio conjunto da parceria", raia=RESP_P), no("t3", "tarefa", "Dar o treinamento curto de gestão comercial ao time do parceiro"),
       sub("s1", "6.9"), no("e1", "espera", "Início do segundo mês", evento="tempo"), no("t4", "tarefa", "Divulgar o diagnóstico e o treinamento para a base", raia=RESP_P),
       no("e2", "espera", "Início do terceiro mês", evento="tempo"), no("t5", "tarefa", "Conduzir o encontro com a base do parceiro"),
       no("t6", "tarefa", "Registrar as primeiras oportunidades", **SIS), no("f1", "fim", "Plano de 90 dias cumprido")],
      L(("i1", "t1"), ("t1", "t2"), ("t2", "t3"), ("t3", "s1"), ("s1", "e1"), ("e1", "t4"), ("t4", "e2"), ("e2", "t5"), ("t5", "t6"), ("t6", "f1")), status="confirmado")

# M5 passa a incluir o plano de 90 dias antes de declarar a ativação
_m5 = next(x for x in d["processos"] if x["id"] == P["M5"])
_m5["fluxo"]["nos"].insert(4, sub("s4", "5.5"))
_m5["fluxo"]["ligacoes"] = [l for l in _m5["fluxo"]["ligacoes"] if not (l["de"] == "s3" and l["para"] == "g1")] + L(("s3", "s4"), ("s4", "g1"))
_m5["fluxo"]["evidencias"].append(D6("Q-0053"))

# cadeia de oportunidades ganha a etapa do diagnóstico, antes de qualificar
_cv = next(c for c in d["cadeias_de_valor"] if c["nome"].startswith("Da necessidade"))
_cv["etapas"].insert(0, {"nome": "Diagnosticar o cliente do parceiro (quinta porta)", "processos": [P["6.9"]]})
add("glossario", "GL", termo="Diagnóstico do cliente do parceiro", definicao="Reunião gratuita de 40 a 60 minutos com o Gerente, só para empresas no ICP da Wise, que termina com um mapa de planejamento e libera o Wise Hub; quinta porta de oportunidade.", sinonimos=["Diagnóstico comercial"], evidencias=[D6("Q-0046")])
