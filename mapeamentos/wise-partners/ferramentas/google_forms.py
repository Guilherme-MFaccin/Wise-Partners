#!/usr/bin/env python3
"""Cria os formulários do mapeamento no Google Forms e baixa as respostas, pela Forms API.

Faz o mesmo que o google-forms.gs de cada formulário, sem precisar abrir o Apps Script.
Credenciais (segredos do ambiente, nunca no chat nem no repositório):
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
  escopos: forms.body e forms.responses.readonly

Uso:
  python3 google_forms.py criar FO-01 FO-02 ...   cria, publica e grava o link no mapa.json
  python3 google_forms.py criar FO-01 --seco      só mostra o que seria enviado
  python3 google_forms.py respostas FO-01 ...     grava respostas/FO-xx.csv no formato do Google Forms
Depois de baixar: python3 mapa.py ingerir PASTA FO-xx PASTA/respostas/FO-xx.csv
"""
import csv, json, os, sys, urllib.error, urllib.parse, urllib.request
from datetime import datetime
from pathlib import Path

PASTA = Path(__file__).resolve().parent.parent
API = "https://forms.googleapis.com/v1/forms"
CONFIRMACAO = "Obrigado! Suas respostas vão direto para o mapa de processos."


def token():
    faltam = [k for k in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN") if not os.environ.get(k)]
    if faltam:
        sys.exit("Faltam os segredos do ambiente: " + ", ".join(faltam))
    corpo = urllib.parse.urlencode({
        "client_id": os.environ["GOOGLE_CLIENT_ID"], "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_REFRESH_TOKEN"], "grant_type": "refresh_token"}).encode()
    with urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", corpo)) as r:
        return json.load(r)["access_token"]


def chamar(tk, metodo, url, corpo=None):
    req = urllib.request.Request(url, method=metodo, data=json.dumps(corpo).encode() if corpo is not None else None,
                                 headers={"Authorization": f"Bearer {tk}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"{metodo} {url} falhou ({e.code}): {e.read().decode()[:600]}")


def carregar_mapa():
    return json.loads((PASTA / "mapa.json").read_text(encoding="utf-8"))


def salvar(mapa):
    # grava pelo próprio mapa.py da skill (mesmo formato e data de atualização)
    sys.path.insert(0, str(PASTA.parent.parent / ".claude/skills/mapear-processos/scripts"))
    import mapa as M
    M.salvar(PASTA, mapa)


def item_api(it):
    if it["tipo"] == "secao":
        return {"title": it["titulo"], "pageBreakItem": {}}
    q = {"required": bool(it.get("obrigatorio"))}
    if it["tipo"] == "escala":
        q["scaleQuestion"] = {"low": 1, "high": 5}
    elif it.get("opcoes"):
        ops = [{"value": o} for o in it["opcoes"]]
        if it["tipo"] == "escolha":
            ops.append({"isOther": True})
        q["choiceQuestion"] = {"type": "CHECKBOX" if it["tipo"] == "multipla" else "RADIO", "options": ops}
    else:
        q["textQuestion"] = {"paragraph": it["tipo"] in ("aberta", "lista")}
    out = {"title": it["titulo"], "questionItem": {"question": q}}
    if it.get("ajuda"):
        out["description"] = it["ajuda"]
    return out


def pedidos(fo, itens):
    reqs = [{"updateFormInfo": {"info": {"description": fo.get("introducao") or ""}, "updateMask": "description"}}]
    bloco, lista = None, []
    for it in itens:
        if it.get("bloco") and it["bloco"] != bloco:
            bloco = it["bloco"]
            if lista:  # o primeiro bloco vira o título da primeira página, como no Apps Script
                lista.append({"tipo": "secao", "titulo": bloco})
            else:
                lista.append({"tipo": "cabecalho", "titulo": bloco})
        lista.append(it)
    i = 0
    for it in lista:
        if it["tipo"] == "cabecalho":
            item = {"title": it["titulo"], "textItem": {}}
        else:
            item = item_api(it)
        reqs.append({"createItem": {"item": item, "location": {"index": i}}})
        i += 1
    return reqs


def criar(ids, seco):
    mapa = carregar_mapa()
    tk = None if seco else token()
    for fid in ids:
        fo = next(f for f in mapa["formularios"] if f["id"] == fid)
        itens = json.loads((PASTA / "formularios" / fid / "itens.json").read_text(encoding="utf-8"))
        reqs = pedidos(fo, itens)
        if seco:
            print(f"{fid}: {fo['titulo']} | {len(reqs) - 1} itens")
            print(json.dumps(reqs[:3], ensure_ascii=False, indent=1))
            continue
        form = chamar(tk, "POST", API, {"info": {"title": fo["titulo"], "documentTitle": fo["titulo"]}})
        fid_g = form["formId"]
        chamar(tk, "POST", f"{API}/{fid_g}:batchUpdate", {"requests": reqs})
        try:
            chamar(tk, "POST", f"{API}/{fid_g}:setPublishSettings",
                   {"publishSettings": {"publishState": {"isPublished": True, "isAcceptingResponses": True}}, "updateMask": "publishState"})
        except SystemExit as e:
            print(f"  aviso: não consegui publicar pela API ({e}); publique pelo botão Publicar do formulário")
        form = chamar(tk, "GET", f"{API}/{fid_g}")
        fo["link"] = form.get("responderUri", "")
        fo["google_form_id"] = fid_g
        fo["edicao"] = f"https://docs.google.com/forms/d/{fid_g}/edit"
        print(f"{fid}: {fo['titulo']}\n  enviar: {fo['link']}\n  editar: {fo['edicao']}")
    if not seco:
        mapa["historico"].append({"data": datetime.now().strftime("%Y-%m-%d"), "evento": "Formulários criados no Google Forms: " + ", ".join(ids)})
        salvar(mapa)
        print(f"Mensagem de confirmação sugerida (a API não grava): {CONFIRMACAO}")


def respostas(ids):
    mapa = carregar_mapa()
    tk = token()
    for fid in ids:
        fo = next(f for f in mapa["formularios"] if f["id"] == fid)
        g = fo.get("google_form_id") or sys.exit(f"{fid} ainda não foi criado no Google Forms")
        form = chamar(tk, "GET", f"{API}/{g}")
        cols = [(it["questionItem"]["question"]["questionId"], it["title"]) for it in form.get("items", []) if "questionItem" in it]
        linhas, pagina = [], None
        while True:
            r = chamar(tk, "GET", f"{API}/{g}/responses" + (f"?pageToken={pagina}" if pagina else ""))
            linhas += r.get("responses", [])
            pagina = r.get("nextPageToken")
            if not pagina:
                break
        destino = PASTA / "respostas" / f"{fid}.csv"
        destino.parent.mkdir(exist_ok=True)
        with destino.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["Carimbo de data/hora"] + [t for _, t in cols])
            for resp in sorted(linhas, key=lambda x: x.get("lastSubmittedTime", "")):
                quando = datetime.fromisoformat(resp["lastSubmittedTime"].replace("Z", "+00:00")).strftime("%d/%m/%Y %H:%M:%S")
                ans = resp.get("answers", {})
                w.writerow([quando] + [", ".join(a.get("value", "") for a in ans.get(q, {}).get("textAnswers", {}).get("answers", [])) for q, _ in cols])
        print(f"{fid}: {len(linhas)} respostas em {destino}")


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("criar", "respostas"):
        sys.exit(__doc__)
    ids = [a for a in sys.argv[2:] if a.startswith("FO-")]
    criar(ids, "--seco" in sys.argv) if sys.argv[1] == "criar" else respostas(ids)
