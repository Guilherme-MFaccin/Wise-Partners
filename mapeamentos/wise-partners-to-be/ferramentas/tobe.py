# To-be do Programa Wise Partners: o desenho que o Portal vai operar.
# Desenho aprovado (especificações 001 e 002, que prevalecem sobre o Playbook por decisão do patrocinador) entra como "declarado".
# O que vem dos livros e ainda não foi decidido entra como "hipotese", sempre com pergunta ao patrocinador.
import json, re, sys, glob
sys.path.insert(0, "/home/user/.claude/skills/mapear-processos/scripts")
import mapa as M

PASTA = "/home/user/mapeamentos/wise-partners-to-be"
ASIS = json.load(open("/home/user/mapeamentos/wise-partners/mapa.json"))
d = M.carregar(PASTA)
HOJE = "2026-10-31"
NOTAS = {json.load(open(f))["slug"]: json.load(open(f)) for f in glob.glob("/home/user/mapeamentos/wise-partners-to-be/fontes/notas-dos-livros/*.json")}

def nid(pref):
    return M.proximos_ids(d, pref)[0]

def add(col, pref, **kw):
    obj = {"id": nid(pref), **kw}
    d[col].append(obj)
    return obj["id"]

def ev_raw(tipo, fonte, trecho, local, pessoa=None, data=HOJE):
    return add("evidencias", "EV", tipo=tipo, fonte=fonte, pessoa=pessoa, data=data, trecho=trecho, local=local)

# ---------------------------------------------------------------- fontes
SPEC = {
    "s1": ("Especificação 001: Portal Wise Partners", "/home/user/specs/001-portal-wise-partners/spec.md"),
    "s2": ("Especificação 002: Portal Wise Partners 2.0 (23/10/2026)", "/home/user/specs/002-evolucao-metodo-octo/spec.md"),
}
TXT = {k: re.sub(r"\s+", " ", open(p, encoding="utf-8").read().replace("**", "").replace("*", "")) for k, (_, p) in SPEC.items()}
_cache = {}

def S(doc, trecho, local):
    t = re.sub(r"\s+", " ", trecho)
    assert t in TXT[doc], f"Trecho não encontrado em {doc}: {t[:100]}"
    k = (doc, t)
    if k not in _cache:
        _cache[k] = ev_raw("documento", SPEC[doc][0], trecho, local)
    return _cache[k]

def B(slug, needle):
    """Evidência de livro: acha a recomendação, processo, métrica ou alerta pelo texto e cita o trecho literal."""
    n = NOTAS[slug]
    itens = [(r.get("recomendacao") or r.get("descricao") or r.get("alerta") or r.get("definicao") or r.get("nome", ""), r)
             for col in ("recomendacoes", "processos", "metricas", "alertas") for r in n.get(col, [])]
    achados = [r for txt, r in itens if needle in txt]
    assert achados, f"{slug}: nada com '{needle}'"
    r = achados[0]
    k = (slug, r["citacao"])
    if k not in _cache:
        _cache[k] = ev_raw("documento", f"{n['livro']} ({n['autores']})", r["citacao"], r["pagina"])
    return _cache[k]

def U(asis_ev):
    """Evidência do patrocinador já registrada no mapa as-is (copiada com a origem)."""
    e = next(x for x in ASIS["evidencias"] if x["id"] == asis_ev)
    k = ("asis", asis_ev)
    if k not in _cache:
        _cache[k] = ev_raw(e["tipo"], e["fonte"], e["trecho"], f"{e['local']} (mapa as-is, {asis_ev})", pessoa="PE-01" if e.get("pessoa") else None, data=e["data"])
    return _cache[k]

# ---------------------------------------------------------------- organização
org = d["organizacao"]
org.update({
    "nome": "Programa Wise Partners (to-be)",
    "descricao": "Desenho alvo do programa de parcerias da Wise Makers, operado pelo Portal Wise Partners: parceiros que vendem para a indústria indicam clientes às empresas do grupo e recebem demanda, comunidade e reconhecimento em troca.",
    "setor": "Consultoria de gestão para indústrias (programa de parcerias)",
    "objetivo_do_mapeamento": "Definir a arquitetura de processos to-be que o Portal Wise Partners vai operar, incluindo os funis (kanbans) e as regras de tarefas, e o modelo de negócio do programa.",
    "escopo": {"inclui": ["Gestão do programa", "Captação de parceiros", "Integração (onboarding até a ativação)", "Geração de negócios com o parceiro (indicações, prateleira, comissão)",
                          "Desenvolvimento do parceiro (Base Ativa, ações conjuntas, régua, níveis)", "Retenção e encerramento", "Suporte: prateleira, conteúdos, portal e dados"],
               "exclui": ["Vender e entregar a consultoria ao cliente indicado (processo comercial e de entrega das empresas do grupo)"]},
    "patrocinador": "PE-01",
})

