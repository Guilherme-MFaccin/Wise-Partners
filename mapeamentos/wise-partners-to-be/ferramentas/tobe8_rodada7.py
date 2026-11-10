# Rodada 7 (09/11/2026): o que muda com as duas landing pages, a fila de espera e a escada nova de níveis.
# Fontes: pedido do Igor de 07/11 (repassado pelo patrocinador), FO-11 (25 respostas) e FO-12 (16 respostas).
# Executado dentro de tobe8_base.py, depois da Rodada 6.
H7 = "2026-11-09"
R11 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-11/fo16_itens/PR-*.json")}
R12 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-12/fo17_itens/NV-*.json")}
I11 = {x["id"][3:]: x for x in json.load(open(BASE + "/ferramentas/fo11_itens.json"))}
I12 = {x["id"][3:]: x for x in json.load(open(BASE + "/ferramentas/fo12_itens.json"))}

def _texto(v):
    val = v.get("valor", ""); val = "; ".join(val) if isinstance(val, list) else val
    return ((val + ". ") if val else "") + v.get("obs", "")

def D11(k):
    key = ("d11", k)
    if key not in _cache:
        _cache[key] = ev_raw("validacao", "FO-11: processos depois das landing pages", _texto(R11[k]), f"FO-11/PR-{k}", pessoa="PE-01", data=H7)
    return _cache[key]

def D12(k):
    key = ("d12", k)
    if key not in _cache:
        _cache[key] = ev_raw("validacao", "FO-12: escada de níveis e onboarding por etapas", _texto(R12[k]), f"FO-12/NV-{k}", pessoa="PE-01", data=H7)
    return _cache[key]

IGOR = ev_raw("entrevista", "Pedido do Igor, repassado pelo patrocinador em 07/11",
              "Vamos precisar fazer com que os leads parceiros das campanhas do meta entrem na landing page, inscrever-se e entrarem em uma fila de espera visualizável pelos administradores no portal do wise partners. Isso serve para que eu possa entrar em contato via whatsapp um a um e, somente então, eu envio o link do google calendar.",
              "conversa no chat do mapeamento", pessoa="PE-01", data="2026-11-07")

PX = {p["id"]: p for p in d["processos"]}

def upd(pid, evs, **kw):
    p = PX[pid]
    p.update(kw)
    if "descricao" in kw and "portal" in kw:
        pass
    for e in evs:
        if e not in p["evidencias"]: p["evidencias"].append(e)
    p["status"] = "confirmado"
    return p

def N(i, tipo, nome, raia="PA-01", **kw):
    return {"id": i, "tipo": tipo, "nome": nome, "raia": raia, **kw}

def L(de, para, rotulo=None):
    return {"de": de, "para": para, **({"rotulo": rotulo} if rotulo else {})}

def fluxo(pid, evs, raias, nos, ligs, externos=(), mensagens=()):
    PX[pid]["fluxo"] = {"status": "confirmado", "evidencias": list(evs), "raias": list(raias), "externos": list(externos),
                        "nos": nos, "ligacoes": ligs, "mensagens": list(mensagens)}
    PX[pid]["fluxo_dispensado"] = None

POR, WPP = {"sistema": SI_POR, "modo": "sistema"}, {"sistema": SI_WPP}
AUTO = {"sistema": SI_POR, "modo": "automatico"}

# ---------------------------------------------------------------- 1. Entrada pela fila (P-20 a P-25)
upd("P-20", [IGOR, D11("entrada"), D11("fila_conversa"), D12("criterio_geral")],
    descricao="Da campanha de aquisição ao parceiro com acesso. Todo parceiro entra pelo mesmo caminho, sem exceção: anúncio da campanha, landing page, cadastro com aceite do termo e da política, fila no portal, contato do Gerente pelo WhatsApp, link da agenda, confirmação do horário na véspera e no dia, e a conversa de entrada, em que a conta é criada. A fila existe para que concorrentes e pessoas sem interesse não tenham acesso ao que a Wise oferece. O processo serve a qualquer tipo de parceiro; só a campanha muda (hoje, software de gestão, com CRM e ERP à frente). No portal: recebe o cadastro na fila, avisa os administradores, guarda a origem da campanha e registra cada mudança de situação até a aprovação.",
    gatilho="Cadastro enviado pela landing page", portal="recebe o cadastro na fila, avisa os administradores, guarda a origem da campanha e registra cada mudança de situação até a aprovação.")
fluxo("P-20", [IGOR, D11("entrada")], ["PA-01", "PA-05"], [
    N("i1", "inicio", "Cadastro com aceite enviado pela landing page", "PA-05"),
    N("t1", "tarefa", "Colocar o cadastro na fila e avisar os administradores", **AUTO),
    N("t2", "tarefa", "Chamar o candidato pelo WhatsApp em até 24 horas úteis", **WPP),
    N("g0", "decisao", "O candidato respondeu?"),
    N("s0", "subprocesso", "Nutrir candidato", processo="P-25"),
    N("s1", "subprocesso", "Qualificar o candidato pelo WhatsApp", processo="P-22"),
    N("g1", "decisao", "Cumpre os critérios da fila?"),
    N("t3", "tarefa", "Descartar o cadastro com o motivo", **POR),
    N("t4", "tarefa", "Enviar o link da agenda", **WPP),
    N("t5", "tarefa", "Marcar o horário na agenda", "PA-05"),
    N("t6", "tarefa", "Confirmar o horário na véspera e no dia", **WPP),
    N("s2", "subprocesso", "Conduzir a conversa de entrada", processo="P-23"),
    N("g2", "decisao", "O candidato quer seguir?"),
    N("f0", "fim", "Candidato em nutrição"), N("f1", "fim", "Cadastro descartado"), N("f2", "fim", "Candidato sem interesse"),
    N("f3", "fim", "Parceiro Select com acesso ao portal")],
    [L("i1", "t1"), L("t1", "t2"), L("t2", "g0"), L("g0", "s0", "Não"), L("s0", "f0"), L("g0", "s1", "Sim"), L("s1", "g1"),
     L("g1", "t3", "Não"), L("t3", "f1"), L("g1", "t4", "Sim"), L("t4", "t5"), L("t5", "t6"), L("t6", "s2"), L("s2", "g2"),
     L("g2", "f2", "Não"), L("g2", "f3", "Sim")])

upd("P-21", [IGOR, D11("outros_softwares")], nome="Manter a fila de candidatos", gatilho="Cadastro enviado pela landing page ou candidato identificado",
    descricao="Os cadastros das campanhas de aquisição entram na fila do portal com a data de entrada e a origem (campanha, anúncio e vídeo); candidatos vindos de outras origens (orgânica, clientes do grupo, eventos) entram na mesma fila. A fila mostra quem espera contato, quem foi contatado, quem tem reunião marcada e o histórico de aprovados e descartados. No portal: é a fila de espera em Configurações, com a situação, a observação e os botões de WhatsApp, agenda e aprovação.",
    portal="é a fila de espera em Configurações, com a situação, a observação e os botões de WhatsApp, agenda e aprovação.")

