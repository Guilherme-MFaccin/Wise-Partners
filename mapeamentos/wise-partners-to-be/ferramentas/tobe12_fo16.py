# Rodada 10 (19/11/2026): FO-16. Executado dentro de tobe12_base.py, depois do FO-15.
# O canvas sai do mapa de processos e vira um quadro de modelo de negócio separado; aqui entram só as mudanças de processo.
H12 = "2026-11-19"
EV_BY_ID = lambda e: next((x for x in d["evidencias"] if x["id"] == e), {})
R16 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-16/fo21_itens/BM-*.json")}
I16 = {x["id"][3:]: x for x in json.load(open(BASE + "/ferramentas/fo16_itens.json"))}

def D16(k):
    key = ("d16", k)
    if key not in _cache:
        _cache[key] = ev_raw("validacao", "FO-16: processos no Business Model Canvas", _texto(R16[k]), f"FO-16/BM-{k}", pessoa="PE-01", data=H12)
    return _cache[key]

# ---------------------------------------------------------------- ferramentas que passam a ter nome no mapa
SI_AGENDA = add("sistemas", "SI", nome="Google Agenda", status="confirmado", evidencias=[D16("fer-agenda")])
SI_MEET = add("sistemas", "SI", nome="Google Meet", status="confirmado", evidencias=[D16("video-qual")])
SI_EMAIL = add("sistemas", "SI", nome="E-mail do portal", status="confirmado", evidencias=[D16("fer-email")])
SI_META = add("sistemas", "SI", nome="Meta Ads, pixel e GA4", status="confirmado", evidencias=[D16("fer-meta")])
for s_ in d["sistemas"]:
    if s_["id"] == SI_HUB: addev(s_, D16("fer-hub"))

# ---------------------------------------------------------------- 1. de onde vêm os parceiros: muito além do anúncio
P101 = add("processos", "P", nome="Trazer candidatos por outras origens", pai="P-20", ordem=0,
    descricao=("Parceiros também chegam sem anúncio: de forma orgânica, em eventos e feiras, por contatos pessoais dos consultores e dos sócios, por instituições e órgãos de governo e por indicação de clientes. "
               "Quem fez o contato envia o link da página dos parceiros e registra a origem; o candidato segue pelo mesmo caminho da fila. No portal: registra a origem de cada candidato, para comparar o custo e o resultado de cada canal."),
    dono=GP, participantes=[CONSUL, DIR], gatilho="Contato com um possível parceiro fora da campanha", entradas=[], saidas=[], cliente="Candidato a parceiro", sistemas=[SI_POR, SI_WPP],
    indicadores=[], frequencia="Quando acontece", dores=[], regras=[], status="confirmado", hipoteses=[], evidencias=[D16("bloco-can"), D16("canais-fases")],
    situacao="no_papel", fluxo_dispensado=None, principios=["F-015"], portal="registra a origem de cada candidato, para comparar o custo e o resultado de cada canal.")
PX[P101] = d["processos"][-1]
f101 = FL("""i1 i G Contato com um possível parceiro fora da campanha
        t1 w G Enviar o link da página dos parceiros
        t2 s G Registrar a origem do candidato
        e1 em G Cadastro pela página
        f1 f G Candidato na fila""", ext={"X1": "Possível parceiro"}, msg=[("t1", "X1", "Link da página"), ("X1", "e1", "Cadastro")])
f101["status"] = "confirmado"; f101["evidencias"] = [D16("bloco-can")]
PX[P101]["fluxo"] = f101
LIGA(P101, "Cadastros de outras origens", "P-21")
dsc(P98, extra="O anúncio é um dos canais de entrada, não o único: os parceiros também chegam por outras origens (4.0).", evs=[D16("bloco-can")])
dsc("P-20", extra="O candidato pode vir da campanha de anúncios ou de outras origens: orgânica, eventos, feiras, contatos dos consultores e sócios, instituições de governo e indicação de clientes. Todos passam pela mesma fila.",
    evs=[D16("bloco-can"), D16("canais-fases")])
for cv in d["cadeias_de_valor"]:
    if cv["id"] == "CV-01":
        cv["gatilho"] = "Campanha de anúncios ou contato por outra origem"; cv["etapas"][0]["nome"] = "Atrair (campanha e outras origens) e selecionar pela fila"
        addev(cv, D16("canais-fases"))