# ---------------------------------------------------------------- pessoas, áreas, papéis, sistemas
e_resp = U("EV-0002")
add("areas", "AR", nome="Parcerias", pai=None, status="declarado", evidencias=[S("s2", "Hoje só o Gerente de Parcerias está no time; a estrutura já serve para quando houver mais pessoas.", "User Story 15")])
add("areas", "AR", nome="Diretoria", pai=None, status="declarado", evidencias=[S("s1", "Igor aprova no portal.", "User Story 4")])
add("areas", "AR", nome="Consultoria e comercial do grupo", pai=None, status="declarado", evidencias=[S("s1", "ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9")])
add("areas", "AR", nome="Financeiro", pai=None, status="declarado", evidencias=[S("s1", "avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6")])
GP = add("papeis", "PA", nome="Gerente de Parcerias", area="AR-01", externo=False, status="declarado", evidencias=[S("s2", "Hoje só o Gerente de Parcerias está no time; a estrutura já serve para quando houver mais pessoas.", "User Story 15")])
DIR = add("papeis", "PA", nome="Diretor", area="AR-02", externo=False, status="declarado", evidencias=[S("s1", "Igor aprova no portal.", "User Story 4"), S("s2", "Aprovação do Diretor no portal.", "Apêndice D")])
CONS = add("papeis", "PA", nome="Consultor ou gerente de conta do grupo", area="AR-03", externo=False, status="declarado", evidencias=[S("s1", "ele fala com o consultor ou o gerente de conta, que registra o pedido", "User Story 9")])
FIN = add("papeis", "PA", nome="Financeiro", area="AR-04", externo=False, status="declarado", evidencias=[S("s1", "avisa o financeiro por e-mail quando há comissão a pagar", "User Story 6")])
RESP = add("papeis", "PA", nome="Responsável nomeado no parceiro", area=None, externo=True, status="declarado", evidencias=[S("s2", "Responsável nomeado com 2 horas ou mais por semana no primeiro mês", "Apêndice A")])
add("pessoas", "PE", nome="Guilherme Faccin", cargo="Consultor Wise Makers e Gerente de Parcerias", papeis=[GP], perfil="lideranca", contato="guilherme@wisemakers.com.br", sabe_sobre=[], indicado_por=None, origem="patrocinador")
add("pessoas", "PE", nome="Igor Makoto", cargo="Diretor", papeis=[DIR], perfil="lideranca", contato="", sabe_sobre=[], indicado_por="PE-01", origem="mapa as-is")
SI_POR = add("sistemas", "SI", nome="Portal Wise Partners", status="declarado", evidencias=[S("s2", "A versão 1 do portal está construída e testada com dados fictícios.", "Contexto")])
SI_AUT = add("sistemas", "SI", nome="Autentique", status="declarado", evidencias=[S("s1", "O contrato é enviado para assinatura no Autentique fora do portal, e o PDF assinado é anexado.", "User Story 4")])
SI_WPP = add("sistemas", "SI", nome="WhatsApp", status="declarado", evidencias=[U("EV-0106")])
SI_HUB = add("sistemas", "SI", nome="Wise Hub", status="declarado", evidencias=[S("s2", "As trilhas ficam só no portal, nunca no Wise Hub, porque o Hub é aberto à carteira do parceiro.", "User Story 10")])

# ---------------------------------------------------------------- decisões herdadas do as-is
add("decisoes", "DE", data=HOJE, texto="A especificação 002 e o web app prevalecem sobre o Playbook v3.1, que está desatualizado.", por="PE-01", provisoria=False, evidencias=[U("EV-0109"), U("EV-0110")])
add("decisoes", "DE", data=HOJE, texto="Este mapa é o to-be: o desenho que o Portal vai operar. O que vem das especificações é desenho aprovado; o que vem dos livros é proposta até o patrocinador decidir.", por="PE-01", provisoria=False, evidencias=[U("EV-0111")])
add("decisoes", "DE", data=HOJE, texto="Cada processo repetitivo vira um funil (kanban) próprio, com as etapas do processo; as tarefas pertencem ao funil de onde nascem.", por="PE-01", provisoria=False, evidencias=[U("EV-0009")])
add("decisoes", "DE", data=HOJE, texto="Passo a passo detalhado só para os processos que viram funil; os demais ficam no nível de dono, gatilho e entregas.", por="PE-01", provisoria=False, evidencias=[U("EV-0004")])

exec(open("/home/user/mapeamentos/wise-partners-to-be/ferramentas/tobe_proc.py").read())
M.salvar(PASTA, d)
print(len(d["evidencias"]), "evidências;", len(d["processos"]), "processos;", len(d["perguntas"]), "perguntas")
