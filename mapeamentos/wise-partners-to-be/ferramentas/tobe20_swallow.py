# To-be v20 (26/11/2026): o gerente de parcerias fica com 1,5% também na Swallow, como na venda pontual da Wise.
H20 = "2026-11-26"
EV_SWALLOW = ev_raw("entrevista", "Respostas do patrocinador no Claude Code, 26/11/2026", "Swallow passa a 1,5% para o gerente de parcerias",
                    "Resposta à pergunta sobre o gerente na Swallow", pessoa="PE-01", data=H20)
ANTIGO, NOVO = "6% e 2% do projeto na Swallow", "6% e 1,5% do projeto na Swallow"
for p in d["processos"]:
    if ANTIGO in (p.get("descricao") or ""):
        p["descricao"] = p["descricao"].replace(ANTIGO, NOVO); p.setdefault("evidencias", []).append(EV_SWALLOW)
for f in d["fatos"]:
    if ANTIGO in (f.get("texto") or ""):
        f["texto"] = f["texto"].replace(ANTIGO, NOVO); f.setdefault("evidencias", []).append(EV_SWALLOW)
PX20 = {p["id"]: p for p in d["processos"]}
PX20["P-62"]["descricao"] += " Desde a mesma data, o gerente fica com 1,5% também nas vendas da Swallow (antes 2%)."
PX20["P-62"].setdefault("evidencias", []).append(EV_SWALLOW)
for q in d["perguntas"]:
    if q.get("chave") == "pendente-v19" and q["texto"].startswith("O gerente de parcerias fica com 1,5%"):
        q["status"] = "respondida"; q["respostas"] = [EV_SWALLOW]; q["respondida_por"] = ["PE-01"]
add("decisoes", "DE", data=H20, texto="O gerente de parcerias fica com 1,5% nas vendas da Swallow (antes 2%), a mesma regra da venda pontual da Wise; o parceiro continua com 6% do projeto.",
    por="PE-01", provisoria=False, evidencias=[EV_SWALLOW])
d["historico"].append({"data": H20, "evento": "To-be v20: o gerente de parcerias passa de 2% para 1,5% nas vendas da Swallow, igual à venda pontual da Wise (P-62 e a regra de comissão atualizados)."})
print("v20: Swallow 1,5%")
