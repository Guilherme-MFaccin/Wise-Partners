# Gera a página do FO-02 (decisões do to-be v2) com contexto, lógica, citações e um visual por pergunta.
import json, html, re
T = json.load(open("/home/user/mapeamentos/wise-partners-to-be/mapa.json"))
EV = {e["id"]: e for e in T["evidencias"]}
FO = next(f for f in T["formularios"] if f["titulo"].startswith("Rodada 2"))
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"
esc = html.escape

# ------------------------------------------------------------ pequenos geradores de SVG (cores pelos tokens do tema)
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
def svg(w, h, corpo, titulo):
    return (f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{esc(titulo)}" style="min-width:{min(w, 560)}px">'
            '<defs><marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pt"/></marker></defs>'
            + corpo + "</svg>")

V = {}
# 1. hierarquia
c = [txt(10, 22, "Gestão", 12, bold=True), box(90, 6, 250, 34, ["1 Arquitetar o ecossistema"]), box(352, 6, 250, 34, ["2 Gerir o programa por rituais"]),
     txt(10, 82, "Finalísticos", 12, bold=True)]
nomes = [["3 Atrair e", "selecionar"], ["4 Integrar e", "ativar"], ["5 Gerar", "oportunidades"], ["6 Desenvolver o", "parceiro"], ["7 Reter ou", "encerrar"]]
for i, n in enumerate(nomes):
    x = 90 + i * 104
    c.append(box(x, 58, 96, 48, n, "b hi" if i == 2 else "b", 12))
    if i < 4: c.append(seta(x + 96, 82, x + 104, 82))
c += [txt(10, 146, "Suporte", 12, bold=True)]
for i, n in enumerate([["8 Prateleira"], ["9 Conteúdos e", "capacitação"], ["10 Dados e", "privacidade"], ["11 Ecossistema", "interno"], ["12 Portal e", "contratos"]]):
    c.append(box(90 + i * 104, 124, 96, 44, n, "b2", 11))
c.append(txt(90, 194, "No centro, a oportunidade compartilhada (5). Em volta, a jornada do parceiro (3, 4, 6 e 7).", 12))
V["hap"] = svg(620, 206, "".join(c), "Hierarquia em 12 macroprocessos")
# 2. interação central
c = []
for i, n in enumerate(["Indicação por link", "Prateleira de RFP", "Cruzamento de carteiras", "Base Ativa"]):
    y = 10 + i * 50
    c += [box(10, y, 170, 38, [n]), seta(180, y + 19, 262, 105)]
c += [f'<circle cx="320" cy="105" r="58" class="b hi"/>', txt(320, 100, "Oportunidade", 13, "middle", "tx", True), txt(320, 117, "compartilhada", 13, "middle", "tx", True),
      seta(378, 105, 418, 105), box(420, 82, 180, 46, ["Quem vende (dono da conta)", "primeiro contato em 2 d.u."], "b", 12),
      seta(510, 128, 510, 160), box(420, 162, 180, 40, ["Cliente fechado e comissão"], "b2", 12),
      f'<path d="M420,182 C330,230 200,230 120,206" class="ln dash" fill="none" marker-end="url(#ponta)"/>', txt(250, 232, "o resultado volta ao portal e ao parceiro", 12, "middle")]
V["interacao"] = svg(620, 244, "".join(c), "Quatro portas para a mesma oportunidade")
# 3. rede de valor
c = [box(230, 6, 180, 40, ["Indústrias (clientes)"], "b", 13, True), box(230, 196, 180, 40, ["Parceiros que dão acesso", "(fornecedores)"], "b", 12),
     box(10, 100, 190, 44, ["Concorrentes: outras consultorias,", "programas de canal dos ERPs"], "b2", 11), box(440, 100, 190, 44, ["Complementadores: softwares", "e entidades da indústria"], "b2", 11),
     f'<circle cx="320" cy="122" r="44" class="b hi"/>', txt(320, 126, "Grupo Wise", 13, "middle", "tx", True),
     seta(320, 78, 320, 48), seta(320, 166, 320, 194), seta(276, 122, 202, 122), seta(364, 122, 438, 122),
     txt(320, 258, "O mesmo ERP pode ser complementador num escopo e concorrente em outro: o papel é registrado por escopo.", 12, "middle")]
