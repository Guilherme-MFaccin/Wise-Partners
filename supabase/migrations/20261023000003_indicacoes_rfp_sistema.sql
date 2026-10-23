-- Portal Wise Partners: clientes, indicações, comissões, RFP, histórico e notificações

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  razao_normalizada text generated always as (public.normalizar_texto(razao_social)) stored,
  cnpj text,
  cnpj_digitos text generated always as (public.somente_digitos(cnpj)) stored,
  contato_nome text,
  email text,
  telefone text,
  consentimento boolean not null default false,
  consentimento_por uuid references public.perfis(id),
  consentimento_em timestamptz,
  ultima_interacao date,
  cliente_existente_em text[] not null default '{}',   -- códigos das empresas do grupo
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- LGPD: dados pessoais de terceiros só com consentimento declarado (princípio IV.3)
  constraint dados_pessoais_com_consentimento check (
    consentimento or (contato_nome is null and email is null and telefone is null)
  )
);
create index on public.clientes (cnpj_digitos);
create index on public.clientes (razao_normalizada);

create table public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  sentido text not null check (sentido in ('parceiro_para_grupo', 'grupo_para_parceiro')),
  parceiro_id uuid not null references public.parceiros(id) on delete restrict,
  empresa_grupo_id uuid not null references public.empresas_grupo(id),
  cliente_id uuid not null references public.clientes(id),
  origem text not null check (origem in ('grupo_whatsapp', 'wise_hub', 'evento', 'rfp', 'portal_parceiro', 'reuniao', 'outra')),
  origem_detalhe text,
  data date not null default public.hoje(),
  responsavel_id uuid references public.perfis(id),
  aderencia_icp jsonb not null default '{}',   -- { chave_criterio: true/false }
  aderente_icp boolean,
  cliente_existente boolean not null default false,
  etapa text not null default 'nova' check (etapa in ('nova', 'em_contato', 'reuniao', 'proposta', 'fechada', 'perdida')),
  data_reuniao date,
  valor_base numeric(14,2),        -- primeira mensalidade, primeira parcela ou valor do projeto
  data_fechamento date,
  data_compensacao date,
  atualizacao_pendente jsonb,
  atualizacao_por uuid references public.perfis(id),
  atualizacao_em timestamptz,
  ultima_atualizacao timestamptz not null default now(),
  excecao_duplicidade text,
  excecao_por uuid references public.perfis(id),
  pedido_rfp_id uuid,
  observacoes text,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.indicacoes (parceiro_id);
create index on public.indicacoes (cliente_id);

-- Comissões em tabela própria: a RLS esconde valores sem depender da interface.
create table public.comissoes (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null references public.indicacoes(id) on delete cascade,
  parceiro_id uuid not null references public.parceiros(id),
  beneficiario text not null check (beneficiario in ('parceiro', 'responsavel', 'grupo')),
  responsavel_perfil_id uuid references public.perfis(id),
  percentual numeric(6,3),
  base_descricao text,
  base_valor numeric(14,2),
  valor numeric(14,2),
  estado text not null default 'aguardando_fechamento'
    check (estado in ('aguardando_fechamento', 'aguardando_compensacao', 'a_pagar', 'nf_recebida', 'paga', 'cancelada')),
  a_pagar_em timestamptz,
  nf_recebida_em timestamptz,
  paga_em timestamptz,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (indicacao_id, beneficiario)
);

create table public.pedidos_rfp (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  cliente_nome text not null,                 -- nome da empresa exibido na página
  consultor_id uuid not null references public.perfis(id) default auth.uid(),
  empresa_grupo_id uuid not null references public.empresas_grupo(id),
  necessidade text not null,
  necessidade_resumida text,
  porte text,
  regiao text,
  prazo text,
  restricoes text,
  categorias_sugeridas jsonb not null default '[]',
  excecoes jsonb not null default '[]',        -- categorias publicadas com menos de 3 por falta de assinados
  sem_fornecedor jsonb not null default '[]',  -- necessidades sem categoria ou sem parceiro (a prospectar)
  estado text not null default 'rascunho' check (estado in ('rascunho', 'publicado', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.indicacoes add constraint indicacoes_pedido_fk foreign key (pedido_rfp_id) references public.pedidos_rfp(id) on delete set null;

create table public.pedido_rfp_opcoes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_rfp(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id),
  parceiro_id uuid not null references public.parceiros(id),
  ordem int not null default 0,
  aderencia int,
  justificativa text,
  selecionado boolean not null default true,
  unique (pedido_id, categoria_id, parceiro_id)
);

create table public.paginas_rfp (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null unique references public.pedidos_rfp(id) on delete cascade,
  token text unique,
  blocos jsonb not null default '[]',
  publicada_em timestamptz,
  expira_em timestamptz,
  revogada boolean not null default false,
  revogada_em timestamptz,
  aberturas int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eventos_rfp (
  id bigint generated always as identity primary key,
  pagina_id uuid not null references public.paginas_rfp(id) on delete cascade,
  tipo text not null check (tipo in ('abertura', 'clique_whatsapp', 'clique_email')),
  parceiro_id uuid references public.parceiros(id),
  user_agent text,
  created_at timestamptz not null default now()
);
create index on public.eventos_rfp (pagina_id, tipo);

-- Histórico (princípio VI)
create table public.historico (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id uuid,
  parceiro_id uuid,
  campo text not null,
  valor_anterior text,
  valor_novo text,
  autor_id uuid,
  created_at timestamptz not null default now()
);
create index on public.historico (parceiro_id, created_at desc);
create index on public.historico (tabela, registro_id);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.perfis(id) on delete cascade,
  email_destino text,                 -- para destinatários sem conta (ex.: financeiro configurado)
  tipo text not null,
  titulo text not null,
  mensagem text,
  link text,
  dados jsonb not null default '{}',
  lida boolean not null default false,
  enviar_email boolean not null default true,
  email_enviado_em timestamptz,
  email_erro text,
  created_at timestamptz not null default now()
);
create index on public.notificacoes (usuario_id, lida);
create index on public.notificacoes (email_enviado_em) where enviar_email and email_enviado_em is null;

create trigger t_upd before update on public.clientes for each row execute function public.set_updated_at();
create trigger t_upd before update on public.indicacoes for each row execute function public.set_updated_at();
create trigger t_upd before update on public.comissoes for each row execute function public.set_updated_at();
create trigger t_upd before update on public.pedidos_rfp for each row execute function public.set_updated_at();
create trigger t_upd before update on public.paginas_rfp for each row execute function public.set_updated_at();
