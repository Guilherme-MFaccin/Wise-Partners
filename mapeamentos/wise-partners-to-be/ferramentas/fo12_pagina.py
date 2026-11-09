# FO-12: escada de níveis, onboarding por nível e entrada pela fila, a partir das respostas do FO-11 (09/11/2026).
import json, html, os
BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-12/formulario.html"
ITENS = []

def esc(t): return html.escape(str(t), quote=True)
def box(x, y, w, h, linhas, cls="b", fs=13, bold=False):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" class="{cls}"/>']
    n = len(linhas); y0 = y + h / 2 - (n - 1) * (fs + 3) / 2 + fs / 3
    for i, t in enumerate(linhas):
        out.append(f'<text x="{x + w / 2}" y="{y0 + i * (fs + 3):.1f}" text-anchor="middle" font-size="{fs}"{" font-weight=\"600\"" if bold else ""} class="tx">{esc(t)}</text>')
    return "".join(out)
def seta(x1, y1, x2, y2, tracejada=False):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="ln{" dash" if tracejada else ""}" marker-end="url(#ponta)"/>'
def txt(x, y, t, fs=12, anchor="start", cls="mu", bold=False):
    return f'<text x="{x}" y="{y}" font-size="{fs}" text-anchor="{anchor}" class="{cls}"{" font-weight=\"600\"" if bold else ""}>{esc(t)}</text>'
def rect(x, y, w, h, cls="b2", rx=4):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" class="{cls}"/>'
def svg(w, h, corpo, titulo):
    return (f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{esc(titulo)}" style="min-width:{min(w, 560)}px">'
            '<defs><marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pt"/></marker></defs>'
            + corpo + "</svg>")
def fila(y, passos, cls_ult="b hi", w=118, gap=14, x0=10, fs=11):
    o = []
    for i, p in enumerate(passos):
        x = x0 + i * (w + gap)
        o.append(box(x, y, w, 48, p if isinstance(p, list) else [p], cls_ult if i == len(passos) - 1 else "b", fs))
        if i < len(passos) - 1: o.append(seta(x + w, y + 24, x + w + gap - 2, y + 24))
    return o

def TOBE(pid, trecho): return {"livro": f"To-be v7, {pid}", "pagina": "mapa.json", "trecho": trecho}
def DEC(fonte, trecho): return {"livro": fonte, "pagina": "resposta sua", "trecho": trecho}
def Q(k, bloco, texto, tipo, contexto, opcoes=(), placeholder="", logica="", cits=(), visual=""):
    ITENS.append({"id": "NV-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": list(opcoes),
                  "contexto": contexto if isinstance(contexto, list) else [contexto], "logica": logica,
                  "citacoes": list(cits), "visual": visual, "placeholder": placeholder})

A, B, C = ("Entrada pela fila (P-20, P-22)", "Escada de níveis (P-18, P-28)", "Onboarding por nível (P-94, P-30)")

def FO11(chave, trecho): return {"livro": f"FO-11, {chave}", "pagina": "resposta sua, 09/11", "trecho": trecho}

V = {}
# fluxo da fila como descrito no FO-11
passos = [["Anúncio", "no Meta"], ["Landing", "page"], ["Cadastro", "(sem aceite)"], ["Fila no", "portal"], ["WhatsApp do", "Guilherme"], ["Qualificar", "pela mensagem"],
          ["Link da", "agenda"], ["Parceiro", "marca"], ["Confirmar na", "véspera e no dia"], ["Conversa e", "acesso criado"]]
c = []
for i, p in enumerate(passos):
    lin, col = divmod(i, 5)
    x = 10 + col * 130; y = 10 + lin * 86
    c.append(box(x, y, 112, 50, p, "b hi" if i == len(passos) - 1 else "b", 11))
    if col < 4 and i < len(passos) - 1: c.append(seta(x + 112, y + 25, x + 128, y + 25))