V["rede"] = svg(640, 270, "".join(c), "Rede de valor do grupo")
# 4. arquitetura de valor
cols = ["Prateleira", "Indicações e cruzamento", "Base Ativa e comunidade", "Consultoria do grupo", "Regras, SLA e dados"]
rows = ["Descobrir quem resolve", "Comparar e decidir", "Implantar integrado", "Pertencer e aprender", "Confiar"]
cheio = {(0, 0), (0, 1), (1, 0), (2, 1), (2, 3), (3, 2), (4, 4), (4, 3)}
c = []
for j, n in enumerate(cols):
    c.append(txt(230 + j * 88, 30, n.split(" ")[0], 11, "middle", "tx", True)); c.append(txt(230 + j * 88, 44, " ".join(n.split(" ")[1:]), 10, "middle"))
for i, n in enumerate(rows):
    y = 64 + i * 34
    c += [txt(10, y + 5, n, 12, "start", "tx"), f'<line x1="10" y1="{y + 16}" x2="660" y2="{y + 16}" class="ln fino"/>']
    for j in range(len(cols)):
        c.append(f'<circle cx="{230 + j * 88}" cy="{y}" r="{9 if (i, j) in cheio else 4}" class="{"pt" if (i, j) in cheio else "vazio"}"/>')
c.append(txt(10, 246, "Ponto cheio: o pilar entrega o elemento. Onde a linha fica vazia, vale recrutar ou criar uma porta nova. (proposta ilustrativa)", 11))
V["arquitetura"] = svg(670, 256, "".join(c), "Matriz de elementos de valor por pilar")
# 5. comissão sobre o LTV
meses = [6, 12, 18, 24, 36]
c = [f'<rect x="60" y="{230 - 15 * 13}" width="560" height="{10 * 13}" class="faixa"/>', txt(616, 230 - 15 * 13 + 14, "5 a 15%: faixa citada para quem só gera lead (exemplo de varejo digital)", 11, "end")]
for v in (0, 5, 10, 15):
    y = 230 - v * 13
    c += [f'<line x1="56" y1="{y}" x2="620" y2="{y}" class="ln fino"/>', txt(50, y + 4, f"{v}%", 11, "end")]
for i, m in enumerate(meses):
    x = 90 + i * 108; tot = 50 / m; par = 40 / m
    c += [f'<rect x="{x}" y="{230 - tot * 13:.1f}" width="34" height="{tot * 13:.1f}" class="barra1"/>', f'<rect x="{x + 38}" y="{230 - par * 13:.1f}" width="34" height="{par * 13:.1f}" class="barra2"/>',
          txt(x + 17, 230 - tot * 13 - 5, f"{tot:.1f}%".replace(".", ","), 11, "middle", "tx"), txt(x + 55, 230 - par * 13 - 5, f"{par:.1f}%".replace(".", ","), 11, "middle", "tx"),
          txt(x + 36, 248, f"{m} meses", 11, "middle")]
c += [f'<rect x="60" y="262" width="12" height="12" class="barra1"/>', txt(78, 272, "Total (40% ao parceiro + 10% ao Gerente) sobre o LTV", 11),
      f'<rect x="370" y="262" width="12" height="12" class="barra2"/>', txt(388, 272, "Só o parceiro (40% de uma mensalidade)", 11),
      txt(60, 292, "Eixo de baixo: quanto tempo o cliente fica. Swallow: 6% + 2% do projeto = 8% do valor do projeto.", 11)]
