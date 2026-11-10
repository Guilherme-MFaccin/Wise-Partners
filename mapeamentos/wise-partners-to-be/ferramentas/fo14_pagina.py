# FO-14: revisão crítica da hierarquia e arquitetura de processos (to-be v9), com a explicação de cada decisão.
# Lê o mapa.json (v9) e o material da revisão (fo14_revisao.json, gerado por tobe9_rev9.py). Os desenhos vêm do fo13_pagina.py.
import json, html, os, re, sys, textwrap
sys.path.insert(0, "/home/user/.claude/skills/mapear-processos/scripts")
import mapa as M

BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-14/formulario.html"
d = json.load(open(BASE + "/mapa.json"))
RV = json.load(open(BASE + "/ferramentas/fo14_revisao.json"))
COD = M.calcular_codigos(d)
PROCS, FILHOS = M.arvore(d)
PAP = {x["id"]: x["nome"] for x in d["papeis"]}
SIS = {x["id"]: x["nome"] for x in d["sistemas"]}
EV = {x["id"]: x for x in d["evidencias"]}
FAT = {x["id"]: x for x in d["fatos"]}
ITENS = []

# desenhos (ficha do processo, árvore, fluxo, cadeia e jornadas): mesmo código do FO-13
_src = open(BASE + "/ferramentas/fo13_pagina.py", encoding="utf-8").read()
_seg = _src[_src.index("def esc(t)"):_src.index("# ---------------------------------------------------------------- textos")]
for _a, _b in [("""class="mu">auto</text>')""", """class="mu">portal, sozinho</text>')"""),
               ("""{esc(SIS.get(n["sistema"], "")[:16])}""", """{esc("WhatsApp" if "WhatsApp" in SIS.get(n["sistema"], "") else "no portal" if "Portal" in SIS.get(n["sistema"], "") else SIS.get(n["sistema"], "")[:14])}"""),
               ("""o.append(tl(cx, cy + (2 if not sub else -3), linhas, 11))""",
                """o.append(tl(cx, cy + (7 if (n.get("sistema") or n.get("modo")) and not sub else 2 if not sub else -3), linhas, 10 if len(linhas) > 3 else 11, dy=12 if len(linhas) > 3 else None))""")]:
    assert _a in _seg, _a
    _seg = _seg.replace(_a, _b)
exec(_seg)

WPP = next(v for v in SIS.values() if "WhatsApp" in v)
def frases(p, mapa=d):
    """Passo a passo em frases, dizendo o que o portal faz sozinho."""
    nos = {n["id"]: n for n in (p.get("fluxo") or {}).get("nos", [])}
    out = []
    for txt, nid in M.frases_fluxo(mapa, p):
        n = nos.get(nid, {})
        if n.get("modo") == "automatico":
            txt = re.sub(r"^(\d+\. )[^:]+:", r"\1O portal, sozinho:", txt, count=1)
            txt = txt.replace(" (usa Portal Wise Partners)", "")
        txt = txt.replace(" (usa Portal Wise Partners)", " (no portal)").replace(f" (usa {WPP})", " (pelo WhatsApp)").replace(" (usa Wise Hub)", " (no Wise Hub)")
        out.append(txt)
    return out

def citacoes(p, n=6):
    evs = [EV[e] for e in p.get("evidencias", []) if e in EV]
    evs.sort(key=lambda e: (0 if e["fonte"].startswith(("FO-12", "FO-11", "Pedido")) else 1 if e["tipo"] == "validacao" else 2, e["fonte"]))
    vistos, out = set(), []
    for e in evs:
        if e["fonte"] in vistos and len(evs) > n: continue
        vistos.add(e["fonte"])
        out.append({"trecho": e["trecho"][:600], "fonte": e["fonte"] + (", " + e["local"] if e.get("local") else "")})
        if len(out) >= n: break
    return out

SIT = {"no_papel": "Só no papel: ainda não rodou do jeito descrito.", "em_implantacao": "Em implantação: a parte do portal já está construída.", "rodando": "Já roda assim."}
OP = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo: precisa ser refeito (comente)", "Retirar do mapa (comente)"]

def item(iid, bloco, texto, selo, cls, secoes, opcoes, tipo="escolha", recomendo=""):
    ITENS.append({"id": "R14-" + iid, "bloco": bloco, "texto": texto, "selo": selo, "cls": cls, "secoes": [s for s in secoes if s and s.get("v")],
                  "opcoes": opcoes, "tipo": tipo, "recomendo": recomendo})