upd("P-22", [D11("fila_criterio"), D12("criterio_geral"), D11("entrada"), D11("fila_quem")], nome="Qualificar o candidato pelo WhatsApp", gatilho="Candidato respondeu ao primeiro contato",
    descricao="Pela própria mensagem, o Gerente confirma as informações que o candidato deixou no cadastro e aplica os critérios: ter clientes empresariais que podem estar no ICP da Wise (vale para qualquer tipo de parceiro), não ser concorrente da Wise Makers, mostrar interesse real em oferecer a consultoria aos clientes e ter um responsável na empresa para cuidar da parceria. Não há mínimo de clientes ativos. O Gerente cuida da fila sempre. No portal: guarda a observação de cada contato e muda a situação do cadastro.",
    portal="guarda a observação de cada contato e muda a situação do cadastro.")

upd("P-23", [D11("fila_conversa"), D11("encontro"), D12("link_afiliado")], nome="Conduzir a conversa de entrada", gatilho="Horário marcado e confirmado",
    descricao="Conversa do Gerente com o candidato, no lugar do workshop: perguntas sobre a empresa e os clientes dele; apresentação da Wise Makers, com números e casos; como o parceiro ganha junto com a Wise; a consultoria gratuita que ele oferece aos clientes; o Wise Hub por dentro e os resultados dos clientes; como é fácil indicar (o link da página do cliente, no portal Wise Partners, com o login dele); o minicurso de como vender a Wise. No fim, o Gerente aprova o cadastro, cria a conta e acompanha o parceiro entrando no portal. No portal: aprova o cadastro, cria o parceiro como Select com o aceite registrado e gera a conta com senha provisória e a mensagem de acesso.",
    portal="aprova o cadastro, cria o parceiro como Select com o aceite registrado e gera a conta com senha provisória e a mensagem de acesso.")
fluxo("P-23", [D11("fila_conversa")], ["PA-01", "PA-05"], [
    N("i1", "inicio", "Horário marcado e confirmado"),
    N("t1", "tarefa", "Perguntar sobre a empresa e os clientes do candidato"),
    N("t2", "tarefa", "Apresentar a Wise Makers, os números e os casos"),
    N("t3", "tarefa", "Mostrar como o parceiro ganha junto com a Wise"),
    N("t4", "tarefa", "Mostrar a consultoria gratuita para os clientes dele"),
    N("t5", "tarefa", "Mostrar o Wise Hub por dentro e os resultados dos clientes"),
    N("t6", "tarefa", "Mostrar como indicar pelo link da página do cliente"),
    N("t7", "tarefa", "Apresentar o minicurso de como vender a Wise"),
    N("g1", "decisao", "O candidato quer seguir?"),
    N("t8", "tarefa", "Aprovar o cadastro e criar a conta no portal", **POR),
    N("t9", "tarefa", "Entrar no portal com a senha provisória", "PA-05", sistema=SI_POR),
    N("f1", "fim", "Candidato sem interesse"), N("f2", "fim", "Parceiro conectado ao portal")],
    [L("i1", "t1"), L("t1", "t2"), L("t2", "t3"), L("t3", "t4"), L("t4", "t5"), L("t5", "t6"), L("t6", "t7"), L("t7", "g1"),
     L("g1", "f1", "Não"), L("g1", "t8", "Sim"), L("t8", "t9"), L("t9", "f2")])

upd("P-24", [D12("aceite")], nome="Registrar o aceite do termo e da política", gatilho="Cadastro enviado pela landing page",
    descricao="O termo de adesão e a política de privacidade são aceitos no próprio formulário da landing page, com a versão de cada texto, a data e a hora. Na aprovação, o aceite vira o registro de aceite eletrônico do parceiro. Não há negociação de minuta nem assinatura à parte para quem entra pela página. No portal: guarda as versões do termo e da política, registra o aceite no cadastro e cria a aprovação de aceite eletrônico na entrada.",
    portal="guarda as versões do termo e da política, registra o aceite no cadastro e cria a aprovação de aceite eletrônico na entrada.",
    entradas=[], saidas=[{"nome": "Aceite registrado", "para": "P-20"}])
PX["P-24"]["fluxo"] = None; PX["P-24"]["fluxo_dispensado"] = DE_FLUXO

upd("P-25", [D11("fila_prazo")], gatilho="Candidato não responde ou pede para retomar depois")

# o scorecard de entrada sai: o nível de entrada deixa de vir da carteira
d["processos"] = [p for p in d["processos"] if p["id"] != "P-69"]
PX.pop("P-69")
for p in d["processos"]:
    p["entradas"] = [e for e in p.get("entradas", []) if e.get("de") != "P-69"]
    p["saidas"] = [s for s in p.get("saidas", []) if s.get("para") != "P-69"]

# ---------------------------------------------------------------- 2. Integração e onboarding por etapas (P-26 a P-30, P-94, novo P-97)
upd("P-26", [D11("plano90"), D12("onb_c"), D11("ativado")], gatilho="Acesso criado na conversa de entrada",
    descricao="Do acesso criado à ativação, por etapas e metas, sem prazo em dias: o tempo varia de caso a caso. Todo parceiro começa como Select; o portal mostra em que etapa cada um está e há quantos dias, e lembra quem parou. No portal: cria as etapas do nível no card do parceiro, mostra os dias em cada etapa e marca a ativação sozinho no primeiro cliente cadastrado pelo link.",
    portal="cria as etapas do nível no card do parceiro, mostra os dias em cada etapa e marca a ativação sozinho no primeiro cliente cadastrado pelo link.")
fluxo("P-26", [D11("plano90"), D12("onb_c")], ["PA-01"], [
    N("i1", "inicio", "Acesso criado na conversa de entrada"),
    N("s1", "subprocesso", "Preparar a entrada do parceiro", processo="P-27"),
    N("s2", "subprocesso", "Conduzir o onboarding por etapas", processo="P-94"),
    N("f1", "fim", "Parceiro ativado e onboarding do Select concluído")],
    [L("i1", "s1"), L("s1", "s2"), L("s2", "f1")])

upd("P-27", [D12("itens_b"), D11("comunidade"), D11("retorno")], gatilho="Acesso criado na conversa de entrada",
    descricao="O que todo parceiro Select recebe na entrada, na própria conversa: grupo de WhatsApp na comunidade Wise Partners, certificado de parceiro Wise, Wise Hub com as duas marcas, link da página do cliente com a mensagem pronta e o minicurso de como vender a Wise. A Prateleira e a recomendação aos clientes da Wise ficam para o Premium. No portal: gera o link, a página do cliente com a logo do parceiro e os acessos.",
    portal="gera o link, a página do cliente com a logo do parceiro e os acessos.")
