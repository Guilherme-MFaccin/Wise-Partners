-- Portal Wise Partners 2.0: resultado do canal (História 1), painel por etapa da jornada (História 7),
-- maturidade (História 8), regras e comunicados (História 13), metas por pessoa (História 15)

-- ---------------------------------------------------------------------------
-- Planilha de custos e resultado do canal (FR-106 a FR-111, Apêndice M). Só administradores.
-- ---------------------------------------------------------------------------
create or replace function public._planilha_custos(p_inicio date, p_fim date)
returns table (
  data date, tipo_linha text, categoria text, parceiro_id uuid, parceiro text, pessoa_id uuid, pessoa text,
  atividade text, etapa_jornada text, minutos int, custo_hora numeric, valor numeric, empresa text, cliente text,
  cliente_icp boolean, mensalidade numeric, origem_id uuid)
language sql stable security definer set search_path = public as $$
  -- Horas registradas, com o custo-hora da época
  select a.data, 'hora', 'horas', a.parceiro_id, p.nome_fantasia, a.pessoa_id, pf.nome, t.nome, coalesce(a.etapa_jornada, t.etapa_jornada),
         a.minutos, ac.custo_hora, ac.custo, null::text, null::text, null::boolean, null::numeric, a.id
  from public.atividades a
  join public.tipos_atividade t on t.id = a.tipo_atividade_id
  left join public.atividades_custo ac on ac.atividade_id = a.id
  left join public.parceiros p on p.id = a.parceiro_id
  left join public.perfis pf on pf.id = a.pessoa_id
  where a.data between p_inicio and p_fim
  union all
  -- Comissões pagas pelo grupo, na data de fechamento da indicação (mesmo período da receita)
  select i.data_fechamento, case c.beneficiario when 'parceiro' then 'comissao_parceiro' else 'comissao_responsavel' end,
         'comissoes', i.parceiro_id, p.nome_fantasia, c.responsavel_perfil_id, pf.nome, null, null, null, null,
         coalesce(c.valor, 0), e.nome, cl.razao_social, null, null, c.id
  from public.comissoes c
  join public.indicacoes i on i.id = c.indicacao_id
  join public.parceiros p on p.id = i.parceiro_id
  join public.empresas_grupo e on e.id = i.empresa_grupo_id
  join public.clientes cl on cl.id = i.cliente_id
  left join public.perfis pf on pf.id = c.responsavel_perfil_id
  where c.beneficiario in ('parceiro', 'responsavel') and c.estado <> 'cancelada'
    and i.etapa = 'fechada' and i.data_fechamento between p_inicio and p_fim
  union all
  -- Custos diretos (recorrentes: uma linha por mês)
  select d.data, 'custo_direto', d.categoria, d.parceiro_id, p.nome_fantasia, null, null, d.descricao, null, null, null,
         d.valor, null, null, null, null, d.custo_id
  from public.custos_diretos_expandidos(p_inicio, p_fim) d
  left join public.parceiros p on p.id = d.parceiro_id
  union all
  -- Receita atribuída: indicações do parceiro para o grupo fechadas no período
  select i.data_fechamento, 'receita', 'receita', i.parceiro_id, p.nome_fantasia, null, null, null, null, null, null,
         case when e.codigo = 'wise' then coalesce(i.valor_base, 0) * least(coalesce(i.prazo_meses, public.config_int('prazo_contrato_padrao_meses', 12)),
                                                                          public.config_int('horizonte_receita_meses', 12))
              else coalesce(i.valor_total, i.valor_base, 0) end,
         e.nome, cl.razao_social, coalesce(i.icp_confirmado, i.aderente_icp, false),
         case when e.codigo = 'wise' then coalesce(i.valor_base, 0) else 0 end, i.id
  from public.indicacoes i
  join public.parceiros p on p.id = i.parceiro_id
  join public.empresas_grupo e on e.id = i.empresa_grupo_id
  join public.clientes cl on cl.id = i.cliente_id
  where i.sentido = 'parceiro_para_grupo' and i.etapa = 'fechada' and i.data_fechamento between p_inicio and p_fim
  union all
  -- Comissões recebidas pelo grupo de parceiros, pagas no período
  select (c.paga_em at time zone 'America/Sao_Paulo')::date, 'comissao_recebida', 'receita', c.parceiro_id, p.nome_fantasia,
         null, null, null, null, null, null, coalesce(c.valor, 0), e.nome, cl.razao_social, null, null, c.id
  from public.comissoes c
  join public.indicacoes i on i.id = c.indicacao_id
  join public.parceiros p on p.id = c.parceiro_id
  join public.empresas_grupo e on e.id = i.empresa_grupo_id
  join public.clientes cl on cl.id = i.cliente_id
  where c.beneficiario = 'grupo' and c.estado = 'paga' and (c.paga_em at time zone 'America/Sao_Paulo')::date between p_inicio and p_fim
$$;
revoke execute on function public._planilha_custos(date, date) from public, anon, authenticated;

