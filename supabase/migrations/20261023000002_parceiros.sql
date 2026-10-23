-- Portal Wise Partners: parceiros, ficha, contatos, pontos de contato, funil e contratos

create table public.parceiros (
  id uuid primary key default gen_random_uuid(),
  razao_social text,
  nome_fantasia text not null,
  cnpj text,
  site text,
  cidade text,
  uf text,
  endereco text,
  redes_sociais jsonb not null default '{}',
  tipo_parceria text not null default 'comercial' check (tipo_parceria in ('comercial', 'institucional')),
  natureza_juridica text check (natureza_juridica in ('privada', 'publica', 'paraestatal')),
  perfil_institucional text check (perfil_institucional in ('ecossistema', 'convocador', 'viveiro', 'vitrine')),
  categoria_empresa text,
  origem text,
  responsavel_id uuid references public.perfis(id),
  etapa text not null default 'sem_contato',
  etapa_desde timestamptz not null default now(),
  motivo_perda text,
  carteira_icp int check (carteira_icp >= 0),
  nivel text check (nivel in ('A', 'B', 'C')),
  nivel_sugerido text check (nivel_sugerido in ('A', 'B', 'C')),
  nivel_ajuste_motivo text,
  pacote text references public.pacotes(codigo),
  status_atividade text not null default 'ativo' check (status_atividade in ('ativo', 'morno', 'dormente', 'pausado')),
  motivo_inatividade text,
  pausado_ate date,
  ultimo_contato date,
  data_assinatura date,
  data_encerramento date,
  autorizacao_marca boolean not null default false,
  created_by uuid references public.perfis(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pausa_com_data check (status_atividade <> 'pausado' or pausado_ate is not null)
);
create index on public.parceiros (etapa);
create index on public.parceiros (responsavel_id);
create unique index parceiros_cnpj_unico on public.parceiros (public.somente_digitos(cnpj)) where cnpj is not null and cnpj <> '';

alter table public.perfis add constraint perfis_parceiro_fk foreign key (parceiro_id) references public.parceiros(id) on delete cascade;
alter table public.convites add constraint convites_parceiro_fk foreign key (parceiro_id) references public.parceiros(id) on delete cascade;
alter table public.parceiros add constraint parceiros_etapa_fk foreign key (etapa) references public.etapas_funil(codigo);

-- Dados internos do parceiro: nunca expostos ao parceiro nem ao cliente (princípio IV.6).
create table public.parceiros_interno (
  parceiro_id uuid primary key references public.parceiros(id) on delete cascade,
  estrategico boolean not null default false,
  estrategico_sugerido boolean not null default false,
  estrategico_motivo text,
  anotacoes text,
  relacao_origem text,
  updated_at timestamptz not null default now()
);

-- Instrumento de parceria do próprio parceiro (comissão que ele paga ao grupo).
-- Só administradores e time de parcerias veem (valores de comissão).
create table public.parceiros_instrumento (
  parceiro_id uuid primary key references public.parceiros(id) on delete cascade,
  programa_proprio boolean not null default false,
  instrumento_nome text,
  comissao_pct numeric(6,3),
  comissao_base text,
  comissao_condicao text,
  exigencias text,
  exigencias_solucao text,
  updated_at timestamptz not null default now()
);

create table public.parceiro_categorias (
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id),
  principal boolean not null default false,
  primary key (parceiro_id, categoria_id)
);
create unique index parceiro_uma_principal on public.parceiro_categorias (parceiro_id) where principal;

-- Valores publicados dos campos (perfil comum e campos da categoria).
create table public.parceiro_campos (
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  campo_id uuid not null references public.campos_categoria(id) on delete cascade,
  valor jsonb,
  versao int not null default 1,
  updated_by uuid references public.perfis(id),
  updated_at timestamptz not null default now(),
  primary key (parceiro_id, campo_id)
);

-- Propostas de alteração da ficha feitas pelo parceiro (FR-073). Só valem após validação.
create table public.propostas_ficha (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  valores jsonb not null,                       -- { campo_id: valor }
  estado text not null default 'pendente' check (estado in ('pendente', 'aprovada', 'recusada', 'substituida')),
  proposta_por uuid references public.perfis(id),
  revisada_por uuid references public.perfis(id),
  revisada_em timestamptz,
  motivo_recusa text,
  created_at timestamptz not null default now()
);
create index on public.propostas_ficha (parceiro_id, estado);

create table public.contatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text,
  email text,
  telefone text,
  whatsapp text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parceiro_contatos (
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  contato_id uuid not null references public.contatos(id) on delete cascade,
  papeis text[] not null default '{}',   -- decisor, interlocutor, responsavel_parceria, comercial_clientes, ponte
  principal boolean not null default false,
  primary key (parceiro_id, contato_id)
);