c.append(f'<path d="M 576 60 L 576 73 L 66 73 L 66 92" class="ln" fill="none" marker-end="url(#ponta)"/>')
c.append(box(10, 168, 632, 34, ["Onde fica o aceite do termo e da política de privacidade?"], "b2", 12))
c.append(txt(326, 222, "Fluxo que você descreveu no FO-11. A pergunta é só onde entra o aceite.", 11, "middle"))
V["fila"] = svg(660, 232, "".join(c), "Entrada pela fila como descrita no FO-11")

# escada de níveis
cols = [("Nível C: entrada", ["Todos entram aqui", "Consultoria gratuita à base", "Comissão por regra única", "Grupo e comunidade", "Minicurso de como vender"]),
        ("Nível B: recomendado", ["Encontro de alinhamento (P-28)", "Recomendado pela Wise nas", "consultorias e na Prateleira", "O que mais? (próxima pergunta)", ""]),
        ("Nível A: Base Ativa", ["Evento de formação gratuita", "e exclusiva para a base", "do parceiro, organizado", "pela Wise", ""])]
c = []
for i, (t, itens) in enumerate(cols):
    x = 10 + i * 216
    c += [rect(x, 10 + (2 - i) * 18, 204, 26, "b hi", 6), txt(x + 102, 28 + (2 - i) * 18, t, 12, "middle", "tx", True)]
    c.append(rect(x, 44 + (2 - i) * 18, 204, 128 - (2 - i) * 18 + 36, "b", 6))
    for j, it in enumerate(itens):
        if it: c.append(txt(x + 12, 66 + (2 - i) * 18 + j * 22, it, 11, cls="tx"))
c += [seta(214, 120, 226, 120), seta(430, 120, 442, 120)]
c.append(txt(326, 228, "O que você escreveu no FO-11. Faltam os critérios de cada degrau e quem decide.", 11, "middle"))
V["escada"] = svg(660, 238, "".join(c), "Escada de níveis C, B e A")

# onboarding por etapas, sem prazo
et = ["Acesso criado na conversa", "Minicurso assistido", "Anúncio conjunto publicado", "Link enviado à base", "Primeiro cliente pelo link (ativado)"]
c = []
for i, e in enumerate(et):
    x = 10 + i * 130
    c.append(box(x, 20, 116, 56, [e] if len(e) < 18 else [e[:e.rfind(" ", 0, 18)], e[e.rfind(" ", 0, 18) + 1:]], "b hi" if i == 4 else "b", 11))
    if i < 4: c.append(seta(x + 116, 48, x + 128, 48))
c.append(txt(326, 104, "Etapas e metas, sem contar dias. O portal mostra em que etapa cada parceiro está.", 11, "middle"))
V["onb"] = svg(660, 114, "".join(c), "Onboarding do nível C por etapas")

# ---------------- Perguntas ----------------
Q("aceite", A, "Onde o parceiro aceita o termo de adesão e a política de privacidade?", "escolha",
  ["No FO-11 você descreveu o cadastro pela página sem aceite. Hoje a página pede os dois aceites antes de enviar.",
   "A política de privacidade precisa ao menos ser informada na página, porque o formulário coleta nome, e-mail e WhatsApp (LGPD). O termo de adesão é o contrato da parceria."],
  ["Página só informa a política (sem caixa de aceite); o termo é aceito no primeiro acesso ao portal, antes de usar",
   "Página só informa a política; o termo é enviado para assinatura eletrônica depois da conversa",
   "Os dois aceites continuam na página, como está hoje"],
  logica="Minha recomendação: a primeira. O formulário fica mais curto, quem não passar da conversa não assina nada, e o aceite no portal fica registrado com data, versão e usuário.",
  cits=[FO11("entrada", "anúncio do meta > Landing Page > Cadastro Através do Formulário (sem aceite) > Fila no Portal > Através do meu Whatsapp vou entrar em contato [...] Conversamos e apresento o acesso.")],
  visual=V["fila"])

