# FO-10: landing page do cliente do parceiro (a página do link exclusivo).
# Mesmo modelo do FO-09: contexto, lógica, trechos das skills e um visual por pergunta quando ajuda.
import json, html, os
BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-10/formulario.html"
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

def SK(skill, trecho): return {"livro": f"Skill {skill}", "pagina": "SKILL.md", "trecho": trecho}
def DEC(fonte, trecho): return {"livro": fonte, "pagina": "resposta sua", "trecho": trecho}
def Q(k, bloco, texto, tipo, contexto, opcoes=(), placeholder="", logica="", cits=(), visual=""):
    ITENS.append({"id": "LC-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": list(opcoes),
                  "contexto": contexto if isinstance(contexto, list) else [contexto], "logica": logica,
                  "citacoes": list(cits), "visual": visual, "placeholder": placeholder})

A, B, C, D, E = "Quem chega e de onde", "O que o cliente faz na página", "A mensagem", "Confiança, dados e prova", "Cadastro, link e acompanhamento"

# ---------- Visuais ----------
V = {}
# canais: parceiro -> canais -> página -> ação
c = [box(10, 120, 120, 50, ["Parceiro", "(seu software)"], "b hi", 13, True)]
canais = ["Mensagem no WhatsApp", "E-mail para a base", "Implantação de cliente novo", "Aviso dentro do sistema", "Proposta comercial"]
for i, t in enumerate(canais):
    y = 10 + i * 56
    c += [seta(130, 145, 196, y + 20), box(200, y, 180, 40, [t], "b", 12)]
    c.append(seta(380, y + 20, 446, 145))
c += [box(450, 115, 110, 60, ["Página do", "cliente"], "b hi", 13, True), seta(560, 145, 586, 145), box(590, 120, 64, 50, ["Ação"], "b", 13, True)]
c.append(txt(330, 300, "Cada canal leva ao mesmo link exclusivo do parceiro.", 11, "middle"))
V["canais"] = svg(660, 308, "".join(c), "Canais do parceiro levando à página do cliente")

# três caminhos da ação
c = [box(10, 120, 110, 50, ["Página do", "cliente"], "b hi", 13, True)]
cam = [("A", ["Botão leva ao", "Wise Hub"], ["Cadastro e diagnóstico", "acontecem no Hub"]),
       ("B", ["Diagnóstico na", "própria página"], ["Mapa na hora;", "conta do Hub junto"]),
       ("C", ["Cadastro curto", "na página"], ["Conta no Hub criada;", "diagnóstico lá dentro"])]
for i, (l, a, b) in enumerate(cam):
    y = 10 + i * 100
    c += [seta(120, 145, 176, y + 35), box(180, y + 10, 170, 50, a, "b", 12), txt(170, y + 8, l, 12, "end", "tx", True),
          seta(350, y + 35, 396, y + 35), box(400, y + 10, 180, 50, b, "b2", 12)]
c += [txt(590, 52, "Mais simples", 11), txt(590, 152, "Mais trabalho", 11), txt(590, 252, "Recomendado", 11, cls="tx", bold=True)]
V["acao"] = svg(680, 312, "".join(c), "Três caminhos para a ação principal")

# integração portal e Hub
c = [box(20, 40, 180, 110, ["Portal Wise Partners", "", "link exclusivo", "do parceiro"], "b hi", 12),
     box(460, 40, 180, 110, ["Wise Hub", "wisemakershub.com", "", "conta do cliente"], "b", 12),
     seta(200, 75, 456, 75), txt(330, 66, "1. cadastro com o código do parceiro", 11, "middle", "tx"),
     seta(456, 120, 204, 120, True), txt(330, 112, "2. andamento: diagnóstico feito, reunião pedida", 11, "middle"),
     txt(330, 180, "Hoje são dois sistemas separados. A seta 1 é o mínimo para a origem ficar marcada.", 11, "middle")]
V["hub"] = svg(660, 192, "".join(c), "Fluxo de dados entre o portal e o Wise Hub")