upd("P-73", [D11("comunidade"), D11("retorno")], gatilho="Acesso criado na conversa de entrada",
    descricao="Grupo de WhatsApp do parceiro na comunidade Wise Partners desde a entrada, para todos os níveis, até que o tamanho torne isso inviável; nesse ponto a regra é revista. No portal: registra o grupo no card.")
upd("P-75", [D12("link_afiliado")], nome="Entregar o link da página do cliente e a mensagem pronta", gatilho="Acesso criado na conversa de entrada",
    descricao="O link exclusivo do parceiro (partners.wisemakers.com.br/c/código) leva à página do cliente com as duas marcas; a mensagem pronta já vai com o link. É esse link que registra a origem por 180 dias. No portal: gera o link e a mensagem na tela Indicar do parceiro.")
upd("P-29", [D11("treinamento"), D11("fila_conversa")], gatilho="Acesso criado na conversa de entrada",
    descricao="Minicurso gravado de como vender a Wise e facilitar a entrega da consultoria: perfil do cliente ideal, frases que reconhecem a dor e o gesto de indicar pelo link. O Igor grava e revisa; o Gerente mantém atualizado. No portal: libera o minicurso, o kit e o simulador de ganho e registra quando o parceiro assiste.")
upd("P-30", [D11("ativado")], gatilho="Primeiro cliente cadastrado pelo link do parceiro",
    descricao="O parceiro está ativado quando o primeiro cliente se cadastra pelo link dele. Não há prazo de 90 ou 120 dias: quem não avança recebe o lembrete do portal (P-97). No portal: marca a ativação sozinho e avisa o parceiro e o Gerente.")
PX["P-30"]["nome"] = "Declarar a ativação"

upd("P-94", [D11("plano90"), D12("onb_c"), D12("parado")], nome="Conduzir o onboarding por etapas", gatilho="Acesso criado na conversa de entrada",
    descricao="Etapas e metas do Select, na ordem, sem contar dias: primeiro login, feito na conversa; minicurso assistido; anúncio conjunto da parceria publicado; link e mensagem pronta enviados para a base; primeiro cliente cadastrado pelo link (ativação); primeiro diagnóstico feito na base do parceiro. O Premium e o Elite têm onboarding próprio (P-45 e P-44). No portal: cria as etapas, marca sozinho as que o portal registra (login, minicurso, cliente, diagnóstico) e mostra ao parceiro o que falta.",
    portal="cria as etapas, marca sozinho as que o portal registra (login, minicurso, cliente, diagnóstico) e mostra ao parceiro o que falta.",
    frequencia="Uma vez por parceiro", saidas=[{"nome": "Parceiro ativado", "para": "P-40"}])
fluxo("P-94", [D12("onb_c")], ["PA-01", "PA-05"], [
    N("i1", "inicio", "Acesso criado na conversa de entrada"),
    N("t1", "tarefa", "Criar as etapas do onboarding do Select", **AUTO),
    N("t2", "tarefa", "Assistir ao minicurso de como vender a Wise", "PA-05", sistema=SI_POR),
    N("t3", "tarefa", "Publicar o anúncio conjunto da parceria", "PA-05"),
    N("t4", "tarefa", "Enviar o link e a mensagem pronta para a base", "PA-05"),
    N("e1", "espera", "Primeiro cliente cadastrado pelo link", evento="mensagem"),
    N("s1", "subprocesso", "Declarar a ativação", processo="P-30"),
    N("e2", "espera", "Primeiro diagnóstico feito na base do parceiro", evento="mensagem"),
    N("f1", "fim", "Onboarding do Select concluído")],
    [L("i1", "t1"), L("t1", "t2"), L("t2", "t3"), L("t3", "t4"), L("t4", "e1"), L("e1", "s1"), L("s1", "e2"), L("e2", "f1")])

P97 = add("processos", "P", nome="Lembrar o parceiro parado numa etapa", pai="P-26", ordem=6,
    descricao="Sem prazo em dias, o processo não estoura; o que existe é um lembrete. Quando o parceiro fica na mesma etapa além do limite, o portal manda um e-mail com o próximo passo; se ele continuar parado, o caso entra na fila de exceções com os dias na etapa, e o Gerente decide se vale uma mensagem pessoal. No portal: conta os dias em cada etapa, envia o lembrete e põe o caso na fila.",
    dono=GP, participantes=["PA-05"], gatilho="Parceiro na mesma etapa além do limite", entradas=[], saidas=[{"nome": "Caso parado na fila de exceções", "para": "P-09"}],
    cliente="Empresa parceira", sistemas=[SI_POR], indicadores=[], frequencia="Por parceiro parado", dores=[], regras=[], status="confirmado",
    hipoteses=["gatilho"], evidencias=[D12("parado")], situacao="no_papel", fluxo_dispensado=None, principios=["F-008"],
    portal="conta os dias em cada etapa, envia o lembrete e põe o caso na fila.")
PX[P97] = d["processos"][-1]
fluxo(P97, [D12("parado")], ["PA-01", "PA-05"], [
    N("i1", "inicio", "Parceiro na mesma etapa além do limite", evento="tempo"),
    N("t1", "tarefa", "Enviar o lembrete por e-mail com o próximo passo", **AUTO),
    N("e1", "espera", "Prazo depois do lembrete", evento="tempo"),
    N("g1", "decisao", "O parceiro avançou de etapa?"),
    N("t2", "tarefa", "Pôr o caso na fila de exceções com os dias na etapa", **AUTO),
    N("t3", "tarefa", "Decidir se vale uma mensagem pessoal"),
    N("f1", "fim", "Parceiro de volta ao onboarding"), N("f2", "fim", "Caso parado tratado")],
    [L("i1", "t1"), L("t1", "e1"), L("e1", "g1"), L("g1", "f1", "Sim"), L("g1", "t2", "Não"), L("t2", "t3"), L("t3", "f2")])

# ---------------------------------------------------------------- 3. Escada de níveis: Select, Premium e Elite (P-18, P-28, P-44, P-45, P-61)
upd("P-61", [D12("escada"), D12("itens_b"), D11("valor"), D11("nivel"), D12("c_para_b"), D12("b_para_a"), D12("descer"), D12("grandes")],
    gatilho="Revisão anual das regras",
    descricao="Três níveis em escada, e todo parceiro entra pelo Select, qualquer que seja o tamanho da carteira. Select (C): consultoria gratuita aos clientes da carteira que estão no ICP da Wise, comissão por regra única, certificado de parceiro, Wise Hub com as duas marcas, grupo e comunidade, minicurso. Premium (B): tudo do Select, mais a recomendação pela Wise nas consultorias e na Prateleira, mentoria mensal aberta à carteira, eventos e formações da Wise e apresentações a outros parceiros. Elite (A): tudo do Premium, mais o Base Ativa, uma formação gratuita e exclusiva para a base do parceiro, organizada pela Wise. Para o Premium: 60 dias no programa e pelo menos 3 clientes fechados com a Wise vindos dele, ou avaliação do Gerente com o Igor. Para o Elite: 60 dias no Premium ou 6 clientes fechados vindos dele, ou avaliação do Gerente com o Igor. O nível só sobe. No portal: guarda a tabela de níveis e benefícios, apura os critérios e carrega os benefícios no card do parceiro.",
    portal="guarda a tabela de níveis e benefícios, apura os critérios e carrega os benefícios no card do parceiro.")

