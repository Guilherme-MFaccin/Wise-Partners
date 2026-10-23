-- Portal Wise Partners: base, acesso e configuração do programa
-- Princípio III da constituição: regras do programa são dados configuráveis.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.normalizar_texto(t text) returns text
language sql immutable as $$
  select nullif(regexp_replace(lower(extensions.unaccent(coalesce(t, ''))), '[^a-z0-9]', '', 'g'), '')
$$;

create or replace function public.somente_digitos(t text) returns text
language sql immutable as $$
  select nullif(regexp_replace(coalesce(t, ''), '\D', '', 'g'), '')
$$;

create or replace function public.hoje() returns date
language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- ---------------------------------------------------------------------------
-- Empresas do grupo e perfis de usuário
-- ---------------------------------------------------------------------------
create table public.empresas_grupo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo in ('wise', 'triade', 'swallow')),
  nome text not null,
  base_calculo text not null,
  pct_parceiro numeric(6,3) not null,
  pct_responsavel numeric(6,3) not null,
  site text,
  descricao_institucional text,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null,
  telefone text,
  papel text not null check (papel in ('admin', 'parcerias', 'consultor', 'comercial', 'financeiro', 'parceiro')),
  empresa_grupo_id uuid references public.empresas_grupo(id),
  parceiro_id uuid,                       -- FK adicionada depois de criar parceiros
  is_diretor boolean not null default false,
  is_responsavel_parceiro boolean not null default false,
  ativo boolean not null default true,
  alertas_desativados text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint perfil_parceiro_coerente check (
    (papel = 'parceiro' and parceiro_id is not null and empresa_grupo_id is null)
    or (papel <> 'parceiro' and parceiro_id is null)
  ),
  constraint diretor_interno check (not is_diretor or papel = 'admin')
);
create index on public.perfis (parceiro_id);

-- Convites: o gatilho de criação de usuário do Auth usa esta tabela para criar o perfil.
create table public.convites (
  email text primary key,
  nome text,
  papel text not null check (papel in ('admin', 'parcerias', 'consultor', 'comercial', 'financeiro', 'parceiro')),
  empresa_grupo_id uuid references public.empresas_grupo(id),
  parceiro_id uuid,
  is_diretor boolean not null default false,
  is_responsavel_parceiro boolean not null default false,
  convidado_por uuid references public.perfis(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funções de acesso (usadas pelas políticas de RLS). SECURITY DEFINER para ler
-- perfis sem recursão de RLS. Usuário inativo não tem papel nenhum.
-- ---------------------------------------------------------------------------
create or replace function public.papel_atual() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.perfis where id = auth.uid() and ativo
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin' from public.perfis where id = auth.uid() and ativo), false)
$$;

-- Administradores e time de parcerias: gestão completa e visão de comissões.
create or replace function public.is_parcerias() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel in ('admin', 'parcerias') from public.perfis where id = auth.uid() and ativo), false)
$$;

create or replace function public.pode_ver_comissao() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_parcerias()
$$;

-- Internos que consultam o programa (sem financeiro).
create or replace function public.is_interno_leitura() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel in ('admin', 'parcerias', 'consultor', 'comercial') from public.perfis where id = auth.uid() and ativo), false)
$$;

create or replace function public.is_interno() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel in ('admin', 'parcerias', 'consultor', 'comercial', 'financeiro') from public.perfis where id = auth.uid() and ativo), false)
$$;

create or replace function public.is_consultor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'consultor' from public.perfis where id = auth.uid() and ativo), false)
$$;

create or replace function public.is_financeiro() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'financeiro' from public.perfis where id = auth.uid() and ativo), false)
$$;

create or replace function public.is_diretor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_diretor from public.perfis where id = auth.uid() and ativo), false)
$$;

create or replace function public.parceiro_atual() returns uuid
language sql stable security definer set search_path = public as $$
  select parceiro_id from public.perfis where id = auth.uid() and ativo and papel = 'parceiro'
$$;

create or replace function public.is_responsavel_parceiro() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_responsavel_parceiro from public.perfis where id = auth.uid() and ativo and papel = 'parceiro'), false)
$$;

-- ---------------------------------------------------------------------------
-- Configuração do programa
-- ---------------------------------------------------------------------------
create table public.configuracoes (
  chave text primary key,
  valor jsonb not null,
  descricao text,
  updated_at timestamptz not null default now()
);

create or replace function public.config(p_chave text) returns jsonb
language sql stable security definer set search_path = public as $$
  select valor from public.configuracoes where chave = p_chave
$$;