def nomep_(x):
    if x in PROCS: return f"{COD[x]} {PROCS[x]['nome']}"
    return str(x).replace("EXT:", "")

# ---------------------------------------------------------------- visão geral
macros = FILHOS.get(None, [])
GERAL = "Visão geral"
mud = RV["mudancas"]
n_fluxo_novo = sum(1 for pid, m in mud.items() if m.get("fluxo") and not m.get("fluxo_antes") and not m.get("novo"))
n_fluxo_ref = sum(1 for pid, m in mud.items() if m.get("fluxo") and m.get("fluxo_antes"))
item("cadeia", GERAL, f"A cadeia de valor, com {len(macros)} macroprocessos, continua certa depois da revisão?", "Sem mudança", "igual", [
    {"t": "O que é", "k": "p", "v": ["A cadeia de valor mostra as grandes frentes do programa. Gestão define e controla; os finalísticos entregam valor ao parceiro e à indústria; suporte dá recursos aos demais.",
                                     "A revisão não criou nem tirou macroprocesso. As mudanças estão dentro de cada um, e cada macroprocesso tem a própria pergunta mais adiante."]},
    {"t": "Desenho", "k": "fig", "v": desenho_cadeia()}], OP[:3])
item("jornadas", GERAL, "As duas jornadas de valor estão certas?", "Com proposta de mudança", "mudou", [
    {"t": "O que é", "k": "p", "v": ["Uma jornada é o caminho de ponta a ponta visto por quem recebe o valor. O programa tem duas: a do parceiro e a da oportunidade.",
                                     "Pelo método, cada etapa da jornada precisa de pelo menos um processo que a execute (o número embaixo de cada seta)."]},
    {"t": "Desenho", "k": "fig", "v": desenho_jornadas()},
    {"t": "O que a revisão mudou", "k": "ul", "v": ["A jornada do parceiro passa a começar na campanha de aquisição, não no cadastro. O processo 4.1 Rodar a campanha é novo.",
                                                    "Na jornada da oportunidade, o diagnóstico do cliente do parceiro passa a ser a porta principal e o primeiro processo (6.1)."]}], OP[:3])

def conta_passos(papel_id):
    procs, passos = set(), 0
    for p in d["processos"]:
        for n in (p.get("fluxo") or {}).get("nos", []):
            if n.get("raia") == papel_id and n.get("tipo") == "tarefa" and n.get("modo") != "automatico":
                procs.add(p["id"]); passos += 1
    return len(procs), passos
auto = sum(1 for p in d["processos"] for n in (p.get("fluxo") or {}).get("nos", []) if n.get("modo") == "automatico")
papeis_kv = []
for pa in d["papeis"]:
    np_, ns = conta_passos(pa["id"])
    papeis_kv.append([pa["nome"] + (" (de fora)" if pa.get("externo") else ""), (pa.get("descricao") or "") + f" Aparece em {np_} processos, com {ns} passos manuais."])
