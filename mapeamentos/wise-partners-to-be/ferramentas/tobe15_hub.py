# To-be v15 (22/11/2026): FO-19, o Wise Partners como hub de negócios (Catálogo de parceiros).
H15 = "2026-11-22"
R19 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-19/fo24_itens/HB-*.json")}
_ev19 = {}
def D19(k):
    if k not in _ev19:
        r = R19[k]
        v = r.get("valor"); v = "; ".join(v) if isinstance(v, list) else (v or "")
        trecho = (v + (" Comentário: " + r["obs"] if r.get("obs") and r["obs"].strip() not in ("", "-") else "")).strip()
        _ev19[k] = ev_raw("formulario", "FO-19: Wise Partners como hub de negócios", trecho, "HB-" + k, pessoa="PE-01", data=H15)
    return _ev19[k]
PX15 = {p["id"]: p for p in d["processos"]}

# ---------------------------------------------------------------- papéis novos
CLI = add("papeis", "PA", nome="Empresa cliente do Grupo Tríade", area=None, externo=True, status="declarado", evidencias=[D19("entrada_cliente"), D19("dois_papeis")],
          descricao="Cliente da Wise Makers ou da Tríade Digital com login no portal: vê o catálogo, pede condições e pode oferecer os próprios produtos e serviços.")
CST = add("papeis", "PA", nome="CS da Tríade Digital", area=None, externo=False, status="declarado", evidencias=[D19("entrada_cliente")],
          descricao="Cria o login dos clientes da Tríade que já estão na base e apresenta o portal e os benefícios a cada um.")
RA["L"] = CLI; RA["T"] = CST

# ---------------------------------------------------------------- processos novos
def proc(nome, pai, ordem, descricao, gatilho, cliente, evs, portal, tipo=None, participantes=()):
    kw = dict(nome=nome, pai=pai, ordem=ordem, descricao=descricao, dono=GP, participantes=list(participantes), gatilho=gatilho, entradas=[], saidas=[],
              cliente=cliente, sistemas=[SI_POR], indicadores=[], frequencia="Contínuo", dores=[], regras=[], status="declarado", hipoteses=[], evidencias=evs,
              situacao="no_papel", fluxo_dispensado=None, principios=[], portal=portal)
    if tipo: kw["tipo"] = tipo
    pid = add("processos", "P", **kw)
    PX15[pid] = d["processos"][-1]
    return pid

P_HUB = proc("Conectar negócios pelo Catálogo de parceiros", None, 11,
    "O Wise Partners vira um hub de negócios, uma comunidade de indústrias e de empresas que prestam serviço para indústrias, no modelo do ecossistema de parceiros da G4, sem cobrança alta para entrar. "
    "Oferecem no catálogo os parceiros Elite (um cliente trazido por eles contratou uma empresa do Grupo Tríade) e as empresas clientes do grupo. Veem o catálogo e usam as condições os parceiros Premium "
    "(um cliente deles, no perfil, fez o diagnóstico com a Wise), os Elite e os clientes do grupo. Na plataforma não há distinção visual entre Premium e Elite. "
    "Uma empresa pode comprar e oferecer com o mesmo login. Toda oferta tem uma condição só para membros, do valor que o parceiro quiser, validada pela Wise. "
    "Um dos objetivos é ter algo de valor imediato para oferecer aos leads capturados.",
    "Empresa com acesso ao catálogo", "Clientes do Grupo Tríade e parceiros", [D19("compradores"), D19("ofertantes"), D19("niveis"), D19("dois_papeis"), D19("fases")],
    "é a seção Catálogo: na área do parceiro (Catálogo, Minhas ofertas, Pedidos) e na área da Wise (Ofertas, Pedidos, Clientes do grupo).", tipo="finalistico")
