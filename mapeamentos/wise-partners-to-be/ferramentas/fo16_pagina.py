# FO-16: o mapeamento de processos do Wise Partners no padrão do Business Model Canvas, para validar antes de redesenhar.
# Canvas com os 9 blocos, Value Proposition Canvas dos dois lados, o que entra em cada ferramenta, o que cada responsável faz
# e a reunião de diagnóstico de 2 horas (Matriz 5x5 mesclada ao roteiro de diagnóstico).
import json, html, os, re, sys, glob, textwrap, collections
sys.path.insert(0, "/home/user/.claude/skills/mapear-processos/scripts")
import mapa as M

BASE = "/home/user/mapeamentos/wise-partners-to-be"
SAIDA = BASE + "/formularios/FO-16/formulario.html"
d = json.load(open(BASE + "/mapa.json"))
COD = M.calcular_codigos(d)
PROCS, FILHOS = M.arvore(d)
PX = {p["id"]: p for p in d["processos"]}
PAP = {x["id"]: x["nome"] for x in d["papeis"]}
SIS = {x["id"]: x["nome"] for x in d["sistemas"]}
CASES = json.load(open(BASE + "/fontes/cases-wise-2026-11.json"))
NOTAS = {}
for f in glob.glob(BASE + "/fontes/notas-dos-livros/*.json"):
    try: n = json.load(open(f)); NOTAS[n.get("slug") or os.path.basename(f)[:-5]] = n
    except Exception: pass
ITENS = []

def esc(t): return html.escape(str(t), quote=True)
def wrap(t, n): return textwrap.wrap(str(t), n, break_long_words=False) or [""]
def nomep(pid): return f"{COD[pid]} {PROCS[pid]['nome']}"

# ---------------------------------------------------------------- citações dos livros (gravadas pelo agente de leitura)
def _norm(s): return re.sub(r"[^a-z]", "", s.lower())
def cits_livro(slug, *chaves, n=3):
    nota = NOTAS.get(slug)
    if not nota: return []
    out, vistos = [], set()
    alvo = [_norm(c) for c in chaves]
    def ok(txt): return not alvo or any(a in _norm(txt) for a in alvo)
    fontes = []
    for fw in nota.get("frameworks", []):
        for comp in fw.get("componentes", []):
            if ok(comp.get("nome", "")): fontes += comp.get("citacoes", []) or []
        if ok(fw.get("nome", "")) or not alvo: fontes += fw.get("citacoes", []) or []
    for pr in nota.get("principios", []):
        if ok(pr.get("principio", "") + " " + pr.get("explicacao", "")): fontes += pr.get("citacoes", []) or []
    for c in fontes:
        t = c.get("trecho", "")
        if not t or t in vistos: continue
        vistos.add(t); out.append({"trecho": t, "fonte": f"{nota.get('livro', slug)}, {c.get('pagina', '')}".strip(", ")})
        if len(out) >= n: break
    return out

def comp_bmg(*chaves):
    nota = NOTAS.get("business-model-generation") or {}
    for fw in nota.get("frameworks", []):
        for comp in fw.get("componentes", []):
            if any(_norm(c) in _norm(comp.get("nome", "")) for c in chaves): return comp
    return {}

# ---------------------------------------------------------------- tarefas por papel e por ferramenta, tiradas do mapa
TAREFAS = collections.defaultdict(lambda: collections.defaultdict(list))
for p in d["processos"]:
    for nn in (p.get("fluxo") or {}).get("nos", []):
        if nn["tipo"] != "tarefa": continue
        quem = "PORTAL" if nn.get("modo") == "automatico" else nn.get("raia")
        TAREFAS[quem][p["id"]].append(nn["nome"])
def conta(quem): return sum(len(v) for v in TAREFAS[quem].values())
def lista_tarefas(quem, filtro=None):
    linhas = []
    for pid in sorted(TAREFAS[quem], key=lambda x: [int(y) for y in COD[x].split(".")]):
        if filtro and not filtro(pid): continue
        linhas.append(f"{nomep(pid)}: " + "; ".join(TAREFAS[quem][pid]) + ".")
    return linhas

# ---------------------------------------------------------------- desenhos
def tl(x, y, linhas, fs=11, anchor="start", cls="tx", bold=False, dy=None):
    dy = dy or fs + 3
    return "".join(f'<text x="{x:.0f}" y="{y + i * dy:.1f}" font-size="{fs}" text-anchor="{anchor}" class="{cls}"{" font-weight=\"600\"" if bold else ""}>{esc(l)}</text>' for i, l in enumerate(linhas))
def svg(w, h, corpo, titulo, minw=None):
    return (f'<svg viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{esc(titulo)}" style="min-width:{min(w, minw or 560):.0f}px">'
            '<defs><marker id="ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pt"/></marker></defs>' + corpo + "</svg>")

# ---------------------------------------------------------------- o canvas do Programa Wise Partners
P_ = lambda *ids: [i for i in ids if i in PX]
PROPOSTA, DECIDIDO = "Proposta da revisão", "Já decidido por você"
BL = {}
def bloco(chave, nome, ingles, curto, conteudo, processos, ferramentas, quem):
    BL[chave] = dict(nome=nome, ingles=ingles, curto=curto, conteudo=conteudo, processos=processos, ferramentas=ferramentas, quem=quem)

bloco("seg", "Segmentos de clientes", "Customer Segments", ["Parceiros (software de gestão", "e outros que vendem a empresas)", "Clientes dos parceiros", "Clientes da Wise (Prateleira)"], [
    ("Parceiros", "Empresas que vendem para empresas com time comercial. A campanha atual busca software de gestão, com CRM e ERP à frente, com qualquer tamanho de carteira. Concorrentes da Wise ficam fora. Três níveis: Select, Premium e Elite.", DECIDIDO + " · FO-11 e FO-12"),
    ("Clientes dos parceiros", "Empresas da carteira do parceiro. No ICP da Wise (3 vendedores ou mais, faturamento de pelo menos R$ 250 mil por mês e venda mais complexa) recebem a reunião de diagnóstico; abaixo disso, o autodiagnóstico.", DECIDIDO + " · FO-15"),
    ("Clientes da Wise", "Indústrias que já são clientes da Wise e recebem a recomendação de parceiros Premium e Elite pela Prateleira.", DECIDIDO + " · FO-12"),
    ("Tipo de modelo", "Plataforma de dois lados, como o livro chama de multi-sided platform: a Wise só cria valor se os dois lados estiverem presentes (parceiros que mandam o link e clientes que fazem o diagnóstico). O lado do parceiro e o do cliente do parceiro não pagam; quem paga é o cliente que contrata a consultoria.", PROPOSTA)],
    P_("P-04", "P-90"), ["Portal (cadastro, regra do ICP)", "Meta (público da campanha)"], ["Gerente define e mantém", "Diretor aprova o público da campanha"])

