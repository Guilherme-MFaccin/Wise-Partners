# Rodada 9 (19/11/2026): FO-15, depois da reunião com a PluggMe. Executado dentro de tobe12_base.py, depois da aprovação da v10.
# Acessos ao portal, diagnóstico de cerca de 2 horas com plano de ação, valor de referência e cases de resultado.
H11 = "2026-11-19"
R15 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-15/fo20_itens/PD-*.json")}
I15 = {x["id"][3:]: x for x in json.load(open(BASE + "/ferramentas/fo15_itens.json"))}
CASES15 = json.load(open(BASE + "/fontes/cases-wise-2026-11.json"))

def D15(k):
    key = ("d15", k)
    if key not in _cache:
        _cache[key] = ev_raw("validacao", "FO-15: processos depois da reunião com a PluggMe", _texto(R15[k]), f"FO-15/PD-{k}", pessoa="PE-01", data=H11)
    return _cache[key]

PLUG = ev_raw("entrevista", "Reunião com a PluggMe (Lennon), relatada pelo patrocinador no chat de 18/11",
              "Nós vamos apresentar para ele e também agora para todos os próximos parceiros um programa de consultoria um pouco mais robusto. Nós vamos fazer uma reunião de diagnóstico para cada um dos respectivos clientes dos nossos parceiros. Em vez de 40 minutos, agora vamos fazer de cerca de 2 horas cada.",
              "chat de 18/11/2026", pessoa="PE-01", data="2026-11-18")
EV_CASES = ev_raw("documento", "Página de cases da Wise Makers (nov/26)",
                  "As 8 empresas faturaram mais no período com a Wise. Cada case compara os meses de trabalho com os mesmos meses do ano anterior à nossa entrada, sem expor valores em reais.",
                  "claude.ai/artifact/1R7mtSvDJqXoDgQ6vv2Rt9", data="2026-11-18")
LISTA_CASES = "; ".join(f"{c['name']} ({c['segment'].lower()}), +{str(c['growth']).replace('.', ',')}% de {c['period']}" for c in sorted(CASES15["cases"], key=lambda x: -x["growth"]))
MEDIA = str(round(CASES15["summary"]["mean"])).replace(".", ",")

def dsc(pid, novo_desc=None, portal=None, extra=None, evs=()):
    p = PX[pid]; desc, _, pt = p["descricao"].partition(" No portal: ")
    if novo_desc is not None: desc = novo_desc
    if extra: desc = desc.rstrip() + " " + extra
    if portal is not None: pt = portal
    p["descricao"] = desc + (" No portal: " + pt if pt else ""); p["portal"] = pt
    for e in evs: addev(p, e)

# ---------------------------------------------------------------- 1. quem usa o portal
for pa in d["papeis"]:
    if pa["id"] == GP: pa["descricao"] = "Dono de todas as tarefas do portal, inclusive as executadas por diretores, consultores, comercial, financeiro ou parceiro; administra o portal."
    if pa["id"] == DIR: pa["descricao"] = "Define as metas, aprova as regras e assina o aviso formal de desligamento; administra o portal, com acesso total, inclusive para editar as landing pages."; addev(pa, D15("acesso_diretor"))
    if pa["id"] == CONSUL:
        pa["descricao"] = "Atende o cliente da Wise; relata necessidades para a Prateleira, conduz diagnósticos quando a agenda do Gerente enche e faz a checagem aos 6 e 12 meses. Entra no portal com o perfil de consultor: vê os clientes e as oportunidades e registra os diagnósticos e as checagens que faz, sem editar páginas nem regras."
        addev(pa, D15("acesso_consultor"))
for x in d["decisoes"]:
    if x["id"] == "DE-06": x["texto"] += " Revista em 19/11 (FO-15): o Gerente continua dono de tudo; diretores e consultores entram no portal e registram a parte deles."
    if x["id"] == "DE-27": x["texto"] += " Revista em 19/11 (FO-15): os diretores passam a administrar o portal, com acesso total."
dsc("P-10", novo_desc=PX["P-10"]["descricao"].partition(" No portal: ")[0].replace(" O Igor vê o painel e os casos no portal, só para leitura.", ""),
    portal="monta o painel da semana e a lista de casos (parceiros que mudaram de tipo, oportunidades paradas, decisões pendentes), cada caso com o histórico e a jogada sugerida; registra a decisão de cada caso. O Diretor é administrador e pode abrir o painel e os casos quando quiser.",
    evs=[D15("acesso_diretor")])