upd("P-18", [D12("quem_sobe"), D12("c_para_b"), D12("b_para_a"), D12("descer")], gatilho="Primeiro dia útil do trimestre",
    descricao="No fechamento trimestral, o portal lista quem cumpre os critérios do nível acima; o Gerente avalia com o Igor os casos sem número fixo. Quem sobe para Premium passa antes pelo encontro de alinhamento; quem sobe para Elite entra no Base Ativa. Não há descida de nível: se um cliente da Wise tem problema sério com o parceiro, a Wise deixa de recomendá-lo, sem rebaixar (P-87). No portal: apura os critérios, lista os candidatos à subida e registra a decisão com o motivo.",
    portal="apura os critérios, lista os candidatos à subida e registra a decisão com o motivo.")
fluxo("P-18", [D12("quem_sobe"), D12("descer")], ["PA-01", "PA-02"], [
    N("i1", "inicio", "Primeiro dia útil do trimestre", evento="tempo"),
    N("t1", "tarefa", "Listar quem cumpre os critérios do nível acima", **AUTO),
    N("t2", "tarefa", "Avaliar com o Igor os casos sem critério numérico", "PA-02"),
    N("g1", "decisao", "O parceiro sobe de nível?"),
    N("s1", "subprocesso", "Conduzir a entrada no Premium", processo="P-45"),
    N("t3", "tarefa", "Registrar a subida para Elite", **POR),
    N("s2", "subprocesso", "Conduzir o ciclo do Base Ativa", processo="P-44"),
    N("f1", "fim", "Nível mantido"), N("f2", "fim", "Parceiro Premium"), N("f3", "fim", "Parceiro Elite")],
    [L("i1", "t1"), L("t1", "t2"), L("t2", "g1"), L("g1", "f1", "Não"), L("g1", "s1", "Para Premium"), L("s1", "f2"),
     L("g1", "t3", "Para Elite"), L("t3", "s2"), L("s2", "f3")])

upd("P-45", [D12("onb_b"), D12("quem_sobe"), D11("encontro")], nome="Conduzir a entrada no Premium", gatilho="Parceiro convidado para o Premium no fechamento trimestral",
    descricao="O Premium é o nível em que a Wise passa a recomendar o parceiro aos próprios clientes, e por isso começa pelo encontro de alinhamento. Depois dele, o parceiro sobe, tem o perfil revisado para as recomendações e a Prateleira, os consultores da Wise ficam sabendo que podem recomendá-lo e o novo nível é anunciado. No portal: registra a subida, publica a ficha na Prateleira e avisa os dois lados.",
    portal="registra a subida, publica a ficha na Prateleira e avisa os dois lados.")
fluxo("P-45", [D12("onb_b")], ["PA-01"], [
    N("i1", "inicio", "Parceiro convidado para o Premium"),
    N("s1", "subprocesso", "Conduzir o encontro de alinhamento", processo="P-28"),
    N("t1", "tarefa", "Registrar a subida para Premium", **POR),
    N("t2", "tarefa", "Revisar o perfil para as recomendações e a Prateleira", **POR),
    N("t3", "tarefa", "Avisar os consultores da Wise de que ele pode ser recomendado"),
    N("t4", "tarefa", "Anunciar o novo nível ao parceiro e na comunidade", **WPP),
    N("f1", "fim", "Parceiro Premium recomendável")],
    [L("i1", "s1"), L("s1", "t1"), L("t1", "t2"), L("t2", "t3"), L("t3", "t4"), L("t4", "f1")])

upd("P-28", [D11("encontro"), D12("quem_sobe")], pai="P-45", ordem=1, gatilho="Parceiro convidado para o Premium no fechamento trimestral",
    descricao="O encontro deixa de ser para todos e vira a porta do Premium: só com quem a Wise vai passar a recomendar. Registrar o que é sucesso para o parceiro, preencher a ficha de jogo, cruzar carteiras revelando só as coincidências, ler o comportamento dele e escolher a primeira oportunidade concreta. No portal: processa o cruzamento e sugere as primeiras jogadas.")
for i, pid in enumerate(["P-70", "P-71", "P-72"], 1):
    upd(pid, [D11("encontro")], pai="P-28", ordem=i, gatilho="Encontro de alinhamento marcado")
upd("P-74", [D12("onb_b")], pai="P-45", ordem=2, gatilho="Parceiro convidado para o Premium",
    descricao="Guardar no perfil a apresentação comercial do parceiro, para o Gerente e os consultores resgatarem quando o recomendarem a um cliente. No portal: guarda no perfil.")

upd("P-44", [D12("onb_a"), D12("b_para_a")], gatilho="Subida para Elite decidida",
    descricao="Formação gratuita e exclusiva para a base do parceiro Elite, organizada pela Wise, conforme as horas disponíveis: definir com o parceiro o tema e a data do evento; o parceiro convida a própria base com o material da Wise; a Wise conduz a formação; os participantes recebem a oferta do diagnóstico; o parceiro recebe um relatório com a presença e os resultados. A fila por horas, os encontros de preparação e o certificado metodológico continuam. No portal: controla a fila, a agenda, o evento e o relatório.")
f44 = PX["P-44"]["fluxo"]
f44["nos"][0]["nome"] = "Subida para Elite decidida"
fim = next(n for n in f44["nos"] if n["tipo"] == "fim" and n["nome"] == "Comunidade validada")
ant = [l for l in f44["ligacoes"] if l["para"] == fim["id"]]
f44["nos"] += [N("r7a", "tarefa", "Oferecer o diagnóstico aos participantes", **POR), N("r7b", "tarefa", "Enviar ao parceiro o relatório de presença e resultados", **POR)]
for l in ant: l["para"] = "r7a"
f44["ligacoes"] += [L("r7a", "r7b"), L("r7b", fim["id"])]
f44["nos"].remove(fim); f44["nos"].append(fim)
for n in f44["nos"]:
    n["nome"] = n["nome"].replace("Parceiro de pacote A assinado", "Subida para Elite decidida")

upd("P-87", [D12("descer")],
    descricao="A cada trimestre, quem fica e quem sai da Prateleira, pela nota de qualidade e pelo retorno dos clientes. Se um cliente da Wise tem problema sério com o parceiro, a Wise deixa de recomendá-lo, sem avisar e sem rebaixar o nível: rebaixar faria o parceiro deixar de recomendar a Wise à base dele. No portal: calcula, sinaliza quem está abaixo e guarda a marca interna de recomendação suspensa.")
