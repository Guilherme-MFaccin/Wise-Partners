# Revisão crítica do to-be (10/11/2026), executada dentro de tobe9_base.py depois da Rodada 7.
# Tudo o que a revisão propõe entra como hipótese (processo novo, campo alterado ou passo a passo novo) e só vira
# confirmado com a resposta do patrocinador no FO-14. Nada aqui é evidência: é leitura do mapa pelo método.
H9 = "2026-11-10"
PX = {p["id"]: p for p in d["processos"]}
V8X = {p["id"]: json.loads(json.dumps(p)) for p in d["processos"]}
V8COD = M.calcular_codigos(d)
REV, RETIRADOS, ABERTAS, NOVOS = {}, [], [], []

CAND = add("papeis", "PA", nome="Candidato a parceiro", area=None, externo=True, status="confirmado", evidencias=[D11("entrada")],
           descricao="Empresa que se cadastrou pela landing page e ainda não foi aprovada.")
CONSUL = add("papeis", "PA", nome="Consultor da Wise Makers", area="AR-03", externo=False, status="confirmado", evidencias=[D11("diag_quem"), D("Q-0013")],
             descricao="Atende o cliente da Wise; relata necessidades para a Prateleira, faz a checagem aos 6 e 12 meses e pode conduzir diagnósticos quando a agenda do Gerente enche. Não entra no portal.")
RA = {"G": GP, "D": DIR, "C": CONS, "F": FIN, "P": RESP_P, "K": CAND, "S": CONSUL}
_T = {"i": ("inicio", {}), "im": ("inicio", {"gatilho": "mensagem"}), "it": ("inicio", {"gatilho": "tempo"}),
      "t": ("tarefa", {}), "a": ("tarefa", {"sistema": SI_POR, "modo": "automatico"}), "s": ("tarefa", {"sistema": SI_POR, "modo": "sistema"}),
      "w": ("tarefa", {"sistema": SI_WPP}), "d": ("decisao", {}), "e": ("espera", {}), "em": ("espera", {"evento": "mensagem"}),
      "et": ("espera", {"evento": "tempo"}), "sub": ("subprocesso", {}), "f": ("fim", {})}

def FL(spec, links=None, ext=None, msg=None):
    """Passo a passo em texto: uma linha por nó (id tipo raia nome). Sem links, liga em sequência."""
    nos, ordem = [], []
    for linha in spec.strip().splitlines():
        linha = linha.strip()
        if not linha: continue
        nid, tp, raia, nome = linha.split(None, 3)
        tipo, extra = _T[tp]
        n = {"id": nid, "tipo": tipo, "nome": nome, "raia": RA[raia], **extra}
        if tipo == "subprocesso": n["processo"] = nome; n["nome"] = nome
        nos.append(n); ordem.append(nid)
    ligs = []
    if links is None:
        ligs = [{"de": a, "para": b} for a, b in zip(ordem, ordem[1:])]
    else:
        for seg in links.replace("\n", ";").split(";"):
            seg = seg.strip()
            if not seg: continue
            partes = [x.strip() for x in seg.split(">")]
            for a, b in zip(partes, partes[1:]):
                de, _, rot = a.partition(":")
                para = b.partition(":")[0]
                ligs.append({"de": de, "para": para, **({"rotulo": rot} if rot else {})})
    ids = {n["id"] for n in nos}
    for l in ligs: assert l["de"] in ids and l["para"] in ids, (l, spec[:80])
    raias = []
    for n in nos:
        if n["raia"] not in raias: raias.append(n["raia"])
    if GP in raias: raias.remove(GP); raias.insert(0, GP)
    return {"status": "hipotese", "evidencias": [], "raias": raias, "externos": [{"id": k, "nome": v} for k, v in (ext or {}).items()],
            "nos": nos, "ligacoes": ligs, "mensagens": [{"de": a, "para": b, "rotulo": r} for a, b, r in (msg or [])]}

def _desc(p, desc=None, portal=None):
    atual, _, pt = (p.get("descricao") or "").partition(" No portal: ")
    desc = desc if desc is not None else atual
    portal = portal if portal is not None else (p.get("portal") or pt)
    p["portal"] = portal
    p["descricao"] = desc + (" No portal: " + portal if portal else "")

def R(pid, oque, porque, decisoes=(), achados=(), mudou=(), fluxo=None, hoje="", desc=None, portal=None, **campos):
    """Registro da revisão de um processo: explicação para o FO-14 e alterações propostas."""
    p = PX[pid]
    if desc is not None or portal is not None: _desc(p, desc, portal)
    for k, v in campos.items(): p[k] = v
    if fluxo is not None:
        p["fluxo"] = fluxo; p["fluxo_dispensado"] = None
    REV[pid] = {"oque": oque, "porque": porque, "decisoes": [list(x) for x in decisoes], "achados": list(achados), "mudou": list(mudou), "hoje": hoje}