bloco("pv", "Proposta de valor", "Value Propositions", ["Parceiro: consultoria gratuita à base,", "comissão, Hub; Premium e Elite", "Cliente do parceiro: diagnóstico", "de 2 h (R$ 2.000) e Hub (R$ 3.000)"], [
    ("Para o parceiro (Select)", "Consultoria gratuita para os clientes da carteira, que ajuda a reter a base e a se diferenciar; comissão de 40% da primeira mensalidade quando um cliente dele contrata a Wise; certificado; Wise Hub com as duas marcas; minicurso; grupo e comunidade.", DECIDIDO + " · FO-11 e FO-12"),
    ("Para o parceiro Premium e Elite", "Premium: a Wise passa a recomendá-lo aos clientes dela, mentoria mensal à carteira, eventos e formações, apresentações a outros parceiros. Elite: uma formação gratuita e exclusiva por ano para a base dele (Base Ativa).", DECIDIDO + " · FO-12 e FO-14"),
    ("Para o cliente do parceiro", f"Reunião de diagnóstico de cerca de 2 horas com plano de ação (valor de referência R$ 2.000) e o Wise Hub (R$ 3.000), total de R$ 5.000, sem custo. Prova: 8 empresas atendidas pela Wise, todas cresceram, +{round(CASES['summary']['mean'])}% em média.", DECIDIDO + " · FO-15"),
    ("Para o cliente da Wise", "Indicação de um fornecedor de confiança, conferido pela Wise, para o que a Wise não faz.", DECIDIDO + " · v7"),
    ("Para a Wise", "Clientes novos com custo de aquisição menor que o dos canais ativos.", DECIDIDO + " · FO-02")],
    P_("P-03", "P-61", "P-95", "P-44", "P-35", "P-58", "P-86", "P-87", "P-99", "P-52", "P-84", "P-85"), ["Portal (página do cliente, resultado da matriz)", "Videochamada (reunião)", "Wise Hub", "Documento do diagnóstico"], ["Gerente e consultores conduzem o diagnóstico", "Diretor grava os vídeos"])

bloco("can", "Canais", "Channels", ["Parceiro: anúncio Meta, página,", "WhatsApp, conversa, portal", "Cliente: link do parceiro,", "página, agenda, reunião, e-mail"], [
    ("Parceiro: conhecimento", "Anúncio no Meta com vídeo do Igor, levando à página dos parceiros.", DECIDIDO + " · pedido do Igor, 07/11"),
    ("Parceiro: avaliação e compra", "Cadastro com aceite na página, fila no portal, WhatsApp do Gerente, agenda e conversa de entrada de 45 minutos, em que a conta é criada.", DECIDIDO + " · FO-11 a FO-14"),
    ("Parceiro: entrega e pós-venda", "Portal (link, minicurso, kit, clientes), grupo de WhatsApp, e-mail e comunicado do mês, encontro trimestral.", DECIDIDO + " · FO-11 e FO-14"),
    ("Cliente do parceiro: do conhecimento à entrega", "Mensagem pronta do parceiro com o link; página do cliente com as duas marcas; cadastro; agenda do Google; reunião online de 2 horas; documento em até 2 dias úteis; acesso ao Hub.", DECIDIDO + " · FO-10 e FO-15"),
    ("As cinco fases", "O livro divide todo canal em cinco fases: conhecimento, avaliação, compra, entrega e pós-venda. A pergunta 'Os canais nas cinco fases' mostra a tabela completa.", PROPOSTA)],
    P_("P-98", "P-21", "P-75", "P-96", "P-82", "P-80"), ["Meta Ads, pixel e GA4", "Portal (duas páginas)", "WhatsApp", "Google Agenda", "E-mail"], ["Diretor é dono da campanha", "Gerente configura as páginas", "Parceiro envia o link"])

bloco("rel", "Relacionamento", "Customer Relationships", ["Entrada: pessoal (fila e conversa)", "Select: automatizado e comunidade", "Premium e Elite: pessoal dedicado", "Cliente: pessoal na reunião, depois Hub"], [
    ("Na entrada", "Assistência pessoal: o Gerente fala com cada candidato pelo WhatsApp e na conversa de entrada.", DECIDIDO + " · FO-11"),
    ("Select", "Automatizado (portal, lembretes por e-mail a cada 14 dias parado, comunicado do mês) e comunidade (encontro trimestral, grupo de WhatsApp). Contato individual só quando a jogada do tipo pede.", DECIDIDO + " · FO-11 e FO-14"),
    ("Premium e Elite", "Assistência pessoal dedicada: encontro de alinhamento, revisão trimestral com pauta, ações conjuntas; o Diretor participa da revisão dos Elite.", DECIDIDO + " · v7 e FO-12"),
    ("Cliente do parceiro", "Pessoal na reunião de diagnóstico; depois autosserviço no Wise Hub. Sem ligação insistente.", DECIDIDO + " · FO-10 e FO-11"),
    ("Retenção e saída", "Retomada pela abordagem do tipo, desligamento com aviso de 30 dias e saída a pedido sem multa.", DECIDIDO + " · v7")],
    P_("P-20", "P-22", "P-23", "P-25", "P-26", "P-27", "P-73", "P-94", "P-30", "P-97", "P-40", "P-41", "P-42", "P-43", "P-45", "P-28", "P-46", "P-47", "P-48", "P-49", "P-83", "P-50", "P-51", "P-53", "P-54", "P-55", "P-56", "P-57", "P-63", "P-64", "P-34", "P-17"),
    ["WhatsApp (grupo por parceiro)", "Portal (etapas, lembretes)", "E-mail", "Videochamada"], ["Gerente conduz", "Diretor nas revisões Elite e no encontro trimestral"])

bloco("rec", "Fontes de receita", "Revenue Streams", ["Consultoria contratada pelos", "clientes indicados (mensalidade)", "Parceiro e cliente do parceiro", "não pagam (lado subsidiado)"], [
    ("De onde vem o dinheiro", "Da consultoria que o cliente do parceiro contrata depois do diagnóstico: mensalidade da Wise Makers. No Premium e no Elite, também da Tríade e da Swallow.", DECIDIDO + " · FO-14"),
    ("Quem não paga", "O parceiro não paga para participar e o cliente do parceiro não paga o diagnóstico nem o Hub.", DECIDIDO + " · v7 e FO-15"),
    ("Contrapartida da Prateleira", "Não é dinheiro: o fornecedor dá uma ação conjunta ou uma condição comercial ao cliente.", DECIDIDO + " · FO-02"),
    ("Tipo de receita", "Pelo livro, é receita recorrente de assinatura (a mensalidade da consultoria), com o diagnóstico gratuito como porta de entrada, o padrão que o livro chama de free as a business model.", PROPOSTA)],
    P_("P-31", "P-32", "P-79", "P-81", "P-33", "P-37", "P-39"), ["Portal (oportunidades, origem, proteção de 180 dias)", "WhatsApp (closer avisa o Gerente)"], ["Gerente registra e devolve ao parceiro", "Closer da empresa do grupo fecha"])

bloco("rk", "Recursos principais", "Key Resources", ["Gerente e consultores", "Matriz 5x5 e roteiro, cases,", "minicurso, marca Wise Makers", "Portal e Wise Hub"], [
    ("Pessoas", "O Gerente (fila, conversas, até 5 diagnósticos por semana), os consultores (diagnósticos que passam disso), o Igor (vídeos, direção).", DECIDIDO + " · FO-11 e FO-15"),
    ("Intelectuais", "A Matriz 5x5 mesclada ao roteiro de diagnóstico; os 8 cases; o minicurso; a marca Wise Makers.", DECIDIDO + " · FO-15"),
    ("Digitais", "Portal Wise Partners (as duas páginas, a fila, o link, as regras, os painéis) e o Wise Hub.", DECIDIDO + " · v7 e FO-11"),
    ("Recurso mais escasso", "A agenda de quem conduz os diagnósticos: cada cliente no ICP consome cerca de 2 horas de reunião, mais o preparo do roteiro e o documento.", PROPOSTA)],
    P_("P-59", "P-88", "P-89", "P-100", "P-60", "P-91", "P-92", "P-93"), ["Portal", "Wise Hub", "Pasta de materiais"], ["Igor grava", "Gerente mantém", "Diretores e Gerente administram o portal"])

