#!/usr/bin/env python3
"""
mapa.py: ferramenta de apoio da skill mapear-processos.

Guarda o mapeamento de processos de uma organização em um único arquivo
(mapa.json), confere a consistência lógica, mede a cobertura, aponta as
lacunas, gera formulários e desenha as visualizações (mapa interativo,
BPMN 2.0, draw.io, Mermaid e quadro do Miro).

Só usa a biblioteca padrão do Python 3.8+.

Uso rápido:
    python3 mapa.py iniciar  PASTA --empresa "Nome da empresa"
    python3 mapa.py status   PASTA
    python3 mapa.py validar  PASTA
    python3 mapa.py lacunas  PASTA [--json]
    python3 mapa.py id       PASTA PREFIXO [--n 3]
    python3 mapa.py evidencia PASTA --tipo documento --fonte "Playbook" --trecho "..."
    python3 mapa.py formulario PASTA FO-01
    python3 mapa.py ingerir  PASTA FO-01 respostas.csv
    python3 mapa.py responder PASTA Q-0012 --pessoa PE-02 --texto "..."
    python3 mapa.py validacao PASTA P-05 --para PE-02 --formulario FO-07 [--so-fluxo | --sem-fluxo]
    python3 mapa.py frases   PASTA P-05
    python3 mapa.py renderizar PASTA [--formatos html,bpmn,drawio,mermaid,miro,relatorio]
    python3 mapa.py exemplo  PASTA
"""

import argparse
import csv
import datetime as dt
import io
import json
import math
import os
import re
import shutil
import sys
import unicodedata
from collections import defaultdict, OrderedDict
from pathlib import Path
from xml.sax.saxutils import escape as _xesc

VERSAO = "1.0"
SCHEMA_ID = "mapa-processos/1.0"
SKILL_DIR = Path(__file__).resolve().parent.parent
ASSETS = SKILL_DIR / "assets"

# --------------------------------------------------------------------------
# Vocabulário
# --------------------------------------------------------------------------

STATUS = ("hipotese", "declarado", "confirmado", "contestado")
STATUS_ROTULO = {
    "hipotese": "Hipótese",
    "declarado": "Declarado",
    "confirmado": "Confirmado",
    "contestado": "Contestado",
}
TIPOS_PROCESSO = ("gestao", "finalistico", "suporte")
TIPO_ROTULO = {"gestao": "Gestão", "finalistico": "Finalísticos", "suporte": "Suporte", None: "Sem classificação"}
TIPO_ORDEM = {"gestao": 0, "finalistico": 1, "suporte": 2, None: 3}
TIPOS_EVIDENCIA = ("documento", "formulario", "entrevista", "workshop", "observacao", "sistema", "site", "validacao")
TIPOS_NO = ("inicio", "fim", "tarefa", "subprocesso", "decisao", "paralelo", "inclusivo", "espera")
GATEWAYS = ("decisao", "paralelo", "inclusivo")
TEMAS_OBRIGATORIOS = ("oferta", "cliente", "proposta_de_valor", "canal", "receita", "estrutura")
TEMAS = TEMAS_OBRIGATORIOS + ("parceiro", "recurso", "custo", "regulacao", "estrategia", "modelo_operacional", "outro")
TEMA_ROTULO = {
    "oferta": "o que a empresa vende (produtos e serviços)",
    "cliente": "quem são os clientes (segmentos)",
    "proposta_de_valor": "por que o cliente compra (proposta de valor)",
    "canal": "como o cliente chega e é atendido (canais)",
    "receita": "como a empresa ganha dinheiro (receitas)",
    "estrutura": "como a empresa está organizada (áreas e papéis)",
    "parceiro": "parceiros-chave",
    "recurso": "recursos-chave",
    "custo": "estrutura de custos",
    "regulacao": "regras, leis e certificações",
    "estrategia": "estratégia e metas",
    "modelo_operacional": "modelo operacional",
    "outro": "outros",
}

COLECOES = (
    "fatos", "ofertas", "cadeias_de_valor", "areas", "papeis", "pessoas", "sistemas", "objetos",
    "processos", "evidencias", "perguntas", "formularios", "contradicoes", "decisoes", "glossario", "ideias",
)
PREFIXO = {
    "fatos": "F", "ofertas": "OF", "cadeias_de_valor": "CV", "areas": "AR", "papeis": "PA", "pessoas": "PE",
    "sistemas": "SI", "objetos": "OB", "processos": "P", "evidencias": "EV", "perguntas": "Q",
    "formularios": "FO", "contradicoes": "CT", "decisoes": "DE", "glossario": "GL", "ideias": "ID",
}
PREFIXO_COLECAO = {v: k for k, v in PREFIXO.items()}
LARGURA_ID = {"EV": 4, "Q": 4, "F": 3}
COM_STATUS = ("fatos", "ofertas", "cadeias_de_valor", "areas", "papeis", "sistemas", "objetos", "processos")

CAMPOS_OBRIGATORIOS_PADRAO = {
    1: ["tipo", "descricao", "dono"],
    2: ["descricao", "dono", "gatilho", "saidas", "cliente"],
    3: ["descricao", "dono", "gatilho", "entradas", "saidas", "cliente", "participantes"],
}
CAMPO_ROTULO = {
    "tipo": "tipo (gestão, finalístico ou suporte)",
    "descricao": "propósito do processo",
    "dono": "dono do processo",
    "gatilho": "o que dispara o processo",
    "entradas": "o que o processo recebe e de quem",
    "saidas": "o que o processo entrega e para quem",
    "cliente": "quem recebe o resultado (cliente do processo)",
    "participantes": "papéis que participam",
    "fluxo": "passo a passo (fluxo)",
    "frequencia": "frequência ou volume",
    "sistemas": "sistemas usados",
    "indicadores": "indicadores",
}
NIVEIS_PADRAO = ["Organização", "Macroprocesso", "Processo", "Subprocesso", "Atividade", "Tarefa"]

# Paleta de status, comum a todas as saídas (BPMN, draw.io, Mermaid, HTML).
COR_STATUS = {
    "confirmado": {"fill": "#D9F2E1", "stroke": "#2F8F4E", "text": "#14532D"},
    "declarado": {"fill": "#FFF3C4", "stroke": "#B8860B", "text": "#5C4300"},
    "hipotese": {"fill": "#FFFFFF", "stroke": "#8A9099", "text": "#3F4650"},
    "contestado": {"fill": "#FDE2E1", "stroke": "#C53030", "text": "#7F1D1D"},
}
# Equivalentes da paleta "Bright Paper" do Miro.
MIRO_STATUS = {
    "confirmado": {"fill": "#adf0c7", "stroke": "#067429", "text": "#1a1a1a"},
    "declarado": {"fill": "#fff6b6", "stroke": "#af7e04", "text": "#1a1a1a"},
    "hipotese": {"fill": "#ffffff", "stroke": "#b0b0b0", "text": "#595959"},
    "contestado": {"fill": "#ffc6c6", "stroke": "#bd0a0a", "text": "#1a1a1a"},
}

# Perguntas fixas de todo formulário (identificação e bola de neve).
IDENT = OrderedDict([
    ("nome", "Seu nome"),
    ("funcao", "Sua função ou cargo"),
    ("area", "Área ou equipe em que você trabalha"),
    ("email", "Seu e-mail (opcional, só para tirarmos dúvidas)"),
])
FECHO = OrderedDict([
    ("indicacoes", "Quem mais deveríamos ouvir sobre estes assuntos? Diga nome, função e, se puder, contato."),
    ("documentos", "Existe algum documento, planilha, sistema ou link que mostre como isso funciona? Cole aqui ou descreva onde está."),
    ("comentarios", "Algo importante que não perguntamos?"),
])
NAO_SEI = "Não sei / não é comigo"
ALVOS_CONTEXTO = ("NEGOCIO", "ESTRUTURA", "ESCOPO", "NOVO")
SITUACOES = ("em_operacao", "em_implantacao", "no_papel")
VERBOS_GENERICOS = {"fazer", "realizar", "executar", "efetuar", "tratar", "cuidar"}
VERBOS_CONTINUOS = {"gerenciar", "gerir", "monitorar", "acompanhar", "controlar", "administrar"}

# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------


def hoje():
    return dt.date.today().isoformat()


def vazio(v):
    return v is None or (isinstance(v, (str, list, dict, tuple)) and len(v) == 0) or (isinstance(v, str) and not v.strip())


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or ""))
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return s.strip()


def slug(s, maxlen=48):
    s = norm(s).replace(" ", "-")
    return (s[:maxlen].rstrip("-")) or "item"


def xesc(s):
    return _xesc(str(s if s is not None else ""), {'"': "&quot;"})


def ncname(s):
    s = re.sub(r"[^A-Za-z0-9_.-]", "_", str(s))
    if not re.match(r"[A-Za-z_]", s):
        s = "_" + s
    return s


def quebra(texto, largura=22):
    """Quebra texto em linhas para rótulos de diagramas."""
    palavras = str(texto or "").split()
    linhas, atual = [], ""
    for p in palavras:
        if len(atual) + len(p) + 1 > largura and atual:
            linhas.append(atual)
            atual = p
        else:
            atual = (atual + " " + p).strip()
    if atual:
        linhas.append(atual)
    return linhas or [""]


def eh_verbo_infinitivo(nome):
    primeira = norm(nome).split(" ")[0] if norm(nome) else ""
    return bool(re.match(r".+(ar|er|ir|or)$", primeira)) or primeira in ("por", "repor", "compor", "dispor", "propor")


def ler_json(caminho):
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def gravar_json(caminho, dados):
    caminho = Path(caminho)
    tmp = caminho.with_suffix(caminho.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, caminho)


def arq_mapa(pasta):
    return Path(pasta) / "mapa.json"


def carregar(pasta):
    caminho = arq_mapa(pasta)
    if not caminho.exists():
        sys.exit(f"Não encontrei {caminho}. Rode primeiro: mapa.py iniciar {pasta} --empresa \"Nome\"")
    mapa = ler_json(caminho)
    for c in COLECOES:
        mapa.setdefault(c, [])
    mapa.setdefault("organizacao", {})
    mapa.setdefault("configuracao", {})
    mapa.setdefault("modelo_operacional", {})
    mapa.setdefault("historico", [])
    return mapa


def salvar(pasta, mapa):
    mapa.setdefault("organizacao", {})["atualizado_em"] = hoje()
    gravar_json(arq_mapa(pasta), mapa)


def indice(mapa):
    """id -> (coleção, objeto)"""
    idx = {}
    for c in COLECOES:
        for obj in mapa.get(c, []):
            if isinstance(obj, dict) and obj.get("id"):
                idx[obj["id"]] = (c, obj)
    return idx


def proximos_ids(mapa, prefixo, n=1):
    prefixo = prefixo.upper().rstrip("-")
    maior = 0
    pad = LARGURA_ID.get(prefixo, 2)
    padrao = re.compile(r"^" + re.escape(prefixo) + r"-(\d+)$")
    for c in COLECOES:
        for obj in mapa.get(c, []):
            m = padrao.match(str(obj.get("id", "")))
            if m:
                maior = max(maior, int(m.group(1)))
    return [f"{prefixo}-{str(maior + i + 1).zfill(pad)}" for i in range(n)]


# --------------------------------------------------------------------------
# Estrutura dos processos
# --------------------------------------------------------------------------


def campos_obrigatorios(mapa, nivel):
    conf = mapa.get("configuracao", {}).get("campos_obrigatorios")
    if conf:
        chave = str(min(nivel, max(int(k) for k in conf)))
        return conf.get(chave, [])
    return CAMPOS_OBRIGATORIOS_PADRAO[min(nivel, 3)]


def arvore(mapa):
    procs = {p["id"]: p for p in mapa.get("processos", [])}
    filhos = defaultdict(list)
    for p in procs.values():
        filhos[p.get("pai")].append(p)

    def chave(p):
        return (TIPO_ORDEM.get(tipo_de(procs, p), 3), p.get("ordem", 999), norm(p.get("nome", "")))

    for k in filhos:
        filhos[k].sort(key=chave)
    return procs, filhos


def tipo_de(procs, p, guarda=0):
    if p.get("tipo"):
        return p["tipo"]
    pai = procs.get(p.get("pai"))
    if pai and guarda < 20:
        return tipo_de(procs, pai, guarda + 1)
    return None


def calcular_codigos(mapa):
    procs, filhos = arvore(mapa)
    codigos = {}

    def visitar(pai_id, prefixo):
        for i, p in enumerate(filhos.get(pai_id, []), start=1):
            cod = p.get("codigo") or (f"{prefixo}.{i}" if prefixo else str(i))
            codigos[p["id"]] = cod
            visitar(p["id"], cod)

    visitar(None, "")
    for pid in procs:
        codigos.setdefault(pid, procs[pid].get("codigo") or "?")
    return codigos


def nivel_real(procs, p, guarda=0):
    pai = procs.get(p.get("pai"))
    if not pai or guarda > 20:
        return 1
    return 1 + nivel_real(procs, pai, guarda + 1)


def ancestrais(procs, p):
    out, atual, guarda = [], procs.get(p.get("pai")), 0
    while atual and guarda < 20:
        out.append(atual)
        atual = procs.get(atual.get("pai"))
        guarda += 1
    return out


def descendentes(filhos, pid):
    out = []
    for f in filhos.get(pid, []):
        out.append(f)
        out.extend(descendentes(filhos, f["id"]))
    return out


# --------------------------------------------------------------------------
# Evidência e status
# --------------------------------------------------------------------------


def evidencias_de(mapa, obj, idx=None):
    idx = idx or indice(mapa)
    out = []
    for eid in obj.get("evidencias", []) or []:
        item = idx.get(eid)
        if item and item[0] == "evidencias":
            out.append(item[1])
    return out


def fonte_independente(ev):
    return ev.get("pessoa") or norm(ev.get("fonte", "")) or ev.get("id")


def status_sustentado(mapa, obj, idx, exige_validacao=False):
    """Devolve (ok, motivo) conferindo se o status tem a evidência que exige.
    exige_validacao=True (fluxos): confirmado só com evidência de validação do dono."""
    st = obj.get("status", "hipotese")
    evs = evidencias_de(mapa, obj, idx)
    if st == "declarado" and not evs:
        return False, "está como declarado mas não tem evidência ligada"
    if st == "confirmado":
        if any(e.get("tipo") == "validacao" for e in evs):
            return True, ""
        if exige_validacao:
            return False, "passo a passo só fica confirmado com validação do dono (evidência do tipo validacao)"
        if len({fonte_independente(e) for e in evs}) >= 2:
            return True, ""
        return False, "está como confirmado sem validação do responsável nem duas fontes independentes"
    return True, ""


def pergunta_que_cobre(mapa, elemento, campo=None, pendentes=None):
    """Regra única de cobertura: 'ID' cobre só a existência; 'ID.campo' cobre o campo.
    Decisões e contradições também ficam cobertas pela pergunta ligada a elas (campo 'pergunta')."""
    pendentes = pendentes if pendentes is not None else alvos_com_pergunta(mapa)
    alvo = f"{elemento}.{campo}" if campo else elemento
    if alvo in pendentes:
        return pendentes[alvo]
    if not campo:
        for c in ("decisoes", "contradicoes"):
            for o in mapa.get(c, []):
                if o.get("id") == elemento and o.get("pergunta"):
                    q = next((q for q in mapa.get("perguntas", []) if q["id"] == o["pergunta"]), None)
                    if q and q.get("status") in ("aberta", "em_formulario"):
                        return q["id"]
    return None


def lacunas_aceitas(mapa):
    """Alvos de lacunas que o patrocinador aceitou deixar em aberto (decisoes[].aceita_lacunas)."""
    out = set()
    for d in mapa.get("decisoes", []):
        if not d.get("provisoria"):
            out.update(d.get("aceita_lacunas") or [])
    return out


def alvos_com_pergunta(mapa):
    """Conjunto de alvos ('P-01', 'P-01.dono', 'NEGOCIO.receita') cobertos por pergunta pendente."""
    out = {}
    for q in mapa.get("perguntas", []):
        if q.get("status") in ("aberta", "em_formulario"):
            for a in q.get("alvo", []) or []:
                out.setdefault(a, q["id"])
    return out


# --------------------------------------------------------------------------
# Validação
# --------------------------------------------------------------------------


