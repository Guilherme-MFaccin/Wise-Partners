# FO-11: atualização dos processos do Wise Partners depois das duas landing pages (parceiros SaaS e cliente do parceiro).
# Cada pergunta parte de um processo do to-be v7 e do que já foi decidido nos FO-07 a FO-10.
import json, html, os
BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-11/formulario.html"
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
    ITENS.append({"id": "PR-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": list(opcoes),
                  "contexto": contexto if isinstance(contexto, list) else [contexto], "logica": logica,
                  "citacoes": list(cits), "visual": visual, "placeholder": placeholder})

A, B, C, D, E, F = ("Entrada de parceiros (P-20)", "Integração e ativação (P-26, P-94)", "Diagnóstico do cliente do parceiro (P-95)",
                    "Oportunidade e comissão (P-31, P-38)", "Relação contínua (P-40, P-46, P-47)", "Portal e governança (P-60)")

V = {}
# entrada: to-be, página com acesso na hora e a fila de espera do Igor
c = [txt(10, 18, "Hoje no to-be (P-20)", 12, cls="tx", bold=True)]
c += fila(28, ["Candidato identificado", ["Primeira", "reunião"], "Qualificar", "Workshop", ["Negociar e", "assinar termo"]], w=116)
c += [txt(10, 108, "Página, 06/11: acesso na hora", 12, cls="tx", bold=True)]
c += fila(118, [["Anúncio", "no Meta"], ["Landing", "page"], ["Cadastro com", "aceite do termo"], ["Acesso ao", "portal na hora"]], w=140, gap=24)
c += [txt(10, 198, "Página com fila de espera, 07/11 (pedido do Igor)", 12, cls="tx", bold=True)]
c += fila(208, [["Cadastro com", "aceite"], ["Fila no", "portal"], ["WhatsApp", "do Igor"], ["Link da", "agenda"], "Conversa", ["Aprovação", "e acesso"]], w=96, gap=13)
c.append(txt(330, 282, "A fila devolve uma conversa por parceiro, mas sem qualificação formal, workshop nem negociação do termo.", 11, "middle"))
V["entrada"] = svg(660, 292, "".join(c), "Entrada de parceiros: to-be, acesso na hora e fila de espera")

# revisão do nível
c = [box(10, 50, 140, 50, ["Cadastro pela", "landing page"], "b hi", 12), seta(150, 75, 196, 75),
     box(200, 44, 170, 62, ["Entra como nível C,", "pacote Prateleira,", "em onboarding"], "b", 12), seta(370, 75, 416, 75),
     box(420, 44, 230, 62, ["Quem confirma ou muda", "o nível e o pacote?", "Quando?"], "b2", 12),
     txt(330, 140, "Hoje o cadastro marca: nível a confirmar pela carteira no ICP.", 11, "middle")]
V["nivel"] = svg(660, 150, "".join(c), "Nível do parceiro que entra pela página")

# plano de 90 dias
etapas = [("Mês 1", ["Plano pelo pacote", "Anúncio conjunto", "Treinamento do time"]), ("Mês 2", ["Divulgar à base", "Diagnósticos"]), ("Mês 3", ["Encontro com a base", "Primeiras oportunidades"])]
c = []
for i, (t, itens) in enumerate(etapas):
    x = 10 + i * 216
    c += [rect(x, 10, 204, 24, "b hi", 6), txt(x + 102, 27, t, 12, "middle", "tx", True)]
    for j, it in enumerate(itens):
        c.append(box(x, 44 + j * 40, 204, 32, [it], "b", 11))
c.append(txt(330, 180, "Passos do P-94 hoje: quais continuam num programa em escala?", 11, "middle"))
V["plano90"] = svg(660, 190, "".join(c), "Plano de ativação de 90 dias no to-be")

# ativação: o que conta
c = []
marcos = ["Cadastro e acesso", "Link enviado à base", "Primeiro cliente cadastrado", "Primeiro diagnóstico feito", "Primeira oportunidade de consultoria"]
for i, mk in enumerate(marcos):
    w = 620 - i * 90
    x = 330 - w / 2
    c += [rect(x, 10 + i * 36, w, 30, "b hi" if i in (2, 3) else "b", 6), txt(330, 30 + i * 36, mk, 12, "middle", "tx")]