bloco("ak", "Atividades principais", "Key Activities", ["Diagnosticar clientes dos parceiros", "Atrair, selecionar e ativar parceiros", "Levar oportunidades ao closer", "Gerir por rituais e medir"], [
    ("Produção", "Conduzir os diagnósticos de 2 horas e entregar o plano de ação (6.1).", DECIDIDO + " · FO-15"),
    ("Plataforma", "Atrair, selecionar e ativar parceiros (4 e 5); manter o portal e as regras (12).", DECIDIDO + " · v10"),
    ("Solução de problemas", "Levar cada oportunidade ao closer e devolver o andamento ao parceiro (6).", DECIDIDO + " · v7"),
    ("Gestão", "Rituais (dia, semana, mês, trimestre) e medidas (CAC, cubo, nível, saúde) que mantêm o programa nos trilhos (2 e 3).", DECIDIDO + " · v7")],
    P_("P-01", "P-05", "P-07", "P-08", "P-09", "P-10", "P-11", "P-12", "P-13", "P-14", "P-16", "P-65", "P-66", "P-67", "P-68", "P-18", "P-19"), ["Portal (fila de exceções, painéis)"], ["Gerente é dono", "Diretor na conversa semanal e nas metas"])

bloco("par", "Parcerias principais", "Key Partnerships", ["Empresas do grupo e closers", "UniCesumar (pesquisa)", "Meta, Google e e-mail", "Entidades e jurídico"], [
    ("Empresas do grupo", "Wise Makers, Tríade e Swallow: o closer de cada uma recebe o lead e fecha a venda.", DECIDIDO + " · v7"),
    ("UniCesumar", "A pesquisa sobre maturidade comercial, aplicada na reunião quando aprovada pelo Comitê de Ética e consentida.", DECIDIDO + " · FO-11"),
    ("Fornecedores de ferramentas", "Meta (anúncios), Google (agenda e GA4), serviço de e-mail, Supabase e Netlify (portal).", DECIDIDO + " · portal"),
    ("Entidades da Parceria Institucional", "Associações e federações que ajudam a convidar para os encontros.", DECIDIDO + " · v7"),
    ("Jurídico", "Revisa o termo de adesão e a política de privacidade.", DECIDIDO + " · conversa de 07/11"),
    ("Os parceiros não estão aqui", "Pelo livro, num modelo de plataforma, os parceiros do programa são um dos lados (um segmento de clientes), não parceiros-chave do modelo. É por isso que estão no bloco de segmentos.", PROPOSTA)],
    P_("P-02"), ["WhatsApp (closers)", "E-mail"], ["Gerente combina com os closers", "Diretor responde pelo grupo"])

bloco("cus", "Estrutura de custos", "Cost Structure", ["Comissão (40% + 10%)", "Horas de diagnóstico e do Gerente", "Anúncios", "Portal e ferramentas"], [
    ("Variáveis", "Comissão de 40% da primeira mensalidade ao parceiro e 10% ao Gerente; horas de cada diagnóstico (cerca de 2 horas de reunião, mais preparo e documento); anúncios da campanha; formações do Base Ativa.", DECIDIDO + " · v7, FO-14 e FO-15"),
    ("Fixos", "O tempo do Gerente no programa, o portal e as ferramentas.", DECIDIDO + " · v7"),
    ("A conta que decide", "CAC do Wise Partners (comissões, horas e custos diretos, inclusive anúncios, divididos pelos clientes fechados vindos de parceiros), acompanhado pela tendência a cada trimestre.", DECIDIDO + " · FO-14"),
    ("Custo novo a medir", "Custo por diagnóstico e quantos diagnósticos viram cliente. Com reuniões de 2 horas, é o número que mais pesa no CAC.", PROPOSTA)],
    P_("P-06", "P-62", "P-38", "P-15"), ["Portal (CAC, comissões)", "Conta de anúncios"], ["Gerente apura", "Financeiro paga", "Diretor define as metas"])

ORDEM = ["par", "ak", "rk", "pv", "rel", "can", "seg", "cus", "rec"]
assert sorted(sum((b["processos"] for b in BL.values()), [])) == sorted(set(sum((b["processos"] for b in BL.values()), []))), "processo em dois blocos"
fora = [p for p in PX if p not in sum((b["processos"] for b in BL.values()), [])]

def desenho_canvas(destaque=None):
    W, H = 1100, 680
    cols = [(0, 220), (220, 440), (440, 660), (660, 880), (880, 1100)]
    cel = {"par": (0, 0, 220, 470), "ak": (220, 0, 220, 235), "rk": (220, 235, 220, 235), "pv": (440, 0, 220, 470),
           "rel": (660, 0, 220, 235), "can": (660, 235, 220, 235), "seg": (880, 0, 220, 470), "cus": (0, 470, 550, 210), "rec": (550, 470, 550, 210)}
    o = []
    for k, (x, y, w, h) in cel.items():
        b = BL[k]; hi = destaque == k
        o.append(f'<rect x="{x + 3}" y="{y + 3}" width="{w - 6}" height="{h - 6}" rx="8" class="b{" hi" if hi else ""}"/>')
        o.append(tl(x + 14, y + 24, [b["nome"]], 13, bold=True))
        o.append(tl(x + 14, y + 44, b["curto"], 10.5, cls="mu", dy=14))
        cods = [COD[p] for p in b["processos"]]
        lin = wrap("Processos: " + ", ".join(cods), 34 if w < 300 else 80)
        o.append(tl(x + 14, y + 44 + len(b["curto"]) * 14 + 12, lin[:8 if h > 300 else 5], 10, cls="tx", dy=13))
    return svg(W, H, "".join(o), "Business Model Canvas do Programa Wise Partners", minw=900)

# Value Proposition Canvas
def desenho_vpc(titulo, prod, alivio, ganho_c, tarefas, dores, ganhos):
    o = [f'<rect x="10" y="30" width="400" height="330" rx="10" class="b hi"/>', f'<circle cx="760" cy="195" r="185" class="b"/>',
         tl(210, 20, ["Mapa de valor (o que a Wise oferece)"], 12, "middle", "tx", True), tl(760, 20, [f"Perfil: {titulo}"], 12, "middle", "tx", True)]
    def caixa(x, y, w, tit, itens):
        out = [tl(x, y, [tit], 11.5, bold=True)]
        yy = y + 16
        for it in itens:
            ls = wrap("• " + it, int(w / 6.2))
            out.append(tl(x, yy, ls, 10.5, dy=13)); yy += 13 * len(ls) + 3
        return "".join(out)
    o += [caixa(24, 54, 180, "Produtos e serviços", prod), caixa(218, 54, 180, "Aliviam as dores", alivio), caixa(218, 216, 180, "Criam ganhos", ganho_c),
          caixa(640, 60, 250, "Tarefas do cliente", tarefas), caixa(610, 172, 140, "Dores", dores), caixa(770, 172, 150, "Ganhos", ganhos)]
    o.append(f'<line x1="410" y1="195" x2="572" y2="195" class="ln" marker-end="url(#ponta)"/>'); o.append(tl(490, 186, ["encaixe"], 11, "middle", "mu"))
    return svg(960, 380, "".join(o), "Value Proposition Canvas: " + titulo, minw=860)