def validar(mapa):
    probs = []

    def erro(cod, el, msg):
        probs.append({"nivel": "erro", "codigo": cod, "elemento": el, "mensagem": msg})

    def alerta(cod, el, msg):
        probs.append({"nivel": "alerta", "codigo": cod, "elemento": el, "mensagem": msg})

    idx = {}
    for c in COLECOES:
        for obj in mapa.get(c, []):
            if not isinstance(obj, dict) or not obj.get("id"):
                erro("E01", c, f"item sem id na coleção {c}")
                continue
            if obj["id"] in idx:
                erro("E01", obj["id"], f"id repetido (aparece em {idx[obj['id']][0]} e {c})")
            idx[obj["id"]] = (c, obj)

    def existe(ref, colecao=None):
        if ref is None:
            return True
        item = idx.get(ref)
        return bool(item) and (colecao is None or item[0] == colecao)

    perguntas_alvo = alvos_com_pergunta(mapa)
    aceitas = lacunas_aceitas(mapa)

    for c in COM_STATUS:
        for obj in mapa.get(c, []):
            st = obj.get("status", "hipotese")
            if st not in STATUS:
                erro("E03", obj.get("id"), f"status inválido: {st}")
                continue
            for eid in obj.get("evidencias", []) or []:
                if not existe(eid, "evidencias"):
                    erro("E02", obj["id"], f"evidência {eid} não existe")
            ok, motivo = status_sustentado(mapa, obj, idx)
            if not ok:
                erro("E04", obj["id"], f"{obj.get('nome') or obj.get('texto', '')[:40]}: {motivo}")
            if st == "hipotese" and obj["id"] not in aceitas:
                if not pergunta_que_cobre(mapa, obj["id"], None, perguntas_alvo):
                    resp = [q["id"] for q in mapa.get("perguntas", []) if q.get("status") == "respondida" and obj["id"] in (q.get("alvo") or [])]
                    dica = (f" A pergunta {', '.join(resp)} já foi respondida: atualize o status com base na resposta, ou crie uma pergunta nova."
                            if resp else " Crie uma pergunta com esse alvo, ou retire a hipótese.")
                    erro("E10", obj["id"], f"hipótese sem pergunta pendente com alvo '{obj['id']}': {obj.get('nome') or obj.get('texto', '')[:60]}.{dica}")
            if st == "contestado":
                abertas = [ct for ct in mapa.get("contradicoes", []) if ct.get("status", "aberta") == "aberta" and ct.get("elemento") == obj["id"]]
                if not abertas:
                    erro("E09", obj["id"], "está como contestado sem contradição aberta registrada")
            for campo in obj.get("hipoteses", []) or []:
                if f"{obj['id']}.{campo}" not in aceitas and not pergunta_que_cobre(mapa, obj["id"], campo, perguntas_alvo):
                    erro("E10", obj["id"], f"o campo '{campo}' é hipótese e não tem pergunta pendente com alvo '{obj['id']}.{campo}'")

    mo = mapa.get("modelo_operacional") or {}
    if mo.get("status") in ("declarado", "confirmado"):
        ok, motivo = status_sustentado(mapa, mo, idx)
        if not ok:
            erro("E04", "modelo_operacional", motivo)
    for eid in mo.get("evidencias", []) or []:
        if not existe(eid, "evidencias"):
            erro("E02", "modelo_operacional", f"evidência {eid} não existe")

    procs = {p["id"]: p for p in mapa.get("processos", [])}
    for p in procs.values():
        pid = p["id"]
        if p.get("pai") and p["pai"] not in procs:
            erro("E02", pid, f"pai {p['pai']} não existe")
        visto, atual, guarda = {pid}, procs.get(p.get("pai")), 0
        while atual and guarda < 50:
            if atual["id"] in visto:
                erro("E08", pid, "ciclo na hierarquia de processos")
                break
            visto.add(atual["id"])
            atual = procs.get(atual.get("pai"))
            guarda += 1
        nv = nivel_real(procs, p)
        if p.get("situacao") and p["situacao"] not in SITUACOES:
            erro("E03", pid, f"situacao inválida: {p['situacao']} (use {', '.join(SITUACOES)})")
        if p.get("nivel") and p["nivel"] != nv:
            erro("E06", pid, f"nível informado {p['nivel']} difere do nível pela hierarquia ({nv})")
        if nv == 1 and p.get("tipo") and p["tipo"] not in TIPOS_PROCESSO:
            erro("E03", pid, f"tipo inválido: {p['tipo']}")
        for ref in [p.get("dono")] + list(p.get("participantes", []) or []):
            if ref and not existe(ref, "papeis"):
                erro("E02", pid, f"papel {ref} não existe")
        for ref in p.get("sistemas", []) or []:
            if not existe(ref, "sistemas"):
                erro("E02", pid, f"sistema {ref} não existe")
        for ref in p.get("objetos", []) or []:
            if not existe(ref, "objetos"):
                erro("E02", pid, f"objeto {ref} não existe")
        if p.get("nome") and not eh_verbo_infinitivo(p["nome"]) and nv >= 2:
            alerta("A01", pid, f"nome '{p['nome']}' não começa com verbo no infinitivo (ex.: 'Emitir nota fiscal')")
        fil = [q for q in procs.values() if q.get("pai") == pid]
        if not fil and nv >= 2 and p.get("nome") and norm(p["nome"]).split(" ")[0] in VERBOS_CONTINUOS:
            alerta("A16", pid, f"'{p['nome']}' é um processo sem subdivisão com nome de função contínua; diga qual é o caso tratado, o que dispara e quando termina")
        if len(fil) == 1:
            alerta("A10", pid, "tem um único subprocesso; ou falta mapear os outros, ou a divisão não é necessária")
        if len(fil) > 10:
            alerta("A10", pid, f"tem {len(fil)} subprocessos; acima de 10 costuma indicar que falta um nível intermediário")
        if p.get("fluxo"):
            probs.extend(validar_fluxo(mapa, p, procs, idx))
        # Fechamento de entradas e saídas entre processos
        for s in p.get("saidas", []) or []:
            if isinstance(s, dict) and s.get("para") in procs:
                dest = procs[s["para"]]
                tem = any(isinstance(e, dict) and e.get("de") == pid for e in dest.get("entradas", []) or [])
                if not tem:
                    alerta("A04", pid, f"entrega '{s.get('nome', '')}' para {dest.get('nome')}, mas esse processo não registra a entrada; confirmar com os dois lados")
        for e in p.get("entradas", []) or []:
            if isinstance(e, dict) and e.get("de") in procs:
                orig = procs[e["de"]]
                tem = any(isinstance(s, dict) and s.get("para") == pid for s in orig.get("saidas", []) or [])
                if not tem:
                    alerta("A04", pid, f"recebe '{e.get('nome', '')}' de {orig.get('nome')}, mas esse processo não registra a saída; confirmar com os dois lados")

    for pa in mapa.get("papeis", []):
        if pa.get("area") and not existe(pa["area"], "areas"):
            erro("E02", pa["id"], f"área {pa['area']} não existe")
        usado = any(pa["id"] == p.get("dono") or pa["id"] in (p.get("participantes") or []) or
                    any(n.get("raia") == pa["id"] for n in (p.get("fluxo") or {}).get("nos", []))
                    for p in procs.values())
        if not usado and procs:
            alerta("A05", pa["id"], f"papel '{pa.get('nome')}' não aparece em nenhum processo")
    for ar in mapa.get("areas", []):
        papeis_area = [pa["id"] for pa in mapa.get("papeis", []) if pa.get("area") == ar["id"]]
        usado = any(p.get("dono") in papeis_area or set(p.get("participantes") or []) & set(papeis_area) for p in procs.values())
        if not usado and procs:
            alerta("A05", ar["id"], f"área '{ar.get('nome')}' não está ligada a nenhum processo (todo processo deve ter área e toda área, processo)")
    for pe in mapa.get("pessoas", []):
        for ref in pe.get("papeis", []) or []:
            if not existe(ref, "papeis"):
                erro("E02", pe["id"], f"papel {ref} não existe")
    for ev in mapa.get("evidencias", []):
        if ev.get("tipo") not in TIPOS_EVIDENCIA:
            erro("E03", ev["id"], f"tipo de evidência inválido: {ev.get('tipo')}")
        if ev.get("pessoa") and not existe(ev["pessoa"], "pessoas"):
            erro("E02", ev["id"], f"pessoa {ev['pessoa']} não existe")
        if vazio(ev.get("trecho")) and vazio(ev.get("local")):
            alerta("A11", ev["id"], "evidência sem trecho nem local; guarde a citação literal para rastrear de onde veio")
    for q in mapa.get("perguntas", []):
        for a in q.get("alvo", []) or []:
            base = a.split(".")[0]
            if base not in idx and base not in ALVOS_CONTEXTO:
                erro("E02", q["id"], f"alvo {a} não existe")
        if vazio(q.get("alvo")):
            alerta("A12", q["id"], "pergunta sem alvo; toda pergunta deve fechar uma lacuna ou testar uma hipótese")
    for fo in mapa.get("formularios", []):
        for qid in fo.get("perguntas", []) or []:
            if not existe(qid, "perguntas"):
                erro("E02", fo["id"], f"pergunta {qid} não existe")
    for de in mapa.get("decisoes", []):
        if de.get("provisoria") and not de.get("pergunta"):
            alerta("A19", de["id"], f"decisão provisória sem pergunta que a confirme: {de.get('texto', '')}")
    for ct in mapa.get("contradicoes", []):
        if ct.get("status", "aberta") == "aberta":
            alerta("A08", ct.get("elemento") or ct["id"], f"contradição aberta: {ct.get('descricao', '')}")
    for cv in mapa.get("cadeias_de_valor", []):
        for et in cv.get("etapas", []) or []:
            for ref in et.get("processos", []) or []:
                if ref not in procs:
                    erro("E02", cv["id"], f"processo {ref} da etapa '{et.get('nome')}' não existe")
    for ob in mapa.get("objetos", []):
        ciclo = ob.get("ciclo") or {}
        if ob.get("status") != "hipotese":
            if vazio(ciclo.get("cria")):
                alerta("A13", ob["id"], f"objeto '{ob.get('nome')}': não se sabe em que processo ele nasce")
            if vazio(ciclo.get("encerra")):
                alerta("A13", ob["id"], f"objeto '{ob.get('nome')}': não se sabe em que processo ele é encerrado ou arquivado")
    return probs


def validar_fluxo(mapa, p, procs, idx):
    probs = []
    fl = p["fluxo"]
    pid = p["id"]

    def erro(cod, msg):
        probs.append({"nivel": "erro", "codigo": cod, "elemento": pid, "mensagem": f"fluxo de '{p.get('nome')}': {msg}"})

    def alerta(cod, msg):
        probs.append({"nivel": "alerta", "codigo": cod, "elemento": pid, "mensagem": f"fluxo de '{p.get('nome')}': {msg}"})

    nos = {n["id"]: n for n in fl.get("nos", [])}
    if len(nos) != len(fl.get("nos", [])):
        erro("E07", "há nós com id repetido")
    st = fl.get("status", "hipotese")
    if st == "hipotese" and f"{pid}.fluxo" not in lacunas_aceitas(mapa):
        if not pergunta_que_cobre(mapa, pid, "fluxo"):
            erro("E10", f"o passo a passo é hipótese e não tem pergunta pendente com alvo '{pid}.fluxo'; se a pergunta já foi respondida, atualize o fluxo com a resposta")
    if st not in STATUS:
        erro("E03", f"status inválido: {st}")
    elif st != "hipotese":
        ok, motivo = status_sustentado(mapa, fl, idx, exige_validacao=True)
        if not ok:
            erro("E04", motivo)
    for n in nos.values():
        if n.get("tipo") not in TIPOS_NO:
            erro("E07", f"nó {n['id']} com tipo inválido: {n.get('tipo')}")
        if n.get("tipo") == "subprocesso" and n.get("processo") and n["processo"] not in procs:
            erro("E02", f"o subprocesso {n['id']} aponta para {n['processo']}, que não existe")
        if n.get("tipo") in ("tarefa", "subprocesso") and n.get("nome") and not eh_verbo_infinitivo(n["nome"]):
            alerta("A01", f"atividade '{n['nome']}' não começa com verbo no infinitivo")
        if n.get("tipo") in ("tarefa", "subprocesso", "decisao") and vazio(n.get("raia")):
            alerta("A14", f"'{n.get('nome', n['id'])}' sem papel responsável (raia)")
    saidas, entradas = defaultdict(list), defaultdict(list)
    for lg in fl.get("ligacoes", []):
        if lg.get("de") not in nos or lg.get("para") not in nos:
            erro("E07", f"ligação {lg.get('de')} -> {lg.get('para')} aponta para nó inexistente")
            continue
        saidas[lg["de"]].append(lg)
        entradas[lg["para"]].append(lg)
    inicios = [n for n in nos.values() if n.get("tipo") == "inicio"]
    fins = [n for n in nos.values() if n.get("tipo") == "fim"]
    if not inicios:
        erro("E07", "não tem evento de início (o que dispara o processo)")
    if not fins:
        erro("E07", "não tem evento de fim (como o processo termina)")
    for n in inicios:
        if entradas[n["id"]]:
            erro("E07", f"o início '{n.get('nome', n['id'])}' recebe setas; início não pode ter entrada")
    for n in fins:
        if saidas[n["id"]]:
            erro("E07", f"o fim '{n.get('nome', n['id'])}' tem setas saindo; fim não pode ter saída")
        if vazio(n.get("nome")):
            alerta("A15", "evento de fim sem nome; nomeie o resultado (ex.: 'Pedido entregue', 'Proposta recusada')")
    for n in nos.values():
        t = n.get("tipo")
        if t in ("tarefa", "subprocesso", "espera"):
            if not entradas[n["id"]]:
                erro("E07", f"'{n.get('nome', n['id'])}' não tem entrada")
            if not saidas[n["id"]]:
                erro("E07", f"'{n.get('nome', n['id'])}' não tem saída")
        if t in GATEWAYS:
            if len(saidas[n["id"]]) >= 2 and t in ("decisao", "inclusivo"):
                sem = [lg for lg in saidas[n["id"]] if vazio(lg.get("rotulo"))]
                if sem:
                    erro("E07", f"a decisão '{n.get('nome', n['id'])}' tem caminhos sem rótulo; cada saída precisa dizer a condição")
            if len(saidas[n["id"]]) < 2 and len(entradas[n["id"]]) < 2:
                alerta("A06", f"o desvio '{n.get('nome', n['id'])}' tem só uma entrada e uma saída")
    # Alcance: todo nó num caminho do início ao fim
    alc = set()
    pilha = [n["id"] for n in inicios]
    while pilha:
        a = pilha.pop()
        if a in alc:
            continue
        alc.add(a)
        pilha.extend(lg["para"] for lg in saidas[a])
    volta = set()
    pilha = [n["id"] for n in fins]
    while pilha:
        a = pilha.pop()
        if a in volta:
            continue
        volta.add(a)
        pilha.extend(lg["de"] for lg in entradas[a])
    for n in nos.values():
        if inicios and n["id"] not in alc:
            erro("E07", f"'{n.get('nome', n['id'])}' não é alcançável a partir do início")
        if fins and n["id"] not in volta:
            erro("E07", f"de '{n.get('nome', n['id'])}' não há caminho até um fim")
    for m in fl.get("mensagens", []) or []:
        ext = {x["id"] for x in fl.get("externos", []) or []}
        if m.get("de") not in nos and m.get("de") not in ext:
            erro("E07", f"mensagem com origem inexistente: {m.get('de')}")
        if m.get("para") not in nos and m.get("para") not in ext:
            erro("E07", f"mensagem com destino inexistente: {m.get('para')}")
    nomes_fim = [norm(n.get("nome")) for n in fins if n.get("nome")]
    if len(nomes_fim) != len(set(nomes_fim)):
        alerta("A17", "há eventos de fim com o mesmo nome; cada fim deve nomear um resultado diferente (junte os caminhos no mesmo fim)")
    nomes_at = [norm(n.get("nome")) for n in nos.values() if n.get("tipo") in ("tarefa", "subprocesso") and n.get("nome")]
    if len(nomes_at) != len(set(nomes_at)):
        alerta("A17", "há atividades com o mesmo nome; se são a mesma coisa, use um único passo ou um subprocesso reutilizado")
    ext_ids = {x["id"] for x in fl.get("externos", []) or []}
    for n in nos.values():
        if n.get("tipo") in ("inicio", "espera") and (n.get("gatilho") == "mensagem" or n.get("evento") == "mensagem"):
            if not any(m.get("para") == n["id"] and m.get("de") in ext_ids for m in fl.get("mensagens", []) or []):
                alerta("A18", f"'{n.get('nome', n['id'])}' espera uma mensagem, mas nenhuma mensagem de fora chega nele (indique quem envia)")
        if n.get("tipo") in ("tarefa", "subprocesso") and n.get("nome"):
            v = norm(n["nome"]).split(" ")[0]
            if v in VERBOS_GENERICOS:
                alerta("A16", f"'{n['nome']}' usa verbo genérico; diga a ação concreta (ex.: 'Emitir nota' em vez de 'Fazer nota')")
            if v in VERBOS_CONTINUOS:
                alerta("A16", f"'{n['nome']}' descreve uma função contínua; um passo precisa ter começo e fim claros")
        if n.get("tipo") == "paralelo" and any(lg.get("rotulo") for lg in saidas[n["id"]]):
            alerta("A06", f"caminhos que saem de um paralelo não levam rótulo (todos acontecem)")
    if len(nos) > 30:
        alerta("A07", f"tem {len(nos)} elementos; acima de 30 o diagrama fica difícil de ler; transforme trechos em subprocessos")
    return probs


# --------------------------------------------------------------------------
# Cobertura e lacunas
# --------------------------------------------------------------------------


def sugerir_respondentes(mapa, proc=None, procs=None):
    pessoas = mapa.get("pessoas", [])
    if proc is not None:
        procs = procs or {p["id"]: p for p in mapa.get("processos", [])}
        cadeia = [proc] + ancestrais(procs, proc)
        for alvo in cadeia:
            papeis = {alvo.get("dono")} | set(alvo.get("participantes") or [])
            papeis.discard(None)
            achou = [pe["id"] for pe in pessoas if set(pe.get("papeis") or []) & papeis]
            if achou:
                return achou
            achou = [pe["id"] for pe in pessoas if alvo["id"] in (pe.get("sabe_sobre") or [])]
            if achou:
                return achou
    lid = [pe["id"] for pe in pessoas if pe.get("perfil") == "lideranca"]
    pat = mapa.get("organizacao", {}).get("patrocinador")
    out = ([pat] if pat else []) + [x for x in lid if x != pat]
    return out


