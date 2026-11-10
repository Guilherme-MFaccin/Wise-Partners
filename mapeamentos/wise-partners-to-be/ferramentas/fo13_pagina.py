# FO-13: revisão completa da hierarquia e da arquitetura de processos (HAP) do to-be v8.
# Uma pergunta para a cadeia de valor, uma para as duas jornadas e uma para cada macroprocesso, processo, subprocesso e atividade.
# Tudo sai do mapa.json; o desenho de cada fluxo usa o mesmo layout do mapa interativo.
import json, html, os, re, sys, textwrap
sys.path.insert(0, "/home/user/.claude/skills/mapear-processos/scripts")
import mapa as M

BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-13/formulario.html"
d = json.load(open(BASE + "/mapa.json"))
v7 = json.load(open("/tmp/claude-0/-home-user/d87b95a2-e40c-5eb4-8a52-da1d4f24f10a/scratchpad/mapa-v7.json"))
COD = M.calcular_codigos(d)
PROCS, FILHOS = M.arvore(d)
P7 = {p["id"]: p for p in v7["processos"]}
PAP = {x["id"]: x["nome"] for x in d["papeis"]}
SIS = {x["id"]: x["nome"] for x in d["sistemas"]}
EV = {x["id"]: x for x in d["evidencias"]}
FAT = {x["id"]: x for x in d["fatos"]}
ITENS = []

def esc(t): return html.escape(str(t), quote=True)
def wrap(t, n): return textwrap.wrap(str(t), n, break_long_words=False) or [""]
def nomep(pid): return f"{COD.get(pid, '?')} {PROCS[pid]['nome']}" if pid in PROCS else str(pid)
def papel(x): return PAP.get(x, x)

def tl(x, y, linhas, fs=11, anchor="middle", cls="tx", bold=False, dy=None):
    dy = dy or fs + 3
    y0 = y - (len(linhas) - 1) * dy / 2 + fs / 3
    return "".join(f'<text x="{x:.0f}" y="{y0 + i * dy:.1f}" font-size="{fs}" text-anchor="{anchor}" class="{cls}"{" font-weight=\"600\"" if bold else ""}>{esc(l)}</text>'
                   for i, l in enumerate(linhas))

def svg(w, h, corpo, titulo, minw=None):
    return (f'<svg viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{esc(titulo)}" style="min-width:{min(w, minw or 560):.0f}px">'
            '<defs><marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pt"/></marker></defs>'
            + corpo + "</svg>")