upd("P-35", [D11("nivel"), D12("escada")],
    descricao="O consultor relata a necessidade, o Gerente registra o pedido e publica a página do cliente; só parceiros Premium e Elite, sem recomendação suspensa, entram na recomendação; o fornecedor que entra no pedido dá uma contrapartida não financeira. No portal: recomenda parceiros Premium e Elite por categoria, monta a página e registra a contrapartida combinada.")
upd("P-58", [D11("nivel")], gatilho="Parceiro sobe para Premium ou ficha desatualizada",
    descricao="Categorias e fichas verificadas dos parceiros Premium e Elite, sem limite por categoria; a permanência depende da nota de qualidade e do retorno dos clientes. No portal: guarda as fichas, calcula a nota e marca a permanência.")
upd("P-84", [D12("itens_b")], descricao="Calendário da mentoria mensal da Wise aberto às carteiras dos parceiros Premium e Elite. No portal: envia os convites.")
upd("P-85", [D12("itens_b")], nome="Convidar os parceiros a eventos e formações da Wise",
    descricao="Eventos e formações da Wise abertos como acesso de reconhecimento aos parceiros Premium e Elite. No portal: envia os convites a partir do calendário e registra presença.")
upd("P-52", [D12("itens_b")], descricao=PX["P-52"]["descricao"].replace("No portal:", "Apresentações a outros parceiros são benefício do Premium e do Elite. No portal:", 1))
upd("P-42", [D11("cadencia")],
    descricao="Revisão conjunta com pauta montada pelo portal, para parceiros Premium e Elite: trimestral para todos e mensal para os destaques; o Diretor participa nas dos parceiros Elite. Para o Select, o contato do trimestre é o encontro trimestral de parceiros (P-83). As ações nascem da ata. No portal: monta a pauta com os dados do parceiro e transforma a ata em ações.")
upd("P-46", [D11("cadencia")],
    descricao="Contato curto e frequente, com ritmo pela importância: para o Select, contato automático (portal, e-mail do mês e resumo dos clientes) e o encontro trimestral de parceiros como o contato do trimestre; mensal para quem tem atenção alta; trimestral para os demais Premium e Elite; duas a três vezes por ano para candidatos em nutrição e ex-parceiros. Cada contato leva algo de valor; depois de cada encontro, retorno em até 24 horas. No portal: lembra quem passou da cadência sem contato e sugere o que levar; a lembrança entra na fila como exceção.")
upd("P-47", [D11("comunidade")],
    descricao=PX["P-47"]["descricao"].replace("No portal:", "Todo parceiro entra na comunidade desde a entrada. No portal:", 1))

# ---------------------------------------------------------------- 4. Diagnóstico, oportunidades e retorno (P-95, P-33, P-34, P-79, P-96, P-88)
upd("P-95", [D11("diag_fluxo"), D11("diag_quem"), D11("diag_entrega"), D11("pos_autodiag"), D11("pesquisa"), D11("closer")],
    gatilho="Cliente do parceiro se cadastra pela página do link",
    descricao="O cliente do parceiro abre o link, preenche o cadastro de qualificação e a página decide pelo ICP (mais de 3 vendedores, com faturamento mínimo opcional). No ICP: agenda do Google, reunião pela Matriz 5x5 conduzida pelo Gerente (acima de 10 reuniões por semana, outra pessoa da Wise assume), mapa próprio da reunião num modelo da Wise em até 2 dias úteis e acesso ao Wise Hub. Fora do ICP: autodiagnóstico na hora, resultado com o link do Hub e um e-mail com o resultado e um próximo passo, sem ligação. A pesquisa da UniCesumar entra como passo opcional, só depois da aprovação do Comitê de Ética e com o consentimento do cliente. Se o cliente quer contratar, quem fez o diagnóstico passa ao closer. No portal: registra o cadastro com a origem no parceiro, calcula o resultado da matriz, libera a agenda ou o autodiagnóstico e mostra ao parceiro a empresa, a situação e o resultado só com autorização.",
    portal="registra o cadastro com a origem no parceiro, calcula o resultado da matriz, libera a agenda ou o autodiagnóstico e mostra ao parceiro a empresa, a situação e o resultado só com autorização.")
fluxo("P-95", [D11("diag_fluxo"), D11("diag_entrega"), D11("pos_autodiag")], ["PA-01"], [
    N("i1", "inicio", "Cliente se cadastra pelo link do parceiro"),
    N("t1", "tarefa", "Registrar o cadastro com a origem no parceiro", **AUTO),
    N("g1", "decisao", "A empresa está no ICP da Wise?"),
    N("t2", "tarefa", "Liberar o autodiagnóstico na hora", **AUTO),
    N("t3", "tarefa", "Mostrar o resultado e o link do Wise Hub", **AUTO),
    N("t4", "tarefa", "Enviar o resultado e um próximo passo por e-mail", **AUTO),
    N("t5", "tarefa", "Liberar a agenda para a reunião", **AUTO),
    N("e1", "espera", "Cliente marca o horário", evento="mensagem"),
    N("g2", "decisao", "Mais de 10 reuniões na semana?"),
    N("t6", "tarefa", "Passar a reunião a outra pessoa da Wise"),
    N("t7", "tarefa", "Conduzir a reunião de diagnóstico pela Matriz 5x5"),
    N("t8", "tarefa", "Aplicar a pesquisa, se aprovada pelo CEP e consentida"),
    N("t9", "tarefa", "Enviar o mapa da reunião em até 2 dias úteis"),
    N("t10", "tarefa", "Liberar o acesso ao Wise Hub"),
    N("g3", "decisao", "O cliente autorizou mostrar o resultado ao parceiro?"),
    N("t11", "tarefa", "Liberar o resultado ao parceiro no portal", **AUTO),
    N("g4", "decisao", "O cliente quer contratar a consultoria?"),
    N("s1", "subprocesso", "Entregar o lead ao closer", processo="P-33"),
    N("f1", "fim", "Autodiagnóstico entregue"), N("f2", "fim", "Diagnóstico entregue"), N("f3", "fim", "Oportunidade com o closer")],
    [L("i1", "t1"), L("t1", "g1"), L("g1", "t2", "Não"), L("t2", "t3"), L("t3", "t4"), L("t4", "f1"),
     L("g1", "t5", "Sim"), L("t5", "e1"), L("e1", "g2"), L("g2", "t6", "Sim"), L("t6", "t7"), L("g2", "t7", "Não"),
     L("t7", "t8"), L("t8", "t9"), L("t9", "t10"), L("t10", "g3"), L("g3", "t11", "Sim"), L("t11", "g4"), L("g3", "g4", "Não"),
     L("g4", "s1", "Sim"), L("s1", "f3"), L("g4", "f2", "Não")],
    externos=[{"id": "X1", "nome": "Parceiro"}, {"id": "X2", "nome": "Cliente do parceiro"}],
    mensagens=[{"de": "X2", "para": "i1", "rotulo": "Cadastro de qualificação"}, {"de": "t3", "para": "X2", "rotulo": "Resultado e link do Hub"},
               {"de": "t4", "para": "X2", "rotulo": "E-mail do resultado"}, {"de": "t9", "para": "X2", "rotulo": "Mapa da reunião"},
               {"de": "t10", "para": "X2", "rotulo": "Acesso ao Hub"}, {"de": "t11", "para": "X1", "rotulo": "Resultado autorizado"}])