def calcular_lacunas(mapa):
    procs, filhos = arvore(mapa)
    codigos = calcular_codigos(mapa)
    cobertas = alvos_com_pergunta(mapa)
    lac = []

    perguntas_idx = {q["id"]: q for q in mapa.get("perguntas", [])}
    decisoes_idx = {d["id"]: d for d in mapa.get("decisoes", [])}

    aceitas = lacunas_aceitas(mapa)

    def add(elemento, campo, tipo, msg, para, peso, codigo="", nome=""):
        # Uma pergunta cobre a lacuna só se o alvo for o mesmo campo (ou o elemento inteiro, quando a lacuna é a existência dele)
        alvo = f"{elemento}.{campo}" if campo else elemento
        if alvo in aceitas:
            return
        qid = pergunta_que_cobre(mapa, elemento, campo or None, cobertas)
        if qid and perguntas_idx.get(qid, {}).get("para"):
            para = list(perguntas_idx[qid]["para"])
        lac.append({
            "elemento": elemento, "campo": campo, "tipo": tipo, "mensagem": msg,
            "codigo": codigo, "nome": nome, "sugerido_para": para, "peso": peso,
            "pergunta": qid,
        })

    # Escopo do mapeamento (Fase 0)
    org = mapa.get("organizacao", {})
    lider = sugerir_respondentes(mapa)
    if vazio(org.get("objetivo_do_mapeamento")):
        add("ESCOPO", "objetivo", "escopo", "Escopo: falta saber para que o mapa vai servir (define a profundidade)", lider, 10)
    if vazio((org.get("escopo") or {}).get("inclui")):
        add("ESCOPO", "escopo", "escopo", "Escopo: falta combinar o que entra e o que fica de fora do mapeamento", lider, 9)
    if vazio(org.get("patrocinador")):
        add("ESCOPO", "patrocinador", "escopo", "Escopo: falta saber quem aprova o mapa e decide divergências", lider, 9)
    for de in mapa.get("decisoes", []):
        if de.get("provisoria"):
            add(de["id"], "", "escopo", f"Decisão provisória a confirmar: {de.get('texto', '')}", lider, 8)

    # Contexto do negócio
    fatos = mapa.get("fatos", [])
    for tema in TEMAS_OBRIGATORIOS:
        if tema == "estrutura":
            continue
        tem = [f for f in fatos if f.get("tema") == tema and f.get("status") in ("declarado", "confirmado")]
        if not tem:
            add("NEGOCIO", tema, "negocio", f"Modelo de negócio: falta saber {TEMA_ROTULO[tema]}", lider, 10)
    tem_oferta = any(f.get("tema") == "oferta" and f.get("status") in ("declarado", "confirmado") for f in fatos)
    if tem_oferta and not mapa.get("ofertas"):
        add("NEGOCIO", "ofertas", "negocio", "Falta organizar a lista de produtos e serviços (ofertas), com clientes e canais de cada um", lider, 8)
    if not mapa.get("areas"):
        add("ESTRUTURA", "areas", "estrutura", "Falta saber quais áreas ou equipes existem", lider, 9)
    if not mapa.get("papeis"):
        add("ESTRUTURA", "papeis", "estrutura", "Falta saber quais funções ou cargos existem e quem ocupa cada um", lider, 9)
    mo = mapa.get("modelo_operacional") or {}
    if mo.get("status") not in ("declarado", "confirmado") and len(mapa.get("areas", [])) > 1:
        add("NEGOCIO", "modelo_operacional", "negocio",
            "Modelo operacional: falta saber o quanto as áreas ou unidades compartilham dados e seguem o mesmo jeito de trabalhar", lider, 4)

    # Categorias de macroprocesso (checklist, nunca preenchimento automático)
    raizes = filhos.get(None, [])
    tipos_presentes = {r.get("tipo") for r in raizes if r.get("status") in ("declarado", "confirmado")}
    if raizes:
        for t in TIPOS_PROCESSO:
            if t not in tipos_presentes:
                add("ESTRUTURA", f"tipo_{t}", "estrutura",
                    f"Nenhum macroprocesso de {TIPO_ROTULO[t].lower()} foi declarado ainda; perguntar se existe e quem faz", lider, 6)
    else:
        add("ESTRUTURA", "macroprocessos", "estrutura", "Ainda não há macroprocessos declarados (as grandes frentes de trabalho da empresa)", lider, 10)

    # Ofertas sem caminho ponta a ponta
    cvs = mapa.get("cadeias_de_valor", [])
    for of in mapa.get("ofertas", []):
        if cvs and not any(of["id"] in (cv.get("ofertas") or []) for cv in cvs):
            add(of["id"], "cadeia", "cadeia_de_valor", f"A oferta '{of.get('nome')}' ainda não está ligada a uma cadeia de valor (do pedido à entrega)", lider, 7, nome=of.get("nome", ""))

    # Processos
    for p in procs.values():
        nv = nivel_real(procs, p)
        cod = codigos.get(p["id"], "")
        para = sugerir_respondentes(mapa, p, procs)
        hip = set(p.get("hipoteses") or [])
        if p.get("status") == "hipotese":
            add(p["id"], "", "hipotese", f"{cod} {p.get('nome')}: existência ainda é hipótese; confirmar se esse processo existe", para, 8, cod, p.get("nome", ""))
        for campo in campos_obrigatorios(mapa, nv):
            if campo == "tipo" and nv > 1:
                continue
            if vazio(p.get(campo)):
                add(p["id"], campo, "campo", f"{cod} {p.get('nome')}: falta {CAMPO_ROTULO.get(campo, campo)}", para, 6 - min(nv, 3), cod, p.get("nome", ""))
            elif campo in hip:
                add(p["id"], campo, "hipotese", f"{cod} {p.get('nome')}: {CAMPO_ROTULO.get(campo, campo)} é hipótese, confirmar", para, 5, cod, p.get("nome", ""))
        e_folha = not filhos.get(p["id"])
        if e_folha and not p.get("fluxo") and not p.get("fluxo_dispensado") and p.get("status") != "hipotese":
            prio = p.get("prioridade") or {}
            peso = 3 + (prio.get("importancia") or 0) / 2 + (5 - (prio.get("saude") or 5)) / 2
            if nv == 1:
                add(p["id"], "fluxo", "decomposicao", f"{cod} {p.get('nome')}: falta detalhar (dividir em processos ou descrever o passo a passo)", para, round(peso, 1), cod, p.get("nome", ""))
            else:
                add(p["id"], "fluxo", "fluxo", f"{cod} {p.get('nome')}: falta o passo a passo", para, round(peso, 1), cod, p.get("nome", ""))
        fl = p.get("fluxo")
        if fl and fl.get("status") == "hipotese":
            add(p["id"], "fluxo", "hipotese", f"{cod} {p.get('nome')}: o passo a passo ainda é rascunho, validar com quem executa", para, 5, cod, p.get("nome", ""))
        if fl and fl.get("status") == "declarado":
            donos = [pe["id"] for pe in mapa.get("pessoas", []) if p.get("dono") and p["dono"] in (pe.get("papeis") or [])] or para
            add(p["id"], "fluxo", "validacao", f"{cod} {p.get('nome')}: passo a passo declarado, falta validação do dono", donos, 3, cod, p.get("nome", ""))

    for ct in mapa.get("contradicoes", []):
        if ct.get("status", "aberta") == "aberta":
            el = ct.get("elemento")
            proc = procs.get(el)
            add(ct["id"], "", "contradicao", f"Contradição: {ct.get('descricao', '')}",
                sugerir_respondentes(mapa, proc, procs) if proc else lider, 9)

    lac.sort(key=lambda x: (-x["peso"], x.get("codigo") or "", x["elemento"]))
    return lac


def calcular_cobertura(mapa):
    procs, filhos = arvore(mapa)
    por_nivel = {}
    preenchidos = exigidos = 0
    for p in procs.values():
        nv = nivel_real(procs, p)
        d = por_nivel.setdefault(nv, {"total": 0, "status": {s: 0 for s in STATUS}, "campos_ok": 0, "campos_total": 0,
                                       "folhas": 0, "folhas_com_fluxo": 0})
        d["total"] += 1
        d["status"][p.get("status", "hipotese")] = d["status"].get(p.get("status", "hipotese"), 0) + 1
        hip = set(p.get("hipoteses") or [])
        eh_hip = p.get("status") == "hipotese"
        for campo in campos_obrigatorios(mapa, nv):
            if campo == "tipo" and nv > 1:
                continue
            d["campos_total"] += 1
            exigidos += 1
            if not eh_hip and not vazio(p.get(campo)) and campo not in hip:
                d["campos_ok"] += 1
                preenchidos += 1
        if not filhos.get(p["id"]) and not p.get("fluxo_dispensado") and p.get("status") != "hipotese":
            d["folhas"] += 1
            exigidos += 1
            fl = p.get("fluxo")
            if fl and fl.get("status") in ("declarado", "confirmado"):
                d["folhas_com_fluxo"] += 1
                preenchidos += 1
    # Estrutura mínima: áreas, papéis e macroprocessos declarados
    estrutura = [
        any(a.get("status") in ("declarado", "confirmado") for a in mapa.get("areas", [])),
        any(a.get("status") in ("declarado", "confirmado") for a in mapa.get("papeis", [])),
        any(p.get("status") in ("declarado", "confirmado") and not p.get("pai") for p in procs.values()),
    ]
    exigidos += len(estrutura)
    preenchidos += sum(estrutura)
    temas_ok = [t for t in TEMAS_OBRIGATORIOS if t != "estrutura" and any(
        f.get("tema") == t and f.get("status") in ("declarado", "confirmado") for f in mapa.get("fatos", []))]
    exigidos += len(TEMAS_OBRIGATORIOS) - 1
    preenchidos += len(temas_ok)
    elementos = [o for c in COM_STATUS for o in mapa.get(c, [])]
    confirmados = sum(1 for o in elementos if o.get("status") == "confirmado")
    hipoteses = sum(1 for o in elementos if o.get("status") == "hipotese")
    return {
        "por_nivel": {str(k): v for k, v in sorted(por_nivel.items())},
        "temas_negocio_ok": temas_ok,
        "temas_negocio_total": len(TEMAS_OBRIGATORIOS) - 1,
        "completude": round(100 * preenchidos / exigidos, 1) if exigidos else 0.0,
        "validacao": round(100 * confirmados / len(elementos), 1) if elementos else 0.0,
        "elementos": len(elementos),
        "confirmados": confirmados,
        "hipoteses": hipoteses,
        "processos": len(procs),
        "perguntas_pendentes": sum(1 for q in mapa.get("perguntas", []) if q.get("status") in ("aberta", "em_formulario") and q.get("tipo") != "confirmacao"),
        "frases_pendentes": sum(1 for q in mapa.get("perguntas", []) if q.get("status") in ("aberta", "em_formulario") and q.get("tipo") == "confirmacao"),
        "contradicoes_abertas": sum(1 for c in mapa.get("contradicoes", []) if c.get("status", "aberta") == "aberta"),
        "formularios_enviados": sum(1 for f in mapa.get("formularios", []) if f.get("status") == "enviado"),
        "decisoes_provisorias": sum(1 for d in mapa.get("decisoes", []) if d.get("provisoria")),
        "no_papel": sum(1 for p in procs.values() if p.get("situacao") in ("no_papel", "em_implantacao")),
    }


# --------------------------------------------------------------------------
# Layout de fluxos (camadas, raias e rotas ortogonais)
# --------------------------------------------------------------------------

TASK_W, TASK_H = 128, 72
EVT = 36
GW = 50
COL_W = 176
ROW_H = 104
POOL_HDR = 30
LANE_HDR = 30
LANE_PAD = 22
EXT_H = 60
EXT_GAP = 40


def dims(no):
    t = no.get("tipo")
    if t in ("inicio", "fim", "espera"):
        return EVT, EVT
    if t in GATEWAYS:
        return GW, GW
    return TASK_W, TASK_H


def nome_papel(mapa, ref):
    for pa in mapa.get("papeis", []):
        if pa["id"] == ref:
            return pa.get("nome", ref)
    return ref or "Sem papel definido"


def layout_fluxo(mapa, proc):
    fl = proc.get("fluxo") or {}
    nos = OrderedDict((n["id"], n) for n in fl.get("nos", []))
    lig = [lg for lg in fl.get("ligacoes", []) if lg.get("de") in nos and lg.get("para") in nos]
    saidas = defaultdict(list)
    entradas = defaultdict(list)
    for lg in lig:
        saidas[lg["de"]].append(lg["para"])
        entradas[lg["para"]].append(lg["de"])

    # 1. Arestas de retorno (DFS a partir dos inícios)
    inicios = [k for k, n in nos.items() if n.get("tipo") == "inicio"] or [k for k in nos if not entradas[k]] or list(nos)[:1]
    estado, ordem_dfs, retorno = {}, [], set()

    def dfs(u):
        estado[u] = 1
        ordem_dfs.append(u)
        for v in saidas[u]:
            if estado.get(v) == 1:
                retorno.add((u, v))
            elif v not in estado:
                dfs(v)
        estado[u] = 2

    sys.setrecursionlimit(10000)
    for s in inicios:
        if s not in estado:
            dfs(s)
    for k in nos:
        if k not in estado:
            dfs(k)
    pos_dfs = {k: i for i, k in enumerate(ordem_dfs)}

    # 2. Camadas pelo caminho mais longo no grafo sem retornos
    rank = {k: 0 for k in nos}
    indeg = {k: 0 for k in nos}
    frente = defaultdict(list)
    for lg in lig:
        if (lg["de"], lg["para"]) in retorno:
            continue
        frente[lg["de"]].append(lg["para"])
        indeg[lg["para"]] += 1
    fila = sorted([k for k in nos if indeg[k] == 0], key=lambda k: pos_dfs.get(k, 0))
    while fila:
        u = fila.pop(0)
        for v in frente[u]:
            rank[v] = max(rank[v], rank[u] + 1)
            indeg[v] -= 1
            if indeg[v] == 0:
                fila.append(v)
    for k, n in nos.items():
        if n.get("tipo") == "fim":
            pass

    # 3. Raias
    raias = list(fl.get("raias") or [])
    for n in nos.values():
        r = n.get("raia") or "_sem_papel"
        if r not in raias:
            raias.append(r)
    grupos = defaultdict(list)
    for k in sorted(nos, key=lambda k: pos_dfs.get(k, 0)):
        grupos[(nos[k].get("raia") or "_sem_papel", rank[k])].append(k)
    linhas_raia = {r: 1 for r in raias}
    linha_no = {}
    for (r, _), ks in grupos.items():
        linhas_raia[r] = max(linhas_raia[r], len(ks))
        for i, k in enumerate(ks):
            linha_no[k] = i

    externos = list(fl.get("externos") or [])
    pool_x, pool_y = 0, (len(externos) * (EXT_H + EXT_GAP))
    x0 = pool_x + POOL_HDR + LANE_HDR + 30
    max_rank = max(rank.values()) if rank else 0
    pool_w = (x0 - pool_x) + (max_rank + 1) * COL_W + 30
    lanes = []
    y = pool_y
    for r in raias:
        h = linhas_raia[r] * ROW_H + 2 * LANE_PAD
        lanes.append({"id": r, "nome": nome_papel(mapa, r) if r != "_sem_papel" else "Sem papel definido", "x": pool_x + POOL_HDR, "y": y, "w": pool_w - POOL_HDR, "h": h})
        y += h
    pool_h = y - pool_y
    lane_por_id = {ln["id"]: ln for ln in lanes}

    pos = {}
    for k, n in nos.items():
        w, h = dims(n)
        ln = lane_por_id[n.get("raia") or "_sem_papel"]
        cx = x0 + rank[k] * COL_W + COL_W / 2
        cy = ln["y"] + LANE_PAD + linha_no[k] * ROW_H + ROW_H / 2
        pos[k] = {"x": round(cx - w / 2), "y": round(cy - h / 2), "w": w, "h": h, "cx": round(cx), "cy": round(cy)}

    ext_box = {}
    for i, x in enumerate(externos):
        ext_box[x["id"]] = {"x": pool_x, "y": i * (EXT_H + EXT_GAP), "w": pool_w, "h": EXT_H, "nome": x.get("nome", x["id"])}

    def gw(k):
        return nos[k].get("tipo") in GATEWAYS

    def obstaculos(ra, rb, y0, y1, ignora):
        out = []
        for k2 in nos:
            if k2 in ignora:
                continue
            if min(ra, rb) < rank[k2] < max(ra, rb):
                p2 = pos[k2]
                if p2["y"] - 4 <= y1 and p2["y"] + p2["h"] + 4 >= y0:
                    out.append(p2)
        return out

    arestas = []
    k_ret = 0
    k_cima = 0
    for i, lg in enumerate(lig):
        a_, b_ = lg["de"], lg["para"]
        s, t = pos[a_], pos[b_]
        ra, rb = rank[a_], rank[b_]
        lbl = None
        if (a_, b_) in retorno or rb < ra:
            obs = obstaculos(ra, rb, min(s["y"], t["y"]), max(s["y"] + s["h"], t["y"] + t["h"]) + 60, {a_, b_})
            base = max([s["y"] + s["h"], t["y"] + t["h"]] + [o["y"] + o["h"] for o in obs if abs(o["cy"] - s["cy"]) < ROW_H / 2])
            yb = base + 16 + 6 * k_ret
            k_ret += 1
            pts = [(s["cx"], s["y"] + s["h"]), (s["cx"], yb), (t["cx"], yb), (t["cx"], t["y"] + t["h"])]
            lbl = (t["cx"] + 8, yb + 2)
        elif rb == ra:
            if t["cy"] > s["cy"]:
                pts = [(s["cx"], s["y"] + s["h"]), (t["cx"], t["y"])]
            else:
                pts = [(s["cx"], s["y"]), (t["cx"], t["y"] + t["h"])]
            if s["cx"] != t["cx"]:
                my = round((pts[0][1] + pts[1][1]) / 2)
                pts = [pts[0], (pts[0][0], my), (pts[1][0], my), pts[1]]
            lbl = (pts[0][0] + 6, round((pts[0][1] + pts[-1][1]) / 2) - 7)
        elif abs(s["cy"] - t["cy"]) < 2:
            obs = obstaculos(ra, rb, s["cy"], s["cy"], {a_, b_})
            if obs:
                yc = min([o["y"] for o in obs] + [s["y"], t["y"]]) - 14 - 6 * k_cima
                k_cima += 1
                pts = [(s["cx"], s["y"]), (s["cx"], yc), (t["cx"], yc), (t["cx"], t["y"])]
                lbl = (s["cx"] + 8, yc - 16)
            else:
                pts = [(s["x"] + s["w"], s["cy"]), (t["x"], t["cy"])]
                lbl = (s["x"] + s["w"] + 6, s["cy"] - 20)
        elif gw(a_):
            sy = s["y"] if t["cy"] < s["cy"] else s["y"] + s["h"]
            pts = [(s["cx"], sy), (s["cx"], t["cy"]), (t["x"], t["cy"])]
            lbl = (s["cx"] + 8, t["cy"] - 20)
        elif gw(b_):
            ty = t["y"] if s["cy"] < t["cy"] else t["y"] + t["h"]
            pts = [(s["x"] + s["w"], s["cy"]), (t["cx"], s["cy"]), (t["cx"], ty)]
            lbl = (s["x"] + s["w"] + 6, s["cy"] - 20)
        else:
            mx = t["x"] - 24
            pts = [(s["x"] + s["w"], s["cy"]), (mx, s["cy"]), (mx, t["cy"]), (t["x"], t["cy"])]
            lbl = (s["x"] + s["w"] + 6, s["cy"] - 20)
        arestas.append({"id": f"F{i + 1}", "de": a_, "para": b_, "rotulo": lg.get("rotulo", ""), "pts": pts, "lbl": lbl})

    msgs = []
    usados = defaultdict(int)
    for i, m in enumerate(fl.get("mensagens") or []):
        de, para = m.get("de"), m.get("para")
        if de in ext_box and para in pos:
            n = pos[para]
            off = 14 * usados[para]
            usados[para] += 1
            x = n["cx"] + off
            pts = [(x, ext_box[de]["y"] + EXT_H), (x, n["y"])]
            ly = ext_box[de]["y"] + EXT_H + EXT_GAP // 2 - 7
        elif para in ext_box and de in pos:
            n = pos[de]
            off = 14 * usados[de]
            usados[de] += 1
            x = n["cx"] - off
            pts = [(x, n["y"]), (x, ext_box[para]["y"] + EXT_H)]
            ly = ext_box[para]["y"] + EXT_H + EXT_GAP // 2 - 7
        else:
            continue
        msgs.append({"id": f"M{i + 1}", "de": de, "para": para, "rotulo": m.get("rotulo", ""), "pts": pts, "lbl": (x + 6, ly)})

    # Onde pôr o rótulo de eventos e desvios: do lado (cima/baixo) que nenhuma seta usa
    uso = defaultdict(set)
    for a in arestas + msgs:
        for k2, ponto in ((a["de"], a["pts"][0]), (a["para"], a["pts"][-1])):
            if k2 in pos:
                p2 = pos[k2]
                if abs(ponto[1] - p2["y"]) < 1:
                    uso[k2].add("cima")
                if abs(ponto[1] - (p2["y"] + p2["h"])) < 1:
                    uso[k2].add("baixo")
    for k2, n in nos.items():
        t_ = n.get("tipo")
        if t_ in GATEWAYS:
            pos[k2]["rotulo_lado"] = "cima" if "cima" not in uso[k2] else ("baixo" if "baixo" not in uso[k2] else "cima")
        else:
            pos[k2]["rotulo_lado"] = "baixo" if "baixo" not in uso[k2] else ("cima" if "cima" not in uso[k2] else "baixo")

    return {
        "nos": nos, "pos": pos, "rank": rank, "raias": lanes, "externos": ext_box,
        "pool": {"x": pool_x, "y": pool_y, "w": pool_w, "h": pool_h},
        "arestas": arestas, "mensagens": msgs, "max_rank": max_rank,
        "altura_total": pool_y + pool_h, "largura_total": pool_w,
    }


