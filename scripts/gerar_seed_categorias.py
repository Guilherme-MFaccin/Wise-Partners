"""Gera a migração de categorias e campos a partir de specs/001-portal-wise-partners/categorias-campos.md.

Uso: python3 -I scripts/gerar_seed_categorias.py > supabase/migrations/20261023000008_seed_categorias.sql

Campos do perfil comum que já são colunas do parceiro (carteira no ICP, instrumento próprio,
natureza jurídica, perfil, autorização de marca) não viram campos dinâmicos, para que o mesmo
dado não seja mantido em dois lugares (princípio I).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MD = (RAIZ / "specs/001-portal-wise-partners/categorias-campos.md").read_text(encoding="utf-8")

UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
       "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]

CHAVES_COMUM = {
    "O que a empresa faz": "o_que_faz",
    "Diferenciais": "diferenciais",
    "Visão da Wise": "visao_wise",
    "Para quem é indicado": "para_quem",
    "Segmentos atendidos": "segmentos",
    "Porte de cliente atendido": "porte_cliente",
    "Regiões atendidas": "regioes",
    "Atendimento": "atendimento",
    "Cases": "cases",
    "Materiais": "materiais",
    "WhatsApp comercial para clientes": "whatsapp_comercial",
    "E-mail comercial para clientes": "email_comercial",
}
IGNORAR_COMUM = {
    "Clientes no ICP da Wise (estimativa)",   # coluna parceiros.carteira_icp
    "Programa de parceiros próprio",          # parceiros_instrumento
    "Comissão que paga a indicadores",        # parceiros_instrumento (valores de comissão)
    "Exigências do programa deles",           # parceiros_instrumento
}
IGNORAR_INST = {"Natureza jurídica", "Perfil", "Empresas no ICP da Wise (estimativa)", "Autorização formal de uso de marca"}

FAIXAS_PADRAO = {
    "Prazo típico": ["Até 30 dias", "1 a 3 meses", "3 a 6 meses", "Mais de 6 meses"],
    "Ativos suportados": ["Até 100", "101 a 1.000", "Mais de 1.000"],
    "Prazo médio de contratação": ["Até 15 dias", "15 a 30 dias", "30 a 60 dias", "Mais de 60 dias"],
}

TIPOS = {
    "texto curto": "texto_curto", "texto longo": "texto_longo", "número": "numero", "valor em reais": "valor",
    "valor": "valor", "faixa": "faixa", "lista": "lista", "múltipla escolha": "multipla", "sim ou não": "sim_nao",
    "link": "link", "arquivo ou link": "link", "arquivo": "arquivo", "texto": "texto_longo",
}


def slug(t: str) -> str:
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\(.*?\)", "", t)
    t = re.sub(r"[^a-z0-9]+", "_", t).strip("_")
    return t[:48]


def q(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def linhas_tabela(bloco: str):
    for ln in bloco.splitlines():
        ln = ln.strip()
        if not ln.startswith("|") or set(ln) <= {"|", "-", " "}:
            continue
        cols = [c.strip() for c in ln.strip("|").split("|")]
        if cols[0] in ("Campo", "Perfil"):
            continue
        yield cols


def campo(rotulo_bruto: str, tipo_bruto: str, obs: str, porte_opcoes=None):
    uso_rfp = "[RFP]" in rotulo_bruto
    rotulo = rotulo_bruto.replace("**[RFP]**", "").replace("[RFP]", "").strip()
    tipo = TIPOS[tipo_bruto.strip().lower()]
    interno = obs.lower().startswith("interno")
    obrig = "interno e obrigatório" in obs.lower()
    opcoes = []
    observacao = obs or None
    if tipo in ("lista", "multipla", "faixa"):
        if obs.startswith("Estados"):
            opcoes = ["Brasil todo", "Remoto"] + UFS
            observacao = None
        elif obs.startswith("Mesmas faixas do porte"):
            opcoes = list(porte_opcoes or [])
            observacao = None
        elif obs and not interno and not obs.startswith("Lista de") and not obs.startswith("Com regiões") \
                and not obs.startswith("Sobreposição") and not obs.startswith("Usado"):
            opcoes = [o.strip() for o in obs.split(",") if o.strip()]
            observacao = None
        if not opcoes and rotulo in FAIXAS_PADRAO:
            opcoes = FAIXAS_PADRAO[rotulo]
        if not opcoes:
            tipo = "texto_curto"
    if opcoes:
        opcoes = [o[0].upper() + o[1:] for o in opcoes]
    return {
        "rotulo": rotulo, "tipo": tipo, "opcoes": opcoes, "observacao": observacao,
        "uso_rfp": uso_rfp, "interno": interno, "obrigatorio": obrig,
    }


out = ["-- Gerado por scripts/gerar_seed_categorias.py a partir de categorias-campos.md. Editável depois pelo administrador.", ""]

secoes = re.split(r"\n## ", MD)
comum = next(s for s in secoes if s.startswith("1. Perfil comum"))
especificos = next(s for s in secoes if s.startswith("2. Campos específicos"))
institucional = next(s for s in secoes if s.startswith("3. Perfil comum"))

# Perfil comum comercial
porte_opcoes = None
ordem = 0
for cols in linhas_tabela(comum):
    rot = cols[0].replace("**[RFP]**", "").strip()
    if rot in IGNORAR_COMUM:
        continue
    c = campo(cols[0], cols[1], cols[2] if len(cols) > 2 else "")
    if rot == "Porte de cliente atendido":
        porte_opcoes = c["opcoes"]
    chave = CHAVES_COMUM.get(rot, slug(rot))
    parceiro_edita = chave != "visao_wise" and not c["interno"]
    ordem += 10
    out.append(
        "insert into public.campos_categoria (escopo, chave, rotulo, tipo, opcoes, observacao, obrigatorio, uso_rfp, interno, parceiro_edita, ordem) values "
        f"('comum_comercial', {q(chave)}, {q(c['rotulo'])}, {q(c['tipo'])}, {q(c['opcoes'])}, {q(c['observacao'])}, "
        f"{q(c['obrigatorio'])}, {q(c['uso_rfp'])}, {q(c['interno'])}, {q(parceiro_edita)}, {ordem});")

# Categorias comerciais e campos
out.append("")
for bloco in re.split(r"\n### ", especificos)[1:]:
    titulo = bloco.splitlines()[0].strip()
    m = re.match(r"(\d+)\.\s+(.*)", titulo)
    n, nome = int(m.group(1)), m.group(2).strip()
    out.append(f"insert into public.categorias (nome, tipo, ordem) values ({q(nome)}, 'comercial', {n});")
    ordem = 0
    for cols in linhas_tabela(bloco):
        c = campo(cols[0], cols[1], cols[2] if len(cols) > 2 else "", porte_opcoes)
        ordem += 10
        out.append(
            "insert into public.campos_categoria (escopo, categoria_id, chave, rotulo, tipo, opcoes, observacao, obrigatorio, uso_rfp, interno, parceiro_edita, ordem) "
            f"select 'categoria', id, {q(slug(c['rotulo']))}, {q(c['rotulo'])}, {q(c['tipo'])}, {q(c['opcoes'])}, {q(c['observacao'])}, "
            f"{q(c['obrigatorio'])}, {q(c['uso_rfp'])}, {q(c['interno'])}, {q(not c['interno'])}, {ordem} "
            f"from public.categorias where tipo = 'comercial' and nome = {q(nome)};")

# Institucional: perfil comum
out.append("")
partes = institucional.split("**Campos por perfil**")
ordem = 0
for cols in linhas_tabela(partes[0]):
    if cols[0] in IGNORAR_INST:
        continue
    c = campo(cols[0], cols[1], cols[2] if len(cols) > 2 else "")
    if c["rotulo"] == "Regiões":
        c["opcoes"], c["tipo"] = ["Brasil todo", "Remoto"] + UFS, "multipla"
    ordem += 10
    out.append(
        "insert into public.campos_categoria (escopo, chave, rotulo, tipo, opcoes, observacao, obrigatorio, uso_rfp, interno, parceiro_edita, ordem) values "
        f"('comum_institucional', {q(slug(c['rotulo']))}, {q(c['rotulo'])}, {q(c['tipo'])}, {q(c['opcoes'])}, {q(c['observacao'])}, "
        f"false, false, false, true, {ordem});")

# Perfis institucionais, categorias e campos por perfil
PERFIL = {"Ecossistema": "ecossistema", "Convocador": "convocador", "Viveiro": "viveiro", "Vitrine": "vitrine"}
ordem_cat = 100
for cols in linhas_tabela(partes[1]):
    perfil = PERFIL[cols[0]]
    for nome in [x.strip() for x in cols[1].split(";") if x.strip()]:
        ordem_cat += 1
        out.append(f"insert into public.categorias (nome, tipo, perfil_institucional, ordem) values ({q(nome[0].upper() + nome[1:])}, 'institucional', {q(perfil)}, {ordem_cat});")
    ordem = 0
    for item in [x.strip() for x in cols[2].split(";") if x.strip()]:
        m = re.match(r"(.*?)\s*\((.*?)\)$", item)
        rot, tp = m.group(1).strip(), m.group(2).strip()
        rot = rot[0].upper() + rot[1:]
        tipo = TIPOS[tp.lower()]
        if tipo == "multipla":
            tipo = "texto_curto"
        if tipo == "texto_longo":
            tipo = "texto_longo"
        ordem += 10
        out.append(
            "insert into public.campos_categoria (escopo, perfil_institucional, chave, rotulo, tipo, ordem) values "
            f"('perfil', {q(perfil)}, {q(slug(rot))}, {q(rot)}, {q(tipo)}, {ordem});")

sys.stdout.write("\n".join(out) + "\n")
