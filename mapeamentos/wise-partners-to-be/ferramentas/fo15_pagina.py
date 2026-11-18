# FO-15: atualização dos processos padrão depois da reunião com a PluggMe (18/11/2026): acessos ao portal, diagnóstico de 2 horas, valor de referência e cases.
import json, html, os
BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-15/formulario.html"
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

def TOBE(pid, trecho): return {"livro": f"To-be v10, {pid}", "pagina": "mapa.json", "trecho": trecho}
def DEC(fonte, trecho): return {"livro": fonte, "pagina": "resposta sua", "trecho": trecho}
def Q(k, bloco, texto, tipo, contexto, opcoes=(), placeholder="", logica="", cits=(), visual=""):
    ITENS.append({"id": "PD-" + k, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": list(opcoes),
                  "contexto": contexto if isinstance(contexto, list) else [contexto], "logica": logica,
                  "citacoes": list(cits), "visual": visual, "placeholder": placeholder})

A, B, C, D, E = ("Quem usa o portal (12.3 e 2)", "Diagnóstico do cliente do parceiro (6.1)", "Valor de referência na comunicação", "Cases de resultado", "O parceiro e o link")
def ATA(trecho): return {"livro": "Reunião com a PluggMe (Lennon), relatada por você em 18/11", "pagina": "chat", "trecho": trecho}
def CASES(trecho): return {"livro": "Página de cases da Wise Makers (nov/26)", "pagina": "claude.ai/artifact/1R7mtSvDJqXoDgQ6vv2Rt9", "trecho": trecho}
CASOS = sorted(json.load(open(BASE + "/fontes/cases-wise-2026-11.json"))["cases"], key=lambda x: -x["growth"])

V = {}
# acessos: hoje x o que você descreveu
linhas = [("Gerente de Parcerias", "tudo", "tudo"), ("Diretores", "só leitura (painel e casos)", "administrador?"), ("Consultores da Wise", "não entram", "administrador?"),
          ("Comercial e financeiro", "não entram", "?"), ("Parceiro", "a área dele: link, clientes, minicurso", "a área dele: link, clientes, minicurso")]
c = [txt(10, 18, "Quem", 12, cls="tx", bold=True), txt(300, 18, "Hoje no mapa (v10)", 12, "middle", "tx", True), txt(530, 18, "O que você descreveu", 12, "middle", "tx", True)]
for i, (a, b, e) in enumerate(linhas):
    y = 30 + i * 34
    c += [f'<line x1="10" y1="{y}" x2="650" y2="{y}" class="ln fino"/>', txt(10, y + 22, a, 12, cls="tx"), txt(300, y + 22, b, 12, "middle"),
          txt(530, y + 22, e, 12, "middle", "tx" if "?" in e else "mu", "?" in e)]
c.append(txt(10, 214, "O portal já tem os perfis admin, parcerias, consultor, comercial, financeiro e parceiro; o mapa é que diz quem usa.", 11))
V["acessos"] = svg(660, 224, "".join(c), "Quem acessa o portal, hoje e como você descreveu")

# diagnóstico antes e depois
c = [txt(10, 18, "Como está no mapa (v10)", 12, cls="tx", bold=True)]
c += fila(28, [["Cadastro", "pelo link"], ["Mais de 3", "vendedores"], ["Agenda", "do Google"], ["Reunião", "Matriz 5x5"], ["Mapa em até", "2 dias úteis"]], w=116)
c += [txt(10, 112, "Depois da reunião com a PluggMe", 12, cls="tx", bold=True)]
c += fila(122, [["Cadastro", "pelo link"], ["Quem recebe", "a reunião?"], ["Agenda", "do Google"], ["Reunião de", "cerca de 2 horas"], ["Diagnóstico e", "plano de ação"]], w=116)
c.append(txt(330, 196, "Valor de referência: R$ 1.500 a R$ 2.000 se contratado direto com a Wise. Para o cliente do parceiro, sem custo.", 11, "middle"))
V["diag"] = svg(660, 206, "".join(c), "Diagnóstico antes e depois")