# ---------------------------------------------------------------- desenho do fluxo (mesmo layout do mapa interativo)
def desenho_fluxo(p):
    lay = M.layout_fluxo(d, p)
    o = []
    for xid, bx in lay["externos"].items():
        o.append(f'<rect x="{bx["x"]}" y="{bx["y"]}" width="{bx["w"]}" height="{bx["h"]}" rx="6" class="b2"/>')
        o.append(tl(bx["x"] + 14, bx["y"] + bx["h"] / 2, [bx["nome"]], 13, "start", "mu", True))
    for r in lay["raias"]:
        o.append(f'<rect x="0" y="{r["y"]}" width="{r["x"] + r["w"]}" height="{r["h"]}" class="b2"/>')
        o.append(f'<line x1="{r["x"]}" y1="{r["y"]}" x2="{r["x"]}" y2="{r["y"] + r["h"]}" class="ln fino"/>')
        cx, cy = r["x"] / 2, r["y"] + r["h"] / 2
        nome = r["nome"] if len(r["nome"]) * 7 < r["h"] - 10 else r["nome"][: max(4, int((r["h"] - 10) / 7) - 1)] + "."
        o.append(f'<text x="{cx}" y="{cy}" font-size="12" text-anchor="middle" class="mu" font-weight="600" transform="rotate(-90 {cx} {cy})" dominant-baseline="middle">{esc(nome)}</text>')
    for a in lay["arestas"]:
        pts = " ".join(f"{x},{y}" for x, y in a["pts"])
        o.append(f'<polyline points="{pts}" fill="none" class="ln" marker-end="url(#ponta)"/>')
        if a.get("rotulo"):
            o.append(f'<text x="{a["lbl"][0]}" y="{a["lbl"][1]}" font-size="11" class="tx" font-weight="600">{esc(a["rotulo"])}</text>')
    for m in lay["mensagens"]:
        pts = " ".join(f"{x},{y}" for x, y in m["pts"])
        o.append(f'<polyline points="{pts}" fill="none" class="ln dash" marker-end="url(#ponta)"/>')
        if m.get("rotulo"):
            o.append(f'<text x="{m["lbl"][0]}" y="{m["lbl"][1]}" font-size="10" class="mu">{esc(m["rotulo"])}</text>')
    nos = lay["nos"]
    for k, ps in lay["pos"].items():
        n = nos[k]; t = n.get("tipo"); x, y, w, h, cx, cy = ps["x"], ps["y"], ps["w"], ps["h"], ps["cx"], ps["cy"]
        if t in ("inicio", "fim", "espera"):
            o.append(f'<circle cx="{cx}" cy="{cy}" r="{w / 2}" class="b{" hi" if t == "fim" else ""}" style="stroke-width:{3 if t == "fim" else 1.4}"/>')
            if t == "espera": o.append(f'<circle cx="{cx}" cy="{cy}" r="{w / 2 - 4}" class="vazio"/>')
            ev = n.get("evento") or n.get("gatilho")
            if ev == "tempo": o.append(f'<line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy - 9}" class="ln"/><line x1="{cx}" y1="{cy}" x2="{cx + 7}" y2="{cy}" class="ln"/>')
            if ev == "mensagem": o.append(f'<rect x="{cx - 8}" y="{cy - 5}" width="16" height="10" class="vazio"/>')
            linhas = wrap(n.get("nome", ""), 22)
            ly = y + h + 8 + (len(linhas) * 14) / 2 if ps.get("rotulo_lado") != "cima" else y - 8 - (len(linhas) * 14) / 2
            o.append(tl(cx, ly, linhas, 11, cls="mu"))
        elif t in ("decisao", "paralelo", "inclusivo"):
            o.append(f'<polygon points="{cx},{y} {x + w},{cy} {cx},{y + h} {x},{cy}" class="b"/>')
            sinal = {"paralelo": "+", "inclusivo": "o"}.get(t, "x")
            o.append(tl(cx, cy, [sinal], 14, cls="mu", bold=True))
            linhas = wrap(n.get("nome", ""), 24)
            ly = y - 8 - (len(linhas) * 14) / 2 if ps.get("rotulo_lado") == "cima" else y + h + 8 + (len(linhas) * 14) / 2
            o.append(tl(cx, ly, linhas, 11))
        else:
            sub = t == "subprocesso"
            o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" class="b{" hi" if sub else ""}"/>')
            if sub: o.append(f'<rect x="{cx - 6}" y="{y + h - 14}" width="12" height="12" class="vazio"/><text x="{cx}" y="{y + h - 4}" font-size="11" text-anchor="middle" class="tx">+</text>')
            if n.get("modo") == "automatico": o.append(f'<text x="{x + 7}" y="{y + 13}" font-size="10" class="mu">auto</text>')
            elif n.get("sistema"): o.append(f'<text x="{x + 7}" y="{y + 13}" font-size="10" class="mu">{esc(SIS.get(n["sistema"], "")[:16])}</text>')
            linhas = wrap(n.get("nome", ""), 19)[:4]
            o.append(tl(cx, cy + (2 if not sub else -3), linhas, 11))
    W, H = lay["largura_total"] + 10, lay["altura_total"] + 50
    return svg(W, H, "".join(o), "Passo a passo de " + p["nome"], minw=W)