# --------------------------------------------------------------------------
# BPMN 2.0
# --------------------------------------------------------------------------


def status_no(fluxo, no):
    return no.get("status") or fluxo.get("status") or "hipotese"


def gerar_bpmn(mapa, proc, codigo):
    lay = layout_fluxo(mapa, proc)
    fl = proc.get("fluxo") or {}
    pid = ncname(proc["id"])
    P = f"Process_{pid}"
    nos = lay["nos"]

    def nid(k):
        return ncname(f"{pid}_{k}")

    def lid(r):
        return ncname(f"Lane_{pid}_{r}")

    inc, out = defaultdict(list), defaultdict(list)
    for a in lay["arestas"]:
        out[a["de"]].append(f"{pid}_{a['id']}")
        inc[a["para"]].append(f"{pid}_{a['id']}")

    L = []
    w = L.append
    w('<?xml version="1.0" encoding="UTF-8"?>')
    w('<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
      'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" '
      'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" '
      'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" '
      'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" '
      'xmlns:color="http://www.omg.org/spec/BPMN/non-normative/color/1.0" '
      f'id="Definitions_{pid}" targetNamespace="http://bpmn.io/schema/bpmn" '
      f'exporter="mapear-processos" exporterVersion="{VERSAO}">')
    w(f'  <bpmn:collaboration id="Collaboration_{pid}">')
    w(f'    <bpmn:participant id="Participant_{pid}" name="{xesc(codigo + " " + proc.get("nome", ""))}" processRef="{P}" />')
    for xid, box in lay["externos"].items():
        w(f'    <bpmn:participant id="{ncname("Ext_" + pid + "_" + xid)}" name="{xesc(box["nome"])}" />')
    for m in lay["mensagens"]:
        src = ncname("Ext_" + pid + "_" + m["de"]) if m["de"] in lay["externos"] else nid(m["de"])
        tgt = ncname("Ext_" + pid + "_" + m["para"]) if m["para"] in lay["externos"] else nid(m["para"])
        w(f'    <bpmn:messageFlow id="{pid}_{m["id"]}" name="{xesc(m["rotulo"])}" sourceRef="{src}" targetRef="{tgt}" />')
    w('  </bpmn:collaboration>')
    w(f'  <bpmn:process id="{P}" name="{xesc(codigo + " " + proc.get("nome", ""))}" isExecutable="false">')
    doc = proc.get("descricao") or ""
    w(f'    <bpmn:documentation>{xesc(doc)} [status do fluxo: {STATUS_ROTULO.get(fl.get("status", "hipotese"))}; evidências: {", ".join(fl.get("evidencias", []) or []) or "nenhuma"}]</bpmn:documentation>')
    w(f'    <bpmn:laneSet id="LaneSet_{pid}">')
    for ln in lay["raias"]:
        w(f'      <bpmn:lane id="{lid(ln["id"])}" name="{xesc(ln["nome"])}">')
        for k, n in nos.items():
            if (n.get("raia") or "_sem_papel") == ln["id"]:
                w(f'        <bpmn:flowNodeRef>{nid(k)}</bpmn:flowNodeRef>')
        w('      </bpmn:lane>')
    w('    </bpmn:laneSet>')
    for k, n in nos.items():
        t = n.get("tipo")
        nome = xesc(n.get("nome", ""))
        tag = {
            "inicio": "startEvent", "fim": "endEvent", "decisao": "exclusiveGateway",
            "paralelo": "parallelGateway", "inclusivo": "inclusiveGateway", "espera": "intermediateCatchEvent",
            "subprocesso": "subProcess",
        }.get(t)
        if t == "tarefa":
            modo = n.get("modo")
            # Paleta descritiva (Silver): pessoa usando sistema = userTask, automático = serviceTask, demais = task
            tag = {"sistema": "userTask", "automatico": "serviceTask"}.get(modo, "task")
        attrs = f'id="{nid(k)}" name="{nome}"'
        corpo = []
        nota = []
        if n.get("sistema"):
            nota.append(f"sistema: {nome_sistema(mapa, n['sistema'])}")
        if n.get("descricao"):
            nota.append(n["descricao"])
        nota.append(f"status: {STATUS_ROTULO.get(status_no(fl, n))}")
        corpo.append(f'<bpmn:documentation>{xesc("; ".join(nota))}</bpmn:documentation>')
        for f_ in inc[k]:
            corpo.append(f"<bpmn:incoming>{f_}</bpmn:incoming>")
        for f_ in out[k]:
            corpo.append(f"<bpmn:outgoing>{f_}</bpmn:outgoing>")
        gat = n.get("gatilho") or n.get("evento")
        if t in ("inicio", "espera", "fim") and gat in ("mensagem", "tempo"):
            if gat == "mensagem":
                corpo.append(f'<bpmn:messageEventDefinition id="{nid(k)}_def" />')
            elif t != "fim":
                corpo.append(f'<bpmn:timerEventDefinition id="{nid(k)}_def" />')
        w(f"    <bpmn:{tag} {attrs}>" + "".join(corpo) + f"</bpmn:{tag}>")
    for a in lay["arestas"]:
        w(f'    <bpmn:sequenceFlow id="{pid}_{a["id"]}" name="{xesc(a["rotulo"])}" sourceRef="{nid(a["de"])}" targetRef="{nid(a["para"])}" />')
    w('  </bpmn:process>')

    # Diagrama
    w(f'  <bpmndi:BPMNDiagram id="BPMNDiagram_{pid}">')
    w(f'    <bpmndi:BPMNPlane id="BPMNPlane_{pid}" bpmnElement="Collaboration_{pid}">')
    pl = lay["pool"]
    w(f'      <bpmndi:BPMNShape id="Participant_{pid}_di" bpmnElement="Participant_{pid}" isHorizontal="true">'
      f'<dc:Bounds x="{pl["x"]}" y="{pl["y"]}" width="{pl["w"]}" height="{pl["h"]}" /></bpmndi:BPMNShape>')
    for ln in lay["raias"]:
        w(f'      <bpmndi:BPMNShape id="{lid(ln["id"])}_di" bpmnElement="{lid(ln["id"])}" isHorizontal="true">'
          f'<dc:Bounds x="{ln["x"]}" y="{ln["y"]}" width="{ln["w"]}" height="{ln["h"]}" /></bpmndi:BPMNShape>')
    for xid, box in lay["externos"].items():
        eid = ncname("Ext_" + pid + "_" + xid)
        w(f'      <bpmndi:BPMNShape id="{eid}_di" bpmnElement="{eid}" isHorizontal="true">'
          f'<dc:Bounds x="{box["x"]}" y="{box["y"]}" width="{box["w"]}" height="{box["h"]}" /></bpmndi:BPMNShape>')
    for k, n in nos.items():
        p_ = lay["pos"][k]
        cor = COR_STATUS[status_no(fl, n)]
        extra = ""
        if n.get("tipo") == "decisao":
            extra = ' isMarkerVisible="true"'
        if n.get("tipo") == "subprocesso":
            extra = ' isExpanded="false"'
        rot = ""
        if n.get("tipo") in ("inicio", "fim", "espera") + GATEWAYS and n.get("nome"):
            lw = 110
            lh = 14 * len(quebra(n.get("nome"), 18))
            ly = p_["y"] + p_["h"] + 6 if p_.get("rotulo_lado") == "baixo" else p_["y"] - lh - 6
            rot = (f'<bpmndi:BPMNLabel><dc:Bounds x="{p_["cx"] - lw // 2}" y="{ly}" '
                   f'width="{lw}" height="{lh}" /></bpmndi:BPMNLabel>')
        w(f'      <bpmndi:BPMNShape id="{nid(k)}_di" bpmnElement="{nid(k)}"{extra} '
          f'color:background-color="{cor["fill"]}" color:border-color="{cor["stroke"]}">'
          f'<dc:Bounds x="{p_["x"]}" y="{p_["y"]}" width="{p_["w"]}" height="{p_["h"]}" />{rot}</bpmndi:BPMNShape>')
    for a in lay["arestas"]:
        wp = "".join(f'<di:waypoint x="{x}" y="{y}" />' for x, y in a["pts"])
        rot = ""
        if a["rotulo"]:
            lx, ly = a["lbl"]
            rot = f'<bpmndi:BPMNLabel><dc:Bounds x="{lx}" y="{ly}" width="{max(30, 7 * len(a["rotulo"]))}" height="14" /></bpmndi:BPMNLabel>'
        w(f'      <bpmndi:BPMNEdge id="{pid}_{a["id"]}_di" bpmnElement="{pid}_{a["id"]}">{wp}{rot}</bpmndi:BPMNEdge>')
    for m in lay["mensagens"]:
        wp = "".join(f'<di:waypoint x="{x}" y="{y}" />' for x, y in m["pts"])
        rot = ""
        if m["rotulo"]:
            lx, ly = m["lbl"]
            rot = f'<bpmndi:BPMNLabel><dc:Bounds x="{lx}" y="{ly}" width="{max(30, 7 * len(m["rotulo"]))}" height="14" /></bpmndi:BPMNLabel>'
        w(f'      <bpmndi:BPMNEdge id="{pid}_{m["id"]}_di" bpmnElement="{pid}_{m["id"]}">{wp}{rot}</bpmndi:BPMNEdge>')
    w('    </bpmndi:BPMNPlane>')
    w('  </bpmndi:BPMNDiagram>')
    w('</bpmn:definitions>')
    return "\n".join(L) + "\n"


def nome_sistema(mapa, ref):
    for s in mapa.get("sistemas", []):
        if s["id"] == ref:
            return s.get("nome", ref)
    return ref


# --------------------------------------------------------------------------
# Leitura do fluxo em frases (para validar com quem executa, sem mostrar diagrama)
# --------------------------------------------------------------------------


def frases_fluxo(mapa, proc):
    """Devolve [(texto, id_do_no)] na ordem de leitura: caminho principal, desvios e, por fim, os fins."""
    fl = proc.get("fluxo") or {}
    nos = OrderedDict((n["id"], n) for n in fl.get("nos", []))
    saidas = defaultdict(list)
    for lg in fl.get("ligacoes", []):
        if lg.get("de") in nos and lg.get("para") in nos:
            saidas[lg["de"]].append(lg)
    ext = {x["id"]: x.get("nome", x["id"]) for x in fl.get("externos", []) or []}
    m_in, m_out = defaultdict(list), defaultdict(list)
    for m in fl.get("mensagens", []) or []:
        if m.get("de") in ext:
            m_in[m.get("para")].append(m)
        if m.get("para") in ext:
            m_out[m.get("de")].append(m)
    ordem, visto, fins = [], set(), []

    def dfs(k):
        if k in visto or k not in nos:
            return
        visto.add(k)
        (fins if nos[k].get("tipo") == "fim" else ordem).append(k)
        for lg in saidas[k]:
            dfs(lg["para"])

    for k, n in nos.items():
        if n.get("tipo") == "inicio":
            dfs(k)
    for k in nos:
        dfs(k)
    ordem += fins
    num, i = {}, 0
    for k in ordem:
        if nos[k].get("tipo") in ("tarefa", "subprocesso", "decisao", "espera"):
            i += 1
            num[k] = i

    def ref(k):
        n = nos.get(k, {})
        if k in num:
            return f"passo {num[k]} ({n.get('nome', '')})"
        if n.get("tipo") == "fim":
            return f"o fim \"{n.get('nome', '')}\""
        return n.get("nome") or "o próximo passo"

    def papel(n):
        return nome_papel(mapa, n["raia"]) if n.get("raia") else "Alguém (papel a definir)"

    def msgs(k):
        t = ""
        for m in m_in[k]:
            t += f" Recebe de {ext[m['de']]}: {m.get('rotulo') or 'mensagem'}."
        for m in m_out[k]:
            t += f" Envia para {ext[m['para']]}: {m.get('rotulo') or 'mensagem'}."
        return t

    def seguinte(k, pos):
        o = saidas[k]
        if len(o) != 1:
            return ""
        alvo = o[0]["para"]
        prox = ordem[pos + 1] if pos + 1 < len(ordem) else None
        return "" if alvo == prox else f" Depois segue para {ref(alvo)}."

    out = []
    for pos, k in enumerate(ordem):
        n, t = nos[k], nos[k].get("tipo")
        if t == "inicio":
            txt = f"O processo começa quando: {n.get('nome') or '?'}." + msgs(k)
        elif t == "fim":
            txt = f"Termina em: {n.get('nome') or 'fim'}." + msgs(k)
        elif t == "tarefa":
            sis = f" (usa {nome_sistema(mapa, n['sistema'])})" if n.get("sistema") else ""
            txt = f"{num[k]}. {papel(n)}: {n.get('nome', '')}{sis}." + msgs(k) + seguinte(k, pos)
        elif t == "subprocesso":
            txt = f"{num[k]}. {papel(n)}: {n.get('nome', '')}." + msgs(k) + seguinte(k, pos)
        elif t == "espera":
            txt = f"{num[k]}. Aguarda: {n.get('nome', '')}." + msgs(k) + seguinte(k, pos)
        elif t in ("decisao", "inclusivo"):
            ramos = " ".join(f"Se \"{lg.get('rotulo') or '?'}\", segue para {ref(lg['para'])}." for lg in saidas[k])
            txt = f"{num[k]}. {papel(n)} confere: {n.get('nome') or '?'} {ramos}"
        elif t == "paralelo":
            o = saidas[k]
            if len(o) > 1:
                txt = "A partir daqui acontecem ao mesmo tempo: " + "; ".join(ref(lg["para"]) for lg in o) + "."
            else:
                txt = "Os caminhos em paralelo se juntam e seguem para " + (ref(o[0]["para"]) if o else "o próximo passo") + "."
        else:
            continue
        out.append((txt, k))
    return out


# --------------------------------------------------------------------------
# Mermaid
# --------------------------------------------------------------------------


def mm_txt(s):
    s = str(s or "").replace('"', "#quot;").replace("\n", " ")
    return s


def mm_id(s):
    return re.sub(r"[^A-Za-z0-9_]", "_", str(s))


def mm_classdefs():
    out = []
    for st, c in COR_STATUS.items():
        dash = ",stroke-dasharray: 5 5" if st == "hipotese" else ""
        out.append(f"    classDef {st} fill:{c['fill']},stroke:{c['stroke']},color:{c['text']}{dash}")
    return out


def mermaid_hierarquia(mapa, codigos):
    procs, filhos = arvore(mapa)
    L = ["flowchart LR"] + mm_classdefs()
    org = mm_txt(mapa.get("organizacao", {}).get("nome", "Organização"))
    L.append(f'    ORG["{org}"]')
    for p in procs.values():
        L.append(f'    {mm_id(p["id"])}["{mm_txt(codigos.get(p["id"], ""))} {mm_txt(p.get("nome", ""))}"]:::{p.get("status", "hipotese")}')
    for p in procs.values():
        pai = mm_id(p["pai"]) if p.get("pai") in procs else "ORG"
        L.append(f'    {pai} --> {mm_id(p["id"])}')
    return "\n".join(L) + "\n"


def mermaid_cadeia(mapa, codigos):
    procs, filhos = arvore(mapa)
    raizes = filhos.get(None, [])
    L = ["flowchart TB"] + mm_classdefs()
    for t in ("gestao", "finalistico", "suporte", None):
        grupo = [r for r in raizes if r.get("tipo") == t]
        if not grupo:
            continue
        sid = f"cat_{t or 'sem'}"
        L.append(f'    subgraph {sid} ["{TIPO_ROTULO[t]}"]')
        L.append("    direction LR")
        for r in grupo:
            L.append(f'      {mm_id(r["id"])}["{mm_txt(codigos[r["id"]])} {mm_txt(r.get("nome"))}"]:::{r.get("status", "hipotese")}')
        if t == "finalistico":
            for a, b in zip(grupo, grupo[1:]):
                L.append(f"      {mm_id(a['id'])} --> {mm_id(b['id'])}")
        L.append("    end")
    ordem = [f"cat_{t or 'sem'}" for t in ("gestao", "finalistico", "suporte", None) if any(r.get("tipo") == t for r in raizes)]
    for a, b in zip(ordem, ordem[1:]):
        L.append(f"    {a} ~~~ {b}")
    return "\n".join(L) + "\n"


