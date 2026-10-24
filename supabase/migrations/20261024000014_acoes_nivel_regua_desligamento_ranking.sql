-- Portal Wise Partners 2.0: ações conjuntas (História 11), nível por resultado (História 4),
-- faixas, régua e desligamento (História 12), ranking e premiação (História 13)

-- ---------------------------------------------------------------------------
-- Ações da Wise e plano de ações conjuntas (Apêndice H)
-- ---------------------------------------------------------------------------
create table public.catalogo_acoes_wise (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_acao text not null default 'marketing' check (tipo_acao in ('marketing', 'venda', 'relacionamento', 'conteudo', 'evento', 'outro')),
  pacotes text[] not null default '{}',
  periodicidade text not null check (periodicidade in ('na_assinatura', 'unica', 'continua', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'por_ciclo', 'por_acao')),
  periodicidade_por_pacote jsonb not null default '{}',
  prazo_inicial_dias int not null default 0,
  comprovacao text not null,
  ordem int not null default 0,
  ativa boolean not null default true
);

create table public.acoes_wise (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  catalogo_id uuid references public.catalogo_acoes_wise(id),
  nome text not null,
  tipo_acao text not null default 'marketing',
  periodicidade text not null,
  comprovacao_esperada text,
  data_prevista date,
  responsavel_id uuid references public.perfis(id),
  estado text not null default 'planejada' check (estado in ('planejada', 'feita', 'comprovada', 'atrasada', 'cancelada')),
  concluida_em date,
  comprovacao_link text,
  comprovacao_caminho text,
  resultado jsonb not null default '{}',     -- {alcance, inscritos}
  observacao text,
  alertada boolean not null default false,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.acoes_wise (parceiro_id, data_prevista);
create trigger t_upd before update on public.acoes_wise for each row execute function public.set_updated_at();
create trigger t_hist after insert or update on public.acoes_wise for each row execute function public.trg_historico('nome', 'estado', 'data_prevista', 'concluida_em');

alter table public.custos_diretos add constraint custos_acao_fk foreign key (acao_wise_id) references public.acoes_wise(id) on delete set null;
alter table public.indicacoes add constraint indicacoes_acao_fk foreign key (acao_wise_id) references public.acoes_wise(id) on delete set null;

alter table public.contrapartidas add column concluida_em timestamptz, add column resultado jsonb not null default '{}';
alter table public.comprovacoes add column no_prazo boolean;

create or replace function public.gerar_acoes_wise(p_parceiro uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  p public.parceiros;
  c record;
  v_per text;
  n int := 0;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.data_assinatura is null or p.tipo_parceria <> 'comercial' or p.pacote is null then return 0; end if;
  for c in
    select * from public.catalogo_acoes_wise k
    where k.ativa and p.pacote = any (k.pacotes)
      and not exists (select 1 from public.acoes_wise x where x.parceiro_id = p.id and x.catalogo_id = k.id)
    order by k.ordem
  loop
    v_per := coalesce(c.periodicidade_por_pacote->>p.pacote, c.periodicidade);
    insert into public.acoes_wise (parceiro_id, catalogo_id, nome, tipo_acao, periodicidade, comprovacao_esperada, data_prevista, responsavel_id)
    values (p.id, c.id, c.nome, c.tipo_acao, v_per, c.comprovacao,
            case when c.prazo_inicial_dias > 0 then p.data_assinatura + c.prazo_inicial_dias
                 when v_per in ('por_ciclo', 'por_acao', 'continua') then null
                 when v_per in ('na_assinatura') then p.data_assinatura
                 else public.proxima_data_periodo(p.data_assinatura, v_per) end,
            p.responsavel_id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Conclui uma ação da Wise; com custo, lança o custo direto ligado à ação (FR-158, História 11)
create or replace function public.concluir_acao_wise(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  a public.acoes_wise;
  v_data date := coalesce((p->>'data')::date, public.hoje());
  v_comprovada boolean;
  v_resultado jsonb;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into a from public.acoes_wise where id = p_id;
  if a.id is null then raise exception 'Ação não encontrada.' using errcode = 'P0001'; end if;
  -- Comprovada quando há comprovação nova ou já guardada
  v_comprovada := coalesce(nullif(p->>'comprovacao_link', ''), nullif(p->>'comprovacao_caminho', ''), a.comprovacao_link, a.comprovacao_caminho) is not null;
  -- Resultado: mescla o objeto recebido e as chaves soltas alcance e inscritos com o que já existe
  v_resultado := coalesce(a.resultado, '{}'::jsonb) || coalesce(p->'resultado', '{}'::jsonb)
                 || jsonb_strip_nulls(jsonb_build_object('alcance', p->'alcance', 'inscritos', p->'inscritos'));
  update public.acoes_wise
     set estado = case when v_comprovada then 'comprovada' else 'feita' end, concluida_em = v_data,
         comprovacao_link = coalesce(nullif(p->>'comprovacao_link', ''), comprovacao_link),
         comprovacao_caminho = coalesce(nullif(p->>'comprovacao_caminho', ''), comprovacao_caminho),
         resultado = v_resultado, observacao = coalesce(p->>'observacao', observacao)
   where id = p_id;
  if coalesce((p->>'custo')::numeric, 0) > 0 then
    if not public.is_admin() then raise exception 'Somente administradores lançam custos.' using errcode = '42501'; end if;
    insert into public.custos_diretos (data, categoria, valor, descricao, parceiro_id, acao_wise_id)
    values (v_data, coalesce(p->>'categoria_custo', 'outro'), (p->>'custo')::numeric, coalesce(p->>'descricao_custo', a.nome), a.parceiro_id, a.id);
  end if;
  -- Ação periódica: agenda a próxima ocorrência
  if a.periodicidade in ('quinzenal', 'mensal', 'bimestral', 'trimestral') then
    insert into public.acoes_wise (parceiro_id, catalogo_id, nome, tipo_acao, periodicidade, comprovacao_esperada, data_prevista, responsavel_id)
    values (a.parceiro_id, a.catalogo_id, a.nome, a.tipo_acao, a.periodicidade, a.comprovacao_esperada,
            public.proxima_data_periodo(greatest(coalesce(a.data_prevista, v_data), v_data), a.periodicidade), a.responsavel_id);
  end if;
end $$;

-- Plano único de ações conjuntas: contrapartidas (lado parceiro) e ações da Wise (lado Wise)
create or replace view public.v_acoes_conjuntas with (security_invoker = true) as
select c.id, c.parceiro_id, 'parceiro'::text as lado, c.nome, 'contrapartida'::text as tipo, c.periodicidade,
       c.proxima_data as data_prevista, c.estado, c.concluida_em::date as concluida_em, c.comprovacao as comprovacao_esperada,
       c.resultado, c.ativa
from public.contrapartidas c
union all
select a.id, a.parceiro_id, 'wise', a.nome, a.tipo_acao, a.periodicidade, a.data_prevista, a.estado, a.concluida_em,
       a.comprovacao_esperada, a.resultado, a.ativa
from public.acoes_wise a;

-- Comprovação no prazo (para pontos do ranking) e conclusão da contrapartida
create or replace function public.trg_comprovacao_prazo() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.contrapartidas;
begin
  select * into c from public.contrapartidas where id = new.contrapartida_id;
  new.no_prazo := c.proxima_data is null or public.hoje() <= c.proxima_data;
  return new;
end $$;
create trigger t_comprovacao_prazo before insert on public.comprovacoes for each row execute function public.trg_comprovacao_prazo();

create or replace function public.trg_comprovacao_validada() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.contrapartidas; k public.catalogo_contrapartidas;
begin
  if new.estado = 'validada' and old.estado is distinct from 'validada' then
    select * into c from public.contrapartidas where id = new.contrapartida_id;
    update public.contrapartidas set concluida_em = now() where id = c.id;
    if new.no_prazo then
      perform public.lancar_pontos(c.parceiro_id, 'acao_comprovada', new.id, public.hoje());
    end if;
    select * into k from public.catalogo_contrapartidas where id = c.catalogo_id;
    -- Contínuas, de assinatura e as comprovadas só por declaração não cancelam o desligamento (Apêndice D)
    if c.periodicidade not in ('continua', 'na_assinatura') and coalesce(c.comprovacao, '') not ilike 'Declara%' then
      perform public.cancelar_desligamento(c.parceiro_id, 'Contrapartida comprovada');
    end if;
    perform public.verificar_subida_nivel(c.parceiro_id);
  end if;
  return null;
end $$;
create trigger t_comprovacao_validada after update on public.comprovacoes for each row execute function public.trg_comprovacao_validada();

-- ---------------------------------------------------------------------------
-- Ranking e premiação (Apêndice K)
-- ---------------------------------------------------------------------------
create table public.pontos_ranking (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  evento text not null check (evento in ('indicacao_qualificada', 'reuniao', 'cliente_icp', 'pessoa_certificada', 'acao_comprovada')),
  pontos int not null,
  referencia_id uuid not null,
  data date not null,
  created_at timestamptz not null default now(),
  unique (evento, referencia_id)
);
create index on public.pontos_ranking (parceiro_id, data);

create or replace function public.lancar_pontos(p_parceiro uuid, p_evento text, p_ref uuid, p_data date) returns void
language plpgsql security definer set search_path = public as $$
declare v_pts int;
begin
  if not exists (select 1 from public.parceiros where id = p_parceiro and tipo_parceria = 'comercial') then return; end if;
  v_pts := coalesce((public.config('pontos_ranking') ->> p_evento)::int, 0);
  if v_pts = 0 then return; end if;
  insert into public.pontos_ranking (parceiro_id, evento, pontos, referencia_id, data)
  values (p_parceiro, p_evento, v_pts, p_ref, p_data) on conflict (evento, referencia_id) do nothing;
end $$;

-- Ranking do ano ou do trimestre. Parceiros veem só posição, nome (ou "Parceiro Wise") e pontos, nunca nível ou valores.
create or replace function public.ranking(p_ano int default null, p_trimestre int default null)
returns table (posicao int, parceiro_id uuid, nome text, pontos int, eu boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_ano int := coalesce(p_ano, extract(year from public.hoje())::int);
  v_ini date;
  v_fim date;
  v_meu uuid := public.parceiro_atual();
  v_interno boolean := public.is_parcerias() or public.is_consultor();
begin
  if not v_interno and v_meu is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_trimestre is null then
    v_ini := make_date(v_ano, 1, 1); v_fim := make_date(v_ano, 12, 31);
  else
    v_ini := make_date(v_ano, (p_trimestre - 1) * 3 + 1, 1); v_fim := (v_ini + interval '3 months')::date - 1;
  end if;
  return query
  with base as (
    select p.id, p.nome_fantasia, p.anonimo_ranking, p.data_assinatura,
           coalesce(sum(r.pontos), 0)::int as pts,
           count(*) filter (where r.evento = 'cliente_icp')::int as clientes
    from public.parceiros p
    left join public.pontos_ranking r on r.parceiro_id = p.id and r.data between v_ini and v_fim
    where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
    group by p.id
  ), ord as (
    select b.*, row_number() over (order by b.pts desc, b.clientes desc, b.data_assinatura nulls last, b.nome_fantasia)::int as pos
    from base b
  )
  select o.pos,
         case when v_interno or o.id = v_meu then o.id end,
         case when v_interno or o.id = v_meu or not o.anonimo_ranking then o.nome_fantasia else 'Parceiro Wise' end,
         o.pts, o.id = v_meu
  from ord o
  where v_interno or o.pos <= 10 or o.id = v_meu
  order by o.pos;
end $$;

create table public.premiacoes (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  categoria text not null,
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  divulgada boolean not null default false,
  observacao text,
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (ano, categoria)
);
create trigger t_hist after insert or update on public.premiacoes for each row execute function public.trg_historico('categoria', 'ano', 'divulgada');

create or replace function public.trg_premiacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notificar_parceiro(new.parceiro_id, 'premiacao', 'Premiação Wise Partners',
    format('Parabéns! Vocês receberam a premiação "%s" de %s. O selo já está nos materiais do portal.', new.categoria, new.ano),
    '/parceiro/materiais');
  return null;
end $$;
create trigger t_premiacao after insert on public.premiacoes for each row execute function public.trg_premiacao();

-- Premiações para o parceiro: divulgadas (anonimato respeitado) e as dele
create or replace function public.premiacoes_publicas(p_ano int default null)
returns table (ano int, categoria text, nome text, minha boolean)
language sql stable security definer set search_path = public as $$
  select pr.ano, pr.categoria,
         case when p.id = public.parceiro_atual() or not p.anonimo_ranking then p.nome_fantasia else 'Parceiro Wise' end,
         p.id = public.parceiro_atual()
  from public.premiacoes pr join public.parceiros p on p.id = pr.parceiro_id
  where (p_ano is null or pr.ano = p_ano)
    and (pr.divulgada or p.id = public.parceiro_atual() or public.is_interno_leitura())
    and (public.parceiro_atual() is not null or public.is_interno_leitura())
  order by pr.ano desc, pr.categoria
$$;

-- ---------------------------------------------------------------------------
-- Faixas internas e régua de atendimento (Apêndice C)
-- ---------------------------------------------------------------------------
create table public.faixas (
  parceiro_id uuid primary key references public.parceiros(id) on delete cascade,
  faixa text not null check (faixa in ('destaque', 'potencial', 'base')),
  pontos_ano int not null,
  posicao int,
  calculada_em timestamptz not null default now()
);

create or replace function public.calcular_faixas() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_n int;
  v_dest int;
  v_pot int;
  v_ini date := date_trunc('year', public.hoje())::date;
begin
  delete from public.faixas;
  with base as (
    select p.id, p.data_assinatura,
           coalesce((select sum(pontos) from public.pontos_ranking r where r.parceiro_id = p.id and r.data >= v_ini), 0)::int as pts,
           coalesce((select count(*) from public.pontos_ranking r where r.parceiro_id = p.id and r.data >= v_ini and r.evento = 'cliente_icp'), 0)::int as cli
    from public.parceiros p
    where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
  ), ord as (
    select *, row_number() over (order by pts desc, cli desc, data_assinatura nulls last, id)::int as pos, count(*) over ()::int as total
    from base
  )
  insert into public.faixas (parceiro_id, faixa, pontos_ano, posicao)
  select id,
         case when pts > 0 and pos <= greatest(1, floor(total * public.config_num('faixa_destaque_pct', 5) / 100)) then 'destaque'
              when pts > 0 and pos <= greatest(1, floor(total * public.config_num('faixa_destaque_pct', 5) / 100))
                                      + greatest(1, floor(total * public.config_num('faixa_potencial_pct', 15) / 100)) then 'potencial'
              else 'base' end,
         pts, pos
  from ord;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

create table public.regua_atendimento (
  chave text primary key,             -- pacote:A, pacote:A:ciclo, pacote:B, pacote:C, faixa:destaque, faixa:potencial, faixa:base
  cadencia_dias int,                  -- nulo: sem cadência própria
  tolerancia_dias int not null default 7,
  descricao text not null
);

-- Situação da régua do parceiro: vale a cadência mais frequente entre pacote e faixa
create or replace function public.regua_status(p_parceiro uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  p public.parceiros;
  v_cad int;
  v_tol int := 7;
  v_ult date;
  v_base date;
  v_ciclo boolean;
  r record;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.id is null or not public.parceiro_assinado(p.id) or p.status_atividade = 'pausado' or p.pacote is null then
    return jsonb_build_object('aplica', false);
  end if;
  v_ciclo := exists (select 1 from public.ciclos_base_ativa c where c.parceiro_id = p.id and c.estado = 'em_ciclo');
  for r in select * from public.regua_atendimento
           where chave in ('pacote:' || p.pacote || case when p.pacote = 'A' and v_ciclo then ':ciclo' else '' end,
                           'faixa:' || coalesce((select faixa from public.faixas where parceiro_id = p.id), 'base'))
             and cadencia_dias is not null loop
    if v_cad is null or r.cadencia_dias < v_cad then v_cad := r.cadencia_dias; v_tol := r.tolerancia_dias; end if;
  end loop;
  if v_cad is null then return jsonb_build_object('aplica', false); end if;
  select max((data at time zone 'America/Sao_Paulo')::date) into v_ult from public.pontos_contato
   where parceiro_id = p.id and tipo in ('reuniao_presencial', 'reuniao_online');
  v_base := greatest(v_ult, p.data_assinatura);
  return jsonb_build_object('aplica', true, 'cadencia_dias', v_cad, 'tolerancia_dias', v_tol, 'ultima_reuniao', v_ult,
    'proxima_ate', v_base + v_cad, 'atrasada', public.hoje() > v_base + v_cad + v_tol);
end $$;

-- ---------------------------------------------------------------------------
-- Desligamento (Apêndice D)
-- ---------------------------------------------------------------------------
create table public.fluxos_desligamento (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo text not null check (tipo in ('inatividade', 'inadequacao')),
  estado text not null check (estado in ('em_risco', 'tentativa_1', 'tentativa_2', 'sugerido', 'aprovado', 'avisado', 'encerrado', 'cancelado')),
  motivo text,
  em_risco_em date,
  tentativa_1_em date,
  tentativa_2_em date,
  sugerido_em date,
  aprovado_em date,
  aprovado_por uuid references public.perfis(id),
  aguardar_ciclo boolean not null default false,
  avisado_em date,
  texto_aviso text,
  data_encerramento date,
  encerrado_em date,
  cancelado_em date,
  cancelado_motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index fluxo_aberto_por_parceiro on public.fluxos_desligamento (parceiro_id) where estado not in ('encerrado', 'cancelado');
create trigger t_upd before update on public.fluxos_desligamento for each row execute function public.set_updated_at();
create trigger t_hist after insert or update on public.fluxos_desligamento
for each row execute function public.trg_historico('estado', 'motivo', 'data_encerramento', 'cancelado_motivo');

create or replace function public.cancelar_desligamento(p_parceiro uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.fluxos_desligamento
     set estado = 'cancelado', cancelado_em = public.hoje(), cancelado_motivo = p_motivo
   where parceiro_id = p_parceiro and tipo = 'inatividade' and estado in ('em_risco', 'tentativa_1', 'tentativa_2', 'sugerido');
end $$;

-- Dias de pausa desde uma data (períodos de nutrição e pausa registrados no histórico)
create or replace function public.parceiro_em_risco(p_parceiro uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  p public.parceiros;
  v_janela int := public.config_int('risco_janela_dias', 180);
  v_desde date;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.tipo_parceria <> 'comercial' or not public.parceiro_assinado(p.id) or p.status_atividade = 'pausado' then return false; end if;
  if public.hoje() - p.data_assinatura < public.config_int('risco_dias_assinatura', 180) then return false; end if;
  v_desde := public.hoje() - v_janela;
  if exists (select 1 from public.indicacoes i where i.parceiro_id = p.id and i.sentido = 'parceiro_para_grupo'
             and i.qualificada and i.created_at::date >= v_desde) then return false; end if;
  if exists (select 1 from public.comprovacoes cp join public.contrapartidas c on c.id = cp.contrapartida_id
             where c.parceiro_id = p.id and cp.estado = 'validada' and cp.validada_em::date >= v_desde
               and c.periodicidade not in ('continua', 'na_assinatura') and coalesce(c.comprovacao, '') not ilike 'Declara%') then return false; end if;
  return true;
end $$;

-- Rotina: entra em risco (com a primeira tentativa) e avança para sugestão de desligamento
create or replace function public.avaliar_desligamentos() returns int
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n int := 0;
  v_fluxo uuid;
  v_espera int := public.config_int('retomada_espera_dias', 30);
begin
  for r in select p.id, p.nome_fantasia, p.responsavel_id from public.parceiros p
           where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id)
             and not exists (select 1 from public.fluxos_desligamento f where f.parceiro_id = p.id and f.estado not in ('encerrado', 'cancelado')) loop
    if public.parceiro_em_risco(r.id) then
      insert into public.fluxos_desligamento (parceiro_id, tipo, estado, em_risco_em, tentativa_1_em)
      values (r.id, 'inatividade', 'tentativa_1', public.hoje(), public.hoje()) returning id into v_fluxo;
      insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id)
      values (r.id, 'Tentativa de retomada: propor uma reunião para retomar a parceria', public.hoje() + 2, r.responsavel_id);
      perform public.notificar_responsavel(r.id, 'parceiro_em_risco', 'Parceiro em risco',
        format('%s está há 180 dias sem indicação qualificada nem contrapartida comprovada. A primeira tentativa de retomada foi criada.', r.nome_fantasia),
        '/app/parceiros/' || r.id || '?aba=desligamento');
      n := n + 1;
    end if;
  end loop;

  -- Segunda tentativa há 30 dias sem resposta: sugere o desligamento ao Diretor
  for r in select f.*, p.nome_fantasia from public.fluxos_desligamento f join public.parceiros p on p.id = f.parceiro_id
           where f.estado = 'tentativa_2' and f.tentativa_2_em <= public.hoje() - v_espera loop
    if not exists (select 1 from public.indicacoes i where i.parceiro_id = r.parceiro_id and i.created_at::date > r.tentativa_2_em)
       and not exists (select 1 from public.comprovacoes c where c.parceiro_id = r.parceiro_id and c.created_at::date > r.tentativa_2_em) then
      update public.fluxos_desligamento set estado = 'sugerido', sugerido_em = public.hoje() where id = r.id;
      perform public.notificar_diretores('desligamento_para_aprovar', 'Desligamento sugerido',
        format('%s não respondeu às duas tentativas de retomada. O desligamento aguarda a sua decisão.', r.nome_fantasia),
        '/app/parceiros/' || r.parceiro_id || '?aba=desligamento');
    end if;
  end loop;

  -- Encerramento na data do aviso
  for r in select f.*, p.nome_fantasia from public.fluxos_desligamento f join public.parceiros p on p.id = f.parceiro_id
           where f.estado = 'avisado' and f.data_encerramento <= public.hoje() loop
    perform public.encerrar_parceria(r.id);
  end loop;
  return n;
end $$;

create or replace function public.notificar_diretores(p_tipo text, p_titulo text, p_mensagem text, p_link text) returns void
language plpgsql security definer set search_path = public as $$
declare d record;
begin
  for d in select id from public.perfis where is_diretor and ativo loop
    perform public.notificar(d.id, p_tipo, p_titulo, p_mensagem, p_link, '{}'::jsonb, true);
  end loop;
end $$;

create or replace function public.registrar_tentativa_retomada(p_fluxo uuid, p_texto text default null) returns void
language plpgsql security definer set search_path = public as $$
declare f public.fluxos_desligamento; v_tipo uuid;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into f from public.fluxos_desligamento where id = p_fluxo;
  if f.estado <> 'tentativa_1' then raise exception 'A segunda tentativa só vale depois da primeira.' using errcode = 'P0001'; end if;
  if public.hoje() < f.tentativa_1_em + public.config_int('retomada_intervalo_dias', 15) then
    raise exception 'A segunda tentativa precisa de no mínimo % dias depois da primeira.', public.config_int('retomada_intervalo_dias', 15)
      using errcode = 'P0001';
  end if;
  select id into v_tipo from public.tipos_atividade where chave = 'tentativa_retomada';
  insert into public.pontos_contato (parceiro_id, tipo, texto, tipo_atividade_id, autor_id)
  values (f.parceiro_id, 'outro', coalesce(p_texto, 'Segunda tentativa de retomada'), v_tipo, auth.uid());
  update public.fluxos_desligamento set estado = 'tentativa_2', tentativa_2_em = public.hoje() where id = p_fluxo;
end $$;

create or replace function public.abrir_desligamento_inadequacao(p_parceiro uuid, p_motivo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid; v_nome text;
begin
  if not public.is_admin() then raise exception 'Somente administradores abrem desligamento por inadequação.' using errcode = '42501'; end if;
  if coalesce(btrim(p_motivo), '') = '' then raise exception 'Informe o motivo.' using errcode = 'P0001'; end if;
  update public.fluxos_desligamento set estado = 'cancelado', cancelado_em = public.hoje(), cancelado_motivo = 'Substituído por desligamento por inadequação'
   where parceiro_id = p_parceiro and estado in ('em_risco', 'tentativa_1', 'tentativa_2', 'sugerido');
  insert into public.fluxos_desligamento (parceiro_id, tipo, estado, motivo, sugerido_em)
  values (p_parceiro, 'inadequacao', 'sugerido', p_motivo, public.hoje()) returning id into v;
  select nome_fantasia into v_nome from public.parceiros where id = p_parceiro;
  perform public.notificar_diretores('desligamento_para_aprovar', 'Desligamento por inadequação',
    format('%s: desligamento por inadequação aguarda a sua decisão. Motivo: %s', v_nome, p_motivo), '/app/parceiros/' || p_parceiro || '?aba=desligamento');
  return v;
end $$;

-- Só o Diretor aprova (princípio IV.9)
create or replace function public.decidir_desligamento(p_fluxo uuid, p_aprovar boolean, p_aguardar_ciclo boolean default false, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare f public.fluxos_desligamento;
begin
  if not public.is_diretor() then raise exception 'Somente o Diretor decide desligamentos.' using errcode = '42501'; end if;
  select * into f from public.fluxos_desligamento where id = p_fluxo;
  if f.estado <> 'sugerido' then raise exception 'Este desligamento não aguarda decisão.' using errcode = 'P0001'; end if;
  if p_aprovar then
    update public.fluxos_desligamento set estado = 'aprovado', aprovado_em = public.hoje(), aprovado_por = auth.uid(),
      aguardar_ciclo = coalesce(p_aguardar_ciclo, false), motivo = coalesce(motivo, p_motivo) where id = p_fluxo;
  else
    if coalesce(btrim(p_motivo), '') = '' then raise exception 'Informe o motivo para manter o parceiro.' using errcode = 'P0001'; end if;
    update public.fluxos_desligamento set estado = 'cancelado', cancelado_em = public.hoje(), cancelado_motivo = 'Mantido pelo Diretor: ' || p_motivo
     where id = p_fluxo;
  end if;
end $$;

-- Aviso formal com a data de encerramento (FR-164): tira o parceiro das novas recomendações na hora
create or replace function public.gerar_aviso_desligamento(p_fluxo uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  f public.fluxos_desligamento;
  p public.parceiros;
  v_data date := public.hoje() + public.config_int('aviso_desligamento_dias', 30);
  v_fim_ciclo date;
  v_modelo text;
  v_texto text;
begin
  if not public.is_admin() then raise exception 'Somente administradores geram o aviso.' using errcode = '42501'; end if;
  select * into f from public.fluxos_desligamento where id = p_fluxo;
  if f.estado not in ('aprovado', 'avisado') then raise exception 'O desligamento precisa estar aprovado pelo Diretor.' using errcode = 'P0001'; end if;
  select * into p from public.parceiros where id = f.parceiro_id;
  if f.aguardar_ciclo then
    select max(inicio + 84) into v_fim_ciclo from public.ciclos_base_ativa where parceiro_id = p.id and estado = 'em_ciclo';
    v_data := greatest(v_data, coalesce(v_fim_ciclo, v_data));
  end if;
  select corpo into v_modelo from public.textos_email where chave = 'aviso_desligamento';
  v_texto := replace(replace(replace(coalesce(v_modelo, 'Comunicamos o encerramento do Contrato de Parceria Comercial em {{data_encerramento}}.'),
    '{{parceiro}}', coalesce(p.razao_social, p.nome_fantasia)),
    '{{data_encerramento}}', to_char(v_data, 'DD/MM/YYYY')),
    '{{motivo}}', case f.tipo when 'inatividade' then 'inatividade, conforme as Regras do Programa e a cláusula 13.3 do contrato'
                              else coalesce(f.motivo, 'inadequação') end);
  update public.fluxos_desligamento set estado = 'avisado', avisado_em = public.hoje(), data_encerramento = v_data, texto_aviso = v_texto
   where id = p_fluxo;
  return v_texto;
end $$;

create or replace function public.encerrar_parceria(p_fluxo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f public.fluxos_desligamento;
begin
  select * into f from public.fluxos_desligamento where id = p_fluxo;
  update public.parceiros
     set etapa = 'parceria_encerrada',
         motivo_perda = case f.tipo when 'inatividade' then 'Desligamento por inatividade' else 'Desligamento por inadequação: ' || coalesce(f.motivo, '') end
   where id = f.parceiro_id;
  update public.links_indicacao set ativo = false, revogado_em = now() where parceiro_id = f.parceiro_id and ativo;
  perform set_config('wise.bypass_perfil', 'on', true);
  update public.perfis set ativo = false where parceiro_id = f.parceiro_id and ativo;
  perform set_config('wise.bypass_perfil', 'off', true);
  update public.fluxos_desligamento set estado = 'encerrado', encerrado_em = public.hoje() where id = p_fluxo;
end $$;

-- ---------------------------------------------------------------------------
-- Nível por resultado (Apêndice B)
-- ---------------------------------------------------------------------------
create table public.requisitos_nivel (
  id uuid primary key default gen_random_uuid(),
  nivel text not null check (nivel in ('A', 'B', 'C')),
  grupo text not null check (grupo in ('resultado', 'capacitacao', 'regras')),
  regra jsonb not null,
  descricao text not null,
  vigente_desde date not null default '2026-10-23',
  versao int not null default 1,
  created_at timestamptz not null default now()
);
create index on public.requisitos_nivel (nivel, grupo, vigente_desde desc);

-- Mudança de requisito que afeta parceiros exige vigência mínima (FR-168)
create or replace function public.trg_requisito_vigencia() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.vigente_desde < public.hoje() + public.config_int('vigencia_minima_regra_dias', 30) then
    raise exception 'Mudança de requisito de nível precisa de vigência a partir de % (no mínimo % dias).',
      to_char(public.hoje() + public.config_int('vigencia_minima_regra_dias', 30), 'DD/MM/YYYY'), public.config_int('vigencia_minima_regra_dias', 30)
      using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger t_vigencia before insert or update on public.requisitos_nivel for each row execute function public.trg_requisito_vigencia();
create trigger t_hist after insert or update on public.requisitos_nivel for each row execute function public.trg_historico('descricao', 'vigente_desde');

create or replace function public.requisito_vigente(p_nivel text, p_grupo text, p_ref date) returns public.requisitos_nivel
language sql stable security definer set search_path = public as $$
  select * from public.requisitos_nivel where nivel = p_nivel and grupo = p_grupo and vigente_desde <= p_ref
  order by vigente_desde desc, versao desc limit 1
$$;

create table public.revisoes_nivel (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  trimestre text not null,
  nivel_no_inicio text,
  resultado text not null check (resultado in ('cumpre', 'observacao', 'proposta_rebaixamento', 'isento', 'subida')),
  detalhes jsonb not null default '{}',
  decisao text check (decisao in ('confirmado', 'mantido')),
  decidido_por uuid references public.perfis(id),
  decidido_em timestamptz,
  motivo text,
  pacote_novo text,
  pacote_efetivo_em date,
  created_at timestamptz not null default now()
);
create unique index revisao_trimestral_unica on public.revisoes_nivel (parceiro_id, trimestre) where resultado <> 'subida';
create trigger t_hist after insert or update on public.revisoes_nivel for each row execute function public.trg_historico('resultado', 'decisao', 'motivo');

-- Situação do parceiro diante dos requisitos de um nível, por grupo (FR-118, FR-124)
create or replace function public.cumpre_nivel(p_parceiro uuid, p_nivel text, p_ref date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_ref date := coalesce(p_ref, public.hoje());
  p public.parceiros;
  rq public.requisitos_nivel;
  g text;
  v_janela int;
  v_qual int;
  v_cli int;
  v_cert int;
  v_resp boolean;
  v_atraso int;
  v_acoes int;
  v_ok boolean;
  v_falta text[];
  v_grupos jsonb := '{}';
  v_todos boolean := true;
begin
  select * into p from public.parceiros where id = p_parceiro;
  foreach g in array array['resultado', 'capacitacao', 'regras'] loop
    rq := public.requisito_vigente(p_nivel, g, v_ref);
    v_ok := true; v_falta := '{}';
    if rq.id is not null then
      if g = 'resultado' and (rq.regra ? 'indicacoes_qualificadas' or rq.regra ? 'clientes_fechados') then
        v_janela := coalesce((rq.regra->>'janela_dias')::int, public.config_int('janela_resultado_dias', 180));
        select count(*) filter (where qualificada),
               count(*) filter (where etapa = 'fechada' and coalesce(icp_confirmado, aderente_icp, false) and data_fechamento >= v_ref - v_janela)
          into v_qual, v_cli
        from public.indicacoes where parceiro_id = p.id and sentido = 'parceiro_para_grupo' and data >= v_ref - v_janela;
        v_ok := v_qual >= coalesce((rq.regra->>'indicacoes_qualificadas')::int, 999999)
             or v_cli >= coalesce((rq.regra->>'clientes_fechados')::int, 999999);
        if not v_ok then
          v_falta := v_falta || format('%s indicações qualificadas ou %s cliente(s) fechado(s) no ICP em %s dias (hoje: %s e %s)',
            rq.regra->>'indicacoes_qualificadas', rq.regra->>'clientes_fechados', v_janela, v_qual, v_cli);
        end if;
      elsif g = 'capacitacao' then
        v_cert := public.pessoas_certificadas(p.id);
        v_resp := public.responsavel_certificado(p.id);
        if coalesce((rq.regra->>'responsavel_certificado')::boolean, false) and not v_resp then
          v_ok := false; v_falta := v_falta || 'Responsável certificado em "Como vender a Wise Makers"'::text;
        end if;
        if v_cert < coalesce((rq.regra->>'pessoas_certificadas')::int, 0) then
          v_ok := false; v_falta := v_falta || format('%s pessoas certificadas (hoje: %s)', rq.regra->>'pessoas_certificadas', v_cert);
        end if;
      elsif g = 'regras' then
        if coalesce((rq.regra->>'contrato')::boolean, false) then
          if not public.parceiro_assinado(p.id) then v_ok := false; v_falta := v_falta || 'Contrato vigente'::text; end if;
          if not exists (select 1 from public.perfis where parceiro_id = p.id and is_responsavel_parceiro and ativo)
             and not exists (select 1 from public.parceiro_contatos where parceiro_id = p.id and 'responsavel_parceria' = any (papeis)) then
            v_ok := false; v_falta := v_falta || 'Responsável nomeado'::text;
          end if;
        end if;
        if rq.regra ? 'contrapartida_atraso_max_dias' then
          v_atraso := (rq.regra->>'contrapartida_atraso_max_dias')::int;
          if exists (select 1 from public.contrapartidas where parceiro_id = p.id and ativa and estado = 'atrasada'
                     and proxima_data < v_ref - v_atraso) then
            v_ok := false; v_falta := v_falta || format('Nenhuma contrapartida atrasada há mais de %s dias', v_atraso);
          end if;
        end if;
        if rq.regra ? 'acoes_comprovadas' then
          select count(*) into v_acoes from public.comprovacoes cp join public.contrapartidas c on c.id = cp.contrapartida_id
           where c.parceiro_id = p.id and cp.estado = 'validada'
             and cp.validada_em::date >= v_ref - coalesce((rq.regra->>'acoes_janela_dias')::int, 90)
             and c.periodicidade not in ('continua', 'na_assinatura');
          if v_acoes < (rq.regra->>'acoes_comprovadas')::int then
            v_ok := false; v_falta := v_falta || format('%s ação conjunta do lado do parceiro concluída e comprovada nos últimos %s dias',
              rq.regra->>'acoes_comprovadas', coalesce(rq.regra->>'acoes_janela_dias', '90'));
          end if;
        end if;
      end if;
    end if;
    v_todos := v_todos and v_ok;
    v_grupos := v_grupos || jsonb_build_object(g, jsonb_build_object('cumprido', v_ok, 'descricao', rq.descricao, 'faltante', to_jsonb(v_falta)));
  end loop;
  return jsonb_build_object('nivel', p_nivel, 'cumpre', v_todos, 'grupos', v_grupos);
end $$;

-- Subida imediata quando cumpre todos os requisitos de um nível acima (FR-119)
create or replace function public.verificar_subida_nivel(p_parceiro uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  p public.parceiros;
  v_alvo text;
  n text;
  v_nome text;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.tipo_parceria <> 'comercial' or p.nivel is null or not public.parceiro_assinado(p.id) or p.nivel = 'A' then return null; end if;
  foreach n in array array['A', 'B'] loop
    if n < p.nivel and v_alvo is null and (public.cumpre_nivel(p.id, n) ->> 'cumpre')::boolean then
      v_alvo := n;
    end if;
  end loop;
  if v_alvo is null then return null; end if;
  update public.parceiros set nivel = v_alvo, nivel_ajuste_motivo = 'Subida por resultado', em_observacao_ate = null where id = p.id;
  insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, detalhes, motivo)
  values (p.id, to_char(public.hoje(), 'YYYY-"T"Q'), p.nivel, 'subida', public.cumpre_nivel(p.id, v_alvo), 'Subida por resultado');
  v_nome := case v_alvo when 'A' then 'Elite' else 'Premium' end;
  perform public.notificar_parceiro(p.id, 'nivel_subida', 'Novo nível no Wise Partners',
    format('Parabéns! Vocês cumpriram os requisitos e passaram para o nível %s. O pacote só muda se vocês escolherem um pacote superior.', v_nome),
    '/parceiro/nivel');
  perform public.notificar_responsavel(p.id, 'nivel_subida', 'Subida de nível por resultado',
    format('%s passou para %s por resultado.', p.nome_fantasia, v_nome), '/app/parceiros/' || p.id || '?aba=nivel');
  return v_alvo;
end $$;

-- Revisão trimestral (FR-120 a FR-122)
create or replace function public.revisao_trimestral(p_ref date default null) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_ref date := coalesce(p_ref, public.hoje());
  v_tri text := to_char(v_ref, 'YYYY-"T"Q');
  v_prox date := (date_trunc('quarter', v_ref) + interval '3 months')::date;
  r record;
  v_res jsonb;
  v_result text;
  n int := 0;
begin
  for r in select * from public.parceiros p where p.tipo_parceria = 'comercial' and public.parceiro_assinado(p.id) and p.nivel is not null
             and not exists (select 1 from public.revisoes_nivel x where x.parceiro_id = p.id and x.trimestre = v_tri and x.resultado <> 'subida') loop
    perform public.verificar_subida_nivel(r.id);
    select * into r from public.parceiros where id = r.id;
    if r.status_atividade = 'pausado' then
      insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, motivo)
      values (r.id, v_tri, r.nivel, 'isento', 'Parceiro pausado');
    elsif v_ref - r.data_assinatura < public.config_int('isencao_revisao_dias', 180) then
      insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, motivo)
      values (r.id, v_tri, r.nivel, 'isento', format('Assinado há menos de %s dias', public.config_int('isencao_revisao_dias', 180)));
    else
      v_res := public.cumpre_nivel(r.id, r.nivel, date_trunc('quarter', v_ref)::date);
      if (v_res->>'cumpre')::boolean then
        v_result := 'cumpre';
        update public.parceiros set em_observacao_ate = null where id = r.id;
      elsif r.em_observacao_ate is not null and r.nivel <> 'C' then
        v_result := 'proposta_rebaixamento';
        perform public.notificar_responsavel(r.id, 'proposta_rebaixamento', 'Proposta de rebaixamento',
          format('%s segue sem cumprir os requisitos do nível depois de um trimestre em observação. Confirme ou mantenha o nível, com motivo.', r.nome_fantasia),
          '/app/parceiros/' || r.id || '?aba=nivel');
      elsif r.nivel = 'C' and r.em_observacao_ate is not null then
        v_result := 'observacao';
      else
        v_result := 'observacao';
        update public.parceiros set em_observacao_ate = v_prox where id = r.id;
        perform public.notificar_parceiro(r.id, 'nivel_observacao', 'Nível em observação',
          format('Neste trimestre vocês não cumpriram todos os requisitos do nível atual. Até %s, confira o que falta em "Meu nível".', to_char(v_prox, 'DD/MM/YYYY')),
          '/parceiro/nivel');
        perform public.notificar_responsavel(r.id, 'nivel_observacao', 'Parceiro em observação',
          format('%s entrou em observação até %s.', r.nome_fantasia, to_char(v_prox, 'DD/MM/YYYY')), '/app/parceiros/' || r.id || '?aba=nivel');
      end if;
      insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, detalhes)
      values (r.id, v_tri, r.nivel, v_result, v_res);
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Decisão sobre a proposta de rebaixamento: nunca automática (FR-121), pacote ajustado depois (FR-123)
create or replace function public.decidir_rebaixamento(p_revisao uuid, p_confirmar boolean, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare
  rv public.revisoes_nivel;
  p public.parceiros;
  v_novo text;
  v_pac text;
  v_data date;
  v_fim_ciclo date;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if coalesce(btrim(p_motivo), '') = '' then raise exception 'Informe o motivo da decisão.' using errcode = 'P0001'; end if;
  select * into rv from public.revisoes_nivel where id = p_revisao;
  if rv.resultado <> 'proposta_rebaixamento' or rv.decisao is not null then
    raise exception 'Esta revisão não tem proposta de rebaixamento pendente.' using errcode = 'P0001';
  end if;
  select * into p from public.parceiros where id = rv.parceiro_id;
  if not p_confirmar then
    update public.revisoes_nivel set decisao = 'mantido', decidido_por = auth.uid(), decidido_em = now(), motivo = p_motivo where id = rv.id;
    update public.parceiros set em_observacao_ate = null where id = p.id;
    return;
  end if;
  v_novo := case p.nivel when 'A' then 'B' else 'C' end;
  if p.pacote is not null and not exists (select 1 from public.pacotes pc where pc.codigo = p.pacote and v_novo = any (pc.niveis_permitidos)) then
    select codigo into v_pac from public.pacotes where v_novo = any (niveis_permitidos) order by ordem desc limit 1;
    select max(inicio + 84) into v_fim_ciclo from public.ciclos_base_ativa where parceiro_id = p.id and estado = 'em_ciclo';
    v_data := greatest(public.hoje() + 30, coalesce(v_fim_ciclo, public.hoje()));
    update public.parceiros set pacote_pendente = v_pac, pacote_pendente_em = v_data,
      pacote_pendente_motivo = 'Rebaixamento confirmado de nível' where id = p.id;
  end if;
  update public.parceiros set nivel = v_novo, nivel_ajuste_motivo = 'Rebaixamento confirmado: ' || p_motivo, em_observacao_ate = null
   where id = p.id;
  update public.revisoes_nivel set decisao = 'confirmado', decidido_por = auth.uid(), decidido_em = now(), motivo = p_motivo,
    pacote_novo = v_pac, pacote_efetivo_em = v_data where id = rv.id;
  perform public.notificar_parceiro(p.id, 'nivel_rebaixamento_confirmado', 'Mudança de nível',
    format('Depois de um trimestre em observação, o nível da parceria passou para %s.%s', case v_novo when 'B' then 'Premium' else 'Select' end,
      case when v_pac is not null then format(' O pacote passa a ser %s em %s.', v_pac, to_char(v_data, 'DD/MM/YYYY')) else '' end),
    '/parceiro/nivel');
end $$;

-- Aplica o pacote pendente na data e desativa o que era exclusivo do pacote anterior
create or replace function public.aplicar_pacotes_pendentes() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select * from public.parceiros where pacote_pendente is not null and pacote_pendente_em <= public.hoje() loop
    update public.contrapartidas c set ativa = false
      from public.catalogo_contrapartidas k
     where c.catalogo_id = k.id and c.parceiro_id = r.id and not (r.pacote_pendente = any (k.pacotes));
    update public.acoes_wise a set ativa = false, estado = case when a.estado in ('planejada', 'atrasada') then 'cancelada' else a.estado end
      from public.catalogo_acoes_wise k
     where a.catalogo_id = k.id and a.parceiro_id = r.id and not (r.pacote_pendente = any (k.pacotes));
    update public.parceiros set pacote = pacote_pendente, pacote_pendente = null, pacote_pendente_em = null, pacote_pendente_motivo = null
     where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------------
-- RLS (matriz do briefing, seção 5)
-- ---------------------------------------------------------------------------
select public._proteger_tabela(t) from unnest(array['catalogo_acoes_wise', 'acoes_wise', 'pontos_ranking', 'premiacoes', 'faixas',
  'regua_atendimento', 'fluxos_desligamento', 'requisitos_nivel', 'revisoes_nivel']) t;
revoke all on public.v_acoes_conjuntas from anon;

create policy caw_ler on public.catalogo_acoes_wise for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy caw_admin on public.catalogo_acoes_wise for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy aw_ler on public.acoes_wise for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or parceiro_id = public.parceiro_atual());
create policy aw_gerir on public.acoes_wise for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy pr_ler on public.pontos_ranking for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy prem_ler on public.premiacoes for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy prem_gerir on public.premiacoes for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());

create policy faixa_ler on public.faixas for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy regua_ler on public.regua_atendimento for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy regua_admin on public.regua_atendimento for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy fluxo_ler on public.fluxos_desligamento for select to authenticated using (public.is_parcerias());

create policy req_ler on public.requisitos_nivel for select to authenticated
  using (public.is_interno_leitura() or public.parceiro_atual() is not null);
create policy req_admin on public.requisitos_nivel for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Revisões: parceiro lê as próprias pela função "meu_nivel" (sem notas internas)
create policy rev_ler on public.revisoes_nivel for select to authenticated using (public.is_parcerias() or public.is_consultor());

-- "Meu nível" do parceiro: nível atual, requisitos do nível acima com progresso, observação (FR-124)
create or replace function public.meu_nivel() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  p public.parceiros;
  v_acima text;
begin
  select * into p from public.parceiros where id = coalesce(public.parceiro_atual(), null);
  if p.id is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  v_acima := case p.nivel when 'C' then 'B' when 'B' then 'A' else null end;
  return jsonb_build_object(
    'nivel', p.nivel, 'tipo', p.tipo_parceria, 'pacote', p.pacote,
    'pacote_pendente', p.pacote_pendente, 'pacote_pendente_em', p.pacote_pendente_em,
    'em_observacao_ate', p.em_observacao_ate,
    'atual', case when p.nivel is not null and p.tipo_parceria = 'comercial' then public.cumpre_nivel(p.id, p.nivel) end,
    'acima', case when v_acima is not null and p.tipo_parceria = 'comercial' then public.cumpre_nivel(p.id, v_acima) end);
end $$;

-- Situação do nível para a ficha interna
create or replace function public.situacao_nivel(p_parceiro uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.parceiros;
begin
  if not (public.is_parcerias() or public.is_consultor()) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into p from public.parceiros where id = p_parceiro;
  return jsonb_build_object(
    'nivel', p.nivel, 'nivel_entrada', p.nivel_entrada, 'em_observacao_ate', p.em_observacao_ate,
    'pacote_pendente', p.pacote_pendente, 'pacote_pendente_em', p.pacote_pendente_em,
    'niveis', jsonb_build_object('C', public.cumpre_nivel(p.id, 'C'), 'B', public.cumpre_nivel(p.id, 'B'), 'A', public.cumpre_nivel(p.id, 'A')),
    'regua', public.regua_status(p.id),
    'faixa', (select to_jsonb(f) from public.faixas f where f.parceiro_id = p.id));
end $$;

do $$
declare f text;
begin
  foreach f in array array['concluir_acao_wise(uuid, jsonb)', 'ranking(int, int)', 'premiacoes_publicas(int)', 'registrar_tentativa_retomada(uuid, text)',
    'abrir_desligamento_inadequacao(uuid, text)', 'decidir_desligamento(uuid, boolean, boolean, text)', 'gerar_aviso_desligamento(uuid)',
    'decidir_rebaixamento(uuid, boolean, text)', 'meu_nivel()', 'situacao_nivel(uuid)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array['gerar_acoes_wise(uuid)', 'lancar_pontos(uuid, text, uuid, date)', 'calcular_faixas()', 'cancelar_desligamento(uuid, text)',
    'avaliar_desligamentos()', 'encerrar_parceria(uuid)', 'notificar_diretores(text, text, text, text)', 'verificar_subida_nivel(uuid)',
    'revisao_trimestral(date)', 'aplicar_pacotes_pendentes()', 'parceiro_em_risco(uuid)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;