# ---------------------------------------------------------------- quadro do processo: recebe, começa, faz, entrega
def desenho_sipoc(p):
    ent = [f"{e['nome']}" + (f" (de {nomep(e['de']) if e['de'] in PROCS else str(e['de']).replace('EXT:', '')})" if e.get("de") else "") for e in p.get("entradas", [])] or ["Nada registrado no mapa"]
    sai = [f"{s['nome']}" + (f" (para {nomep(s['para']) if s['para'] in PROCS else str(s['para']).replace('EXT:', '')})" if s.get("para") else "") for s in p.get("saidas", [])] or ["Nada registrado no mapa"]
    def coluna(itens, n=30):
        lin = []
        for i in itens: lin += wrap(i, n) + [""]
        return lin[:-1]
    le, ls = coluna(ent), coluna(sai)
    quem = [papel(p.get("dono"))] + [papel(x) for x in p.get("participantes", []) if x != p.get("dono")]
    centro = wrap(f"{COD[p['id']]} {p['nome']}", 26)
    meio = centro + [""] + wrap("Dono: " + papel(p.get("dono")), 30) + (wrap("Com: " + ", ".join(quem[1:]), 30) if len(quem) > 1 else []) \
        + (wrap("Sistemas: " + ", ".join(SIS.get(s, s) for s in p.get("sistemas", [])), 30) if p.get("sistemas") else [])
    gat = wrap(p.get("gatilho") or "Sem gatilho", 20)
    h = max(len(le), len(ls), len(meio), len(gat) + 3) * 15 + 56
    o = [f'<text x="10" y="18" font-size="12" class="mu" font-weight="600">Recebe</text>',
         f'<text x="260" y="18" font-size="12" class="mu" font-weight="600">Começa quando</text>',
         f'<text x="420" y="18" font-size="12" class="mu" font-weight="600">O processo</text>',
         f'<text x="700" y="18" font-size="12" class="mu" font-weight="600">Entrega</text>',
         f'<rect x="6" y="28" width="220" height="{h - 36}" rx="8" class="b2"/>', tl(16, 28 + (h - 36) / 2, le, 11, "start"),
         f'<circle cx="320" cy="{28 + (h - 36) / 2}" r="15" class="b"/>',
         tl(320, 28 + (h - 36) / 2 + 26 + (len(gat) - 1) * 7, gat, 11),
         f'<rect x="416" y="28" width="256" height="{h - 36}" rx="10" class="b hi"/>', tl(430, 28 + (h - 36) / 2, meio, 11, "start"),
         f'<rect x="696" y="28" width="230" height="{h - 36}" rx="8" class="b2"/>', tl(706, 28 + (h - 36) / 2, ls, 11, "start"),
         f'<line x1="226" y1="{28 + (h - 36) / 2}" x2="300" y2="{28 + (h - 36) / 2}" class="ln" marker-end="url(#ponta)"/>',
         f'<line x1="340" y1="{28 + (h - 36) / 2}" x2="412" y2="{28 + (h - 36) / 2}" class="ln" marker-end="url(#ponta)"/>',
         f'<line x1="672" y1="{28 + (h - 36) / 2}" x2="692" y2="{28 + (h - 36) / 2}" class="ln" marker-end="url(#ponta)"/>']
    return svg(932, h, "".join(o), "Quadro do processo " + p["nome"])

# ---------------------------------------------------------------- árvore de um processo com filhos
def desenho_arvore(p):
    filhos = FILHOS.get(p["id"], [])
    cols = 3 if len(filhos) > 4 else max(1, len(filhos))
    cw = 300; gap = 14
    cards = []
    for f in filhos:
        lin = wrap(f"{COD[f['id']]} {f['nome']}", 34)
        netos = FILHOS.get(f["id"], [])
        sub = []
        for nt in netos: sub += wrap(f"{COD[nt['id']]} {nt['nome']}", 40)
        marca = "com passo a passo" if f.get("fluxo") else ""
        cards.append((f, lin, sub, marca))
    linhas = [cards[i:i + cols] for i in range(0, len(cards), cols)]
    o = []; y = 80
    topo = wrap(f"{COD[p['id']]} {p['nome']}", 60)
    W = cols * cw + (cols - 1) * gap + 20
    o.append(f'<rect x="10" y="10" width="{W - 20}" height="44" rx="10" class="b hi"/>')
    o.append(tl(W / 2, 32, topo, 14, bold=True))
    o.append(f'<line x1="{W / 2}" y1="54" x2="{W / 2}" y2="70" class="ln"/>')
    for row in linhas:
        hmax = max(16 * (len(c[1]) + len(c[2])) + (16 if c[3] else 0) + 26 for c in row)
        for i, (f, lin, sub, marca) in enumerate(row):
            x = 10 + i * (cw + gap)
            o.append(f'<rect x="{x}" y="{y}" width="{cw}" height="{hmax}" rx="8" class="b"/>')
            for j, l in enumerate(lin):
                o.append(f'<text x="{x + 12}" y="{y + 20 + j * 16}" font-size="12" class="tx" font-weight="600">{esc(l)}</text>')
            yy = y + 20 + len(lin) * 16
            for j, l in enumerate(sub):
                o.append(f'<text x="{x + 20}" y="{yy + j * 16}" font-size="11" class="mu">{esc(l)}</text>')
            if marca: o.append(f'<text x="{x + 12}" y="{y + hmax - 10}" font-size="10" class="mu">{marca}</text>')
        y += hmax + gap
    return svg(W, y, "".join(o), "Processos dentro de " + p["nome"], minw=min(W, 620))

