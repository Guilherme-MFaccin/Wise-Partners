-- Documentos internos do programa (19/11/2026): o "Modelo de negócio e arquitetura de processos" do Wise Partners,
-- gerado a partir do mapeamento (mapeamentos/wise-partners-to-be) e publicado pelo script scripts/publicar-documento.py.
-- O documento traz custos, metas e estratégia: só o time interno lê; ninguém escreve pelo app (só a chave de serviço).

create table if not exists public.documentos_internos (
  chave text primary key check (chave ~ '^[a-z0-9-]+$'),
  titulo text not null,
  versao text not null,
  html text not null,
  atualizado_em timestamptz not null default now()
);

alter table public.documentos_internos enable row level security;

create policy doc_interno_leitura on public.documentos_internos for select to authenticated
  using (public.is_interno());

revoke all on public.documentos_internos from public, anon;
grant select on public.documentos_internos to authenticated;
grant all on public.documentos_internos to service_role;