papeis_kv.append(["O portal, sozinho", f"{auto} passos em todo o mapa são feitos pelo portal, sem ninguém."])
item("papeis", GERAL, "Os papéis e a agenda do Gerente de Parcerias estão certos?", "Com proposta de mudança", "mudou", [
    {"t": "Por que olhar isto", "k": "p", "v": ["Quase todo o trabalho humano do programa é de uma pessoa: o Gerente de Parcerias (você). Antes de aprovar processo por processo, vale ver o conjunto: o que cai na sua agenda por dia, por semana, por mês e por trimestre."]},
    {"t": "Quem faz o quê", "k": "kv", "v": papeis_kv},
    {"t": "A agenda do Gerente", "k": "kv", "v": [
        ["Todo dia", "Fila de candidatos: conferir cadastros novos, chamar no WhatsApp em até 24 horas úteis e qualificar (4). Conversas de entrada marcadas (4.4). Reuniões de diagnóstico, até 10 por semana (6.1), e o mapa de cada uma em até 2 dias úteis. Exceções do dia (2.1). Retorno aos parceiros a cada mudança de etapa das oportunidades (6.4)."],
        ["Toda semana", "Conversa com o Diretor (2.2). Informar o gasto da campanha e ler o custo por parceiro (4.1)."],
        ["Todo mês", "Mesa do portfólio (2.3). CAC e valor devolvido (3.1). Comunicado do mês (8.2.1). Reconhecimentos (8.4). Mentoria aberta (8.2.3)."],
        ["Todo trimestre", "Fechamento (2.4): níveis, pulso, saúde e Prateleira. Encontro trimestral de parceiros (8.2.2). Revisões conjuntas com Premium e Elite (7.2). Encontro pequeno (8.6)."],
        ["Quando acontece", "Entrada no Premium e encontro de alinhamento (7.5 e 7.6), Base Ativa (7.4), Prateleira (6.5), comissão (6.7), retomada e desligamento (9), manutenção de materiais (11) e do portal (12)."]]},
    {"t": "O que a revisão mudou", "k": "ul", "v": ["Papel novo: Candidato a parceiro. Antes, quem se cadastrava aparecia como 'Responsável nomeado no parceiro', mas ainda não era parceiro.",
                                                    "Papel novo: Consultor da Wise Makers. Ele já aparecia nas descrições (relata necessidades, faz a checagem de 6 e 12 meses, assume diagnósticos quando a agenda enche), mas estava desenhado na raia do closer.",
                                                    "O dia do Gerente deixou de ser só exceção: a fila de candidatos e as reuniões marcadas são trabalho de todo dia."]},
    {"t": "Ponto de atenção", "k": "p", "v": ["O desenho inteiro depende da sua agenda. Você já definiu um limite para os diagnósticos (acima de 10 por semana, um consultor assume). Não há limite equivalente para as conversas de entrada: se a campanha trouxer mais cadastros do que a agenda comporta, a fila cresce e o prazo de 24 horas úteis deixa de valer. A pergunta sobre a duração da conversa, em 4.4, ajuda a dimensionar; se quiser um limite ou alguém de reserva, escreva no comentário."]}],
     OP[:3])

# ---------------------------------------------------------------- processos
def selo_de(pid):
    m = mud[pid]
    if m.get("novo"): return "Processo novo", "novo"
    if m.get("nome_antes") or m.get("campos") or (m.get("fluxo") and m.get("fluxo_antes")): return "Com proposta de mudança", "mudou"
    if m.get("fluxo"): return "Passo a passo novo", "mudou"
    return "Sem mudança", "igual"

def secoes_processo(p):
    pid = p["id"]; r = RV["rev"][pid]; m = mud[pid]; filhos = FILHOS.get(pid, [])
    s = [{"t": "Em uma frase", "k": "p", "v": [r["oque"]]},
         {"t": "Por que este processo existe", "k": "p", "v": [r["porque"]]}]
    ficha = [["Dono", PAP.get(p.get("dono"), "")]]
    if p.get("participantes"): ficha.append(["Participam", ", ".join(PAP.get(x, x) for x in p["participantes"])])
    ficha.append(["Começa quando", p.get("gatilho") or "não definido"])
    if p.get("entradas"): ficha.append(["Recebe", "; ".join(f"{e['nome']} (de {nomep_(e.get('de'))})" for e in p["entradas"])])
    if p.get("saidas"): ficha.append(["Entrega", "; ".join(f"{x['nome']} (para {nomep_(x.get('para'))})" for x in p["saidas"])])
    if p.get("frequencia"): ficha.append(["Frequência", p["frequencia"]])
    if p.get("cliente"): ficha.append(["Para quem", p["cliente"]])
    s.append({"t": "Ficha do processo", "k": "fig", "v": desenho_sipoc(p)})
    s.append({"t": "", "k": "kv", "v": ficha})
    if filhos:
        s.append({"t": f"Os {len(filhos)} processos de dentro", "k": "fig", "v": desenho_arvore(p)})
    if p.get("fluxo"):
        hip = p["fluxo"].get("status") == "hipotese"
        s.append({"t": "Como funciona, passo a passo" + (" (proposta da revisão)" if hip else " (já validado por você)"), "k": "passos", "v": frases(p)})
        s.append({"t": "O mesmo passo a passo, em desenho", "k": "fig", "v": desenho_fluxo(p)})
        ant = RV["v8"].get(pid, {}).get("fluxo")
        if hip and ant and m.get("fluxo_antes"):
            s.append({"t": "Como era o passo a passo antes da revisão", "k": "antes", "v": frases({"fluxo": ant})})
    elif filhos:
        s.append({"t": "Como funciona", "k": "p", "v": ["Este processo é a soma dos processos de dentro. O passo a passo está em cada um deles, nas perguntas seguintes."]})
    s.append({"t": "O que você aprova ao marcar \"Aprovo\"", "k": "dec", "v": r["decisoes"]})
    if r["achados"]: s.append({"t": "O que a revisão encontrou", "k": "ul", "v": r["achados"]})
    mudou = list(r["mudou"])
    if m.get("nome_antes") and not any("Nome novo" in x for x in mudou): mudou.insert(0, f"Nome anterior: {m['nome_antes']}.")
    if mudou: s.append({"t": "O que a revisão mudou", "k": "ul", "v": mudou})
    portal = [x for x in [("O que o portal faz: " + p["portal"]) if p.get("portal") else "", ("Hoje: " + r["hoje"]) if r.get("hoje") else "", SIT.get(p.get("situacao"), "")] if x]
    s.append({"t": "No portal", "k": "p", "v": portal})
    pr = [FAT[f]["texto"] for f in p.get("principios", []) if f in FAT]
    if pr: s.append({"t": "Princípios do programa que este processo atende", "k": "det", "v": pr})
    c = citacoes(p)
    if c: s.append({"t": "De onde vem", "k": "cit", "v": c})
    return s