# Matriz 5x5 e o roteiro
PILARES = [("Identidade e posicionamento", ["1.7 Cliente ideal", "1.10.3 CAVABEN, cases"]), ("Demanda e aquisição", ["1.8 Canais, investimento e retorno", "1.11.6 Leads que não compraram"]),
           ("Conversão e experiência", ["1.9 Atendimento comercial", "1.10.1 Script e proposta", "1.5 Política comercial"]), ("Expansão e retenção", ["1.11 Base atual e recompra", "1.8.3 Produtos de fidelização"]),
           ("Governança e integração", ["1.1 Números e sistemas", "1.2 Metas", "1.3 Vendedores", "1.4 Comissão", "1.12 Rotina de gestão", "1.6 IA e agente"])]
CRIT = ["Estratégia", "Processo", "Dados", "Tecnologia", "Pessoas"]
def desenho_5x5():
    o = [tl(150, 18, ["Pilar da Matriz 5x5"], 12, "middle", "tx", True), tl(470, 18, ["Critérios (uma afirmação por célula)"], 12, "middle", "tx", True), tl(790, 18, ["Blocos do roteiro que aprofundam"], 12, "middle", "tx", True)]
    for i, (pil, blocos) in enumerate(PILARES):
        y = 30 + i * 74
        o.append(f'<rect x="10" y="{y}" width="280" height="64" rx="8" class="b hi"/>'); o.append(tl(24, y + 36, [pil], 12, bold=True))
        for j, c in enumerate(CRIT):
            x = 300 + j * 68
            o.append(f'<rect x="{x}" y="{y}" width="62" height="64" rx="6" class="b"/>'); o.append(tl(x + 31, y + 36, [c[:10]], 9.5, "middle", "mu"))
        o.append(f'<rect x="650" y="{y}" width="290" height="64" rx="8" class="b2"/>')
        o.append(tl(662, y + 18 + (4 - min(len(blocos), 4)) * 6, blocos[:4] + ([f"e mais {len(blocos) - 4}"] if len(blocos) > 4 else []), 10.5, dy=12.5))
    o.append(tl(10, 410, ["As 25 afirmações da matriz dão a nota de cada pilar; os blocos do roteiro são as perguntas abertas que explicam a nota e alimentam o plano de ação."], 11, cls="mu"))
    return svg(950, 420, "".join(o), "Matriz 5x5 e os blocos do roteiro de diagnóstico", minw=860)

AGENDA = [("Abertura e contexto", 10, "Objetivo da reunião, o que o cliente leva, consentimento da pesquisa quando houver."), ("Governança e integração", 30, "1.1 Números e sistemas; 1.2 Metas; 1.3 Vendedores; 1.4 Comissão; 1.12 Rotina de gestão."),
          ("Identidade e posicionamento", 15, "1.7 Cliente ideal e quem não é."), ("Demanda e aquisição", 20, "1.8 Canais, investimento e retorno."), ("Conversão e experiência", 20, "1.9 Atendimento; 1.10 Materiais; 1.5 Política comercial."),
          ("Expansão e retenção", 10, "1.11 Base atual, parque instalado e recompra."), ("Plano de ação", 15, "O que o cliente envia, o que a Wise calcula e o próximo encontro.")]
def desenho_agenda():
    o = []; x = 10; tot = sum(m for _, m, _ in AGENDA)
    for i, (n, m, _) in enumerate(AGENDA):
        w = m / tot * 900
        o.append(f'<rect x="{x:.0f}" y="20" width="{w - 3:.0f}" height="52" rx="6" class="b{" hi" if i % 2 else ""}"/>')
        o.append(tl(x + 6, 40, wrap(n, max(6, int(w / 6.3)))[:2], 10, dy=12)); o.append(tl(x + 6, 90, [f"{m} min"], 10.5, cls="mu"))
        x += w
    o.append(tl(10, 120, [f"Total: {tot} minutos. A ordem segue a do roteiro; blocos que não se aplicam ao cliente (por exemplo, IA e agente) entram só se houver tempo."], 11, cls="mu"))
    return svg(920, 130, "".join(o), "Proposta de agenda da reunião de 2 horas", minw=820)

# ---------------------------------------------------------------- itens do formulário
def item(iid, bloco_, texto, selo, cls, secoes, opcoes, tipo="escolha"):
    ITENS.append({"id": "BM-" + iid, "bloco": bloco_, "texto": texto, "selo": selo, "cls": cls, "secoes": [s for s in secoes if s and s.get("v")], "opcoes": opcoes, "tipo": tipo})
AP = ["Aprovo como está", "Aprovo com ajustes (comente)", "Não aprovo (comente)"]

G0 = "A Matriz 5x5"
item("matriz", G0, "O modelo de diagnóstico 5x5 que eu uso é este?", "Confirmação", "aberto", [
    {"t": "Resposta curta", "k": "p", "v": ["Sim, tenho acesso. A Matriz de Diagnóstico de Governança Comercial 5x5 está no portal (é a base do autodiagnóstico da página do cliente e do cálculo do resultado): 5 pilares avaliados por 5 critérios, uma afirmação por célula, nota de 1 a 5 (de 'não acontece' a 'sempre, e medimos'), e o resultado em cinco níveis (Inicial, Em estruturação, Estruturado, Gerenciado e Referência).",
                                            "No código, ela está marcada como a versão da pesquisa da UniCesumar para revisão: a redação final depende da aprovação do Comitê de Ética. Se a versão da pesquisa mudou depois, preciso da versão nova."]},
    {"t": "Os 5 pilares e os 5 critérios", "k": "fig", "v": desenho_5x5()},
    {"t": "As 25 afirmações", "k": "det", "v": [f"{p['nome']}: " for p in []] or [
        "Identidade: cliente ideal por escrito; apresentação padronizada; sabe de que segmentos vem o faturamento; ICP registrado no sistema; todo vendedor explica em uma frase por que escolher a empresa.",
        "Demanda: meta de clientes novos e canais; prospecção em rotina semanal; sabe quantos contatos gera e quanto custa um cliente; todo contato no sistema com origem; o time prospecta mesmo com a carteira cheia.",
        "Conversão: etapas da venda definidas; proposta padrão com próximo passo; conversão por etapa e motivo de perda; negociações no sistema; vendedor novo aprende com material e treinamento.",
        "Expansão: plano para vender mais à base e recuperar quem parou; rotina de contato com a carteira; sabe quanto da receita é recorrente; o sistema avisa quem ficou sem comprar; o time é cobrado pela carteira.",
        "Governança: metas a partir de dados e por vendedor; reunião comercial com pauta fixa; indicadores saem do sistema; o sistema é registro obrigatório; o comercial funciona sem o dono por perto."]}],
    ["Sim, é este", "É outra versão (comente ou mande o arquivo)"])