c.append(txt(330, 202, "Em destaque, os marcos que a página já registra sozinha.", 11, "middle"))
V["ativacao"] = svg(660, 212, "".join(c), "Marcos possíveis para declarar o parceiro ativado")

# diagnóstico novo
c = [box(10, 90, 110, 50, ["Cliente abre", "o link /c/"], "b hi", 12), seta(120, 115, 146, 115),
     box(150, 90, 110, 50, ["Cadastro de", "qualificação"], "b", 12), seta(260, 115, 286, 115),
     f'<polygon points="290,115 340,85 390,115 340,145" class="b"/>', txt(340, 112, "Mais de 3", 11, "middle", "tx"), txt(340, 126, "vendedores?", 11, "middle", "tx"),
     seta(390, 105, 426, 50), txt(398, 70, "sim", 11, cls="tx", bold=True),
     box(430, 20, 105, 50, ["Agenda do", "Google"], "b", 11), seta(535, 45, 551, 45), box(555, 20, 100, 50, ["Reunião", "Matriz 5x5"], "b hi", 11),
     seta(390, 125, 426, 180), txt(398, 166, "não", 11, cls="tx", bold=True),
     box(430, 160, 105, 50, ["Autodiagnóstico", "na hora"], "b", 11), seta(535, 185, 551, 185), box(555, 160, 100, 50, ["Link do", "Wise Hub"], "b hi", 11),
     seta(605, 70, 605, 156, True), txt(612, 118, "e depois", 10)]
c.append(txt(330, 236, "Fluxo que já está no ar. O to-be (P-95) ainda tem só a reunião, com o perfil antigo de R$ 250 mil e duas pessoas.", 11, "middle"))
V["diagnostico"] = svg(670, 246, "".join(c), "Diagnóstico do cliente do parceiro como está no ar")

# portas de origem (as cinco do to-be) e os dois links
portas = [("Indicação por link", "link /i/ (indicação de projeto)"), ("Prateleira", ""), ("Cruzamento de carteiras", ""), ("Base Ativa", ""),
          ("Diagnóstico do cliente do parceiro", "link /c/ (página do cliente, novo)")]
c = [box(470, 95, 180, 60, ["Receber e qualificar", "a oportunidade (P-32)"], "b", 12)]
for i, (p, extra) in enumerate(portas):
    y = 10 + i * 46
    c += [box(10, y, 250, 36, [p] + ([extra] if extra else []), "b hi" if "novo" in extra else "b", 11), seta(260, y + 18, 466, 125)]
c.append(txt(10, 250, "As cinco portas do to-be. O link /c/ alimenta a quinta; hoje a origem fica protegida por 180 dias (P-79).", 11))
V["portas"] = svg(660, 260, "".join(c), "Portas de origem das oportunidades")

# retorno ao parceiro
c = [box(10, 60, 150, 50, ["Oportunidade", "muda de etapa"], "b hi", 12), seta(160, 85, 206, 85)]
for i, (t, cls) in enumerate([("Grupo de WhatsApp (hoje, P-34)", "b2"), ("Lista no portal, na hora", "b"), ("E-mail na hora", "b"), ("Resumo semanal por e-mail", "b")]):
    y = 8 + i * 40
    c += [seta(206, 85, 236, y + 16), box(240, y, 260, 32, [t], cls, 11)]
c.append(txt(520, 90, "Com centenas de parceiros,", 11)); c.append(txt(520, 106, "um grupo por parceiro", 11)); c.append(txt(520, 122, "não escala.", 11))
V["retorno"] = svg(660, 176, "".join(c), "Como o parceiro fica sabendo do andamento")

# cadência (P-46)
linhas = [("Atenção alta", "mensal"), ("Demais parceiros ativos", "trimestral"), ("Candidatos em nutrição e ex-parceiros", "duas a três vezes por ano"), ("Nível C que entrou pela página", "?")]
c = [txt(10, 18, "Quem", 12, cls="tx", bold=True), txt(470, 18, "Ritmo de contato no to-be (P-46)", 12, "middle", "tx", True)]
for i, (a, b) in enumerate(linhas):
    y = 30 + i * 32
    c += [f'<line x1="10" y1="{y}" x2="650" y2="{y}" class="ln fino"/>', txt(10, y + 21, a, 12, cls="tx"), txt(470, y + 21, b, 12, "middle", "tx" if b == "?" else "mu", b == "?")]