# marca do parceiro no Hub
c = [rect(20, 20, 620, 150, "b"), rect(20, 20, 150, 150, "b hi", 8),
     txt(36, 42, "EM PARCERIA COM", 9, cls="tx"),
     rect(36, 50, 52, 26, "b2", 6), txt(62, 67, "parceiro", 9, "middle"), rect(96, 50, 52, 26, "b2", 6), txt(122, 67, "Wise", 10, "middle", "tx", True),
     txt(36, 104, "Início", 11, cls="tx"), txt(36, 124, "Método Wise", 11), txt(36, 144, "Ferramentas", 11),
     txt(190, 56, "Olá, Ana. Vamos avançar na estrutura comercial da sua empresa?", 13, cls="tx", bold=True),
     rect(190, 76, 430, 70, "b2", 8), txt(206, 104, "Seu diagnóstico de maturidade", 12, cls="tx"), txt(206, 124, "1 de 3 etapas concluídas", 11),
     txt(330, 192, "O slide 12 da apresentação mostra o logo do parceiro no canto do Hub e nos certificados.", 11, "middle")]
V["marca"] = svg(660, 202, "".join(c), "Wise Hub com o selo de parceria no canto superior")

# reunião: árvore de decisão
c = [box(10, 70, 120, 50, ["Cliente se", "cadastra"], "b hi", 12, True), seta(130, 95, 176, 95),
     box(180, 60, 200, 70, ["Fatura R$ 250 mil por mês", "e tem 2 ou mais pessoas", "no comercial?"], "b", 12),
     seta(380, 80, 436, 40), txt(400, 50, "sim", 11, cls="tx", bold=True), box(440, 14, 210, 50, ["Vê o convite para a", "reunião individual"], "b hi", 12),
     seta(380, 110, 436, 150), txt(400, 146, "não", 11, cls="tx", bold=True), box(440, 126, 210, 50, ["Segue no Hub com o", "autodiagnóstico e as trilhas"], "b2", 12),
     txt(330, 206, "Os dois caminhos ficam visíveis para o parceiro no portal.", 11, "middle")]
V["reuniao"] = svg(660, 214, "".join(c), "Quem vê a reunião individual")

# três cabeçalhos
def cab(y, letra, partes, nota):
    o = [txt(10, y + 26, letra, 13, cls="tx", bold=True), rect(30, y, 600, 40, "b")]
    x = 44
    for t, cls, w in partes:
        o += [rect(x, y + 8, w, 24, cls, 6), txt(x + w / 2, y + 24, t, 11, "middle", "tx")]; x += w + 10
    o.append(txt(640, y + 26, nota, 11, "end"))
    return o
c = []
c += cab(10, "A", [("logo do parceiro", "b hi", 120), ("+", "b2", 24), ("Wise Makers", "b2", 96)], "duas marcas")
c += cab(70, "B", [("Convite de Fulano Software", "b2", 190), ("Wise Makers", "b2", 96)], "nome em texto")
c += cab(130, "C", [("Wise Makers", "b2", 96)], "parceiro só no rodapé")
V["cabecalho"] = svg(660, 182, "".join(c), "Três formas de mostrar o parceiro no topo")

# quadro de valor
itens = [("Imersão +20h", 3000), ("Diagnóstico", 1400), ("Plano 30, 60 e 90 dias", 3300), ("Ferramentas", 2300), ("Reunião individual", 5000)]
c = []; x0 = 190; esc_ = 400 / 5000
for i, (n, v) in enumerate(itens):
    y = 10 + i * 30
    c += [txt(180, y + 15, n, 12, "end", "tx"), f'<rect x="{x0}" y="{y + 3}" width="{v * esc_:.0f}" height="16" rx="3" class="barra2"/>',
          txt(x0 + v * esc_ + 8, y + 16, f"R$ {v:,.0f}".replace(",", "."), 11)]
