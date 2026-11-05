# Rodada 5 respondida: validação final pelo dono (executado dentro de tobe7_base.py). Cada sim sobe o item para confirmado.
# Só entra o que ainda está declarado (veio da especificação, do Playbook ou dos livros sem decisão explícita) e os dois passos a passos declarados.
FO5 = []
_PAP = {pa["id"]: pa["nome"] for pa in d["papeis"]}
_PROC = {p["id"]: p for p in d["processos"]}
def _origem(evs):
    out = []
    for e in evs:
        ev = next(x for x in d["evidencias"] if x["id"] == e)
        f = ev["fonte"].split(" (")[0].split(":")[0]
        if f not in out: out.append(f)
    return ", ".join(out[:3])
def _val(qid_ant):
    v = RESP5[qid_ant].get("data", RESP5[qid_ant])
    k = ("d5", qid_ant)
    if k not in _cache:
        _cache[k] = ev_raw("validacao", "FO-05: Rodada 5, validação final do to-be", v.get("valor", "") + ((". " + v["obs"]) if v.get("obs") else ""), f"FO-05/{qid_ant}", pessoa="PE-01")
    return _cache[k], v.get("valor", "").startswith("Sim")
_n5 = [26]
def _codigo(p):
    cad = []
    while p:
        cad.append(str(p["ordem"])); p = _PROC.get(p["pai"])
    return ".".join(reversed(cad))
for p in sorted([x for x in d["processos"] if x["status"] == "declarado"], key=lambda x: [int(n) for n in _codigo(x).split(".")]):
    cod = _codigo(p)
    ev5, sim = _val(f"Q-{_n5[0]:04d}"); _n5[0] += 1
    saida = p["saidas"][0]["nome"] if p["saidas"] else ""
    part = ", ".join(_PAP.get(x, x) for x in p["participantes"])
    ctx = [f"O que é: {p['descricao']}",
           f"Começa quando: {p['gatilho']}. Dono: {_PAP.get(p['dono'], p['dono'])}" + (f", com {part}" if part else "") + ".",
           f"Entrega: {saida}, para {p['cliente']}." + (f" Frequência: {p['frequencia']}." if p.get("frequencia") else ""),
           f"De onde veio: {_origem(p['evidencias'])}."]
    FO5.append(add("perguntas", "Q", texto=f"{cod} {p['nome']}: está correto como descrito?", tipo="confirmacao",
                   opcoes=["Sim, está correto", "Corrigir (comente)"], alvo=[p["id"]], para=["PE-01"], rodada=5, bloco="Processos que vieram da especificação e dos livros",
                   status="respondida", formulario=None, respostas=[ev5], respondida_por=["PE-01"], chave="val_" + cod, contexto=ctx,
                   logica="Você é o dono de todos os processos do programa. Com o seu sim, o processo passa de declarado para confirmado.", citacoes=[], visual="proc:" + p["id"]))
    if sim:
        p["status"] = "confirmado"; p["evidencias"].append(ev5)
for k in ("2.4", "7.4"):
    p = _PROC[P[k]]
    ev5, sim = _val(f"Q-{_n5[0]:04d}"); _n5[0] += 1
    FO5.append(add("perguntas", "Q", texto=f"{k} {p['nome']}: o passo a passo está correto?", tipo="confirmacao",
                   opcoes=["Sim, está correto", "Corrigir (comente)"], alvo=[p["id"] + ".fluxo"], para=["PE-01"], rodada=5, bloco="Passo a passo que veio da especificação",
                   status="respondida", formulario=None, respostas=[ev5], respondida_por=["PE-01"], chave="val_fluxo_" + k, contexto=[f"De onde veio: {_origem(p['fluxo']['evidencias'])}."],
                   logica="O passo a passo só vira confirmado com a validação do dono. Se algum passo estiver diferente do que você quer, diga qual no comentário.", citacoes=[], visual="fluxo:" + p["id"]))
    if sim:
        p["fluxo"]["status"] = "confirmado"; p["fluxo"]["evidencias"].append(ev5)
fo5 = add("formularios", "FO", titulo="Rodada 5: validação final do to-be", rodada=5, para=["PE-01"], canal="artifact", perguntas=FO5,
          introducao="Uma frase por item; sim ou corrigir.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw", status="respondido", respondido_por=["PE-01"], respostas_recebidas=1, enviado_em="2026-11-02", prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO5: q["formulario"] = fo5
d["historico"].append({"data": HOJE, "evento": f"Rodada 5 respondida: {len(FO5)} itens validados pelo dono; to-be inteiro confirmado"})