# ---------------------------------------------------------------- cadeia de valor e jornadas
def desenho_cadeia():
    grupos = [("gestao", "Gestão", "direcionam e controlam"), ("finalistico", "Finalísticos", "entregam valor ao parceiro e à indústria"), ("suporte", "Suporte", "dão recursos aos demais")]
    macros = FILHOS.get(None, [])
    o = []; y = 10
    for chave, titulo, sub in grupos:
        ms = [m for m in macros if M.tipo_de(PROCS, m) == chave]
        if not ms: continue
        cols = 3; rows = (len(ms) + cols - 1) // cols
        h = rows * 66 + 14
        o.append(f'<rect x="0" y="{y}" width="760" height="{h}" rx="10" class="b2"/>')
        sl = wrap(sub, 18)
        o.append(tl(12, y + h / 2 - 7 * len(sl), [titulo], 14, "start", bold=True))
        o.append(tl(12, y + h / 2 + 10, sl, 10, "start", "mu"))
        for i, m in enumerate(ms):
            cx = 140 + (i % cols) * 206; cy = y + 8 + (i // cols) * 66
            o.append(f'<rect x="{cx}" y="{cy}" width="198" height="56" rx="8" class="b"/>')
            o.append(tl(cx + 99, cy + 28, wrap(f"{COD[m['id']]} {m['nome']}", 26), 12))
        y += h + 10
    return svg(760, y, "".join(o), "Cadeia de valor do Programa Wise Partners", minw=600)

def desenho_jornadas():
    o = []; y = 10
    for cv in d["cadeias_de_valor"]:
        et = cv["etapas"]
        o.append(tl(4, y + 10, [cv["nome"]], 13, "start", bold=True))
        y += 28
        w = (760 - 70) / max(1, len(et)) - 6
        o.append(f'<circle cx="24" cy="{y + 30}" r="13" class="b"/>')
        o.append(tl(4, y + 62 + 13, wrap("Começa: " + cv["gatilho"], 14), 10, "start", "mu"))
        for i, e in enumerate(et):
            x = 62 + i * (w + 6)
            o.append(f'<polygon points="{x},{y} {x + w - 9},{y} {x + w},{y + 30} {x + w - 9},{y + 60} {x},{y + 60} {x + 9},{y + 30}" class="b{" hi" if e["processos"] else ""}"/>')
            o.append(tl(x + w / 2 + 2, y + 30, wrap(e["nome"], max(9, int((w - 16) / 5.6)))[:5], 10, dy=11.5))
            o.append(tl(x + w / 2, y + 74, [", ".join(COD[pp] for pp in e["processos"]) or "fora do escopo"], 10, cls="mu"))
        vl = wrap("Entrega: " + cv["valor"], 60)
        o.append(tl(760, y + 96 + 6 * (len(vl) - 1), vl, 10, "end", "mu"))
        y += 112 + 13 * len(vl)
    return svg(760, y, "".join(o), "Jornadas de valor", minw=600)

# ---------------------------------------------------------------- textos
def citacoes(p, n=5):
    evs = [EV[e] for e in p.get("evidencias", []) if e in EV]
    evs.sort(key=lambda e: (0 if e["fonte"].startswith(("FO-12", "FO-11", "Pedido")) else 1 if e["tipo"] == "validacao" else 2, e["fonte"]))
    vistos, out = set(), []
    for e in evs:
        if e["fonte"] in vistos and len(evs) > n: continue
        vistos.add(e["fonte"])
        out.append({"livro": e["fonte"], "pagina": e.get("local") or e.get("data", ""), "trecho": e["trecho"][:600]})
        if len(out) >= n: break
    return out

SIT = {"no_papel": "Ainda só no papel: o processo nunca rodou do jeito descrito.", "em_implantacao": "Em implantação: roda em parte.", "rodando": "Já roda assim."}

def mudancas(p):
    a = P7.get(p["id"])
    if not a: return "Processo novo na v8 (09/11), a partir das respostas do FO-12."
    m = []
    if a["nome"] != p["nome"]: m.append(f"antes se chamava \"{a['nome']}\"")
    if a.get("pai") != p.get("pai"): m.append(f"mudou de lugar: estava dentro de {COD.get(a.get('pai'), 'nenhum')} {PROCS.get(a.get('pai'), {}).get('nome', '')}".rstrip())
    if a.get("gatilho") != p.get("gatilho"): m.append(f"o gatilho era \"{a.get('gatilho')}\"")
    if a.get("descricao") != p.get("descricao"): m.append("a descrição foi reescrita")
    if json.dumps(a.get("fluxo"), sort_keys=True) != json.dumps(p.get("fluxo"), sort_keys=True):
        m.append("o passo a passo foi refeito" if a.get("fluxo") and p.get("fluxo") else "ganhou passo a passo" if p.get("fluxo") else "o passo a passo saiu")
    if not m: return "Sem mudança desde a validação da v7 (05/11)."
    return "Mudou na v8 (09/11, FO-11 e FO-12): " + "; ".join(m) + "."

def contexto(p):
    c = [p.get("descricao", "")]
    linha = [f"Dono: {papel(p.get('dono'))}."]
    if p.get("participantes"): linha.append("Participam: " + ", ".join(papel(x) for x in p["participantes"]) + ".")
    linha.append(f"Começa quando: {p.get('gatilho') or 'não definido'}.")
    if p.get("cliente"): linha.append(f"Para quem: {p['cliente']}.")
    if p.get("frequencia"): linha.append(f"Frequência: {p['frequencia']}.")
    c.append(" ".join(linha))
    if p.get("quadro"): c.append(f"Onde aparece no portal: {p['quadro']}.")
    if p.get("regras"): c.append("Regras: " + "; ".join(r if isinstance(r, str) else r.get("texto", "") for r in p["regras"]) + ".")
    if p.get("indicadores"): c.append("Indicadores: " + "; ".join(i if isinstance(i, str) else i.get("nome", "") for i in p["indicadores"]) + ".")
    pr = [FAT[f]["texto"] for f in p.get("principios", []) if f in FAT]
    if pr: c.append("Por que existe: " + " ".join(pr))
    anc = M.ancestrais(PROCS, p)
    if anc: c.append("Fica dentro de: " + " > ".join(nomep(a["id"]) for a in reversed(anc)) + ".")
    c.append(SIT.get(p.get("situacao"), ""))
    return [x for x in c if x]

OP = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo: precisa ser refeito (comente)", "Retirar do mapa (comente)"]

def Q(qid, bloco, texto, contexto_, opcoes, visual, logica="", cits=()):
    ITENS.append({"id": "HAP-" + qid, "bloco": bloco, "texto": texto, "tipo": "escolha", "opcoes": opcoes, "contexto": contexto_,
                  "logica": logica, "citacoes": list(cits), "visual": visual, "placeholder": ""})

# ---------------------------------------------------------------- perguntas
macros = FILHOS.get(None, [])
GERAL = "Visão geral"
Q("cadeia", GERAL, f"A cadeia de valor do programa, com {len(macros)} macroprocessos em gestão, finalísticos e suporte, está certa?",
  ["Os macroprocessos são as grandes frentes do programa. Gestão define e controla; finalísticos entregam valor ao parceiro e à indústria; suporte dá recursos aos demais. Cada um vem com uma pergunta própria mais adiante.",
   "Confira se falta alguma frente, se alguma sobra, e se cada uma está na categoria certa."],
  OP[:3], desenho_cadeia(), "As frentes não mudaram na v8; o que mudou foi o conteúdo de Atrair e selecionar, Integrar e ativar e Desenvolver.")
Q("jornadas", GERAL, "As duas jornadas de valor, do cadastro do parceiro até o crescimento e da necessidade da indústria até o cliente fechado, estão certas?",
  [f"{cv['nome']}: começa em \"{cv['gatilho']}\" e entrega \"{cv['valor']}\"." for cv in d["cadeias_de_valor"]] +
  ["Cada etapa aponta os processos que a executam (os números embaixo de cada seta)."],
  OP[:3], desenho_jornadas(), "Na v8, a jornada do parceiro passou a começar no cadastro pela landing page e a terminar na subida de Select para Premium e Elite.")

def visitar(p, bloco):
    filhos = FILHOS.get(p["id"], [])
    nivel = len(M.ancestrais(PROCS, p)) + 1
    cod = COD[p["id"]]
    vis = []
    if nivel == 1:
        texto = f"O macroprocesso {cod} {p['nome']} está certo, com estes {len(filhos)} processos?"
        vis.append(desenho_arvore(p))
        vis.append(desenho_sipoc(p))
    elif filhos:
        texto = f"O processo {cod} {p['nome']} está certo, com estes {len(filhos)} subprocessos?"
        vis.append(desenho_arvore(p)); vis.append(desenho_sipoc(p))
    elif p.get("fluxo"):
        texto = f"O passo a passo de {cod} {p['nome']} está certo?"
        vis.append(desenho_sipoc(p))
    else:
        texto = f"{cod} {p['nome']}: quem faz, quando começa e o que entrega estão certos?"
        vis.append(desenho_sipoc(p))
    if p.get("fluxo"): vis.append(desenho_fluxo(p))
    Q(p["id"], bloco, texto, contexto(p), OP, "".join(vis), mudancas(p), citacoes(p))
    for f in filhos: visitar(f, bloco)

for m in macros:
    visitar(m, f"{COD[m['id']]} {m['nome']}")

# ---------------------------------------------------------------- página
json.dump(ITENS, open(BASE + "/ferramentas/fo13_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Revisão dos processos</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo18_itens', META = 'respostas/FO-18', CHAVE = 'fo18-rascunho';",
             "'O que a skill diz (' + it.citacoes.length + ' trechos)'": "'De onde vem (' + it.citacoes.length + (it.citacoes.length > 1 ? ' fontes)' : ' fonte)')",
             "el('h3', null, 'A lógica')": "el('h3', null, 'O que mudou')",
             "det.open = true;": "det.open = false;"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
blocos = []
for it in ITENS:
    if not blocos or blocos[-1][0] != it["bloco"]: blocos.append([it["bloco"], it["id"], 0])
    blocos[-1][2] += 1
indice = "".join(f'<li><a href="#c-{esc(i)}">{esc(b)}</a> <span>{n} {"pergunta" if n == 1 else "perguntas"}</span></li>' for b, i, n in blocos)
fluxos = sum(1 for p in PROCS.values() if p.get("fluxo"))
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + f"""<header>
    <p class="eyebrow">FO-13 · Revisão completa do mapeamento</p>
    <h1>Hierarquia e arquitetura de processos do Wise Partners</h1>
    <p class="lead">Uma pergunta para cada um dos {len(PROCS)} processos do to-be v8, na ordem da hierarquia, mais duas sobre a visão geral. Cada pergunta traz o desenho do processo (o que recebe, quando começa, quem faz e o que entrega), os processos de dentro quando houver, o passo a passo nos {fluxos} que têm fluxo, o que mudou desde a v7 e as fontes. Marque "Aprovo como está" quando estiver certo; em qualquer outra opção, escreva o ajuste no comentário. As respostas são salvas enquanto você marca, então dá para fazer em várias vezes.</p>
    <nav class="indice" aria-label="Blocos do formulário"><ol>{indice}</ol></nav>
  </header>""" + pagina[j:]
pagina = pagina.replace("</style>", """.indice ol { margin: 18px 0 0; padding-left: 20px; columns: 2; column-gap: 28px; font-size: 14px; line-height: 1.9; }
.indice a { color: var(--accent); font-weight: 600; text-decoration: none; } .indice a:hover { text-decoration: underline; }
.indice span { color: var(--muted); font-size: 12px; }
.fig + .fig { margin-top: 10px; } .fig svg + svg { margin-top: 14px; }
@media (max-width: 640px) { .indice ol { columns: 1; } }
</style>""", 1)
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas;", fluxos, "fluxos; tamanho", len(pagina) // 1024, "KB")