P_ACESSO = proc("Dar acesso aos clientes do grupo", P_HUB, 1,
    "Os clientes da Tríade que já estão na base recebem o login pela CS da Tríade Digital, que apresenta o portal e os benefícios a cada um. Os clientes da Wise recebem a mensagem do consultor responsável. "
    "A mensagem leva um vídeo do Igor com os benefícios de estar no ecossistema por ser cliente do Grupo Tríade.",
    "Cliente ativo do Grupo Tríade sem acesso", "Empresa cliente do Grupo Tríade", [D19("entrada_cliente")],
    "é a tela Catálogo, Clientes do grupo: cadastro da empresa, acesso com senha provisória e mensagem pronta para o WhatsApp.", participantes=[CONSUL, CST])
P_VALIDA = proc("Validar as ofertas do catálogo", P_HUB, 2,
    "A Wise confere cada oferta (o que é, para quem serve e a condição para membros) antes de publicar. Oferta publicada que muda de texto volta para validação.",
    "Oferta enviada por parceiro Elite ou cliente do grupo", "Membros do catálogo", [D19("oferta"), D19("condicao")],
    "mostra as ofertas para validar em Catálogo, Ofertas, e cada uma vira tarefa (decidir) até a decisão.")
P_PEDIDO = proc("Atender o pedido de condição", P_HUB, 3,
    "O membro pede a condição pelo portal e recebe um protocolo; quem oferece recebe o contato e fala com ele. Não há etapas de acompanhamento: quem oferece só marca, se quiser, se fechou. "
    "A comissão do parceiro à Wise sobre negócio fechado pelo catálogo não é obrigatória. A avaliação de quem comprou entra depois, com a nota visível só para a Wise.",
    "Pedido de condição no catálogo", "Empresa que pediu e empresa que oferece", [D19("uso"), D19("fases"), D19("receita"), D19("avaliacao")],
    "gera o protocolo, avisa quem oferece e o responsável na Wise, e mostra os pedidos em Catálogo, Pedidos.", participantes=[RESP_P, CLI])

PX15[P_ACESSO]["fluxo"] = FL("""i1 i T Cliente ativo do grupo sem acesso
        t1 s T Cadastrar a empresa cliente no portal
        t2 s T Criar o acesso com senha provisória
        t3 t T Mandar a mensagem com o vídeo do Igor e o acesso
        t4 t L Entrar no portal e criar a senha
        f1 f L Cliente com acesso ao catálogo""")
PX15[P_VALIDA]["fluxo"] = FL("""i1 i G Oferta enviada para validação
        t1 t G Ler a oferta e a condição para membros
        g1 d G A oferta está clara e tem condição só para membros?
        t2 s G Publicar a oferta
        f1 f G Oferta publicada
        t3 s G Recusar com o motivo
        f2 f G Oferta devolvida para ajuste""", links="i1>t1>g1; g1:Sim>t2>f1; g1:Não>t3>f2")
PX15[P_PEDIDO]["fluxo"] = FL("""i1 i L Oferta escolhida no catálogo
        t1 s L Pedir a condição e aceitar compartilhar o contato
        t2 s G Gerar o protocolo e avisar quem oferece
        t3 t P Falar com a empresa que pediu
        t4 s P Marcar se fechou negócio
        f1 f P Pedido atendido""")
for pid in (P_ACESSO, P_VALIDA, P_PEDIDO):
    PX15[pid]["fluxo"]["status"] = "declarado"
    PX15[pid]["fluxo"]["evidencias"] = PX15[pid]["evidencias"][:1]

# ---------------------------------------------------------------- níveis: resolve a CT-08
CRIT = ("Premium: um cliente do parceiro, dentro do perfil, fez o diagnóstico com a Wise Makers (passa a ver o catálogo e usar as condições). "
        "Elite: um cliente trazido pelo parceiro contratou alguma empresa do Grupo Tríade (passa a oferecer no catálogo). O portal sobe o nível sozinho.")
