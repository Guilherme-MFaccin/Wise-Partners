# Junta o modelo de negócio ao mapa interativo do to-be: a primeira aba passa a ser "Modelo de negócio", antes das visões de processos.
# Roda depois de `mapa.py renderizar`. Gera saidas/modelo-e-processos.html (para o portal) e atualiza os dois mapas interativos.
import re, sys, os

BASE = "/home/user/mapeamentos/wise-partners-to-be"
MN = open(BASE + "/saidas/modelo-de-negocio/index.html", encoding="utf-8").read()

estilo = MN[MN.index("<style>") + 7:MN.index("</style>")]
corpo = MN[MN.index('<div class="wrap">'):MN.index("<script>")]
script = MN[MN.index("<script>") + 8:MN.index("</script>")]

# estilos do modelo valem só dentro de .mn (aninhamento de CSS), com os tokens de tema no próprio .mn
estilo = re.sub(r"/\*.*?\*/", "", estilo, flags=re.S)
estilo = estilo.replace(":root:not([data-theme=\"light\"]) {", ":root:not([data-theme=\"light\"]) & {")
estilo = estilo.replace(":root[data-theme=\"dark\"] {", ":root[data-theme=\"dark\"] & {")
estilo = re.sub(r"(^|\n):root \{", r"\1& {", estilo)
estilo = re.sub(r"(^|\n)body \{", r"\1& {", estilo)
estilo = ".mn {\n" + estilo + "\n}\n.mn { background: transparent; } .mn .wrap { padding-left: 0; padding-right: 0; padding-block: 8px 24px; }\n"

# navegação interna do modelo sem mexer no hash do mapa (que escolhe a aba)
corpo = re.sub(r'<a href="#([a-z-]+)">', r'<a href="#modelo" data-ir="\1">', corpo)
corpo = re.sub(r'<p class="nota">Mapa de processos \(separado\).*?</p>', '<p class="nota">Fontes do modelo: Business Model Generation, Value Proposition Design, Testing Business Ideas (até a p. 64) e The Invincible Company (até a p. 62).</p>', corpo, flags=re.S)
corpo = corpo.replace("Este quadro é separado do mapa de processos, como você decidiu no FO-16. Ele usa", "Esta aba vem antes dos processos. Ela usa")
script = script.replace("if (document.getElementById('conta')) window.iniciarModelo(document);", "")

FONTES = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap">\n'
TEMPLATE = f'<template id="tpl-modelo"><div class="mn">{corpo}</div></template>\n'
JS_NAV = """
document.addEventListener('click', function (ev) {
  var a = ev.target.closest('.mn [data-ir]'); if (!a) return;
  ev.preventDefault(); var alvo = document.getElementById(a.getAttribute('data-ir')); if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
"""

def juntar(caminho):
    s = open(caminho, encoding="utf-8").read()
    if 'id="tpl-modelo"' in s:
        print("já junto:", caminho); return s
    troca = [
        ('<title>Processos Programa Wise Partners (to-be)</title>', '<title>Modelo e Processos Wise Partners</title>'),
        ('<style>', FONTES + '<style>\n' + estilo, 1),
        ('<div class="eyebrow">Arquitetura de processos</div>', '<div class="eyebrow">Modelo de negócio e arquitetura de processos</div>'),
        ('<a href="#cadeia" data-aba="cadeia">Cadeia de valor</a>', '<a href="#modelo" data-aba="modelo">Modelo de negócio</a>\n      <a href="#cadeia" data-aba="cadeia">Cadeia de valor</a>'),
        ('<a href="#negocio" data-aba="negocio">Negócio</a>', '<a href="#negocio" data-aba="negocio">Fatos do negócio</a>'),
        ('var ABAS = { cadeia: vistaCadeia,', 'var ABAS = { modelo: function () { return document.getElementById("tpl-modelo").innerHTML; }, cadeia: vistaCadeia,'),
        ('    if (estado.aba === "fluxos") montarBpmn();\n  }', '    if (estado.aba === "fluxos") montarBpmn();\n    if (estado.aba === "modelo" && window.iniciarModelo) window.iniciarModelo(document.getElementById("principal"));\n  }'),
        ('estado.aba = ABAS[h] ? h : "cadeia";', 'estado.aba = ABAS[h] ? h : "modelo";'),
    ]
    for t in troca:
        a, b = t[0], t[1]
        assert a in s, (caminho, a[:60])
        s = s.replace(a, b, 1) if len(t) > 2 else s.replace(a, b)
    i = s.index('<script id="dados"')
    s = s[:i] + TEMPLATE + "<script>\n" + script + JS_NAV + "</script>\n" + s[i:]
    assert "—" not in s and "–" not in s
    return s

for nome in ("mapa-interativo.html", "mapa-interativo.artifact.html"):
    caminho = BASE + "/saidas/" + nome
    s = juntar(caminho)
    open(caminho, "w", encoding="utf-8").write(s)
    if nome == "mapa-interativo.artifact.html":
        open(BASE + "/saidas/modelo-e-processos.html", "w", encoding="utf-8").write(s)
print("documento junto:", len(s) // 1024, "KB")