# agenda: horas por semana
c = []
for i, (n, rot) in enumerate([(10, "10 reuniões"), (7, "7 reuniões"), (5, "5 reuniões"), (3, "3 reuniões")]):
    y = 14 + i * 34; w = n * 2 * 19
    c += [txt(10, y + 17, rot, 12, cls="tx"), f'<rect x="110" y="{y}" width="{w}" height="22" rx="4" class="barra1"/>', txt(118 + w, y + 16, f"{n * 2} horas por semana", 11)]
c.append(txt(10, 160, "Cada reunião passa a ocupar cerca de 2 horas, sem contar o preparo e o plano de ação.", 11))
V["agenda"] = svg(660, 170, "".join(c), "Horas por semana conforme o número de reuniões")

# cases
c = []
mx = max(x["growth"] for x in CASOS)
for i, x in enumerate(CASOS):
    y = 10 + i * 30; w = x["growth"] / mx * 250
    c += [txt(200, y + 16, x["name"], 12, "end", "tx"), f'<rect x="210" y="{y}" width="{w:.0f}" height="20" rx="4" class="barra1"/>',
          txt(216 + w, y + 15, f"+{str(x['growth']).replace('.', ',')}%  ({x['period']})", 11)]
med = 25.5 / mx * 250 + 210
c = [f'<line x1="{med:.0f}" y1="4" x2="{med:.0f}" y2="{10 + len(CASOS) * 30}" class="ln dash"/>'] + c + [txt(med + 4, 10 + len(CASOS) * 30 + 12, "mediana +25,5%", 11)]
c.append(txt(10, 10 + len(CASOS) * 30 + 32, "Faturamento dos meses com a Wise contra os mesmos meses do ano anterior.", 11))
c.append(txt(10, 10 + len(CASOS) * 30 + 48, "8 de 8 cresceram; 91 de 113 meses ficaram acima do ano anterior.", 11))
V["cases"] = svg(660, 10 + len(CASOS) * 30 + 58, "".join(c), "Crescimento dos 8 cases da Wise Makers")

# conflito de valores
lin = [("Diagnóstico de maturidade comercial (Wise Hub)", "R$ 1.400", "na página do cliente e na dos parceiros"),
       ("Reunião individual com a equipe da Wise (Wise Hub)", "R$ 5.000", "na página do cliente e na dos parceiros"),
       ("Diagnóstico de 2 horas com plano de ação", "R$ 1.500 a R$ 2.000", "o que você passou agora")]
c = [txt(10, 18, "Item", 12, cls="tx", bold=True), txt(420, 18, "Valor", 12, "middle", "tx", True), txt(560, 18, "Onde aparece", 12, "middle", "tx", True)]
for i, (a, b, e) in enumerate(lin):
    y = 30 + i * 34
    c += [f'<line x1="10" y1="{y}" x2="650" y2="{y}" class="ln fino"/>', txt(10, y + 22, a, 12, cls="tx"), txt(420, y + 22, b, 12, "middle", "tx", i == 2), txt(560, y + 22, e, 11, "middle")]
V["valores"] = svg(660, 140, "".join(c), "Valores de referência que já aparecem nas páginas")

# ---------------- Perguntas ----------------
Q("acesso_diretor", A, "Os diretores da Wise passam a administrar o portal?", "escolha",
  ["Hoje o mapa diz que o Igor acessa o portal só para ver o painel da semana e os casos, sem mudar nada (decisão do FO-06). Você agora descreveu os diretores como administradores, inclusive para editar as landing pages.",
   "Administrador vê e muda tudo: configurações das duas páginas, fila de candidatos, aprovação de parceiros, comissões, regras e acessos."],
  ["Sim, os diretores são administradores, com acesso total", "Os diretores veem tudo e editam só as landing pages e os conteúdos", "Continua só leitura, como hoje"],
  logica="Minha recomendação: a primeira, se os diretores vão de fato operar. Se a ideia é só acompanhar e ajustar textos, a segunda reduz o risco de alguém mudar uma regra sem querer.",
  cits=[TOBE("DE-27", "O Igor acessa o portal só para ver o painel da semana e os casos.")], visual=V["acessos"])

