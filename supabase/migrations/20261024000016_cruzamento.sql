-- Portal Wise Partners 2.0: cruzamento de carteiras (História 14, Apêndice I)
-- A lista do parceiro nunca chega a uma tabela: a Edge Function compara em memória e
-- grava aqui só as coincidências (com validade) e os totais por quadrante.

create table public.base_wise_cruzamento (
  id uuid primary key default gen_random_uuid(),
  cnpj_raiz text not null check (cnpj_raiz ~ '^[0-9]{8}$'),
  razao_social text not null,
  tipo text not null check (tipo in ('cliente', 'prospect')),
  empresa_grupo_id uuid not null references public.empresas_grupo(id),
  importado_em timestamptz not null default now(),
  importado_por uuid references public.perfis(id) default auth.uid(),
  unique (cnpj_raiz, empresa_grupo_id)
);
create index on public.base_wise_cruzamento (cnpj_raiz);

create table public.aceites_cruzamento (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id),
  versao_termo int not null,
  aceito_em timestamptz not null default now(),
  usado_em timestamptz
);
create index on public.aceites_cruzamento (parceiro_id, aceito_em desc);

create table public.cruzamentos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  aceite_id uuid not null unique references public.aceites_cruzamento(id),
  executado_em timestamptz not null default now(),
  executado_por uuid references public.perfis(id),
  total_enviado int not null,
  totais jsonb not null default '{}'
);
create index on public.cruzamentos (parceiro_id, executado_em desc);

create table public.coincidencias_cruzamento (
  id uuid primary key default gen_random_uuid(),
  cruzamento_id uuid not null references public.cruzamentos(id) on delete cascade,
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  base_wise_id uuid not null references public.base_wise_cruzamento(id) on delete cascade,
  tipo_parceiro text not null check (tipo_parceiro in ('cliente', 'prospect')),
  quadrante text not null check (quadrante in ('cliente_comum', 'wise_apresenta', 'parceiro_apresenta', 'acao_conjunta')),
  acao_sugerida text not null,
  virou text check (virou in ('indicacao', 'acao')),
  referencia_id uuid,
  descartada boolean not null default false,
  decidido_por uuid references public.perfis(id),
  decidido_em timestamptz,
  observacao text,
  expira_em date not null,
  unique (cruzamento_id, base_wise_id)
);
create index on public.coincidencias_cruzamento (parceiro_id);
create index on public.coincidencias_cruzamento (expira_em);

-- Quadrante pela matriz do Apêndice I
create or replace function public.quadrante_cruzamento(p_tipo_wise text, p_tipo_parceiro text) returns text
language sql immutable as $$
  select case
    when p_tipo_wise = 'cliente' and p_tipo_parceiro = 'cliente' then 'cliente_comum'
    when p_tipo_wise = 'cliente' and p_tipo_parceiro = 'prospect' then 'wise_apresenta'
    when p_tipo_wise = 'prospect' and p_tipo_parceiro = 'cliente' then 'parceiro_apresenta'
    else 'acao_conjunta' end
$$;

create or replace function public.acao_sugerida_quadrante(p_quadrante text) returns text
language sql immutable as $$
  select case p_quadrante
    when 'cliente_comum' then 'Cliente em comum: case conjunto e ação de relacionamento'
    when 'wise_apresenta' then 'A Wise pode apresentar o parceiro (indicação do grupo para o parceiro)'
    when 'parceiro_apresenta' then 'O parceiro pode apresentar a Wise (indicação do parceiro para o grupo)'
    else 'Ação conjunta de marketing ou de venda' end
$$;

