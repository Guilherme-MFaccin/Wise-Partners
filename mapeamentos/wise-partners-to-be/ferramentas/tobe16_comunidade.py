# To-be v16 (23/11/2026): Comunidade Wise Partners. O portal passa a ser a comunidade onde as empresas do ecossistema do
# Grupo Tríade contratam produtos e serviços entre si. Página pública geral com Cadastrar e Entrar; cadastro com conta na hora;
# Catálogo como primeira aba de quem não é parceiro; indicação da consultoria também para clientes; aba Conhecer a Wise Makers.
H16 = "2026-11-23"
PEDIDO16 = ("Preciso que você faça uma nova estrutura de páginas, editáveis na seção de páginas do portal wise partners, que será o modo de acessar a "
            "comunidade Wise Partners. Ela deve conter uma landing page onde se fala sobre o que é a Comunidade Wise Partners (é o portal onde as empresas "
            "podem contratar produtos e serviços do ecossistema da Wise Partners, que compreende todas as empresas relacionadas ao Grupo Tríade). A landing "
            "page deve servir para qualquer empresa, seja um cliente de qualquer empresa do Grupo Tríade que também parceiros, prospectos clientes, "
            "prospectos parceiros, etc.")
_ev16 = {}
def U16(k, trecho):
    if k not in _ev16:
        _ev16[k] = ev_raw("entrevista", "Pedido do patrocinador no Claude Code, 23/11/2026", trecho, "Conversa de 23/11/2026, " + k, pessoa="PE-01", data=H16)
    return _ev16[k]

EV_COM = U16("comunidade", PEDIDO16)
EV_BOTOES = U16("botoes", "A landing page deve ter dois botões no menu: um de cadastrar e outro de login.")
EV_CADASTRO = U16("cadastro", "Ao fazer o cadastro através da landing page, ele deve preencher todas as informações para sabermos se é um lead de parceiro, se é já um cliente do Grupo Tríade, etc etc.")
EV_DIRETO = U16("acesso", "Ao acessar, ele entrará direto no portal Wise Partners dentro da sua própria conta.")
EV_PRIMEIRA = U16("catalogo", "O catálogo de parceiros deve ser a primeira aba do portal para clientes do Grupo Tríade. O catálogo deve ser muito bem apresentado, para não parecer algo feito de qualquer jeito.")
EV_AFILIADO = U16("afiliado", "Os clientes, que terão seu login e senha no portal Wise Partners, terão também acesso ao link de afiliado e podem indicar a consultoria gratuita da Wise Makers.")
EV_PREMIUM = U16("premium", "O parceiro Premium verá a mesma coisa: Catálogo das empresas da Comunidade Wise Partners com seus descontos, aba para indicar a Wise Makers e uma aba para conhecer melhor a Wise Makers (basicamente um minicurso sobre como vender a Wise Makers)")
EV_ELITE = U16("elite", "O parceiro Elite terá a possibilidade de também cadastrar a própria empresa com uma oferta na Comunidade Wise Partners")
PX16 = {p["id"]: p for p in d["processos"]}

# ---------------------------------------------------------------- o macroprocesso passa a ser a Comunidade
hub = PX16[P_HUB]
hub["nome"] = "Conectar negócios na Comunidade Wise Partners"
hub["descricao"] = ("A Comunidade Wise Partners é o portal onde as empresas do ecossistema do Grupo Tríade contratam produtos e serviços entre si: clientes das "
    "empresas do grupo, parceiros, quem quer ser parceiro e quem quer conhecer. Qualquer empresa se cadastra pela página da comunidade e entra na hora, "
    "com o acesso que o vínculo dela permite. " + hub["descricao"])
hub["cliente"] = "Empresas do ecossistema do Grupo Tríade"
hub["gatilho"] = "Empresa que se cadastra na comunidade ou recebe o acesso da Wise"
hub["portal"] = ("é a Comunidade Wise Partners: a página /comunidade (Cadastrar e Entrar), o cadastro com conta na hora e, dentro, o Catálogo como primeira aba de "
    "quem não é parceiro, Indicar a Wise Makers e Conhecer a Wise Makers; na área da Wise, a seção Comunidade (Empresas, Ofertas, Pedidos, Clientes do grupo).")
hub["evidencias"] += [EV_COM, EV_PRIMEIRA]

P_ENTRADA = proc("Receber a empresa na Comunidade", P_HUB, 1,
    "Qualquer empresa conhece a comunidade pela página geral, que não cita nenhum parceiro, e se cadastra em três etapas: a empresa (CNPJ, o que faz, local, "
    "faturamento e time de vendas), a relação com o Grupo Tríade (se é cliente e de qual empresa, e o que quer: usar condições, oferecer, indicar, conhecer "
    "a consultoria ou ser parceira) e o acesso (contato e senha). A conta nasce na hora e a pessoa entra direto no portal. O cadastro classifica a empresa: "
    "cliente do grupo a confirmar, lead de parceiro, lead da consultoria ou empresa cadastrada.",
    "Empresa que clicou em Cadastrar na página da comunidade", "Empresa do ecossistema", [EV_COM, EV_BOTOES, EV_CADASTRO, EV_DIRETO],
    "é a página /comunidade e o cadastro /comunidade/cadastro, editáveis em Programa, Páginas, Comunidade; as empresas aparecem em Comunidade, Empresas.",
    participantes=[CLI])