PX["P-95"]["hipoteses"] = [h for h in PX["P-95"].get("hipoteses", []) if h != "regras"]

upd("P-33", [D11("closer")], descricao=PX["P-33"]["descricao"].replace("No portal:", "Quando a oportunidade nasce de um diagnóstico, quem conduziu a reunião passa o caso ao closer. No portal:", 1))
upd("P-34", [D11("retorno")], descricao=PX["P-34"]["descricao"].replace("No portal:", "O grupo de WhatsApp vale para todos os parceiros até que o tamanho torne isso inviável; o portal mostra ao parceiro a lista de quem entrou pelo link e o andamento. No portal:", 1))
upd("P-79", [D11("portas")], descricao="Link de indicação, link da página do cliente, cruzamento, Base Ativa, Prateleira ou registro à mão, sempre com o parceiro de origem; a proteção é de 180 dias em todas as portas. No portal: registra e protege por 180 dias.")
upd("P-38", [D11("comissao")])
upd("P-96", [D11("treinamento"), D12("link_afiliado")], nome="Manter a página do cliente e o kit de convite",
    descricao="Página do cliente com as duas marcas (o parceiro sobe a logo), vídeo da Wise explicando a consultoria gratuita, cadastro de qualificação, agenda e autodiagnóstico, e a mensagem pronta para o parceiro enviar com o link dele. O Igor grava; o Gerente mantém atualizado. No portal: gera a página e a mensagem com o link exclusivo do parceiro.")
upd("P-88", [D11("treinamento"), D12("itens_b")],
    descricao="Minicurso de como vender a Wise e trilhas por empresa do grupo; o certificado de parceiro Wise vale desde o Select. O Igor grava e revisa; o Gerente atualiza. No portal: entrega o minicurso e as trilhas e emite o certificado.")
upd("P-09", [D11("fila_prazo"), D12("parado")],
    descricao=PX["P-09"]["descricao"].replace("oportunidade parada,", "oportunidade parada, cadastro na fila sem contato há mais de 24 horas úteis, parceiro parado numa etapa depois do lembrete,", 1))
upd("P-60", [D11("admin"), D11("dominio")],
    descricao=PX["P-60"]["descricao"].replace("No portal:", "As landing pages (dos parceiros e dos clientes) ficam no domínio partners.wisemakers.com.br e são administradas por quem tem acesso de administrador; o responsável é o Gerente. No portal:", 1))

# ---------------------------------------------------------------- 5. Fatos do modelo de negócio
FX = {f["id"]: f for f in d["fatos"]}
def fato_upd(fid, texto, evs):
    f = FX[fid]; f["texto"] = texto; f["status"] = "confirmado"
    for e in evs:
        if e not in f["evidencias"]: f["evidencias"].append(e)

fato_upd("F-009", "Princípio 9 (Como o programa se relaciona): Primeiro valor logo na entrada, por etapas e sem prazo em dias; o parceiro só conta quando ativa. A ativação (primeiro cliente cadastrado pelo link do parceiro) é a linha que separa parceiro de cadastro aprovado.",
         [D11("ativado"), D11("plano90")])
fato_upd("F-022", "Duas parcerias: a Comercial e a Institucional, para entidades que reúnem indústrias. A Comercial tem três níveis em escada, e todo parceiro entra pelo Select. Select (C): consultoria gratuita aos clientes da carteira no ICP da Wise, comissão, certificado, Wise Hub com as duas marcas, grupo, comunidade e minicurso. Premium (B): também a recomendação pela Wise nas consultorias e na Prateleira, mentoria, eventos, formações e apresentações a outros parceiros. Elite (A): também o Base Ativa. O nível sobe pelo resultado e pela relação, e só sobe.",
         [D12("escada"), D12("itens_b"), D11("valor"), D11("encontro"), D12("descer")])
fato_upd("F-026", "Valor ao parceiro: a própria parceria. Para todos, consultoria gratuita para a base de clientes e uma boa comissão quando um cliente fecha com a Wise; para o software de gestão, isso também retém a base dele. No Premium, ser recomendado pela Wise aos clientes dela; no Elite, uma formação gratuita e exclusiva para a base, organizada pela Wise.",
         [D11("valor")])
fato_upd("F-033", "Canais: a campanha de aquisição (hoje, anúncios no Meta para software de gestão) leva à landing page dos parceiros; a comunidade Wise Partners no WhatsApp, com um grupo por parceiro para todos enquanto o tamanho permitir; o portal com a face interna (operada pelo Gerente) e a do parceiro (link da página do cliente, minicurso, kit, simulador, clientes, oportunidades e regras).",
         [IGOR, D11("retorno"), D12("link_afiliado")])
fato_upd("F-034", "Parceiro conta quando ativa: primeiro cliente cadastrado pelo link do parceiro.", [D11("ativado")])
fato_upd("F-041", "Entregável padrão para os clientes de todos os parceiros: o cliente entra pelo link do parceiro; no ICP da Wise (mais de 3 vendedores), reunião de diagnóstico pela Matriz 5x5 e mapa próprio da reunião em até 2 dias úteis; fora do ICP, autodiagnóstico na hora e e-mail com o resultado. O Gerente conduz as reuniões; acima de 10 por semana, outra pessoa da Wise assume.",
         [D11("diag_fluxo"), D11("diag_quem"), D11("diag_entrega"), D11("pos_autodiag")])
fato_upd("F-042", "O Wise Hub com as duas marcas é benefício de todo parceiro desde o Select. Para o cliente do parceiro, o link do Hub aparece depois do diagnóstico ou do autodiagnóstico, nunca solto, como publicidade.",
         [D12("itens_b"), D11("diag_fluxo")])
fato_upd("F-043", "Pesquisa da UniCesumar sobre maturidade comercial: entra na reunião de diagnóstico como passo opcional, só depois da aprovação do Comitê de Ética e com o consentimento do cliente, separado do contato comercial.",
         [D11("pesquisa")])
fato_upd("F-045", "Os processos servem a qualquer tipo de parceiro; o que muda é a campanha de aquisição. A campanha atual busca software de gestão (CRM e ERP à frente), com qualquer tamanho de carteira, em volume: muitos parceiros no Select, que sobem para Premium e Elite com o tempo. O critério fixo é ter clientes empresariais que podem estar no ICP da Wise e não ser concorrente; agências ficam fora porque concorrem com a Wise.",
         [D11("outros_softwares"), D12("criterio_geral"), D11("encontro"), D11("plano90"), D12("grandes")])