c += [txt(180, 176, "Total", 12, "end", "tx", True), txt(x0, 177, "R$ 15.000 contratado à parte; R$ 0 para o cliente do parceiro", 12, cls="tx", bold=True)]
V["valor"] = svg(660, 188, "".join(c), "Valor de cada entrega do Wise Hub")

# roteiro do vídeo em blocos
blocos = [("0:00", "Gancho", "seu fornecedor", "te deu isto"), ("0:20", "O que você", "recebe", ""), ("0:50", "Como", "funciona", "3 passos"),
          ("1:30", "Prova", "um caso", ""), ("2:00", "Chamada", "cadastre-se", "")]
c = []
for i, (t, a, b, d) in enumerate(blocos):
    x = 10 + i * 130
    c += [box(x, 20, 120, 70, [l for l in (a, b, d) if l], "b hi" if i in (0, 4) else "b", 12), txt(x, 110, t, 11)]
    if i < 4: c.append(seta(x + 120, 55, x + 130, 55))
c.append(txt(330, 136, "Estrutura sugerida, cerca de 2 minutos; o texto final sai depois das respostas.", 11, "middle"))
V["video"] = svg(660, 146, "".join(c), "Estrutura sugerida do vídeo")

# três tamanhos de página
def esqueleto(x, nome, secs):
    o = [txt(x + 85, 14, nome, 12, "middle", "tx", True), rect(x, 22, 170, 22 + len(secs) * 22, "b", 8)]
    for i, (s, hi) in enumerate(secs):
        o += [rect(x + 10, 32 + i * 22, 150, 16, "b hi" if hi else "b2", 4), txt(x + 85, 44 + i * 22, s, 10, "middle", "tx")]
    return o
c = []
c += esqueleto(10, "Curta", [("Topo com vídeo", 1), ("O que você recebe", 0), ("Cadastro", 1)])
c += esqueleto(245, "Média", [("Topo com vídeo", 1), ("O que você recebe", 0), ("Como funciona", 0), ("Depoimentos", 0), ("Perguntas", 0), ("Cadastro", 1)])
c += esqueleto(480, "Longa", [("Topo com vídeo", 1), ("Logos", 0), ("O que você recebe", 0), ("Valor R$ 15.000", 0), ("Como funciona", 0), ("Depoimentos", 0), ("Perguntas", 0), ("Cadastro", 1)])
V["formato"] = svg(660, 230, "".join(c), "Três tamanhos de página")

# quem vê o quê
lin = [("Nome da empresa e data do cadastro", "sim", "sim", "sim"), ("Fez o diagnóstico, pediu reunião", "sim", "sim", "?"),
       ("Resultado do diagnóstico", "sim", "sim", "só com autorização"), ("Respostas e números do comercial", "sim", "sim", "não"),
       ("Lista de clientes do parceiro", "não", "não", "é dele")]
c = [txt(10, 18, "Dado", 12, cls="tx", bold=True), txt(330, 18, "Cliente", 12, "middle", "tx", True), txt(430, 18, "Wise", 12, "middle", "tx", True), txt(560, 18, "Parceiro", 12, "middle", "tx", True)]
for i, (d, a, b, p) in enumerate(lin):
    y = 30 + i * 30
    c += [f'<line x1="10" y1="{y}" x2="650" y2="{y}" class="ln fino"/>', txt(10, y + 20, d, 12, cls="tx"), txt(330, y + 20, a, 12, "middle"), txt(430, y + 20, b, 12, "middle"),
          txt(560, y + 20, p, 12, "middle", "tx" if p in ("?", "só com autorização") else "mu", p in ("?", "só com autorização"))]
c.append(txt(10, 196, "A pergunta é a linha do ponto de interrogação. A página do parceiro já promete o resultado só com autorização.", 11))
V["dados"] = svg(660, 206, "".join(c), "Quem vê cada dado do cliente")

