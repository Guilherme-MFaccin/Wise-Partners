# Gera a página da Rodada 4 (divergências entre livros e decisões, painel com o Igor, Never Eat Alone).
import json, html, re, textwrap, math
_src = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo03_pagina.py").read().splitlines()
exec("\n".join(_src[8:24]))   # box, seta, txt, svg
T = json.load(open("/home/user/mapeamentos/wise-partners-to-be/mapa.json"))
EV = {e["id"]: e for e in T["evidencias"]}
FO = next(f for f in T["formularios"] if f["titulo"].startswith("Rodada 4"))
SAIDA = "/home/user/mapeamentos/wise-partners/formularios/FO-06/formulario.artifact.html"
esc = html.escape

def bloco(x, y, w, titulo, texto, cls, n=30, destaque=False):
    linhas = textwrap.wrap(texto, n)
    h = 40 + len(linhas) * 16
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" class="{cls}"/>', txt(x + 14, y + 24, titulo, 12, cls="tx", bold=True)]
    for i, l in enumerate(linhas):
        out.append(txt(x + 14, y + 46 + i * 16, l, 11.5, cls="tx" if destaque else "mu"))
    return "".join(out), h

def balanca(decisao, meio, livros, rotulo_meio="Meio-termo recomendado"):
    c1, h1 = bloco(4, 10, 210, "Sua decisão", decisao, "b2")
    c2, h2 = bloco(225, 10, 210, rotulo_meio, meio, "b hi", destaque=True)
    c3, h3 = bloco(446, 10, 210, "O que os livros dizem", livros, "b")
    h = max(h1, h2, h3) + 24
    return svg(660, h, c1 + c2 + c3, "Sua decisão, meio-termo e livros")

V = {}
V["ct_cac"] = balanca("O CAC do Wise Partners decide tudo, desde o primeiro trimestre.",
                      "CAC continua a métrica-mãe. Na Experimentação os portões medem comportamento; o CAC decide a partir da Tração, quando há dados.",
                      "Valor ao parceiro vem antes da captura; dar esperando retorno rápido não funciona; comunidade rende depois de 6 a 12 meses.")
V["ct_comissao"] = balanca("Comissão em dinheiro, igual para todos, paga só quando o cliente entra.",
                           "Dinheiro igual para todos; o não monetário varia por tipo; regra revista com dois trimestres de dados de permanência.",
                           "Dinheiro sozinho é motivação fraca e passageira; premiar também permanência e comportamento.")
V["ct_closer"] = balanca("Lead direto ao closer; conversa só quando há indicação ou proposta nova.",
                         "Closer avisa por WhatsApp quando a etapa muda; o portal alerta a oportunidade parada há 15 dias.",
                         "Quem indicou precisa saber de cada etapa; cada passagem tem registro e sinal que vira ação.")
V["ct_pilares"] = balanca("Prateleira, Base Ativa e indicações abertas para todos desde o início.",
                          "Os três abertos, Base Ativa com 2 ou 3 pilotos; cada parceiro começa pela porta que escolher.",
                          "Provar valor em escala pequena antes de abrir tudo; não ativar todos de uma vez.")
V["ct_dono"] = balanca("O Gerente é dono de todas as tarefas, sem limite.",
                       "Dono único com teto de parceiros de atenção alta; na Tração, parceiros embaixadores com roteiro.",
                       "Octo e Customer Success: dono único no início. Belonging e Give and Take: distribuir para não esgotar.")
V["ct_niveis"] = balanca("Especificação: Elite, Premium ou Select na entrada, pela base de clientes declarada.",
                         "A base sugere o nível, mas o pacote só abre depois da ativação.",
                         "Bech: começar simples e diferenciar pelo desempenho real; senão, rebaixar depois.")
V["ct_placar"] = balanca("Rodada 3: o equilíbrio entre dar e receber entra no cubo e fica visível.",
                         "Medido só por dentro, para o cubo; o parceiro vê o dar, nunca o saldo.",
                         "Give and Take: dar visível. Never Eat Alone: dar primeiro e nunca manter placar.", "Meio-termo que concilia os dois")
# painel da semana: esboço
c = [txt(8, 18, "Painel da semana", 13, cls="tx", bold=True), txt(652, 18, "Parte de cima: até 5 números, sempre os mesmos", 11, "end")]
for i, (r, v) in enumerate([("CAC do trimestre", "tendência"), ("Parceiros ativos", "novos, em risco"), ("Oportunidades", "por etapa, paradas"), ("Clientes e receita", "no trimestre"), ("Próximo portão", "distância")]):
    x = 6 + i * 131
    c += [f'<rect x="{x}" y="30" width="124" height="62" rx="8" class="b"/>', txt(x + 10, 52, r, 11, cls="tx", bold=True), txt(x + 10, 72, v, 10.5)]
c += [txt(8, 120, "Lista de casos da semana", 13, cls="tx", bold=True), txt(652, 120, "Parte de baixo: caso a caso, com a decisão", 11, "end")]
for i, (q, mot, jog) in enumerate([("Parceiro A", "mudou para Âncora esfriando", "levar oportunidade pronta"), ("Oportunidade B", "parada há 18 dias", "perguntar ao closer"),
                                   ("Parceiro C", "90 dias sem ativar", "estender ou encerrar")]):
    y = 132 + i * 34
    c += [f'<rect x="6" y="{y}" width="648" height="28" rx="6" class="{"b" if i % 2 == 0 else "b2"}"/>', txt(16, y + 18, q, 11.5, cls="tx", bold=True),
          txt(170, y + 18, mot, 11.5), txt(420, y + 18, "jogada: " + jog, 11.5, cls="tx")]