P_VINCULO = proc("Confirmar o cliente do grupo declarado", P_HUB, 2,
    "Quem declara no cadastro que é cliente de uma empresa do grupo vê o catálogo em vitrine até a Wise confirmar o vínculo. A confirmação libera as "
    "condições, os pedidos, as ofertas e o link de indicação; a recusa vai com o motivo para a empresa. O cadastro do cliente pela CS da Tríade ou pelo "
    "consultor também confirma.",
    "Empresa que se declarou cliente do grupo", "Empresa cliente do Grupo Tríade", [EV_CADASTRO, EV_AFILIADO],
    "vira tarefa (decidir) e se resolve em Comunidade, Empresas: Confirmar cliente ou Não é cliente, com motivo.", participantes=[CONSUL, CST])
P_CONHECER = proc("Apresentar a Wise Makers às empresas da comunidade", P_HUB, 6,
    "Toda empresa da comunidade tem a aba Conhecer a Wise Makers: o que a Wise Makers faz, o que a empresa indicada recebe e o minicurso Como vender a "
    "Wise Makers. Clientes do grupo confirmados e parceiros têm o link próprio para indicar a consultoria gratuita.",
    "Empresa com acesso ao portal", "Empresas da comunidade", [EV_PREMIUM, EV_AFILIADO],
    "é a aba Conhecer a Wise Makers (/parceiro/wise-makers), com o minicurso aberto a todas as empresas; o teste e o certificado seguem para parceiros com contrato.")
PX16 = {p["id"]: p for p in d["processos"]}
for pid, ordem in ((P_ACESSO, 3), (P_VALIDA, 4), (P_PEDIDO, 5)):
    PX16[pid]["ordem"] = ordem

PX16[P_ENTRADA]["fluxo"] = FL("""i1 i L Empresa clicou em Cadastrar na página da comunidade
        t1 t L Contar quem é a empresa e a relação com o grupo
        t2 t L Criar a senha e aceitar o termo de uso
        t3 s G Criar a empresa e a conta e classificar o cadastro
        g1 d G A empresa declarou ser cliente do grupo?
        t4 s G Abrir a tarefa de confirmar o cliente
        g2 d G A empresa quer ser parceira?
        t5 s G Colocar o pedido na fila de candidatos
        t6 s L Entrar no portal pelo Catálogo
        f1 f L Empresa na comunidade""", links="i1>t1>t2>t3>g1; g1:Sim>t4>g2; g1:Não>g2; g2:Sim>t5>t6; g2:Não>t6>f1")
PX16[P_VINCULO]["fluxo"] = FL("""i1 i G Empresa se declarou cliente do grupo
        t1 t C Conferir o contrato com a empresa do grupo
        g1 d C A empresa é cliente ativa do grupo?
        t2 s C Confirmar o cliente e a empresa do grupo
        f1 f L Condições e link de indicação liberados
        t3 s C Registrar o motivo para a empresa
        f2 f L Empresa segue com o catálogo em vitrine""", links="i1>t1>g1; g1:Sim>t2>f1; g1:Não>t3>f2")
PX16[P_CONHECER]["fluxo"] = FL("""i1 i L Empresa abriu Conhecer a Wise Makers
        t1 t L Assistir aos módulos do minicurso Como vender a Wise Makers
        g1 d G A empresa tem o link de indicação?
        t2 t L Mandar o link a quem tem time comercial
        f1 f L Consultoria indicada
        t3 s G Mostrar o que falta para ter o link
        f2 f L Empresa conhece a Wise Makers""", links="i1>t1>g1; g1:Sim>t2>f1; g1:Não>t3>f2")
for pid in (P_ENTRADA, P_VINCULO, P_CONHECER):
    PX16[pid]["fluxo"]["status"] = "declarado"
    PX16[pid]["fluxo"]["evidencias"] = PX16[pid]["evidencias"][:1]

PX16[P_ACESSO]["descricao"] += " Com a Comunidade (23/11/2026), o cliente também pode se cadastrar sozinho pela página; nesse caso a Wise só confirma o vínculo (P-107)."
PX16[P_ACESSO]["evidencias"].append(EV_DIRETO)
p21 = PX16["P-21"]
p21["descricao"] = p21.get("descricao", "") + " Desde 23/11/2026, o pedido para ser parceiro também chega pelo cadastro da Comunidade, com a conta já criada; a fila, o WhatsApp e a conversa de entrada continuam, e a aprovação reaproveita a conta."
p21.setdefault("evidencias", []).append(EV_CADASTRO)