create or replace function public.config_int(p_chave text, p_padrao int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (valor #>> '{}')::int from public.configuracoes where chave = p_chave), p_padrao)
$$;

create table public.feriados (
  data date primary key,
  nome text not null
);

-- Dias úteis: segunda a sexta, menos feriados cadastrados.
create or replace function public.is_dia_util(d date) returns boolean
language sql stable security definer set search_path = public as $$
  select extract(isodow from d) < 6 and not exists (select 1 from public.feriados f where f.data = d)
$$;

create or replace function public.add_dias_uteis(d date, n int) returns date
language plpgsql stable security definer set search_path = public as $$
declare
  r date := d;
  c int := 0;
begin
  while c < n loop
    r := r + 1;
    if public.is_dia_util(r) then c := c + 1; end if;
  end loop;
  return r;
end $$;

create or replace function public.dias_uteis_entre(d1 date, d2 date) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from generate_series(d1 + 1, d2, interval '1 day') g where public.is_dia_util(g::date)
$$;

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('comercial', 'institucional')),
  perfil_institucional text check (perfil_institucional in ('ecossistema', 'convocador', 'viveiro', 'vitrine')),
  ordem int not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo, nome)
);

-- escopo: comum_comercial (perfil comum), comum_institucional, perfil (por perfil institucional), categoria
create table public.campos_categoria (
  id uuid primary key default gen_random_uuid(),
  escopo text not null check (escopo in ('comum_comercial', 'comum_institucional', 'perfil', 'categoria')),
  categoria_id uuid references public.categorias(id) on delete cascade,
  perfil_institucional text check (perfil_institucional in ('ecossistema', 'convocador', 'viveiro', 'vitrine')),
  chave text not null,
  rotulo text not null,
  tipo text not null check (tipo in ('texto_curto', 'texto_longo', 'numero', 'valor', 'faixa', 'lista', 'multipla', 'sim_nao', 'link', 'arquivo')),
  opcoes jsonb not null default '[]',
  observacao text,
  obrigatorio boolean not null default false,
  uso_rfp boolean not null default false,
  interno boolean not null default false,          -- nunca aparece para o parceiro
  parceiro_edita boolean not null default true,    -- parceiro pode propor alteração
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campo_escopo_coerente check (
    (escopo = 'categoria' and categoria_id is not null)
    or (escopo = 'perfil' and perfil_institucional is not null)
    or (escopo in ('comum_comercial', 'comum_institucional') and categoria_id is null)
  )
);
create unique index campos_categoria_chave on public.campos_categoria (escopo, coalesce(categoria_id::text, ''), coalesce(perfil_institucional, ''), chave);

create table public.niveis (
  tipo_parceria text not null check (tipo_parceria in ('comercial', 'institucional')),
  codigo text not null check (codigo in ('A', 'B', 'C')),
  nome text not null,
  faixa_min int,
  faixa_max int,
  dias_morno int not null,
  dias_dormente int not null,
  cor text,
  primary key (tipo_parceria, codigo)
);

create table public.pacotes (
  codigo text primary key check (codigo in ('A', 'B', 'C')),
  nome text not null,
  niveis_permitidos text[] not null,
  entregas jsonb not null default '[]',
  tarefas_onboarding jsonb not null default '[]',
  wise_hub boolean not null default false,
  ordem int not null default 0
);

create table public.catalogo_contrapartidas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_parceria text not null default 'comercial' check (tipo_parceria in ('comercial', 'institucional')),
  pacotes text[] not null default '{}',           -- comercial: pacotes em que vale
  niveis text[],                                  -- nulo: todos os níveis
  natureza_juridica text[],                       -- institucional: nulo = todas
  periodicidade text not null check (periodicidade in ('na_assinatura', 'unica', 'continua', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'por_ciclo', 'por_acao')),
  periodicidade_por_pacote jsonb not null default '{}',  -- ex.: {"A": "quinzenal"}
  prazo_inicial_dias int not null default 0,
  comprovacao text not null,
  meta text,
  ordem int not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tipos_atividade (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  minutos int not null,
  ordem int not null default 0,
  ativo boolean not null default true
);

create table public.etapas_funil (
  codigo text primary key,
  nome text not null,
  ordem int not null,
  perda boolean not null default false
);

create table public.criterios_icp (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  descricao text not null,
  ordem int not null default 0,
  ativo boolean not null default true
);

create table public.modelos_contrato (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('comercial', 'institucional')),
  versao int not null,
  caminho text not null,               -- bucket "modelos"
  vigente boolean not null default true,
  created_by uuid references public.perfis(id),
  created_at timestamptz not null default now(),
  unique (tipo, versao)
);

create table public.textos_email (
  chave text primary key,
  assunto text not null,
  corpo text not null,                 -- texto com marcadores {{nome}}
  descricao text,
  updated_at timestamptz not null default now()
);

create trigger t_upd before update on public.empresas_grupo for each row execute function public.set_updated_at();
create trigger t_upd before update on public.perfis for each row execute function public.set_updated_at();
create trigger t_upd before update on public.categorias for each row execute function public.set_updated_at();
create trigger t_upd before update on public.campos_categoria for each row execute function public.set_updated_at();
create trigger t_upd before update on public.configuracoes for each row execute function public.set_updated_at();
create trigger t_upd before update on public.textos_email for each row execute function public.set_updated_at();