c.append(txt(8, 254, "Nomes e números ilustrativos. A decisão de cada caso fica registrada no portal.", 11))
V["painel"] = svg(660, 264, "".join(c), "Esboço do painel da semana")
# voz do Igor
c = [box(10, 24, 190, 50, ["Igor: termo e aviso", "(assina)"], "b2", 11), box(235, 24, 190, 50, ["Igor e Gerente:", "painel semanal"], "b2", 11),
     box(460, 24, 190, 50, ["Igor para os parceiros:", "a voz do programa?"], "b hi", 11, True), seta(200, 49, 233, 49), seta(425, 49, 458, 49),
     txt(10, 100, "O que já está decidido, em cinza; a pergunta, em azul.", 11)]
V["igor_voz"] = svg(660, 110, "".join(c), "Papel do Igor")
# formações da Tríade
c = [box(10, 24, 200, 54, ["Aberto a todos", "os ativos"], "b", 12), box(230, 24, 200, 54, ["Aberto a todos,", "vagas para destaques"], "b", 12), box(450, 24, 200, 54, ["Acesso de", "reconhecimento"], "b", 12),
     txt(110, 100, "pertencimento", 11, "middle"), txt(330, 100, "os dois", 11, "middle"), txt(550, 100, "norma social como prêmio", 11, "middle")]
V["triade"] = svg(660, 112, "".join(c), "Formações internas da Tríade")
# cadência
c = ['<circle cx="120" cy="120" r="34" class="b hi"/>', '<circle cx="120" cy="120" r="70" class="vazio"/>', '<circle cx="120" cy="120" r="104" class="vazio"/>',
     txt(120, 124, "mensal", 11, "middle", "tx", True), txt(120, 70, "trimestral", 11, "middle"), txt(120, 34, "2 a 3 por ano", 11, "middle")]
for k, (t1, t2) in enumerate([("Atenção alta", "contato todo mês"), ("Demais ativos", "contato a cada trimestre"), ("Candidatos e ex-parceiros", "duas a três vezes por ano"),
                              ("Depois de cada reunião", "retorno em até 24 horas"), ("Todo contato", "leva algo de valor")]):
    y = 26 + k * 40
    c += [txt(260, y, t1, 12, cls="tx", bold=True), txt(260, y + 16, t2, 11.5)]
V["nea_cadencia"] = svg(660, 236, "".join(c), "Cadência de contato por importância")
# ponte: estrela contra rede
c = [txt(110, 18, "Hoje: centro e raios", 12, "middle", "tx", True), txt(470, 18, "Com a ponte: rede", 12, "middle", "tx", True)]
pts = [(110 + 70 * math.cos(a), 110 + 70 * math.sin(a)) for a in [i * 2 * math.pi / 6 for i in range(6)]]
for x, y in pts:
    c += [f'<line x1="110" y1="110" x2="{x:.0f}" y2="{y:.0f}" class="ln fino"/>', f'<circle cx="{x:.0f}" cy="{y:.0f}" r="11" class="b"/>']
c.append('<circle cx="110" cy="110" r="18" class="b hi"/>'); c.append(txt(110, 114, "Wise", 10, "middle", "tx", True))
pts2 = [(470 + 70 * math.cos(a), 110 + 70 * math.sin(a)) for a in [i * 2 * math.pi / 6 for i in range(6)]]
for i, (x, y) in enumerate(pts2):
    c.append(f'<line x1="470" y1="110" x2="{x:.0f}" y2="{y:.0f}" class="ln fino"/>')
    x2, y2 = pts2[(i + 2) % 6]
    if i % 2 == 0: c.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" class="ln dash"/>')
for x, y in pts2: c.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="11" class="b"/>')
c.append('<circle cx="470" cy="110" r="18" class="b hi"/>'); c.append(txt(470, 114, "Wise", 10, "middle", "tx", True))
c.append(txt(330, 214, "Tracejado: parceiros apresentados entre si pela Wise, em torno de uma oportunidade.", 11, "middle"))
V["nea_ponte"] = svg(660, 224, "".join(c), "Da estrela à rede")

itens = []
for qid in FO["perguntas"]:
    q = next(x for x in T["perguntas"] if x["id"] == qid)
    cits = []
    for e in q.get("citacoes", []):
        ev = EV[e]; fonte = ev["fonte"].split(" (")[0].split(":")[0]
        pag = ev["local"].split(" (")[0].replace("secao", "seção")
        cits.append({"livro": fonte, "pagina": pag, "trecho": ev["trecho"]})
    logica = q["logica"] + (f" Minha recomendação: {q['recomendo']}." if q.get("recomendo") else "")
    itens.append({"id": "R4-" + qid, "bloco": q["bloco"], "texto": q["texto"], "tipo": q["tipo"], "opcoes": q["opcoes"],
                  "contexto": q["contexto"], "logica": logica, "citacoes": cits, "visual": V[q["visual"]]})
json.dump(itens, open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo04_itens.json", "w"), ensure_ascii=False, indent=1)
pagina = open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/fo04_modelo.html", encoding="utf-8").read()
dados = json.dumps(itens, ensure_ascii=False).replace("</", "<\\/")
pagina = pagina.replace("__DADOS__", dados).replace("__TOTAL__", str(len(itens)))
assert "—" not in pagina and "–" not in pagina
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(itens), "perguntas na página")