V["ltv"] = svg(630, 300, "".join(c), "Comissão como porcentagem do LTV")
# 6. quadros: antes e depois
c = [txt(10, 18, "Antes: 8 funis, o mesmo parceiro em vários", 12, bold=True, cls="tx")]
for i in range(8):
    x = 10 + i * 36
    c.append(f'<rect x="{x}" y="28" width="30" height="120" rx="4" class="b2"/>')
    for k in range(1 + (i * 3) % 4):
        c.append(f'<rect x="{x + 4}" y="{34 + k * 26}" width="22" height="20" rx="3" class="card"/>')
c += [txt(330, 18, "Depois: dois quadros, uma fila, uma agenda", 12, bold=True, cls="tx"),
      box(330, 28, 300, 40, ["Quadro da jornada: 1 card por parceiro", "(marcos de 30, 60, 90 e 120 dias dentro do card)"], "b hi", 11),
      box(330, 74, 300, 34, ["Quadro de oportunidades: 1 card por oportunidade"], "b", 11),
      box(330, 114, 145, 34, ["Fila de exceções"], "b2", 11), box(485, 114, 145, 34, ["Agenda de rituais"], "b2", 11),
      txt(10, 172, "Os 8 funis aprovados viram visões filtradas dos dois quadros; o que segue a regra não gera card nem tarefa.", 12)]
V["quadros"] = svg(640, 184, "".join(c), "Antes e depois dos quadros")
# 7. pirâmide de atenção
c = ['<polygon points="200,10 250,70 150,70" class="b hi"/>', '<polygon points="150,74 250,74 300,134 100,134" class="b"/>', '<polygon points="100,138 300,138 360,206 40,206" class="b2"/>',
     txt(200, 58, "~5%", 12, "middle", "tx", True), txt(200, 110, "~15%", 12, "middle", "tx", True), txt(200, 178, "~80%", 12, "middle", "tx", True),
     txt(380, 44, "Crescem sozinhos: cadência humana", 12, cls="tx"), txt(380, 108, "Crescem se ajudados: cadência humana", 12, cls="tx"),
     txt(380, 176, "Demais: portal, comunidade e regras", 12, cls="tx"), txt(380, 192, "(só a exceção vira tarefa)", 11),
     txt(40, 230, "Proporções de Bech como princípio, não como número: com poucos parceiros, a mesa mensal decide quem é gerenciado.", 11)]
V["piramide"] = svg(660, 240, "".join(c), "Pirâmide de atenção")
# 8. rituais
linhas = [("Diário", "Fila de exceções: SLA vencendo, marco atrasado, risco, pedido parado", 20),
          ("Semanal", "Terça: revisão com o Diretor e 3 perguntas na reunião comercial do grupo", 4),
          ("Mensal", "Mesa do portfólio e revisões com os destaques; comunicado na comunidade", 1),
          ("Trimestral", "Níveis, saúde, satisfação, ranking e revisões conjuntas com todos os ativos", 1),
          ("Anual", "Arquitetar o ecossistema: papel, valor, perfil ideal, regras, fase", 1)]
c = []
for i, (n, t, k) in enumerate(linhas):
    y = 20 + i * 44
    c += [txt(10, y + 5, n, 12, cls="tx", bold=True), txt(110, y + 22, t, 11)]
    for j in range(min(k, 20)):
        c.append(f'<circle cx="{116 + j * 24}" cy="{y}" r="5" class="pt"/>')
V["rituais"] = svg(620, 236, "".join(c), "Agenda de rituais")
# 9. saúde e tipos
c = [txt(10, 18, "Saúde em três fatores (trimestral)", 12, cls="tx", bold=True)]
for i, (n, v) in enumerate([("Qualidade da parceria", 0.7), ("Inovação colaborativa", 0.45), ("Criação de valor", 0.3)]):
    y = 32 + i * 30
    c += [txt(10, y + 13, n, 11), f'<rect x="160" y="{y}" width="160" height="16" rx="4" class="b2"/>', f'<rect x="160" y="{y}" width="{160 * v}" height="16" rx="4" class="barra1"/>']
