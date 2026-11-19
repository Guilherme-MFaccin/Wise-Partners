# Aprovação da revisão crítica (18/11/2026). Executado dentro de tobe11_base.py, depois de tobe11_rev9.py.
# 16 itens do FO-14 foram respondidos pelo patrocinador; para todo o resto ele pediu, no chat, que as recomendações fossem aprovadas.
# A única decisão sem recomendação (como o Wise Hub recebe a marca do parceiro) continua aberta: é um fato a apurar, não uma escolha.
H10 = "2026-11-18"
R14 = {os.path.basename(f)[:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-14/fo19_itens/R14-*.json")}
EV_BLOCO = ev_raw("validacao", "Aprovação das recomendações do FO-14, no chat",
                  "Preciso que você siga aprovando todas as tuas recomendações sem distinção. Acabei ficando sem tempo para validar tudo",
                  "chat de 18/11/2026", pessoa="PE-01", data=H10)
_ev14 = {}
def EV14(iid):
    if iid not in R14: return EV_BLOCO
    if iid not in _ev14:
        _ev14[iid] = ev_raw("validacao", "FO-14: revisão crítica dos processos", _texto(R14[iid]), f"FO-14/{iid}", pessoa="PE-01", data=H10)
    return _ev14[iid]

# escolha aplicada a cada decisão em aberto: a resposta do patrocinador, se houver; senão, a recomendação
REC = {"criterio_premium": 0, "empresas_grupo": 1, "termo_versao": 0, "portoes": 1, "pulso_select": 0, "campanha_dono": 0, "aviso_descarte": 2,
       "conversa_duracao": 1, "no_show": 0, "tentativas": 0, "certificado": 0, "anuncio": 0, "limite_lembrete": 1, "adormecido": 0, "ja_cliente": 0,
       "base_ativa_formato": 0, "base_ativa_repete": 1, "comunidade_select": 0, "saida_oportunidades": 2, "suspensao_revisao": 0}
SEM_REC = {"hub_marcas"}
ESCOLHA = {}
for a in ABERTAS:
    if a["chave"] in SEM_REC: continue
    iid = "R14-DEC-" + a["chave"]
    ESCOLHA[a["chave"]] = (R14[iid]["valor"] if iid in R14 else a["opcoes"][REC[a["chave"]]], EV14(iid))

def addev(obj, e):
    if e not in obj.setdefault("evidencias", []): obj["evidencias"].append(e)

# ---------------------------------------------------------------- 1. o que cada decisão muda no mapa
def acrescenta(pid, frase, chave):
    p = PX[pid]; desc, _, pt = p["descricao"].partition(" No portal: ")
    p["descricao"] = desc.rstrip() + " " + frase + (" No portal: " + pt if pt else "")
    addev(p, ESCOLHA[chave][1])

acrescenta("P-61", "A subida ao Premium exige os 60 dias e, além disso, 3 clientes fechados ou a avaliação.", "criterio_premium")
acrescenta("P-62", "O parceiro Select indica só a Wise Makers; Premium e Elite indicam as três empresas do grupo.", "empresas_grupo")
acrescenta("P-89", "O kit e o simulador do Select mostram só a Wise Makers; os de Premium e Elite, as três empresas.", "empresas_grupo")
acrescenta("P-88", "O minicurso do Select é só da Wise Makers; as trilhas da Tríade e da Swallow abrem no Premium.", "empresas_grupo")
acrescenta("P-64", "Quando a versão muda, o portal pede o aceite da versão nova no próximo acesso, depois dos 30 dias de aviso.", "termo_versao")
acrescenta("P-07", "Os portões continuam como estão e são revistos no próximo fechamento trimestral, com os números reais da campanha.", "portoes")
acrescenta("P-17", "O Gerente responde sobre os Premium e Elite; para o Select vale só a nota do parceiro.", "pulso_select")
addev(PX[P98], ESCOLHA["campanha_dono"][1])
acrescenta("P-22", "Quem chegou a trocar mensagens e não passa recebe uma mensagem curta e respeitosa, sem o motivo; quem foi barrado na conferência do cadastro não recebe nada.", "aviso_descarte")
acrescenta("P-23", "A conversa dura 45 minutos. Na primeira falta, o Gerente oferece um novo horário; na segunda, o cadastro sai da fila.", "conversa_duracao")
addev(PX["P-23"], ESCOLHA["no_show"][1])
acrescenta("P-25", "São 3 mensagens em 7 dias úteis: a primeira e mais duas.", "tentativas")
acrescenta("P-27", "O certificado de parceiro sai quando o parceiro conclui o minicurso.", "certificado")
acrescenta("P-94", "O certificado sai na conclusão do minicurso. O anúncio conjunto é publicado pelo parceiro, com a arte e o texto prontos do kit; a Wise cita os novos parceiros no comunicado do mês.", "certificado")
addev(PX["P-94"], ESCOLHA["anuncio"][1])
PX["P-97"]["gatilho"] = "Parceiro há 14 dias na mesma etapa"
acrescenta("P-97", "O lembrete sai depois de 14 dias na mesma etapa. Depois de 3 lembretes sem avanço, o parceiro fica adormecido: mantém o acesso, para de receber lembretes, sai das contas de parceiros ativos e volta sozinho se um cliente se cadastrar pelo link.", "limite_lembrete")
addev(PX["P-97"], ESCOLHA["adormecido"][1])
f97 = PX["P-97"]["fluxo"]
f97["nos"][0]["nome"] = "Parceiro há 14 dias na mesma etapa"
acrescenta("P-95", "Se a empresa já é cliente da Wise ou já negocia com ela, o portal identifica no cadastro: a empresa é atendida normalmente, mas sem proteção de origem nem comissão, e o parceiro é avisado na hora.", "ja_cliente")
acrescenta("P-44", "O Base Ativa é só a formação: o método antigo de 12 semanas sai. Cada Elite tem uma formação por ano.", "base_ativa_formato")
addev(PX["P-44"], ESCOLHA["base_ativa_repete"][1])
acrescenta("P-47", "Não há grupo geral de parceiros: cada parceiro tem o próprio grupo com a Wise, e o que é de todos vai pelo comunicado e pelo encontro trimestral. Um grupo geral só de Premium e Elite pode ser aberto quando houver Premium suficiente.", "comunidade_select")
acrescenta("P-56", "Oportunidades em negociação: na saída a pedido, a proteção de 180 dias continua valendo e a comissão é paga se o cliente fechar no prazo; no desligamento por descumprimento do termo, não.", "saida_oportunidades")
acrescenta("P-57", "A proteção de 180 dias das oportunidades em negociação continua valendo depois da saída.", "saida_oportunidades")
acrescenta(P99, "A suspensão é revista a cada fechamento trimestral: a recomendação volta se o cliente disser que o problema foi resolvido e não houver novo problema.", "suspensao_revisao")

# ---------------------------------------------------------------- 2. ajuste do patrocinador: "regra de comissão", não "regra única"
COMISSAO_EV = EV14("R14-P-62")
TROCAS = [("regra única de comissão", "regra de comissão"), ("Regra única de comissão", "Regra de comissão"),
          ("comissão por regra única", "comissão pela regra de comissão"), ("comissão da regra única", "comissão pela regra de comissão"),
          ("pela regra única", "pela regra de comissão"), ("Regra única:", "Regra de comissão:"), ("Comissão por regra única, sem exceção", "Comissão por uma regra geral, igual para todos nesta fase"),
          ("A comissão é regra única, sem exceção por parceiro.", "A comissão segue uma regra geral, igual para todos nesta fase."),
          ("a comissão é a regra única", "a comissão segue a regra de comissão"), ("Regra única de comissão", "Regra de comissão"),
          ("regra única", "regra de comissão")]
def troca(t):
    for a, b in TROCAS: t = t.replace(a, b)
    return t
for p in d["processos"]:
    for c in ("nome", "descricao", "portal"):
        if p.get(c) and "regra única" in p[c].lower().replace("Regra", "regra"):
            p[c] = troca(p[c]); addev(p, COMISSAO_EV)
    for n in (p.get("fluxo") or {}).get("nos", []):
        n["nome"] = troca(n["nome"])
for f in d["fatos"]:
    if "regra única" in f["texto"].lower():
        f["texto"] = troca(f["texto"]); addev(f, COMISSAO_EV)
for x in d["decisoes"]:
    if "regra única" in x["texto"].lower():
        x["texto"] = troca(x["texto"])
d["organizacao"]["descricao"] = troca(d["organizacao"]["descricao"])
for p in d["processos"]:
    p["regras"] = [troca(r) if isinstance(r, str) else r for r in p.get("regras") or []]
for g in d.get("glossario", []):
    if "regra única" in g.get("definicao", ""): g["definicao"] = troca(g["definicao"])
PX["P-62"]["nome"] = "Fixar a regra de comissão e a contrapartida da Prateleira"
_desc, _, _pt = PX["P-62"]["descricao"].partition(" No portal: ")
PX["P-62"]["descricao"] = _desc + " Nesta fase (MVP), a regra é geral e igual para todos; com o tempo podem surgir regras específicas por caso, sempre publicadas com 30 dias de aviso." + (" No portal: " + _pt if _pt else "")

# entradas que a revisão deixou vazias
LIGA("P-61", "Mudança de nível ou benefício que afeta o termo", "P-64"); LIGA("P-62", "Mudança na regra de comissão", "P-64")
LIGA("P-48", "Objetivo da comunidade", "P-84"); LIGA("P-48", "Objetivo da comunidade", "P-85"); LIGA("P-18", "Parceiros Premium e Elite", "P-85")

# ---------------------------------------------------------------- 3. decisões registradas
for texto, evs in [
    ("A revisão crítica do to-be (v9) foi aprovada: 16 itens respondidos no FO-14 e, para os demais, as recomendações da revisão, a pedido do patrocinador.", [EV_BLOCO] + list(_ev14.values())),
    ("A comissão segue uma regra geral, igual para todos nesta fase (MVP). Com o tempo, podem surgir regras específicas por caso; por isso o mapa fala em 'regra de comissão', não em 'regra única'.", [COMISSAO_EV]),
] + [(f"{a['texto']} {troca(ESCOLHA[a['chave']][0])}.", [ESCOLHA[a["chave"]][1]]) for a in ABERTAS if a["chave"] in ESCOLHA]:
    add("decisoes", "DE", data=H10, texto=texto.replace("?.", "?").replace(" ?", "?"), por="PE-01", provisoria=False, evidencias=evs)

# ---------------------------------------------------------------- 4. tudo o que era proposta vira confirmado
for p in d["processos"]:
    pid = p["id"]
    ev = EV14("R14-" + pid)
    p["status"] = "confirmado"; p["hipoteses"] = []
    addev(p, ev)
    fl = p.get("fluxo")
    if fl and fl.get("status") == "hipotese":
        fl["status"] = "confirmado"; fl["evidencias"] = list(dict.fromkeys((fl.get("evidencias") or []) + [ev]))
for cv in d["cadeias_de_valor"]:
    addev(cv, EV14("R14-jornadas"))
for pa in d["papeis"]:
    if pa["id"] in (CAND, CONSUL): addev(pa, EV14("R14-papeis"))

# a única decisão sem recomendação fica aberta para o próximo formulário
PX["P-27"]["hipoteses"] = ["descricao"]
for q in d["perguntas"]:
    if q["id"] not in FO14: continue
    ch = q.get("chave", "")
    if ch == "DEC-hub_marcas":
        q["status"] = "aberta"; q["formulario"] = None; q["alvo"] = ["P-27.descricao"]; q["rodada"] = 9
        continue
    iid = "R14-" + (ch[4:] if ch.startswith("REV-") else ch)
    q["status"] = "respondida"; q["respostas"] = [EV14(iid)]; q["respondida_por"] = ["PE-01"]
for fo in d["formularios"]:
    if fo["id"] == fo14:
        fo["status"] = "respondido"; fo["respondido_por"] = ["PE-01"]; fo["respostas_recebidas"] = 1
        fo["perguntas"] = [x for x in fo["perguntas"] if next(q for q in d["perguntas"] if q["id"] == x).get("chave") != "DEC-hub_marcas"]

d["historico"].append({"data": H10, "evento": f"To-be v10: revisão crítica aprovada. {len(R14)} itens respondidos no FO-14 (com o ajuste 'regra de comissão' no lugar de 'regra única'); "
                       f"os demais aprovados pela recomendação, a pedido do patrocinador. {len(ESCOLHA)} decisões aplicadas; fica aberta só a forma de entregar o Wise Hub com as duas marcas."})
json.dump({k: {"escolha": v[0], "fonte": "resposta" if ("R14-DEC-" + k) in R14 else "recomendação aprovada"} for k, v in ESCOLHA.items()},
          open(BASE + "/respostas/FO-14/decisoes_aplicadas.json", "w"), ensure_ascii=False, indent=1)
print("aprovação:", len(R14), "respondidos;", len(ESCOLHA), "decisões aplicadas;", sum(1 for q in d["perguntas"] if q["status"] == "aberta"), "perguntas abertas")
