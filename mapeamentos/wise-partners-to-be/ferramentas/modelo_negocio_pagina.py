# Quadro de modelo de negócio do Programa Wise Partners: página própria, separada do mapa de processos (FO-16).
import html, json, os, sys, re
sys.path.insert(0, os.path.dirname(__file__))
from modelo_negocio_dados import CANVAS, CONTA, VPC_CLIENTE, VPC_CLIENTE_FONTE, COMUM, CATEGORIAS, FASES, CANAIS, HIPOTESES

BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/saidas/modelo-de-negocio/index.html"
CASES = json.load(open(BASE + "/fontes/cases-wise-2026-11.json"))
e = lambda t: html.escape(str(t), quote=True)
TAG = {"D": ("Decidido por você", "d"), "P": ("Proposta, a validar", "p"), "F": ("Fonte documental", "f")}

def itens(lista):
    return "".join(f'<li class="{TAG[o][1]}"><span>{e(t)}</span></li>' for t, o in lista)

def bloco(k, cls):
    nome, lista = CANVAS[k]
    return f'<section class="bl {cls}" aria-label="{e(nome)}"><h3>{e(nome)}</h3><ul>{itens(lista)}</ul></section>'

canvas = "".join(bloco(k, "c-" + k) for k in ("par", "ak", "rk", "pv", "rel", "can", "seg", "cus", "rec"))

grupos_conta = []
for g in dict.fromkeys(c[0] for c in CONTA):
    campos = "".join(f'<div class="campo"><label for="c-{k}">{e(r)}</label><div class="in"><input id="c-{k}" data-k="{k}" type="number" step="any" min="0" value="{v}" inputmode="decimal"><span>{e(u)}</span></div><small>{e(o)}</small></div>'
                     for gg, k, r, v, u, o in CONTA if gg == g)
    grupos_conta.append(f'<fieldset class="gc"><legend>{e(g)}</legend><div class="campos">{campos}</div></fieldset>')
linhas_conta = "".join(grupos_conta)

def vpc(produtos, aliviam, criam, tarefas, dores, ganhos, titulo, comum=None):
    ul = lambda xs: "<ul>" + "".join(f"<li>{e(x)}</li>" for x in xs) + "</ul>"
    extra = f'<p class="comum">Para todas as categorias: {e("; ".join(comum))}.</p>' if comum else ""
    return f'''<div class="vpc"><div class="mapa"><p class="lado">O que a Wise oferece</p>
      <div class="cx prod"><h4>Produtos e serviços</h4>{ul(produtos)}</div>
      <div class="cx"><h4>Aliviam as dores</h4>{ul(aliviam)}</div><div class="cx"><h4>Criam ganhos</h4>{ul(criam)}</div></div>
      <div class="perfil"><p class="lado">{e(titulo)}</p>
      <div class="cx"><h4>Tarefas</h4>{ul(tarefas)}</div><div class="cx"><h4>Dores</h4>{ul(dores)}</div><div class="cx"><h4>Ganhos</h4>{ul(ganhos)}</div></div>{extra}</div>'''

vpc_cliente = vpc(VPC_CLIENTE["produtos"], VPC_CLIENTE["aliviam"], VPC_CLIENTE["criam"], VPC_CLIENTE["tarefas"], VPC_CLIENTE["dores"], VPC_CLIENTE["ganhos"], "Cliente do parceiro no ICP")

grupos = []
for g in dict.fromkeys(c[0] for c in CATEGORIAS):
    cards = []
    for _, nome, vende, tar, dor, gan, ali, cri in [c for c in CATEGORIAS if c[0] == g]:
        cards.append(f'<details class="cat"><summary><strong>{e(nome)}</strong><span>{e(vende)}</span></summary>{vpc(["O programa, como para todos (abaixo)"], ali, cri, tar, dor, gan, "Parceiro: " + nome)}</details>')
    grupos.append(f'<div class="grupo"><h3>{e(g)} <small>{len(cards)}</small></h3>{"".join(cards)}</div>')