dsc("P-60", extra="Os administradores são os diretores e o Gerente, com acesso total; os consultores entram com o perfil de consultor e registram a parte deles; o Gerente continua dono de todos os processos.",
    evs=[D15("acesso_diretor"), D15("acesso_consultor"), D15("dono")])
dsc("P-93", novo_desc="Usuários e permissões do portal: criar o acesso com o perfil certo, ajustar quando a função muda e revogar na saída. Perfis: administrador (diretores e Gerente, acesso total, inclusive editar as landing pages); consultor (vê clientes e oportunidades e registra diagnósticos e checagens, sem editar páginas nem regras); parceiro (a área dele: link, clientes, minicurso e kit).",
    evs=[D15("acesso_diretor"), D15("acesso_consultor")])

# ---------------------------------------------------------------- 2. diagnóstico de cerca de 2 horas
ICP = "3 vendedores ou mais, faturamento de pelo menos R$ 250 mil por mês e venda mais complexa"
dsc("P-95", novo_desc=("O cliente do parceiro abre o link, preenche o cadastro de qualificação e a página decide pelo ICP da Wise (" + ICP + "); o parceiro é avisado. "
    "No ICP: agenda do Google e uma reunião de cerca de 2 horas, com diagnóstico e plano de ação na mesma conversa. A base é a Matriz 5x5, mesclada ao roteiro de diagnóstico da Wise, que é adaptado a cada cliente antes da reunião. "
    "O Gerente conduz até 5 reuniões por semana (10 horas); o que passar vai para um consultor da Wise, que registra o diagnóstico no portal. O cliente recebe o diagnóstico e o plano de ação num documento da Wise em até 2 dias úteis, e o acesso ao Wise Hub. "
    "Fora do ICP: autodiagnóstico na hora, resultado com o link do Hub e e-mail com um próximo passo, sem ligação. Vale para os clientes de todos os parceiros, desde o Select. "
    "Valor de referência: o diagnóstico custaria R$ 2.000 contratado direto com a Wise, e o Wise Hub R$ 3.000; para o cliente do parceiro, sai sem custo. "
    "Se a empresa já é cliente da Wise ou já negocia com ela, é atendida sem proteção de origem nem comissão, e o parceiro é avisado. A pesquisa da UniCesumar só entra com aprovação do Comitê de Ética e consentimento. Se o cliente pede para contratar, abre-se a oportunidade."),
    portal="registra o cadastro com a origem no parceiro, aplica a regra do ICP, libera a agenda ou o autodiagnóstico, calcula o resultado da matriz, recebe o registro do diagnóstico feito pelo Gerente ou pelo consultor e mostra ao parceiro a empresa, a situação e o resultado só com autorização.",
    evs=[PLUG] + [D15(k) for k in ("diag_formato", "diag_entrega", "diag_quem", "diag_icp", "diag_matriz", "todos_parceiros", "valor_conflito")])