Q("nome_pagina", A, "Quem a página diz que vai entrar em contato?", "escolha",
  "Depois do cadastro, a página mostra hoje: \"O Igor, diretor da Wise Makers, vai falar com você pelo WhatsApp\". No FO-11 você disse que a fila e as conversas são suas, sempre.",
  ["\"O Guilherme, da Wise Makers, vai falar com você pelo WhatsApp em até 24 horas úteis\"",
   "\"Nossa equipe vai falar com você pelo WhatsApp em até 24 horas úteis\", sem nome",
   "Outro texto (comente)"],
  logica="Minha recomendação: com o seu nome. Quem recebe a mensagem reconhece o remetente e responde mais.",
  cits=[FO11("fila_quem", "Sou eu que cuidarei da fila, sempre")])

Q("link_afiliado", A, "Qual link o parceiro manda para os clientes dele?", "escolha",
  ["No FO-11 você escreveu que indicar é só enviar o link de afiliado que está no portal Wise Hub, onde o parceiro entra com o login dele.",
   "O que existe hoje é o link da página do cliente no portal Wise Partners (partners.wisemakers.com.br/c/código), na tela Indicar do parceiro, com mensagem pronta. É esse link que registra a origem por 180 dias e leva ao diagnóstico."],
  ["O link da página do cliente no portal Wise Partners; escrevi Wise Hub por engano",
   "Um link de afiliado dentro do Wise Hub, que ainda não existe no portal (comente como funciona)",
   "Os dois, cada um para uma coisa (comente)"],
  cits=[FO11("fila_conversa", "devo mostrar como é fácil indicar a Wise (apenas enviar o link de afiliado que está no portal wise hub, que o parceiro entra com o próprio login dele)")])

Q("criterio_geral", A, "Com o processo servindo para qualquer tipo de parceiro, como fica o critério \"ser empresa de software\"?", "escolha",
  "No FO-11 você marcou \"ser empresa de software com clientes empresariais\" como critério da fila, e também disse que o processo deve servir para qualquer tipo de parceiro, mudando só a campanha de aquisição.",
  ["Vira \"ter clientes empresariais que podem estar no ICP da Wise\", para qualquer tipo de parceiro",
   "Cada campanha define o tipo de empresa que aceita; esta campanha aceita só software",
   "Outro (comente)"],
  logica="Minha recomendação: a primeira. O critério de processo fica fixo e a campanha só muda quem chega.",
  cits=[FO11("outros_softwares", "o processo tem que ser desenvolvido em modo que possamos fazer a aquisição de qualquer tipo de parceiro.")])

Q("escada", B, "A escada de níveis fica assim?", "escolha",
  ["Resumo do que você escreveu no FO-11: o nível C é a entrada de todos, mais comercial, com a consultoria gratuita para os clientes da carteira que estão no ICP e a comissão; a troca de indicações da Prateleira deixa de valer para ele. O B passa a ser recomendado pela Wise nas consultorias, depois do encontro de alinhamento (P-28). O A entra no Base Ativa.",
   "No to-be v7, o nível de entrada vinha da quantidade de clientes no ICP (Elite, Premium e Select) e o pacote C era Prateleira, indicação e grupo."],
  ["Sim, como no esquema", "Sim, com ajustes (comente)"],
  cits=[FO11("encontro", "vamos fazer com que a categoria de parceiro C seja esta mais comercial [...] A categoria B vamos poder indicar também o parceiro, mas, para isso, preciso fazer o proceso de alinhamento. Por fim, a categoria A entra o programa base ativa."),
        FO11("nivel", "o que entregávamos na categoria C, que era a troca de prateleira de indicações, não vale mais para estes tipos de parceiros")],
  visual=V["escada"])

Q("itens_b", B, "Além de ser recomendado nas consultorias, o que mais o nível B recebe?", "multipla",
  "O pacote B do to-be v7 tinha estes itens. O que não for marcado sai do B; comente se algum vai para o C ou para o A.",
  ["Certificado de parceiro Wise", "Wise Hub com as duas marcas para a base do parceiro", "Mentoria mensal aberta à carteira do parceiro (P-84)",
   "Convite a eventos e formações da Wise", "Apresentação a outros parceiros da comunidade (P-52)"],
  cits=[TOBE("oferta", "o B (certificado, Hub, mentoria, eventos e formações) para Premium e Elite que divulgam à própria base")])