dsc("P-75", extra="Na maior parte das vezes o parceiro escreve a própria mensagem e só usa o link; a mensagem pronta é uma sugestão.", evs=[D16("canais-fases")])
dsc("P-96", extra="A mensagem pronta é uma sugestão: o parceiro costuma mandar o link com o texto dele.", evs=[D16("canais-fases")])

# ---------------------------------------------------------------- 2. diagnóstico: roteiro por IA, sem reunião extra, termo do cliente
ICP12 = "3 vendedores ou mais, faturamento de pelo menos R$ 250 mil por mês e venda mais complexa (ciclo de venda acima de 2 dias)"
dsc("P-95", novo_desc=("O cliente do parceiro abre o link, preenche o cadastro de qualificação, aceita o termo de uso do diagnóstico e a página decide pelo ICP da Wise (" + ICP12 + "); o parceiro é avisado. "
    "No ICP: agenda do Google com link do Google Meet. Antes da reunião, a IA gera o roteiro adaptado ao cliente a partir do cadastro (Matriz 5x5 como base, mesclada ao roteiro de diagnóstico) e o deixa no Wise Hub; quem conduz chega com o roteiro pronto. "
    "A reunião dura cerca de 2 horas: diagnóstico pelos 5 pilares e, na parte final, como usar o Wise Hub e o plano de ação. Tudo sai do que o cliente conta na reunião: a Wise não pede dados depois nem marca outro encontro. "
    "O plano de ação em PDF chega em até 2 dias úteis pelo portal e por e-mail. Mais informações para compor o plano, ou outra reunião para explicá-lo, são horas de consultoria pagas, como diz o termo. "
    "O Gerente conduz até 5 reuniões por semana; o que passar vai para um consultor da Wise, que registra no portal. Fora do ICP: autodiagnóstico na hora, resultado com o link do Hub e e-mail com um próximo passo. "
    "Valor de referência: diagnóstico R$ 2.000 e Wise Hub R$ 3.000, sem custo para o cliente do parceiro. Se a empresa já é cliente da Wise ou já negocia com ela, não há proteção de origem nem comissão. Se o cliente pede para contratar, abre-se a oportunidade."),
    portal="registra o cadastro e o aceite do termo, aplica a regra do ICP, libera a agenda ou o autodiagnóstico, gera o roteiro com IA e o publica no Wise Hub, recebe o registro do diagnóstico, gera o plano de ação em PDF e o envia pelo portal e por e-mail.",
    evs=[D16(k) for k in ("diag-mescla", "diag-adapta", "diag-agenda", "diag-plano", "diag-complexa", "doc-onde", "video-qual", "matriz")])