# link atual e novo
c = [box(10, 20, 200, 60, ["/i/código do parceiro", "hoje"], "b", 12), seta(210, 50, 256, 50),
     box(260, 10, 200, 80, ["Fale com a Wise Makers", "formulário de indicação", "vai para o comercial"], "b2", 12),
     box(10, 120, 200, 60, ["mesmo link", "proposta"], "b hi", 12), seta(210, 150, 256, 150),
     box(260, 110, 200, 80, ["Página do cliente", "consultoria incluída", "cadastro no Hub"], "b hi", 12),
     seta(460, 175, 496, 175, True), box(500, 150, 150, 50, ["Quero falar com", "a Wise agora"], "b2", 11),
     txt(500, 220, "caminho secundário", 11)]
V["link"] = svg(660, 228, "".join(c), "O link exclusivo hoje e na proposta")

# aviso ao parceiro
c = [box(10, 50, 130, 50, ["Cliente se", "cadastra"], "b hi", 12, True), seta(140, 75, 186, 75), box(190, 50, 130, 50, ["Portal registra", "a origem"], "b", 12)]
avs = ["Aparece no portal", "E-mail na hora", "Resumo semanal", "WhatsApp"]
for i, t in enumerate(avs):
    y = 6 + i * 36
    c += [seta(320, 75, 386, y + 15, i > 0), box(390, y, 160, 30, [t], "b" if i == 0 else "b2", 12)]
c.append(txt(330, 160, "Tracejado: depende do Resend (e-mail) ou de outra integração, que o portal ainda não tem.", 11, "middle"))
V["aviso"] = svg(660, 170, "".join(c), "Como o parceiro fica sabendo de um cadastro")

# campos e conversão (esquema, sem números)
campos = [("Nome", 1), ("E-mail", 1), ("WhatsApp", 1), ("Empresa", 1), ("Cargo", 0), ("Faturamento por mês (faixa)", 1), ("Pessoas no comercial", 1), ("Senha do Hub", 0)]
c = [rect(10, 10, 300, 20 + len(campos) * 26, "b", 10)]
for i, (n, hi) in enumerate(campos):
    c += [rect(24, 22 + i * 26, 272, 20, "b hi" if hi else "b2", 5), txt(34, 36 + i * 26, n, 11, cls="tx")]
c += [txt(330, 40, "Em destaque, a sugestão mínima.", 12, cls="tx", bold=True),
      txt(330, 62, "Faturamento e pessoas no comercial definem", 12), txt(330, 80, "quem vê a reunião individual.", 12),
      txt(330, 110, "Cada campo a mais pesa na conversão;", 12), txt(330, 128, "cada campo a menos tira informação do parceiro", 12), txt(330, 146, "e da equipe da Wise.", 12)]
V["campos"] = svg(660, 20 + len(campos) * 26 + 10, "".join(c), "Campos sugeridos para o cadastro")

# ---------- Perguntas ----------
Q("canais", A, "Por onde o cliente do parceiro chega a esta página?", "multipla",
  ["Na página dos parceiros prometemos ao parceiro um link exclusivo, uma mensagem pronta e uma página de convite. Esta é a página de convite: quem chega aqui é cliente de um CRM ou ERP parceiro, não lead de anúncio.",
   "Você disse no FO-07 que a consultoria vai para toda a base de hoje e que o parceiro pode oferecer nos próximos fechamentos. Os canais definem o tom: quem chega por um WhatsApp do fornecedor chega morno e com contexto; quem clica num aviso dentro do sistema chega frio."],
  ["Mensagem no WhatsApp que o parceiro manda para a base", "E-mail do parceiro para a base", "Na implantação de cliente novo, apresentado pelo time do parceiro",
   "Aviso ou banner dentro do software do parceiro", "Na proposta comercial do parceiro, como argumento de venda", "Redes sociais do parceiro"],
  logica="Minha recomendação: WhatsApp, e-mail e implantação de cliente novo no começo. São os canais que a mensagem pronta do portal já cobre.",
  cits=[DEC("FO-07, pergunta do como funciona", "Vamos oferecer a consultoria gratuita (que é o diagnóstico e depois o wise hub) para todos os clientes da base e deixar que o parceiro possa oferecer isso para os próximos fechamentos dele."),
        SK("page-cro", "Message match with traffic source")], visual=V["canais"])