FX["F-022"]["tema"] = "oferta"
for tema, texto, evs in [
    ("parceiro", "Escada de níveis: para o Premium, 60 dias no programa e pelo menos 3 clientes fechados com a Wise vindos do parceiro, ou avaliação do Gerente com o Igor; para o Elite, 60 dias no Premium ou 6 clientes fechados vindos dele, ou avaliação do Gerente com o Igor. A subida é decidida no fechamento trimestral e o Premium começa pelo encontro de alinhamento. O nível nunca desce: se um cliente da Wise tem problema sério com o parceiro, a Wise só deixa de recomendá-lo.",
     [D12("c_para_b"), D12("b_para_a"), D12("quem_sobe"), D12("descer")]),
    ("parceiro", "Transição: todos os parceiros atuais voltam ao Select e sobem pelos critérios novos, porque não há contrato que impeça; quem já recebeu a promessa verbal dos benefícios do Premium ou do Elite continua no nível prometido.",
     [D12("atuais")]),
    ("canal", "Entrada pela fila: o cadastro da página aceita o termo e a política e entra numa fila no portal; o Gerente chama cada um pelo WhatsApp em até 24 horas úteis, qualifica pela mensagem, envia a agenda, confirma o horário na véspera e no dia e, na conversa, cria a conta. A página diz que a equipe da Wise vai falar pelo WhatsApp em até 24 horas úteis.",
     [IGOR, D11("entrada"), D11("fila_prazo"), D11("fila_quem"), D12("aceite"), D12("nome_pagina")]),
]:
    add("fatos", "F", tema=tema, texto=texto, status="confirmado", evidencias=evs)

# ---------------------------------------------------------------- 6. Decisões, contradição revista, perguntas e formulários
DX = {x["id"]: x for x in d["decisoes"]}
for did, nota in [("DE-03", "Revista em 09/11: a escada passa a ser Select, Premium e Elite, com todos entrando pelo Select."),
                  ("DE-15", "Revista em 09/11: todo parceiro entra pelo Select, qualquer que seja a carteira."),
                  ("DE-19", "Para quem entra pela página, o termo é aceito no formulário, sem negociação."),
                  ("DE-22", "Revista em 09/11: acima de 10 reuniões por semana, outra pessoa da Wise assume; fora do ICP, autodiagnóstico na hora."),
                  ("DE-23", "Revista em 09/11: o Hub com as duas marcas vale desde o Select.")]:
    DX[did]["texto"] += " " + nota
for texto, evs in [
    ("Todo parceiro entra pela fila, sem exceção: cadastro com aceite na página, contato do Gerente pelo WhatsApp, agenda e conversa de entrada, em que a conta é criada.", [IGOR, D11("entrada"), D12("aceite")]),
    ("O Gerente cuida da fila e conduz as conversas de entrada, sempre; o primeiro contato sai em até 24 horas úteis.", [D11("fila_quem"), D11("fila_prazo")]),
    ("Três níveis: Select, Premium e Elite. Todos entram pelo Select; o nível só sobe, pelos critérios de tempo, clientes fechados ou avaliação do Gerente com o Igor.", [D12("escada"), D12("c_para_b"), D12("b_para_a"), D12("descer"), D12("grandes")]),
    ("O onboarding é por etapas e metas, sem prazo em dias; o portal mostra os dias em cada etapa e manda um lembrete a quem parou.", [D11("plano90"), D12("parado")]),
    ("Os processos servem a qualquer tipo de parceiro; só a campanha de aquisição muda.", [D11("outros_softwares")]),
    ("O Gerente administra as landing pages, no domínio partners.wisemakers.com.br.", [D11("admin"), D11("dominio")]),
]:
    add("decisoes", "DE", data=H7, texto=texto, por="PE-01", provisoria=False, evidencias=evs)

for c in d["contradicoes"]:
    if c["id"] == "CT-05":
        c["resolucao"] = (c.get("resolucao") or "") + " Revista em 09/11 (FO-12): todos entram pelo Select e sobem pelo resultado, como Bech recomendava."
        c.setdefault("evidencias_resolucao", []).extend([D12("grandes"), D12("escada")])

ALVO11 = {"entrada": ["P-20"], "fila_prazo": ["P-20"], "fila_quem": ["P-22"], "fila_criterio": ["P-22"], "fila_conversa": ["P-23"], "nivel": ["P-61"],
          "outros_softwares": ["P-20"], "encontro": ["P-28"], "plano90": ["P-94"], "ativado": ["P-30"], "treinamento": ["P-29", "P-96"], "diag_fluxo": ["P-95"],
          "diag_quem": ["P-95"], "diag_entrega": ["P-95"], "pos_autodiag": ["P-95"], "pesquisa": ["P-95"], "portas": ["P-79"], "closer": ["P-33"],
          "retorno": ["P-34"], "comissao": ["P-38"], "cadencia": ["P-46"], "valor": ["F-026"], "comunidade": ["P-47"], "admin": ["P-60"], "dominio": ["P-60"], "mais": []}
ALVO12 = {"aceite": ["P-24"], "nome_pagina": ["P-20"], "link_afiliado": ["P-75"], "criterio_geral": ["P-22"], "escada": ["P-61"], "itens_b": ["P-61"],
          "c_para_b": ["P-18"], "quem_sobe": ["P-18"], "b_para_a": ["P-18"], "descer": ["P-18"], "grandes": ["P-61"], "atuais": ["P-61"],
          "onb_c": ["P-94"], "parado": [P97], "onb_b": ["P-45"], "onb_a": ["P-44"], "mais": []}

def registrar_formulario(num, titulo, link, itens, resp, alvos, ev_fn, introducao):
    ids = []
    for k, it in itens.items():
        respondida = k in resp
        if k == "mais" and not respondida: continue
        ids.append(add("perguntas", "Q", texto=it["texto"], tipo=it["tipo"], opcoes=it["opcoes"], alvo=alvos.get(k, []), para=["PE-01"], rodada=7,
                       bloco=it["bloco"], status="respondida" if respondida else "sem_resposta", formulario=None, respostas=[ev_fn(k)] if respondida else [],
                       respondida_por=["PE-01"] if respondida else [], chave=k, contexto=it["contexto"], logica=it.get("logica", ""), citacoes=[], visual="", recomendo=""))
    fo = add("formularios", "FO", titulo=titulo, rodada=7, para=["PE-01"], canal="artifact", perguntas=ids, introducao=introducao, link=link,
             status="respondido", respondido_por=["PE-01"], respostas_recebidas=1, enviado_em="2026-11-07" if num == 11 else "2026-11-09", prazo="", identificacao=False)
    for q in d["perguntas"]:
        if q["id"] in ids: q["formulario"] = fo

registrar_formulario(11, "FO-11: processos depois das landing pages", "https://claude.ai/artifact/VMkzjxzihzEDhqMcAeky1v", I11, R11, ALVO11, D11,
                     "O que muda nos processos com as duas landing pages e a fila de espera.")