fases = "<tr><th></th>" + "".join(f"<th>{i + 1}. {e(f)}</th>" for i, f in enumerate(FASES)) + "</tr>"
fases += "".join(f"<tr><th>{e(lado)}</th>" + "".join(f"<td>{e(c)}</td>" for c in cel) + "</tr>" for lado, cel in CANAIS.items())

pontos, ja = [], {}
for i, (t, tipo, imp, evi) in enumerate(HIPOTESES, 1):
    n = ja.get((imp, evi), 0); ja[(imp, evi)] = n + 1
    x = {1: 12, 2: 52, 3: 82}[evi] + (n % 4) * 8; y = {3: 24, 2: 58, 1: 86}[imp] + (n // 4) * 10
    pontos.append(f'<span class="pt t-{tipo.split()[0].lower()[:4]}" style="left:{x}%;top:{y}%" title="{e(t)}">{i}</span>')
lista_hip = "".join(f'<li><b>{i}</b> {e(t)} <small>{e(tipo)}</small></li>' for i, (t, tipo, imp, evi) in enumerate(HIPOTESES, 1))

media = round(CASES["summary"]["mean"])
cases = "".join(f'<li><span>{e(c["name"])}</span><i style="--w:{c["growth"] / 89.4 * 100:.0f}%"></i><b>+{str(c["growth"]).replace(".", ",")}%</b></li>' for c in sorted(CASES["cases"], key=lambda x: -x["growth"]))

pagina = f"""<title>Modelo de Negócio Wise Partners</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Quadro de trabalho: canvas em grade de nove blocos no topo, depois as ferramentas dos livros em seções com âncora. */
:root {{
  --bg: #f5f7f6; --surface: #ffffff; --soft: #eaf0ed; --fg: #17201c; --muted: #5b6a63; --line: #d6dfda;
  --accent: #0b7a55; --accent-soft: #dcefe6; --prop: #8a5a00; --prop-soft: #fbf0d9; --fonte: #3e5a8a;
  --sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #101614; --surface: #17201c; --soft: #1e2a25; --fg: #e6eeea; --muted: #9db0a7; --line: #2c3a34;
  --accent: #3fd39a; --accent-soft: #173a2c; --prop: #f0b44a; --prop-soft: #3a2c12; --fonte: #8fb0e8; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg: #101614; --surface: #17201c; --soft: #1e2a25; --fg: #e6eeea; --muted: #9db0a7; --line: #2c3a34;
  --accent: #3fd39a; --accent-soft: #173a2c; --prop: #f0b44a; --prop-soft: #3a2c12; --fonte: #8fb0e8; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--fg); font: 15px/1.55 var(--sans); }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 28px 72px; display: grid; gap: 44px; }}
header {{ display: grid; gap: 10px; }}
.eyebrow {{ font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); font-weight: 600; margin: 0; }}
h1 {{ font-size: 32px; line-height: 1.15; margin: 0; text-wrap: balance; }}
h2 {{ font-size: 22px; margin: 0 0 6px; text-wrap: balance; }}
h3 {{ font-size: 15px; margin: 0; }}
h4 {{ font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin: 0 0 6px; }}
p {{ margin: 0; max-width: 72ch; }} .lead {{ color: var(--muted); }}
nav {{ display: flex; flex-wrap: wrap; gap: 8px; }}
nav a {{ color: var(--accent); text-decoration: none; font-weight: 600; font-size: 14px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }}
nav a:hover, nav a:focus-visible {{ border-color: var(--accent); outline: none; }}
.legenda {{ display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: var(--muted); }}
.legenda span::before, .bl li::before {{ content: ""; display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; vertical-align: 1px; }}
.legenda .d::before, .bl li.d::before {{ background: var(--accent); }} .legenda .p::before, .bl li.p::before {{ background: var(--prop); }} .legenda .f::before, .bl li.f::before {{ background: var(--fonte); }}
section.s {{ display: grid; gap: 14px; scroll-margin-top: 12px; }}
.canvas {{ display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 8px; }}
.bl {{ background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px; min-width: 0; }}
.bl ul {{ list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; font-size: 13.5px; line-height: 1.45; }}
.bl li {{ display: flex; align-items: flex-start; }} .bl li::before {{ flex: none; margin-top: 6px; }}
.c-par {{ grid-column: 1 / 3; grid-row: 1 / 3; }} .c-ak {{ grid-column: 3 / 5; grid-row: 1; }} .c-rk {{ grid-column: 3 / 5; grid-row: 2; }}
.c-pv {{ grid-column: 5 / 7; grid-row: 1 / 3; background: var(--accent-soft); border-color: var(--accent); }}
.c-rel {{ grid-column: 7 / 9; grid-row: 1; }} .c-can {{ grid-column: 7 / 9; grid-row: 2; }} .c-seg {{ grid-column: 9 / 11; grid-row: 1 / 3; }}
.c-cus {{ grid-column: 1 / 6; grid-row: 3; }} .c-rec {{ grid-column: 6 / 11; grid-row: 3; }}
@media (max-width: 900px) {{ .canvas {{ grid-template-columns: 1fr 1fr; }} .canvas .bl {{ grid-column: auto; grid-row: auto; }} .c-pv {{ grid-column: 1 / -1 !important; order: -1; }} }}
@media (max-width: 560px) {{ .canvas {{ grid-template-columns: 1fr; }} }}
.conta {{ display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 18px; align-items: start; }}
@media (max-width: 820px) {{ .conta {{ grid-template-columns: 1fr; }} }}
.entradas, .saidas {{ display: grid; gap: 14px; min-width: 0; }} .saidas {{ position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow-y: auto; }} @media (max-width: 820px) {{ .saidas {{ position: static; max-height: none; }} }} .gc {{ border: 0; padding: 0; margin: 0; display: grid; gap: 8px; min-width: 0; }} .gc legend {{ font-weight: 700; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); padding: 0; margin-bottom: 6px; }}
.campos {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }}
.campo {{ background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; display: grid; gap: 4px; }}
.campo label {{ font-weight: 600; font-size: 13.5px; }} .campo small {{ color: var(--muted); font-size: 12px; }}
.in {{ display: flex; gap: 8px; align-items: center; }} .in span {{ color: var(--muted); font-size: 12.5px; }}
.in input {{ width: 110px; font: 500 15px var(--mono); padding: 5px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--fg); }}
.in input:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 1px; }}
.res {{ background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; display: grid; gap: 8px; }} .res.ganho {{ border-color: var(--accent); }}
.res table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
.res td {{ padding: 7px 0; border-bottom: 1px solid var(--line); vertical-align: top; }} .res td:last-child {{ text-align: right; font: 500 14px var(--mono); white-space: nowrap; padding-left: 12px; }}
.res tr.forte td {{ font-weight: 700; }} .res tr.forte td:last-child {{ color: var(--accent); }}
.res small {{ display: block; color: var(--muted); font-size: 12px; font-weight: 400; }}
.dois {{ display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 10px; align-items: center; text-align: center; }}
.dois .no {{ background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }} .dois .no.w {{ border-color: var(--accent); background: var(--accent-soft); }}
.dois .seta {{ font-size: 12.5px; color: var(--muted); display: grid; gap: 4px; }} .dois .seta b {{ color: var(--fg); font-weight: 600; }}
@media (max-width: 760px) {{ .dois {{ grid-template-columns: 1fr; }} }}
.vpc {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
@media (max-width: 760px) {{ .vpc {{ grid-template-columns: 1fr; }} }}
.mapa, .perfil {{ display: grid; gap: 8px; padding: 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); }}
.mapa {{ border-color: var(--accent); }} .perfil {{ border-radius: 28px; }}
.lado {{ font-weight: 700; font-size: 14px; }}
.cx {{ background: var(--soft); border-radius: 8px; padding: 10px 12px; }} .cx ul {{ margin: 0; padding-left: 18px; font-size: 13.5px; display: grid; gap: 3px; }}
.comum {{ grid-column: 1 / -1; font-size: 13px; color: var(--muted); }}
.grupos {{ display: grid; gap: 18px; }} .grupo {{ display: grid; gap: 8px; }} .grupo h3 small {{ color: var(--muted); font-weight: 500; }}
details.cat {{ background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 0 14px; }}
details.cat summary {{ cursor: pointer; padding: 12px 0; display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; }} details.cat summary span {{ color: var(--muted); font-size: 13.5px; }}
details.cat[open] {{ padding-bottom: 14px; }} details.cat summary:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.tab {{ overflow-x: auto; }} .tab table {{ border-collapse: collapse; min-width: 760px; width: 100%; font-size: 13.5px; }}
.tab th, .tab td {{ border: 1px solid var(--line); padding: 10px; text-align: left; vertical-align: top; background: var(--surface); }} .tab th {{ background: var(--soft); }}
.hip {{ display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }} @media (max-width: 760px) {{ .hip {{ grid-template-columns: 1fr; }} }}
.quad {{ position: relative; aspect-ratio: 1.25; max-width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }}
.quad::before {{ content: ""; position: absolute; left: 0; top: 0; width: 50%; height: 50%; background: var(--prop-soft); }}
.quad .ax {{ position: absolute; font-size: 11.5px; color: var(--muted); }} .quad .ax.y {{ left: 8px; top: 8px; }} .quad .ax.x {{ right: 8px; bottom: 6px; }} .quad .ax.w {{ left: 8px; bottom: 6px; }} .quad .ax.z {{ left: 8px; top: 26px; color: var(--prop); font-weight: 600; }}
.pt {{ position: absolute; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font: 600 12px var(--mono); color: var(--surface); background: var(--accent); transform: translate(-50%, -50%); }}
.pt.t-viab {{ background: var(--fonte); }} .pt.t-dese {{ background: var(--accent); }}
.hip ol {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; font-size: 14px; }} .hip ol b {{ font-family: var(--mono); margin-right: 6px; }} .hip ol small {{ color: var(--muted); }}
.cases {{ list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 13.5px; }}
.cases li {{ display: grid; grid-template-columns: 150px minmax(0, 1fr) 64px; gap: 10px; align-items: center; }}
.cases i {{ display: block; height: 10px; border-radius: 5px; background: var(--accent); width: var(--w); }} .cases b {{ font: 500 13px var(--mono); text-align: right; }}
.port {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }} @media (max-width: 640px) {{ .port {{ grid-template-columns: 1fr; }} }}
.port div {{ background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px; display: grid; gap: 6px; }} .port .aqui {{ border-color: var(--accent); background: var(--accent-soft); }}
.nota {{ font-size: 13px; color: var(--muted); }}
a {{ color: var(--accent); }}
</style>
<div class="wrap">
<header>
  <p class="eyebrow">Programa Wise Partners · modelo de negócio · 19/11/2026</p>
  <h1>Como o Wise Partners cria, entrega e captura valor</h1>
  <p class="lead">Este quadro é separado do mapa de processos, como você decidiu no FO-16. Ele usa o Business Model Canvas e as outras ferramentas dos quatro livros da pasta: a conta do canal em reais, a plataforma de dois lados, o canvas de proposta de valor do cliente e de cada categoria de parceiro, os canais nas cinco fases, o mapa de hipóteses e o portfólio.</p>
  <nav aria-label="Seções"><a href="#canvas">Canvas</a><a href="#conta">Metas, custos e ganhos</a><a href="#dois-lados">Dois lados</a><a href="#cliente">Cliente do parceiro</a><a href="#categorias">Categorias de parceiro</a><a href="#canais">Canais</a><a href="#hipoteses">Hipóteses</a><a href="#portfolio">Portfólio</a></nav>
  <div class="legenda"><span class="d">Decidido por você</span><span class="p">Proposta, a validar</span><span class="f">Fonte documental</span></div>
</header>

<section class="s" id="canvas"><div><h2>Business Model Canvas</h2><p class="lead">Só o que é do modelo, em frases curtas. À direita, para quem e como o valor chega; à esquerda, o que é preciso e quanto custa.</p></div>
<div class="canvas">{canvas}</div></section>

<section class="s" id="conta"><div><h2>Metas, funil, custos e ganhos</h2><p class="lead">Parte da meta de clientes e calcula para trás quantos parceiros e contatos são precisos, em que ritmo, quanto custa e quanto rende. Os valores de partida vêm do Playbook e da especificação, ou são hipóteses a testar (marcadas abaixo de cada campo). Troque qualquer número e tudo se recalcula.</p></div>
<div class="conta"><div class="entradas">{linhas_conta}</div>
<div class="saidas" aria-live="polite">
<div class="res"><h3>Para bater a meta</h3><table data-t="funil"></table></div>
<div class="res"><h3>Ritmo e agenda</h3><table data-t="ritmo"></table></div>
<div class="res ganho"><h3>Ganhos e custos</h3><table data-t="ganhos"></table></div>
<p class="nota">CAP: custo de aquisição do parceiro. CAC: custo de aquisição do cliente vindo de parceiro. O valor percebido pelo cliente do parceiro (R$ 5.000: diagnóstico R$ 2.000 e Wise Hub R$ 3.000) não entra como custo.</p></div></div></section>

<section class="s" id="dois-lados"><div><h2>Uma plataforma de dois lados</h2><p class="lead">O programa só funciona se os dois lados estiverem presentes: parceiros que mandam o link e clientes que fazem o diagnóstico. Os dois lados não pagam; quem paga é o cliente que contrata a consultoria. O diagnóstico gratuito segue o padrão de isca e anzol: é caro para quem oferece e leva à compra paga. O Wise Hub fica mais perto do freemium, porque custa pouco por usuário.</p></div>
<div class="dois"><div class="no"><b>Parceiro</b><br><small>qualquer categoria</small></div><div class="seta"><b>recebe</b> benefício para a base e 40% da 1ª mensalidade<br><b>entrega</b> o link aos clientes dele</div>
<div class="no w"><b>Wise Makers</b><br><small>orquestra a plataforma</small></div><div class="seta"><b>entrega</b> diagnóstico de 2 h, plano e Hub (R$ 5.000)<br><b>recebe</b> a mensalidade de quem contratar</div><div class="no"><b>Cliente do parceiro</b><br><small>no ICP da Wise</small></div></div></section>

<section class="s" id="cliente"><div><h2>Proposta de valor para o cliente do parceiro</h2><p class="lead">O diagnóstico é a consultoria da Wise em formato breve: os benefícios são os mesmos da consultoria contratada, como você pediu no FO-16. Prova: os 8 cases cresceram, +{media}% em média.</p></div>
{vpc_cliente}<p class="nota">De onde vem: {e(VPC_CLIENTE_FONTE)}</p>
<ul class="cases" aria-label="Crescimento dos 8 cases">{cases}</ul></section>

<section class="s" id="categorias"><div><h2>Proposta de valor para cada categoria de parceiro</h2><p class="lead">Um canvas por categoria da lista aprovada: {len(CATEGORIAS)} categorias. O que a Wise oferece é igual para todas; o que muda é o que cada tipo de parceiro precisa e como o programa o ajuda. Toque numa categoria para abrir. Tudo aqui é proposta a validar.</p>
<p class="nota">Igual para todas: {e("; ".join(COMUM))}.</p></div>
<div class="grupos">{"".join(grupos)}</div>
<p class="nota">A categoria consultoria de gestão só vale para consultorias que não fazem gestão comercial; as que fazem são concorrentes e ficam fora da fila.</p></section>

<section class="s" id="canais"><div><h2>Canais nas cinco fases</h2><p class="lead">Do primeiro contato ao pós-venda, para os dois lados, já com as correções do FO-16.</p></div>
<div class="tab"><table>{fases}</table></div></section>

<section class="s" id="hipoteses"><div><h2>Mapa de hipóteses</h2><p class="lead">O que o modelo dá como certo e ainda não foi provado. No quadrante destacado (muito importante, pouca evidência) estão as que devem ser testadas primeiro.</p></div>
<div class="hip"><div class="quad" role="img" aria-label="Hipóteses por importância e evidência"><span class="ax y">mais importante</span><span class="ax z">testar primeiro</span><span class="ax x">mais evidência</span><span class="ax w">menos importante, pouca evidência</span>{"".join(pontos)}</div><ol>{lista_hip}</ol></div></section>

<section class="s" id="portfolio"><div><h2>Portfólio: explorar ou explorar o que já funciona</h2><p class="lead">No vocabulário do The Invincible Company, a consultoria da Wise é o negócio estabelecido e o Wise Partners ainda é um projeto de exploração: cresce em apostas pequenas e só passa a operação padrão com evidência forte nos riscos acima.</p></div>
<div class="port"><div class="aqui"><b>Explorar: onde o programa está</b><p>Fase de experimentação. Investimento pequeno, medido por evidência: parceiros ativados, diagnósticos, clientes fechados e CAC.</p></div>
<div><b>Explorar o que já funciona: para onde vai</b><p>Quando os portões de fase forem cumpridos: o programa vira um canal padrão de aquisição da Wise, com metas e orçamento próprios.</p></div></div></section>

<p class="nota">Mapa de processos (separado): <span>claude.ai/artifact/WfaLCeHodE6SXdQuTkpxS2</span>. Fontes: Business Model Generation, Value Proposition Design, Testing Business Ideas (até a p. 64) e The Invincible Company (até a p. 62).</p>
</div>
<script>
window.iniciarModelo = function (raiz) {{
  raiz = raiz || document;
  const v = k => parseFloat((raiz.querySelector('[data-k="' + k + '"]') || {{}}).value) || 0;
  const brl = n => isFinite(n) ? 'R$ ' + n.toLocaleString('pt-BR', {{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}) : '-';
  const num = (n, d) => isFinite(n) ? n.toLocaleString('pt-BR', {{ maximumFractionDigits: d === undefined ? 1 : d }}) : '-';
  const up = n => isFinite(n) ? Math.ceil(n - 1e-9) : NaN;
  const tabela = (nome, linhas) => {{ const t = raiz.querySelector('[data-t="' + nome + '"]'); if (t) t.innerHTML = linhas.map(([a, b, c, f]) => '<tr' + (f ? ' class="forte"' : '') + '><td>' + a + '<small>' + b + '</small></td><td>' + c + '</td></tr>').join(''); }};
  function calc() {{
    const p = v('periodo'), janela = Math.min(v('janela'), p);
    const produtivo = Math.max(0, p - janela / 2 - v('dias_ativar') / 30 - v('ciclo') / 30);
    const diag = v('conv') > 0 ? v('meta') / (v('conv') / 100) : NaN;
    const cadCli = diag / ((v('tx_icp') / 100) * (v('tx_compar') / 100));
    const porParceiro = v('cad_mes') * produtivo;
    const ativos = up(cadCli / porParceiro);
    const aprovados = up(ativos / (v('ativacao') / 100));
    const cadastros = up(aprovados / (v('tx_aprovacao') / 100));
    const contatos = up(cadastros / (v('tx_cadastro') / 100));
    const semanasJanela = janela * 4.33, semanasProd = produtivo * 4.33;
    const diagSemana = diag / semanasProd;
    const excedente = Math.max(0, diagSemana - v('cap_gerente'));
    tabela('funil', [
      ['Contatos com possíveis parceiros', 'anúncio, eventos, indicações e contatos pessoais', num(contatos, 0), true],
      ['Parceiros que se cadastram', num(v('tx_cadastro'), 0) + '% dos contatos', num(cadastros, 0)],
      ['Parceiros aprovados na fila', num(v('tx_aprovacao'), 0) + '% dos cadastros', num(aprovados, 0)],
      ['Parceiros ativados', num(v('ativacao'), 0) + '% dos aprovados', num(ativos, 0), true],
      ['Clientes dos parceiros cadastrados', num(v('cad_mes'), 1) + ' por parceiro por mês, durante ' + num(produtivo, 1) + ' meses produtivos', num(up(cadCli), 0)],
      ['Reuniões de diagnóstico', num(v('tx_icp'), 0) + '% no ICP e ' + num(v('tx_compar'), 0) + '% de comparecimento', num(up(diag), 0)],
      ['Clientes fechados', num(v('conv'), 0) + '% dos diagnósticos', num(v('meta'), 0), true],
    ]);
    tabela('ritmo', [
      ['Janela para buscar parceiros', 'os primeiros meses do período', num(janela, 1) + ' meses'],
      ['Contatos por semana na janela', 'abordagens, conversas e cliques', num(contatos / semanasJanela, 1), true],
      ['Conversas de entrada por semana', '45 minutos cada', num(aprovados / semanasJanela, 1)],
      ['Meses produtivos por parceiro', 'depois da ativação e do ciclo de venda', num(produtivo, 1)],
      ['Reuniões de diagnóstico por semana', 'cerca de 2 horas cada', num(diagSemana, 1), true],
      ['Reuniões além da agenda do Gerente', 'limite de ' + num(v('cap_gerente'), 0) + ' por semana; o resto vai para consultores', num(excedente, 1) + ' por semana'],
      ['Horas de diagnóstico no período', num(v('h_diag'), 1) + ' h por diagnóstico', num(diag * v('h_diag'), 0) + ' h'],
    ]);
    const mrr = v('meta') * v('mensalidade');
    const ltv = mrr * v('meses');
    const comissoes = mrr * (v('com_parceiro') + v('com_gerente')) / 100;
    const custoDiag = diag * v('h_diag') * v('custo_hora');
    const custoParc = aprovados * v('h_parceiro') * v('custo_hora') + v('anuncios') * janela;
    const total = comissoes + custoDiag + custoParc;
    tabela('ganhos', [
      ['Receita mensal nova', v('meta') + ' clientes de ' + brl(v('mensalidade')), brl(mrr), true],
      ['Receita contratada', 'permanência de ' + num(v('meses'), 0) + ' meses', brl(ltv), true],
      ['Comissões', 'parceiro e Gerente sobre a 1ª mensalidade', brl(comissoes)],
      ['Diagnósticos', num(up(diag), 0) + ' reuniões', brl(custoDiag)],
      ['Busca de parceiros (CAP total)', 'anúncios e horas de fila e conversa', brl(custoParc)],
      ['CAP por parceiro aprovado', 'busca de parceiros dividida pelos aprovados', brl(custoParc / aprovados)],
      ['Custo total', 'comissões, diagnósticos e busca de parceiros', brl(total)],
      ['CAC', 'custo total por cliente fechado', brl(total / v('meta')), true],
      ['Resultado', 'receita contratada menos o custo total', brl(ltv - total), true],
      ['Retorno', 'receita contratada por real investido', isFinite(ltv / total) ? num(ltv / total, 1) + ' para 1' : '-'],
    ]);
  }}
  raiz.querySelectorAll('[data-k]').forEach(i => i.addEventListener('input', calc));
  calc();
}};
if (document.getElementById('conta')) window.iniciarModelo(document);
</script>
"""
assert "—" not in pagina and "–" not in pagina
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print("modelo de negócio:", len(pagina) // 1024, "KB;", len(CATEGORIAS), "categorias")