G1 = "O mapa no padrão do Business Model Canvas"
item("canvas", G1, "O canvas do Programa Wise Partners está certo?", "Proposta da revisão", "mudou", [
    {"t": "O que é", "k": "p", "v": ["O Business Model Canvas descreve um negócio em nove blocos: para quem (segmentos), o que se entrega (proposta de valor), como chega (canais), como se relaciona (relacionamento) e como se ganha dinheiro (receita), do lado direito; e o que é preciso para isso (recursos, atividades e parcerias) e quanto custa (custos), do lado esquerdo. O lado direito é o valor; o esquerdo é a eficiência.",
                                     "Coloquei cada um dos " + str(len(PX)) + " processos do mapa no bloco que ele sustenta. Assim fica visível, para cada parte do modelo de negócio, quais processos a fazem acontecer, em que ferramenta e quem faz."]},
    {"t": "O canvas", "k": "fig", "v": desenho_canvas()},
    {"t": "Como ler", "k": "ul", "v": ["Cada bloco tem uma pergunta própria, logo a seguir, com o conteúdo completo, a origem de cada item, os processos, as ferramentas e os responsáveis.",
                                       "Os parceiros aparecem como segmento de clientes, e não como parceria principal: o programa é uma plataforma de dois lados, em que o parceiro recebe valor e também traz o outro lado (os clientes dele)."]},
    {"t": "De onde vem", "k": "cit", "v": cits_livro("business-model-generation", "canvas", "building blocks", n=4)}], AP)

item("arquitetura", G1, "Como o mapa de processos passa a ser organizado?", "Decisão em aberto", "aberto", [
    {"t": "A escolha", "k": "p", "v": ["Hoje a hierarquia segue a jornada: 12 macroprocessos em gestão, finalísticos e suporte (atrair, integrar, gerar oportunidades, desenvolver...). O canvas agrupa por outra lógica: o bloco do modelo de negócio que cada processo sustenta.",
                                       "Um processo ponta a ponta costuma passar por mais de um bloco. A entrada do parceiro, por exemplo, é canal (anúncio e página) e é relacionamento (fila e conversa). Se a hierarquia for refeita pelos blocos, esses processos se partem."]},
    {"t": "As opções", "k": "kv", "v": [["Canvas como camada de cima", "O canvas vira a primeira tela do mapa e cada processo ganha o bloco dele; a hierarquia da jornada continua por baixo, com a mesma numeração. As duas visões ficam ligadas."],
                                        ["Hierarquia pelos blocos", "Os 9 blocos viram os 9 macroprocessos e os processos são renumerados dentro deles. A jornada continua visível só nas duas cadeias de valor."],
                                        ["Os dois quadros separados", "O canvas fica como documento de modelo de negócio, e o mapa de processos continua como está, sem ligação processo a processo."]]},
    {"t": "O que eu recomendo, e por quê", "k": "rec", "v": ["A primeira. O método de mapeamento corta os macroprocessos onde o trabalho muda de mãos ou de objeto (a jornada), e o canvas responde a outra pergunta (o que sustenta o modelo). Com a camada de cima, você ganha a visão completa sem quebrar o passo a passo que já está aprovado."]}],
    ["O canvas como camada de cima, ligado aos processos", "Refazer a hierarquia pelos 9 blocos", "Os dois quadros separados", "Outra (comente)"])

NOME_FER = {"Portal": "Portal", "WhatsApp": "WhatsApp", "Videochamada": "Videochamada", "Agenda": "Google Agenda"}
for k in ORDEM:
    b = BL[k]
    comp = comp_bmg(b["ingles"])
    sec = [{"t": "A pergunta do bloco", "k": "p", "v": [x for x in [comp.get("pergunta", ""), comp.get("descricao", "")] if x]},
           {"t": "Onde fica no canvas", "k": "fig", "v": desenho_canvas(k)},
           {"t": "O que está no bloco", "k": "dec", "v": [[a, b_, c] for a, b_, c in b["conteudo"]]}]
    if comp.get("tipos"): sec.append({"t": "Os tipos que o livro lista", "k": "ul", "v": [t if isinstance(t, str) else (t.get("nome", "") + (": " + t.get("descricao", "") if t.get("descricao") else "")) for t in comp["tipos"]]})
    sec += [{"t": f"Os {len(b['processos'])} processos que sustentam este bloco", "k": "ul", "v": [nomep(p) + ". " + (PX[p].get("descricao") or "").split(" No portal: ")[0][:220] + ("..." if len((PX[p].get("descricao") or "").split(" No portal: ")[0]) > 220 else "") for p in b["processos"]]},
            {"t": "Ferramentas e responsáveis", "k": "kv", "v": [["Ferramentas", "; ".join(b["ferramentas"])], ["Quem faz", "; ".join(b["quem"])]]},
            {"t": "De onde vem", "k": "cit", "v": cits_livro("business-model-generation", b["ingles"], n=3) + (cits_livro("business-model-generation", "Multi-Sided", n=2) if k == "seg" else cits_livro("business-model-generation", "FREE as a Business Model", n=2) if k == "rec" else [])}]
    item("bloco-" + k, G1, f"Bloco {b['nome']}: o conteúdo e os processos estão certos?", "Proposta da revisão", "mudou", sec, AP)

# Value Proposition Canvas dos dois lados
G2 = "As duas propostas de valor"
item("vpc-parceiro", G2, "A proposta de valor para o parceiro encaixa no que ele precisa?", "Proposta da revisão", "mudou", [
    {"t": "O que é", "k": "p", "v": ["O Value Proposition Canvas detalha um bloco do canvas: à direita, o perfil do cliente (as tarefas que ele tenta cumprir, as dores e os ganhos que busca); à esquerda, o que a Wise oferece e como alivia cada dor e cria cada ganho. Há encaixe quando cada dor importante tem um alívio."]},
    {"t": "Parceiro de software de gestão", "k": "fig", "v": desenho_vpc("parceiro (software de gestão)",
        ["Consultoria gratuita à base", "Comissão de 40%", "Wise Hub com as duas marcas", "Minicurso e kit", "Recomendação (Premium)", "Base Ativa (Elite)"],
        ["Cliente com processo comercial usa o sistema e renova", "Motivo para falar com quem sumiu", "Diferencial sem dar desconto"],
        ["Raio-x da base", "Receita extra por cliente indicado", "Casos em conjunto"],
        ["Reter a base de clientes", "Vender mais sem baixar o preço", "Fazer o cliente usar o sistema inteiro"],
        ["Cliente cancela por falta de resultado", "Negociação só por preço", "Time de CS sem o que oferecer"],
        ["Renovação e LTV maiores", "Ser visto como parceiro do resultado", "Indicações de volta"])},
    {"t": "De onde vem cada item", "k": "ul", "v": ["Tarefas, dores e ganhos: conversa com o Igor de 04/11 (retenção da base como valor central, FO-06), FO-08 (benefícios: mapeamento da saúde da base, maior LTV, diferenciação, case de sucesso) e a página dos parceiros já no ar.",
                                                    "Produtos e serviços: a escada de níveis aprovada (FO-12 e FO-14)."]},
    {"t": "De onde vem", "k": "cit", "v": cits_livro("value-proposition-design", "Value Proposition Canvas", n=3) + cits_livro("value-proposition-design", "plataforma", n=2)}], AP)
item("vpc-cliente", G2, "A proposta de valor para o cliente do parceiro encaixa no que ele precisa?", "Proposta da revisão", "mudou", [
    {"t": "Cliente do parceiro no ICP (3 vendedores ou mais)", "k": "fig", "v": desenho_vpc("cliente do parceiro",
        ["Diagnóstico de 2 h (R$ 2.000)", "Plano de ação em 2 dias úteis", "Wise Hub (R$ 3.000)", "Cases: +35% em média"],
        ["Mostra onde a venda trava, por pilar", "Plano com responsáveis e prazos", "Sem custo e sem venda forçada"],
        ["Comparação com o mercado", "Ferramentas e aulas no Hub", "Caminho para crescer"],
        ["Bater a meta de vendas", "Organizar o time comercial", "Tirar o comercial da dependência do dono"],
        ["Vendas imprevisíveis", "Não sabe onde está o problema", "Consultoria cara e sem garantia"],
        ["Crescer o faturamento", "Time que vende sem o dono", "Usar melhor o sistema que já paga"])},
    {"t": "De onde vem cada item", "k": "ul", "v": ["Produtos e serviços, valores e cases: FO-15.", "Dores e ganhos: as afirmações da Matriz 5x5 e os blocos do roteiro de diagnóstico, e o texto da página do cliente aprovado no FO-10."]},
    {"t": "De onde vem", "k": "cit", "v": cits_livro("value-proposition-design", "Pain Relievers", "Gain Creators", "B2B", n=3)}], AP)

