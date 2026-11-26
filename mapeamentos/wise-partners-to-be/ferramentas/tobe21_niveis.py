# To-be v21 (26/11/2026): a hierarquia antiga sai do portal inteiro. Os benefícios seguem o nível (Select, Premium, Elite):
# entregas da Wise, Wise Hub, tarefas de onboarding, contrapartidas, ações da Wise, régua de atendimento e Base Ativa (Elite).
H21 = "2026-11-26"
EV_NIVEIS21 = ev_raw("entrevista", "Pedido do patrocinador no Claude Code, 26/11/2026",
                     "Existe um problema: Estamos considerando a hierarquização antiga dos parceiros, que continha as prateleiras (A, B e C). "
                     "Retire qualquer menção disso do portal inteiro", "Pedido sobre a hierarquia antiga", pessoa="PE-01", data=H21)
PX21 = {p["id"]: p for p in d["processos"]}
def troca21(campo_valor, antigo, novo):
    return campo_valor.replace(antigo, novo) if isinstance(campo_valor, str) else [x.replace(antigo, novo) if isinstance(x, str) else x for x in campo_valor]
for p in d["processos"]:
    mudou = False
    for campo in ("descricao", "saidas", "entradas", "regras", "portal"):
        v = p.get(campo)
        if not v: continue
        novo = troca21(v, "Tabela de níveis e pacotes", "Tabela de níveis e benefícios")
        novo = troca21(novo, "Só destaques e pacotes B e A", "Só destaques e níveis Premium e Elite")
        novo = troca21(novo, " Os pacotes saem e os benefícios seguem o nível.", " Os benefícios seguem o nível.")
        if novo != v: p[campo] = novo; mudou = True
    if mudou: p.setdefault("evidencias", []).append(EV_NIVEIS21)
for c in d["contradicoes"]:
    if "pacote" in (c.get("resolucao") or "").lower() and "Superado em 26/11/2026" not in c["resolucao"]:
        c["resolucao"] += " Superado em 26/11/2026: a hierarquia antiga saiu do portal; os benefícios seguem o nível (Select, Premium, Elite)."
        c.setdefault("evidencias_resolucao", []).append(EV_NIVEIS21)
add("decisoes", "DE", data=H21, texto="A hierarquia antiga sai do portal inteiro: os benefícios seguem o nível (Select, Premium, Elite). Entregas da Wise, Wise Hub, "
    "tarefas de onboarding, contrapartidas, ações da Wise, régua de atendimento e Base Ativa (Elite) dependem só do nível; na mudança de nível, entra o que falta "
    "e sai o que não vale. O contrato comercial passa a descrever os benefícios por nível.", por="PE-01", provisoria=False, evidencias=[EV_NIVEIS21])
d["historico"].append({"data": H21, "evento": "To-be v21: hierarquia antiga fora do portal; benefícios, contrapartidas, ações da Wise, régua e contrato seguem o nível."})
print("v21: benefícios por nível")