create or replace function public.planilha_custos(p_inicio date, p_fim date)
returns table (
  data date, tipo_linha text, categoria text, parceiro_id uuid, parceiro text, pessoa_id uuid, pessoa text,
  atividade text, etapa_jornada text, minutos int, custo_hora numeric, valor numeric, empresa text, cliente text,
  cliente_icp boolean, mensalidade numeric, origem_id uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Somente administradores veem custos.' using errcode = '42501'; end if;
  return query select * from public._planilha_custos(p_inicio, p_fim) x order by x.data, x.tipo_linha;
end $$;

-- Métricas de um conjunto de linhas da planilha
create or replace function public._metricas_canal(p_linhas jsonb, p_margem numeric) returns jsonb
language plpgsql immutable as $$
declare
  v_horas numeric := 0; v_min_sem int := 0; v_ch numeric := 0; v_cp numeric := 0; v_cr numeric := 0; v_cd numeric := 0;
  v_rec numeric := 0; v_crec numeric := 0; v_cli int := 0; v_mens numeric := 0; v_custo numeric; l jsonb;
begin
  for l in select * from jsonb_array_elements(coalesce(p_linhas, '[]')) loop
    case l->>'tipo_linha'
      when 'hora' then
        v_horas := v_horas + coalesce((l->>'minutos')::numeric, 0) / 60;
        if l->>'custo_hora' is null then v_min_sem := v_min_sem + coalesce((l->>'minutos')::int, 0);
        else v_ch := v_ch + coalesce((l->>'valor')::numeric, 0); end if;
      when 'comissao_parceiro' then v_cp := v_cp + (l->>'valor')::numeric;
      when 'comissao_responsavel' then v_cr := v_cr + (l->>'valor')::numeric;
      when 'custo_direto' then v_cd := v_cd + (l->>'valor')::numeric;
      when 'receita' then
        v_rec := v_rec + (l->>'valor')::numeric;
        v_mens := v_mens + coalesce((l->>'mensalidade')::numeric, 0);
        if (l->>'cliente_icp')::boolean then v_cli := v_cli + 1; end if;
      when 'comissao_recebida' then v_crec := v_crec + (l->>'valor')::numeric;
      else null;
    end case;
  end loop;
  v_custo := v_ch + v_cp + v_cr + v_cd;
  return jsonb_build_object(
    'horas', round(v_horas, 2), 'horas_sem_custo', round(v_min_sem / 60.0, 2), 'custo_horas', round(v_ch, 2),
    'comissoes_parceiro', round(v_cp, 2), 'comissoes_responsavel', round(v_cr, 2), 'custos_diretos', round(v_cd, 2),
    'custo_total', round(v_custo, 2),
    'receita_clientes', round(v_rec, 2), 'comissoes_recebidas', round(v_crec, 2), 'receita_atribuida', round(v_rec + v_crec, 2),
    'receita_margem', round((v_rec + v_crec) * p_margem, 2),
    'roi', case when v_custo > 0 then round(((v_rec + v_crec) * p_margem - v_custo) / v_custo, 6) end,
    'clientes_icp', v_cli,
    'custo_por_cliente', case when v_cli > 0 then round(v_custo / v_cli, 2) end,
    'mensalidade_recorrente', round(v_mens, 2),
    'tempo_retorno_meses', case when v_mens * p_margem > 0 then round(v_custo / (v_mens * p_margem), 2) end);
end $$;

create or replace function public.resultado_canal(p_inicio date, p_fim date, p_agrupar text default 'total') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_margem numeric := public.config_num('margem_contribuicao_pct', 100) / 100;
  v_rateio boolean := coalesce((select (valor #>> '{}')::boolean from public.configuracoes where chave = 'rateio_custo_geral'), false);
  v_linhas jsonb;
  v_total jsonb;
  v_grupos jsonb := '[]';
  v_geral jsonb;
  v_assinados uuid[];
  v_custo_geral numeric;
  v_avisos jsonb := '[]';
  r record;
begin
  if not public.is_admin() then raise exception 'Somente administradores veem o resultado do canal.' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x)), '[]') into v_linhas from public._planilha_custos(p_inicio, p_fim) x;
  v_total := public._metricas_canal(v_linhas, v_margem);
  if (v_total->>'horas_sem_custo')::numeric > 0 then
    v_avisos := v_avisos || to_jsonb(format('%s horas sem custo-hora informado: o custo do canal está subestimado.', v_total->>'horas_sem_custo'));
  end if;

  if p_agrupar <> 'total' then
    -- Custo geral (sem parceiro) à parte; com rateio, dividido igualmente entre os assinados do período
    select public._metricas_canal(coalesce(jsonb_agg(l), '[]'), v_margem) into v_geral
      from jsonb_array_elements(v_linhas) l where l->>'parceiro_id' is null;
    select array_agg(id) into v_assinados from public.parceiros p
     where p.tipo_parceria = 'comercial' and p.data_assinatura is not null and p.data_assinatura <= p_fim and not public.is_etapa_perda(p.etapa);
    v_custo_geral := coalesce((v_geral->>'custo_total')::numeric, 0);

    for r in
      with lp as (
        select l, p.id as pid, p.nome_fantasia, p.nivel, p.modelos_atuacao, coalesce(p.origem_tipo, 'nao_informada') as origem,
               l->>'empresa' as empresa
        from jsonb_array_elements(v_linhas) l join public.parceiros p on p.id = (l->>'parceiro_id')::uuid
      ), chaves as (
        select case p_agrupar
                 when 'parceiro' then pid::text
                 when 'nivel' then coalesce(nivel, 'sem_nivel')
                 when 'origem' then origem
                 when 'empresa' then coalesce(empresa, 'sem_empresa')
               end as chave,
               case p_agrupar when 'parceiro' then nome_fantasia else null end as rotulo, l
        from lp where p_agrupar <> 'modelo'
        union all
        select coalesce(m, 'nao_informado'), null, l from lp left join lateral unnest(nullif(modelos_atuacao, '{}')) m on true
        where p_agrupar = 'modelo'
      )
      select chave, max(rotulo) as rotulo, jsonb_agg(l) as linhas from chaves group by chave
    loop
      v_grupos := v_grupos || (jsonb_build_object('chave', r.chave, 'rotulo', coalesce(r.rotulo, r.chave))
        || public._metricas_canal(
             r.linhas || case when v_rateio and p_agrupar = 'parceiro' and r.chave::uuid = any (v_assinados) and cardinality(v_assinados) > 0
                              then jsonb_build_array(jsonb_build_object('tipo_linha', 'custo_direto', 'valor', v_custo_geral / cardinality(v_assinados)))
                              else '[]'::jsonb end,
             v_margem));
    end loop;
  end if;

  return jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_inicio, 'fim', p_fim),
    'parametros', jsonb_build_object('margem_pct', v_margem * 100, 'rateio', v_rateio,
      'horizonte_meses', public.config_int('horizonte_receita_meses', 12), 'prazo_padrao_meses', public.config_int('prazo_contrato_padrao_meses', 12)),
    'total', v_total, 'grupos', v_grupos, 'geral', v_geral, 'avisos', v_avisos,
    'fase', (select fase from public.fase_programa order by desde desc, created_at desc limit 1),
    'secundarios', jsonb_build_object(
      'assinados', (select count(*) from public.parceiros p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)),
      'reunioes', (select count(*) from public.indicacoes i where i.sentido = 'parceiro_para_grupo' and i.data_reuniao between p_inicio and p_fim)));
end $$;

