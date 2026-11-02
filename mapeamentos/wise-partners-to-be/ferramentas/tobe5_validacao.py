# Rodada 5: validação final pelo dono (executado dentro de tobe5_base.py).
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
def _codigo(p):
    cad = []
    while p:
        cad.append(str(p["ordem"])); p = _PROC.get(p["pai"])
    return ".".join(reversed(cad))
for p in sorted([x for x in d["processos"] if x["status"] == "declarado"], key=lambda x: [int(n) for n in _codigo(x).split(".")]):
    cod = _codigo(p)
    saida = p["saidas"][0]["nome"] if p["saidas"] else ""
    part = ", ".join(_PAP.get(x, x) for x in p["participantes"])
    ctx = [f"O que é: {p['descricao']}",
           f"Começa quando: {p['gatilho']}. Dono: {_PAP.get(p['dono'], p['dono'])}" + (f", com {part}" if part else "") + ".",
           f"Entrega: {saida}, para {p['cliente']}." + (f" Frequência: {p['frequencia']}." if p.get("frequencia") else ""),
           f"De onde veio: {_origem(p['evidencias'])}."]
    FO5.append(add("perguntas", "Q", texto=f"{cod} {p['nome']}: está correto como descrito?", tipo="confirmacao",
                   opcoes=["Sim, está correto", "Corrigir (comente)"], alvo=[p["id"]], para=["PE-01"], rodada=5, bloco="Processos que vieram da especificação e dos livros",
                   status="em_formulario", formulario=None, respostas=[], chave="val_" + cod, contexto=ctx,
                   logica="Você é o dono de todos os processos do programa. Com o seu sim, o processo passa de declarado para confirmado.", citacoes=[], visual="proc:" + p["id"]))
for k in ("2.4", "7.4"):
    p = _PROC[P[k]]
    FO5.append(add("perguntas", "Q", texto=f"{k} {p['nome']}: o passo a passo está correto?", tipo="confirmacao",
                   opcoes=["Sim, está correto", "Corrigir (comente)"], alvo=[p["id"] + ".fluxo"], para=["PE-01"], rodada=5, bloco="Passo a passo que veio da especificação",
                   status="em_formulario", formulario=None, respostas=[], chave="val_fluxo_" + k, contexto=[f"De onde veio: {_origem(p['fluxo']['evidencias'])}."],
                   logica="O passo a passo só vira confirmado com a validação do dono. Se algum passo estiver diferente do que você quer, diga qual no comentário.", citacoes=[], visual="fluxo:" + p["id"]))
fo5 = add("formularios", "FO", titulo="Rodada 5: validação final do to-be", rodada=5, para=["PE-01"], canal="artifact", perguntas=FO5,
          introducao="Uma frase por item; sim ou corrigir.", link="https://claude.ai/artifact/ErCdBFw4dwso4pcz9RbUEw", status="enviado", enviado_em=HOJE, prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO5: q["formulario"] = fo5
d["historico"].append({"data": HOJE, "evento": f"To-be v5: Rodada 4 aplicada e passo a passo dos processos novos; Rodada 5 de validação final enviada ({len(FO5)} itens)"})
