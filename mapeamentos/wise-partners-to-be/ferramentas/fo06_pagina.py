# Gera a página da Rodada 6 (conversa com o Igor de 04/11 e primeira entrega do portal).
import json, html, textwrap
_src = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo03_pagina.py").read().splitlines()
esc = html.escape
exec("\n".join(_src[8:24]))   # box, seta, txt, svg
T = json.load(open("/home/user/mapeamentos/wise-partners-to-be/mapa.json"))
EV = {e["id"]: e for e in T["evidencias"]}
FO = next(f for f in T["formularios"] if f["titulo"].startswith("Rodada 6"))
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"

def w(t, n=18): return textwrap.wrap(t, n)[:4]
def cadeia(itens, destaque=(), legenda=""):
    n = len(itens); gap = 18; bw = (648 - gap * (n - 1)) / n
    c = []
    for i, t in enumerate(itens):
        x = 6 + i * (bw + gap)
        c.append(box(x, 14, bw, 78, w(t, int(bw / 7)), "b hi" if i in destaque else "b", 11, i in destaque))
        if i < n - 1: c.append(seta(x + bw, 53, x + bw + gap - 2, 53))
    if legenda: c.append(txt(6, 118, legenda, 11))
    return svg(660, 128 if legenda else 104, "".join(c), "Cadeia")
def colunas(itens, destaque=(), legenda=""):
    n = len(itens); gap = 12; bw = (648 - gap * (n - 1)) / n
    c = []
    for i, (tit, sub) in enumerate(itens):
        x = 6 + i * (bw + gap)
        c.append(box(x, 14, bw, 50, w(tit, int(bw / 7)), "b hi" if i in destaque else "b", 11.5, True))
        for k, l in enumerate(w(sub, int(bw / 6.2))): c.append(txt(x + bw / 2, 84 + k * 15, l, 11, "middle"))
    if legenda: c.append(txt(6, 160, legenda, 11))
    return svg(660, 170 if legenda else 150, "".join(c), "Opções")

V = {}
V["valor_saas"] = cadeia(["Wise melhora o processo comercial do cliente", "Cliente usa melhor o software", "Cliente renova o contrato", "Parceiro retém a base", "Wise ganha oportunidade no ICP"], (0, 3),
                         "A entrega da Wise passa a fazer parte do processo do parceiro, não só da indicação.")
V["diagnostico"] = cadeia(["Parceiro ganha cliente novo", "Convite com o link do parceiro", "Diagnóstico de 40 a 60 min", "Mapa de planejamento e acesso ao Hub", "Oportunidade, se o cliente quiser"], (2,),
                          "Quinta porta de oportunidade, ao lado de link, Prateleira, cruzamento de carteiras e Base Ativa.")
c = [txt(6, 20, "Capacidade com um diagnóstico por dia", 12, cls="tx", bold=True)]
for i, (rot, val, mx) in enumerate([("Por semana", 5, 60), ("Por mês", 20, 60), ("Até março (pesquisa)", 50, 60)]):
    y = 40 + i * 34
    c += [txt(6, y + 15, rot, 11.5, cls="tx"), f'<rect x="170" y="{y}" width="{460 * val / mx:.0f}" height="22" rx="5" class="barra1"/>', txt(176 + 460 * val / mx, y + 15, str(val), 11.5, cls="tx", bold=True)]
c.append(txt(6, 150, "Cada diagnóstico custa cerca de uma hora de alguém da Wise, contando preparo e registro.", 11))
V["quem_diagnostica"] = svg(660, 160, "".join(c), "Capacidade de diagnósticos")
V["hub"] = colunas([("Depois de um contato", "diagnóstico para o cliente do parceiro; pacote B para a base dele"), ("Aberto a toda a base", "benefício solto, como publicidade"), ("Só pelo pacote B", "como no Playbook v3.1")], (0,),
                   "Plataforma de aulas sozinha gera pouco engajamento; o contato antes dá ao cliente um motivo para usar.")
c = [box(6, 14, 200, 70, ["Pesquisa", "50 entrevistas até março"], "b", 12, True), box(230, 14, 200, 70, ["Cliente do parceiro", "diagnóstico e acesso ao Hub"], "b hi", 12, True),
     box(454, 14, 200, 70, ["Wise", "contato com empresas no ICP"], "b", 12, True),
     box(6, 104, 648, 50, ["Termo de consentimento: separa o uso científico dos dados do contato comercial;", "o cliente pode participar da pesquisa sem receber contato comercial depois"], "b2", 11.5)]