-- ---------------------------------------------------------------------------
-- Fase do programa, indicadores e metas (Apêndice L)
-- ---------------------------------------------------------------------------
create table public.fase_programa (
  id uuid primary key default gen_random_uuid(),
  fase text not null check (fase in ('experimentacao', 'tracao', 'crescimento', 'otimizacao')),
  desde date not null,
  definida_por uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create trigger t_hist after insert on public.fase_programa for each row execute function public.trg_historico('fase');

create table public.indicadores (
  chave text primary key,
  etapa text not null check (etapa in ('captacao', 'onboarding', 'relacionamento', 'producao', 'canal')),
  nome text not null,
  formato text not null default 'numero' check (formato in ('numero', 'percentual', 'moeda', 'dias', 'lista', 'horas')),
  destaque boolean not null default false,
  so_admin boolean not null default false,
  ordem int not null default 0,
  ativo boolean not null default true
);

create table public.metas (
  indicador_chave text not null references public.indicadores(chave) on delete cascade,
  periodo text not null,           -- '2027' ou '2027-T1'
  valor numeric not null,
  primary key (indicador_chave, periodo)
);

create table public.pesquisas_satisfacao (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  trimestre text not null,
  nota int not null check (nota between 0 and 10),
  comentario text,
  respondida_em timestamptz not null default now(),
  unique (perfil_id, trimestre)
);

create or replace function public.responder_pesquisa(p_nota int, p_comentario text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_parc uuid := public.parceiro_atual();
begin
  if v_parc is null or not public.parceiro_assinado(v_parc) then raise exception 'Pesquisa disponível para parceiros assinados.' using errcode = '42501'; end if;
  insert into public.pesquisas_satisfacao (perfil_id, parceiro_id, trimestre, nota, comentario)
  values (auth.uid(), v_parc, to_char(public.hoje(), 'YYYY-"T"Q'), p_nota, nullif(btrim(p_comentario), ''));
exception when unique_violation then
  raise exception 'Você já respondeu a pesquisa deste trimestre.' using errcode = 'P0001';
end $$;

create or replace function public.enviar_pesquisa_trimestral() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select pf.id from public.perfis pf join public.parceiros p on p.id = pf.parceiro_id
           where pf.ativo and pf.papel = 'parceiro' and public.parceiro_assinado(p.id) loop
    perform public.notificar(r.id, 'pesquisa_satisfacao', 'Pesquisa de satisfação do Wise Partners',
      'Conte como está a parceria com a Wise. Leva menos de 1 minuto.', '/parceiro/pesquisa', '{}'::jsonb, true);
    n := n + 1;
  end loop;
  return n;
end $$;

-- NPS: % promotores (9 e 10) menos % detratores (0 a 6)
create or replace function public.nps(p_inicio date, p_fim date) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('respostas', count(*),
    'nps', case when count(*) > 0 then round((count(*) filter (where nota >= 9) - count(*) filter (where nota <= 6))::numeric * 100 / count(*)) end,
    'media', round(avg(nota), 1))
  from public.pesquisas_satisfacao where respondida_em::date between p_inicio and p_fim
$$;

-- ---------------------------------------------------------------------------
-- Matriz de maturidade (Apêndice J)
-- ---------------------------------------------------------------------------
create table public.avaliacoes_maturidade (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  notas jsonb not null,                    -- {eixo: 1..5}
  sugestoes jsonb not null default '{}',   -- {eixo: {nota, motivo}}
  media numeric(3,2),
  categoria text check (categoria in ('fundacao', 'desenvolvimento', 'escala')),
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.avaliacoes_maturidade (parceiro_id, created_at desc);

create or replace function public.trg_maturidade() returns trigger
language plpgsql security definer set search_path = public as $$
declare v numeric; e text;
begin
  foreach e in array array['objetivo', 'modelo', 'aderencia', 'capacitacao', 'mercado', 'programa', 'relacionamento', 'resultado'] loop
    v := (new.notas ->> e)::numeric;
    if v is null or v < 1 or v > 5 then raise exception 'Informe a nota de 1 a 5 em todos os 8 eixos.' using errcode = 'P0001'; end if;
  end loop;
  select round(avg(value::numeric), 2) into new.media from jsonb_each_text(new.notas);
  new.categoria := case when new.media < 2.5 then 'fundacao' when new.media < 4 then 'desenvolvimento' else 'escala' end;
  return new;
end $$;
create trigger t_maturidade before insert on public.avaliacoes_maturidade for each row execute function public.trg_maturidade();
create trigger t_hist after insert on public.avaliacoes_maturidade for each row execute function public.trg_historico('categoria');

-- Nota sugerida e o porquê, por eixo, a partir dos dados do portal (FR-142)
create or replace function public.sugerir_maturidade(p_parceiro uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  p public.parceiros;
  sc public.scorecards;
  v_proposta boolean;
  v_fechados int; v_qual int; v_ind_p int; v_ind_g int; v_acoes int; v_cruz int;
  v_cert int; v_resp boolean; v_trilha boolean; v_ativ boolean;
  v_nivel jsonb; v_acima jsonb; v_regua jsonb; v_sat numeric; v_ativos12 int;
  v_obs boolean; v_atraso boolean;
  r jsonb := '{}';
  n int;
begin
  if not (public.is_parcerias() or public.is_consultor()) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into p from public.parceiros where id = p_parceiro;
  sc := public.scorecard_vigente(p.id);
  v_proposta := coalesce(btrim(p.valor_desejado), '') <> '' and coalesce(btrim(p.oferta_valor), '') <> ''
                and coalesce(btrim(p.entrega_valor), '') <> '' and coalesce(btrim(p.valor_criado), '') <> '';
  select count(*) filter (where etapa = 'fechada'), count(*) filter (where qualificada),
         count(*) filter (where sentido = 'parceiro_para_grupo' and data >= public.hoje() - 180),
         count(*) filter (where sentido = 'grupo_para_parceiro' and data >= public.hoje() - 180)
    into v_fechados, v_qual, v_ind_p, v_ind_g
  from public.indicacoes where parceiro_id = p.id;
  select count(*) into v_acoes from public.v_acoes_conjuntas a
   where a.parceiro_id = p.id and a.concluida_em >= public.hoje() - 180;
  select count(*) into v_cruz from public.cruzamentos where parceiro_id = p.id;

  -- 1. Objetivo comum
  n := case when not v_proposta then 1 when v_fechados > 0 then 4 else 3 end;
  r := r || jsonb_build_object('objetivo', jsonb_build_object('nota', n, 'motivo',
    case when not v_proposta then 'Proposta de valor sem os 4 pontos' when v_fechados > 0 then 'Proposta de valor preenchida e cliente fechado'
         else 'Proposta de valor com os 4 pontos' end));
  -- 2. Modelo e regras
  n := case when cardinality(p.modelos_atuacao) = 0 then 1
            when not public.parceiro_assinado(p.id) then 2
            when v_ind_p > 0 and v_ind_g > 0 then 5
            when v_ind_p > 0 or v_ind_g > 0 then 4 else 3 end;
  r := r || jsonb_build_object('modelo', jsonb_build_object('nota', n, 'motivo', case n
    when 1 then 'Modelo de atuação indefinido' when 2 then 'Modelo definido, contrato ainda não assinado'
    when 3 then 'Modelo definido e contrato assinado' when 4 then 'Indicações em um sentido'
    else 'Indicações nos dois sentidos' end));
  -- 3. Aderência ao perfil
  n := case when sc.nota_potencial is null then 1 when sc.nota_potencial >= 90 then 5 when sc.nota_potencial >= 75 then 4
            when sc.nota_potencial >= 60 then 3 when sc.nota_potencial >= 40 then 2 else 1 end;
  r := r || jsonb_build_object('aderencia', jsonb_build_object('nota', n, 'motivo',
    coalesce('Nota de potencial do scorecard: ' || sc.nota_potencial || '%', 'Sem scorecard completo')));
  -- 4. Capacitação
  v_cert := public.pessoas_certificadas(p.id);
  v_resp := public.responsavel_certificado(p.id);
  v_trilha := exists (select 1 from public.trilha_progresso where parceiro_id = p.id);
  v_ativ := exists (select 1 from public.planos_onboarding where parceiro_id = p.id and situacao = 'ativado');
  n := case when v_cert >= 2 and v_ativ then 5 when v_cert >= 2 then 4 when v_resp then 3 when v_trilha then 2 else 1 end;
  r := r || jsonb_build_object('capacitacao', jsonb_build_object('nota', n, 'motivo', format('%s pessoas certificadas%s', v_cert,
    case when v_ativ then ', parceiro ativado' else '' end)));
  -- 5. Ida ao mercado conjunta
  n := case when v_ind_p + v_ind_g = 0 and v_acoes = 0 then 1
            when v_ind_p > 0 and v_ind_g > 0 and v_acoes >= 2 and v_cruz > 0 then 5
            when (v_ind_p > 0 and v_ind_g > 0) or v_acoes >= 2 then 4
            when v_ind_p + v_ind_g > 0 and v_acoes > 0 then 3 else 2 end;
  r := r || jsonb_build_object('mercado', jsonb_build_object('nota', n, 'motivo',
    format('Em 180 dias: %s indicações do parceiro, %s da Wise, %s ações concluídas%s', v_ind_p, v_ind_g, v_acoes,
      case when v_cruz > 0 then ', cruzamento feito' else '' end)));
  -- 6. Programa
  v_obs := p.em_observacao_ate is not null;
  v_atraso := exists (select 1 from public.contrapartidas where parceiro_id = p.id and ativa and estado = 'atrasada');
  if p.nivel is not null and p.tipo_parceria = 'comercial' then
    v_nivel := public.cumpre_nivel(p.id, p.nivel);
    v_acima := case when p.nivel in ('B', 'C') then public.cumpre_nivel(p.id, case p.nivel when 'C' then 'B' else 'A' end) end;
  end if;
  n := case when v_obs or v_atraso then 1
            when coalesce((v_acima->>'cumpre')::boolean, false) then 5
            when coalesce((v_nivel->>'cumpre')::boolean, false) then 3 else 2 end;
  r := r || jsonb_build_object('programa', jsonb_build_object('nota', n, 'motivo', case
    when v_obs then 'Em observação' when v_atraso then 'Contrapartidas atrasadas'
    when n = 5 then 'Cumpre os requisitos do nível acima' when n = 3 then 'Cumpre os requisitos do nível atual'
    else 'Requisitos do nível atual ainda não cumpridos' end));
  -- 7. Relacionamento
  v_regua := public.regua_status(p.id);
  select avg(nota) into v_sat from public.pesquisas_satisfacao where parceiro_id = p.id and respondida_em > now() - interval '1 year';
  n := case when coalesce((v_regua->>'atrasada')::boolean, false) and p.status_atividade in ('morno', 'dormente') then 1
            when coalesce((v_regua->>'atrasada')::boolean, false) then 2
            when v_sat >= 9 and p.status_atividade = 'ativo' then 5
            when v_sat >= 7 then 4 else 3 end;
  r := r || jsonb_build_object('relacionamento', jsonb_build_object('nota', n, 'motivo', format('Régua %s%s',
    case when coalesce((v_regua->>'atrasada')::boolean, false) then 'atrasada' else 'em dia' end,
    case when v_sat is not null then ', satisfação média ' || round(v_sat, 1) else '' end)));
  -- 8. Gestão e resultado
  select count(*) into v_ativos12 from public.checagens_cliente where parceiro_id = p.id and marco = '12m' and cliente_ativo;
  n := case when v_fechados = 0 and v_qual = 0 then 1 when v_ativos12 > 0 then 5 when v_fechados > 0 then 3 else 2 end;
  r := r || jsonb_build_object('resultado', jsonb_build_object('nota', n, 'motivo',
    format('%s clientes fechados, %s ativos aos 12 meses', v_fechados, v_ativos12)));
  return r;
end $$;

-- ---------------------------------------------------------------------------
-- Regras do programa publicadas e comunicados (FR-167 a FR-169)
-- ---------------------------------------------------------------------------
create table public.versoes_regras (
  id uuid primary key default gen_random_uuid(),
  versao int not null unique,
  conteudo jsonb not null,
  mudancas text,
  vigente_desde date not null,
  afeta_parceiros boolean not null default true,
  publicada_por uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.comunicados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  corpo text not null,
  tipo text not null default 'outro' check (tipo in ('regra', 'evento', 'material', 'outro')),
  recorte jsonb not null default '{}',   -- {niveis:[], pacotes:[], categorias:[], tipos:[]}; vazio = todos
  versao_regras_id uuid references public.versoes_regras(id),
  enviado_em timestamptz,
  enviado_por uuid references public.perfis(id),
  created_by uuid references public.perfis(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.comunicado_leituras (
  comunicado_id uuid not null references public.comunicados(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  parceiro_id uuid references public.parceiros(id) on delete cascade,
  enviado_em timestamptz not null default now(),
  lido_em timestamptz,
  primary key (comunicado_id, perfil_id)
);
create trigger t_hist after insert or update on public.comunicados for each row execute function public.trg_historico('titulo', 'enviado_em');
create trigger t_hist after insert on public.versoes_regras for each row execute function public.trg_historico('versao');

-- Retrato das regras vigentes, para a página do parceiro (nunca a comissão do responsável)
create or replace function public.regras_retrato() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'niveis', (select jsonb_agg(jsonb_build_object('codigo', n.codigo, 'nome', n.nome, 'faixa_min', n.faixa_min, 'faixa_max', n.faixa_max,
                 'requisitos', (select jsonb_agg(jsonb_build_object('grupo', r.grupo, 'descricao', r.descricao) order by r.grupo)
                                from public.requisitos_nivel r where r.nivel = n.codigo
                                  and r.vigente_desde = (select max(vigente_desde) from public.requisitos_nivel r2
                                                         where r2.nivel = r.nivel and r2.grupo = r.grupo and r2.vigente_desde <= public.hoje())))
                 order by n.codigo desc) from public.niveis n where n.tipo_parceria = 'comercial'),
    'pacotes', (select jsonb_agg(jsonb_build_object('codigo', codigo, 'nome', nome, 'entregas', entregas) order by ordem) from public.pacotes),
    'comissoes', (select jsonb_agg(jsonb_build_object('empresa', nome, 'base', base_calculo, 'percentual_parceiro', pct_parceiro) order by ordem)
                  from public.empresas_grupo),
    'protecao_dias', public.config_int('protecao_indicacao_dias', 180),
    'sla', jsonb_build_object('validacao_dias_uteis', public.config_int('sla_validacao_dias_uteis', 2),
      'retorno_parceiro_dias_uteis', public.config_int('sla_retorno_parceiro_dias_uteis', 5),
      'atualizacao_dias', public.config_int('sla_atualizacao_dias', 15),
      'parceiro_contato_dias_uteis', public.config_int('sla_parceiro_contato_dias_uteis', 2),
      'parceiro_atualizacao_dias_uteis', public.config_int('sla_parceiro_atualizacao_dias_uteis', 5)),
    'regua', (select jsonb_agg(jsonb_build_object('chave', chave, 'descricao', descricao) order by chave) from public.regua_atendimento where chave like 'pacote:%'),
    'desligamento', jsonb_build_object('dias_assinatura', public.config_int('risco_dias_assinatura', 180),
      'janela_dias', public.config_int('risco_janela_dias', 180), 'intervalo_tentativas', public.config_int('retomada_intervalo_dias', 15),
      'espera_dias', public.config_int('retomada_espera_dias', 30), 'aviso_dias', public.config_int('aviso_desligamento_dias', 30)),
    'ranking', public.config('pontos_ranking'),
    'premiacao', public.config('categorias_premiacao'),
    'revisao', jsonb_build_object('janela_dias', public.config_int('janela_resultado_dias', 180), 'isencao_dias', public.config_int('isencao_revisao_dias', 180)))
$$;

-- Publica uma versão das regras (vigência mínima de 30 dias quando afeta parceiros) e abre o rascunho de comunicado
create or replace function public.publicar_regras(p_vigencia date, p_mudancas text, p_afeta_parceiros boolean default true) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_versao int;
  v_min date := public.hoje() + public.config_int('vigencia_minima_regra_dias', 30);
begin
  if not public.is_admin() then raise exception 'Somente administradores publicam regras.' using errcode = '42501'; end if;
  if p_afeta_parceiros and p_vigencia < v_min and exists (select 1 from public.versoes_regras) then
    raise exception 'Mudança de regra que afeta parceiros precisa de vigência a partir de %.', to_char(v_min, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;
  select coalesce(max(versao), 0) + 1 into v_versao from public.versoes_regras;
  insert into public.versoes_regras (versao, conteudo, mudancas, vigente_desde, afeta_parceiros)
  values (v_versao, public.regras_retrato(), p_mudancas, p_vigencia, p_afeta_parceiros) returning id into v_id;
  update public.configuracoes set valor = jsonb_build_object('versao', v_versao, 'vigente_desde', p_vigencia), updated_at = now()
   where chave = 'regras_publicadas';
  if p_afeta_parceiros and v_versao > 1 then
    insert into public.comunicados (titulo, corpo, tipo, versao_regras_id)
    values (format('Regras do programa: versão %s, vigente a partir de %s', v_versao, to_char(p_vigencia, 'DD/MM/YYYY')),
            coalesce(p_mudancas, 'As regras do programa foram atualizadas.'), 'regra', v_id);
  end if;
  return v_id;
end $$;

-- Para o parceiro: a versão vigente e a próxima, se houver
create or replace function public.regras_publicadas() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'vigente', (select to_jsonb(v) - 'publicada_por' from public.versoes_regras v where v.vigente_desde <= public.hoje() order by v.vigente_desde desc, v.versao desc limit 1),
    'proxima', (select to_jsonb(v) - 'publicada_por' from public.versoes_regras v where v.vigente_desde > public.hoje() order by v.vigente_desde, v.versao limit 1))
  where public.papel_atual() is not null
$$;

create or replace function public.enviar_comunicado(p_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare
  c public.comunicados;
  r record;
  n int := 0;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.comunicados where id = p_id;
  if c.enviado_em is not null then raise exception 'Comunicado já enviado.' using errcode = 'P0001'; end if;
  for r in
    select pf.id as perfil_id, p.id as parceiro_id from public.perfis pf join public.parceiros p on p.id = pf.parceiro_id
    where pf.ativo and pf.papel = 'parceiro' and public.parceiro_assinado(p.id)
      and (coalesce(jsonb_array_length(c.recorte->'niveis'), 0) = 0 or p.nivel in (select jsonb_array_elements_text(c.recorte->'niveis')))
      and (coalesce(jsonb_array_length(c.recorte->'pacotes'), 0) = 0 or p.pacote in (select jsonb_array_elements_text(c.recorte->'pacotes')))
      and (coalesce(jsonb_array_length(c.recorte->'tipos'), 0) = 0 or p.tipo_parceria in (select jsonb_array_elements_text(c.recorte->'tipos')))
      and (coalesce(jsonb_array_length(c.recorte->'categorias'), 0) = 0 or exists (
            select 1 from public.parceiro_categorias pc where pc.parceiro_id = p.id
            and pc.categoria_id::text in (select jsonb_array_elements_text(c.recorte->'categorias'))))
  loop
    insert into public.comunicado_leituras (comunicado_id, perfil_id, parceiro_id) values (c.id, r.perfil_id, r.parceiro_id) on conflict do nothing;
    perform public.notificar(r.perfil_id, 'comunicado', c.titulo, left(c.corpo, 500), '/parceiro/comunicados', jsonb_build_object('comunicado_id', c.id), true);
    n := n + 1;
  end loop;
  update public.comunicados set enviado_em = now(), enviado_por = auth.uid() where id = c.id;
  return n;
end $$;

create or replace function public.marcar_comunicado_lido(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.comunicado_leituras set lido_em = coalesce(lido_em, now()) where comunicado_id = p_id and perfil_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Carteira e metas por pessoa (FR-178, FR-179)
-- ---------------------------------------------------------------------------
create table public.metas_pessoa (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  trimestre text not null,
  indicador text not null check (indicador in ('assinados', 'ativados', 'clientes_icp', 'receita')),
  valor numeric not null,
  primary key (perfil_id, trimestre, indicador)
);

-- Responsável pelo parceiro numa data, pelo histórico de trocas
create or replace function public.responsavel_em(p_parceiro uuid, p_data date) returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select nullif(h.valor_novo, '')::uuid from public.historico h
      where h.tabela = 'parceiros' and h.registro_id = p_parceiro and h.campo = 'responsavel_id'
        and (h.created_at at time zone 'America/Sao_Paulo')::date <= p_data
      order by h.created_at desc limit 1),
    (select nullif(h.valor_anterior, '')::uuid from public.historico h
      where h.tabela = 'parceiros' and h.registro_id = p_parceiro and h.campo = 'responsavel_id'
        and (h.created_at at time zone 'America/Sao_Paulo')::date > p_data
      order by h.created_at limit 1),
    (select responsavel_id from public.parceiros where id = p_parceiro))
$$;

create or replace function public.painel_pessoal(p_perfil uuid default null, p_trimestre text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_perfil uuid := coalesce(p_perfil, auth.uid());
  v_tri text := coalesce(p_trimestre, to_char(public.hoje(), 'YYYY-"T"Q'));
  v_ini date := make_date(split_part(v_tri, '-T', 1)::int, (split_part(v_tri, '-T', 2)::int - 1) * 3 + 1, 1);
  v_fim date := (v_ini + interval '3 months')::date - 1;
  v_real jsonb;
begin
  if not (public.is_admin() or (public.is_parcerias() and v_perfil = auth.uid())) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  v_real := jsonb_build_object(
    'assinados', (select count(*) from public.parceiros p where p.data_assinatura between v_ini and v_fim
                   and public.responsavel_em(p.id, p.data_assinatura) = v_perfil),
    'ativados', (select count(*) from public.planos_onboarding pl where pl.ativado_em between v_ini and v_fim
                   and public.responsavel_em(pl.parceiro_id, pl.ativado_em) = v_perfil),
    'clientes_icp', (select count(*) from public.indicacoes i where i.sentido = 'parceiro_para_grupo' and i.etapa = 'fechada'
                   and coalesce(i.icp_confirmado, i.aderente_icp, false) and i.data_fechamento between v_ini and v_fim
                   and public.responsavel_em(i.parceiro_id, i.data_fechamento) = v_perfil),
    'receita', (select coalesce(sum(x.valor), 0) from public._planilha_custos(v_ini, v_fim) x
                 where x.tipo_linha = 'receita' and public.responsavel_em(x.parceiro_id, x.data) = v_perfil));
  return jsonb_build_object(
    'trimestre', v_tri, 'inicio', v_ini, 'fim', v_fim, 'realizado', v_real,
    'metas', (select coalesce(jsonb_object_agg(indicador, valor), '{}') from public.metas_pessoa where perfil_id = v_perfil and trimestre = v_tri),
    'horas', (select round(coalesce(sum(minutos), 0) / 60.0, 1) from public.atividades where pessoa_id = v_perfil and data between v_ini and v_fim),
    'carteira', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'etapa', p.etapa,
                   'nivel', p.nivel, 'status', p.status_atividade, 'regua', public.regua_status(p.id)) order by p.nome_fantasia), '[]')
                 from public.parceiros p where p.responsavel_id = v_perfil and not public.is_etapa_perda(p.etapa)));
end $$;

-- ---------------------------------------------------------------------------
-- Painel por etapa da jornada (FR-137): valor, período anterior e meta de cada indicador
-- ---------------------------------------------------------------------------
create or replace function public._indicadores_valores(p_ini date, p_fim date, p_admin boolean) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v jsonb := '{}';
  v_assin int; v_cad int; v_meta int := public.config_int('meta_assinados', 100);
  v_res jsonb;
  v_ind int; v_reun int; v_prop int; v_fech int;
  v_sla_tot int; v_sla_ok int;
  v_ativos int;
  v_plan int; v_plan90 int;
  v_marcos int; v_marcos_ok int;
  v_cp int; v_cp_ok int;
  v_reg int; v_reg_ok int;
begin
  -- Captação
  select count(*) filter (where data_assinatura is not null and not public.is_etapa_perda(etapa)) into v_assin from public.parceiros;
  select count(*) into v_cad from public.parceiros where created_at::date between p_ini and p_fim;
  v := v || jsonb_build_object(
    'assinados_meta', jsonb_build_object('valor', v_assin, 'meta', v_meta),
    'conversao_recrutamento', (select case when count(*) > 0 then round(count(*) filter (where data_assinatura is not null)::numeric * 100 / count(*), 1) end
                               from public.parceiros where tipo_parceria = 'comercial' and etapa <> 'sem_contato'),
    'conversao_origem', (select coalesce(jsonb_object_agg(o, jsonb_build_object('cadastrados', c, 'assinados', a)), '{}') from (
                           select coalesce(origem_tipo, 'nao_informada') o, count(*) c, count(*) filter (where data_assinatura is not null) a
                           from public.parceiros group by 1) x),
    'tempo_ate_assinatura', (select round(avg(data_assinatura - created_at::date)) from public.parceiros where data_assinatura between p_ini and p_fim),
    'nota_scorecard', (select round(avg(s.nota_potencial), 1) from public.parceiros p cross join lateral public.scorecard_vigente(p.id) s where s.completo),
    'perdas_motivo', (select coalesce(jsonb_object_agg(etapa, n), '{}') from (select etapa, count(*) n from public.parceiros where public.is_etapa_perda(etapa) group by 1) x),
    'em_nutricao', (select count(*) from public.parceiros where etapa = 'nutricao'),
    'negociacoes_paradas', (select count(*) from public.parceiros p
                            where (p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, public.hoje()) >= public.config_int('parada_contato_feito_dias_uteis', 4))
                               or (p.etapa = 'proposta_decisor' and public.hoje() - p.etapa_desde::date >= public.config_int('parada_proposta_dias', 7))));

  -- Onboarding
  select count(*), count(*) filter (where situacao = 'ativado' and dias_ate_ativacao <= public.config_int('onboarding_dias', 90))
    into v_plan, v_plan90 from public.planos_onboarding where prazo_final <= public.hoje() or situacao = 'ativado';
  select count(*), count(*) filter (where cumprido_em is not null and cumprido_em <= prazo) into v_marcos, v_marcos_ok
    from public.marcos_onboarding where prazo <= public.hoje();
  v := v || jsonb_build_object(
    'ativados', (select count(*) from public.planos_onboarding where ativado_em between p_ini and p_fim),
    'tempo_primeira_indicacao', (select round(avg(dias_ate_primeira_indicacao)) from public.planos_onboarding where primeira_indicacao_em between p_ini and p_fim),
    'tempo_ativacao', (select round(avg(dias_ate_ativacao)) from public.planos_onboarding where ativado_em between p_ini and p_fim),
    'marcos_cumpridos', case when v_marcos > 0 then round(v_marcos_ok::numeric * 100 / v_marcos, 1) end,
    'pessoas_certificadas', (select count(distinct c.perfil_id) from public.certificados c join public.perfis pf on pf.id = c.perfil_id where c.ativo and pf.ativo),
    'ativados_90', case when v_plan > 0 then round(v_plan90::numeric * 100 / v_plan, 1) end,
    'nao_ativados', (select count(*) from public.planos_onboarding where situacao = 'nao_ativado'));

  -- Relacionamento
  select count(*) filter (where status_atividade = 'ativo') into v_ativos from public.parceiros
   where data_assinatura is not null and not public.is_etapa_perda(etapa);
  select count(*), count(*) filter (where estado <> 'atrasada') into v_cp, v_cp_ok from public.v_acoes_conjuntas where ativa and data_prevista <= public.hoje();
  select count(*), count(*) filter (where not (public.regua_status(id)->>'atrasada')::boolean)
    into v_reg, v_reg_ok from public.parceiros p where (public.regua_status(p.id)->>'aplica')::boolean;
  v := v || jsonb_build_object(
    'ativos_sobre_assinados', case when v_assin > 0 then round(v_ativos::numeric * 100 / v_assin, 1) end,
    'nps', public.nps(p_ini, p_fim),
    'regua_em_dia', case when v_reg > 0 then round(v_reg_ok::numeric * 100 / v_reg, 1) end,
    'acoes_em_dia', case when v_cp > 0 then round(v_cp_ok::numeric * 100 / v_cp, 1) end,
    'distribuicao_nivel', (select coalesce(jsonb_object_agg(coalesce(nivel, 'sem'), n), '{}') from (
                             select nivel, count(*) n from public.parceiros where data_assinatura is not null and not public.is_etapa_perda(etapa)
                             and tipo_parceria = 'comercial' group by 1) x),
    'distribuicao_faixa', (select coalesce(jsonb_object_agg(faixa, n), '{}') from (select faixa, count(*) n from public.faixas group by 1) x),
    'saida_parceiros', (select count(*) from public.parceiros where data_encerramento between p_ini and p_fim),
    'em_observacao', (select count(*) from public.parceiros where em_observacao_ate is not null),
    'em_risco', (select count(*) from public.fluxos_desligamento where estado in ('em_risco', 'tentativa_1', 'tentativa_2', 'sugerido')),
    'propostas_rebaixamento', (select count(*) from public.revisoes_nivel where resultado = 'proposta_rebaixamento' and decisao is null));

  -- Produção
  select count(*), count(*) filter (where data_reuniao is not null), count(*) filter (where etapa in ('proposta', 'fechada')),
         count(*) filter (where etapa = 'fechada')
    into v_ind, v_reun, v_prop, v_fech
  from public.indicacoes where sentido = 'parceiro_para_grupo' and data between p_ini and p_fim;
  select count(*), count(*) filter (where cardinality(public.sla_vencidos(i)) = 0)
    into v_sla_tot, v_sla_ok from public.indicacoes i where i.data between p_ini and p_fim;
  v := v || jsonb_build_object(
    'clientes_icp', (select count(*) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada'
                     and coalesce(icp_confirmado, aderente_icp, false) and data_fechamento between p_ini and p_fim),
    'conversao_indicacoes', jsonb_build_object('indicacoes', v_ind, 'reunioes', v_reun, 'propostas', v_prop, 'vendas', v_fech),
    'indicacoes_sla', case when v_sla_tot > 0 then round(v_sla_ok::numeric * 100 / v_sla_tot, 1) end,
    'ciclo_venda', jsonb_build_object(
      'parceiro', (select round(avg(data_fechamento - data)) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada'
                   and data_fechamento between p_ini and p_fim),
      'direta', (select nullif(valor #>> '{}', 'null')::numeric from public.configuracoes where chave = 'ciclo_venda_direta_dias')),
    'clientes_ativos_checagem', (select jsonb_build_object(
      'ativos_6m', count(*) filter (where marco = '6m' and cliente_ativo), 'checados_6m', count(*) filter (where marco = '6m' and registrada_em is not null),
      'ativos_12m', count(*) filter (where marco = '12m' and cliente_ativo), 'checados_12m', count(*) filter (where marco = '12m' and registrada_em is not null),
      'satisfacao', round(avg(satisfacao), 1)) from public.checagens_cliente),
    'eficiencia_vendas', case when v_ativos > 0 then round(v_fech::numeric / v_ativos, 2) end,
    'indicacoes_por_parceiro', case when v_assin > 0 then round(v_ind::numeric / v_assin, 2) end,
    'nota_qualidade', (select round(avg(nota_qualidade), 1) from public.indicacoes where data between p_ini and p_fim));

  -- Resultado do canal (só administradores)
  if p_admin then
    v_res := public._metricas_canal((select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public._planilha_custos(p_ini, p_fim) x),
                                    public.config_num('margem_contribuicao_pct', 100) / 100);
    v := v || jsonb_build_object(
      'roi', v_res->'roi',
      'custo_total_tipo', jsonb_build_object('horas', v_res->'custo_horas', 'comissoes', (v_res->>'comissoes_parceiro')::numeric + (v_res->>'comissoes_responsavel')::numeric,
                                            'diretos', v_res->'custos_diretos', 'total', v_res->'custo_total'),
      'custo_por_cliente', v_res->'custo_por_cliente',
      'tempo_retorno', v_res->'tempo_retorno_meses',
      'horas_parceiro_etapa', (select coalesce(jsonb_object_agg(coalesce(etapa_jornada, 'sem_etapa'), h), '{}') from (
                                 select etapa_jornada, round(sum(minutos) / 60.0, 1) h from public.atividades where data between p_ini and p_fim group by 1) x),
      'receita_atribuida', v_res->'receita_atribuida',
      'participacao_receita', case when public.config_num('receita_nova_wise_periodo', 0) > 0
                                   then round((v_res->>'receita_atribuida')::numeric * 100 / public.config_num('receita_nova_wise_periodo', 0), 1) end,
      'receita_por_nivel', (select coalesce(jsonb_object_agg(coalesce(p.nivel, 'sem'), s), '{}') from (
                              select x.parceiro_id, sum(x.valor) s from public._planilha_custos(p_ini, p_fim) x where x.tipo_linha = 'receita' group by 1) y
                            join public.parceiros p on p.id = y.parceiro_id));
  end if;
  return v;
end $$;
revoke execute on function public._indicadores_valores(date, date, boolean) from public, anon, authenticated;

create or replace function public.painel_v2(p_inicio date default null, p_fim date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_fim date := coalesce(p_fim, public.hoje());
  v_ini date := coalesce(p_inicio, v_fim - 7);
  v_dias int := v_fim - v_ini + 1;
  v_admin boolean := public.is_admin();
  v_atual jsonb;
  v_ant jsonb;
  v_periodo_meta text[] := array[to_char(v_ini, 'YYYY-"T"Q'), to_char(v_ini, 'YYYY')];
begin
  if not public.is_interno() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  v_atual := public._indicadores_valores(v_ini, v_fim, v_admin);
  v_ant := public._indicadores_valores(v_ini - v_dias, v_ini - 1, v_admin);
  return jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'fase', (select fase from public.fase_programa order by desde desc, created_at desc limit 1),
    'sugestao_fase', public.sugerir_fase(),
    'indicadores', (select coalesce(jsonb_agg(jsonb_build_object(
        'chave', i.chave, 'etapa', i.etapa, 'nome', i.nome, 'formato', i.formato, 'destaque', i.destaque,
        'valor', v_atual -> i.chave, 'anterior', v_ant -> i.chave,
        'meta', (select m.valor from public.metas m where m.indicador_chave = i.chave and m.periodo = any (v_periodo_meta) order by length(m.periodo) desc limit 1))
        order by i.etapa, i.ordem), '[]')
      from public.indicadores i where i.ativo and (v_admin or not i.so_admin)),
    'comentarios_satisfacao', (select coalesce(jsonb_agg(jsonb_build_object('nota', s.nota, 'comentario', s.comentario, 'trimestre', s.trimestre,
        'pessoa', case when public.is_parcerias() then pf.nome end, 'parceiro', case when public.is_parcerias() then p.nome_fantasia end)
        order by s.respondida_em desc), '[]')
      from public.pesquisas_satisfacao s join public.perfis pf on pf.id = s.perfil_id join public.parceiros p on p.id = s.parceiro_id
      where s.comentario is not null and s.respondida_em::date between v_ini and v_fim));
end $$;

-- Critérios de passagem de fase (sugestão; o administrador confirma)
create or replace function public.sugerir_fase() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_fase text := coalesce((select fase from public.fase_programa order by desde desc, created_at desc limit 1), 'experimentacao');
  v_ativ int := (select count(*) from public.planos_onboarding where situacao = 'ativado');
  v_cli int := (select count(*) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada' and coalesce(icp_confirmado, aderente_icp, false));
  v_resp int := (select count(*) from public.pesquisas_satisfacao);
  v_crit jsonb;
begin
  if auth.uid() is not null and not (public.is_parcerias() or public.is_consultor()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if v_fase = 'experimentacao' then
    v_crit := jsonb_build_array(
      jsonb_build_object('nome', 'Parceiros ativados', 'atual', v_ativ, 'meta', 5, 'ok', v_ativ >= 5),
      jsonb_build_object('nome', 'Clientes fechados no ICP via parceiros', 'atual', v_cli, 'meta', 3, 'ok', v_cli >= 3),
      jsonb_build_object('nome', 'Respostas na pesquisa de satisfação', 'atual', v_resp, 'meta', 5, 'ok', v_resp >= 5));
    return jsonb_build_object('fase', v_fase, 'proxima', 'tracao', 'criterios', v_crit,
      'pronta', v_ativ >= 5 and v_cli >= 3 and v_resp >= 5);
  elsif v_fase = 'tracao' then
    v_crit := jsonb_build_array(
      jsonb_build_object('nome', 'Parceiros ativados', 'atual', v_ativ, 'meta', 20, 'ok', v_ativ >= 20),
      jsonb_build_object('nome', 'Conversão de indicação em venda estável por 2 trimestres', 'atual', null, 'meta', null, 'ok', null),
      jsonb_build_object('nome', '80% dos clientes indicados ativos aos 6 meses', 'atual', null, 'meta', 80, 'ok', null));
    return jsonb_build_object('fase', v_fase, 'proxima', 'crescimento', 'criterios', v_crit, 'pronta', false);
  elsif v_fase = 'crescimento' then
    return jsonb_build_object('fase', v_fase, 'proxima', 'otimizacao', 'pronta', false, 'criterios', jsonb_build_array(
      jsonb_build_object('nome', 'Receita via parceiros igual ou maior que 30% da receita nova da Wise', 'atual', null, 'meta', 30, 'ok', null),
      jsonb_build_object('nome', 'ROI do canal positivo por 2 trimestres', 'atual', null, 'meta', null, 'ok', null)));
  end if;
  return jsonb_build_object('fase', v_fase, 'proxima', null, 'pronta', false, 'criterios', '[]'::jsonb);
end $$;

create or replace function public.definir_fase(p_fase text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Somente administradores mudam a fase do programa.' using errcode = '42501'; end if;
  insert into public.fase_programa (fase, desde) values (p_fase, public.hoje());
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
select public._proteger_tabela(t) from unnest(array['fase_programa', 'indicadores', 'metas', 'pesquisas_satisfacao', 'avaliacoes_maturidade',
  'versoes_regras', 'comunicados', 'comunicado_leituras', 'metas_pessoa']) t;

create policy fase_ler on public.fase_programa for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy ind_cat_ler on public.indicadores for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy ind_cat_admin on public.indicadores for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy metas_ler on public.metas for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy metas_admin on public.metas for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy pesq_ler on public.pesquisas_satisfacao for select to authenticated using (public.is_parcerias() or perfil_id = auth.uid());

create policy mat_ler on public.avaliacoes_maturidade for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy mat_criar on public.avaliacoes_maturidade for insert to authenticated with check (public.is_parcerias());

create policy regras_ler on public.versoes_regras for select to authenticated
  using (public.is_interno_leitura() or (public.parceiro_atual() is not null and vigente_desde <= public.hoje()));

create policy com_ler on public.comunicados for select to authenticated
  using (public.is_parcerias() or public.is_consultor()
         or exists (select 1 from public.comunicado_leituras l where l.comunicado_id = comunicados.id and l.perfil_id = auth.uid()));
create policy com_gerir on public.comunicados for all to authenticated using (public.is_parcerias()) with check (public.is_parcerias());
create policy leit_ler on public.comunicado_leituras for select to authenticated
  using (public.is_parcerias() or public.is_consultor() or perfil_id = auth.uid());

create policy metas_p_ler on public.metas_pessoa for select to authenticated using (public.is_admin() or (public.is_parcerias() and perfil_id = auth.uid()));
create policy metas_p_admin on public.metas_pessoa for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
declare f text;
begin
  foreach f in array array['planilha_custos(date, date)', 'resultado_canal(date, date, text)', 'responder_pesquisa(int, text)',
    'sugerir_maturidade(uuid)', 'publicar_regras(date, text, boolean)', 'regras_publicadas()', 'enviar_comunicado(uuid)',
    'marcar_comunicado_lido(uuid)', 'painel_pessoal(uuid, text)', 'painel_v2(date, date)', 'sugerir_fase()', 'definir_fase(text)',
    'regras_retrato()'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array['enviar_pesquisa_trimestral()', 'nps(date, date)', 'responsavel_em(uuid, date)', '_metricas_canal(jsonb, numeric)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;