def visitar(p, bloco):
    pid = p["id"]; filhos = FILHOS.get(pid, []); cod = COD[pid]
    nivel = len(M.ancestrais(PROCS, p)) + 1
    selo, cls = selo_de(pid)
    if nivel == 1: texto = f"O macroprocesso {cod} {p['nome']} está certo?"
    elif filhos: texto = f"O processo {cod} {p['nome']}, com {len(filhos)} processos de dentro, está certo?"
    else: texto = f"{cod} {p['nome']}: você aprova este processo como está descrito?"
    item(pid, bloco, texto, selo, cls, secoes_processo(p), OP)
    for a in [x for x in RV["abertas"] if x["pid"] == pid]:
        sec = [{"t": "Contexto", "k": "p", "v": a["contexto"]}]
        if a.get("recomendo"): sec.append({"t": "O que eu recomendo, e por quê", "k": "rec", "v": [a["recomendo"]]})
        item("DEC-" + a["chave"], bloco, a["texto"], f"Decisão em aberto de {cod}", "aberto", sec, a["opcoes"], a["tipo"])
    for f in filhos: visitar(f, bloco)

for m_ in macros:
    visitar(m_, f"{COD[m_['id']]} {m_['nome']}")

# ---------------------------------------------------------------- processos que saem
SAEM = "Processos que saem do mapa"
for r in RV["retirados"]:
    item("RET-" + r["id"], SAEM, f"O processo {r['codigo']} {r['nome']} (numeração antiga) pode sair do mapa?", "Sai do mapa", "sai", [
        {"t": "O que era", "k": "p", "v": [r["descricao"].split(" No portal: ")[0]]},
        {"t": "Por que a revisão propõe tirar", "k": "p", "v": [r["motivo"]]},
        {"t": "Onde o conteúdo ficou", "k": "p", "v": [r["onde_ficou"] + f" Processo que absorveu: {nomep_(r['destino'])}."]}],
        ["Sim, pode sair", "Não, deve continuar como processo próprio (comente)"])