c.append(txt(10, 176, "Cada contato leva algo de valor; depois de cada encontro, retorno em até 24 horas.", 11))
V["cadencia"] = svg(660, 186, "".join(c), "Cadência de contato por perfil")

# ---------------- Perguntas ----------------
Q("entrada", A, "A fila de espera vale só para empresas de software, ou para todos os perfis?", "escolha",
  ["O P-20 do to-be tem cinco passos: lista de candidatos, primeira reunião, qualificação, workshop e negociação do termo. No FO-08 você tirou a conversa para os SaaS; em 07/11 o Igor pediu a fila: o cadastro entra numa fila no portal, ele fala com cada um pelo WhatsApp, manda a agenda e só depois da conversa libera o acesso.",
   "Falta decidir se outros perfis (consultorias, agências, institucionais, parceiros estratégicos) também entram pela fila ou continuam no caminho completo do P-20."],
  ["Fila para empresas de software; caminho completo do P-20 (com workshop e negociação) para os demais perfis",
   "Fila para todos; workshop e negociação só para candidatos estratégicos (os que podem virar nível A)",
   "Fila para todos, sem exceção"],
  logica="Minha recomendação: a segunda. A conversa do Igor já faz a qualificação; workshop e negociação ficam para quem justifica o esforço.",
  cits=[DEC("Pedido do Igor, 07/11", "Os leads parceiros das campanhas do Meta entram na landing page, se inscrevem e entram em uma fila de espera visualizável pelos administradores no portal, para entrar em contato via WhatsApp um a um e, somente então, enviar o link do Google Calendar."),
        TOBE("P-20", "Candidato identificado > Manter a lista de candidatos > Agendar a primeira reunião > Qualificar candidato > Conduzir o workshop de alinhamento > Negociar e formalizar o termo")],
  visual=V["entrada"])

Q("fila_prazo", A, "Em quanto tempo quem entrou na fila recebe a primeira mensagem do Igor?", "escolha",
  "Quem vem do anúncio está quente nas primeiras horas. O portal avisa os administradores a cada cadastro e mostra a fila com a data de entrada.",
  ["No mesmo dia útil", "Em até 24 horas úteis", "Em até 48 horas úteis", "Outro prazo (comente)"],
  logica="Minha recomendação: no mesmo dia útil. Se o prazo virar regra, o portal pode marcar quem passou dele na fila diária de exceções (P-09).",
  cits=[TOBE("P-09", "Tratar a fila diária de exceções")])

Q("fila_quem", A, "Quem cuida da fila quando o Igor não puder?", "escolha",
  "Hoje os botões da fila (WhatsApp, agenda e aprovar) estão para administradores e para o time de parcerias.",
  ["Só o Igor, sempre", "Eu (Guilherme) cubro quando o Igor não puder", "O Gerente de Parcerias, com o Igor só nas conversas", "Outra pessoa (comente)"])

Q("fila_criterio", A, "O que decide aprovar ou descartar alguém da fila?", "multipla",
  "Hoje a aprovação é livre: quem estiver na fila pode ser aprovado. Marque o que pesa; o que for regra fixa pode virar aviso na fila.",
  ["Ser empresa de software com clientes empresariais", "Ter um número mínimo de clientes ativos (comente quantos)", "A conversa mostrar interesse real em oferecer a consultoria aos clientes",
   "Não ser concorrente da Wise Makers (consultoria comercial)", "Ter um responsável na empresa para cuidar da parceria"],
  cits=[TOBE("P-22", "Qualificar candidato")])

Q("fila_conversa", A, "O que a conversa do Igor com o parceiro cobre?", "texto",
  "A conversa fica no lugar da qualificação e, talvez, do encontro de alinhamento. Descreva o roteiro e a duração, para virar o passo a passo do processo.",
  placeholder="Duração:\nO que é apresentado:\nO que é perguntado ao parceiro:\nO que é combinado no fim:")

