# To-be v18 (26/11/2026): Ver como. O administrador e o gerente da comunidade conferem o portal como qualquer conta.
EV_VERCOMO = ev_raw("entrevista", "Pedido do patrocinador no Claude Code, 26/11/2026",
    "Preciso que você faça uma função dentro do acesso de administradores e do gerente do portal, no caso eu mesmo, para que eu possa mudar o tipo de "
    "visualização, no sentido visualizar como e daí puxar a lista de todos os possíveis acessos e para que eu possa visualizar o portal, se está funcionando",
    "Conversa de 26/11/2026, ver como", pessoa="PE-01", data="2026-11-26")
p60 = next(p for p in d["processos"] if p["id"] == "P-60")
p60["portal"] = (p60.get("portal") or "").rstrip(".") + ("; em Programa, Ver como, o administrador e o gerente abrem o portal como qualquer conta (por tipo de acesso), "
    "numa aba separada com aviso fixo e registro no histórico, para conferir o que cada pessoa vê.")
p60.setdefault("evidencias", []).append(EV_VERCOMO)
add("decisoes", "DE", data="2026-11-26", por="PE-01", provisoria=False, evidencias=[EV_VERCOMO],
    texto="O administrador e o gerente da comunidade podem ver o portal como qualquer conta, a partir da lista de todos os acessos por tipo, para conferir se está funcionando. Contas de administrador ficam de fora e cada uso fica registrado.")
d["historico"].append({"data": "2026-11-26", "evento": "To-be v18: Ver como em Programa, para o administrador e o gerente conferirem o portal como cada tipo de acesso."})
print("v18: ver como")