PX["P-95"]["frequencia"] = "Até 5 reuniões de cerca de 2 horas por semana com o Gerente; o que passar vai para um consultor da Wise"
PX["P-95"]["participantes"] = [CONSUL]
f95 = FL("""i1 i G Cliente se cadastra pelo link do parceiro
        t1 a G Registrar o cadastro com a origem no parceiro e avisar o parceiro
        g1 d G A empresa está no ICP da Wise?
        t2 a G Liberar o autodiagnóstico na hora
        t3 a G Mostrar o resultado e o link do Wise Hub
        t4 a G Enviar o resultado e um próximo passo por e-mail
        t5 a G Liberar a agenda para a reunião
        e1 em G Cliente marca o horário
        t6 s G Conferir a agenda da semana
        g2 d G O Gerente já tem 5 reuniões na semana?
        t7 s G Passar a reunião a um consultor da Wise
        t8 t G Adaptar o roteiro ao cliente (Gerente ou consultor)
        t9 t G Abrir a reunião de cerca de 2 horas (Gerente ou consultor)
        g0 d G O cliente compareceu?
        ta w G Oferecer um novo horário ou o autodiagnóstico
        tb t G Conduzir o diagnóstico pela Matriz 5x5 e pelo roteiro (Gerente ou consultor)
        tc t G Montar o plano de ação com o cliente (Gerente ou consultor)
        g3 d G Pesquisa aprovada pelo CEP e consentida pelo cliente?
        td t G Aplicar a pesquisa
        te s G Registrar o diagnóstico e o plano no portal (Gerente ou consultor)
        tf t G Enviar o diagnóstico e o plano em até 2 dias úteis (Gerente ou consultor)
        tg s G Liberar o acesso ao Wise Hub
        g4 d G O cliente autorizou mostrar o resultado ao parceiro?
        th a G Liberar o resultado ao parceiro no portal
        g5 d G O cliente pediu para contratar a consultoria?
        ti s G Abrir a oportunidade com a origem no parceiro
        f0 f G Reunião não realizada
        f1 f G Autodiagnóstico entregue
        f2 f G Diagnóstico e plano de ação entregues
        f3 f G Oportunidade aberta""",
     "i1>t1>g1; g1:Não>t2>t3>t4>f1; g1:Sim>t5>e1>t6>g2; g2:Sim>t7>t8; g2:Não>t8; t8>t9>g0; g0:Não>ta>f0; g0:Sim>tb>tc>g3; g3:Sim>td>te; g3:Não>te; te>tf>tg>g4; g4:Sim>th>g5; g4:Não>g5; g5:Sim>ti>f3; g5:Não>f2",
     ext={"X1": "Parceiro", "X2": "Cliente do parceiro"},
     msg=[("X2", "i1", "Cadastro de qualificação"), ("t1", "X1", "Aviso de novo cliente"), ("t3", "X2", "Resultado e link do Hub"), ("t4", "X2", "E-mail do resultado"),
          ("X2", "e1", "Horário marcado"), ("tf", "X2", "Diagnóstico e plano de ação"), ("tg", "X2", "Acesso ao Hub"), ("th", "X1", "Resultado autorizado")])
f95["status"] = "confirmado"; f95["evidencias"] = [PLUG, D15("diag_formato"), D15("diag_entrega"), D15("diag_quem")]
PX["P-95"]["fluxo"] = f95
PX["P-95"]["saidas"] = [s for s in PX["P-95"]["saidas"] if not str(s.get("para")).startswith("EXT:")] + [{"nome": "Diagnóstico e plano de ação entregues", "para": "EXT:Cliente do parceiro"}]

dsc("P-33", evs=[D15("diag_entrega")])
for n in PX["P-33"]["fluxo"]["nos"]:
    if n["nome"].startswith("Levar ao closer o contexto"): n["nome"] = "Levar ao closer o contexto: parceiro, diagnóstico e plano de ação"
dsc("P-39", novo_desc="Seis e doze meses depois do fechamento, o consultor que atende o cliente registra no portal se o cliente continua e o resultado obtido; o Gerente acompanha e conta ao parceiro que indicou.",
    portal="cria a tarefa para o consultor, recebe o registro e lembra o Gerente de avisar o parceiro.", evs=[D15("acesso_consultor")])
f39 = FL("""i1 it G 6 ou 12 meses do fechamento
        t1 a G Criar a tarefa de checagem para o consultor
        t2 s S Registrar no portal se o cliente continua e o resultado obtido
        t3 w G Contar ao parceiro como está o cliente que ele indicou
        f1 f G Checagem registrada e parceiro informado""")
f39["status"] = "confirmado"; f39["evidencias"] = [D15("acesso_consultor")]
PX["P-39"]["fluxo"] = f39
dsc("P-90", extra="O perfil para a reunião de diagnóstico é: " + ICP + ". Abaixo disso, o cliente faz o autodiagnóstico.", evs=[D15("diag_icp")])
for f in d["fatos"]:
    if f["id"] == "F-041":
        f["texto"] = ("Entregável padrão para os clientes de todos os parceiros, desde o Select: o cliente entra pelo link do parceiro; no ICP da Wise (" + ICP + "), uma reunião de cerca de 2 horas com diagnóstico e plano de ação, pela Matriz 5x5 mesclada ao roteiro de diagnóstico adaptado a cada cliente, e o documento em até 2 dias úteis; fora do ICP, autodiagnóstico na hora e e-mail com o resultado. "
                      "O Gerente conduz até 5 reuniões por semana; o que passar vai para um consultor da Wise.")
        for e in [PLUG, D15("diag_formato"), D15("diag_icp"), D15("diag_quem"), D15("todos_parceiros")]: addev(f, e)
    if f["id"] == "F-042":
        f["texto"] = "Valor de referência mostrado ao cliente do parceiro: o diagnóstico com plano de ação custaria R$ 2.000 contratado direto com a Wise, e o Wise Hub R$ 3.000, total de R$ 5.000; para o cliente do parceiro, sai sem custo. O Wise Hub com as duas marcas é benefício de todo parceiro desde o Select, e o link do Hub aparece depois do diagnóstico ou do autodiagnóstico, nunca solto."
        addev(f, D15("valor_conflito"))