Q("nivel", A, "Quem confirma o nível e o pacote de quem entra pela página, e quando?", "escolha",
  ["Hoje o cadastro coloca todo mundo no nível C (Select), pacote Prateleira, em onboarding, com a nota \"nível a confirmar pela carteira no ICP\". O P-18 revisa o nível no fechamento trimestral."],
  ["Ninguém revisa no cadastro: o nível só muda no fechamento trimestral (P-18), pelo cubo",
   "O Gerente revisa na fila diária de exceções (P-09) quando o parceiro informa mais de um número de clientes ativos (comente o corte)",
   "O Gerente revisa todo cadastro novo uma vez por semana"],
  logica="Minha recomendação: a segunda. O cadastro já pede o número de clientes ativos; só os grandes viram exceção, e o resto segue pelo trimestre.",
  cits=[TOBE("P-09", "Tratar a fila diária de exceções")], visual=V["nivel"])

Q("outros_softwares", A, "Empresa de software que não é CRM nem ERP: segue o mesmo processo?", "escolha",
  ["No FO-09 você decidiu que ninguém fica de fora: quem não é CRM nem ERP entra na categoria certa. A página do cliente já foi deixada neutra para qualquer tipo de sistema."],
  ["Mesmo processo, mesma oferta e mesma comissão para qualquer software",
   "Mesmo processo, mas o Gerente confere na fila de exceções se o software combina com o ICP da Wise",
   "Processo próprio para cada tipo (comente)"],
  cits=[DEC("FO-09, filtro", "Entra no portal e é colocado na categoria correta.")])

Q("encontro", B, "O encontro de alinhamento (P-28) continua para quem entra pela página?", "escolha",
  ["O P-28 prevê um encontro individual em até 7 dias da assinatura, para escolher a primeira oportunidade. Com a fila, o Igor já conversa com cada parceiro antes de aprovar.",
   "A página promete: link exclusivo, mensagem pronta e treinamento curto no portal."],
  ["A conversa do Igor na fila substitui o encontro de alinhamento",
   "Substituído pelo treinamento gravado no portal, sem encontro",
   "Encontro coletivo de boas-vindas, uma vez por mês, para todos os novos",
   "Encontro individual só para quem tem mais de um número de clientes ativos (comente o corte)",
   "Continua individual para todos"],
  logica="Minha recomendação: a conversa do Igor faz o papel do encontro, e o treinamento gravado entrega o resto. Assim não há duas reuniões por parceiro.",
  cits=[TOBE("P-28", "Gatilho: até 7 dias da assinatura. Saída: primeira oportunidade escolhida.")])

Q("plano90", B, "Quais passos do plano de 90 dias (P-94) continuam para quem entra pela página?", "multipla",
  ["O P-94 foi desenhado para poucos parceiros acompanhados de perto. No FO-07 você pediu um sistema de valor constante para o parceiro, num programa massificado.",
   "Marque o que continua. O que não for marcado sai do plano de quem entra pela página (continua para os outros perfis, se você escolheu dois caminhos)."],
  ["Montar o plano pelo pacote", "Publicar o anúncio conjunto da parceria", "Dar o treinamento curto ao time do parceiro (gravado)",
   "Divulgar o diagnóstico e o treinamento para a base do parceiro", "Conduzir o encontro com a base do parceiro", "Registrar as primeiras oportunidades"],
  logica="Minha recomendação: treinamento gravado, divulgação para a base (com a mensagem pronta e o link) e o registro das oportunidades, que o portal faz sozinho. Anúncio conjunto e encontro com a base ficam para níveis A e B.",
  cits=[DEC("FO-07, como funciona", "Temos que elaborar um sistema para sempre darmos valor constante para os parceiros para que consigamos fazer com que eles sempre recomendem a Wise.")],
  visual=V["plano90"])

