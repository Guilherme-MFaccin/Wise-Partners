# Registro da Rodada 3 como respondida (executado dentro de tobe4_base.py).
# Recria as 13 perguntas da Rodada 3 pelas chaves (os ids mudam a cada reconstrução), liga as respostas do patrocinador
# como evidência e, onde livros e patrocinador concordam, sobe o elemento de hipótese para confirmado.
# A regra do FO-03 Q-0001 vale aqui: a aprovação conta como uma fonte que converge com os livros; onde eles divergem,
# tobe4_contradicoes.py registra a contradição e o elemento fica contestado.
R3 = []
_src = open(BASE + "/ferramentas/tobe3_perguntas.py").read()
_src = _src[:_src.index("fo3 = add(")].replace("def Q(", "def _Q_v3(").replace("FO3 = []", "")

def _alvo_ids(alvo):
    ids = []
    for a in alvo:
        if a.startswith("F:"):
            if a[2:] in FT: ids.append(FT[a[2:]])
        elif a.startswith("P:"):
            if a[2:] in PR: ids.append(PR[a[2:]])
        else:
            k, _, campo = a.partition("|")
            if k in P: ids.append(P[k] + ("." + campo if campo else ""))
    return ids

def Q(chave, bloco, texto, tipo, opcoes, alvo, contexto, logica, cits, visual):
    R3.append({"chave": chave, "bloco": bloco, "texto": texto, "tipo": tipo, "opcoes": opcoes, "alvo": _alvo_ids(alvo), "contexto": contexto, "logica": logica, "citacoes": cits, "visual": visual})

exec(_src)

# chaves tratadas à mão nos construtores (a resposta mudou o desenho em vez de só aprovar)
_MANUAL = {"cac", "semana", "diretor", "portoes"}
_por_id = {}
for col in ("processos", "fatos"):
    for o in d[col]:
        _por_id[o["id"]] = o

FO_R3 = nid("FO")
R3_IDS = {}
for n, q in enumerate(R3, start=1):
    qid_ant = f"Q-{n:04d}"           # id da pergunta no FO-03 enviado ao patrocinador
    ev = D3(qid_ant)
    v = RESP3[qid_ant].get("data", RESP3[qid_ant])
    val = v.get("valor", "")
    aprovou = (isinstance(val, list) and len(val) > 0) or (isinstance(val, str) and val.startswith("Aprovo"))
    novo = add("perguntas", "Q", texto=q["texto"], tipo=q["tipo"], opcoes=q["opcoes"], alvo=q["alvo"], para=["PE-01"], rodada=3, bloco=q["bloco"],
               status="respondida", formulario=FO_R3, respostas=[ev], respondida_por=["PE-01"], chave="r3_" + q["chave"],
               contexto=q["contexto"], logica=q["logica"], citacoes=q["citacoes"], visual=q["visual"])
    R3_IDS[q["chave"]] = novo
    if not aprovou or q["chave"] in _MANUAL:
        continue
    for a in q["alvo"]:
        # ids de processo têm pontos (P-12.1); o campo vem depois do último ponto quando não é número
        base, campo = a, ""
        if "." in a:
            cab, _, ult = a.rpartition(".")
            if not ult.isdigit():
                base, campo = cab, ult
        o = _por_id.get(base)
        if not o:
            continue
        if campo:
            if campo in (o.get("hipoteses") or []):
                o["hipoteses"].remove(campo)
            if campo == "fluxo" and o.get("fluxo"):
                fl = o["fluxo"]
                if fl.get("status") == "hipotese":
                    fl["status"] = "confirmado"
                for n_ in fl.get("nos", []):
                    if n_.get("status") == "hipotese":
                        n_.pop("status")
                if ev not in fl["evidencias"]:
                    fl["evidencias"].append(ev)
        elif o.get("status") == "hipotese":
            o["status"] = "confirmado"
        if ev not in o["evidencias"]:
            o["evidencias"].append(ev)

add("formularios", "FO", titulo="Rodada 3: princípios e to-be refatorado com 16 livros", rodada=3, para=["PE-01"], canal="artifact",
    perguntas=[R3_IDS[q["chave"]] for q in R3], introducao="Cada pergunta traz o contexto, a lógica, o que os livros dizem e um visual.",
    link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw", status="respondido", respondido_por=["PE-01"], respostas_recebidas=1,
    enviado_em=HOJE, prazo="", identificacao=False)
d["historico"].append({"data": HOJE, "evento": "Rodada 3 respondida pelo patrocinador (13 perguntas); respostas ligadas como evidência no to-be v4"})
