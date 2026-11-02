# To-be v5 do Programa Wise Partners: princípios de 17 livros, especificações, Playbook v3.1 e 63 decisões do patrocinador (FO-01 a FO-04).
# Regra nova do patrocinador: as aprovações dele não pesam mais que os livros; onde divergem, há contradição registrada e pergunta de conciliação.
# Regra de status: livros e patrocinador de acordo = confirmado; especificação = declarado; proposta dos livros ainda não decidida = hipotese;
# patrocinador contra livros (ou livro contra livro) = contestado, com contradição aberta e pergunta de conciliação na Rodada 4.
import json, re, sys, glob, os
sys.path.insert(0, "/home/user/.claude/skills/mapear-processos/scripts")
import mapa as M

PASTA = "/home/user/mapeamentos/wise-partners-to-be"
BASE = "/home/user/mapeamentos/wise-partners-to-be"
ASIS = json.load(open("/home/user/mapeamentos/wise-partners/mapa.json"))
FW = {json.load(open(f))["frente"]: json.load(open(f)) for f in glob.glob(BASE + "/fontes/frameworks/*.json")}
NOTAS = {json.load(open(f))["slug"]: json.load(open(f)) for f in glob.glob(BASE + "/fontes/notas-dos-livros/*.json")}
LIVRO = {n["slug"]: f"{n['livro']} ({n['autores']})" for n in NOTAS.values()}
RESP = {os.path.basename(f)[2:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-01/fo06_itens/T-*.json")}
RESP2 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-02/fo07_itens/R2-*.json")}
RESP3 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-03/fo08_itens/R3-*.json")}
RESP4 = {os.path.basename(f)[3:-5]: json.load(open(f)) for f in glob.glob(BASE + "/respostas/FO-04/fo09_itens/R4-*.json")}
V3 = {json.load(open(f))["slug"]: json.load(open(f)) for f in glob.glob(BASE + "/fontes/v3/*.json") if "fatores" not in f}
FTJ = json.load(open(BASE + "/fontes/v3/fatores-e-tipos.json"))
for _s, _n in V3.items():
    LIVRO[_s] = f"{_n['livro'].split(':')[0]} ({_n['autores'].split(' (')[0]})"
d = M.carregar(PASTA)
HOJE = "2026-11-02"
_cache = {}

def nid(pref):
    return M.proximos_ids(d, pref)[0]

def add(col, pref, **kw):
    obj = {"id": nid(pref), **kw}
    d[col].append(obj)
    return obj["id"]

def ev_raw(tipo, fonte, trecho, local, pessoa=None, data=HOJE):
    return add("evidencias", "EV", tipo=tipo, fonte=fonte, pessoa=pessoa, data=data, trecho=trecho, local=local)

SPEC = {"s1": ("Especificação 001: Portal Wise Partners", "/home/user/specs/001-portal-wise-partners/spec.md"),
        "s2": ("Especificação 002: Portal Wise Partners 2.0 (23/10/2026)", "/home/user/specs/002-evolucao-metodo-octo/spec.md")}
TXT = {k: re.sub(r"\s+", " ", open(p, encoding="utf-8").read().replace("**", "").replace("*", "")) for k, (_, p) in SPEC.items()}

def S(doc, trecho, local):
    t = re.sub(r"\s+", " ", trecho)
    assert t in TXT[doc], f"Trecho não encontrado em {doc}: {t[:100]}"
    k = ("s", doc, t)
    if k not in _cache:
        _cache[k] = ev_raw("documento", SPEC[doc][0], trecho, local)
    return _cache[k]

def F(frente, fw, cit):
    """Citação literal de um modelo conceitual (segunda leitura)."""
    f = FW[frente]["frameworks"][fw]
    c = f["citacoes"][cit]
    k = ("f", frente, fw, cit)
    if k not in _cache:
        _cache[k] = ev_raw("documento", LIVRO[f["livro"]], c["trecho"], f"{c['pagina']} ({f['nome'].split(' (')[0][:80]})")
    return _cache[k]

def B(slug, needle):
    """Citação da primeira leitura (recomendações)."""
    n = NOTAS[slug]
    itens = [(r.get("recomendacao") or r.get("descricao") or r.get("alerta") or r.get("definicao") or r.get("nome", ""), r)
             for col in ("recomendacoes", "processos", "metricas", "alertas") for r in n.get(col, [])]
    r = next(r for txt, r in itens if needle in txt)
    k = ("b", slug, r["citacao"])
    if k not in _cache:
        _cache[k] = ev_raw("documento", LIVRO[slug], r["citacao"], r["pagina"])
    return _cache[k]

def D(qid, validacao=True):
    """Decisão do patrocinador no FO-01 (to-be v1)."""
    v = RESP[qid].get("data", RESP[qid])
    val = v.get("valor", ""); val = "; ".join(val) if isinstance(val, list) else val
    texto = val + ((". " + v["obs"]) if v.get("obs") else "")
    k = ("d", qid)
    if k not in _cache:
        _cache[k] = ev_raw("validacao" if validacao else "formulario", "FO-01: To-be, decisões do patrocinador", texto, f"FO-01/{qid}", pessoa="PE-01")
    return _cache[k]

def VP(slug, i, j=0):
    """Citação de um princípio da terceira leitura (livros novos)."""
    c = V3[slug]["principios"][i]["citacoes"][j]
    k = ("vp", slug, i, j)
    if k not in _cache:
        _cache[k] = ev_raw("documento", LIVRO[slug], c["trecho"], f"{c['pagina']} (princípio: {V3[slug]['principios'][i]['principio'][:70]})")
    return _cache[k]

def VF(slug, i, j=0):
    f = V3[slug]["frameworks"][i]; c = f["citacoes"][j]
    k = ("vf", slug, i, j)
    if k not in _cache:
        _cache[k] = ev_raw("documento", LIVRO[slug], c["trecho"], f"{c['pagina']} ({f['nome'].split(' (')[0][:70]})")
    return _cache[k]

def FTC(j, outro=None):
    """Citação da frente de fatores e tipos (Strategic Alliances ou outro livro)."""
    if outro is None:
        c = FTJ["strategic_alliances"]["citacoes"][j]; fonte = LIVRO["strategic-alliances"]
    else:
        o = FTJ["outros_livros"][outro]; c = o["citacoes"][j]; fonte = o["livro"]
    k = ("ft", outro, j)
    if k not in _cache:
        _cache[k] = ev_raw("documento", fonte, c["trecho"], f"{c['pagina']} (tipologia e fatores)")
    return _cache[k]

def D2(qid):
    """Decisão do patrocinador no FO-02 (Rodada 2)."""
    v = RESP2[qid].get("data", RESP2[qid])
    val = v.get("valor", ""); val = "; ".join(val) if isinstance(val, list) else val
    k = ("d2", qid)
    if k not in _cache:
        _cache[k] = ev_raw("validacao", "FO-02: Rodada 2, to-be refeito a partir dos livros", val + ((". " + v["obs"]) if v.get("obs") else ""), f"FO-02/{qid}", pessoa="PE-01")
    return _cache[k]

def D3(qid):
    """Decisão do patrocinador no FO-03 (Rodada 3)."""
    v = RESP3[qid].get("data", RESP3[qid])
    val = v.get("valor", ""); val = "; ".join(val) if isinstance(val, list) else val
    k = ("d3", qid)
    if k not in _cache:
        _cache[k] = ev_raw("validacao", "FO-03: Rodada 3, princípios e to-be refatorado", (val + ". " if val else "") + v.get("obs", ""), f"FO-03/{qid}", pessoa="PE-01")
    return _cache[k]

def D4(qid):
    """Decisão do patrocinador no FO-04 (Rodada 4, conciliação com os livros)."""
    v = RESP4[qid].get("data", RESP4[qid])
    val = v.get("valor", ""); val = "; ".join(val) if isinstance(val, list) else val
    k = ("d4", qid)
    if k not in _cache:
        _cache[k] = ev_raw("validacao", "FO-04: Rodada 4, onde os livros discordam das decisões", (val + ". " if val else "") + v.get("obs", ""), f"FO-04/{qid}", pessoa="PE-01")
    return _cache[k]

def A(asis_ev):
    e = next(x for x in ASIS["evidencias"] if x["id"] == asis_ev)
    k = ("a", asis_ev)
    if k not in _cache:
        _cache[k] = ev_raw(e["tipo"], e["fonte"], e["trecho"], f"{e['local']} (mapa as-is, {asis_ev})", pessoa="PE-01" if e.get("pessoa") else None, data=e["data"])
    return _cache[k]

# ---------------------------------------------------------------- organização, pessoas, papéis, sistemas
d["organizacao"].update({
    "nome": "Programa Wise Partners (to-be)",
    "descricao": "Canal de aquisição mais barato que os canais ativos: um ecossistema pequeno, orquestrado pela Wise Makers com o portal no centro, em que parceiros que vendem para a indústria geram e recebem oportunidades e ganham comunidade, reconhecimento e comissão por regra única.",
    "setor": "Consultoria de gestão para indústrias (ecossistema de parceiros)",
    "objetivo_do_mapeamento": "Refatorar todos os conceitos de uma vez: princípios ordenados de 17 livros, hierarquia e arquitetura de processos to-be com o portal no centro da gestão, e o modelo de negócio do programa. As decisões do patrocinador não pesam mais que os livros: onde divergem, a divergência fica registrada e é conciliada.",
    "escopo": {"inclui": ["Arquitetura do ecossistema e regras do programa", "Gestão por rituais e por exceção", "Jornada do parceiro (atrair, integrar, desenvolver, reter ou encerrar)",
                          "Oportunidades do ecossistema (indicações, prateleira, cruzamento, Base Ativa)", "Comunidade, capacitação, dados, contratos e portal"],
               "exclui": ["Vender e entregar a consultoria ao cliente indicado (processos comerciais e de entrega das empresas do grupo)"]},
    "patrocinador": "PE-01"})

for nome, pai, evs in [("Parcerias", None, [S("s2", "Hoje só o Gerente de Parcerias está no time; a estrutura já serve para quando houver mais pessoas.", "User Story 15")]),
                       ("Diretoria", None, [S("s1", "Igor aprova no portal.", "User Story 4")]),
                       ("Comercial e entrega do grupo", None, [S("s1", "ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9")]),
                       ("Financeiro", None, [S("s1", "avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6")])]:
    add("areas", "AR", nome=nome, pai=pai, status="declarado", evidencias=evs)
GP = add("papeis", "PA", nome="Gerente de Parcerias", area="AR-01", externo=False, status="confirmado", evidencias=[D("Q-0013")],
         descricao="Dono de todas as tarefas do portal, inclusive as executadas por consultores, comercial, financeiro ou parceiro.")
DIR = add("papeis", "PA", nome="Diretor", area="AR-02", externo=False, status="confirmado", evidencias=[D("Q-0021"), D2("Q-0011")], descricao="Define as metas e assina o termo; não faz aprovação criteriosa da negociação.")
CONS = add("papeis", "PA", nome="Closer da empresa do grupo", area="AR-03", externo=False, status="confirmado", evidencias=[D("Q-0014"), D("Q-0013"), D2("Q-0014")],
           descricao="Recebe o lead direto do Gerente de Parcerias, que combina com ele pessoalmente; faz o primeiro contato e fecha; não entra no portal.")
FIN = add("papeis", "PA", nome="Financeiro", area="AR-04", externo=False, status="declarado", evidencias=[S("s1", "avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6")])
RESP_P = add("papeis", "PA", nome="Responsável nomeado no parceiro", area=None, externo=True, status="declarado", evidencias=[S("s2", "Responsável nomeado com 2 horas ou mais por semana no primeiro mês", "Apêndice A")])
add("pessoas", "PE", nome="Guilherme Faccin", cargo="Consultor Wise Makers e Gerente de Parcerias", papeis=[GP], perfil="lideranca", contato="guilherme@wisemakers.com.br", sabe_sobre=[], indicado_por=None, origem="patrocinador")
add("pessoas", "PE", nome="Igor Makoto", cargo="Diretor", papeis=[DIR], perfil="lideranca", contato="", sabe_sobre=[], indicado_por="PE-01", origem="mapa as-is")
SI_POR = add("sistemas", "SI", nome="Portal Wise Partners", status="declarado", evidencias=[S("s2", "A versão 1 do portal está construída e testada com dados fictícios.", "Contexto")])
SI_WPP = add("sistemas", "SI", nome="Comunidade Wise Partners no WhatsApp (um grupo por parceiro)", status="confirmado", evidencias=[D("Q-0012")])
SI_AUT = add("sistemas", "SI", nome="Autentique", status="declarado", evidencias=[S("s1", "O contrato é enviado para assinatura no Autentique fora do portal, e o PDF assinado é anexado.", "User Story 4")])
SI_HUB = add("sistemas", "SI", nome="Wise Hub", status="declarado", evidencias=[S("s2", "As trilhas ficam só no portal, nunca no Wise Hub, porque o Hub é aberto à carteira do parceiro.", "User Story 10")])

for texto, evs in [
    ("A especificação e o web app prevalecem sobre o Playbook v3.1, que está desatualizado.", [A("EV-0109"), A("EV-0110")]),
    ("O to-be é refeito do zero a partir dos modelos conceituais dos livros, com mais processos e mais detalhe, mesmo que mude 100% do desenho anterior.", [D("Q-0001")]),
    ("Os três pilares existem desde o primeiro parceiro, mas a entrega a cada um segue a escada de pacotes do Playbook v3.1: o que o parceiro recebe acompanha o que ele consegue devolver, e abrir mais é orgânico.", [D("Q-0002"), D4("Q-0017"), A("EV-0025")]),
    ("Metas e horas não são fixadas agora: o desenho guarda só a capacidade de definir metas e de gerir o tempo dedicado ao programa.", [D("Q-0003"), D("Q-0004")]),
    ("A comunicação com os parceiros fica na comunidade Wise Partners no WhatsApp; o portal não vira canal de conversa.", [D("Q-0012")]),
    ("Todas as tarefas do portal têm o Gerente de Parcerias como dono, mesmo quando outra pessoa executa; consultores e comercial não entram no portal.", [D("Q-0013")]),
    ("O programa é um canal de aquisição de receita mais barato que os canais ativos; a comissão só barateia ainda mais o CAC e nada deve complicar o programa a ponto de reduzir a adesão.", [D2("Q-0015")]),
    ("A comissão é regra única, sem exceção por parceiro.", [D2("Q-0005")]),
    ("O lead vai direto ao closer da empresa do grupo; o Gerente conversa com o closer quando há indicação ou proposta nova, sem SLA interno, e combina com cada closer um aviso curto por WhatsApp a cada mudança de etapa.", [D2("Q-0014"), D3("Q-0008"), D4("Q-0016")]),
    ("Toda semana, o Gerente conversa com o Igor sobre os parceiros, apoiado num painel simples e estratégico que permite discutir caso a caso.", [D3("Q-0008")]),
    ("O CAC acompanhado é só o do Wise Partners; ninguém informa o CAC de outros canais no portal.", [D3("Q-0005")]),
    ("O CAC do Wise Partners e o valor devolvido ao parceiro ficam lado a lado no painel, com o mesmo peso, em todas as fases.", [D4("Q-0014")]),
    ("A comissão em dinheiro é igual para todos; o que varia por tipo de parceiro é o não monetário (acesso, palco, apoio); a regra é revista depois de dois trimestres com dados de permanência.", [D4("Q-0015")]),
    ("O Gerente continua dono de todas as tarefas, sem teto; as horas dedicadas aparecem no painel da semana.", [D4("Q-0018"), D4("Q-0020")]),
    ("O nível de entrada segue a especificação: faixa de clientes no ICP.", [D4("Q-0019")]),
    ("O equilíbrio entre dar e receber é medido só por dentro, para o cubo; o parceiro nunca vê placar, e na comunidade aparece o dar.", [D4("Q-0023")]),
    ("O Gerente decide o desligamento e o Igor assina o aviso formal.", [D3("Q-0009")]),
    ("As decisões do patrocinador não pesam mais que os livros: onde divergem, a divergência é registrada e conciliada.", [D3("Q-0001")]),
    ("O Diretor só assina o termo; o Gerente de Parcerias negocia com autonomia.", [D2("Q-0011")]),
    ("A Prateleira pede ao fornecedor só contrapartida não financeira (ação conjunta ou condição comercial para a indústria).", [D2("Q-0015")]),
    ("Passo a passo detalhado só para os processos que viram quadro, fila ou ritual; os demais ficam no nível de dono, gatilho e entregas.", [A("EV-0004")]),
]:
    add("decisoes", "DE", data=HOJE, texto=texto, por="PE-01", provisoria=False, evidencias=evs)
DE_FLUXO = d["decisoes"][-1]["id"]

exec(open(BASE + "/ferramentas/tobe5_negocio.py").read())
exec(open(BASE + "/ferramentas/tobe5_processos.py").read())
exec(open(BASE + "/ferramentas/tobe5_fluxos.py").read())
exec(open(BASE + "/ferramentas/tobe5_rodada3.py").read())
exec(open(BASE + "/ferramentas/tobe5_contradicoes.py").read())
exec(open(BASE + "/ferramentas/tobe5_perguntas.py").read())
exec(open(BASE + "/ferramentas/tobe5_validacao.py").read())
M.salvar(PASTA, d)
print(len(d["evidencias"]), "evidências;", len(d["processos"]), "processos;", len(d["perguntas"]), "perguntas;", len(d["fatos"]), "fatos")