f95 = FL("""i1 i G Cliente se cadastra pelo link do parceiro e aceita o termo
        t1 a G Registrar o cadastro e o aceite e avisar o parceiro
        g1 d G A empresa está no ICP da Wise?
        t2 a G Liberar o autodiagnóstico na hora
        t3 a G Mostrar o resultado e o link do Wise Hub
        t4 a G Enviar o resultado e um próximo passo por e-mail
        t5 a G Liberar a agenda com o link do Google Meet
        e1 em G Cliente marca o horário
        t6 s G Conferir a agenda da semana
        g2 d G O Gerente já tem 5 reuniões na semana?
        t7 s G Passar a reunião a um consultor da Wise
        t8 a G Gerar com IA o roteiro adaptado e publicá-lo no Wise Hub
        t9 t G Abrir a reunião com o roteiro pronto (Gerente ou consultor)
        g0 d G O cliente compareceu?
        ta w G Oferecer um novo horário ou o autodiagnóstico
        tb t G Conduzir o diagnóstico pelos 5 pilares (Gerente ou consultor)
        tc t G Mostrar o Wise Hub e como usar o plano de ação
        g3 d G Pesquisa aprovada pelo CEP e consentida pelo cliente?
        td t G Aplicar a pesquisa
        te s G Registrar o diagnóstico e o plano no portal (Gerente ou consultor)
        tf a G Gerar o plano de ação em PDF e enviar pelo portal e por e-mail
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
     msg=[("X2", "i1", "Cadastro e aceite do termo"), ("t1", "X1", "Aviso de novo cliente"), ("t3", "X2", "Resultado e link do Hub"), ("t4", "X2", "E-mail do resultado"),
          ("X2", "e1", "Horário marcado"), ("tf", "X2", "Plano de ação em PDF"), ("tg", "X2", "Acesso ao Hub"), ("th", "X1", "Resultado autorizado")])
for n_ in f95["nos"]:
    if n_["id"] == "t5": n_["sistema"] = SI_AGENDA
    if n_["id"] in ("t9", "tb", "tc"): n_["sistema"] = SI_MEET
    if n_["id"] == "t8": n_["sistema"] = SI_HUB
f95["status"] = "confirmado"; f95["evidencias"] = [D16("diag-adapta"), D16("diag-agenda"), D16("diag-plano")]
PX["P-95"]["fluxo"] = f95
PX["P-95"]["sistemas"] = [SI_POR, SI_HUB, SI_AGENDA, SI_MEET, SI_EMAIL]
dsc("P-90", novo_desc=PX["P-90"]["descricao"].partition(" No portal: ")[0].replace(ICP, ICP12), evs=[D16("diag-complexa")])
dsc("P-64", novo_desc=("Dois termos curtos, com número de versão. O termo de adesão do parceiro, aceito no cadastro da página dos parceiros. O termo de uso do diagnóstico, aceito pelo cliente do parceiro antes de enviar o cadastro: o diagnóstico e o plano de ação saem só do que ele contar na reunião; mais informações ou outra reunião são horas de consultoria pagas. "
    "Cada mudança gera uma versão nova com data de vigência; o aceite de cada um fica ligado à versão que leu. Quando a versão muda, o portal pede o aceite da nova no próximo acesso, depois dos 30 dias de aviso."),
    portal="guarda as versões dos dois termos e mostra em cada página a versão vigente.", evs=[D16("diag-plano")])
PX["P-64"]["nome"] = "Manter o termo de adesão e o termo de uso do diagnóstico"
dsc("P-88", extra="O roteiro adaptado de cada reunião fica no Wise Hub, onde quem conduz o diagnóstico o acessa.", evs=[D16("diag-adapta")])

# ---------------------------------------------------------------- 3. receita e custos
dsc("P-35", extra="Quando um cliente da Wise fecha com o parceiro recomendado, o parceiro pode pagar a contrapartida com uma comissão à Wise.", evs=[D16("bloco-rec")])
dsc("P-62", extra="Além da contrapartida não financeira, o parceiro recomendado pela Prateleira pode pagar à Wise uma comissão sobre o cliente da Wise que fechar com ele.", evs=[D16("bloco-rec")])
dsc("P-06", extra="A conta também separa o CAP (custo de aquisição do parceiro: anúncios e horas de fila e conversa divididos pelos parceiros aprovados) e o custo de cada diagnóstico (horas de reunião e de plano de ação), com valores em reais.", evs=[D16("bloco-cus"), D16("canvas")])
dsc("P-15", extra="O painel mostra em reais o CAP, o custo por diagnóstico e o CAC.", evs=[D16("bloco-cus")])

# ---------------------------------------------------------------- 4. níveis: a resposta do FO-16 inverte a escada aprovada
CT_NIVEL = add("contradicoes", "CT", descricao=("Critério dos níveis. No FO-14 você aprovou: Premium com 60 dias e 3 clientes fechados (ou a avaliação com o Igor), e é no Premium que a Wise passa a recomendar o parceiro; Elite com 60 dias no Premium ou 6 clientes fechados. "
    "No FO-16 você escreveu: 'Para passar para o nível elite, o parceiro tem que passar, pelo menos 1 cliente para fazermos o diagnóstico. Só assim podemos indicá-lo para nossos clientes. Para passar para o nível premium, pelo menos, 1 cliente tem que fechar a consultoria da wise makers.' "
    "Lido ao pé da letra, o Elite fica mais fácil que o Premium e a recomendação passa para o Elite."),
    elemento="P-61", evidencias=[D16("bloco-pv")] + [e for e in PX["P-61"]["evidencias"] if EV_BY_ID(e).get("fonte", "").startswith("FO-14")][:1],
    status="aberta", pergunta=None, resolucao="", evidencias_resolucao=[], lado_patrocinador="FO-16", lado_livros="FO-14")
PX["P-61"]["status"] = "contestado"; addev(PX["P-61"], D16("bloco-pv"))
QCT = add("perguntas", "Q", texto="Qual é a ordem e o critério de cada nível?", tipo="escolha", opcoes=[], alvo=["P-61", CT_NIVEL], para=["PE-01"], rodada=11,
          bloco="Níveis", status="aberta", formulario=None, respostas=[], respondida_por=[], chave="ct-niveis", contexto=[], logica="", citacoes=[], visual="", recomendo="")
for c in d["contradicoes"]:
    if c["id"] == CT_NIVEL: c["pergunta"] = QCT

# ---------------------------------------------------------------- 5. perguntas que ficam para o FO-17
for texto, alvo, ctx in [
    ("Qual é a comissão que o parceiro paga à Wise quando um cliente da Wise fecha com ele?", ["P-35"], "No FO-16 você disse que o parceiro pode pagar com a comissão dele. Falta o percentual e sobre o quê."),
    ("Quais são os valores reais para a conta do canal (custo-hora, verba de anúncios, mensalidade média e permanência)?", ["P-06"], "O canvas precisa mostrar os custos em reais. Alguns valores vêm da especificação e do Playbook; outros só você tem."),
]:
    add("perguntas", "Q", texto=texto, tipo="aberta", opcoes=[], alvo=alvo, para=["PE-01"], rodada=11, bloco="Modelo de negócio", status="aberta", formulario=None,
        respostas=[], respondida_por=[], chave="pendente-fo16", contexto=[ctx], logica="", citacoes=[], visual="", recomendo="")
d["perguntas"] = [q for q in d["perguntas"] if not (q.get("chave") == "pendente-fo15" and "venda mais complexa" in q.get("texto", ""))]

# ---------------------------------------------------------------- 6. decisões e o formulário
for texto, evs in [
    ("O mapa de processos e o modelo de negócio ficam em dois quadros separados. O modelo de negócio usa o Business Model Canvas e as outras ferramentas dos livros (Value Proposition Canvas por categoria de parceiro, mapa de hipóteses, portfólio), com valores em reais.", [D16("arquitetura"), D16("canvas")]),
    ("Os parceiros também chegam sem anúncio: orgânico, eventos, feiras, contatos dos consultores e sócios, instituições de governo e indicação de clientes.", [D16("bloco-can"), D16("canais-fases")]),
    ("O roteiro do diagnóstico é gerado por IA a partir do cadastro e fica no Wise Hub; quem conduz chega com ele pronto.", [D16("diag-adapta")]),
    ("A reunião termina mostrando o Wise Hub e como usar o plano de ação; não há outro encontro nem pedido de dados depois. Mais informações ou outra reunião são horas pagas, e isso está no termo de uso do diagnóstico, aceito antes do cadastro.", [D16("diag-agenda"), D16("diag-plano")]),
    ("O plano de ação é montado no portal e gerado em PDF, enviado pelo portal e por e-mail. A videochamada padrão é o Google Meet.", [D16("doc-onde"), D16("video-qual")]),
    ("Venda mais complexa: ciclo de venda acima de 2 dias, perguntado no cadastro.", [D16("diag-complexa")]),
]:
    add("decisoes", "DE", data=H12, texto=texto, por="PE-01", provisoria=False, evidencias=evs)
ids16 = []
for k, it in I16.items():
    if k not in R16: continue
    ids16.append(add("perguntas", "Q", texto=it["texto"], tipo=it["tipo"], opcoes=it["opcoes"], alvo=["P-95"] if k.startswith(("diag", "doc", "video", "matriz")) else ["P-20"],
                     para=["PE-01"], rodada=10, bloco=it["bloco"], status="respondida", formulario=None, respostas=[D16(k)], respondida_por=["PE-01"], chave="BM-" + k,
                     contexto=[], logica="", citacoes=[], visual="", recomendo=""))
fo16 = add("formularios", "FO", titulo="FO-16: processos no Business Model Canvas", rodada=10, para=["PE-01"], canal="artifact", perguntas=ids16,
           introducao="O canvas, as ferramentas, os responsáveis e o diagnóstico de 2 horas.", link="https://claude.ai/artifact/7zQHXNkz1hVmaibz9Rbq8L",
           status="respondido", respondido_por=["PE-01"], respostas_recebidas=1, enviado_em="2026-11-19", prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in ids16: q["formulario"] = fo16
d["historico"].append({"data": H12, "evento": "To-be v12: FO-16 aplicado. O canvas vira quadro separado de modelo de negócio; parceiros também por outras origens (processo novo 4.0); roteiro do diagnóstico por IA no Wise Hub; reunião sem encontro extra e termo de uso do diagnóstico; venda complexa = ciclo acima de 2 dias; contradição aberta no critério dos níveis."})
print("FO-16:", len(ids16), "respostas; processo novo", P101, "; contradição", CT_NIVEL)