Q("acao", B, "O que o cliente faz quando clica no botão principal?", "escolha",
  ["No FO-08 você escolheu: autodiagnóstico online com mapa na hora e acesso ao Hub; reunião individual para quem está no perfil e pede.",
   "O Wise Hub já tem o diagnóstico de maturidade, o plano de 30, 60 e 90 dias em PDF, as calculadoras e a imersão. Refazer o diagnóstico nesta página duplicaria o Hub; mandar direto para o Hub perde a marca do parceiro e a origem do cadastro."],
  ["A: o botão leva ao Wise Hub, e o cadastro e o diagnóstico acontecem lá",
   "B: o autodiagnóstico fica na própria página, com o mapa na hora, e a conta do Hub vem junto",
   "C: cadastro curto na página, que cria a conta no Hub com a origem do parceiro; o diagnóstico acontece lá dentro"],
  logica="Minha recomendação: C. A página guarda a origem e o parceiro acompanha pelo portal; o Hub continua sendo o lugar do diagnóstico e do plano, sem duplicar nada.",
  cits=[DEC("FO-08, formato", "Autodiagnóstico online com mapa na hora e acesso ao Hub; reunião individual para quem está no perfil e pede"),
        SK("landing-page", "one offer → one audience → one primary action")], visual=V["acao"])

Q("hub_integracao", B, "Como o cadastro chega ao Wise Hub marcado com o parceiro?", "escolha",
  ["O Wise Hub (wisemakershub.com) é um sistema separado do portal. Para o parceiro ver no portal quem entrou pelo link dele, o Hub precisa receber o código do parceiro no cadastro e, de preferência, devolver o andamento.",
   "A apresentação de parceria (slide 12) promete \"Origem marcada: cada cadastro fica marcado com a origem de vocês\". Não sei se isso já existe no Hub."],
  ["O Hub já aceita um código de parceiro no link de cadastro", "O Hub tem uma API e o portal pode criar a conta por ela", "Ainda não existe: precisa ser construído no Hub", "Não sei (comente quem mantém o Hub)"],
  logica="Se ainda não existir, a primeira versão pode gravar o cadastro no portal e mandar a pessoa ao Hub com o código no link; o andamento volta numa segunda etapa.",
  visual=V["hub"])

Q("hub_marca", B, "O Wise Hub aparece com a marca do parceiro para o cliente?", "escolha",
  ["O mesmo slide 12 promete \"Duas marcas: logo de vocês no cabeçalho e nos certificados\" e \"Exclusivo de parceiro: o Wise Hub não é vendido avulso\".",
   "Na página dos parceiros eu não coloquei essa promessa, porque não sei se o Hub já faz isso. Se fizer, ela entra aqui e na página dos parceiros."],
  ["Sim, já funciona hoje", "Sim, mas ainda precisa ser construído", "Não por enquanto: só a marca da Wise no Hub"],
  visual=V["marca"])

Q("reuniao", B, "Como o cliente que está no perfil chega à reunião individual?", "escolha",
  ["Você definiu o perfil no FO-07: empresas que faturam pelo menos R$ 250 mil por mês, têm time comercial com pelo menos duas pessoas e querem crescer. No FO-08: a reunião é para quem está no perfil e pede, mesmo que sejam 10 diagnósticos por dia.",
   "A página precisa saber se a pessoa está no perfil antes de mostrar a agenda; senão, enche a agenda de quem não está."],
  ["O cadastro pergunta o faturamento e o tamanho do time; quem está no perfil vê o convite para agendar na hora",
   "Só depois do autodiagnóstico, dentro do Hub, quem está no perfil recebe o convite",
   "A equipe da Wise liga ou manda mensagem para quem está no perfil",
   "A agenda fica aberta para todos, e a equipe filtra depois"],
  logica="Minha recomendação: a primeira. Duas perguntas no cadastro bastam e o cliente no perfil não espera ninguém.",
  cits=[DEC("FO-07, perfil", "Empresas que faturem pelo menos R$250.000,00 mensais, tenham time comercial com pelo menos duas pessoas e que queiram crescer.")],
  visual=V["reuniao"])