Q("ativado", B, "O que conta para declarar o parceiro ativado (P-30)?", "escolha",
  ["Hoje o P-30 declara a ativação pela primeira reunião gerada ou pelo marco de 90 dias, com extensão até 120 dias. Com o link, o portal já registra sozinho cada cliente que entra e cada diagnóstico feito."],
  ["Primeiro cliente cadastrado pelo link", "Um número de clientes cadastrados pelo link (comente quantos)", "Primeiro diagnóstico feito (reunião ou autodiagnóstico)", "Primeira oportunidade de consultoria aberta"],
  logica="Minha recomendação: um número pequeno de diagnósticos feitos, por exemplo 3, em 90 dias. Um só cadastro pode ser teste do próprio parceiro; diagnóstico feito mostra que a base respondeu.",
  cits=[TOBE("P-30", "Gatilho: primeira reunião gerada ou marco de 90 dias.")], visual=V["ativacao"])

Q("treinamento", B, "Quem produz e mantém o treinamento gravado e o kit de convite (P-88, P-96)?", "texto",
  "A página dos parceiros promete um treinamento curto de como apresentar a consultoria incluída e ganhar comissão. O P-96 (kit de convite ao diagnóstico) e o P-88 (trilhas) têm o Gerente como dono. Diga quem grava, quem revisa e de quanto em quanto tempo atualiza.",
  placeholder="Quem grava:\nQuem revisa:\nAtualização:")

Q("diag_fluxo", C, "O fluxo do diagnóstico no to-be passa a ser o que está no ar?", "escolha",
  ["O P-95 hoje tem só a reunião, com o perfil de R$ 250 mil por mês e duas pessoas no comercial. No FO-10 você mudou para mais de 3 vendedores, agenda do Google para quem está no ICP e autodiagnóstico na hora para os demais, com o link do Hub só depois do resultado."],
  ["Sim, como está no esquema", "Sim, com ajustes (comente)"],
  cits=[DEC("FO-10, ação", "O lead vai marcar uma reunião de diagnóstico. [...] Se ele entrar no ICP da Wise Makers, libera o calendly. Se não entra no ICP em MQL, libera um link para ele preencher as perguntas por conta própria. O diagnóstico sai na hora e, só depois disso, libera o link para o Wise Hub."),
        TOBE("P-95", "Conferir se a empresa está no ICP da Wise > A empresa está no ICP? > Avisar o cliente e o parceiro de que o diagnóstico não se aplica")],
  visual=V["diagnostico"])

Q("diag_quem", C, "Quem conduz as reuniões de diagnóstico, e o que acontece quando a agenda enche?", "escolha",
  ["No FO-08 você disse que, se ficarem muitos diagnósticos num dia, outras pessoas além de você passam a conduzir, mesmo que sejam 10 por dia. Hoje o P-95 tem o Gerente como dono."],
  ["Eu conduzo; quando passar de um número por semana (comente), entra outra pessoa da Wise",
   "Uma equipe de consultores da Wise divide a agenda desde o começo (comente quem)",
   "Quando a agenda enche, a página passa a mandar todos para o autodiagnóstico até abrir horário"],
  cits=[DEC("FO-08, formato", "Caso fiquemos com muitos diagnósticos para fazer num dia só, passamos para outras pessoas fazerem além de mim, mesmo que sejam 10 diagnósticos por dia.")])

Q("diag_entrega", C, "O que a reunião entrega ao cliente, e em quanto tempo?", "escolha",
  "O P-95 termina em \"Entregar o mapa de planejamento\" e \"Liberar o acesso ao Wise Hub\". Falta definir o formato do mapa e o prazo.",
  ["O mapa sai do próprio Wise Hub (o PDF do diagnóstico de planejamento) e é enviado no mesmo dia",
   "Mapa próprio da reunião, num modelo da Wise, enviado em até 2 dias úteis",
   "Só a conversa na reunião e o acesso ao Hub, sem documento"],
  logica="Minha recomendação: o PDF do próprio Hub, ajustado na reunião. Não cria um documento novo para produzir a cada cliente.")

Q("pos_autodiag", C, "Quem fala com o cliente que fez o autodiagnóstico e ficou fora do ICP?", "escolha",
  "Hoje ele recebe o resultado e o link do Hub, e ninguém entra em contato (a página promete \"sem ligação insistente\"). O Hub tem trilhas e conteúdo para nutrir.",
  ["Ninguém: o Wise Hub nutre, e a Wise só fala se o cliente pedir",
   "A Wise manda um e-mail com o resultado e um próximo passo, sem ligação",
   "O parceiro recebe a sugestão de conversar com o cliente, quando houver autorização"],
  logica="Minha recomendação: a primeira, com um e-mail automático do resultado quando o Resend estiver ligado. Mantém a promessa da página.")

