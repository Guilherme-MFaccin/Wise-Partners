-- Portal Wise Partners 2.0 (feature 002): custos do canal e esforço por atividade (Histórias 1 e 2)
-- Princípio II: remuneração, custo-hora e custos só para administradores. O custo fica fora de
-- "atividades" (que consultores leem), em tabela própria.

-- Ativa RLS e tira o acesso anônimo de tabelas novas (o laço da 0006 só cobriu as tabelas da v1).
create or replace function public._proteger_tabela(p_tabela text) returns void
language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', p_tabela);
  execute format('revoke all on public.%I from anon', p_tabela);
end $$;

-- ---------------------------------------------------------------------------
-- Correção de segurança da v1: config() é security definer e podia ser chamada por qualquer um
-- ---------------------------------------------------------------------------
create or replace function public.config_int(p_chave text, p_padrao int) returns int
language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((select (valor #>> '{}')::int from public.configuracoes where chave = p_chave), p_padrao);
exception when others then
  return p_padrao;  -- nunca devolve o conteúdo de chaves que não são números
end $$;

create or replace function public.config_num(p_chave text, p_padrao numeric) returns numeric
language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((select (valor #>> '{}')::numeric from public.configuracoes where chave = p_chave), p_padrao);
exception when others then
  return p_padrao;
end $$;

revoke execute on function public.config(text) from public, anon, authenticated;
grant execute on function public.config(text) to service_role;
revoke execute on function public.config_int(text, int) from public, anon;
revoke execute on function public.config_num(text, numeric) from public, anon;
grant execute on function public.config_int(text, int) to authenticated, service_role;
grant execute on function public.config_num(text, numeric) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Catálogo de atividades por esforço (Apêndice N)
-- ---------------------------------------------------------------------------
alter table public.tipos_atividade add column if not exists etapa_jornada text
  check (etapa_jornada in ('captacao', 'onboarding', 'relacionamento', 'ida_mercado', 'gestao'));
alter table public.tipos_atividade add column if not exists chave text;
create unique index if not exists tipos_atividade_chave on public.tipos_atividade (chave) where chave is not null;

alter table public.atividades add column if not exists etapa_jornada text;

-- ---------------------------------------------------------------------------
-- Remuneração de referência e custo-hora
-- ---------------------------------------------------------------------------
create table public.remuneracoes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references public.perfis(id) on delete cascade,
  email text,                                   -- vínculo pelo e-mail enquanto o perfil não existe
  valor_mensal numeric(12,2) not null check (valor_mensal >= 0),
  horas_mensais numeric(6,2) not null default 220 check (horas_mensais > 0),
  fator_encargos numeric(6,3) not null default 1.0 check (fator_encargos > 0),
  vigente_desde date not null,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now(),
  constraint remuneracao_pessoa check (perfil_id is not null or email is not null)
);
create index on public.remuneracoes (perfil_id, vigente_desde desc);

-- Custo-hora vigente na data (sem arredondamento). Nulo quando não informado.
create or replace function public.custo_hora_em(p_perfil uuid, p_data date) returns numeric
language sql stable security definer set search_path = public as $$
  select r.valor_mensal / r.horas_mensais * r.fator_encargos
  from public.remuneracoes r
  left join public.perfis p on p.id = p_perfil
  where (r.perfil_id = p_perfil or (r.perfil_id is null and lower(r.email) = lower(p.email)))
    and r.vigente_desde <= p_data
  order by r.vigente_desde desc, r.created_at desc
  limit 1
$$;

create table public.atividades_custo (
  atividade_id uuid primary key references public.atividades(id) on delete cascade,
  custo_hora numeric,          -- nulo: remuneração não informada
  custo numeric(14,4),
  calculado_em timestamptz not null default now()
);

create or replace function public.trg_atividade_custo() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_ch numeric;
begin
  if new.etapa_jornada is null then
    select etapa_jornada into new.etapa_jornada from public.tipos_atividade where id = new.tipo_atividade_id;
  end if;
  return new;
end $$;

create trigger t_atividade_etapa before insert or update of tipo_atividade_id on public.atividades
for each row execute function public.trg_atividade_custo();

-- Grava o custo da atividade com o custo-hora da época (FR-103)
create or replace function public.trg_atividade_custo_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_ch numeric;
begin
  v_ch := public.custo_hora_em(new.pessoa_id, new.data);
  insert into public.atividades_custo (atividade_id, custo_hora, custo, calculado_em)
  values (new.id, v_ch, case when v_ch is null then null else new.minutos / 60.0 * v_ch end, now())
  on conflict (atividade_id) do update
    set custo_hora = excluded.custo_hora, custo = excluded.custo, calculado_em = now();
  return null;
end $$;

create trigger t_atividade_custo after insert or update of minutos, data, pessoa_id on public.atividades
for each row execute function public.trg_atividade_custo_depois();

-- Quando a remuneração é cadastrada, atividades sem custo daquela pessoa a partir da vigência
-- passam a ter custo (as que já têm custo mantêm o valor da época)
create or replace function public.trg_remuneracao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.perfil_id is null and new.email is not null then
    select id into new.perfil_id from public.perfis where lower(email) = lower(new.email);
  end if;
  return new;
end $$;

create trigger t_remuneracao before insert or update on public.remuneracoes
for each row execute function public.trg_remuneracao();

create or replace function public.trg_remuneracao_depois() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.atividades_custo ac
     set custo_hora = public.custo_hora_em(a.pessoa_id, a.data),
         custo = a.minutos / 60.0 * public.custo_hora_em(a.pessoa_id, a.data), calculado_em = now()
    from public.atividades a
   where a.id = ac.atividade_id and ac.custo_hora is null and a.pessoa_id = new.perfil_id and a.data >= new.vigente_desde;
  return null;
end $$;

create trigger t_remuneracao_depois after insert on public.remuneracoes
for each row execute function public.trg_remuneracao_depois();

-- Perfil criado depois da remuneração (convite): liga pelo e-mail
create or replace function public.trg_perfil_remuneracao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.remuneracoes set perfil_id = new.id where perfil_id is null and lower(email) = lower(new.email);
  return null;
end $$;

create trigger t_perfil_remuneracao after insert on public.perfis
for each row execute function public.trg_perfil_remuneracao();

-- ---------------------------------------------------------------------------
-- Custos diretos (FR-105)
-- ---------------------------------------------------------------------------
create table public.custos_diretos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  categoria text not null check (categoria in ('evento', 'kit_brindes', 'deslocamento', 'impressos', 'ferramentas', 'midia', 'outro')),
  valor numeric(14,2) not null check (valor >= 0),
  descricao text not null,
  parceiro_id uuid references public.parceiros(id) on delete set null,  -- nulo: custo geral do programa
  contrapartida_id uuid references public.contrapartidas(id) on delete set null,
  acao_wise_id uuid,                                                   -- FK na 0014
  comprovante text,                                                    -- bucket "anexos"
  recorrente boolean not null default false,
  recorrente_ate date,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.custos_diretos (data);

-- Lançamentos de custo direto expandidos por mês (recorrentes viram uma linha por mês)
create or replace function public.custos_diretos_expandidos(p_inicio date, p_fim date)
returns table (custo_id uuid, data date, categoria text, valor numeric, descricao text, parceiro_id uuid, acao_wise_id uuid, contrapartida_id uuid)
language sql stable security definer set search_path = public as $$
  select c.id, g::date, c.categoria, c.valor, c.descricao, c.parceiro_id, c.acao_wise_id, c.contrapartida_id
  from public.custos_diretos c
  cross join lateral generate_series(
    c.data::timestamp,
    case when c.recorrente then least(coalesce(c.recorrente_ate, p_fim), p_fim)::timestamp else c.data::timestamp end,
    interval '1 month') g
  where g::date between p_inicio and p_fim
$$;
revoke execute on function public.custos_diretos_expandidos(date, date) from public, anon, authenticated;

create trigger t_hist after insert or update or delete on public.remuneracoes
for each row execute function public.trg_historico('valor_mensal', 'horas_mensais', 'fator_encargos', 'vigente_desde');
create trigger t_hist after insert or update or delete on public.custos_diretos
for each row execute function public.trg_historico('descricao', 'valor', 'categoria', 'data');

select public._proteger_tabela(t) from unnest(array['remuneracoes', 'atividades_custo', 'custos_diretos']) t;

create policy rem_admin on public.remuneracoes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy atvc_admin on public.atividades_custo for select to authenticated using (public.is_admin());
create policy cd_admin on public.custos_diretos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- O histórico de remunerações e custos não pode aparecer ao time de parcerias (hist_ler da v1)
drop policy hist_ler on public.historico;
create policy hist_ler on public.historico for select to authenticated
  using (public.is_parcerias() and (public.is_admin() or tabela not in ('remuneracoes', 'custos_diretos')));