def mermaid_fluxo(mapa, proc, codigo):
    fl = proc.get("fluxo") or {}
    nos = OrderedDict((n["id"], n) for n in fl.get("nos", []))
    raias = list(fl.get("raias") or [])
    for n in nos.values():
        r = n.get("raia") or "_sem_papel"
        if r not in raias:
            raias.append(r)
    L = ["flowchart LR"] + mm_classdefs()

    def forma(k, n):
        t = n.get("tipo")
        nome = mm_txt(n.get("nome", ""))
        i = mm_id("n_" + k)
        if t == "inicio":
            return f'{i}(["{nome or "Início"}"])'
        if t == "fim":
            return f'{i}(["{nome or "Fim"}"])'
        if t == "decisao":
            return f'{i}{{"{nome or "?"}"}}'
        if t == "paralelo":
            return f'{i}{{"+"}}'
        if t == "inclusivo":
            return f'{i}{{"o"}}'
        if t == "espera":
            return f'{i}>"{nome or "Aguardar"}"]'
        if t == "subprocesso":
            return f'{i}[["{nome}"]]'
        return f'{i}["{nome}"]'

    for r in raias:
        rotulo = nome_papel(mapa, r) if r != "_sem_papel" else "Sem papel definido"
        L.append(f'    subgraph {mm_id("raia_" + r)} ["{mm_txt(rotulo)}"]')
        for k, n in nos.items():
            if (n.get("raia") or "_sem_papel") == r:
                L.append(f"      {forma(k, n)}:::{status_no(fl, n)}")
        L.append("    end")
    for x in fl.get("externos") or []:
        L.append(f'    {mm_id("ext_" + x["id"])}[/"{mm_txt(x.get("nome"))}"/]')
    for lg in fl.get("ligacoes", []):
        if lg.get("de") in nos and lg.get("para") in nos:
            r = lg.get("rotulo")
            seta = f' -->|{mm_txt(r)}| ' if r else " --> "
            L.append(f"    {mm_id('n_' + lg['de'])}{seta}{mm_id('n_' + lg['para'])}")
    ext_ids = {x["id"] for x in fl.get("externos") or []}
    for m in fl.get("mensagens") or []:
        a = mm_id(("ext_" if m.get("de") in ext_ids else "n_") + str(m.get("de")))
        b = mm_id(("ext_" if m.get("para") in ext_ids else "n_") + str(m.get("para")))
        r = m.get("rotulo")
        L.append(f"    {a} -.->|{mm_txt(r)}| {b}" if r else f"    {a} -.-> {b}")
    return "\n".join(L) + "\n"


# --------------------------------------------------------------------------
# draw.io (diagrams.net)
# --------------------------------------------------------------------------


