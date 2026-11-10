# Revisão crítica, parte 5: ajustes que atravessam os macroprocessos.
for cv in d["cadeias_de_valor"]:
    if cv["id"] == "CV-01":
        cv["gatilho"] = "Campanha de aquisição no ar"
        cv["etapas"][0]["processos"] = ["P-20"]
    if cv["id"] == "CV-02":
        cv["gatilho"] = "Cliente do parceiro se cadastra pelo link, ou outra porta gera uma oportunidade"
        cv["etapas"][0]["nome"] = "Diagnosticar o cliente do parceiro (porta principal)"
LIGA("P-95", "Cliente cadastrado pelo link", "P-30"); LIGA("P-95", "Clientes e diagnósticos pelo link", "P-66")