Q("criterio", B, "Qual critério vale para a reunião individual?", "escolha",
  ["A página do Wise Hub diz \"para empresas com +3 vendedores\". A página dos parceiros segue o que você escreveu no FO-07: R$ 250 mil por mês e duas pessoas no comercial. As duas precisam dizer a mesma coisa."],
  ["R$ 250 mil por mês e pelo menos duas pessoas no comercial (como no FO-07)", "Mais de 3 vendedores (como no Hub)", "Outro (comente)"])

Q("agenda", B, "Onde a reunião é marcada?", "escolha",
  "Agendar na hora, sem troca de mensagens, é o que mantém o processo sem conversa manual. Se mais pessoas além de você fizerem diagnósticos, a agenda precisa distribuir entre elas.",
  ["Página de agendamento do Google Agenda", "Calendly ou ferramenta parecida (comente qual)", "Agenda dentro do próprio portal (precisa ser construída)", "WhatsApp da equipe"],
  logica="Minha recomendação: página de agendamento do Google Agenda na primeira versão, com a reunião registrada no portal pelo próprio cadastro.")

Q("quem_oferece", C, "Como o parceiro aparece no topo da página?", "escolha",
  ["O cliente confia no fornecedor de software dele, não na Wise Makers, que ele talvez nunca tenha ouvido falar. Ver a marca do fornecedor no topo é o que faz a página parecer um presente, e não um anúncio.",
   "Para mostrar o logo, o parceiro sobe o logo no portal; sem logo, a página mostra o nome em texto."],
  ["A: logo do parceiro e logo da Wise Makers lado a lado", "B: \"Convite de [nome do parceiro]\" em texto, com a marca da Wise", "C: só a Wise Makers, com o parceiro no rodapé"],
  logica="Minha recomendação: A, com B como reserva enquanto o parceiro não sobe o logo.",
  cits=[SK("copywriting", "Use words your customers use.")], visual=V["cabecalho"])

Q("titulo", C, "Qual linha de título você prefere?", "escolha",
  ["O título é a primeira coisa que o cliente lê depois de clicar no link do fornecedor. Os três dizem a mesma oferta: consultoria comercial incluída, sem custo, por conta do parceiro. [Parceiro] vira o nome do parceiro."],
  ["Diagnóstico comercial da Wise Makers, sem custo para clientes [Parceiro].",
   "A [Parceiro] incluiu consultoria comercial no seu sistema. Comece pelo diagnóstico.",
   "Descubra onde o seu comercial trava. Sem custo, por ser cliente [Parceiro].",
   "Outra (comente)"],
  cits=[SK("landing-page", "Headline (outcome + audience)")])

Q("valor", C, "A página mostra quanto vale o que o cliente recebe?", "escolha",
  "Na página dos parceiros mostramos o quadro de valor do Wise Hub: R$ 15.000 contratado à parte, R$ 0 para o cliente do parceiro. Para o cliente, o valor mostra que não é um material qualquer; o risco é parecer oferta de internet.",
  ["Sim, com o quadro de valor completo, como na página dos parceiros", "Sim, só o número (mais de R$ 15.000 em método) no topo", "Não mostra valor"],
  logica="Minha recomendação: o quadro completo, mais abaixo na página, depois do que o cliente recebe.", visual=V["valor"])

Q("prazo_hub", C, "O acesso do cliente do parceiro tem prazo?", "escolha",
  ["A página pública do Wise Hub diz que o acesso gratuito é \"por tempo limitado\". A página dos parceiros promete o Hub sem custo para o cliente, sem falar em prazo. Ficou pendente na entrega anterior."],
  ["Sem prazo para o cliente do parceiro", "O mesmo prazo do Hub público (comente qual)", "Prazo próprio para o cliente do parceiro (comente)"])