# ---------------------------------------------------------------- decisões
for texto, evs in [
    ("O portal passa a ser a Comunidade Wise Partners: o lugar onde as empresas do ecossistema do Grupo Tríade contratam produtos e serviços entre si.", [EV_COM]),
    ("A página da comunidade é única para qualquer empresa (clientes do grupo, parceiros, prospectos de cliente e de parceria), editável em Programa, Páginas, com Cadastrar e Entrar no menu.", [EV_COM, EV_BOTOES]),
    ("O cadastro na comunidade pergunta o necessário para classificar a empresa (cliente do grupo, lead de parceiro, lead da consultoria) e abre a conta na hora.", [EV_CADASTRO, EV_DIRETO]),
    ("O Catálogo de parceiros é a primeira aba para clientes do Grupo Tríade e precisa ser bem apresentado.", [EV_PRIMEIRA]),
    ("Clientes com login têm o link de indicação da consultoria gratuita da Wise Makers.", [EV_AFILIADO]),
    ("Parceiro Premium vê o Catálogo com as condições, a aba para indicar a Wise Makers e a aba Conhecer a Wise Makers, com o minicurso de como vender a Wise Makers.", [EV_PREMIUM]),
    ("Parceiro Elite também cadastra a própria empresa com ofertas no catálogo.", [EV_ELITE]),
]:
    add("decisoes", "DE", data=H16, texto=texto, por="PE-01", provisoria=False, evidencias=evs)

# Escolhas de desenho para não contradizer o FO-19 e a entrada pessoal do parceiro (DE-30, DE-76): provisórias, cada uma com pergunta
def provisoria16(texto, pergunta, recomendo, opcoes=()):
    q = add("perguntas", "Q", texto=pergunta, tipo="escolha" if opcoes else "aberta", opcoes=list(opcoes), alvo=[P_HUB], para=["PE-01"], rodada=14, bloco="Comunidade",
            status="aberta", formulario=None, respostas=[], respondida_por=[], chave="pendente-v16", contexto=[], logica="", citacoes=[], visual="", recomendo=recomendo)
    add("decisoes", "DE", data=H16, texto=texto, por=None, provisoria=True, pergunta=q, evidencias=[EV_CADASTRO])
provisoria16("Cliente do grupo declarado no cadastro vê o catálogo em vitrine (empresas e ofertas, sem as condições) até a Wise confirmar o vínculo, em até 2 dias úteis.",
    "Quem se declara cliente do grupo no cadastro precisa da confirmação da Wise antes de ver as condições?",
    "Sim: confirmar antes protege as condições dos ofertantes; a vitrine já mostra o valor da comunidade.", ("Sim, confirmar antes", "Não, liberar na hora"))
provisoria16("Empresa sem vínculo (nem cliente do grupo nem parceira) vê o catálogo em vitrine e o minicurso, sem as condições e sem o link de indicação. Isso responde a pergunta do v15 sobre algo imediato para os leads.",
    "Empresa cadastrada sem vínculo vê a vitrine do catálogo e o minicurso?", "Sim, como vitrine: mostra o ecossistema e convida a virar cliente ou parceira.")
provisoria16("Quem quer ser parceiro pelo cadastro da comunidade entra na mesma fila de candidatos, com WhatsApp e conversa de entrada; a aprovação transforma a mesma conta em parceiro.",
    "Quem pede para ser parceiro pela comunidade passa pela conversa de entrada como os demais?", "Sim, mantém a entrada pessoal (DE-30) e reaproveita a conta.")
provisoria16("Cliente do grupo que indica pelo link segue, por ora, a regra de comissão do parceiro (40% da primeira mensalidade).",
    "O cliente do grupo que indica a consultoria pelo link recebe a mesma comissão do parceiro?",
    "Decidir antes da primeira indicação de cliente: a mesma regra simplifica, mas pode pedir contrato com o cliente.",
    ("Sim, 40% da primeira mensalidade", "Outra recompensa", "Sem comissão"))
provisoria16("Clientes do grupo continuam podendo oferecer no catálogo, como decidido no FO-19; o pedido de 23/11 citou ofertas só para o Elite.",
    "Clientes do grupo continuam oferecendo no catálogo, além dos parceiros Elite?", "Sim, como no FO-19: clientes estão dos dois lados.", ("Sim, como no FO-19", "Não, só o Elite oferece"))
provisoria16("A raiz do portal (partners.wisemakers.com.br) abre a página da comunidade; a página dos parceiros continua em /parceiros para as campanhas.",
    "A raiz do portal abre a página da comunidade?", "Sim: a comunidade serve a qualquer empresa e tem o caminho para ser parceiro.")

for q in d["perguntas"]:
    if q.get("chave") == "pendente-v15":
        q["status"] = "respondida"; q["respostas"] = [EV_COM]; q["respondida_por"] = ["PE-01"]
d["historico"].append({"data": H16, "evento": "To-be v16: Comunidade Wise Partners. Página geral com Cadastrar e Entrar, cadastro com conta na hora e classificação (P-106), confirmação do cliente do grupo (P-107), Conhecer a Wise Makers (P-108); Catálogo como primeira aba de quem não é parceiro; link de indicação para clientes; canvas atualizado; 6 decisões provisórias com pergunta."})
print("v16: comunidade;", P_ENTRADA, P_VINCULO, P_CONHECER)