# canais nas cinco fases
item("canais-fases", G2, "Os canais nas cinco fases estão certos?", "Proposta da revisão", "mudou", [
    {"t": "Parceiro", "k": "kv", "v": [["1. Conhecimento", "Anúncio no Meta com vídeo do Igor (4.1)."], ["2. Avaliação", "Página dos parceiros, com o vídeo, o valor de referência e os cases (4.1)."],
                                       ["3. Compra", "Cadastro com aceite, fila, WhatsApp e conversa de entrada (4.2 a 4.4)."], ["4. Entrega", "Portal: link, página do cliente com a logo, minicurso e kit (5.1 e 5.2)."],
                                       ["5. Pós-venda", "Grupo de WhatsApp, e-mail e comunicado do mês, encontro trimestral, lembretes de etapa (5.4, 7.7, 8.2)."]]},
    {"t": "Cliente do parceiro", "k": "kv", "v": [["1. Conhecimento", "Mensagem pronta do parceiro, com o link e o valor de referência (5.1.2)."], ["2. Avaliação", "Página do cliente com as duas marcas, o valor e os cases (11.4)."],
                                                  ["3. Compra", "Cadastro de qualificação e agenda do Google (6.1)."], ["4. Entrega", "Reunião de 2 horas, documento em até 2 dias úteis, acesso ao Hub (6.1)."],
                                                  ["5. Pós-venda", "E-mail com o próximo passo; Wise Hub; se quiser contratar, closer (6.1 e 6.3)."]]},
    {"t": "De onde vem", "k": "cit", "v": cits_livro("business-model-generation", "Channels", n=3)}], AP)

# ferramentas
G3 = "O que entra em cada ferramenta"
FER = [
    ("portal", "Portal Wise Partners", "O centro do programa: tudo o que precisa de registro, regra ou cálculo.", [
        "Páginas: dos parceiros (cadastro com aceite) e do cliente (cadastro, regra do ICP, agenda, autodiagnóstico, resultado).",
        "Administração (diretores e Gerente): configurações das páginas, fila de candidatos e aprovação, níveis e regras, campanhas, cases, acessos.",
        "Time (Gerente e consultores): clientes dos parceiros, registro do diagnóstico e do plano de ação, oportunidades com a origem, checagens de 6 e 12 meses.",
        "Parceiro: link e mensagem pronta, logo, clientes que entraram, etapas do onboarding, minicurso, kit, certificado, comissões.",
        "Sozinho: avisos, lembretes de etapa, ativação, proteção de origem, cálculo da matriz, do cubo, do nível e do CAC, fila de exceções."],
     "Diretores e Gerente (administradores)", f"{conta('PORTAL')} passos automáticos em {len(TAREFAS['PORTAL'])} processos, e quase todo passo manual registra algo aqui."),
    ("whatsapp", "WhatsApp", "Conversa, nunca registro: o que é combinado pelo WhatsApp é anotado no portal.", [
        "Fila: primeiro contato com o candidato, qualificação, link da agenda, confirmação na véspera e no dia, retomada de quem não responde.",
        "Grupo de cada parceiro: boas-vindas, retorno de cada etapa das oportunidades, parabéns na ativação, anúncios de nível.",
        "Closers avisam o Gerente a cada mudança de etapa."],
     "Gerente", "Usado em cerca de 30 processos."),
    ("agenda", "Google Agenda", "Horários das conversas e das reuniões.", [
        "Agenda dos parceiros: conversa de entrada de 45 minutos.", "Agenda dos clientes dos parceiros: reunião de diagnóstico de 2 horas, embutida na página.",
        "Limite do Gerente: 5 diagnósticos por semana; o que passar vai para a agenda de um consultor."], "Gerente", "Processos 4 e 6.1."),
    ("video", "Videochamada", "Onde acontecem a conversa de entrada, os diagnósticos, os encontros de alinhamento e o encontro trimestral.", [
        "A ferramenta (Google Meet, Zoom ou outra) não está definida no mapa. Pergunta abaixo."], "Gerente", "Processos 4.4, 6.1, 7.6 e 8.2.2."),
    ("email", "E-mail", "Avisos automáticos e o que precisa ficar por escrito.", [
        "Resultado do autodiagnóstico e próximo passo; documento do diagnóstico e plano de ação; lembretes de etapa a cada 14 dias; comunicado do mês; avisos de comissão.",
        "Depende do serviço de e-mail do portal (Resend), que ainda espera a conta e o DNS."], "Gerente", "Processos 5.4, 6.1, 6.7 e 8.2.1."),
    ("meta", "Meta Ads, pixel e GA4", "Atração de parceiros.", ["Anúncios com os vídeos do Igor, um código por anúncio no link, pixel e GA4 na página dos parceiros.", "Gasto informado toda semana no portal para o CAC."],
     "Diretor (dono da campanha)", "Processo 4.1."),
    ("hub", "Wise Hub", "O que o cliente do parceiro usa depois do diagnóstico.", ["Imersão, trilhas, calculadoras e checklists; acesso liberado depois do diagnóstico ou do autodiagnóstico.", "Como o Hub recebe a marca do parceiro continua em aberto."],
     "Quem cuida do Hub", "Processos 5.1 e 6.1."),
    ("doc", "Documento do diagnóstico", "O entregável da reunião.", ["Diagnóstico por pilar e plano de ação num documento da Wise, com as duas marcas, enviado em até 2 dias úteis.", "Onde ele é feito e guardado não está definido. Pergunta abaixo."], "Quem conduziu a reunião", "Processo 6.1."),
]
for k, nome, papel_, itens, dono, uso in FER:
    item("fer-" + k, G3, f"{nome}: é isso que entra nesta ferramenta?", "Proposta da revisão", "mudou", [
        {"t": "Para que serve", "k": "p", "v": [papel_]}, {"t": "O que entra", "k": "ul", "v": itens},
        {"t": "Dono e uso no mapa", "k": "kv", "v": [["Responde pela ferramenta", dono], ["Uso no mapa", uso]]}], AP)
item("video-qual", G3, "Qual ferramenta de videochamada é a padrão?", "Decisão em aberto", "aberto", [
    {"t": "Por que importa", "k": "p", "v": ["A agenda do Google já gera o link do Google Meet sozinha em cada horário marcado. Com outra ferramenta, o link precisa entrar à mão ou por integração."]},
    {"t": "O que eu recomendo, e por quê", "k": "rec", "v": ["Google Meet, se a Wise usa Google Workspace: o link sai no convite sem ninguém mexer."]}], ["Google Meet", "Zoom", "Microsoft Teams", "Outra (comente)"])
