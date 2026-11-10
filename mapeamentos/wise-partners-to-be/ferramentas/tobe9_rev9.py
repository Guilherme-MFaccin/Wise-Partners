# Revisão crítica, fechamento: marca as propostas como hipótese, cria as perguntas do FO-14 e guarda o material do formulário.
CAMPOS9 = ["descricao", "dono", "gatilho", "entradas", "saidas", "cliente", "participantes", "frequencia"]
faltam = [p["id"] for p in d["processos"] if p["id"] not in REV]
assert not faltam, f"processos sem revisão: {faltam}"

# nomes dos subprocessos nos fluxos acompanham o nome atual do processo
for p in d["processos"]:
    for n in (p.get("fluxo") or {}).get("nos", []):
        if n.get("tipo") == "subprocesso" and n.get("processo"):
            assert n["processo"] in PX, (p["id"], n)
            n["nome"] = PX[n["processo"]]["nome"]

# o que a revisão alterou vira hipótese, campo a campo
MUDANCAS = {}
for p in d["processos"]:
    antes = V8X.get(p["id"])
    if not antes:
        MUDANCAS[p["id"]] = {"novo": True, "campos": [], "fluxo": bool(p.get("fluxo")), "nome_antes": None}
        continue
    campos = [c for c in CAMPOS9 if json.dumps(antes.get(c), sort_keys=True, ensure_ascii=False) != json.dumps(p.get(c), sort_keys=True, ensure_ascii=False)]
    fluxo_mudou = json.dumps(antes.get("fluxo"), sort_keys=True) != json.dumps(p.get("fluxo"), sort_keys=True)
    p["hipoteses"] = sorted(set(p.get("hipoteses") or []) | set(campos))
    MUDANCAS[p["id"]] = {"novo": False, "campos": campos, "fluxo": fluxo_mudou, "nome_antes": antes["nome"] if antes["nome"] != p["nome"] else None,
                         "pai_antes": antes.get("pai") if antes.get("pai") != p.get("pai") else None,
                         "fluxo_antes": bool(antes.get("fluxo"))}

d["perguntas"] = [q for q in d["perguntas"] if not (q.get("chave") == "limite_lembrete" and q.get("status") == "aberta")]

COD9 = M.calcular_codigos(d)
procs9, filhos9 = M.arvore(d)
ordem9 = []
def _visita(pid):
    for f in filhos9.get(pid, []):
        ordem9.append(f["id"]); _visita(f["id"])
_visita(None)

FO14 = []
QREV = {}
for pid in ordem9:
    p = PX[pid]
    alvo = [pid] + [f"{pid}.{c}" for c in p.get("hipoteses") or []] + ([f"{pid}.fluxo"] if (p.get("fluxo") or {}).get("status") == "hipotese" else [])
    qid = add("perguntas", "Q", texto=f"A revisão de {COD9[pid]} {p['nome']} está aprovada?", tipo="escolha",
              opcoes=["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo: precisa ser refeito (comente)", "Retirar do mapa (comente)"],
              alvo=list(dict.fromkeys(alvo)), para=["PE-01"], rodada=8, bloco=COD9[pid].split(".")[0], status="em_formulario", formulario=None, respostas=[],
              respondida_por=[], chave="REV-" + pid, contexto=[REV[pid]["oque"]], logica="", citacoes=[], visual="", recomendo="")
    FO14.append(qid); QREV[pid] = qid
    for a in [x for x in ABERTAS if x["pid"] == pid]:
        qa = add("perguntas", "Q", texto=a["texto"], tipo=a["tipo"], opcoes=a["opcoes"], alvo=[pid], para=["PE-01"], rodada=8, bloco=COD9[pid].split(".")[0],
                 status="em_formulario", formulario=None, respostas=[], respondida_por=[], chave="DEC-" + a["chave"], contexto=a["contexto"], logica="",
                 citacoes=[], visual="", recomendo=a["recomendo"])
        FO14.append(qa); a["qid"] = qa
for r in RETIRADOS:
    qr = add("perguntas", "Q", texto=f"O processo {r['codigo']} {r['nome']} pode sair do mapa?", tipo="escolha",
             opcoes=["Sim, pode sair", "Não, deve continuar como processo (comente)"], alvo=[r["destino"]], para=["PE-01"], rodada=8, bloco="Retirados",
             status="em_formulario", formulario=None, respostas=[], respondida_por=[], chave="RET-" + r["id"], contexto=[r["motivo"], r["onde_ficou"]],
             logica="", citacoes=[], visual="", recomendo="Sim")
    FO14.append(qr); r["qid"] = qr
assert all(a.get("qid") for a in ABERTAS), [a["chave"] for a in ABERTAS if not a.get("qid")]

fo14 = add("formularios", "FO", titulo="FO-14: revisão crítica da hierarquia e arquitetura de processos (to-be v9)", rodada=8, para=["PE-01"], canal="artifact",
           perguntas=FO14, introducao="Revisão crítica de cada processo pelo método, com as decisões embutidas e as propostas de mudança.", link="https://claude.ai/artifact/PiN89dTpmBXhtz37cTS71J", status="enviado",
           respondido_por=[], respostas_recebidas=0, enviado_em=H9, prazo="", identificacao=False)
for q in d["perguntas"]:
    if q["id"] in FO14: q["formulario"] = fo14

json.dump({"rev": REV, "retirados": RETIRADOS, "abertas": ABERTAS, "mudancas": MUDANCAS, "novos": NOVOS, "ordem": ordem9, "formulario": fo14,
           "v8": {pid: {"nome": p["nome"], "codigo": V8COD.get(pid, ""), "fluxo": p.get("fluxo")} for pid, p in V8X.items()}},
          open(BASE + "/ferramentas/fo14_revisao.json", "w"), ensure_ascii=False, indent=1)

d["historico"].append({"data": H9, "evento": f"To-be v9: revisão crítica pelo método. {len(NOVOS)} processos novos, {len(RETIRADOS)} retirados ou fundidos, "
                       f"{sum(1 for m in MUDANCAS.values() if m['campos'] or m['fluxo'] or m.get('novo'))} com proposta de mudança e {len(ABERTAS)} decisões em aberto, tudo como hipótese até o FO-14"})
print("revisão:", len(d["processos"]), "processos;", len(NOVOS), "novos;", len(RETIRADOS), "retirados;", len(ABERTAS), "decisões em aberto;",
      sum(1 for p in d["processos"] if p.get("fluxo")), "com passo a passo")