c.append(txt(340, 18, "Oito tipos, cada um com uma jogada", 12, cls="tx", bold=True))
tipos = ["Evangelistas", "Pragmáticos estáveis", "Adolescentes rebeldes", "Pessimistas em evolução", "Tubarões cativos", "Catadores de cerejas", "Sem condições", "Desertores"]
for i, t in enumerate(tipos):
    c.append(box(340 + (i % 2) * 150, 28 + (i // 2) * 34, 144, 28, [t], "b", 11))
c.append(txt(10, 148, "Exemplo ilustrativo. Os tipos mudam com o comportamento.", 11))
V["saude"] = svg(640, 170, "".join(c), "Saúde e tipos de parceria")
# 10. recrutamento
etapas = [["Lista", "(tabela, sem card)"], ["Primeira", "reunião: vira card"], ["Qualificar: scorecard,", "ficha de jogo, sobreposição"], ["Workshop: caso de", "negócio do parceiro"], ["Texto único", "e assinatura"]]
c = []
for i, e in enumerate(etapas):
    x = 10 + i * 128; w = 118
    c.append(box(x, 20 + i * 6, w, 64 - i * 6 * 2 + 30, e, "b hi" if i == 3 else "b", 11))
    if i < 4: c.append(seta(x + w, 67, x + 128, 67))
c.append(txt(10, 150, "A lista não ocupa o quadro. Cada etapa filtra antes de gastar mais horas.", 12))
V["recrutamento"] = svg(650, 162, "".join(c), "Etapas do recrutamento")
# 11. texto único
c = [box(10, 60, 130, 44, ["Termo-quadro", "preenchido"]), seta(140, 82, 180, 82), box(182, 60, 130, 44, ["Rascunho pedindo", "críticas"], "b hi"),
     seta(312, 82, 352, 82), box(354, 60, 130, 44, ["Críticas do", "candidato"]), f'<path d="M419,104 C419,150 247,150 247,106" class="ln dash" fill="none" marker-end="url(#ponta)"/>',
     txt(333, 150, "revisar até não melhorar", 11, "middle"), seta(484, 82, 520, 82), box(522, 46, 120, 34, ["Dentro do gatilho?"], "b2", 11),
     box(522, 90, 120, 44, ["Diretor:", "sim ou não"], "b hi", 12, True)]
V["texto_unico"] = svg(650, 168, "".join(c), "Ciclo do texto único")
# 12. comunidade
c = [f'<circle cx="320" cy="110" r="62" class="b hi"/>', txt(320, 104, "Comunidade", 13, "middle", "tx", True), txt(320, 121, "Wise Partners", 13, "middle", "tx", True)]
for (x, y, t) in [(80, 30, ["Comunicado do mês"]), (480, 30, ["Troca entre", "parceiros"]), (40, 160, ["Mentoria e", "eventos"]), (500, 160, ["Reconhecimento", "público"]), (250, 196, ["Um grupo por parceiro"])]:
    c += [box(x, y, 140, 40, t, "b", 12), seta(x + 70 if y > 150 else x + 70, y if y > 150 else y + 40, 320 + (-40 if x < 300 else 40), 110 + (40 if y > 150 else -40))]
V["comunidade"] = svg(660, 244, "".join(c), "A comunidade como processo")
# 13. fases
c = []
for i, (n, m) in enumerate([("Experimentação", ["ativação, liquidez,", "qualidade, confiança"]), ("Tração", ["receita atribuída,", "parceiros ativos"]), ("Crescimento", ["valor criado para", "todos os lados"])]):
    x = 10 + i * 210
    c += [box(x, 30, 180, 44, [n], "b hi" if i == 0 else "b", 13, True), txt(x + 90, 96, m[0], 11, "middle"), txt(x + 90, 111, m[1], 11, "middle")]
    if i < 2: c += [seta(x + 180, 52, x + 210, 52), txt(x + 195, 22, "portão", 10, "middle")]
c.append(txt(10, 142, "Os três pilares ficam abertos desde o início; o portão controla o ritmo de escala, não a abertura dos pilares.", 11))
V["fases"] = svg(640, 154, "".join(c), "Fases e portões")
# 14. ecossistema interno
c = [box(220, 6, 200, 36, ["Oportunidade vinda de parceiro"], "b hi", 12), txt(320, 62, "uma receita só", 12, "middle", "tx", True)]
for i, n in enumerate(["Wise Makers", "Tríade", "Swallow"]):
    x = 40 + i * 200; c += [seta(320, 42, x + 80, 76), box(x, 78, 160, 36, [n], "b", 13, True)]
for i, n in enumerate(["Briefing de uma página", "Primeiro contato em 2 dias úteis", "Crédito integral na meta de quem fecha"]):
    c.append(box(40 + i * 200, 130, 160, 40, [n], "b2", 11))
V["interno"] = svg(640, 182, "".join(c), "Ecossistema interno do grupo")
# 15. monetização
c = [box(10, 70, 150, 44, ["Grupo Wise"], "b hi", 13, True), box(470, 70, 160, 44, ["Parceiro"], "b", 13, True), box(240, 160, 160, 40, ["Indústria"], "b2", 13, True),
     seta(160, 84, 468, 84), txt(315, 76, "comissão por resultado (hoje)", 12, "middle", "tx"),
     seta(468, 104, 162, 104, True), txt(315, 124, "opções futuras: contrapartida, taxa de sucesso, serviços", 11, "middle"),
     seta(320, 160, 100, 116), seta(320, 160, 540, 116), txt(320, 20, "Nada é cobrado na entrada", 12, "middle", "tx", True)]
V["monetizacao"] = svg(640, 214, "".join(c), "Fluxos de valor e de dinheiro")
# 16. retenção
pts = [("Em risco", 10), ("1ª tentativa:", 120), ("15 dias", 230), ("2ª tentativa:", 320), ("30 dias", 430), ("Diretor:", 520)]
c = [f'<line x1="20" y1="60" x2="620" y2="60" class="ln"/>']
for (t, x), sub in zip(pts, ["", "oportunidade concreta", "", "por telefone", "", "sim ou não"]):
    c += [f'<circle cx="{x + 20}" cy="60" r="7" class="pt"/>', txt(x + 20, 40, t, 12, "middle", "tx", True)]
    if sub: c.append(txt(x + 20, 86, sub, 11, "middle"))
c.append(txt(20, 120, "Depois do sim: aviso formal de 30 dias, em conversa e por escrito, e encerramento sem atrito para o cliente.", 11))
V["retencao"] = svg(640, 132, "".join(c), "Linha do tempo da retomada")

# ------------------------------------------------------------ itens da página
itens = []
for qid in FO["perguntas"]:
    q = next(x for x in T["perguntas"] if x["id"] == qid)
    cits = []
    for e in q.get("citacoes", []):
        ev = EV[e]; fonte = ev["fonte"].split(" (")[0].split(":")[0]
        pag = ev["local"].split(" (")[0].replace("secao", "seção")
        cits.append({"livro": fonte, "pagina": pag, "trecho": ev["trecho"]})
    itens.append({"id": "R2-" + qid, "bloco": q["bloco"], "texto": q["texto"], "tipo": q["tipo"], "opcoes": q["opcoes"],
                  "contexto": q["contexto"], "logica": q["logica"], "citacoes": cits, "visual": V[q["visual"]]})
json.dump(itens, open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo02_itens.json", "w"), ensure_ascii=False, indent=1)

# ------------------------------------------------------------ página
pagina = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo02_modelo.html", encoding="utf-8").read()
dados = json.dumps(itens, ensure_ascii=False).replace("</", "<\\/")
pagina = pagina.replace("__DADOS__", dados).replace("__TOTAL__", str(len(itens)))
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(itens), "perguntas na página")