item("doc-onde", G3, "Onde o documento do diagnóstico é feito e guardado?", "Decisão em aberto", "aberto", [
    {"t": "Por que importa", "k": "p", "v": ["O documento tem prazo de 2 dias úteis, pode ser feito pelo Gerente ou por um consultor e precisa ir ao closer se o cliente quiser contratar. Se cada um fizer num lugar, o prazo e o padrão se perdem."]},
    {"t": "O que eu recomendo, e por quê", "k": "rec", "v": ["Montado no portal a partir do que foi registrado na reunião (resultado da matriz e plano de ação), gerado em PDF com as duas marcas. Fica guardado junto do cliente e o closer acessa pelo portal."]}],
    ["Montado no portal e gerado em PDF", "Num modelo no Google Docs, numa pasta do Drive por parceiro", "Num modelo de apresentação (Canva ou Slides)", "Outro (comente)"])

# responsáveis
G4 = "O que cada responsável faz"
RESP = [(GP_ := next(x["id"] for x in d["papeis"] if x["nome"] == "Gerente de Parcerias"), "Gerente de Parcerias (Guilherme)", "Dono de todos os processos. Opera a fila, as conversas, até 5 diagnósticos por semana, os rituais e as medidas, e administra o portal."),
        (next(x["id"] for x in d["papeis"] if x["nome"] == "Diretor"), "Diretores (Igor e demais)", "Administram o portal com acesso total. Donos da campanha e das metas; gravam os vídeos; aprovam as regras; participam da conversa semanal, das revisões dos Elite e do encontro trimestral; assinam o aviso de desligamento."),
        (next(x["id"] for x in d["papeis"] if x["nome"] == "Consultor da Wise Makers"), "Consultores da Wise Makers", "Conduzem os diagnósticos que passam do limite do Gerente e registram no portal; relatam necessidades para a Prateleira e problemas com parceiros; registram a checagem de 6 e 12 meses."),
        (next(x["id"] for x in d["papeis"] if x["nome"].startswith("Closer")), "Closers das empresas do grupo", "Recebem o lead com o contexto (inclusive o diagnóstico e o plano), fazem o primeiro contato e fecham; avisam o Gerente a cada mudança de etapa. Não entram no portal."),
        (next(x["id"] for x in d["papeis"] if x["nome"] == "Financeiro"), "Financeiro", "Confirma a compensação do primeiro pagamento do cliente e paga a comissão ao CNPJ do parceiro."),
        (next(x["id"] for x in d["papeis"] if x["nome"].startswith("Responsável")), "Parceiro (responsável nomeado)", "Faz as etapas do onboarding (minicurso, anúncio, envio do link), sobe a logo, emite a nota da comissão, envia a apresentação de vendas ao subir para Premium e convida a base no Base Ativa."),
        (next(x["id"] for x in d["papeis"] if x["nome"].startswith("Candidato")), "Candidato a parceiro", "Envia o cadastro com o aceite, marca o horário e entra no portal com a senha provisória na conversa de entrada.")]
for pid_, nome, resumo in RESP:
    n = conta(pid_)
    item("resp-" + pid_, G4, f"{nome}: é isso que este papel faz?", "Proposta da revisão", "mudou", [
        {"t": "Em resumo", "k": "p", "v": [resumo]},
        {"t": "Tamanho no mapa", "k": "kv", "v": [["Passos manuais", f"{n} passos em {len(TAREFAS[pid_])} processos"]] + ([["Dono de", f"{sum(1 for p in PX.values() if p.get('dono') == pid_)} processos"]] if any(p.get('dono') == pid_ for p in PX.values()) else [])},
        {"t": "Todos os passos, processo a processo", "k": "det", "v": lista_tarefas(pid_)}], AP)

# a reunião de diagnóstico de 2 horas
G5 = "A reunião de diagnóstico de 2 horas"
item("diag-mescla", G5, "A mescla da Matriz 5x5 com o roteiro de diagnóstico está certa?", "Proposta da revisão", "mudou", [
    {"t": "O que você pediu", "k": "p", "v": ["A base é a Matriz 5x5, porque as perguntas dela são necessárias, e o roteiro de diagnóstico (o da Maqnobre como exemplo) entra para aprofundar, adaptado a cada cliente."]},
    {"t": "A proposta", "k": "p", "v": ["Cada um dos 12 blocos do roteiro vira o aprofundamento de um pilar da matriz. A matriz dá a nota (25 afirmações, de 1 a 5); os blocos do roteiro são as perguntas abertas que explicam a nota e geram o plano de ação. O roteiro da Maqnobre é de uma fábrica de máquinas: perguntas como 'máquinas vendidas' ou 'capacidade da fábrica' viram 'unidades vendidas' ou 'capacidade de entrega' no modelo padrão, e voltam ao específico na adaptação para cada cliente."]},
    {"t": "Os pilares e os blocos do roteiro", "k": "fig", "v": desenho_5x5()},
    {"t": "Pilar por pilar", "k": "kv", "v": [[p, "; ".join(b)] for p, b in PILARES]}], AP)
item("diag-agenda", G5, "A divisão das 2 horas está boa?", "Proposta da revisão", "mudou", [
    {"t": "Proposta de agenda", "k": "fig", "v": desenho_agenda()},
    {"t": "Bloco a bloco", "k": "kv", "v": [[f"{n} ({m} min)", t] for n, m, t in AGENDA]},
    {"t": "Por que esta ordem", "k": "p", "v": ["Começa pelos números e pela gestão (bloco 1.1 a 1.4 do roteiro), que dão a base para as outras partes, e termina com o plano de ação na mesma conversa, como você definiu. O bloco de IA e agente (1.6) fica como opcional: nem todo cliente está nesse ponto."]}], AP)
item("diag-plano", G5, "O plano de ação padrão tem estas três partes?", "Proposta da revisão", "mudou", [
    {"t": "No roteiro da Maqnobre", "k": "ul", "v": ["Plano 1: passar dados (faturamento e vendas dos últimos 5 anos mês a mês, por vendedor, por linha e por canal; meta do ano; prints de conversas; propostas em aberto; catálogos e tabela de preços).",
                                                      "Plano 2: calcular quanto do faturamento pode ir para o vendedor.", "Plano 3: agendar a reunião gravada de produto (base do agente e dos materiais)."]},
    {"t": "Proposta para o modelo padrão", "k": "ul", "v": ["1. O que o cliente envia: os dados do roteiro 2.1, com a planilha de gestão simples.",
                                                             "2. O que a Wise calcula ou devolve: por exemplo, o percentual possível para comissão, a meta necessária, a taxa de conversão.",
                                                             "3. As três ações prioritárias, uma por pilar mais frágil, com responsável e prazo, no documento enviado em até 2 dias úteis.",
                                                             "4. O próximo encontro, quando houver (como a reunião gravada de produto), e, se o cliente quiser ir além, a conversa com o closer."]},
    {"t": "Ponto de atenção", "k": "p", "v": ["No roteiro, o plano de ação é o começo de um projeto (dados, cálculos, próxima reunião). No programa, o diagnóstico é gratuito e o próximo passo pago é a consultoria. Vale decidir até onde vai o trabalho gratuito: a proposta acima para no documento com as três ações e deixa as reuniões seguintes para quem contratar."]}], AP)
item("diag-adapta", G5, "Quem adapta o roteiro a cada cliente, e com o quê?", "Proposta da revisão", "mudou", [
    {"t": "Proposta", "k": "p", "v": ["Quem vai conduzir a reunião adapta o roteiro na véspera, a partir do cadastro de qualificação (segmento, faturamento, número de vendedores, principal desafio) e do site do cliente, trocando os exemplos e cortando o que não se aplica. O portal mostra o cadastro e um roteiro padrão já separado por pilar."]},
    {"t": "Por que", "k": "p", "v": ["Você disse que o roteiro tem que ser adaptado caso a caso. Sem um ponto de partida padrão no portal, cada consultor monta o seu e os resultados deixam de ser comparáveis."]}], AP)