# ---------------------------------------------------------------- 3. valor de referência e cases nas páginas, no kit e no minicurso
VALOR = "o diagnóstico com plano de ação custaria R$ 2.000 contratado direto com a Wise Makers e o Wise Hub R$ 3.000 (total de R$ 5.000); para o cliente do parceiro, sem custo"
CASES_TXT = f"os 8 cases da Wise Makers, com nome e segmento, e o destaque '+{MEDIA}% em média' de crescimento de faturamento"
dsc("P-96", extra=f"A página mostra, no topo, na oferta e no quadro de comparação, que {VALOR}; e mostra {CASES_TXT}.",
    evs=[D15("valor_onde"), D15("valor_conflito"), D15("valor_texto"), D15("cases_nomes"), D15("cases_numero"), D15("cases_onde"), EV_CASES])
dsc("P-75", extra=f"A mensagem pronta diz que {VALOR}.", evs=[D15("valor_onde")])
dsc(P98, extra=f"A página dos parceiros mostra o que o parceiro passa a oferecer, com o valor de referência (R$ 2.000 do diagnóstico e R$ 3.000 do Wise Hub, sem custo para o cliente dele), e {CASES_TXT}.",
    evs=[D15("valor_onde"), D15("cases_onde")])
dsc("P-89", extra=f"O kit traz {CASES_TXT}, para o parceiro usar com os clientes.", evs=[D15("cases_onde")])
dsc("P-88", extra="O minicurso mostra os cases e o valor de referência do diagnóstico.", evs=[D15("cases_onde"), D15("valor_onde")])
dsc("P-23", extra=f"Na apresentação da Wise, a conversa usa {CASES_TXT}.", evs=[D15("cases_onde")])
P_CASES = add("processos", "P", nome="Manter os cases de resultado atualizados", pai="P-59", ordem=5,
    descricao=("A cada trimestre, o Gerente lê a página de cases da Wise Makers e atualiza os números, os nomes e o destaque de média nas duas páginas, no kit e no minicurso. "
               "Os cases comparam os meses de trabalho com os mesmos meses do ano anterior à entrada da Wise, sem valores em reais. Hoje: " + LISTA_CASES + f"; média de +{MEDIA}%. Todos os 8 clientes autorizaram o uso do nome. No portal: guarda os cases num lugar só, usado pelas páginas e pelo kit."),
    dono=GP, participantes=[], gatilho="Primeiro dia útil do trimestre", entradas=[], saidas=[], cliente="Parceiros e clientes dos parceiros", sistemas=[SI_POR],
    indicadores=[], frequencia="Trimestral", dores=[], regras=[], status="confirmado", hipoteses=[], evidencias=[D15("cases_atualizar"), D15("cases_nomes"), D15("cases_numero"), EV_CASES],
    situacao="no_papel", fluxo_dispensado=None, principios=["F-011"], portal="guarda os cases num lugar só, usado pelas páginas e pelo kit.")
PX[P_CASES] = d["processos"][-1]
fc = FL("""i1 it G Primeiro dia útil do trimestre
        t1 t G Ler a página de cases da Wise Makers
        t2 t G Conferir se entrou case novo e se os clientes autorizam o nome
        t3 s G Atualizar os números, os nomes e a média no portal
        t4 t G Conferir as duas páginas, o kit e o minicurso
        f1 f G Cases atualizados""")
fc["status"] = "confirmado"; fc["evidencias"] = [D15("cases_atualizar")]
PX[P_CASES]["fluxo"] = fc
for dest in ("P-96", "P-89", "P-88", P98):
    LIGA(P_CASES, "Cases atualizados", dest)