Q("pesquisa", C, "Como a pesquisa da UniCesumar entra no processo?", "escolha",
  ["No FO-10 você disse que as reuniões serão onde a pesquisa é aplicada, com um aceite de consentimento com a marca da UniCesumar. A coleta só começa depois da aprovação do Comitê de Ética e do Termo de Consentimento assinado."],
  ["Fica fora do processo até a aprovação do CEP; depois, entra como passo da reunião",
   "Já entra no to-be como passo opcional, marcado como dependente da aprovação",
   "Vira um processo separado, fora do Wise Partners"],
  cits=[DEC("FO-10, ação", "Preciso ver sobre como vou conseguir fazer estas pesquisas com a liberação da LGPD e da CEP da Unicesumar. Talvez só com um popup de consentimento com a logo da Unicesumar.")])

Q("portas", D, "A proteção da origem vale igual para o link da página do cliente?", "escolha",
  ["O to-be tem cinco portas: indicação por link, Prateleira, cruzamento de carteiras, Base Ativa e diagnóstico do cliente do parceiro. O link novo da página do cliente (/c/código) alimenta a quinta porta; o link /i/ continua sendo a indicação de projeto.",
   "O P-79 protege a origem por 180 dias. No FO-10 você disse que o link /c/ funciona como link de afiliado. Uma consultoria pode levar mais que 6 meses entre o diagnóstico e a contratação."],
  ["180 dias, como as outras portas", "12 meses a partir do cadastro do cliente", "Enquanto o parceiro estiver ativo no programa", "Outra regra (comente)"],
  logica="Minha recomendação: 180 dias, igual às outras portas. Uma regra só é mais fácil de explicar e de pagar; se o ciclo real se mostrar mais longo, revisamos no fechamento trimestral.",
  cits=[TOBE("P-79", "Link, cruzamento, Base Ativa, Prateleira ou registro à mão, sempre com o parceiro de origem. No portal: registra e protege por 180 dias."),
        DEC("FO-10, canais", "o link acaba sendo como de afiliado. Ele ainda recebe comissão")], visual=V["portas"])

Q("closer", D, "Depois do diagnóstico, se o cliente quer contratar a consultoria, quem segue?", "escolha",
  "O P-33 entrega o lead ao closer da empresa do grupo. Para clientes da página, quem fez o diagnóstico já conhece o caso.",
  ["Quem fez o diagnóstico conduz a proposta até o fechamento", "Quem fez o diagnóstico passa ao closer da Wise (P-33)", "Depende do porte (comente o corte)"])

Q("retorno", D, "Como o parceiro fica sabendo do andamento dos clientes que indicou?", "escolha",
  ["O P-34 avisa o Gerente por WhatsApp e manda o retorno no grupo do parceiro. Com parceiros entrando sozinhos, nem todos terão grupo.",
   "O portal já mostra ao parceiro a lista de quem entrou pelo link e o andamento. No FO-10 você escolheu aviso no portal, e-mail na hora e resumo semanal."],
  ["Só pelo portal e por e-mail para quem entra pela página; grupo de WhatsApp só para níveis A e B",
   "Portal e e-mail para todos; o grupo de WhatsApp deixa de existir",
   "Grupo de WhatsApp para todos, como hoje"],
  logica="Minha recomendação: a primeira. O P-34 ganha um caminho automático e mantém o grupo para quem já tem.",
  cits=[TOBE("P-34", "Avisar o Gerente por WhatsApp > Registrar a etapa no portal > Personalizar e enviar o retorno no grupo do parceiro")], visual=V["retorno"])

Q("comissao", D, "A regra da comissão continua a mesma para quem entra pela página?", "escolha",
  ["A página promete 40% da primeira mensalidade da consultoria da Wise Makers, pago ao CNPJ do parceiro com nota, depois que o primeiro pagamento compensar, uma vez por cliente novo; o Wise Hub não gera comissão. O P-38 paga e o P-62 fixa a regra única."],
  ["Sim, regra única para todos os parceiros", "Sim, mas com valor mínimo para emitir nota (comente)", "Outra regra para quem entra pela página (comente)"],
  cits=[TOBE("P-38", "Gatilho: primeiro pagamento compensado.")])