item("diag-complexa", G5, "Como se confere a 'venda mais complexa' do ICP?", "Decisão em aberto", "aberto", [
    {"t": "Contexto", "k": "p", "v": ["No FO-15 você definiu o ICP da reunião: 3 vendedores ou mais, faturamento de pelo menos R$ 250 mil por mês e venda mais complexa. Os dois primeiros já são perguntas do cadastro; o terceiro não tem campo."]},
    {"t": "O que eu recomendo, e por quê", "k": "rec", "v": ["Uma pergunta nova no cadastro ('Quanto tempo leva, em média, do primeiro contato à venda?', com faixas), e venda de mais de 30 dias conta como complexa. A página decide sozinha, sem esperar ninguém."]}],
    ["Pergunta no cadastro sobre o ciclo de venda, com corte em 30 dias", "Pergunta no cadastro sobre o ticket médio (comente o corte)", "O Gerente confere antes de confirmar a reunião", "Outra forma (comente)"])

# hipóteses de maior risco
G6 = "O que testar primeiro"
item("hipoteses", G6, "Estas são as hipóteses de maior risco do modelo, e estes os números para acompanhar?", "Proposta da revisão", "mudou", [
    {"t": "O que é", "k": "p", "v": ["Todo modelo de negócio novo se apoia em hipóteses que ainda não foram provadas. O método é listar as mais importantes com menos evidência e medir primeiro. Elas se dividem em três: o cliente quer (desejabilidade), dá para entregar (viabilidade técnica) e se paga (viabilidade financeira)."]},
    {"t": "As hipóteses e o número de cada uma", "k": "kv", "v": [
        ["O parceiro quer (desejabilidade)", "Parceiros que entram mandam o link para a base. Número: parceiros ativados sobre parceiros aprovados."],
        ["O cliente do parceiro quer (desejabilidade)", "Clientes que recebem o link marcam a reunião de 2 horas. Número: reuniões marcadas sobre cadastros no ICP, e comparecimento."],
        ["Dá para entregar (viabilidade técnica)", "A agenda comporta as reuniões: 5 por semana do Gerente e consultores disponíveis para o resto. Número: dias entre o cadastro e a reunião."],
        ["Se paga (viabilidade financeira)", "Diagnósticos viram clientes da consultoria em número suficiente para o CAC ficar abaixo dos canais ativos. Número: clientes fechados sobre diagnósticos feitos, e custo por diagnóstico."]]},
    {"t": "De onde vem", "k": "cit", "v": cits_livro("testing-business-ideas", "assumption", "desirability", "viability", n=3)}], AP)
item("mais", G6, "Algo mais sobre o modelo, as ferramentas ou os responsáveis?", "Comentário livre", "igual", [
    {"t": "", "k": "p", "v": ["Qualquer ajuste que não coube nas perguntas anteriores."]}], [], tipo="texto")

# ---------------------------------------------------------------- página (mesmo renderizador do FO-14)
json.dump(ITENS, open(BASE + "/ferramentas/fo16_itens.json", "w"), ensure_ascii=False, indent=1)
src14 = open(BASE + "/ferramentas/fo14_pagina.py", encoding="utf-8").read()
MONTAR = src14[src14.index('MONTAR = r"""') + len('MONTAR = r"""'):src14.index('"""\npagina = pagina[:i] + MONTAR')]
CSS = src14[src14.index('pagina = pagina.replace("</style>", """') + len('pagina = pagina.replace("</style>", """'):src14.index('</style>""", 1)')]
MONTAR = MONTAR.replace("card.append(b, obs);", "if (it.tipo === 'texto') { obs.hidden = false; b.hidden = true; obs.rows = 6; obs.placeholder = 'Escreva aqui'; }\n    card.append(b, obs);")
pagina = open(BASE + "/ferramentas/fo09_modelo.html", encoding="utf-8").read()
i = pagina.index("function montar() {"); j = pagina.index("function ler(it) {")
pagina = pagina[:i] + MONTAR + pagina[j:]
for a, b in {"<title>Perguntas ao patrocinador</title>": "<title>Processos no Business Model Canvas</title>",
             "const COL = 'fo14_itens', META = 'respostas/FO-14', CHAVE = 'fo14-rascunho';": "const COL = 'fo21_itens', META = 'respostas/FO-21', CHAVE = 'fo21-rascunho';"}.items():
    assert a in pagina, a; pagina = pagina.replace(a, b)
blocos = []
for it in ITENS:
    if not blocos or blocos[-1][0] != it["bloco"]: blocos.append([it["bloco"], it["id"], 0])
    blocos[-1][2] += 1
indice = "".join(f'<li><a href="#c-{esc(a)}">{esc(b)}</a> <span>{n} {"pergunta" if n == 1 else "perguntas"}</span></li>' for b, a, n in blocos)
i = pagina.index("<header>"); j = pagina.index("</header>") + len("</header>")
pagina = pagina[:i] + f"""<header>
    <p class="eyebrow">FO-16 · Mapeamento no padrão do Business Model Canvas</p>
    <h1>O Wise Partners em nove blocos: processos, ferramentas e responsáveis</h1>
    <p class="lead">Coloquei os {len(PX)} processos do mapa aprovado (v11) no Business Model Canvas, a partir dos quatro livros da pasta (Business Model Generation, Value Proposition Design, Testing Business Ideas e The Invincible Company). Para cada bloco você vê o conteúdo, de onde veio cada item, os processos que o sustentam, as ferramentas e quem faz. Depois vêm o que entra em cada ferramenta, o que cada responsável faz, passo a passo, e a reunião de diagnóstico de 2 horas com a Matriz 5x5 mesclada ao roteiro.</p>
    <div class="guia">
      <p><strong>Etiquetas nos itens de cada bloco:</strong></p>
      <ul class="decs">
        <li class="ok"><strong>Já decidido por você</strong><span class="org">com o formulário de origem</span><p>Veio das suas respostas. Aqui só muda de lugar: passa a aparecer no bloco do canvas.</p></li>
        <li class="rv"><strong>Proposta da revisão</strong><span class="org">ideia minha</span><p>Leitura minha a partir dos livros. Só vale se você aprovar.</p></li>
      </ul>
      <p>As respostas são salvas enquanto você marca, então dá para fazer em várias vezes. Depois da validação, eu redesenho o mapa e o mapa interativo ganha a visão do canvas.</p>
    </div>
    <nav class="indice" aria-label="Blocos do formulário"><ol>{indice}</ol></nav>
  </header>""" + pagina[j:]
pagina = pagina.replace("</style>", CSS + "</style>", 1)
pagina = pagina.replace("__DADOS__", json.dumps(ITENS, ensure_ascii=False).replace("</", "<\\/")).replace("__TOTAL__", str(len(ITENS)))
assert "—" not in pagina and "–" not in pagina, [pagina[m.start() - 40:m.start() + 10] for m in re.finditer("[—–]", pagina)][:3]
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
open(SAIDA, "w", encoding="utf-8").write(pagina)
print(len(ITENS), "perguntas; processos fora do canvas:", fora, "; notas de livros:", sorted(NOTAS), "; tamanho", len(pagina) // 1024, "KB")