create table public.pontos_contato (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo text not null check (tipo in ('reuniao_presencial', 'reuniao_online', 'ligacao', 'whatsapp', 'email', 'evento', 'documento_enviado', 'outro')),
  data timestamptz not null default now(),
  participantes text,
  texto text,
  resumo jsonb,
  tipo_atividade_id uuid references public.tipos_atividade(id),
  minutos int,
  anexos jsonb not null default '[]',      -- [{caminho, nome, tipo}] no bucket "anexos"
  autor_id uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.pontos_contato (parceiro_id, data desc);

-- Atividades: esforço registrado, só informativo (sem limite de horas).
create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid references public.parceiros(id) on delete cascade,
  tipo_atividade_id uuid not null references public.tipos_atividade(id),
  data date not null default public.hoje(),
  minutos int not null,
  pessoa_id uuid references public.perfis(id) default auth.uid(),
  descricao text,
  ponto_contato_id uuid references public.pontos_contato(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.atividades (parceiro_id, data);

create table public.proximos_passos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  descricao text not null,
  data date not null,
  responsavel_id uuid references public.perfis(id),
  estado text not null default 'aberto' check (estado in ('aberto', 'feito', 'vencido', 'substituido')),
  concluido_em timestamptz,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.proximos_passos (parceiro_id, estado);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo text not null check (tipo in ('dossie', 'apresentacao', 'resumo', 'minuta', 'contrato_assinado', 'certificado', 'comprovacao', 'material', 'outro')),
  nome text not null,
  versao int not null default 1,
  caminho text not null,              -- bucket "documentos", pasta = parceiro_id
  visivel_parceiro boolean not null default false,
  autor_id uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.documentos (parceiro_id);

create table public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo text not null default 'assinatura' check (tipo in ('assinatura')),
  aprovado_por uuid not null references public.perfis(id) default auth.uid(),
  observacao text,
  created_at timestamptz not null default now()
);

create table public.quadros_identificacao (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo_contrato text not null check (tipo_contrato in ('comercial', 'institucional')),
  dados jsonb not null default '{}',
  versao int not null default 1,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.contratos_gerados (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  quadro_id uuid references public.quadros_identificacao(id),
  modelo_id uuid references public.modelos_contrato(id),
  caminho_docx text not null,
  caminho_pdf text,
  versao int not null,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.tarefas_onboarding (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  descricao text not null,
  prazo date not null,
  feita boolean not null default false,
  feita_em timestamptz,
  responsavel_id uuid references public.perfis(id),
  created_at timestamptz not null default now()
);

create table public.contrapartidas (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  catalogo_id uuid references public.catalogo_contrapartidas(id),
  nome text not null,                  -- cópia do catálogo (regra vale para registros novos)
  periodicidade text not null,
  comprovacao text not null,
  meta text,
  proxima_data date,
  estado text not null default 'pendente' check (estado in ('pendente', 'enviada', 'validada', 'recusada', 'atrasada')),
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.contrapartidas (parceiro_id);

create table public.comprovacoes (
  id uuid primary key default gen_random_uuid(),
  contrapartida_id uuid not null references public.contrapartidas(id) on delete cascade,
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  enviada_por uuid references public.perfis(id) default auth.uid(),
  link text,
  caminho text,                        -- bucket "comprovacoes", pasta = parceiro_id
  observacao text,
  estado text not null default 'enviada' check (estado in ('enviada', 'validada', 'recusada')),
  motivo_recusa text,
  validada_por uuid references public.perfis(id),
  validada_em timestamptz,
  created_at timestamptz not null default now(),
  constraint comprovacao_tem_evidencia check (link is not null or caminho is not null)
);

create table public.ciclos_base_ativa (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  estado text not null default 'fila' check (estado in ('fila', 'em_ciclo', 'concluido', 'suspenso')),
  entrou_fila_em date not null default public.hoje(),
  previsao_inicio date,
  inicio date,
  evento_data date,
  evento_descricao text,
  concluido_em date,
  certificado_responsavel text,
  certificado_em date,
  revisao_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index ciclo_ativo_por_parceiro on public.ciclos_base_ativa (parceiro_id) where estado in ('fila', 'em_ciclo');

create table public.base_ativa_encontros (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references public.ciclos_base_ativa(id) on delete cascade,
  numero int not null check (numero between 1 and 6),
  data date,
  realizado boolean,
  motivo_nao_realizado text check (motivo_nao_realizado in ('indisponibilidade_parceiro', 'indisponibilidade_wise', 'outro')),
  observacao text,
  unique (ciclo_id, numero)
);

create trigger t_upd before update on public.parceiros for each row execute function public.set_updated_at();
create trigger t_upd before update on public.parceiros_interno for each row execute function public.set_updated_at();
create trigger t_upd before update on public.parceiros_instrumento for each row execute function public.set_updated_at();
create trigger t_upd before update on public.contatos for each row execute function public.set_updated_at();
create trigger t_upd before update on public.contrapartidas for each row execute function public.set_updated_at();
create trigger t_upd before update on public.ciclos_base_ativa for each row execute function public.set_updated_at();