class Pagina:
    def __init__(self, pid, nome):
        self.pid, self.nome = pid, nome
        self.celulas = []
        self.n = 1

    def novo_id(self):
        self.n += 1
        return f"{self.pid}-c{self.n}"

    def vertice(self, rotulo, x, y, w, h, estilo, link=None, cid=None):
        cid = cid or self.novo_id()
        geo = f'<mxGeometry x="{round(x)}" y="{round(y)}" width="{round(w)}" height="{round(h)}" as="geometry" />'
        if link:
            self.celulas.append(
                f'<UserObject label="{xesc(rotulo)}" link="data:page/id,{xesc(link)}" id="{cid}">'
                f'<mxCell style="{estilo}" vertex="1" parent="1">{geo}</mxCell></UserObject>')
        else:
            self.celulas.append(f'<mxCell id="{cid}" value="{xesc(rotulo)}" style="{estilo}" vertex="1" parent="1">{geo}</mxCell>')
        return cid

    def aresta(self, de, para, rotulo="", estilo="", pontos=None):
        cid = self.novo_id()
        pts = ""
        if pontos:
            pts = '<Array as="points">' + "".join(f'<mxPoint x="{round(x)}" y="{round(y)}" />' for x, y in pontos) + "</Array>"
        self.celulas.append(
            f'<mxCell id="{cid}" value="{xesc(rotulo)}" style="{estilo}" edge="1" parent="1" source="{de}" target="{para}">'
            f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry></mxCell>')
        return cid

    def xml(self):
        return (f'<diagram id="{xesc(self.pid)}" name="{xesc(self.nome)}"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" '
                f'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0">'
                f'<root><mxCell id="0" /><mxCell id="1" parent="0" />' + "".join(self.celulas) + "</root></mxGraphModel></diagram>")


def estilo_status(st, extra=""):
    c = COR_STATUS[st]
    dash = "dashed=1;dashPattern=6 4;" if st == "hipotese" else ""
    return f"rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor={c['fill']};strokeColor={c['stroke']};fontColor={c['text']};{dash}fontSize=12;{extra}"


def gerar_drawio(mapa, codigos):
    procs, filhos = arvore(mapa)
    raizes = filhos.get(None, [])
    com_fluxo = [p for p in procs.values() if p.get("fluxo")]
    pag_fluxo = {p["id"]: f"pg-{slug(p['id'])}" for p in com_fluxo}
    paginas = []

    # Cadeia de valor
    pg = Pagina("pg-cadeia", "Cadeia de valor")
    org = mapa.get("organizacao", {}).get("nome", "Organização")
    pg.vertice(f"<b>Cadeia de valor: {xesc(org)}</b>", 0, -60, 600, 40,
               "text;html=1;fontSize=20;align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")
    y = 0
    largura = max(1, max((len([r for r in raizes if r.get("tipo") == t]) for t in TIPOS_PROCESSO + (None,)), default=1)) * 230 + 160
    for t in ("gestao", "finalistico", "suporte", None):
        grupo = [r for r in raizes if r.get("tipo") == t]
        if not grupo:
            continue
        pg.vertice(TIPO_ROTULO[t], 0, y, largura, 130,
                   "rounded=0;whiteSpace=wrap;html=1;fillColor=#F4F6F8;strokeColor=#D5DAE0;verticalAlign=top;align=left;spacingLeft=12;spacingTop=6;fontStyle=1;fontSize=13;fontColor=#33404D;")
        x = 150
        ant = None
        for r in grupo:
            st = r.get("status", "hipotese")
            rot = f"<b>{xesc(codigos[r['id']])}</b> {xesc(r.get('nome', ''))}"
            alvo = "pg-hierarquia"
            if t == "finalistico":
                cid = pg.vertice(rot, x, y + 30, 210, 80, estilo_status(st, "shape=step;perimeter=stepPerimeter;fixedSize=1;size=18;rounded=0;"), link=alvo)
            else:
                cid = pg.vertice(rot, x, y + 30, 210, 80, estilo_status(st), link=alvo)
            ant = cid
            x += 230
        y += 160
    paginas.append(pg)

    # Hierarquia (árvore da esquerda para a direita)
    pg = Pagina("pg-hierarquia", "Hierarquia")
    pg.vertice(f"<b>Hierarquia de processos: {xesc(org)}</b>", 0, -60, 600, 40,
               "text;html=1;fontSize=20;align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")
    CW, CH, GX, GY = 250, 56, 70, 14
    cursor = [0]
    posh = {}

    def colocar(p, prof):
        kids = filhos.get(p["id"], [])
        if not kids:
            yy = cursor[0]
            cursor[0] += CH + GY
        else:
            ys = [colocar(k, prof + 1) for k in kids]
            yy = (ys[0] + ys[-1]) / 2
        posh[p["id"]] = (prof * (CW + GX), yy)
        return yy

    ultimo_tipo = "_"
    for r in raizes:
        if r.get("tipo") != ultimo_tipo and ultimo_tipo != "_":
            cursor[0] += 30
        ultimo_tipo = r.get("tipo")
        colocar(r, 0)
    ids = {}
    for p in procs.values():
        if p["id"] not in posh:
            continue
        x, yy = posh[p["id"]]
        st = p.get("status", "hipotese")
        rot = f"<b>{xesc(codigos[p['id']])}</b> {xesc(p.get('nome', ''))}"
        dono = nome_papel(mapa, p.get("dono")) if p.get("dono") else ""
        if dono:
            rot += f"<br><font style='font-size:10px'>{xesc(dono)}</font>"
        ids[p["id"]] = pg.vertice(rot, x, yy, CW, CH, estilo_status(st, "align=left;spacingLeft=8;"), link=pag_fluxo.get(p["id"]))
    for p in procs.values():
        if p.get("pai") in ids and p["id"] in ids:
            pg.aresta(ids[p["pai"]], ids[p["id"]], "", "edgeStyle=elbowEdgeStyle;elbow=horizontal;html=1;endArrow=none;strokeColor=#8A9099;")
    paginas.append(pg)

    # Um fluxo por página
    for p in com_fluxo:
        lay = layout_fluxo(mapa, p)
        fl = p["fluxo"]
        pg = Pagina(pag_fluxo[p["id"]], f"{codigos[p['id']]} {p.get('nome', '')}"[:60])
        pg.vertice(f"<b>{xesc(codigos[p['id']])} {xesc(p.get('nome', ''))}</b>  ·  fluxo {STATUS_ROTULO.get(fl.get('status', 'hipotese')).lower()}",
                   0, -50, 700, 30, "text;html=1;fontSize=16;align=left;verticalAlign=middle;strokeColor=none;fillColor=none;")
        for xid, box in lay["externos"].items():
            pg.vertice(box["nome"], box["x"], box["y"], box["w"], box["h"],
                       "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#5B6670;fontStyle=1;", cid=f"{pg.pid}-x-{slug(xid)}")
        pl = lay["pool"]
        pg.vertice(f"{codigos[p['id']]} {p.get('nome', '')}", pl["x"], pl["y"], POOL_HDR, pl["h"],
                   "rounded=0;whiteSpace=wrap;html=1;horizontal=0;fillColor=#E9EEF3;strokeColor=#5B6670;fontStyle=1;")
        for ln in lay["raias"]:
            pg.vertice(ln["nome"], ln["x"], ln["y"], ln["w"], ln["h"],
                       "swimlane;horizontal=0;startSize=30;html=1;fillColor=#F7F9FB;swimlaneFillColor=#FFFFFF;strokeColor=#9AA5B1;fontStyle=0;")
        cel = {}
        for k, n in lay["nos"].items():
            ps = lay["pos"][k]
            st = status_no(fl, n)
            c = COR_STATUS[st]
            t = n.get("tipo")
            base = f"fillColor={c['fill']};strokeColor={c['stroke']};fontColor={c['text']};"
            if st == "hipotese":
                base += "dashed=1;dashPattern=6 4;"
            fora = ("verticalLabelPosition=bottom;verticalAlign=top;labelPosition=center;align=center;" if ps.get("rotulo_lado") == "baixo"
                    else "verticalLabelPosition=top;verticalAlign=bottom;labelPosition=center;align=center;")
            if t == "inicio":
                est = "ellipse;html=1;aspect=fixed;" + base + fora
            elif t == "fim":
                est = "ellipse;html=1;aspect=fixed;strokeWidth=3;" + base + fora
            elif t == "espera":
                est = "ellipse;shape=doubleEllipse;html=1;aspect=fixed;" + base + fora
            elif t in GATEWAYS:
                est = "rhombus;html=1;" + base + fora
            elif t == "subprocesso":
                est = "rounded=1;whiteSpace=wrap;html=1;arcSize=12;strokeWidth=2;" + base
            else:
                est = "rounded=1;whiteSpace=wrap;html=1;arcSize=12;" + base
            rotulo = n.get("nome", "")
            if t == "paralelo":
                rotulo = n.get("nome") or ""
            if t == "subprocesso":
                rotulo = f"{rotulo} [+]"
            link = pag_fluxo.get(n.get("processo")) if t == "subprocesso" else None
            cel[k] = pg.vertice(rotulo, ps["x"], ps["y"], ps["w"], ps["h"], est, link=link, cid=f"{pg.pid}-n-{slug(k)}")
        for a in lay["arestas"]:
            pg.aresta(cel[a["de"]], cel[a["para"]], a["rotulo"],
                      "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;html=1;endArrow=block;endFill=1;strokeColor=#3F4650;",
                      pontos=a["pts"][1:-1])
        for m in lay["mensagens"]:
            de = cel.get(m["de"]) or f"{pg.pid}-x-{slug(m['de'])}"
            para = cel.get(m["para"]) or f"{pg.pid}-x-{slug(m['para'])}"
            pg.aresta(de, para, m["rotulo"], "html=1;dashed=1;endArrow=open;startArrow=oval;startFill=0;strokeColor=#5B6670;")
        paginas.append(pg)

    return ('<mxfile host="mapear-processos" type="device">' + "".join(pg.xml() for pg in paginas) + "</mxfile>\n")


# --------------------------------------------------------------------------
# Miro (Canvas Composer SVG)
# --------------------------------------------------------------------------


def miro_card_style(st):
    c = MIRO_STATUS[st]
    dash = ' stroke-dasharray="5,5"' if st == "hipotese" else ""
    return f'fill="{c["fill"]}" stroke="{c["stroke"]}" stroke-width="2"{dash} data-text-color="{c["text"]}" data-font-family="noto_sans"'


def gerar_miro(mapa, codigos, lacunas, cobertura):
    """Devolve lista de (nome_arquivo, svg). Cada SVG é um módulo independente,
    com coordenadas absolutas que não se sobrepõem, pronto para canvas_create_from_svg."""
    procs, filhos = arvore(mapa)
    raizes = filhos.get(None, [])
    org = mapa.get("organizacao", {}).get("nome", "Organização")
    arquivos = []

    # 1. Cadeia de valor
    CW, CHh, GAP = 300, 110, 32
    maior = max([len([r for r in raizes if r.get("tipo") == t]) for t in TIPOS_PROCESSO + (None,)] + [1])
    fw = 64 + 220 + maior * (CW + GAP) + 32
    bandas = [t for t in ("gestao", "finalistico", "suporte", None) if any(r.get("tipo") == t for r in raizes)]
    fh1 = 64 + 130 + max(1, len(bandas)) * (CHh + 64 + 32) + 32
    s = [f'<svg xmlns="http://www.w3.org/2000/svg">',
         f'<g id="f_cadeia" transform="translate(0,0)" data-frame="Cadeia de valor">',
         f'<rect data-type="frame" x="0" y="0" width="{fw}" height="{fh1}" fill="#ffffff" />',
         f'<text x="64" y="131" font-family="noto_sans" font-size="67" font-weight="bold" fill="#1a1a1a">{xesc(org)}: cadeia de valor</text>']
    y = 194
    conectores, cartoes = [], []
    for t in bandas:
        grupo = [r for r in raizes if r.get("tipo") == t]
        s.append(f'<rect x="64" y="{y}" width="{fw - 128}" height="{CHh + 64}" fill="#f7f7f7" stroke="none" '
                 f'data-content="&lt;b&gt;{xesc(TIPO_ROTULO[t])}&lt;/b&gt;" data-text-align="left" data-text-align-vertical="middle" '
                 f'data-font-size="33" data-font-family="noto_sans" data-text-color="#1a1a1a" />')
        x = 64 + 220
        for i, r in enumerate(grupo):
            st = r.get("status", "hipotese")
            cid = f"c_{mm_id(r['id'])}"
            rot = f"&lt;b&gt;{xesc(codigos[r['id']])} {xesc(r.get('nome', ''))}&lt;/b&gt;&lt;br&gt;{xesc(STATUS_ROTULO[st])}"
            cartoes.append(f'<rect id="{cid}" x="{x}" y="{y + 32}" width="{CW}" height="{CHh}" rx="12" {miro_card_style(st)} '
                           f'data-content="{rot}" data-font-size="22" />')
            if t == "finalistico" and i > 0:
                ant = f"c_{mm_id(grupo[i - 1]['id'])}"
                conectores.append(f'<line x1="{x - GAP}" y1="{y + 32 + CHh // 2}" x2="{x}" y2="{y + 32 + CHh // 2}" stroke="#313131" '
                                  f'stroke-width="2" data-arrow="end" data-shape="straight" data-start="{ant}" data-end="{cid}" '
                                  f'data-start-side="right" data-end-side="left" />')
            x += CW + GAP
        y += CHh + 64 + 32
    s += conectores + cartoes
    s.append("</g></svg>")
    arquivos.append(("01-cadeia-de-valor.svg", "\n".join(s)))

    # 2. Legenda e situação
    lx = fw + 320
    top = [l for l in lacunas if not l.get("pergunta")][:12]
    linhas = "".join(f"• {xesc(l['mensagem'])}<br/>" for l in top) or "Nenhuma lacuna sem pergunta."
    s = ['<svg xmlns="http://www.w3.org/2000/svg">',
         f'<g id="f_legenda" transform="translate({lx},0)" data-frame="Como ler e o que falta">',
         f'<rect data-type="frame" x="0" y="0" width="1200" height="{max(fh1, 900)}" fill="#ffffff" />',
         '<text x="64" y="131" font-family="noto_sans" font-size="67" font-weight="bold" fill="#1a1a1a">Como ler este quadro</text>']
    yy = 194
    for st in ("confirmado", "declarado", "hipotese", "contestado"):
        expl = {
            "confirmado": "validado pelo responsável ou por duas fontes independentes",
            "declarado": "alguém da empresa ou um documento afirmou",
            "hipotese": "suposição ainda não confirmada; existe pergunta pendente",
            "contestado": "fontes discordam; aguardando resolução",
        }[st]
        s.append(f'<rect x="64" y="{yy}" width="220" height="64" rx="12" {miro_card_style(st)} data-content="&lt;b&gt;{STATUS_ROTULO[st]}&lt;/b&gt;" data-font-size="22" />')
        s.append(f'<textArea x="310" y="{yy + 16}" width="820" font-family="noto_sans" font-size="22" fill="#595959">{xesc(expl)}</textArea>')
        yy += 84
    s.append(f'<textArea x="64" y="{yy + 20}" width="1070" font-family="noto_sans" font-size="22" fill="#595959">'
             f'<b>Completude: {cobertura["completude"]}% · Validação: {cobertura["validacao"]}% · '
             f'Perguntas pendentes: {cobertura["perguntas_pendentes"]} · Contradições abertas: {cobertura["contradicoes_abertas"]}</b><br/><br/>'
             f'<b>Lacunas ainda sem pergunta</b><br/>{linhas}</textArea>')
    s.append("</g></svg>")
    arquivos.append(("02-legenda.svg", "\n".join(s)))

    # 3. Hierarquia
    CW, CH, GX, GY = 340, 72, 120, 20
    cursor = [0]
    posh = {}

    def colocar(p, prof):
        kids = filhos.get(p["id"], [])
        if not kids:
            yy = cursor[0]
            cursor[0] += CH + GY
        else:
            ys = [colocar(k, prof + 1) for k in kids]
            yy = (ys[0] + ys[-1]) / 2
        posh[p["id"]] = (prof * (CW + GX), yy)
        return yy

    ultimo = "_"
    for r in raizes:
        if r.get("tipo") != ultimo and ultimo != "_":
            cursor[0] += 64
        ultimo = r.get("tipo")
        colocar(r, 0)
    prof_max = max([x for x, _ in posh.values()] + [0])
    hw = 64 + prof_max + CW + 64
    hh = 64 + 130 + cursor[0] + 64
    hy = fh1 + 320
    s = ['<svg xmlns="http://www.w3.org/2000/svg">',
         f'<g id="f_hier" transform="translate(0,{hy})" data-frame="Hierarquia de processos">',
         f'<rect data-type="frame" x="0" y="0" width="{max(hw, 1200)}" height="{hh}" fill="#ffffff" />',
         '<text x="64" y="131" font-family="noto_sans" font-size="67" font-weight="bold" fill="#1a1a1a">Hierarquia de processos</text>']
    linhas_c, cart = [], []
    for p in procs.values():
        if p["id"] not in posh:
            continue
        x, yy = posh[p["id"]]
        x, yy = 64 + x, 194 + yy
        st = p.get("status", "hipotese")
        cid = f"h_{mm_id(p['id'])}"
        dono = nome_papel(mapa, p.get("dono")) if p.get("dono") else "dono a definir"
        rot = f"&lt;b&gt;{xesc(codigos[p['id']])} {xesc(p.get('nome', ''))}&lt;/b&gt;&lt;br&gt;{xesc(dono)}"
        cart.append(f'<rect id="{cid}" x="{round(x)}" y="{round(yy)}" width="{CW}" height="{CH}" rx="12" {miro_card_style(st)} '
                    f'data-content="{rot}" data-font-size="18" data-text-align="left" />')
        if p.get("pai") in posh:
            px_, py_ = posh[p["pai"]]
            x1, y1 = 64 + px_ + CW, 194 + py_ + CH / 2
            x2, y2 = x, yy + CH / 2
            linhas_c.append(f'<line x1="{round(x1)}" y1="{round(y1)}" x2="{round(x2)}" y2="{round(y2)}" stroke="#313131" stroke-width="2" data-shape="elbowed" '
                            f'data-start="h_{mm_id(p["pai"])}" data-end="{cid}" data-start-side="right" data-end-side="left" />')
    s += linhas_c + cart
    s.append("</g></svg>")
    arquivos.append(("03-hierarquia.svg", "\n".join(s)))

    # 4. Um quadro por fluxo, com o diagrama Mermaid nativo do Miro
    fy = hy + hh + 320
    fx = 0
    col = 0
    altura_linha = 0
    for p in procs.values():
        if not p.get("fluxo"):
            continue
        lay = layout_fluxo(mapa, p)
        n_raias = len(lay["raias"])
        porrank = defaultdict(int)
        for k in lay["nos"]:
            porrank[lay["rank"][k]] += 1
        dw = 260 * (lay["max_rank"] + 1) + 200 * n_raias
        dh = 200 * max(porrank.values() or [1]) + 200 * n_raias
        fwid, fhei = dw + 128, dh + 64 + 194
        corpo = mermaid_fluxo(mapa, p, codigos[p["id"]])
        corpo = corpo.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        titulo = f"{codigos[p['id']]} {p.get('nome', '')}"
        s = ['<svg xmlns="http://www.w3.org/2000/svg">',
             f'<g id="f_{mm_id(p["id"])}" transform="translate({fx},{fy})" data-frame="{xesc(titulo)}">',
             f'<rect data-type="frame" x="0" y="0" width="{fwid}" height="{fhei}" fill="#ffffff" />',
             f'<text x="64" y="131" font-family="noto_sans" font-size="67" font-weight="bold" fill="#1a1a1a">{xesc(titulo)}</text>',
             f'<foreignObject x="64" y="194" width="1600" height="900" data-type="diagram" data-title="{xesc(titulo)}">',
             corpo, '</foreignObject>', '</g></svg>']
        arquivos.append((f"10-fluxo-{slug(codigos[p['id']] + '-' + p.get('nome', ''))}.svg", "\n".join(s)))
        altura_linha = max(altura_linha, fhei)
        col += 1
        if col == 2:
            col, fx, fy = 0, 0, fy + altura_linha + 320
            altura_linha = 0
        else:
            fx = fwid + 320
    return arquivos


# --------------------------------------------------------------------------
# Relatório
# --------------------------------------------------------------------------


def nome_pessoa(mapa, pid):
    for pe in mapa.get("pessoas", []):
        if pe["id"] == pid:
            return pe.get("nome", pid)
    return pid


def gerar_relatorio(mapa, codigos, lacunas, cobertura, problemas):
    org = mapa.get("organizacao", {})
    L = [f"# Mapeamento de processos: {org.get('nome', '')}", "",
         f"Atualizado em {org.get('atualizado_em', hoje())}.", "",
         "## Situação", "",
         f"- Completude (informação mínima levantada): **{cobertura['completude']}%**",
         f"- Validação (elementos confirmados): **{cobertura['validacao']}%** ({cobertura['confirmados']} de {cobertura['elementos']})",
         f"- Hipóteses ainda não confirmadas: {cobertura['hipoteses']}",
         f"- Perguntas pendentes: {cobertura['perguntas_pendentes']} · Contradições abertas: {cobertura['contradicoes_abertas']}",
         f"- Modelo de negócio: {len(cobertura['temas_negocio_ok'])} de {cobertura['temas_negocio_total']} temas com informação", "",
         "## Processos por nível", "",
         "| Nível | Processos | Confirmados | Declarados | Hipóteses | Contestados | Campos preenchidos | Folhas com fluxo |",
         "|---|---|---|---|---|---|---|---|"]
    niveis = mapa.get("organizacao", {}).get("niveis") or NIVEIS_PADRAO
    for nv, d in cobertura["por_nivel"].items():
        nome_nv = niveis[int(nv)] if int(nv) < len(niveis) else f"Nível {nv}"
        L.append(f"| {nv} ({nome_nv}) | {d['total']} | {d['status'].get('confirmado', 0)} | {d['status'].get('declarado', 0)} | "
                 f"{d['status'].get('hipotese', 0)} | {d['status'].get('contestado', 0)} | {d['campos_ok']}/{d['campos_total']} | "
                 f"{d['folhas_com_fluxo']}/{d['folhas']} |")
    L += ["", "## Lacunas por pessoa sugerida", ""]
    grupos = defaultdict(list)
    for l in lacunas:
        chave = ", ".join(nome_pessoa(mapa, x) for x in l["sugerido_para"]) or "Responsável ainda não identificado"
        grupos[chave].append(l)
    for quem, ls in grupos.items():
        L.append(f"### {quem}")
        for l in ls[:40]:
            marca = f" (pergunta {l['pergunta']} pendente)" if l.get("pergunta") else ""
            L.append(f"- {l['mensagem']}{marca}")
        if len(ls) > 40:
            L.append(f"- e mais {len(ls) - 40} lacunas")
        L.append("")
    cts = [c for c in mapa.get("contradicoes", []) if c.get("status", "aberta") == "aberta"]
    if cts:
        L += ["## Contradições abertas", ""]
        for c in cts:
            L.append(f"- **{c['id']}**: {c.get('descricao', '')} (evidências: {', '.join(c.get('evidencias', []))})")
        L.append("")
    erros = [p for p in problemas if p["nivel"] == "erro"]
    alertas = [p for p in problemas if p["nivel"] == "alerta"]
    L += ["## Conferência lógica", "", f"{len(erros)} erros e {len(alertas)} alertas.", ""]
    for p in erros + alertas[:60]:
        L.append(f"- [{p['codigo']}] {p['elemento']}: {p['mensagem']}")
    ideias = mapa.get("ideias", [])
    if ideias:
        L += ["", "## Ideias de melhoria anotadas (fora do mapa atual)", ""]
        for i in ideias:
            L.append(f"- {i.get('texto', '')}" + (f" ({codigos.get(i.get('processo'), '')})" if i.get("processo") else ""))
    return "\n".join(L) + "\n"


# --------------------------------------------------------------------------
# Formulários
# --------------------------------------------------------------------------


def perguntas_do_formulario(mapa, fo):
    idx = indice(mapa)
    out = []
    for qid in fo.get("perguntas", []):
        item = idx.get(qid)
        if item and item[0] == "perguntas":
            out.append(item[1])
    return out


def itens_formulario(mapa, fo):
    """Lista linear de itens (id, titulo, tipo, opcoes, ajuda, obrigatorio, bloco).
    Perguntas de confirmação viram 'Frase N' com opções fixas; cada bloco com frases
    ganha, ao final, um campo único para correções."""
    itens = []
    com_ident = fo.get("identificacao", fo.get("canal") != "entrevista")
    if com_ident:
        for k, t in IDENT.items():
            itens.append({"id": f"_{k}", "titulo": t, "tipo": "curta", "opcoes": [], "ajuda": "", "obrigatorio": k in ("nome", "funcao"), "bloco": "Sobre você"})
    titulos = set()
    perguntas = perguntas_do_formulario(mapa, fo)
    conf_por_bloco = defaultdict(int)
    for q in perguntas:
        if q.get("tipo") == "confirmacao":
            conf_por_bloco[q.get("bloco", "")] += 1
    n_frase, n_corr = 0, 0
    pend_corr = []

    def fecha_correcoes(bloco):
        nonlocal n_corr, pend_corr
        if pend_corr:
            n_corr += 1
            titulo_c = (f"Alguma frase deste bloco ({bloco or 'acima'}) está errada ou incompleta? Diga o número da frase ou do passo e como é na prática."
                        if len(pend_corr) > 1 else "Se a frase acima não está correta, como é na prática?")
            itens.append({"id": f"_corr_{n_corr}", "titulo": titulo_c,
                          "tipo": "aberta", "opcoes": [], "ajuda": "", "obrigatorio": False, "bloco": bloco, "alvos": list(pend_corr)})
            pend_corr = []

    bloco_ant = None
    for q in perguntas:
        bloco = q.get("bloco", "")
        if bloco != bloco_ant:
            fecha_correcoes(bloco_ant or "")
            bloco_ant = bloco
        titulo = q.get("texto", "").strip()
        tipo = q.get("tipo", "aberta")
        if tipo == "confirmacao" and q.get("numerar", True) and conf_por_bloco[bloco] > 1:
            n_frase += 1
            titulo = f"Frase {n_frase}: {titulo}"
        base, n = titulo, 2
        while norm(titulo) in titulos:
            titulo = f"{base} ({n})"
            n += 1
        titulos.add(norm(titulo))
        opcoes = list(q.get("opcoes") or [])
        if tipo == "confirmacao":
            itens.append({"id": q["id"], "titulo": titulo, "tipo": "escolha", "confirmacao": True,
                          "opcoes": ["Sim, está correto", "Está parcialmente correto", "Não está correto", NAO_SEI],
                          "ajuda": q.get("ajuda", ""), "obrigatorio": False, "bloco": bloco})
            pend_corr.append(q["id"])
            continue
        if tipo in ("escolha", "multipla") and NAO_SEI not in opcoes:
            opcoes.append(NAO_SEI)
        itens.append({"id": q["id"], "titulo": titulo, "tipo": tipo, "opcoes": opcoes, "ajuda": q.get("ajuda", ""),
                      "obrigatorio": bool(q.get("obrigatoria")), "bloco": bloco})
    fecha_correcoes(bloco_ant or "")
    if not com_ident:
        return itens
    for k, t in FECHO.items():
        itens.append({"id": f"_{k}", "titulo": t, "tipo": "aberta", "opcoes": [], "ajuda": "", "obrigatorio": False, "bloco": "Para fechar"})
    return itens


def js_str(s):
    return json.dumps(str(s or ""), ensure_ascii=False)


def gerar_apps_script(mapa, fo, itens):
    org = mapa.get("organizacao", {}).get("nome", "")
    titulo = fo.get("titulo") or f"Mapeamento de processos: {org}"
    intro = fo.get("introducao") or (
        f"Estamos desenhando o mapa de como o trabalho acontece na {org}. Não existe resposta certa ou errada, e ninguém será avaliado "
        "pelas respostas: descreva como funciona hoje, na prática, mesmo que seja diferente do ideal. Se alguma pergunta não for do seu dia a dia, "
        f"marque '{NAO_SEI}' ou deixe em branco e indique quem saberia.")
    L = ["/**",
         " * Cria o formulário no Google Forms e a planilha de respostas.",
         " * Como usar: abra https://script.google.com, crie um projeto novo, cole este código,",
         " * salve e clique em Executar (função criarFormulario). Autorize quando o Google pedir.",
         " * Ao terminar, abra 'Registro de execução' e copie o link para enviar.",
         f" * Gerado por mapear-processos para o formulário {fo['id']}.",
         " */",
         "function criarFormulario() {",
         f"  var form = FormApp.create({js_str(titulo)});",
         f"  form.setDescription({js_str(intro)});",
         "  form.setProgressBar(true);",
         "  form.setAllowResponseEdits(true);",
         "  form.setConfirmationMessage('Obrigado! Suas respostas vão direto para o mapa de processos.');",
         "  var item;"]
    bloco_atual = None
    for it in itens:
        if it["bloco"] and it["bloco"] != bloco_atual:
            if bloco_atual is not None:
                L.append(f"  form.addPageBreakItem().setTitle({js_str(it['bloco'])});")
            else:
                L.append(f"  form.addSectionHeaderItem().setTitle({js_str(it['bloco'])});")
            bloco_atual = it["bloco"]
        t = it["tipo"]
        if t == "curta":
            L.append("  item = form.addTextItem();")
        elif t in ("aberta", "lista"):
            L.append("  item = form.addParagraphTextItem();")
        elif t == "escolha":
            L.append("  item = form.addMultipleChoiceItem();")
            L.append(f"  item.setChoiceValues({json.dumps(it['opcoes'], ensure_ascii=False)});")
            if not it.get("confirmacao"):
                L.append("  item.showOtherOption(true);")
        elif t == "multipla":
            L.append("  item = form.addCheckboxItem();")
            L.append(f"  item.setChoiceValues({json.dumps(it['opcoes'], ensure_ascii=False)});")
            L.append("  item.showOtherOption(true);")
        elif t == "escala":
            L.append("  item = form.addScaleItem().setBounds(1, 5).setLabels('Muito baixo', 'Muito alto');")
        else:
            L.append("  item = form.addParagraphTextItem();")
        ajuda = it["ajuda"]
        if t == "lista" and not ajuda:
            ajuda = "Um item por linha."
        L.append(f"  item.setTitle({js_str(it['titulo'])});")
        if ajuda:
            L.append(f"  item.setHelpText({js_str(ajuda)});")
        if it["obrigatorio"]:
            L.append("  item.setRequired(true);")
    L += [f"  var planilha = SpreadsheetApp.create({js_str(titulo + ' (respostas)')});",
          "  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());",
          "  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}",
          "  Logger.log('Link para enviar aos respondentes: ' + form.getPublishedUrl());",
          "  Logger.log('Link para editar o formulário: ' + form.getEditUrl());",
          "  Logger.log('Planilha de respostas: ' + planilha.getUrl());",
          "}", ""]
    return "\n".join(L)


def gerar_formulario_md(mapa, fo, itens):
    org = mapa.get("organizacao", {}).get("nome", "")
    L = [f"# {fo.get('titulo') or 'Mapeamento de processos: ' + org}", ""]
    L.append(fo.get("introducao") or (
        f"Estamos desenhando o mapa de como o trabalho acontece na {org}. Não existe resposta certa ou errada, e ninguém será "
        "avaliado pelas respostas: descreva como funciona hoje, na prática. Se algo não for do seu dia a dia, diga quem saberia responder."))
    L.append("")
    bloco = None
    n = 0
    for it in itens:
        if it["bloco"] and it["bloco"] != bloco:
            L += [f"## {it['bloco']}", ""]
            bloco = it["bloco"]
        n += 1
        L.append(f"**{n}. {it['titulo']}**" + (" *(obrigatória)*" if it["obrigatorio"] else ""))
        if it["ajuda"]:
            L.append(f"_{it['ajuda']}_")
        if it["opcoes"]:
            marca = "[ ]" if it["tipo"] == "multipla" else "( )"
            if it["tipo"] == "multipla":
                L.append("_Pode marcar mais de uma._")
            for o in it["opcoes"]:
                L.append(f"- {marca} {o}")
        elif it["tipo"] == "escala":
            L.append("- 1 (muito baixo) · 2 · 3 · 4 · 5 (muito alto)")
        else:
            L.append("")
            L.append("> ")
        L.append("")
    return "\n".join(L)


def gerar_formulario_html(mapa, fo, itens):
    modelo = ASSETS / "formulario.html"
    if not modelo.exists():
        return None
    dados = {
        "formulario": fo["id"], "titulo": fo.get("titulo") or "Mapeamento de processos",
        "organizacao": mapa.get("organizacao", {}).get("nome", ""),
        "introducao": fo.get("introducao") or "",
        "itens": itens, "nao_sei": NAO_SEI,
    }
    js = json.dumps(dados, ensure_ascii=False).replace("</", "<\\/")
    return modelo.read_text(encoding="utf-8").replace("__FORMULARIO__", js)


# --------------------------------------------------------------------------
# Ingestão de respostas
# --------------------------------------------------------------------------


def pode_validar(mapa, alvos, pessoa):
    """Quem valida: o dono (papel) do processo do alvo; para fatos e contexto, o patrocinador ou a liderança."""
    papeis = set(pessoa.get("papeis") or [])
    procs = {p["id"]: p for p in mapa.get("processos", [])}
    org = mapa.get("organizacao", {})
    for a in alvos:
        base = str(a).split(".")[0]
        if base in procs:
            if not (procs[base].get("dono") and procs[base]["dono"] in papeis):
                return False
        elif pessoa.get("id") != org.get("patrocinador") and pessoa.get("perfil") != "lideranca":
            return False
    return bool(alvos)


def achar_pessoa(mapa, nome, email=None):
    """Casa o respondente com uma pessoa já cadastrada: e-mail, nome igual, ou mesmo primeiro nome quando um nome contém o outro e só há um candidato."""
    pessoas = mapa.get("pessoas", [])
    if email:
        for pe in pessoas:
            if pe.get("contato") and norm(pe["contato"]) == norm(email):
                return pe
    n = norm(nome)
    for pe in pessoas:
        if norm(pe.get("nome")) == n:
            return pe
    toks = n.split()
    if not toks:
        return None
    cand = []
    for pe in pessoas:
        t2 = norm(pe.get("nome")).split()
        if t2 and t2[0] == toks[0] and (set(t2) <= set(toks) or set(toks) <= set(t2)):
            cand.append(pe)
    return cand[0] if len(cand) == 1 else None


def ler_respostas(caminho):
    caminho = Path(caminho)
    texto = caminho.read_text(encoding="utf-8-sig")
    if caminho.suffix.lower() == ".json":
        dados = json.loads(texto)
        linhas = []

        def achar(o):
            if isinstance(o, dict):
                if "respostas" in o and isinstance(o["respostas"], dict):
                    linhas.append(o)
                else:
                    for v in o.values():
                        achar(v)
            elif isinstance(o, list):
                for v in o:
                    achar(v)

        achar(dados)
        return "json", linhas
    try:
        dialeto = csv.Sniffer().sniff(texto[:4096], delimiters=",;\t")
    except csv.Error:
        dialeto = csv.excel
    return "csv", list(csv.DictReader(io.StringIO(texto), dialect=dialeto))


def ingerir(mapa, fo_id, caminho):
    fo = next((f for f in mapa.get("formularios", []) if f["id"] == fo_id), None)
    if not fo:
        sys.exit(f"Formulário {fo_id} não existe no mapa.")
    itens = itens_formulario(mapa, fo)
    por_titulo = {norm(it["titulo"]): it for it in itens}
    formato, linhas = ler_respostas(caminho)
    idx = indice(mapa)
    novas_ev, novas_pe = 0, 0
    resumo = defaultdict(list)
    avisos, indicacoes, respondentes = [], [], []
    existentes = {(e.get("pessoa"), e.get("local"), norm(e.get("trecho", ""))) for e in mapa.get("evidencias", [])}

    for linha in linhas:
        if formato == "json":
            resp = dict(linha.get("respostas") or {})
            for k in IDENT:
                if linha.get(k):
                    resp[f"_{k}"] = linha[k]
            for k in FECHO:
                if linha.get(k):
                    resp[f"_{k}"] = linha[k]
            for k, v in linha.items():
                if str(k).startswith("corr_") and v:
                    resp[f"_{k}"] = v
            data = str(linha.get("enviado_em") or hoje())[:10]
        else:
            resp, data = {}, hoje()
            for col, val in linha.items():
                if col is None:
                    continue
                n = norm(col)
                if n in ("carimbo de data hora", "timestamp", "data hora", "carimbo de data e hora"):
                    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", str(val or ""))
                    data = f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}" if m else str(val or "")[:10] or hoje()
                    continue
                if n in ("endereco de e mail", "email address", "e mail"):
                    resp["_email"] = val
                    continue
                it = por_titulo.get(n)
                if not it:
                    cand = [v for k, v in por_titulo.items() if n.startswith(k[:60]) or k.startswith(n[:60])]
                    it = cand[0] if len(cand) == 1 else None
                if it:
                    resp[it["id"]] = val
        nome = str(resp.get("_nome") or "").strip()
        if not nome:
            nome = "Respondente sem nome"
        pessoa = achar_pessoa(mapa, nome, resp.get("_email"))
        if pessoa and norm(pessoa.get("nome")) != norm(nome):
            avisos.append(f"Associei o respondente '{nome}' a {pessoa['id']} ({pessoa.get('nome')}). Confira; se for outra pessoa, corrija as evidências.")
            if len(norm(nome)) > len(norm(pessoa.get("nome", ""))):
                pessoa["nome"] = nome
        if not pessoa:
            pid = proximos_ids(mapa, "PE")[0]
            pessoa = {"id": pid, "nome": nome, "cargo": resp.get("_funcao", ""), "area_texto": resp.get("_area", ""),
                      "contato": resp.get("_email", ""), "papeis": [], "sabe_sobre": [], "origem": fo_id}
            mapa["pessoas"].append(pessoa)
            novas_pe += 1
        else:
            if resp.get("_funcao") and not pessoa.get("cargo"):
                pessoa["cargo"] = resp["_funcao"]
            if resp.get("_email") and not pessoa.get("contato"):
                pessoa["contato"] = resp["_email"]
        respondentes.append(pessoa["id"])
        for chave, val in resp.items():
            if chave in ("_nome", "_funcao", "_area", "_email"):
                continue
            if isinstance(val, list):
                val = "; ".join(str(v) for v in val)
            val = str(val or "").strip()
            if not val:
                continue
            qid = chave.split("#")[0]
            local = f"{fo_id}/{chave}"
            k = (pessoa["id"], local, norm(val))
            if k in existentes:
                continue
            existentes.add(k)
            eid = proximos_ids(mapa, "EV")[0]
            q = idx.get(qid)
            tipo_ev = "formulario"
            if chave == "_indicacoes":
                indicacoes.append((pessoa.get("nome"), pessoa["id"], val))
            if q and q[0] == "perguntas" and q[1].get("tipo") == "confirmacao" and "#" not in chave and norm(val).startswith("sim"):
                tipo_ev = "validacao" if pode_validar(mapa, q[1].get("alvo") or [], pessoa) else "formulario"
                val = f"{q[1].get('texto', '')} -> {val}"
            mapa["evidencias"].append({"id": eid, "tipo": tipo_ev, "fonte": f"{fo_id}: {fo.get('titulo', '')}",
                                       "pessoa": pessoa["id"], "data": data, "trecho": val, "local": local})
            novas_ev += 1
            if q and q[0] == "perguntas":
                q[1].setdefault("respostas", []).append(eid)
                if norm(val) != norm(NAO_SEI):
                    rp = q[1].setdefault("respondida_por", [])
                    if pessoa["id"] not in rp:
                        rp.append(pessoa["id"])
                    faltam = [x for x in (q[1].get("para") or []) if x not in rp]
                    q[1]["status"] = "respondida" if not faltam else q[1].get("status", "em_formulario")
            resumo[chave].append((pessoa.get("nome"), val, eid, tipo_ev))
    fo.setdefault("respostas_recebidas", 0)
    fo["respostas_recebidas"] = fo["respostas_recebidas"] + len(linhas)
    rp = fo.setdefault("respondido_por", [])
    for pid in respondentes:
        if pid not in rp:
            rp.append(pid)
    faltam_fo = [x for x in (fo.get("para") or []) if x not in rp]
    if linhas and fo.get("status") in (None, "rascunho", "enviado"):
        fo["status"] = "respondido" if not faltam_fo else "enviado"
    mapa["historico"].append({"data": hoje(), "evento": f"Ingeridas {len(linhas)} respostas do {fo_id} ({novas_ev} evidências, {novas_pe} pessoas novas)"})
    return resumo, len(linhas), novas_ev, novas_pe, itens, avisos, indicacoes