# ---------------------------------------------------------------- página
json.dump(ITENS, open(BASE + "/ferramentas/fo14_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
i = pagina.index("function montar() {"); j = pagina.index("function ler(it) {")
MONTAR = r"""function montar() {
  const form = $('form'); let n = 0;
  const lista = (cls, itens) => { const u = el('ul', cls); itens.forEach(t => u.appendChild(el('li', null, t))); return u; };
  for (const it of ITENS) {
    n++;
    const card = el('article', 'q'); card.id = 'c-' + it.id;
    const topo = el('div', 'topo'); topo.append(el('p', 'eyebrow', it.bloco), el('span', 'selo ' + it.cls, it.selo)); card.appendChild(topo);
    const h = el('h2'); h.append(el('span', 'num', String(n).padStart(3, '0')), document.createTextNode(it.texto)); card.appendChild(h);
    for (const s of it.secoes) {
      if (s.t && s.k !== 'cit' && s.k !== 'det' && s.k !== 'antes') card.appendChild(el('h3', null, s.t));
      if (s.k === 'p') { const c = el('div', 'ctx'); s.v.forEach(t => c.appendChild(el('p', null, t))); card.appendChild(c); }
      else if (s.k === 'rec') { s.v.forEach(t => card.appendChild(el('p', 'logica', t))); }
      else if (s.k === 'ul') card.appendChild(lista('pts', s.v));
      else if (s.k === 'passos') card.appendChild(lista('passos', s.v));
      else if (s.k === 'fig') { const f = el('div', 'fig'); f.innerHTML = s.v; card.appendChild(f); }
      else if (s.k === 'kv') { const dl = el('dl', 'kv'); s.v.forEach(([a, b]) => { dl.append(el('dt', null, a), el('dd', null, b)); }); card.appendChild(dl); }
      else if (s.k === 'dec') {
        const u = el('ul', 'decs');
        s.v.forEach(([tit, txt, org]) => {
          const o = (org || '').toLowerCase();
          const cls = o.includes('em aberto') ? 'ab' : o.includes('proposta da revis') ? 'rv' : 'ok';
          const rot = cls === 'ab' ? 'Em aberto: há pergunta logo abaixo' : cls === 'rv' ? org : 'Já decidido por você · ' + org;
          const li = el('li', cls); li.append(el('strong', null, tit), el('span', 'org', rot), el('p', null, txt)); u.appendChild(li);
        });
        card.appendChild(u);
      }
      else if (s.k === 'det' || s.k === 'antes') { const dt = el('details', 'ver'); dt.appendChild(el('summary', null, s.t)); dt.appendChild(lista(s.k === 'antes' ? 'passos' : 'pts', s.v)); card.appendChild(dt); }
      else if (s.k === 'cit') {
        const dt = el('details', 'ver'); dt.appendChild(el('summary', null, s.t + ' (' + s.v.length + (s.v.length > 1 ? ' fontes)' : ' fonte)')));
        const ul = el('ul', 'cits'); s.v.forEach(c => { const li = el('li'); li.append(el('q', null, c.trecho), el('small', null, c.fonte)); ul.appendChild(li); });
        dt.appendChild(ul); card.appendChild(dt);
      }
    }
    const fs = el('fieldset'); fs.appendChild(el('legend', null, 'Sua decisão'));
    it.opcoes.forEach((op, k) => {
      const lab = el('label', 'op');
      const inp = el('input'); inp.type = it.tipo === 'multipla' ? 'checkbox' : 'radio'; inp.name = it.id; inp.value = op; inp.id = it.id + '-' + k;
      inp.addEventListener('change', () => mudou(it)); lab.append(inp, el('span', null, op)); fs.appendChild(lab);
    });
    card.appendChild(fs);
    const b = el('button', 'comentar', 'Comentar'); b.type = 'button';
    const obs = el('textarea'); obs.id = it.id + '-obs'; obs.hidden = true; obs.placeholder = 'Ajuste, exceção ou outra resposta';
    obs.setAttribute('aria-label', 'Comentário sobre a pergunta ' + n);
    b.addEventListener('click', () => { obs.hidden = false; b.hidden = true; obs.focus(); });
    obs.addEventListener('input', () => mudou(it));
    card.append(b, obs);
    form.appendChild(card);
  }
}
"""
pagina = pagina[:i] + MONTAR + pagina[j:]
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Revisão crítica dos processos</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo19_itens', META = 'respostas/FO-19', CHAVE = 'fo19-rascunho';"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
blocos = []
for it in ITENS:
    if not blocos or blocos[-1][0] != it["bloco"]: blocos.append([it["bloco"], it["id"], 0])
    blocos[-1][2] += 1
indice = "".join(f'<li><a href="#c-{esc(a)}">{esc(b)}</a> <span>{n} {"pergunta" if n == 1 else "perguntas"}</span></li>' for b, a, n in blocos)
n_nov = len(RV["novos"]); n_ret = len(RV["retirados"]); n_ab = len(RV["abertas"])
n_mud = sum(1 for it in ITENS if it["cls"] == "mudou" and it["id"].startswith("R14-P-")); n_ig = sum(1 for it in ITENS if it["cls"] == "igual" and it["id"].startswith("R14-P-"))
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + f"""<header>
    <p class="eyebrow">FO-14 · Revisão crítica do mapeamento</p>
    <h1>O que você está aprovando em cada processo do Wise Partners</h1>
    <p class="lead">Revisei os 96 processos do mapa um a um, pelo método da skill de mapeamento (checklist do que é um processo, regras de nome e de passo a passo, testes de completude) e pelas necessidades do programa que você definiu nos formulários anteriores. O mapa ficou com {len(PROCS)} processos: {n_nov} novos, {n_ret} que saem ou se fundem, {n_mud} com proposta de mudança ou passo a passo novo e {n_ig} sem mudança. Sobraram {n_ab} decisões que eu não consigo tomar por você; cada uma virou uma pergunta própria, logo depois do processo a que pertence.</p>
    <div class="guia">
      <p><strong>Como ler cada pergunta.</strong> Cada processo traz: o que é, em uma frase; por que existe; a ficha (o que recebe, quando começa, quem faz, o que entrega); o passo a passo em frases e em desenho; a lista do que você aprova ao marcar "Aprovo"; o que a revisão encontrou e mudou; o que o portal faz; e as fontes.</p>
      <p><strong>Na lista do que você aprova, cada item tem uma etiqueta:</strong></p>
      <ul class="decs">
        <li class="ok"><strong>Já decidido por você</strong><span class="org">com o formulário de origem</span><p>Está no mapa porque você respondeu assim. Aqui é só conferir se continua valendo.</p></li>
        <li class="rv"><strong>Proposta da revisão</strong><span class="org">ideia minha</span><p>Não veio de você. É o que eu proponho para fechar uma lacuna. Só vale se você aprovar.</p></li>
        <li class="ab"><strong>Em aberto</strong><span class="org">há pergunta logo abaixo</span><p>Falta uma decisão sua. A pergunta seguinte traz as opções e a minha recomendação.</p></li>
      </ul>
      <p>Tudo o que a revisão propõe está marcado no mapa como hipótese e só vira definitivo com a sua resposta. As respostas são salvas enquanto você marca, então dá para fazer em várias vezes.</p>
    </div>
    <nav class="indice" aria-label="Blocos do formulário"><ol>{indice}</ol></nav>
  </header>""" + pagina[j:]
pagina = pagina.replace("</style>", """.indice ol { margin: 18px 0 0; padding-left: 20px; columns: 2; column-gap: 28px; font-size: 14px; line-height: 1.9; }
.indice a { color: var(--accent); font-weight: 600; text-decoration: none; } .indice a:hover { text-decoration: underline; }
.indice span { color: var(--muted); font-size: 12px; }
.guia { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; display: grid; gap: 10px; font-size: 15px; }
.topo { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.selo { font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); white-space: nowrap; }
.selo.novo { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
.selo.mudou { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
.selo.aberto { border-color: var(--warn); color: var(--warn); }
.selo.sai { border-style: dashed; }
.pts, .passos { margin: 0; padding-left: 20px; display: grid; gap: 6px; max-width: 72ch; }
.passos { list-style: none; padding-left: 0; }
.passos li { padding: 7px 12px; background: var(--soft2); border-radius: 8px; font-size: 15px; }
.kv { margin: 0; display: grid; grid-template-columns: minmax(110px, max-content) 1fr; gap: 6px 16px; font-size: 15px; }
.kv dt { color: var(--muted); font-weight: 600; } .kv dd { margin: 0; }
.decs { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.decs li { border: 1px solid var(--line); border-left-width: 4px; border-radius: 8px; padding: 10px 12px; display: grid; gap: 4px; }
.decs li.ok { border-left-color: var(--ok); } .decs li.rv { border-left-color: var(--accent); background: var(--accent-soft); } .decs li.ab { border-left-color: var(--warn); }
.decs .org { font-size: 12px; color: var(--muted); font-weight: 600; }
.decs li.rv .org { color: var(--accent); } .decs li.ab .org { color: var(--warn); }
.decs p { font-size: 15px; }
h3 { margin-top: 10px; }
@media (max-width: 640px) { .indice ol { columns: 1; } .kv { grid-template-columns: 1fr; gap: 2px 0; } .kv dd { margin-bottom: 8px; } }
</style>""", 1)
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina, [m.start() for m in re.finditer("[—–]", pagina)][:5]
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
import collections
print(len(ITENS), "perguntas;", dict(collections.Counter(it["cls"] for it in ITENS)), "; tamanho", len(pagina) // 1024, "KB")