registrar_formulario(12, "FO-12: escada de níveis e onboarding por etapas", "https://claude.ai/artifact/3u3FEWEKYT4ZFcgLvcVuc2", I12, R12, ALVO12, D12,
                     "Critérios da escada Select, Premium e Elite, onboarding por nível e três pontos da entrada pela fila.")

# entregas entre processos que mudaram
for q in d["perguntas"]:
    q["alvo"] = ["P-22" if x == "P-69" else x for x in (q.get("alvo") or [])]
PX["P-23"]["saidas"] = [{"nome": "Parceiro com acesso", "para": "P-26"}]
PX["P-26"]["entradas"] = [{"nome": "Parceiro com acesso", "de": "P-23"}, {"nome": "Parceiro com acesso", "de": "P-20"}]
PX["P-20"]["saidas"] = [{"nome": "Parceiro com acesso", "para": "P-26"}]
PX["P-20"]["entradas"] = [e for e in PX["P-20"].get("entradas", []) if e.get("de") != "P-24"] + [{"nome": "Aceite registrado", "de": "P-24"}]
PX["P-24"]["entradas"] = [{"nome": "Termo-quadro atualizado", "de": "P-64"}]
PX["P-30"]["entradas"] = []
PX["P-22"]["fluxo_dispensado"] = DE_FLUXO
PX["P-20"]["participantes"] = ["PA-05"]
PX["P-24"]["participantes"] = ["PA-05"]
PX["P-23"]["participantes"] = ["PA-05"]
PX["P-70"]["entradas"] = [{"nome": "Parceiro convidado para o Premium", "de": "P-18"}]
PX["P-18"]["saidas"] = PX["P-18"].get("saidas", []) + [{"nome": "Parceiro convidado para o Premium", "para": "P-70"}]
PX["P-30"]["saidas"] = [{"nome": "Parceiro ativado", "para": "P-40"}]
for pid in ("P-29", "P-78"):
    for x in PX[pid]["saidas"]:
        if x.get("para") == "P-30": x["para"] = "P-94"
PX["P-94"]["entradas"] = [e for e in PX["P-94"].get("entradas", []) if e.get("de") not in ("P-29", "P-78")] + [{"nome": "Pessoas preparadas para indicar", "de": "P-29"}, {"nome": "Gesto sem atrito", "de": "P-78"}]
PX["P-40"]["entradas"] = [e for e in PX["P-40"].get("entradas", []) if e.get("de") not in ("P-26", "P-30", "P-94")] + [{"nome": "Parceiro ativado", "de": x} for x in ("P-26", "P-30", "P-94")]
PX["P-09"]["entradas"] = PX["P-09"].get("entradas", []) + [{"nome": "Caso parado na fila de exceções", "de": P97}]
PX["P-94"]["fluxo"]["externos"] = [{"id": "X2", "nome": "Cliente do parceiro"}]
PX["P-94"]["fluxo"]["mensagens"] = [{"de": "X2", "para": "e1", "rotulo": "Cadastro pelo link"}, {"de": "X2", "para": "e2", "rotulo": "Diagnóstico feito"}]
PX["P-95"]["fluxo"]["mensagens"].append({"de": "X2", "para": "e1", "rotulo": "Horário marcado"})

# limite do lembrete: fica para o formulário do portal
add("perguntas", "Q", texto="Depois de quantos dias na mesma etapa do onboarding o portal manda o lembrete por e-mail ao parceiro?", tipo="escolha",
    opcoes=["7 dias", "14 dias", "21 dias", "30 dias"], alvo=[P97 + ".gatilho"], para=["PE-01"], rodada=8, bloco="Onboarding", status="aberta",
    formulario=None, respostas=[], respondida_por=[], chave="limite_lembrete",
    contexto=["No FO-12 você escolheu o lembrete automático por e-mail, mas não definiu depois de quanto tempo."], logica="", citacoes=[], visual="", recomendo="14 dias")

d["historico"].append({"data": H7, "evento": "To-be v8: Rodada 7 (FO-11 e FO-12) aplicada. Entrada pela fila para todos, com conversa de entrada no lugar do workshop e aceite na página; escada Select, Premium e Elite, todos entrando pelo Select e subindo pelo resultado; onboarding por etapas, sem prazo em dias, com lembrete; diagnóstico como está no ar, com autodiagnóstico fora do ICP; scorecard de entrada retirado"})
d["organizacao"]["objetivo_do_mapeamento"] = d["organizacao"]["objetivo_do_mapeamento"].replace("17 livros", "17 livros", 1)

# a jornada do parceiro passa a começar no cadastro pela página
for cv in d["cadeias_de_valor"]:
    if cv["id"] == "CV-01":
        cv["gatilho"] = "Cadastro enviado pela landing page"
        cv["etapas"][0]["nome"] = "Atrair pela campanha e selecionar pela fila"
        cv["etapas"][1]["nome"] = "Integrar e ativar por etapas"
        cv["valor"] = "Parceiro ativo, subindo de Select para Premium e Elite"
        for e in [D11("entrada"), D12("escada")]:
            if e not in cv["evidencias"]: cv["evidencias"].append(e)

# resíduos da v7 nas entregas entre processos (achados na montagem do FO-13)
upd("P-04", [D11("fila_criterio"), D12("criterio_geral")],
    descricao="Escrever o perfil comercial e o institucional a partir do ICP, com os critérios da fila (clientes empresariais que podem estar no ICP da Wise, não ser concorrente, interesse real, responsável pela parceria) e a regra de só recomendar a um cliente quem a Wise indicaria ao seu melhor cliente. No portal: guarda o perfil e os critérios usados na fila.",
    portal="guarda o perfil e os critérios usados na fila.", saidas=[{"nome": "Perfil e critérios da fila", "para": "P-22"}])
PX["P-21"]["saidas"] = [{"nome": "Cadastro na fila", "para": "P-22"}]
PX["P-22"]["entradas"] = [{"nome": "Perfil e critérios da fila", "de": "P-04"}, {"nome": "Cadastro na fila", "de": "P-21"}]
PX["P-30"]["portal"] = "marca a ativação sozinho e avisa o parceiro e o Gerente."
PX["P-70"]["saidas"] = [{"nome": "Ficha de jogo", "para": "P-28"}]
PX["P-28"]["entradas"] = [e for e in PX["P-28"].get("entradas", []) if e.get("de") != "P-70"] + [{"nome": "Ficha de jogo", "de": "P-70"}]
for pid in ("P-71", "P-72", "P-74"):
    PX[pid]["entradas"] = [{"nome": "Parceiro convidado para o Premium", "de": "P-18"}]
    PX["P-18"]["saidas"].append({"nome": "Parceiro convidado para o Premium", "para": pid})
for pid in ("P-73", "P-75"):
    PX[pid]["entradas"] = [{"nome": "Parceiro com acesso", "de": "P-23"}]
    PX["P-23"]["saidas"].append({"nome": "Parceiro com acesso", "para": pid})
PX["P-23"]["entradas"] = [e for e in PX["P-23"].get("entradas", []) if e.get("de") != "P-70"]
