#!/usr/bin/env python3
"""Gera um único Apps Script que cria todos os formulários de uma rodada e uma planilha de respostas compartilhada.

Uso: python3 gerar_gs_unico.py RODADA FO-01 FO-02 ...  (grava formularios/rodada-RODADA.gs)
A planilha tem uma aba "Links" (lida pelo conector do Google Sheets) e uma aba de respostas por formulário.
"""
import json, sys
from pathlib import Path

PASTA = Path(__file__).resolve().parent.parent
J = lambda s: json.dumps(s, ensure_ascii=False)


def corpo_formulario(fo, itens):
    linhas = [f"  form = FormApp.create({J(fo['titulo'])});"]
    if fo.get("introducao"):
        linhas.append(f"  form.setDescription({J(fo['introducao'])});")
    linhas += ["  form.setProgressBar(true);", "  form.setAllowResponseEdits(true);",
               "  form.setConfirmationMessage('Obrigado! Suas respostas vão direto para o mapa de processos.');"]
    bloco, primeiro = None, True
    for it in itens:
        if it.get("bloco") and it["bloco"] != bloco:
            bloco = it["bloco"]
            linhas.append(f"  form.{'addSectionHeaderItem' if primeiro else 'addPageBreakItem'}().setTitle({J(bloco)});")
            primeiro = False
        t = it["tipo"]
        if t == "escala":
            linhas.append("  item = form.addScaleItem().setBounds(1, 5);")
        elif it.get("opcoes"):
            linhas.append(f"  item = form.{'addCheckboxItem' if t == 'multipla' else 'addMultipleChoiceItem'}();")
            linhas.append(f"  item.setChoiceValues({J(it['opcoes'])});")
            if t == "escolha":
                linhas.append("  item.showOtherOption(true);")
        else:
            linhas.append(f"  item = form.{'addParagraphTextItem' if t in ('aberta', 'lista') else 'addTextItem'}();")
        linhas.append(f"  item.setTitle({J(it['titulo'])});")
        if it.get("ajuda"):
            linhas.append(f"  item.setHelpText({J(it['ajuda'])});")
        if it.get("obrigatorio"):
            linhas.append("  item.setRequired(true);")
    return linhas


def main():
    rodada, ids = sys.argv[1], sys.argv[2:]
    mapa = json.loads((PASTA / "mapa.json").read_text(encoding="utf-8"))
    nome_planilha = f"Mapeamento Wise Partners: respostas da Rodada {rodada}"
    js = [
        "/**",
        f" * Cria os formulários da Rodada {rodada} do mapeamento de processos ({', '.join(ids)})",
        " * e uma planilha com os links e as respostas de todos eles.",
        " * Como usar: cole tudo em https://script.google.com/create, salve e clique em Executar.",
        " * Rodar de novo não duplica nada: só mostra os links de novo.",
        " */",
        "function criarTodos() {",
        "  var props = PropertiesService.getScriptProperties();",
        "  if (props.getProperty('planilha')) {",
        "    Logger.log('Os formulários já foram criados. Planilha: ' + props.getProperty('planilha'));",
        "    return;",
        "  }",
        f"  var planilha = SpreadsheetApp.create({J(nome_planilha)});",
        "  var links = planilha.getSheets()[0].setName('Links');",
        "  links.appendRow(['Formulário', 'Título', 'Link para enviar', 'Link para editar', 'Aba de respostas']);",
        "  var form, item;",
    ]
    for fid in ids:
        fo = next(f for f in mapa["formularios"] if f["id"] == fid)
        itens = json.loads((PASTA / "formularios" / fid / "itens.json").read_text(encoding="utf-8"))
        js.append(f"  // {fid}")
        js += corpo_formulario(fo, itens)
        js.append(f"  registrar(planilha, links, form, {J(fid)});")
    js += [
        "  props.setProperty('planilha', planilha.getUrl());",
        "  Logger.log('Pronto. Planilha com os links e as respostas: ' + planilha.getUrl());",
        "}",
        "",
        "function registrar(planilha, links, form, id) {",
        "  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());",
        "  try { if (typeof form.setPublished === 'function') { form.setPublished(true); } } catch (e) {}",
        "  SpreadsheetApp.flush();",
        "  var aba = '';",
        "  var abas = SpreadsheetApp.openById(planilha.getId()).getSheets();",
        "  for (var i = 0; i < abas.length; i++) {",
        "    var url = abas[i].getFormUrl();",
        "    if (url && url.indexOf(form.getId()) >= 0) { abas[i].setName(id); aba = id; }",
        "  }",
        "  links.appendRow([id, form.getTitle(), form.getPublishedUrl(), form.getEditUrl(), aba]);",
        "  Logger.log(id + ': ' + form.getPublishedUrl());",
        "}",
    ]
    destino = PASTA / "formularios" / f"rodada-{rodada}.gs"
    destino.write_text("\n".join(js) + "\n", encoding="utf-8")
    print(destino, len(js), "linhas")


if __name__ == "__main__":
    main()