Q("video", C, "Como é o vídeo desta página?", "escolha",
  ["No FO-08 você disse que esta página terá um vídeo próprio. Enquanto ele não existir, uso uma capa, como fizemos com o Igor na página dos parceiros.",
   "O vídeo explica a oferta; o título e o botão carregam a decisão. Abaixo, a estrutura que eu sugiro para um vídeo de 2 minutos."],
  ["O Igor, como no vídeo dos parceiros", "O Igor, com um trecho de depoimento de cliente", "Sem vídeo na primeira versão: imagem e texto", "Outro (comente)"],
  logica="Minha recomendação: o Igor, com um trecho de depoimento perto do fim. Depois das respostas, escrevo o roteiro.",
  cits=[DEC("FO-08, agenda", "terão acesso ao link deles próprios da landing page de divulgação da consultoria (é uma outra landing page que teremos que fazer, com um vídeo próprio)"),
        SK("landing-page-anatomy", "Video proof konsekwentnie outperformuje statyczny.")], visual=V["video"])

Q("formato", C, "Qual tamanho de página?", "escolha",
  ["Na página dos parceiros você escolheu a longa, porque o tráfego vem frio dos anúncios. Aqui o cliente chega pelo fornecedor, com mais confiança. Uma página longa demais pode atrasar quem já veio decidido."],
  ["Curta: topo com vídeo, o que você recebe e cadastro", "Média: mais como funciona, depoimentos e perguntas frequentes", "Longa, no mesmo padrão da página dos parceiros"],
  logica="Minha recomendação: média.", visual=V["formato"])

Q("objecoes", D, "Quais dúvidas o cliente vai ter antes de se cadastrar?", "multipla",
  "Cada dúvida marcada vira uma pergunta frequente ou uma linha perto do botão. Comente outras que você já ouviu de clientes.",
  ["Por que é de graça? Qual é o porém?", "Vão me ligar insistindo?", "Meu fornecedor de software vai ver os meus dados?", "Serve para a minha empresa (porte, setor)?",
   "Quanto tempo leva?", "É curso? Vou ter que assistir 20 horas?", "Depois vão me cobrar alguma coisa?", "Quem é a Wise Makers?"],
  cits=[SK("page-cro", "Will this work for my situation?")])

Q("dados", D, "O que o parceiro vê de cada cliente que entrou pelo link?", "escolha",
  ["A página dos parceiros já promete: \"A Wise nunca recebe a sua lista de clientes, e o resultado individual só é compartilhado com você se o cliente autorizar\".",
   "Falta decidir o meio: se o parceiro vê o andamento (fez o diagnóstico, pediu a reunião) e como o cliente autoriza mostrar o resultado."],
  ["Só que o cliente se cadastrou (empresa e data)",
   "Cadastro e andamento, sem o resultado do diagnóstico",
   "Cadastro e andamento; o resultado só se o cliente marcar uma caixa de autorização no cadastro"],
  logica="Minha recomendação: a terceira, com a caixa desmarcada por padrão.", visual=V["dados"])

Q("prova", D, "Que provas entram na página?", "multipla",
  "Na página dos parceiros já temos os logos, os três depoimentos em vídeo (Protectpool, Fusion e Cristal Móveis) e os números da Wise.",
  ["Logos de clientes da Wise Makers", "Os três depoimentos em vídeo", "Números da Wise (4 anos, +300 empresas, +1.500 vendedores)", "Tela do Wise Hub",
   "Depoimento de um cliente que veio por um parceiro (quando existir)"],
  cits=[SK("landing-page-anatomy", "Social proof musi być layered")])

