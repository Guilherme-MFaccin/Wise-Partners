# To-be v2 do Programa Wise Partners, refeito do zero a partir dos modelos conceituais dos 11 livros (segunda leitura),
# das especificações do web app e das 22 decisões do patrocinador (FO-01).
# Regra de status: decisão do patrocinador = confirmado; especificação = declarado; proposta dos livros = hipotese com pergunta no FO-02.
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
d = M.carregar(PASTA)
HOJE = "2026-11-01"
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

def A(asis_ev):
    e = next(x for x in ASIS["evidencias"] if x["id"] == asis_ev)
    k = ("a", asis_ev)
    if k not in _cache:
        _cache[k] = ev_raw(e["tipo"], e["fonte"], e["trecho"], f"{e['local']} (mapa as-is, {asis_ev})", pessoa="PE-01" if e.get("pessoa") else None, data=e["data"])
    return _cache[k]

# ---------------------------------------------------------------- organização, pessoas, papéis, sistemas
d["organizacao"].update({
    "nome": "Programa Wise Partners (to-be)",
    "descricao": "Ecossistema orquestrado pela Wise Makers em que indústrias encontram, com contexto, os fornecedores e a consultoria certos; parceiros que vendem para a indústria geram e recebem oportunidades e ganham comunidade, credibilidade e comissão.",
    "setor": "Consultoria de gestão para indústrias (ecossistema de parceiros)",
    "objetivo_do_mapeamento": "Desenhar do zero a hierarquia e a arquitetura de processos to-be que o Portal Wise Partners vai operar, e o modelo de negócio do programa, a partir dos modelos conceituais de 11 livros e das decisões do patrocinador.",
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
DIR = add("papeis", "PA", nome="Diretor", area="AR-02", externo=False, status="confirmado", evidencias=[D("Q-0021"), S("s1", "Igor aprova no portal.", "User Story 4")])
CONS = add("papeis", "PA", nome="Consultor ou comercial do grupo", area="AR-03", externo=False, status="confirmado", evidencias=[D("Q-0014"), D("Q-0013")],
           descricao="Faz o primeiro contato e vende; não entra no portal; recebe briefing e pedidos pelo Gerente de Parcerias.")
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
    ("Os três pilares (Prateleira, Base Ativa e indicações) entram juntos desde o primeiro parceiro.", [D("Q-0002")]),
    ("Metas e horas não são fixadas agora: o desenho guarda só a capacidade de definir metas e de gerir o tempo dedicado ao programa.", [D("Q-0003"), D("Q-0004")]),
    ("A comunicação com os parceiros fica na comunidade Wise Partners no WhatsApp; o portal não vira canal de conversa.", [D("Q-0012")]),
    ("Todas as tarefas do portal têm o Gerente de Parcerias como dono, mesmo quando outra pessoa executa; consultores e comercial não entram no portal.", [D("Q-0013")]),
    ("Passo a passo detalhado só para os processos que viram quadro, fila ou ritual; os demais ficam no nível de dono, gatilho e entregas.", [A("EV-0004")]),
]:
    add("decisoes", "DE", data=HOJE, texto=texto, por="PE-01", provisoria=False, evidencias=evs)
DE_FLUXO = d["decisoes"][-1]["id"]

exec(open(BASE + "/ferramentas/tobe2_negocio.py").read())
exec(open(BASE + "/ferramentas/tobe2_processos.py").read())
exec(open(BASE + "/ferramentas/tobe2_fluxos.py").read())
exec(open(BASE + "/ferramentas/tobe2_perguntas.py").read())
M.salvar(PASTA, d)
print(len(d["evidencias"]), "evidências;", len(d["processos"]), "processos;", len(d["perguntas"]), "perguntas;", len(d["fatos"]), "fatos")