Q("acesso_consultor", A, "O que os consultores da Wise fazem no portal?", "escolha",
  ["Hoje o mapa diz que consultores e comercial não entram no portal: o Gerente registra o que eles fazem (decisão do FO-01). O portal já tem um perfil 'consultor' pronto, que vê os parceiros e as oportunidades, mas não mexe em configurações.",
   "Com o diagnóstico de 2 horas, outros consultores provavelmente vão conduzir reuniões. Se eles entram no portal, registram o próprio diagnóstico, o plano de ação e a checagem de 6 e 12 meses, em vez de passar tudo ao Gerente."],
  ["Entram com o perfil de consultor: veem os clientes e as oportunidades e registram os diagnósticos e as checagens que fazem, sem editar páginas nem regras",
   "Entram como administradores, com acesso total", "Continuam fora do portal; o Gerente registra por eles"],
  logica="Minha recomendação: a primeira. Cada um registra o que faz, o Gerente deixa de ser digitador, e só quem responde pelo programa mexe em regras e páginas.",
  cits=[TOBE("DE-06", "Todas as tarefas do portal têm o Gerente de Parcerias como dono, mesmo quando outra pessoa executa; consultores e comercial não entram no portal.")])

Q("dono", A, "Com mais gente no portal, quem continua dono dos processos?", "escolha",
  "O mapa tem o Gerente de Parcerias como dono de todas as tarefas, mesmo as que outros executam. Dono é quem responde pelo resultado do processo, não quem digita.",
  ["O Gerente continua dono de tudo; consultores e diretores executam e registram a parte deles", "Cada consultor é dono dos diagnósticos que conduz",
   "O Diretor passa a ser dono dos processos de gestão (rituais e medidas); o Gerente, do resto"],
  logica="Minha recomendação: a primeira. Um dono só por processo continua sendo o que permite uma pessoa garantir o programa inteiro.")

Q("diag_formato", B, "Como é a nova reunião de diagnóstico de cerca de 2 horas?", "escolha",
  ["Você contou que, depois da reunião com o Lennon (PluggMe), o programa ficou mais robusto: em vez de cerca de 40 minutos, cada cliente do parceiro recebe uma reunião de cerca de 2 horas, com diagnóstico e plano de ação.",
   "Hoje o processo 6.1 tem uma reunião pela Matriz 5x5 e o mapa da reunião enviado em até 2 dias úteis."],
  ["Uma reunião só, de cerca de 2 horas: diagnóstico e plano de ação na mesma conversa", "Duas reuniões de cerca de 1 hora: diagnóstico na primeira, plano de ação na segunda",
   "Outro formato (comente)"],
  logica="Minha recomendação: depende de como vocês combinaram com o Lennon. Duas reuniões dão tempo de preparar o plano entre elas e criam um segundo contato com o cliente; uma só é mais simples de agendar.",
  cits=[ATA("Nós vamos fazer uma reunião de diagnóstico para cada um dos respectivos clientes dos nossos parceiros. Em vez de 40 minutos, agora vamos fazer de cerca de 2 horas cada.")],
  visual=V["diag"])

Q("diag_entrega", B, "O que o cliente leva da reunião, e quando?", "escolha",
  ["Hoje: mapa próprio da reunião, num modelo da Wise, enviado em até 2 dias úteis (FO-11), e acesso ao Wise Hub.",
   "Agora você falou em diagnóstico com plano de ação."],
  ["Diagnóstico e plano de ação num documento da Wise, enviado em até 2 dias úteis", "O plano de ação é montado e entregue na própria reunião",
   "Diagnóstico e plano de ação em até 5 dias úteis", "Outro (comente)"],
  logica="Minha recomendação: a primeira. Mantém o prazo que você já tinha definido e garante um documento com a marca da Wise e do parceiro.")