-- Situação do cruzamento para um parceiro: pode ou não, motivo e quando poderá de novo
create or replace function public.situacao_cruzamento(p_parceiro uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := coalesce(p_parceiro, public.parceiro_atual());
  p public.parceiros;
  v_ultimo timestamptz;
  v_intervalo int := public.config_int('cruzamento_intervalo_dias', 30);
  v_motivo text;
begin
  if v_id is null then raise exception 'Parceiro não encontrado.' using errcode = 'P0001'; end if;
  if not (public.is_interno_leitura() or v_id = public.parceiro_atual()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select * into p from public.parceiros where id = v_id;
  select max(executado_em) into v_ultimo from public.cruzamentos where parceiro_id = v_id;
  if p.tipo_parceria <> 'comercial' then
    v_motivo := 'O cruzamento de carteiras é só para parceiros comerciais.';
  elsif not public.parceiro_assinado(v_id) then
    v_motivo := 'O cruzamento fica disponível depois da assinatura do contrato.';
  elsif not coalesce(p.aceita_cruzamento_contrato, false) then
    v_motivo := 'O contrato assinado não tem a cláusula de cruzamento (contrato v2 ou aditivo).';
  elsif v_ultimo is not null and v_ultimo::date + v_intervalo > public.hoje() then
    v_motivo := format('Já houve um cruzamento nos últimos %s dias.', v_intervalo);
  end if;
  return jsonb_build_object(
    'pode', v_motivo is null,
    'motivo', v_motivo,
    'ultimo_em', v_ultimo,
    'proximo_em', case when v_ultimo is not null then v_ultimo::date + v_intervalo end,
    'minimo', public.config_int('cruzamento_min_cnpjs', 20),
    'maximo', public.config_int('cruzamento_max_linhas', 5000),
    'versao_termo', public.config_int('termo_cruzamento_versao', 1));
end $$;

-- Aceite do termo, a cada envio (FR-173)
create or replace function public.aceitar_termo_cruzamento() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_parceiro uuid := public.parceiro_atual();
  s jsonb;
  v uuid;
begin
  if v_parceiro is null then raise exception 'Somente o parceiro aceita o termo do cruzamento.' using errcode = '42501'; end if;
  s := public.situacao_cruzamento(v_parceiro);
  if not (s->>'pode')::boolean then raise exception '%', s->>'motivo' using errcode = 'P0001'; end if;
  insert into public.aceites_cruzamento (parceiro_id, perfil_id, versao_termo)
  values (v_parceiro, auth.uid(), public.config_int('termo_cruzamento_versao', 1))
  returning id into v;
  return v;
end $$;

-- Grava coincidências e totais. Só a Edge Function cruzamento-carteiras (service_role) chama.
-- p_coincidencias: [{"base_wise_id": uuid, "tipo_parceiro": "cliente"|"prospect"}]
-- p_totais: {"total_enviado": n}; os totais por quadrante são recalculados aqui.
create or replace function public.registrar_coincidencias(
  p_parceiro uuid, p_aceite uuid, p_coincidencias jsonb, p_totais jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.aceites_cruzamento;
  s jsonb;
  v_total int := coalesce((p_totais->>'total_enviado')::int, 0);
  v_cruz uuid;
  v_ret int := public.config_int('cruzamento_retencao_dias', 180);
  v_totais jsonb;
begin
  select * into a from public.aceites_cruzamento where id = p_aceite for update;
  if a.id is null or a.parceiro_id <> p_parceiro then raise exception 'Aceite do termo não encontrado.' using errcode = 'P0001'; end if;
  if a.usado_em is not null then raise exception 'Este aceite já foi usado. Aceite o termo de novo.' using errcode = 'P0001'; end if;
  if a.aceito_em < now() - interval '1 day' then raise exception 'O aceite expirou. Aceite o termo de novo.' using errcode = 'P0001'; end if;
  if a.versao_termo <> public.config_int('termo_cruzamento_versao', 1) then
    raise exception 'O termo mudou. Aceite a versão atual.' using errcode = 'P0001';
  end if;
  -- Recalcula as condições sem depender de sessão (service_role não tem parceiro atual)
  if not exists (select 1 from public.parceiros p where p.id = p_parceiro and p.tipo_parceria = 'comercial'
                   and coalesce(p.aceita_cruzamento_contrato, false)) or not public.parceiro_assinado(p_parceiro) then
    raise exception 'Parceiro sem direito ao cruzamento.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.cruzamentos c where c.parceiro_id = p_parceiro
               and c.executado_em::date + public.config_int('cruzamento_intervalo_dias', 30) > public.hoje()) then
    raise exception 'Já houve um cruzamento nos últimos % dias.', public.config_int('cruzamento_intervalo_dias', 30) using errcode = 'P0001';
  end if;
  if v_total < public.config_int('cruzamento_min_cnpjs', 20) or v_total > public.config_int('cruzamento_max_linhas', 5000) then
    raise exception 'O envio precisa ter entre % e % CNPJs válidos.',
      public.config_int('cruzamento_min_cnpjs', 20), public.config_int('cruzamento_max_linhas', 5000) using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_coincidencias, '[]')) <> 'array' or jsonb_array_length(coalesce(p_coincidencias, '[]')) > v_total then
    raise exception 'Coincidências inválidas.' using errcode = 'P0001';
  end if;

  insert into public.cruzamentos (parceiro_id, aceite_id, executado_por, total_enviado)
  values (p_parceiro, p_aceite, a.perfil_id, v_total) returning id into v_cruz;

  insert into public.coincidencias_cruzamento (cruzamento_id, parceiro_id, base_wise_id, tipo_parceiro, quadrante, acao_sugerida, expira_em)
  select v_cruz, p_parceiro, b.id, x.tipo_parceiro,
         public.quadrante_cruzamento(b.tipo, x.tipo_parceiro),
         public.acao_sugerida_quadrante(public.quadrante_cruzamento(b.tipo, x.tipo_parceiro)),
         public.hoje() + v_ret
    from jsonb_to_recordset(coalesce(p_coincidencias, '[]')) as x(base_wise_id uuid, tipo_parceiro text)
    join public.base_wise_cruzamento b on b.id = x.base_wise_id
   where x.tipo_parceiro in ('cliente', 'prospect')
  on conflict (cruzamento_id, base_wise_id) do nothing;

  select jsonb_build_object(
      'total_enviado', v_total,
      'coincidencias', count(*),
      'cliente_comum', count(*) filter (where quadrante = 'cliente_comum'),
      'wise_apresenta', count(*) filter (where quadrante = 'wise_apresenta'),
      'parceiro_apresenta', count(*) filter (where quadrante = 'parceiro_apresenta'),
      'acao_conjunta', count(*) filter (where quadrante = 'acao_conjunta'))
    into v_totais
    from public.coincidencias_cruzamento where cruzamento_id = v_cruz;

  update public.cruzamentos set totais = v_totais where id = v_cruz;
  update public.aceites_cruzamento set usado_em = now() where id = p_aceite;

  perform public.notificar_responsavel(p_parceiro, 'cruzamento', 'Cruzamento de carteiras concluído',
    format('%s coincidências para analisar.', v_totais->>'coincidencias'), '/app/cruzamento', jsonb_build_object('cruzamento_id', v_cruz));
  return jsonb_build_object('cruzamento_id', v_cruz, 'totais', v_totais);