V["pesquisa"] = svg(660, 164, "".join(c), "Pesquisa, cliente e Wise")
V["resumo_parceiro"] = colunas([("Com autorização", "detalhe do cliente, se ele autorizar no agendamento"), ("Agregado", "padrão da base, sem identificar ninguém"), ("Não compartilhar", "o resultado é só do cliente")], (),
                               "Regra de dados do programa: só dados de empresa, com consentimento.")
V["comissao_diag"] = cadeia(["Cliente marca pelo link do parceiro", "Diagnóstico", "Cliente contrata a Wise", "Comissão da regra única ao parceiro"], (3,),
                            "Playbook v3.1, seção 6.5: comissiona quem gerou o primeiro contato registrado.")
V["convite_kit"] = colunas([("Página e vídeo", "o que é o diagnóstico e o que o cliente leva"), ("Mensagem pronta", "com o link do parceiro"), ("Agenda online", "o cliente marca sozinho"), ("Texto de entrada", "no processo do parceiro")], (3,))
c = ['<line x1="40" y1="44" x2="620" y2="44" class="ln"/>']
for i, (quando, o) in enumerate([("Semana 1", "anúncio conjunto"), ("Mês 1", "treinamento do time e primeiros diagnósticos"), ("Mês 2", "divulgação à base"), ("Mês 3", "encontro com a base e oportunidades")]):
    x = 40 + i * 193
    c += [f'<circle cx="{x}" cy="44" r="8" class="pt"/>', txt(x, 24, quando, 12, "middle", "tx", True)]
    for k, l in enumerate(w(o, 26)): c.append(txt(x, 70 + k * 15, l, 11, "middle"))
c.append(txt(6, 130, "Vale para todos os pacotes; a Base Ativa continua só no pacote A.", 11))
V["ativacao"] = svg(660, 140, "".join(c), "Plano de ativação de 90 dias")
V["foco"] = colunas([("Software de gestão", "CRM e ERP à frente"), ("Só CRM", "a dor mais próxima da Wise"), ("Gestão de manutenção", "exemplo citado na conversa"), ("Sem foco", "todas as categorias")], (0,),
                    "Agências ficam fora nesta fase: concorrem com a Wise.")
V["categorias"] = colunas([("21 categorias comerciais", "de ERP e CRM a jurídico, tributário e RH"), ("9 categorias institucionais", "de federações e Sistema S a universidades")], (),
                          "A lista completa está no texto abaixo.")
c = ['<circle cx="330" cy="120" r="54" class="b hi"/>', txt(330, 114, "Núcleo", 13, "middle", "tx", True), txt(330, 134, "card, jornada,", 10, "middle", "tx"), txt(330, 147, "portas e fila", 10, "middle", "tx"),
     '<circle cx="330" cy="120" r="104" class="vazio"/>']
for (x, y, t) in [(70, 40, "Painel da semana"), (590, 40, "Área do parceiro"), (70, 200, "Diagnóstico"), (590, 200, "Ativação de 90 dias")]:
    c.append(box(x - 70, y - 16, 140, 32, [t], "b", 11))
c.append(txt(330, 244, "Cubo, cadência e comunidade podem vir na entrega seguinte.", 11, "middle"))
V["portal_escopo"] = svg(660, 254, "".join(c), "Primeira entrega do portal")
V["igor_portal"] = colunas([("Painel e casos", "só leitura"), ("Painel e assinaturas", "assina pelo portal"), ("Fora do portal", "você mostra na conversa")], ())

itens = []
for qid in FO["perguntas"]:
    q = next(x for x in T["perguntas"] if x["id"] == qid)
    cits = []
    for e in q.get("citacoes", []):
        ev = EV[e]; fonte = ev["fonte"].split(" (")[0].split(":")[0]
        pag = ev["local"].split(" (")[0].replace("secao", "seção")
        cits.append({"livro": fonte, "pagina": pag, "trecho": ev["trecho"]})
    logica = q["logica"] + (f" Minha recomendação: {q['recomendo']}." if q.get("recomendo") else "")
    itens.append({"id": "R6-" + qid, "bloco": q["bloco"], "texto": q["texto"], "tipo": q["tipo"], "opcoes": q["opcoes"],
                  "contexto": q["contexto"], "logica": logica, "citacoes": cits, "visual": V[q["visual"]]})
json.dump(itens, open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo06_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo06_modelo.html", encoding="utf-8").read()
pagina = pagina.replace("__DADOS__", json.dumps(itens, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(itens)))
assert "—" not in pagina and "–" not in pagina
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(itens), "perguntas na página")