# --------------------------------------------------------------------------
# Mapa interativo (HTML)
# --------------------------------------------------------------------------


def dados_para_html(mapa, codigos, lacunas, cobertura, problemas, bpmns, extras=None):
    procs, filhos = arvore(mapa)
    nv = {p["id"]: nivel_real(procs, p) for p in procs.values()}
    dados = {
        "gerado_em": hoje(),
        "versao": VERSAO,
        "mapa": mapa,
        "codigos": codigos,
        "niveis": nv,
        "tipos": {p["id"]: tipo_de(procs, p) for p in procs.values()},
        "cobertura": cobertura,
        "lacunas": lacunas,
        "problemas": problemas,
        "bpmn": bpmns,
    }
    dados.update(extras or {})
    return dados


ESQUELETO = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n{corpo}\n</body>\n</html>\n')


def gerar_html(mapa, codigos, lacunas, cobertura, problemas, bpmns, extras=None, completo=True):
    """completo=True gera um documento HTML inteiro (abrir no navegador);
    completo=False gera só o conteúdo, no formato que o Artifact publica."""
    modelo = ASSETS / "explorador.html"
    if not modelo.exists():
        sys.exit(f"Modelo do mapa interativo não encontrado em {modelo}")
    dados = dados_para_html(mapa, codigos, lacunas, cobertura, problemas, bpmns, extras)
    js = json.dumps(dados, ensure_ascii=False).replace("</", "<\\/")
    org = mapa.get("organizacao", {}).get("nome", "Organização")
    css_bpmn = ""
    arq_css = ASSETS / "bpmn-viewer.css"
    if arq_css.exists():
        css_bpmn = arq_css.read_text(encoding="utf-8")
    html = modelo.read_text(encoding="utf-8")
    html = html.replace("__TITULO__", xesc(f"Processos {org}")[:80]).replace("/*__BPMN_CSS__*/", css_bpmn).replace("__DADOS__", js)
    return ESQUELETO.format(corpo=html) if completo else html


# --------------------------------------------------------------------------
# Comandos
# --------------------------------------------------------------------------


def cmd_iniciar(a):
    pasta = Path(a.pasta)
    if arq_mapa(pasta).exists() and not a.forcar:
        sys.exit(f"Já existe {arq_mapa(pasta)}. Use --forcar para recomeçar (o arquivo atual será sobrescrito).")
    pasta.mkdir(parents=True, exist_ok=True)
    for sub in ("fontes", "formularios", "respostas", "saidas"):
        (pasta / sub).mkdir(exist_ok=True)
    mapa = OrderedDict()
    mapa["schema"] = SCHEMA_ID
    mapa["organizacao"] = {
        "nome": a.empresa, "slug": slug(a.empresa), "descricao": "", "setor": "", "objetivo_do_mapeamento": "",
        "escopo": {"inclui": [], "exclui": []}, "patrocinador": None, "consultor": a.consultor or "",
        "niveis": NIVEIS_PADRAO, "criado_em": hoje(), "atualizado_em": hoje(),
    }
    mapa["configuracao"] = {}
    mapa["modelo_operacional"] = {"integracao": None, "padronizacao": None, "tipo": None, "justificativa": "", "status": "hipotese", "evidencias": []}
    for c in COLECOES:
        mapa[c] = []
    mapa["historico"] = [{"data": hoje(), "evento": "Mapeamento iniciado"}]
    gravar_json(arq_mapa(pasta), mapa)
    print(f"Mapeamento criado em {pasta.resolve()}")
    print("Próximo passo: registrar escopo, patrocinador e documentos disponíveis (rodada 0).")


def cmd_validar(a):
    mapa = carregar(a.pasta)
    probs = validar(mapa)
    if a.json:
        print(json.dumps(probs, ensure_ascii=False, indent=2))
        return
    erros = [p for p in probs if p["nivel"] == "erro"]
    alertas = [p for p in probs if p["nivel"] == "alerta"]
    print(f"{len(erros)} erros, {len(alertas)} alertas")
    for p in erros + alertas:
        print(f"  [{p['codigo']}] {p['elemento']}: {p['mensagem']}")
    if erros:
        sys.exit(1)


def cmd_status(a):
    mapa = carregar(a.pasta)
    cob = calcular_cobertura(mapa)
    lac = calcular_lacunas(mapa)
    probs = validar(mapa)
    if a.json:
        print(json.dumps({"cobertura": cob, "lacunas": lac, "problemas": probs}, ensure_ascii=False, indent=2))
        return
    org = mapa.get("organizacao", {})
    print(f"# {org.get('nome')}  (atualizado em {org.get('atualizado_em')})")
    print(f"Completude {cob['completude']}% · Validação {cob['validacao']}% · {cob['processos']} processos · "
          f"{cob['hipoteses']} hipóteses · {cob['perguntas_pendentes']} perguntas e {cob['frases_pendentes']} frases de confirmação pendentes · "
          f"{cob['contradicoes_abertas']} contradições abertas")
    print(f"Modelo de negócio: {len(cob['temas_negocio_ok'])}/{cob['temas_negocio_total']} temas"
          + (f" · {cob['decisoes_provisorias']} decisões provisórias a confirmar" if cob["decisoes_provisorias"] else "")
          + (f" · {cob['no_papel']} processos ainda só no papel ou em implantação" if cob["no_papel"] else ""))
    for nv, d in cob["por_nivel"].items():
        print(f"  Nível {nv}: {d['total']} processos | conf {d['status']['confirmado']} decl {d['status']['declarado']} "
              f"hip {d['status']['hipotese']} cont {d['status']['contestado']} | campos {d['campos_ok']}/{d['campos_total']} | "
              f"folhas com fluxo {d['folhas_com_fluxo']}/{d['folhas']}")
    erros = [p for p in probs if p["nivel"] == "erro"]
    print(f"Conferência lógica: {len(erros)} erros, {len(probs) - len(erros)} alertas (detalhes: mapa.py validar)")
    sem = [l for l in lac if not l.get("pergunta")]
    com = [l for l in lac if l.get("pergunta")]
    print(f"\nLacunas: {len(lac)} ({len(sem)} sem pergunta, {len(com)} já com pergunta pendente)")
    grupos = defaultdict(list)
    for l in sem:
        grupos[tuple(l["sugerido_para"])].append(l)
    for quem, ls in list(grupos.items())[:12]:
        nomes = ", ".join(f"{nome_pessoa(mapa, x)} ({x})" for x in quem) or "responsável ainda não identificado"
        print(f"\n  Para {nomes}:")
        for l in ls[:a.max]:
            print(f"    - [{l['elemento']}{'.' + l['campo'] if l['campo'] else ''}] {l['mensagem']}")
        if len(ls) > a.max:
            print(f"    - e mais {len(ls) - a.max}")
    pend = [f for f in mapa.get("formularios", []) if f.get("status") == "enviado"]
    if pend:
        print("\nFormulários enviados aguardando resposta: " + ", ".join(f"{f['id']} ({f.get('titulo', '')})" for f in pend))


def cmd_lacunas(a):
    mapa = carregar(a.pasta)
    lac = calcular_lacunas(mapa)
    if a.sem_pergunta:
        lac = [l for l in lac if not l.get("pergunta")]
    if a.para:
        lac = [l for l in lac if a.para in l["sugerido_para"]]
    if a.json:
        print(json.dumps(lac, ensure_ascii=False, indent=2))
        return
    for l in lac:
        quem = ", ".join(nome_pessoa(mapa, x) for x in l["sugerido_para"]) or "?"
        q = f" | pergunta {l['pergunta']}" if l.get("pergunta") else ""
        print(f"[{l['peso']}] {l['elemento']}{'.' + l['campo'] if l['campo'] else ''} | {l['mensagem']} | para: {quem}{q}")


def cmd_id(a):
    mapa = carregar(a.pasta)
    print("\n".join(proximos_ids(mapa, a.prefixo, a.n)))


def cmd_evidencia(a):
    mapa = carregar(a.pasta)
    if a.tipo not in TIPOS_EVIDENCIA:
        sys.exit(f"Tipo inválido. Use um destes: {', '.join(TIPOS_EVIDENCIA)}")
    eid = proximos_ids(mapa, "EV")[0]
    ev = {"id": eid, "tipo": a.tipo, "fonte": a.fonte, "pessoa": a.pessoa, "data": a.data or hoje(),
          "trecho": a.trecho or "", "local": a.local or ""}
    mapa["evidencias"].append(ev)
    salvar(a.pasta, mapa)
    print(eid)


def cmd_formulario(a):
    mapa = carregar(a.pasta)
    fo = next((f for f in mapa.get("formularios", []) if f["id"] == a.formulario), None)
    if not fo:
        sys.exit(f"Formulário {a.formulario} não existe em mapa.json. Crie-o na coleção 'formularios' primeiro.")
    itens = itens_formulario(mapa, fo)
    destino = Path(a.pasta) / "formularios" / fo["id"]
    destino.mkdir(parents=True, exist_ok=True)
    (destino / "google-forms.gs").write_text(gerar_apps_script(mapa, fo, itens), encoding="utf-8")
    (destino / "formulario.md").write_text(gerar_formulario_md(mapa, fo, itens), encoding="utf-8")
    html = gerar_formulario_html(mapa, fo, itens)
    if html:
        (destino / "formulario.artifact.html").write_text(html, encoding="utf-8")
    gravar_json(destino / "itens.json", itens)
    for q in perguntas_do_formulario(mapa, fo):
        if q.get("status") in (None, "aberta"):
            q["status"] = "em_formulario"
            q["formulario"] = fo["id"]
    salvar(a.pasta, mapa)
    n_q = len([i for i in itens if not i["id"].startswith("_")])
    n_conf = len([i for i in itens if i.get("confirmacao")])
    n_outras = n_q - n_conf
    n_abertas = len([i for i in itens if not i["id"].startswith("_") and i["tipo"] == "aberta"])
    print(f"Formulário {fo['id']} gerado em {destino} ({n_outras} perguntas e {n_conf} frases de confirmação, além de identificação e fecho)")
    if n_outras > 12 or n_conf > 25 or n_abertas > 4:
        print(f"  ATENÇÃO: acima do recomendado (até 12 perguntas, das quais até 4 do tipo 'aberta', e até 25 frases). "
              f"Agora: {n_outras} perguntas, {n_abertas} abertas, {n_conf} frases. Use 'curta' ou 'lista' para respostas curtas, ou divida em dois formulários.")
    print(f"  google-forms.gs  : cole em script.google.com e execute criarFormulario")
    print(f"  formulario.md    : versão em texto (documento, e-mail, WhatsApp ou roteiro de entrevista)")
    if html:
        print(f"  formulario.artifact.html : página de formulário para publicar como artifact (respostas gravadas no banco do artifact)")


