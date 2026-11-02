# Gera a página da Rodada 5 (validação final do to-be, uma frase por item).
import json, html, textwrap, subprocess
_src = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo03_pagina.py").read().splitlines()
esc = html.escape
exec("\n".join(_src[8:24]))   # box, seta, txt, svg
T = json.load(open("/home/user/mapeamentos/wise-partners-to-be/mapa.json"))
PROC = {p["id"]: p for p in T["processos"]}
FO = next(f for f in T["formularios"] if f["titulo"].startswith("Rodada 5"))
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"
M = "/home/user/.claude/skills/mapear-processos/scripts/mapa.py"

def caixa(x, w, texto, cls, bold=False):
    linhas = textwrap.wrap(texto, 24)[:4]
    return box(x, 14, w, 86, linhas, cls, 11.5, bold)

def visual_proc(pid):
    p = PROC[pid]
    saida = p["saidas"][0]["nome"] if p["saidas"] else "Entrega"
    c = [caixa(6, 190, p["gatilho"], "b2"), seta(196, 57, 232, 57), caixa(234, 192, p["nome"], "b hi", True), seta(426, 57, 462, 57), caixa(464, 190, saida, "b2"),
         txt(101, 122, "começa quando", 11, "middle"), txt(330, 122, "processo", 11, "middle"), txt(559, 122, "entrega", 11, "middle")]
    return svg(660, 132, "".join(c), p["nome"])

def visual_fluxo(pid):
    frases = subprocess.run(["python3", M, "frases", "/home/user/mapeamentos/wise-partners-to-be", pid], capture_output=True, text=True).stdout.strip().splitlines()
    c = []; y = 20
    for f in frases:
        for i, l in enumerate(textwrap.wrap(f, 92)):
            c.append(txt(10 if i == 0 else 26, y, l, 12, cls="tx" if f[:1].isdigit() else "mu", bold=not f[:1].isdigit() and i == 0)); y += 18
        y += 4
    return svg(660, y, "".join(c), "Passo a passo")

itens = []
for qid in FO["perguntas"]:
    q = next(x for x in T["perguntas"] if x["id"] == qid)
    tipo, ref = q["visual"].split(":")
    ctx = list(q["contexto"])
    if tipo == "proc":
        vis = visual_proc(ref)
    else:
        vis = visual_proc(ref)
        frases = subprocess.run(["python3", M, "frases", "/home/user/mapeamentos/wise-partners-to-be", ref], capture_output=True, text=True).stdout.strip().splitlines()
        ctx = frases + ctx
    itens.append({"id": "R5-" + qid, "bloco": q["bloco"], "texto": q["texto"], "tipo": "escolha", "opcoes": q["opcoes"],
                  "contexto": ctx, "logica": q["logica"], "citacoes": [], "visual": vis})
json.dump(itens, open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo05_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo05_modelo.html", encoding="utf-8").read()
pagina = pagina.replace("__DADOS__", json.dumps(itens, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(itens)))
assert "—" not in pagina and "–" not in pagina
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(itens), "itens na página")