def NOVO(nome, pai, ordem, oque, porque, decisoes=(), achados=(), mudou=(), fluxo=None, desc="", portal="", **campos):
    base = dict(nome=nome, pai=pai, ordem=ordem, descricao="", dono=GP, participantes=[], gatilho="", entradas=[], saidas=[], cliente="", sistemas=[SI_POR],
                indicadores=[], frequencia="", dores=[], regras=[], status="hipotese", hipoteses=[], evidencias=[], situacao="no_papel", fluxo_dispensado=None,
                principios=[], portal="")
    base.update(campos)
    pid = add("processos", "P", **base)
    PX[pid] = d["processos"][-1]; NOVOS.append(pid)
    R(pid, oque, porque, decisoes, achados, mudou, fluxo, desc=desc, portal=portal)
    return pid

def RETIRAR(pid, destino, motivo, onde_ficou):
    """Tira um processo do mapa e leva as evidências e as referências para o processo que absorveu o conteúdo."""
    p = PX.pop(pid)
    RETIRADOS.append({"id": pid, "codigo": V8COD.get(pid, ""), "nome": V8X[pid]["nome"], "descricao": V8X[pid].get("descricao", ""), "destino": destino,
                      "motivo": motivo, "onde_ficou": onde_ficou})
    d["processos"] = [x for x in d["processos"] if x["id"] != pid]
    for e in p.get("evidencias", []):
        if e not in PX[destino]["evidencias"]: PX[destino]["evidencias"].append(e)
    for x in d["processos"]:
        x["entradas"] = [e for e in x.get("entradas", []) if e.get("de") != pid]
        x["saidas"] = [s for s in x.get("saidas", []) if s.get("para") != pid]
    for q in d["perguntas"]:
        q["alvo"] = list(dict.fromkeys(a.replace(pid, destino, 1) if a.split(".")[0] == pid else a for a in (q.get("alvo") or [])))
    for cv in d["cadeias_de_valor"]:
        for et in cv["etapas"]:
            et["processos"] = [destino if x == pid else x for x in et["processos"]]

def ABERTA(chave, pid, texto, contexto, opcoes, recomendo="", tipo="escolha"):
    """Decisão que a revisão não consegue tomar sozinha: vira pergunta própria no FO-14, logo depois do processo."""
    ABERTAS.append({"chave": chave, "pid": pid, "texto": texto, "contexto": contexto if isinstance(contexto, list) else [contexto],
                    "opcoes": list(opcoes), "recomendo": recomendo, "tipo": tipo})

def IO(pid, entradas=None, saidas=None):
    if entradas is not None: PX[pid]["entradas"] = [{"nome": n, "de": o} for n, o in entradas]
    if saidas is not None: PX[pid]["saidas"] = [{"nome": n, "para": o} for n, o in saidas]

def STUB(nome, pai, ordem, dono=None):
    pid = add("processos", "P", nome=nome, pai=pai, ordem=ordem, descricao="", dono=dono or GP, participantes=[], gatilho="", entradas=[], saidas=[], cliente="",
              sistemas=[SI_POR], indicadores=[], frequencia="", dores=[], regras=[], status="hipotese", hipoteses=[], evidencias=[], situacao="no_papel",
              fluxo_dispensado=None, principios=[], portal="")
    PX[pid] = d["processos"][-1]; NOVOS.append(pid)
    return pid

def LIGA(de, nome, para):
    """Entrega entre dois processos, registrada dos dois lados."""
    if not any(s["nome"] == nome and s.get("para") == para for s in PX[de]["saidas"]): PX[de]["saidas"].append({"nome": nome, "para": para})
    if not any(e["nome"] == nome and e.get("de") == de for e in PX[para]["entradas"]): PX[para]["entradas"].append({"nome": nome, "de": de})

def CORTA(de, para):
    PX[de]["saidas"] = [s for s in PX[de]["saidas"] if s.get("para") != para]
    PX[para]["entradas"] = [e for e in PX[para]["entradas"] if e.get("de") != de]

P98 = STUB("Rodar a campanha de aquisição de parceiros", "P-20", 0)
P99 = STUB("Suspender a recomendação de um parceiro", "P-58", 3)
V7 = "Validado até a v7"
RV = "Proposta da revisão"