Q("c_para_b", B, "O que um parceiro C precisa mostrar para virar B?", "multipla",
  ["No FO-11 você escreveu que, para cogitar indicar um parceiro aos clientes da Wise, ele precisa ter entrega de valor e tempo com a Wise. Marque o que conta e comente os números, se houver."],
  ["Tempo mínimo no programa (comente quanto)", "Clientes cadastrados pelo link (comente quantos)", "Diagnósticos feitos na base dele (comente quantos)",
   "Clientes fechados com a Wise vindos dele (comente quantos)", "Presença no encontro trimestral e na comunidade",
   "Produto bem avaliado por clientes da Wise que já usam o software dele", "Avaliação da relação por você e pelo Igor, sem número fixo"],
  logica="Minha recomendação: pelo menos um cliente fechado vindo dele, produto bem avaliado e a sua avaliação da relação. Recomendar um parceiro é emprestar a confiança da Wise; o resultado com clientes mostra se ele merece.",
  cits=[FO11("nivel", "o parceiro tem que ter algum tipo de entrega de valor, tempo conosco, dentre outros tipos de entrega para que possamos cogitar a possibilidade de indicá-los no RFP para nossos clientes.")])

Q("quem_sobe", B, "Como a subida de C para B acontece?", "escolha",
  "O P-18 revisa o nível no fechamento trimestral. O encontro de alinhamento (P-28) passa a ser a porta do B.",
  ["No fechamento trimestral, o portal lista quem bateu os critérios; você convida para o encontro de alinhamento e o parceiro sobe depois dele",
   "O parceiro pede pelo portal; você avalia e marca o encontro de alinhamento",
   "Os dois caminhos: convite no trimestre e pedido do parceiro"],
  logica="Minha recomendação: a primeira. A Wise decide quem recomendar; o parceiro não fica esperando uma resposta a um pedido.",
  cits=[TOBE("P-18", "Revisar o nível dos parceiros"), TOBE("P-28", "Conduzir o encontro de alinhamento")])

Q("b_para_a", B, "O que um parceiro B precisa para entrar no Base Ativa (nível A)?", "multipla",
  "O evento do Base Ativa custa horas da Wise. Marque o que conta e comente os números, se houver.",
  ["Carteira com um mínimo de clientes no ICP da Wise (comente quantos)", "Tempo mínimo no nível B (comente quanto)", "Clientes fechados com a Wise vindos dele (comente quantos)",
   "Base engajada: diagnósticos feitos pelo link (comente quantos)", "Agenda da Wise com horas livres no trimestre", "Decisão do Igor, caso a caso"])

Q("descer", B, "Um parceiro pode descer de nível?", "escolha",
  "Com parceiros sendo recomendados aos clientes da Wise, um problema com o produto ou com o atendimento dele recai sobre a Wise.",
  ["Não, o nível só sobe",
   "Sim, no fechamento trimestral, quando deixa de cumprir os critérios, sempre com uma conversa antes",
   "Só do B para o C, quando um cliente da Wise tem problema sério com ele"],
  logica="Minha recomendação: a segunda. Sem descida, o B vira um título permanente e a recomendação perde o valor.")

Q("grandes", B, "Uma empresa grande (por exemplo, um ERP com centenas de clientes no ICP) também entra pelo C?", "escolha",
  "Nesta campanha você não distingue o tamanho da carteira. Mas um parceiro grande pode valer o encontro de alinhamento logo no começo.",
  ["Sim, todos entram pelo C, sem exceção",
   "Entra pelo C, mas você pode marcar o encontro de alinhamento logo depois e subir direto para o B",
   "Decisão caso a caso do Igor"])