end $$;

-- Decisão do time de parcerias sobre uma coincidência
create or replace function public.decidir_coincidencia(p_id uuid, p_virou text, p_referencia uuid default null, p_observacao text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_virou is not null and p_virou not in ('indicacao', 'acao', 'descartar') then
    raise exception 'Decisão inválida.' using errcode = 'P0001';
  end if;
  update public.coincidencias_cruzamento
     set virou = case when p_virou in ('indicacao', 'acao') then p_virou end,
         referencia_id = case when p_virou in ('indicacao', 'acao') then p_referencia end,
         descartada = (p_virou = 'descartar'),
         observacao = coalesce(p_observacao, observacao),
         decidido_por = auth.uid(), decidido_em = now()
   where id = p_id;
  if not found then raise exception 'Coincidência não encontrada.' using errcode = 'P0001'; end if;
end $$;

-- Exclusão sob pedido, imediata (Apêndice I). O parceiro pede pelo portal; parcerias também pode excluir.
create or replace function public.excluir_cruzamentos(p_parceiro uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := coalesce(p_parceiro, public.parceiro_atual());
  n int;
begin
  if v_id is null or not (public.is_parcerias() or v_id = public.parceiro_atual()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  delete from public.coincidencias_cruzamento where parceiro_id = v_id and virou is null;
  get diagnostics n = row_count;
  update public.cruzamentos c set totais = c.totais || jsonb_build_object('excluido_em', now())
   where c.parceiro_id = v_id;
  return n;
end $$;

-- Purga diária: coincidências vencidas que não viraram indicação nem ação
create or replace function public.purgar_cruzamentos() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.coincidencias_cruzamento where expira_em < public.hoje() and virou is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
select public._proteger_tabela(t)
  from unnest(array['base_wise_cruzamento', 'aceites_cruzamento', 'cruzamentos', 'coincidencias_cruzamento']) t;

create policy bwc_ler on public.base_wise_cruzamento for select to authenticated using (public.is_parcerias());
create policy bwc_admin on public.base_wise_cruzamento for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy acr_ler on public.aceites_cruzamento for select to authenticated
  using (public.is_parcerias() or parceiro_id = public.parceiro_atual());

create policy cru_ler on public.cruzamentos for select to authenticated
  using (public.is_parcerias() or parceiro_id = public.parceiro_atual());

create policy coi_ler on public.coincidencias_cruzamento for select to authenticated using (public.is_parcerias());
create policy coi_editar on public.coincidencias_cruzamento for update to authenticated
  using (public.is_parcerias()) with check (public.is_parcerias());
create policy coi_apagar on public.coincidencias_cruzamento for delete to authenticated using (public.is_admin());

revoke execute on function public.registrar_coincidencias(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_coincidencias(uuid, uuid, jsonb, jsonb) to service_role;
revoke execute on function public.purgar_cruzamentos() from public, anon, authenticated;
revoke execute on function public.situacao_cruzamento(uuid) from public, anon;
revoke execute on function public.aceitar_termo_cruzamento() from public, anon;
revoke execute on function public.decidir_coincidencia(uuid, text, uuid, text) from public, anon;
revoke execute on function public.excluir_cruzamentos(uuid) from public, anon;
grant execute on function public.situacao_cruzamento(uuid), public.aceitar_termo_cruzamento(),
  public.decidir_coincidencia(uuid, text, uuid, text), public.excluir_cruzamentos(uuid) to authenticated;