Q("cadencia", E, "Qual a cadência de contato da Wise com o parceiro nível C que entrou pela página?", "escolha",
  "O P-46 dá contato mensal para quem tem atenção alta e trimestral para os demais ativos, sempre levando algo de valor. Com centenas de parceiros da página, um contato individual por trimestre pode não caber na agenda.",
  ["Só automático: portal, e-mail do mês e o resumo dos clientes", "Automático e o encontro trimestral de parceiros (P-83) como o contato do trimestre", "Trimestral individual, como os demais ativos"],
  logica="Minha recomendação: a segunda. Usa o encontro trimestral que já existe e não cria agenda por parceiro.",
  visual=V["cadencia"])

Q("valor", E, "O que a Wise devolve ao parceiro, e de quanto em quanto tempo?", "multipla",
  "Os benefícios que você aprovou para a página: raio-x da maturidade da base (agregado; por cliente só com autorização), caso publicado em conjunto, mais uso e renovação do sistema. Marque o que vira entrega periódica no processo.",
  ["Raio-x agregado da base, quando houver pelo menos alguns diagnósticos (comente o mínimo)", "Resumo mensal: quem entrou, diagnósticos feitos, oportunidades",
   "Caso publicado em conjunto quando um cliente tiver resultado", "Mentoria mensal aberta à carteira do parceiro (P-84, hoje só para os pacotes B e A)"],
  cits=[DEC("FO-08, benefícios", "Mapeamento gratuito da saúde da base, aumentar a oferta, maior ltv para ele, diferenciação com relação à concorrência, possibilidade de fazer um case de sucesso")])

Q("comunidade", E, "Os parceiros que entram pela página fazem parte da comunidade Wise Partners (P-47)?", "escolha",
  "A comunidade tem rituais (P-49), apresentações entre parceiros (P-52) e encontros pequenos (P-53).",
  ["Sim, desde a entrada", "Só depois de ativados (P-30)", "Só a partir do nível B"],
  logica="Minha recomendação: depois de ativados. Quem ainda não mandou o link para a base tem pouco a trocar com os outros.")

Q("admin", F, "Quem administra as landing pages no portal?", "escolha",
  "Em Configurações ficam: publicação, vídeo e formato, pixel do Meta e GA4, agenda, link do Hub, regra do ICP, termo, política e as listas de cadastros. Hoje só o administrador edita.",
  ["Eu (Guilherme)", "Igor", "Outra pessoa (comente quem)"])

Q("dominio", F, "Os endereços no domínio novo ficam assim?", "escolha",
  ["Com o wisepartners.com.br, proponho: a página dos parceiros na raiz do domínio, a página do cliente em wisepartners.com.br/c/código e o login do portal em wisepartners.com.br/entrar. O endereço antigo da Netlify continua funcionando e leva para o novo."],
  ["Sim", "Ajustar (comente)"])

Q("mais", F, "Algo importante que eu não perguntei sobre os processos?", "texto",
  "Qualquer mudança de responsável, de prazo ou de regra que você já combinou com o Igor e que ainda não está no to-be.",
  placeholder="Escreva aqui")

json.dump(ITENS, open(BASE + "/ferramentas/fo11_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Processos depois das landing pages</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo16_itens', META = 'respostas/FO-16', CHAVE = 'fo16-rascunho';"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + """<header>
    <p class="eyebrow">FO-11 · Processos do Wise Partners</p>
    <h1>O que muda nos processos com as duas landing pages</h1>
    <p class="lead">O to-be v7 foi validado antes da entrada pelo portal e da fila de espera: ainda tem reunião, workshop e negociação do termo para todo parceiro, encontro individual de alinhamento, plano de 90 dias acompanhado de perto e diagnóstico só por reunião. Aqui ficam as decisões que conciliam o to-be com o que já está no ar. Cada pergunta cita o processo que muda e o que você já decidiu. As respostas são salvas enquanto você marca.</p>
  </header>""" + pagina[j:]
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas,", sum(1 for x in ITENS if x["visual"]), "com visual")