p61 = PX15["P-61"]
p61["descricao"] = re.sub(r"\s*Critério dos níveis \(FO-19\):.*$", "", p61.get("descricao", "")) + " Critério dos níveis (FO-19): " + CRIT + " Os pacotes saem e os benefícios seguem o nível."
p61["status"] = "declarado"
p61["portal"] = "guarda a tabela de níveis e sobe o nível sozinho pelos critérios do FO-19; os benefícios do catálogo seguem o nível."
p61.setdefault("evidencias", []).append(D19("compradores"))
for c in d["contradicoes"]:
    if c["id"] == "CT-08":
        c["status"] = "resolvida"; c["resolucao"] = CRIT; c["evidencias_resolucao"] = [D19("compradores"), D19("niveis")]
for q in d["perguntas"]:
    if q.get("chave") == "pendente-v14" or (q["id"] == next((c["pergunta"] for c in d["contradicoes"] if c["id"] == "CT-08"), None)):
        q["status"] = "respondida"; q["respostas"] = [D19("niveis")]; q["respondida_por"] = ["PE-01"]

PX15["P-58"]["descricao"] = PX15["P-58"].get("descricao", "") + " Com o FO-19, a Prateleira passa a ser também o Catálogo de parceiros: os membros veem as ofertas sem depender de uma recomendação da Wise."
PX15["P-58"].setdefault("evidencias", []).append(D19("ofertantes"))

for texto, evs in [
    ("O Wise Partners vira um hub de negócios: catálogo de parceiros com condições só para membros, no modelo do ecossistema da G4 e sem cobrança alta para entrar.", [D19("compradores")]),
    ("Oferecem no catálogo só os parceiros Elite e as empresas clientes do Grupo Tríade. Veem e usam as condições os Premium, os Elite e os clientes do grupo. Sem distinção visual entre Premium e Elite.", [D19("niveis"), D19("fases")]),
    (CRIT, [D19("compradores")]),
    ("Os pacotes saem; os benefícios seguem o nível.", [D19("niveis")]),
    ("Qualquer empresa B2B aprovada pela Wise pode participar, inclusive os clientes da Wise; as categorias viram filtro.", [D19("ofertantes")]),
    ("Uma empresa pode comprar e oferecer, com o mesmo login.", [D19("dois_papeis")]),
    ("A condição para membros é obrigatória, no valor que o parceiro quiser; a Wise valida a oferta.", [D19("condicao"), D19("oferta")]),
    ("O pedido sai com protocolo, sem etapas de acompanhamento; a comissão do parceiro sobre negócio do catálogo não é obrigatória.", [D19("uso"), D19("fases"), D19("receita")]),
    ("Os clientes da Tríade recebem o login pela CS da Tríade Digital; os clientes da Wise, pelo consultor responsável; com um vídeo do Igor sobre os benefícios.", [D19("entrada_cliente")]),
    ("A comissão de 40% que a Wise paga ao parceiro continua igual. O nome da área é Catálogo de parceiros. Prazo: imediato.", [D19("comissao_cliente_parceiro"), D19("nome"), D19("prazo")]),
]:
    add("decisoes", "DE", data=H15, texto=texto, por="PE-01", provisoria=False, evidencias=evs)
add("perguntas", "Q", texto="Como os leads capturados (por exemplo, os clientes dos parceiros que fizeram o autodiagnóstico) ganham algo do catálogo sem ter acesso às condições?",
    tipo="aberta", opcoes=[], alvo=[P_HUB], para=["PE-01"], rodada=13, bloco="Catálogo", status="aberta", formulario=None, respostas=[], respondida_por=[], chave="pendente-v15",
    contexto=["Você disse que um objetivo do catálogo é oferecer algo de imediato aos leads. Pela regra, só membros veem as condições."],
    logica="", citacoes=[], visual="", recomendo="Uma vitrine sem as condições (empresas e o que oferecem), com o convite para virar cliente e liberar os descontos.")
d["historico"].append({"data": H15, "evento": "To-be v15: FO-19 aplicado. Catálogo de parceiros (processo novo com três subprocessos), papéis Empresa cliente do Grupo Tríade e CS da Tríade, critério dos níveis decidido (CT-08 resolvida), pacotes saem, canvas atualizado."})
print("v15: hub de negócios;", P_HUB, P_ACESSO, P_VALIDA, P_PEDIDO)