Q("diag_quem", B, "Quem conduz as reuniões de 2 horas, e qual é o limite?", "escolha",
  ["Hoje: o Gerente conduz até 10 reuniões por semana e o que passar disso vai para um consultor da Wise. Com reuniões de 2 horas, 10 por semana viram 20 horas, metade da semana."],
  ["O Gerente conduz até 5 por semana (10 horas); o que passar vai para um consultor", "O Gerente mantém até 10 por semana (20 horas); o que passar vai para um consultor",
   "Os consultores da Wise conduzem todas; o Gerente só acompanha", "Outro limite (comente)"],
  logica="Minha recomendação: a primeira. Com a fila de candidatos, as conversas de entrada de 45 minutos e o resto do programa, 20 horas de diagnóstico por semana não cabem na agenda de uma pessoa.",
  cits=[TOBE("P-95", "Reunião pela Matriz 5x5 conduzida pelo Gerente (acima de 10 reuniões por semana, um consultor da Wise assume).")], visual=V["agenda"])

Q("diag_icp", B, "Quem recebe a reunião de 2 horas?", "escolha",
  ["Hoje: empresa com mais de 3 vendedores (com faturamento mínimo opcional) recebe a reunião; as demais fazem o autodiagnóstico na hora e recebem o link do Wise Hub e um e-mail com o resultado.",
   "Cada reunião passou a custar cerca de 2 horas da Wise. O corte define quantas reuniões a campanha vai gerar."],
  ["Mantém o corte: mais de 3 vendedores; abaixo disso, autodiagnóstico", "Sobe o corte (comente para quantos vendedores ou qual faturamento)",
   "Todo cliente do parceiro recebe a reunião, sem corte"],
  logica="Minha recomendação: manter por enquanto e rever com os números do primeiro mês. O corte já está configurável em Configurações, sem mexer no portal.")

Q("diag_matriz", B, "A reunião de 2 horas continua usando a Matriz 5x5?", "escolha",
  "A Matriz 5x5 (cinco pilares, cinco afirmações em cada, nota de 1 a 5) é a base do autodiagnóstico na página e da reunião hoje. O portal calcula o resultado sozinho.",
  ["Sim, a Matriz 5x5 é a base, e a reunião aprofunda cada pilar", "A reunião usa outro roteiro (comente qual)", "A Matriz fica só no autodiagnóstico"],
  logica="Minha recomendação: a primeira. Mantém um resultado comparável entre todos os clientes e permite o raio-x agregado da base do parceiro.")

Q("valor_onde", C, "Onde aparece o valor de referência de R$ 1.500 a R$ 2.000?", "multipla",
  ["Você pediu para deixar claro, onde for oportuno e especialmente na landing page, que um diagnóstico com plano de ação como esse custaria de R$ 1.500 a R$ 2.000 direto com a Wise, e que para o cliente do parceiro é sem custo.",
   "Marque todos os lugares onde o valor deve aparecer."],
  ["Página do cliente do parceiro, no topo e na oferta", "Página do cliente, no quadro de comparação (sozinho, contratando à parte, incluído pelo parceiro)",
   "Página dos parceiros, no que o parceiro passa a oferecer", "Mensagem pronta que o parceiro manda aos clientes", "Conversa de entrada com o candidato a parceiro",
   "E-mail de confirmação da reunião"],
  logica="Minha recomendação: as duas da página do cliente, a página dos parceiros e a mensagem pronta. O valor é o que faz o cliente levar a reunião a sério e o que faz o parceiro perceber o tamanho do benefício.",
  cits=[ATA("o cliente dos parceiros vai ver que uma consultoria dessa, ou melhor, um diagnóstico desse com um plano de ação, custaria, caso fosse feito diretamente com a Wise, cerca de R$1.500 a R$2.000, e isso vai ser feito sem custo para os clientes do parceiro.")])