# ---------------------------------------------------------------- 4. decisões, perguntas e formulário
for texto, evs in [
    ("Os diretores administram o portal, com acesso total, inclusive para editar as landing pages.", [D15("acesso_diretor"), D15("dono")]),
    ("Os consultores entram com o perfil de consultor: veem clientes e oportunidades e registram os diagnósticos e as checagens que fazem, sem editar páginas nem regras.", [D15("acesso_consultor")]),
    ("O Gerente continua dono de todos os processos; diretores e consultores executam e registram a parte deles.", [D15("dono")]),
    ("O diagnóstico do cliente do parceiro passa a ser uma reunião de cerca de 2 horas, com diagnóstico e plano de ação na mesma conversa, para os clientes de todos os parceiros; o documento sai em até 2 dias úteis.", [PLUG, D15("diag_formato"), D15("diag_entrega"), D15("todos_parceiros")]),
    ("A base da reunião é a Matriz 5x5, mesclada ao roteiro de diagnóstico da Wise e adaptada a cada cliente.", [D15("diag_matriz"), D15("diag_formato")]),
    ("O Gerente conduz até 5 reuniões de diagnóstico por semana; o que passar vai para um consultor da Wise.", [D15("diag_quem")]),
    ("ICP para a reunião: " + ICP + ". Abaixo disso, autodiagnóstico.", [D15("diag_icp")]),
    ("Valor de referência: diagnóstico R$ 2.000 (antes R$ 1.400) e Wise Hub R$ 3.000, total de R$ 5.000, sem custo para o cliente do parceiro. Aparece na página do cliente (topo, oferta e comparação), na página dos parceiros e na mensagem pronta.", [D15("valor_conflito"), D15("valor_onde"), D15("valor_texto")]),
    (f"Cases: os 8 com nome e segmento, destaque '+{MEDIA}% em média', nas duas páginas, no minicurso, no kit e na conversa de entrada; o Gerente atualiza a cada trimestre.", [D15("cases_nomes"), D15("cases_numero"), D15("cases_onde"), D15("cases_atualizar")]),
]:
    add("decisoes", "DE", data=H11, texto=texto, por="PE-01", provisoria=False, evidencias=evs)

ids15 = []
for k, it in I15.items():
    if k not in R15: continue
    ids15.append(add("perguntas", "Q", texto=it["texto"], tipo=it["tipo"], opcoes=it["opcoes"], alvo=["P-95"] if k.startswith(("diag", "todos")) else ["P-93"] if k.startswith(("acesso", "dono")) else ["P-96"],
                     para=["PE-01"], rodada=9, bloco=it["bloco"], status="respondida", formulario=None, respostas=[D15(k)], respondida_por=["PE-01"], chave="PD-" + k,
                     contexto=it["contexto"], logica=it.get("logica", ""), citacoes=[], visual="", recomendo=""))
fo15 = add("formularios", "FO", titulo="FO-15: processos depois da reunião com a PluggMe", rodada=9, para=["PE-01"], canal="artifact", perguntas=ids15,
           introducao="Acessos ao portal, diagnóstico de 2 horas, valor de referência e cases.", link="https://claude.ai/artifact/6JWvXsaRkFpTEfSpjjxDVX",
           status="respondido", respondido_por=["PE-01"], respostas_recebidas=1, enviado_em="2026-11-18", prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in ids15: q["formulario"] = fo15

# o que ficou para depois
for texto, alvo, ctx in [
    ("Você pode enviar o roteiro de diagnóstico que serve de exemplo?", ["P-95"],
     "No FO-15 você citou o roteiro de diagnóstico 'em anexo', para mesclar à Matriz 5x5. O formulário não aceita anexos e o arquivo não chegou."),
    ("Como a página confere a 'venda mais complexa' do ICP?", ["P-95"],
     "O cadastro hoje pergunta vendedores e faturamento. 'Venda mais complexa' não tem campo: precisa de uma pergunta no cadastro ou de uma conferência do Gerente antes de confirmar a reunião."),
]:
    add("perguntas", "Q", texto=texto, tipo="aberta", opcoes=[], alvo=alvo, para=["PE-01"], rodada=10, bloco="Diagnóstico", status="aberta", formulario=None,
        respostas=[], respondida_por=[], chave="pendente-fo15", contexto=[ctx], logica="", citacoes=[], visual="", recomendo="")

d["historico"].append({"data": H11, "evento": "To-be v11: FO-15 aplicado. Diretores administram o portal e consultores registram a parte deles; diagnóstico de cerca de 2 horas com plano de ação, pela Matriz 5x5 mesclada ao roteiro, até 5 por semana com o Gerente; ICP com 3 vendedores, R$ 250 mil por mês e venda complexa; valor de referência R$ 2.000 mais R$ 3.000 do Hub; cases com nome e média de +35%, atualizados a cada trimestre (processo novo)."})
print("FO-15:", len(ids15), "respostas aplicadas; processo novo", P_CASES)