Q("atuais", B, "E os parceiros que já estão no programa, com o nível do desenho antigo?", "escolha",
  "Hoje o portal tem parceiros com nível A, B ou C dados pela carteira no ICP e pacotes ligados a esse nível.",
  ["Mantêm o nível atual; a escada nova vale para quem entra daqui em diante",
   "São reclassificados pela escada nova no próximo fechamento trimestral",
   "Todos voltam para o C e sobem pelos critérios novos"],
  logica="Minha recomendação: a segunda, com conversa individual antes com quem desceria. Quem já tem relação com a Wise provavelmente já cumpre o B.")

Q("onb_c", C, "Quais são as etapas do onboarding do nível C, na ordem?", "multipla",
  ["No FO-11 você pediu um onboarding por etapas e metas, sem prazo em dias, porque o tempo varia de caso a caso. No P-94 só o anúncio conjunto continuou, e a ativação passou a ser o primeiro cliente cadastrado pelo link.",
   "Marque as etapas; comente se a ordem muda ou se falta alguma."],
  ["Acesso criado na conversa e primeiro login", "Minicurso de como vender a Wise assistido", "Anúncio conjunto da parceria publicado",
   "Link e mensagem pronta enviados para a base", "Primeiro cliente cadastrado pelo link (ativado, P-30)", "Primeiro diagnóstico feito na base dele"],
  cits=[FO11("plano90", "Temos que ter um processo de onboarding e uma série de metas pré estabelecidas e atividades em conjunto, mas não definir temporalmente.")],
  visual=V["onb"])

Q("parado", C, "Sem prazo, como a Wise percebe um parceiro parado numa etapa, e o que faz?", "escolha",
  "Sem dias definidos, o processo não estoura prazo. Mas, com volume, alguém precisa notar quem parou, sem virar cobrança.",
  ["O portal mostra quantos dias o parceiro está na mesma etapa; você manda uma mensagem quando achar que vale",
   "O portal manda um lembrete automático por e-mail depois de um tempo na mesma etapa (comente quanto), e você só entra se ele continuar parado",
   "Só no encontro trimestral (P-83), sem contato individual"],
  logica="Minha recomendação: a segunda. O prazo vira lembrete, não regra do processo, e a sua agenda fica para quem precisa de conversa.")

Q("onb_b", C, "O que acontece quando o parceiro sobe para o B?", "multipla",
  "Marque as etapas do onboarding do B; o que faltar, comente.",
  ["Encontro de alinhamento (P-28)", "Perfil do parceiro revisado para aparecer nas recomendações e na Prateleira",
   "Avisar os consultores da Wise de que ele pode ser recomendado", "Certificado e anúncio do novo nível", "Primeira recomendação a um cliente da Wise"])

Q("onb_a", C, "Quais são as etapas do Base Ativa (nível A)?", "multipla",
  "O evento de formação gratuita e exclusiva para a base do parceiro. Marque as etapas; o que faltar, comente.",
  ["Definir com o parceiro o tema e a data do evento", "O parceiro convida a própria base, com o material da Wise", "A Wise conduz a formação",
   "Diagnósticos oferecidos aos participantes depois do evento", "Relatório para o parceiro com presença e resultados"])

Q("mais", C, "Algo mais sobre a escada de níveis ou o onboarding?", "texto",
  "Qualquer regra, benefício ou mudança que você já combinou com o Igor e que não apareceu aqui.", placeholder="Escreva aqui")

json.dump(ITENS, open(BASE + "/ferramentas/fo12_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Níveis e onboarding</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo17_itens', META = 'respostas/FO-17', CHAVE = 'fo17-rascunho';"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + """<header>
    <p class="eyebrow">FO-12 · Processos do Wise Partners</p>
    <h1>Escada de níveis e onboarding por etapas</h1>
    <p class="lead">As respostas do FO-11 mudaram o desenho dos níveis: todo parceiro entra pelo C, sobe para o B pelo encontro de alinhamento e chega ao A com o Base Ativa, e o onboarding passa a ser por etapas, sem prazo em dias. Faltam os critérios de cada degrau, o que cada nível recebe e três pontos da entrada pela fila. As respostas são salvas enquanto você marca.</p>
  </header>""" + pagina[j:]
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas,", sum(1 for x in ITENS if x["visual"]), "com visual")