def cmd_ingerir(a):
    mapa = carregar(a.pasta)
    resumo, n, nev, npe, itens, avisos, indicacoes = ingerir(mapa, a.formulario, a.arquivo)
    salvar(a.pasta, mapa)
    titulos = {it["id"]: it["titulo"] for it in itens}
    idx = indice(mapa)
    print(f"{n} respostas lidas, {nev} evidências novas, {npe} pessoas novas.\n")
    for av in avisos:
        print(f"Aviso: {av}")
    if indicacoes:
        print("\nIndicações recebidas (cadastre em pessoas, com indicado_por; o script não cadastra sozinho):")
        for quem, pid, txt in indicacoes:
            print(f"  - {quem} ({pid}) indicou: {txt}")
    fo_atual = next((f for f in mapa.get("formularios", []) if f["id"] == a.formulario), {})
    pend = [q for q in mapa.get("perguntas", []) if q["id"] in (fo_atual.get("perguntas") or []) and q.get("status") != "respondida" and q.get("para")]
    faltam_fo = [nome_pessoa(mapa, x) for x in (fo_atual.get("para") or []) if x not in (fo_atual.get("respondido_por") or [])]
    if faltam_fo:
        print(f"O formulário {a.formulario} continua aguardando: {', '.join(faltam_fo)}")
    for q in pend:
        faltam = [nome_pessoa(mapa, x) for x in q["para"] if x not in (q.get("respondida_por") or [])]
        if faltam and q.get("respondida_por"):
            print(f"Pergunta {q['id']} ainda aguarda: {', '.join(faltam)}")
    print()
    print("Respostas por pergunta (interprete, atualize o mapa e ligue cada fato à evidência indicada):")
    for chave, lst in resumo.items():
        qid = chave.split("#")[0]
        alvo = ""
        if qid in idx and idx[qid][0] == "perguntas":
            alvo = ", ".join(idx[qid][1].get("alvo") or [])
        elif chave.startswith("_corr_"):
            it_c = next((it for it in itens if it["id"] == chave), {})
            alvo = "correções de " + ", ".join(it_c.get("alvos", []))
        print(f"\n## {chave}  {titulos.get(chave, '')}" + (f"  [alvo: {alvo}]" if alvo else ""))
        tipo_q = idx[qid][1].get("tipo") if qid in idx and idx[qid][0] == "perguntas" else ""
        for nome, val, eid, tipo_ev in lst:
            marca = ""
            if tipo_q == "confirmacao":
                if tipo_ev == "validacao":
                    marca = "[VALIDOU] "
                elif norm(val.split("->")[-1]).startswith("sim"):
                    marca = "[CONFIRMOU, MAS NÃO É O DONO: conta como uma fonte] "
                else:
                    marca = "[NÃO CONFIRMOU: ver correções] "
            print(f"  - {marca}{nome} ({eid}): {val}")


def cmd_responder(a):
    """Registra a resposta a uma pergunta que veio por texto, conversa ou entrevista."""
    mapa = carregar(a.pasta)
    q = next((x for x in mapa.get("perguntas", []) if x["id"] == a.pergunta), None)
    if not q:
        sys.exit(f"Pergunta {a.pergunta} não existe.")
    pessoa = next((pe for pe in mapa.get("pessoas", []) if pe["id"] == a.pessoa), None)
    if not pessoa:
        sys.exit(f"Pessoa {a.pessoa} não existe; cadastre em pessoas primeiro.")
    tipo = a.tipo
    if tipo == "validacao" and not pode_validar(mapa, q.get("alvo") or [], pessoa):
        print("Aviso: essa pessoa não é dona do processo; registrando como entrevista (conta como uma fonte).")
        tipo = "entrevista"
    eid = proximos_ids(mapa, "EV")[0]
    mapa["evidencias"].append({"id": eid, "tipo": tipo, "fonte": a.fonte or (f"{q.get('formulario')}" if q.get("formulario") else "conversa"),
                               "pessoa": pessoa["id"], "data": a.data or hoje(), "trecho": a.texto, "local": f"{q.get('formulario') or 'conversa'}/{q['id']}"})
    q.setdefault("respostas", []).append(eid)
    rp = q.setdefault("respondida_por", [])
    if pessoa["id"] not in rp:
        rp.append(pessoa["id"])
    faltam = [x for x in (q.get("para") or []) if x not in rp]
    if not faltam:
        q["status"] = "respondida"
    salvar(a.pasta, mapa)
    print(f"{eid} registrada para {q['id']} (alvo: {', '.join(q.get('alvo') or [])})" + (f"; ainda aguarda {', '.join(faltam)}" if faltam else "; pergunta respondida"))


def cmd_frases(a):
    mapa = carregar(a.pasta)
    proc = next((p for p in mapa.get("processos", []) if p["id"] == a.processo), None)
    if not proc or not proc.get("fluxo"):
        sys.exit(f"{a.processo} não existe ou não tem fluxo.")
    for txt, _ in frases_fluxo(mapa, proc):
        print(txt)


def cmd_validacao(a):
    """Cria perguntas de confirmação (Sim / Parcialmente / Não) a partir do que já foi declarado sobre um processo."""
    mapa = carregar(a.pasta)
    procs = {p["id"]: p for p in mapa.get("processos", [])}
    codigos = calcular_codigos(mapa)
    alvo_ids = a.processos.split(",")
    para = [x for x in (a.para or "").split(",") if x]
    novas = []
    for pid in alvo_ids:
        p = procs.get(pid)
        if not p:
            sys.exit(f"Processo {pid} não existe.")
        bloco = p.get("nome", "")
        bloco_fl = f"{bloco}: passo a passo"
        afirm = []
        if a.so_fluxo:
            pass
        elif p.get("descricao"):
            afirm.append(("descricao", f"\"{p['nome']}\" serve para: {p['descricao']}"))
        if p.get("dono") and not a.so_fluxo:
            afirm.append(("dono", f"Quem responde pelo resultado de \"{p['nome']}\" é: {nome_papel(mapa, p['dono'])}."))
        if p.get("gatilho") and not a.so_fluxo:
            afirm.append(("gatilho", f"\"{p['nome']}\" começa quando: {p['gatilho']}."))
        if p.get("saidas") and not a.so_fluxo:
            txt = "; ".join((s_.get("nome", "") + (f" (para {s_['para'][4:] if str(s_.get('para', '')).startswith('EXT:') else procs.get(s_.get('para'), {}).get('nome', s_.get('para', ''))})" if s_.get("para") else "")) if isinstance(s_, dict) else str(s_) for s_ in p["saidas"])
            afirm.append(("saidas", f"\"{p['nome']}\" entrega: {txt}."))
        if p.get("cliente") and not a.so_fluxo:
            afirm.append(("cliente", f"Quem recebe o resultado de \"{p['nome']}\" é: {p['cliente']}."))
        if p.get("fluxo") and not a.sem_fluxo:
            raias = set(x for x in (a.raias or "").split(",") if x)
            nos_fl = {n["id"]: n for n in p["fluxo"].get("nos", [])}
            for txt, nid in frases_fluxo(mapa, p):
                n = nos_fl.get(nid, {})
                if raias and (n.get("tipo") in ("inicio", "fim") or n.get("raia") not in raias):
                    continue
                afirm.append(("fluxo", txt))
        ids = proximos_ids(mapa, "Q", len(afirm))
        for qid, (campo, texto) in zip(ids, afirm):
            q = {"id": qid, "texto": texto, "tipo": "confirmacao", "alvo": [f"{pid}.{campo}"], "para": para,
                 "rodada": a.rodada, "status": "aberta", "bloco": bloco_fl if campo == "fluxo" else bloco}
            if campo == "fluxo":
                q["numerar"] = False
            mapa["perguntas"].append(q)
            novas.append(q)
    if a.formulario:
        fo = next((f for f in mapa["formularios"] if f["id"] == a.formulario), None)
        if not fo:
            fo = {"id": a.formulario, "titulo": a.titulo or "Confirme se o mapa está certo", "rodada": a.rodada, "para": para,
                  "canal": "google_forms", "perguntas": [], "status": "rascunho",
                  "introducao": "Estas frases descrevem como entendemos o seu trabalho. Marque se cada uma está correta e, se não estiver, conte como é na prática."}
            mapa["formularios"].append(fo)
        fo["perguntas"] += [q["id"] for q in novas]
    salvar(a.pasta, mapa)
    print(f"{len(novas)} perguntas de confirmação criadas" + (f" no formulário {a.formulario}" if a.formulario else "") + ":")
    for q in novas:
        print(f"  {q['id']} [{q['alvo'][0]}] {q['texto']}")


def cmd_renderizar(a):
    pasta = Path(a.pasta)
    mapa = carregar(pasta)
    formatos = set((a.formatos or "html,bpmn,drawio,mermaid,miro,relatorio").split(","))
    codigos = calcular_codigos(mapa)
    lac = calcular_lacunas(mapa)
    cob = calcular_cobertura(mapa)
    probs = validar(mapa)
    saida = pasta / "saidas"
    saida.mkdir(exist_ok=True)
    procs = {p["id"]: p for p in mapa.get("processos", [])}
    bpmns = {}
    for p in procs.values():
        if p.get("fluxo") and p["fluxo"].get("nos"):
            bpmns[p["id"]] = gerar_bpmn(mapa, p, codigos[p["id"]])
    feito = []
    if "bpmn" in formatos and bpmns:
        d = saida / "bpmn"
        if d.exists():
            shutil.rmtree(d)
        d.mkdir()
        for pid, xml in bpmns.items():
            nomef = f"{slug(codigos[pid])}-{slug(procs[pid].get('nome', ''))}.bpmn"
            (d / nomef).write_text(xml, encoding="utf-8")
        feito.append(f"bpmn/ ({len(bpmns)} arquivos .bpmn: abrem em bpmn.io, Camunda Modeler, Bizagi)")
    if "mermaid" in formatos:
        d = saida / "mermaid"
        if d.exists():
            shutil.rmtree(d)
        d.mkdir()
        (d / "hierarquia.mmd").write_text(mermaid_hierarquia(mapa, codigos), encoding="utf-8")
        (d / "cadeia-de-valor.mmd").write_text(mermaid_cadeia(mapa, codigos), encoding="utf-8")
        for pid in bpmns:
            (d / f"fluxo-{slug(codigos[pid])}-{slug(procs[pid].get('nome', ''))}.mmd").write_text(
                mermaid_fluxo(mapa, procs[pid], codigos[pid]), encoding="utf-8")
        feito.append("mermaid/ (texto Mermaid: Notion, GitHub, Obsidian, draw.io, mermaid.live)")
    if "drawio" in formatos:
        (saida / "mapa.drawio").write_text(gerar_drawio(mapa, codigos), encoding="utf-8")
        feito.append("mapa.drawio (abre em app.diagrams.net; uma página por visão, com links entre elas)")
    if "miro" in formatos:
        d = saida / "miro"
        if d.exists():
            shutil.rmtree(d)
        d.mkdir()
        arqs = gerar_miro(mapa, codigos, lac, cob)
        for nomef, svg in arqs:
            (d / nomef).write_text(svg, encoding="utf-8")
        feito.append(f"miro/ ({len(arqs)} módulos SVG para canvas_create_from_svg, um por chamada)")
    if "relatorio" in formatos:
        (saida / "relatorio.md").write_text(gerar_relatorio(mapa, codigos, lac, cob, probs), encoding="utf-8")
        feito.append("relatorio.md (situação, lacunas por pessoa, contradições, conferência lógica)")
    if "html" in formatos:
        extras = {
            "drawio": gerar_drawio(mapa, codigos),
            "mermaid": dict([("hierarquia.mmd", mermaid_hierarquia(mapa, codigos)), ("cadeia-de-valor.mmd", mermaid_cadeia(mapa, codigos))] +
                            [(f"fluxo-{slug(codigos[pid])}-{slug(procs[pid].get('nome', ''))}.mmd", mermaid_fluxo(mapa, procs[pid], codigos[pid])) for pid in bpmns]),
        }
        (saida / "mapa-interativo.html").write_text(gerar_html(mapa, codigos, lac, cob, probs, bpmns, extras, True), encoding="utf-8")
        (saida / "mapa-interativo.artifact.html").write_text(gerar_html(mapa, codigos, lac, cob, probs, bpmns, extras, False), encoding="utf-8")
        feito.append("mapa-interativo.html (abre em qualquer navegador) e mapa-interativo.artifact.html (versão para publicar como artifact)")
    print(f"Saídas em {saida.resolve()}:")
    for f_ in feito:
        print(f"  - {f_}")
    erros = [p for p in probs if p["nivel"] == "erro"]
    if erros:
        print(f"\nAtenção: {len(erros)} erros na conferência lógica (rode mapa.py validar). As saídas foram geradas mesmo assim.")


def cmd_exemplo(a):
    origem = SKILL_DIR / "exemplos" / "exemplo-mapa.json"
    pasta = Path(a.pasta)
    pasta.mkdir(parents=True, exist_ok=True)
    for sub in ("fontes", "formularios", "respostas", "saidas"):
        (pasta / sub).mkdir(exist_ok=True)
    shutil.copy(origem, arq_mapa(pasta))
    print(f"Exemplo copiado para {arq_mapa(pasta)}")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="mapa.py", description="Apoio ao mapeamento de arquitetura de processos.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("iniciar", help="cria a pasta e o mapa.json vazio")
    s.add_argument("pasta")
    s.add_argument("--empresa", required=True)
    s.add_argument("--consultor")
    s.add_argument("--forcar", action="store_true")
    s.set_defaults(f=cmd_iniciar)

    s = sub.add_parser("validar", help="confere a consistência lógica")
    s.add_argument("pasta")
    s.add_argument("--json", action="store_true")
    s.set_defaults(f=cmd_validar)

    s = sub.add_parser("status", help="cobertura, lacunas por pessoa e pendências")
    s.add_argument("pasta")
    s.add_argument("--json", action="store_true")
    s.add_argument("--max", type=int, default=8)
    s.set_defaults(f=cmd_status)

    s = sub.add_parser("lacunas", help="lista as lacunas em ordem de prioridade")
    s.add_argument("pasta")
    s.add_argument("--json", action="store_true")
    s.add_argument("--para", help="filtra por pessoa (id PE-xx)")
    s.add_argument("--sem-pergunta", action="store_true", dest="sem_pergunta")
    s.set_defaults(f=cmd_lacunas)

    s = sub.add_parser("id", help="próximos ids livres para um prefixo (P, EV, Q, FO, PA...)")
    s.add_argument("pasta")
    s.add_argument("prefixo")
    s.add_argument("--n", type=int, default=1)
    s.set_defaults(f=cmd_id)

    s = sub.add_parser("evidencia", help="registra uma evidência e devolve o id")
    s.add_argument("pasta")
    s.add_argument("--tipo", required=True)
    s.add_argument("--fonte", required=True)
    s.add_argument("--pessoa")
    s.add_argument("--trecho")
    s.add_argument("--local")
    s.add_argument("--data")
    s.set_defaults(f=cmd_evidencia)

    s = sub.add_parser("formulario", help="gera Google Forms (Apps Script), texto e página HTML de um formulário")
    s.add_argument("pasta")
    s.add_argument("formulario")
    s.set_defaults(f=cmd_formulario)

    s = sub.add_parser("ingerir", help="lê respostas (CSV do Google Forms ou JSON do artifact) e cria evidências")
    s.add_argument("pasta")
    s.add_argument("formulario")
    s.add_argument("arquivo")
    s.set_defaults(f=cmd_ingerir)

    s = sub.add_parser("responder", help="registra a resposta a uma pergunta que veio por texto, conversa ou entrevista")
    s.add_argument("pasta")
    s.add_argument("pergunta", help="id da pergunta (Q-xxxx)")
    s.add_argument("--pessoa", required=True, help="quem respondeu (PE-xx)")
    s.add_argument("--texto", required=True, help="a resposta, literal")
    s.add_argument("--tipo", default="entrevista", choices=["entrevista", "formulario", "documento", "workshop", "validacao"])
    s.add_argument("--fonte")
    s.add_argument("--data")
    s.set_defaults(f=cmd_responder)

    s = sub.add_parser("frases", help="lê o fluxo de um processo em frases numeradas")
    s.add_argument("pasta")
    s.add_argument("processo")
    s.set_defaults(f=cmd_frases)

    s = sub.add_parser("validacao", help="cria perguntas de confirmação a partir do que foi declarado sobre processos")
    s.add_argument("pasta")
    s.add_argument("processos", help="ids separados por vírgula (ex.: P-05,P-06)")
    s.add_argument("--para", help="pessoas que validam (ex.: PE-02,PE-03)")
    s.add_argument("--rodada", type=int, default=4)
    s.add_argument("--formulario", help="id do formulário onde incluir as perguntas (cria se não existir, com canal google_forms)")
    s.add_argument("--titulo")
    s.add_argument("--sem-fluxo", action="store_true", dest="sem_fluxo", help="só a visão geral (propósito, dono, gatilho, entregas, cliente)")
    s.add_argument("--so-fluxo", action="store_true", dest="so_fluxo", help="só os passos (para quem executa e não é dono)")
    s.add_argument("--raias", help="só os passos destes papéis (ex.: PA-03,PA-05), para quem executa uma parte do fluxo")
    s.set_defaults(f=cmd_validacao)

    s = sub.add_parser("renderizar", help="gera mapa interativo, BPMN, draw.io, Mermaid, Miro e relatório")
    s.add_argument("pasta")
    s.add_argument("--formatos", help="lista separada por vírgula: html,bpmn,drawio,mermaid,miro,relatorio")
    s.set_defaults(f=cmd_renderizar)

    s = sub.add_parser("exemplo", help="copia um mapa de exemplo (empresa fictícia) para testar as saídas")
    s.add_argument("pasta")
    s.set_defaults(f=cmd_exemplo)

    a = ap.parse_args(argv)
    try:
        a.f(a)
    except BrokenPipeError:
        # saída cortada por um pipe (ex.: | head); o trabalho já foi gravado
        try:
            sys.stdout = open(os.devnull, "w")
        except OSError:
            pass


if __name__ == "__main__":
    main()