Q("valor_conflito", C, "Como fica o valor do diagnóstico que já aparece no quadro do Wise Hub?", "escolha",
  ["As duas páginas já mostram o quadro de valor do Wise Hub, com os preços da página do Hub. Dois itens se sobrepõem ao valor novo: 'Diagnóstico de maturidade comercial', R$ 1.400, e 'Reunião individual com a equipe da Wise', R$ 5.000.",
   "Se o cliente lê R$ 1.400 num lugar e R$ 1.500 a R$ 2.000 em outro para o que parece a mesma coisa, o número perde credibilidade."],
  ["A reunião de 2 horas com plano de ação (R$ 1.500 a R$ 2.000) substitui os dois itens no quadro; o resto do Hub continua",
   "Os dois itens continuam, e a reunião de 2 horas aparece separada, como a entrega principal", "Outro ajuste (comente)"],
  logica="Minha recomendação: a primeira. Um valor só para o diagnóstico, e o quadro do Hub continua mostrando o resto (imersão, plano de 90 dias, ferramentas).",
  visual=V["valores"])

Q("valor_texto", C, "Esta frase pode ir para a página do cliente?", "escolha",
  "Proposta de texto, no tom da página: \"Um diagnóstico comercial com plano de ação, como este, custa de R$ 1.500 a R$ 2.000 contratado direto com a Wise Makers. Pra quem é cliente da [Parceiro], sai sem custo.\"",
  ["Sim, como está", "Sim, com ajustes (comente)"])

Q("cases_nomes", D, "Os cases aparecem com o nome das empresas?", "escolha",
  ["A página de cases que você mandou tem a opção 'Ocultar nomes' e não mostra valores em reais, só o crescimento percentual. Isso sugere que alguns clientes podem não ter autorizado o nome em público.",
   "Hoje as páginas mostram três depoimentos em vídeo com nome (Grupo Protectpool, Fusion Alumínios e Cristal Móveis), que já são públicos."],
  ["Com nome e segmento, os 8: todos autorizaram", "Com nome só os que já têm depoimento público; os outros só com o segmento",
   "Só com o segmento, sem nenhum nome", "Não sei: confirmar com cada cliente antes"],
  logica="Minha recomendação: a segunda, até cada cliente confirmar por escrito. Nome em página de anúncio pago é uso de marca do cliente.",
  cits=[CASES("Cada case compara os meses de trabalho com os mesmos meses do ano anterior à nossa entrada, sem expor valores em reais.")], visual=V["cases"])

Q("cases_numero", D, "Qual número de resultado vai em destaque?", "escolha",
  ["Os 8 cases da página, comparando os meses com a Wise com os mesmos meses do ano anterior: Florart's Decor +89,4%, Maringá Portas +43,8%, Chamego Bandeiras +39,7%, Fusion Alumínios +25,7%, Totonho Locações +25,4%, Protectpool +20,8%, Powerfit +19,9% e Nicopel +16,5%.",
   "Resumo: 8 de 8 cresceram; mediana de +25,5%; média de +35,1% (puxada pelo +89,4%); 91 de 113 meses acima do ano anterior; 5 bateram recorde de faturamento.",
   "As páginas hoje mostram outros números para os mesmos clientes: Protectpool '+54,83% em julho, mês recorde' e Fusion '+30% em 8 meses'. São recortes diferentes (um mês, outro período), e quem compara pode estranhar."],
  ["'As 8 empresas cresceram; metade cresceu mais de 25%', com a lista dos 8 e o período de cada um",
   "A média: '+35% em média'", "O maior resultado: 'até +89%'", "Outro (comente)"],
  logica="Minha recomendação: a primeira, e trocar os números dos depoimentos atuais pelos do período da página de cases. A mediana é o número que um cliente comum pode esperar; a média e o máximo prometem mais do que a maioria entrega.")

