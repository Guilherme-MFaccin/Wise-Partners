#!/usr/bin/env python3
"""Publica no portal o documento "Modelo de negócio e arquitetura de processos" (tabela documentos_internos).

Gera antes:  python3 mapear-processos/scripts/mapa.py renderizar mapeamentos/wise-partners-to-be
             python3 mapeamentos/wise-partners-to-be/ferramentas/juntar_documento.py
Uso:         SUPABASE_ACCESS_TOKEN=... python3 scripts/publicar-documento.py v12 [--ref eiozuvnzvqlqslihyooz]

Escreve em produção: só rodar com a autorização do responsável pelo portal.
"""
import json, os, secrets, sys, urllib.request

ARQ = os.path.join(os.path.dirname(__file__), "..", "mapeamentos", "wise-partners-to-be", "saidas", "modelo-e-processos.html")

def main():
    if len(sys.argv) < 2:
        sys.exit("Informe a versão, por exemplo: v12")
    versao = sys.argv[1]
    ref = sys.argv[sys.argv.index("--ref") + 1] if "--ref" in sys.argv else os.environ.get("SUPABASE_REF", "eiozuvnzvqlqslihyooz")
    token = os.environ.get("SUPABASE_ACCESS_TOKEN") or sys.exit("Falta SUPABASE_ACCESS_TOKEN no ambiente.")
    html = open(ARQ, encoding="utf-8").read()
    tag = "doc_" + secrets.token_hex(6)
    assert f"${tag}$" not in html
    sql = (f"insert into public.documentos_internos (chave, titulo, versao, html, atualizado_em) values "
           f"('modelo-e-processos', 'Modelo de negócio e arquitetura de processos', '{versao}', ${tag}${html}${tag}$, now()) "
           f"on conflict (chave) do update set titulo = excluded.titulo, versao = excluded.versao, html = excluded.html, atualizado_em = now();")
    req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{ref}/database/query", data=json.dumps({"query": sql}).encode(),
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        print("Publicado:", versao, f"({len(html) // 1024} KB)", r.status)

if __name__ == "__main__":
    main()