Q("campos", E, "Quais campos o cadastro pede?", "multipla",
  ["Se a ação for a C (cadastro curto que cria a conta no Hub), estes campos vão para o Hub e para o portal. Faturamento e pessoas no comercial decidem quem vê a reunião.",
   "Senha: se o cadastro já cria a conta no Hub, a pessoa escolhe a senha aqui, como na página dos parceiros."],
  ["Nome", "E-mail", "WhatsApp", "Empresa", "CNPJ", "Cargo", "Faturamento por mês (faixa)", "Pessoas no comercial", "Segmento", "Principal desafio comercial", "Senha para entrar no Hub"],
  logica="Minha recomendação: nome, e-mail, WhatsApp, empresa, faturamento por faixa e pessoas no comercial; senha se o Hub permitir criar a conta.",
  cits=[SK("page-cro", "Too many form fields")], visual=V["campos"])

Q("link", E, "O que acontece com o link exclusivo que já existe?", "escolha",
  ["Hoje o link exclusivo (/i/código) abre um formulário \"Fale com a Wise Makers\", que manda a indicação para o comercial e deixa escolher entre as empresas do grupo.",
   "Para os parceiros SaaS, a oferta mudou: o cliente entra pela consultoria incluída, não por uma conversa com o comercial."],
  ["O mesmo link passa a abrir esta página, com \"quero falar com a Wise agora\" como caminho secundário",
   "Dois links: o atual para indicação de projeto e um novo para esta página",
   "Esta página só para parceiros SaaS; os outros parceiros continuam com o link atual"],
  logica="Minha recomendação: a terceira. Mantém o que já funciona para os outros parceiros e dá aos SaaS a página nova no mesmo link.",
  visual=V["link"])

Q("aviso", E, "Como o parceiro fica sabendo quando um cliente se cadastra?", "multipla",
  "O portal ainda não manda e-mail (falta configurar o Resend). Aparecer no portal funciona desde o primeiro dia.",
  ["Aparece no portal, na lista de quem entrou pelo link", "E-mail para o parceiro na hora", "Resumo semanal por e-mail", "Mensagem no WhatsApp"],
  visual=V["aviso"])

Q("medicao", E, "Que medição a página tem?", "escolha",
  "Na página dos parceiros a medição fica na administração da landing page, no portal. Aqui o tráfego vem do parceiro, não de anúncio da Wise.",
  ["A mesma administração da Wise (pixel do Meta e GA4), sem nada do parceiro", "A da Wise e também o pixel do próprio parceiro, que ele coloca no portal", "Nenhuma por enquanto: só a origem do parceiro no cadastro"],
  logica="Minha recomendação: a primeira. A origem do parceiro já sai do link; o pixel do parceiro pode vir depois.")

Q("mais", E, "Quando os parceiros começam a mandar o link, e algo importante que eu não perguntei?", "texto",
  "A página precisa estar pronta antes da primeira mensagem dos parceiros. Se houver material para esta página (vídeo, fotos, textos de clientes, casos de clientes que vieram de parceiros), diga onde está.",
  placeholder="Data prevista:\nMateriais:\nOutras observações:")

json.dump(ITENS, open(BASE + "/ferramentas/fo10_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
troca = {
    "<title>Perguntas ao patrocinador</title>": "<title>Página do cliente do parceiro</title>",
    "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo15_itens', META = 'respostas/FO-15', CHAVE = 'fo15-rascunho';",
}
for a, b in troca.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + """<header>
    <p class="eyebrow">FO-10 · Landing page do cliente do parceiro</p>
    <h1>Como vai ser a página do cliente do parceiro</h1>
    <p class="lead">É a página que abre no link exclusivo do parceiro: o cliente de um CRM ou ERP parceiro chega aqui e recebe a consultoria comercial incluída. A oferta, o perfil da reunião, a identidade e a prova já estão decididos nos formulários anteriores; aqui ficam só as escolhas que faltam. Cada pergunta traz o contexto, o que você já decidiu e, quando ajuda, um esquema. As respostas são salvas enquanto você marca.</p>
  </header>""" + pagina[j:]
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas,", sum(1 for x in ITENS if x["visual"]), "com visual")