Q("cases_onde", D, "Onde os cases entram?", "multipla",
  "Você disse que o percentual de crescimento é o parâmetro mais importante, tanto para o parceiro quanto para o cliente dele.",
  ["Página do cliente do parceiro", "Página dos parceiros", "Minicurso do parceiro", "Kit do parceiro no portal, para ele usar com os clientes", "Conversa de entrada com o candidato a parceiro",
   "Mapa ou plano de ação entregue depois do diagnóstico"],
  logica="Minha recomendação: as duas páginas, o kit e a conversa de entrada. O caso certo no momento certo faz o parceiro indicar e o cliente marcar a reunião.",
  cits=[ATA("o percentual de retorno ou de crescimento das empresas é um dos parâmetros mais importantes, ou se não o parâmetro mais importante, seja para o parceiro que também para o cliente dele")])

Q("cases_atualizar", D, "Quem atualiza os cases, e de quanto em quanto tempo?", "escolha",
  "Hoje nenhum processo cuida dos cases: eles estão escritos direto no código das páginas. A página de cases que você mandou é atualizada mês a mês com as planilhas dos clientes.",
  ["O Gerente atualiza nas páginas e no kit a cada trimestre, a partir da página de cases", "Quem mantém a página de cases avisa o Gerente quando muda",
   "Os números vêm da página de cases automaticamente, sem ninguém copiar"],
  logica="Minha recomendação: a primeira agora, como passo novo no processo 11.2 (kit e simulador), e a terceira quando der para ligar as duas páginas.")

Q("todos_parceiros", E, "O diagnóstico de 2 horas vale para os clientes de todos os parceiros?", "escolha",
  ["Você disse que o programa mais robusto vai ser apresentado à PluggMe e a todos os próximos parceiros. Pela escada aprovada, a consultoria gratuita aos clientes da carteira é benefício de todo parceiro, desde o Select."],
  ["Sim, de todos os parceiros, desde o Select", "Só de Premium e Elite; o Select oferece o autodiagnóstico e o Wise Hub", "Só dos parceiros escolhidos pelo Igor, como a PluggMe"],
  logica="Minha recomendação: a primeira, que é o que a página dos parceiros já promete. O limite fica no corte do ICP e na agenda, não no nível do parceiro.",
  cits=[ATA("Nós vamos apresentar para ele e também agora para todos os próximos parceiros um programa de consultoria um pouco mais robusto.")])

Q("link_confirma", E, "O caminho do parceiro até o cliente é este?", "escolha",
  ["Como está hoje: o parceiro entra no portal com o login dele; na tela Indicar, copia o link exclusivo (partners.wisemakers.com.br/c/código) e a mensagem pronta; o cliente abre a página com as duas marcas, que explica a consultoria gratuita, se cadastra e marca a reunião ou faz o autodiagnóstico; o parceiro acompanha no portal quem entrou.",
   "O link registra a origem por 180 dias e é o que garante a comissão."],
  ["Sim, é isso", "É isso, com ajustes (comente)"])

Q("pluggme", E, "O que mais mudou na reunião com o Lennon (PluggMe)?", "texto",
  "Qualquer combinado que ainda não apareceu aqui: algo específico para a PluggMe, prazos, materiais que ele pediu, como ele vai apresentar aos clientes dele, ou o que ele achou do programa.",
  placeholder="Escreva aqui")

json.dump(ITENS, open(BASE + "/ferramentas/fo15_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Processos depois da PluggMe</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo20_itens', META = 'respostas/FO-20', CHAVE = 'fo20-rascunho';",
             "'O que a skill diz (' + it.citacoes.length + ' trechos)'": "'De onde vem (' + it.citacoes.length + (it.citacoes.length > 1 ? ' fontes)' : ' fonte)')"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + """<header>
    <p class="eyebrow">FO-15 · Processos do Wise Partners</p>
    <h1>O que muda depois da reunião com a PluggMe</h1>
    <p class="lead">Quatro mudanças que você trouxe: diretores e consultores usando o portal, o diagnóstico de cerca de 2 horas com plano de ação, o valor de referência de R$ 1.500 a R$ 2.000 e os cases com o crescimento de cada empresa. Cada pergunta mostra como está no mapa aprovado (v10) e o que muda. As respostas são salvas enquanto você marca.</p>
  </header>""" + pagina[j:]
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas,", sum(1 for x in ITENS if x["visual"]), "com visual")
