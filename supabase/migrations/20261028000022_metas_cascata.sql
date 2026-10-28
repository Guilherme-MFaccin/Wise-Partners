-- Portal Wise Partners: metas em cascata (revisão de 28/10/2026)
-- Programa (Wise), representante e parceiro passam a ler um único cadastro por trimestre.
-- Funil ganha prazo e chance de assinatura por etapa (funil reverso). Fases, marcos do onboarding
-- e metas das contrapartidas viram dados configuráveis. Migração aditiva: nada aplicado antes é editado.

-- ---------------------------------------------------------------------------
-- Catálogo de indicadores: quais aceitam meta e qual é o número principal
-- ---------------------------------------------------------------------------
alter table public.indicadores
  add column aceita_meta boolean not null default false,
  add column principal boolean not null default false;

insert into public.indicadores (chave, etapa, nome, formato, destaque, so_admin, ordem)
values ('assinados', 'captacao', 'Parceiros assinados no período', 'numero', true, false, 1)
on conflict (chave) do nothing;

-- A meta de assinados saía de um parâmetro solto; agora vem do cadastro de metas
update public.indicadores set ativo = false where chave = 'assinados_meta';

update public.indicadores set aceita_meta = true
 where chave in ('assinados', 'ativados', 'clientes_icp', 'receita_atribuida', 'conversao_recrutamento', 'nps', 'ativos_sobre_assinados', 'roi');
update public.indicadores set principal = true, nome = 'Clientes fechados no ICP via parceiros' where chave = 'clientes_icp';
create unique index indicadores_um_principal on public.indicadores (principal) where principal;

-- ---------------------------------------------------------------------------
-- Metas do programa: sempre por trimestre ("2026-T4"); o ano é a soma dos trimestres
-- ---------------------------------------------------------------------------
delete from public.metas where periodo !~ '^\d{4}-T[1-4]$';
alter table public.metas add constraint metas_periodo_trimestre check (periodo ~ '^\d{4}-T[1-4]$');

create or replace function public.trg_meta_aceita() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.indicadores where chave = new.indicador_chave and aceita_meta) then
    raise exception 'Este indicador não recebe meta. Metas só valem para os indicadores de resultado.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger t_meta_aceita before insert or update on public.metas for each row execute function public.trg_meta_aceita();

-- ---------------------------------------------------------------------------
-- Metas por pessoa: os indicadores escolhidos na revisão (sem receita)
-- ---------------------------------------------------------------------------
alter table public.metas_pessoa drop constraint metas_pessoa_indicador_check;
delete from public.metas_pessoa where indicador not in ('assinados', 'ativados', 'clientes_icp', 'reunioes', 'regua_em_dia');
alter table public.metas_pessoa add constraint metas_pessoa_indicador_check
  check (indicador in ('assinados', 'ativados', 'clientes_icp', 'reunioes', 'regua_em_dia'));
alter table public.metas_pessoa add constraint metas_pessoa_trimestre check (trimestre ~ '^\d{4}-T[1-4]$');

-- Parâmetros substituídos pelo cadastro de metas e pelos prazos por etapa
delete from public.configuracoes where chave in ('meta_assinados', 'meta_data', 'parada_contato_feito_dias_uteis', 'parada_proposta_dias');

-- ---------------------------------------------------------------------------
-- Funil: prazo máximo em dias úteis e chance de assinatura por etapa
-- ---------------------------------------------------------------------------
alter table public.etapas_funil
  add column prazo_dias_uteis int check (prazo_dias_uteis is null or prazo_dias_uteis > 0),
  add column chance_assinatura numeric check (chance_assinatura is null or chance_assinatura between 0 and 100);

update public.etapas_funil e set prazo_dias_uteis = v.prazo, chance_assinatura = v.chance
from (values
  ('sem_contato', null, 5), ('contato_feito', 4, 10), ('retornou', 3, 15), ('reuniao_agendada', 10, 25),
  ('reuniao_realizada', 5, 35), ('qualificacao', 5, 45), ('proposta_decisor', 5, 60), ('fechamento', 10, 85)
) as v(codigo, prazo, chance)
where e.codigo = v.codigo;

-- Negociação parada: tempo na etapa maior ou igual ao prazo da etapa, em dias úteis
create or replace function public.negociacao_parada(p_etapa text, p_desde timestamptz) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select public.dias_uteis_entre(p_desde::date, public.hoje()) >= e.prazo_dias_uteis
                   from public.etapas_funil e where e.codigo = p_etapa and e.prazo_dias_uteis is not null), false)
$$;

-- ---------------------------------------------------------------------------
-- Critérios de passagem de fase, editáveis (antes fixos no código)
-- ---------------------------------------------------------------------------
create table public.criterios_fase (
  id uuid primary key default gen_random_uuid(),
  fase text not null check (fase in ('experimentacao', 'tracao', 'crescimento')),
  descricao text not null,
  indicador text check (indicador in ('assinados', 'ativados', 'clientes_icp', 'respostas_pesquisa', 'clientes_ativos_6m_pct')),
  valor numeric,
  atingido boolean not null default false,
  ordem int not null default 0
);
-- Critério sem indicador é marcado à mão (valor some); com indicador precisa de valor
create or replace function public.trg_criterio_fase() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.indicador is null then
    new.valor := null;
  elsif new.valor is null then
    raise exception 'Informe o valor do critério ou escolha "Nenhum" no indicador para marcar à mão.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger t_criterio_fase before insert or update on public.criterios_fase for each row execute function public.trg_criterio_fase();
create trigger t_hist after insert or update or delete on public.criterios_fase for each row execute function public.trg_historico('descricao', 'valor', 'atingido');

insert into public.criterios_fase (fase, descricao, indicador, valor, ordem) values
  ('experimentacao', 'Parceiros ativados', 'ativados', 5, 1),
  ('experimentacao', 'Clientes fechados no ICP via parceiros', 'clientes_icp', 3, 2),
  ('experimentacao', 'Respostas na pesquisa de satisfação', 'respostas_pesquisa', 5, 3),
  ('tracao', 'Parceiros ativados', 'ativados', 20, 11),
  ('tracao', 'Conversão de indicação em venda estável por 2 trimestres', null, null, 12),
  ('tracao', 'Clientes indicados ativos aos 6 meses (%)', 'clientes_ativos_6m_pct', 80, 13),
  ('crescimento', 'Receita via parceiros igual ou maior que 30% da receita nova da Wise', null, null, 21),
  ('crescimento', 'ROI do canal positivo por 2 trimestres', null, null, 22);

-- ---------------------------------------------------------------------------
-- Marcos do onboarding, editáveis (antes fixos no código e no texto da tela)
-- dias nulo: fim do onboarding (configuração onboarding_dias)
-- ---------------------------------------------------------------------------
create table public.marcos_onboarding_config (
  tipo text primary key check (tipo in ('encontro_alinhamento', 'encontro_vendas', 'encontro_produto', 'encontro_pos_venda', 'marco_30', 'marco_60', 'marco_90')),
  nome text not null,
  dias int check (dias is null or dias > 0),
  descricao text not null,
  regra jsonb not null default '{}',
  ordem int not null
);

insert into public.marcos_onboarding_config (tipo, nome, dias, descricao, regra, ordem) values
  ('encontro_alinhamento', 'Encontro 1: alinhamento', 7,
   'Objetivos dos dois lados, proposta de valor em 4 pontos, régua de acompanhamento, metas dos 90 dias, entrega do link de indicação e convite das pessoas para a trilha.', '{}', 1),
  ('encontro_vendas', 'Encontro 2: vendas', 30, 'Como reconhecer um cliente no perfil ideal (ICP), como abordar e indicar, uso do link exclusivo.', '{}', 2),
  ('marco_30', 'Marco de 30 dias', 30, 'Responsável com a trilha "Como vender a Wise Makers" iniciada e ao menos 1 indicação registrada.',
   '{"trilha_iniciada": true, "indicacoes": 1}', 3),
  ('encontro_produto', 'Encontro 3: produto', 60, 'Oferta da Wise, mentoria, Wise Hub, cases e respostas às objeções.', '{}', 4),
  ('marco_60', 'Marco de 60 dias', 60, 'Responsável certificado e ao menos 1 indicação qualificada.',
   '{"responsavel_certificado": true, "indicacoes_qualificadas": 1}', 5),
  ('encontro_pos_venda', 'Encontro 4: pós-venda', null, 'SLA, acompanhamento do cliente indicado, comissão e revisão dos resultados.', '{}', 6),
  ('marco_90', 'Marco de 90 dias: ativação', null, 'Ativação: primeira indicação com ICP confirmado pela Wise que virou reunião.', '{"ativacao": true}', 7);

-- ---------------------------------------------------------------------------
-- Contrapartidas com meta estruturada (quantidade, unidade, prazo e forma de medir)
-- contagem: soma as comprovações validadas; valor: vale o número da última comprovação validada
-- ---------------------------------------------------------------------------
alter table public.catalogo_contrapartidas
  add column meta_quantidade numeric check (meta_quantidade is null or meta_quantidade > 0),
  add column meta_unidade text,
  add column meta_prazo_dias int check (meta_prazo_dias is null or meta_prazo_dias > 0),
  add column meta_modo text not null default 'contagem' check (meta_modo in ('contagem', 'valor'));
alter table public.contrapartidas
  add column meta_quantidade numeric check (meta_quantidade is null or meta_quantidade > 0),
  add column meta_unidade text,
  add column meta_prazo_dias int check (meta_prazo_dias is null or meta_prazo_dias > 0),
  add column meta_modo text not null default 'contagem' check (meta_modo in ('contagem', 'valor'));
alter table public.comprovacoes add column quantidade numeric check (quantidade is null or quantidade >= 0);

update public.catalogo_contrapartidas k set meta_quantidade = v.q, meta_unidade = v.u, meta_prazo_dias = v.d, meta_modo = v.m
from (values
  ('Uma vez, até 15 dias após a assinatura', 1, 'publicação', 15, 'contagem'),
  ('Até 30 dias após a assinatura e contínuo', 1, 'publicação no site', 30, 'contagem'),
  ('No mínimo uma comunicação por mês', 1, 'comunicação', 30, 'contagem'),
  ('10 usuários ativos em 90 dias', 10, 'usuários ativos', 90, 'valor'),
  ('25 usuários ativos em 90 dias', 25, 'usuários ativos', 90, 'valor')
) as v(meta, q, u, d, m)
where k.meta = v.meta and k.meta_quantidade is null;
update public.catalogo_contrapartidas set meta_quantidade = 1, meta_unidade = case when nome ilike 'case%' then 'case' else 'evento' end
 where meta = 'Uma vez por ciclo' and meta_quantidade is null;

update public.contrapartidas c set meta_quantidade = k.meta_quantidade, meta_unidade = k.meta_unidade,
       meta_prazo_dias = k.meta_prazo_dias, meta_modo = k.meta_modo
  from public.catalogo_contrapartidas k
 where k.id = c.catalogo_id and c.meta_quantidade is null and k.meta_quantidade is not null;

-- Progresso da meta da contrapartida (coluna calculada, lida pelo PostgREST como "meta_progresso")
create or replace function public.meta_progresso(c public.contrapartidas) returns numeric
language sql stable set search_path = public as $$
  select case
    when c.meta_quantidade is null then null
    when c.meta_modo = 'valor' then (select cp.quantidade from public.comprovacoes cp
                                      where cp.contrapartida_id = c.id and cp.estado = 'validada' and cp.quantidade is not null
                                      order by cp.validada_em desc nulls last limit 1)
    when c.periodicidade in ('quinzenal', 'mensal', 'bimestral', 'trimestral') and c.meta_prazo_dias is not null
      then (select count(*) from public.comprovacoes cp where cp.contrapartida_id = c.id and cp.estado = 'validada'
              and cp.validada_em::date > public.hoje() - c.meta_prazo_dias)
    else (select count(*) from public.comprovacoes cp where cp.contrapartida_id = c.id and cp.estado = 'validada') end
$$;

-- Prazo da meta: só para contrapartidas que não se repetem (as periódicas medem a janela móvel)
create or replace function public.meta_prazo(c public.contrapartidas) returns date
language sql stable set search_path = public as $$
  select case when c.meta_prazo_dias is not null and c.periodicidade not in ('quinzenal', 'mensal', 'bimestral', 'trimestral')
              then c.created_at::date + c.meta_prazo_dias end
$$;

-- ---------------------------------------------------------------------------
-- RLS das tabelas novas
-- ---------------------------------------------------------------------------
select public._proteger_tabela(t) from unnest(array['criterios_fase', 'marcos_onboarding_config']) t;
create policy criterios_fase_ler on public.criterios_fase for select to authenticated using (public.is_parcerias() or public.is_consultor());
create policy criterios_fase_admin on public.criterios_fase for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy marcos_cfg_ler on public.marcos_onboarding_config for select to authenticated using (true);
create policy marcos_cfg_admin on public.marcos_onboarding_config for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Datas de um trimestre "AAAA-TN"
create or replace function public.trimestre_datas(p_tri text, out inicio date, out fim date)
language sql immutable as $$
  select make_date(split_part(p_tri, '-T', 1)::int, (split_part(p_tri, '-T', 2)::int - 1) * 3 + 1, 1),
         (make_date(split_part(p_tri, '-T', 1)::int, (split_part(p_tri, '-T', 2)::int - 1) * 3 + 1, 1) + interval '3 months')::date - 1
$$;

-- Indicadores: assinados no período (o acumulado vai à parte) e negociação parada pelo prazo de cada etapa
CREATE OR REPLACE FUNCTION public._indicadores_valores(p_ini date, p_fim date, p_admin boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v jsonb := '{}';
  v_assin int; v_cad int;
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
    'assinados', (select count(*) from public.parceiros where data_assinatura between p_ini and p_fim and not public.is_etapa_perda(etapa)),
    'assinados_total', v_assin,
    'conversao_recrutamento', (select case when count(*) > 0 then round(count(*) filter (where data_assinatura is not null)::numeric * 100 / count(*), 1) end
                               from public.parceiros where tipo_parceria = 'comercial' and etapa <> 'sem_contato'),
    'conversao_origem', (select coalesce(jsonb_object_agg(o, jsonb_build_object('cadastrados', c, 'assinados', a)), '{}') from (
                           select coalesce(origem_tipo, 'nao_informada') o, count(*) c, count(*) filter (where data_assinatura is not null) a
                           from public.parceiros group by 1) x),
    'tempo_ate_assinatura', (select round(avg(data_assinatura - created_at::date)) from public.parceiros where data_assinatura between p_ini and p_fim),
    'nota_scorecard', (select round(avg(s.nota_potencial), 1) from public.parceiros p cross join lateral public.scorecard_vigente(p.id) s where s.completo),
    'perdas_motivo', (select coalesce(jsonb_object_agg(etapa, n), '{}') from (select etapa, count(*) n from public.parceiros where public.is_etapa_perda(etapa) group by 1) x),
    'em_nutricao', (select count(*) from public.parceiros where etapa = 'nutricao'),
    'negociacoes_paradas', (select count(*) from public.parceiros p where public.negociacao_parada(p.etapa, p.etapa_desde)));

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
      'receita_por_nivel', (select coalesce(jsonb_object_agg(y.nivel, y.s), '{}') from (
                              select coalesce(p.nivel, 'sem') as nivel, sum(x.valor) s from public._planilha_custos(p_ini, p_fim) x
                              join public.parceiros p on p.id = x.parceiro_id where x.tipo_linha = 'receita' group by 1) y));
  end if;
  return v;
end $function$;

-- Painel por frente: as metas aparecem no bloco do trimestre (metas_trimestre)
CREATE OR REPLACE FUNCTION public.painel_v2(p_inicio date DEFAULT NULL::date, p_fim date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_fim date := coalesce(p_fim, public.hoje());
  v_ini date := coalesce(p_inicio, v_fim - 7);
  v_dias int := v_fim - v_ini + 1;
  v_admin boolean := public.is_admin();
  v_atual jsonb;
  v_ant jsonb;
begin
  if not public.is_interno() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  v_atual := public._indicadores_valores(v_ini, v_fim, v_admin);
  v_ant := public._indicadores_valores(v_ini - v_dias, v_ini - 1, v_admin);
  return jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'fase', (select fase from public.fase_programa order by desde desc, created_at desc limit 1),
    'sugestao_fase', case when public.is_parcerias() or public.is_consultor() then public.sugerir_fase() end,
    'indicadores', (select coalesce(jsonb_agg(jsonb_build_object(
        'chave', i.chave, 'etapa', i.etapa, 'nome', i.nome, 'formato', i.formato, 'destaque', i.destaque,
        'valor', v_atual -> i.chave, 'anterior', v_ant -> i.chave,
        'aceita_meta', i.aceita_meta)
        order by i.etapa, i.ordem), '[]')
      from public.indicadores i where i.ativo and (v_admin or not i.so_admin)),
    'comentarios_satisfacao', (select coalesce(jsonb_agg(jsonb_build_object('nota', s.nota, 'comentario', s.comentario, 'trimestre', s.trimestre,
        'pessoa', case when public.is_parcerias() then pf.nome end, 'parceiro', case when public.is_parcerias() then p.nome_fantasia end)
        order by s.respondida_em desc), '[]')
      from public.pesquisas_satisfacao s join public.perfis pf on pf.id = s.perfil_id join public.parceiros p on p.id = s.parceiro_id
      where s.comentario is not null and s.respondida_em::date between v_ini and v_fim));
end $function$;

-- Lista completa e relatório: meta e assinados do trimestre, funil reverso
CREATE OR REPLACE FUNCTION public.painel_semanal(p_inicio date DEFAULT NULL::date, p_fim date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_ini date := coalesce(p_inicio, public.hoje() - 7);
  v_fim date := coalesce(p_fim, public.hoje());
  res jsonb;
begin
  select jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'trimestre', to_char(public.hoje(), 'YYYY-"T"Q'),
    'meta_assinados', (select valor from public.metas where indicador_chave = 'assinados' and periodo = to_char(public.hoje(), 'YYYY-"T"Q')),
    'funil_reverso', public.funil_reverso(null),
    'assinados_total', (select count(*) from public.parceiros p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)),
    'assinados', (select count(*) from public.parceiros p where p.data_assinatura >= date_trunc('quarter', public.hoje())::date and not public.is_etapa_perda(p.etapa)),
    'funil', (select coalesce(jsonb_agg(jsonb_build_object('etapa', e.codigo, 'nome', e.nome, 'perda', e.perda,
                     'total', (select count(*) from public.parceiros p where p.etapa = e.codigo)) order by e.ordem), '[]')
              from public.etapas_funil e),
    'followups_vencidos', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'parceiro_id', x.parceiro_id, 'parceiro', p.nome_fantasia,
                     'descricao', x.descricao, 'data', x.data, 'responsavel_id', x.responsavel_id) order by x.data), '[]')
              from public.proximos_passos x join public.parceiros p on p.id = x.parceiro_id
              where x.estado in ('aberto', 'vencido') and x.data < public.hoje()),
    'esfriando', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'status', p.status_atividade,
                     'ultimo_contato', p.ultimo_contato, 'motivo', p.motivo_inatividade) order by p.ultimo_contato nulls first), '[]')
              from public.parceiros p where p.status_atividade in ('morno', 'dormente') and not public.is_etapa_perda(p.etapa)),
    'negociacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'etapa', p.etapa,
                     'desde', p.etapa_desde::date)), '[]')
              from public.parceiros p
              where public.negociacao_parada(p.etapa, p.etapa_desde)),
    'contrapartidas_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'parceiro_id', p.id, 'parceiro', p.nome_fantasia,
                     'nome', c.nome, 'proxima_data', c.proxima_data) order by c.proxima_data), '[]')
              from public.contrapartidas c join public.parceiros p on p.id = c.parceiro_id
              where c.ativa and c.estado = 'atrasada'),
    'aprovacoes_pendentes', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'desde', p.etapa_desde::date)), '[]')
              from public.parceiros p where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)),
    'propostas_ficha_pendentes', (select count(*) from public.propostas_ficha where estado = 'pendente'),
    'indicacoes', (select jsonb_build_object(
                     'total', count(*),
                     'do_parceiro', count(*) filter (where i.sentido = 'parceiro_para_grupo'),
                     'para_parceiro', count(*) filter (where i.sentido = 'grupo_para_parceiro'),
                     'no_icp', count(*) filter (where i.aderente_icp),
                     'com_reuniao', count(*) filter (where i.data_reuniao is not null),
                     'fechadas', count(*) filter (where i.etapa = 'fechada'),
                     'por_empresa', (select coalesce(jsonb_object_agg(e.nome, (select count(*) from public.indicacoes j
                                        where j.empresa_grupo_id = e.id and j.data between v_ini and v_fim)), '{}') from public.empresas_grupo e))
              from public.indicacoes i where i.data between v_ini and v_fim),
    'indicacoes_paradas', (select count(*) from public.indicacoes i
              where i.etapa not in ('fechada', 'perdida') and i.ultima_atualizacao < now() - make_interval(days => public.config_int('indicacao_parada_dias', 15))),
    'contratos_assinados', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'data', p.data_assinatura)), '[]')
              from public.parceiros p where p.data_assinatura between v_ini and v_fim),
    'comissoes', case when public.pode_ver_comissao() then (
              select jsonb_build_object(
                'a_pagar', coalesce(sum(valor) filter (where estado in ('a_pagar', 'nf_recebida') and beneficiario <> 'grupo'), 0),
                'pagas_periodo', coalesce(sum(valor) filter (where estado = 'paga' and paga_em::date between v_ini and v_fim and beneficiario <> 'grupo'), 0),
                'a_receber', coalesce(sum(valor) filter (where beneficiario = 'grupo' and estado in ('aguardando_compensacao', 'a_pagar', 'nf_recebida')), 0),
                'recebidas_periodo', coalesce(sum(valor) filter (where beneficiario = 'grupo' and estado = 'paga' and paga_em::date between v_ini and v_fim), 0))
              from public.comissoes) end,
    'fila_base_ativa', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', f.parceiro_id, 'parceiro', f.nome_fantasia,
                     'posicao', f.posicao, 'estrategico', f.estrategico) order by f.posicao), '[]') from public.v_fila_base_ativa f),
    'categorias_sem_3', (select coalesce(jsonb_agg(jsonb_build_object('categoria_id', c.id, 'categoria', c.nome,
                     'assinados', public.assinados_na_categoria(c.id)) order by c.ordem), '[]')
              from public.categorias c where c.ativa and c.tipo = 'comercial' and public.assinados_na_categoria(c.id) < 3),
    'atividades', (select coalesce(jsonb_agg(jsonb_build_object('tipo', t.nome, 'quantidade', x.qtd, 'minutos', x.minutos)), '[]')
              from (select a.tipo_atividade_id, count(*) qtd, sum(a.minutos) minutos from public.atividades a
                    where a.data between v_ini and v_fim group by a.tipo_atividade_id) x
              join public.tipos_atividade t on t.id = x.tipo_atividade_id),
    'sem_motivo_inatividade', (select count(*) from public.parceiros p
              where p.status_atividade in ('morno', 'dormente') and coalesce(btrim(p.motivo_inatividade), '') = '' and not public.is_etapa_perda(p.etapa))
  ) into res;
  return res;
end $function$;

-- Pendências diárias: negociação parada pelo prazo de cada etapa
CREATE OR REPLACE FUNCTION public.pendencias_diarias()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ip int := public.config_int('indicacao_parada_dias', 15);
  v_hoje date := public.hoje();
  u record;
  itens jsonb;
  res jsonb := '[]';
  k text;
  vazio boolean;
  v_gestor boolean;
begin
  for u in select * from public.perfis where ativo and papel in ('admin', 'parcerias', 'consultor', 'comercial') loop
    v_gestor := u.papel in ('admin', 'parcerias');
    itens := jsonb_build_object(
      'followups_vencidos', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'texto', x.descricao, 'data', x.data)), '[]')
          from public.proximos_passos x join public.parceiros p on p.id = x.parceiro_id
          where x.responsavel_id = u.id and x.estado in ('aberto', 'vencido') and x.data < v_hoje),
      'status_atividade', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('passou de %s para %s', h.valor_anterior, h.valor_novo))), '[]')
          from public.historico h join public.parceiros p on p.id = h.registro_id
          where h.tabela = 'parceiros' and h.campo = 'status_atividade' and h.created_at > now() - interval '1 day'
            and p.responsavel_id = u.id),
      'negociacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('em %s desde %s', e.nome, to_char(p.etapa_desde, 'DD/MM')))), '[]')
          from public.parceiros p join public.etapas_funil e on e.codigo = p.etapa
          where p.responsavel_id = u.id
            and public.negociacao_parada(p.etapa, p.etapa_desde)),
      'contrapartidas_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s (prevista para %s)', c.nome, to_char(c.proxima_data, 'DD/MM')))), '[]')
          from public.contrapartidas c join public.parceiros p on p.id = c.parceiro_id
          where c.ativa and c.estado = 'atrasada' and p.responsavel_id = u.id),
      'indicacoes_paradas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s sem atualização desde %s', cl.razao_social, to_char(i.ultima_atualizacao, 'DD/MM')))), '[]')
          from public.indicacoes i join public.parceiros p on p.id = i.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where i.responsavel_id = u.id and i.etapa not in ('fechada', 'perdida')
            and i.ultima_atualizacao < now() - make_interval(days => v_ip)),
      'propostas_ficha', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'texto', 'proposta de alteração da ficha')), '[]')
          from public.propostas_ficha f join public.parceiros p on p.id = f.parceiro_id
          where f.estado = 'pendente' and p.responsavel_id = u.id),
      'aprovacoes_pendentes', case when u.is_diretor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', 'aguarda aprovação de assinatura')), '[]')
          from public.parceiros p where p.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(p.id)) else '[]'::jsonb end,
      -- v2
      'sla_vencido', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s: prazo vencido (%s)', cl.razao_social, replace(array_to_string(public.sla_vencidos(i), ', '), '_', ' ')))), '[]')
          from public.indicacoes i join public.parceiros p on p.id = i.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where coalesce(i.responsavel_id, p.responsavel_id) = u.id and cardinality(public.sla_vencidos(i)) > 0),
      'regua_atrasada', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('reunião prevista até %s', to_char((s.v->>'proxima_ate')::date, 'DD/MM')))), '[]')
          from public.parceiros p cross join lateral (select public.regua_status(p.id) v) s
          where p.responsavel_id = u.id and p.data_assinatura is not null and coalesce((s.v->>'atrasada')::boolean, false)),
      'acoes_wise_atrasadas', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s (prevista para %s)', a.nome, to_char(a.data_prevista, 'DD/MM')))), '[]')
          from public.acoes_wise a join public.parceiros p on p.id = a.parceiro_id
          where a.ativa and a.estado = 'atrasada' and coalesce(a.responsavel_id, p.responsavel_id) = u.id),
      'onboarding_sem_ativacao', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('onboarding desde %s sem ativação', to_char(pl.inicio, 'DD/MM')))), '[]')
          from public.planos_onboarding pl join public.parceiros p on p.id = pl.parceiro_id
          where pl.situacao = 'em_andamento' and v_hoje >= pl.prazo_final and p.responsavel_id = u.id),
      'em_risco', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', case f.estado when 'em_risco' then 'em risco de desligamento' when 'tentativa_1' then 'primeira tentativa de retomada feita'
                                     else 'segunda tentativa de retomada feita' end)), '[]')
          from public.fluxos_desligamento f join public.parceiros p on p.id = f.parceiro_id
          where f.estado in ('em_risco', 'tentativa_1', 'tentativa_2') and (p.responsavel_id = u.id or (v_gestor and p.responsavel_id is null))),
      'propostas_rebaixamento', case when v_gestor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('proposta de rebaixamento (%s)', r.trimestre))), '[]')
          from public.revisoes_nivel r join public.parceiros p on p.id = r.parceiro_id
          where r.resultado = 'proposta_rebaixamento' and r.decisao is null) else '[]'::jsonb end,
      'checagens_cliente', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', format('%s: checagem de %s', cl.razao_social, c.marco))), '[]')
          from public.checagens_cliente c join public.indicacoes i on i.id = c.indicacao_id
          join public.parceiros p on p.id = c.parceiro_id join public.clientes cl on cl.id = i.cliente_id
          where c.registrada_em is null and c.prevista_para <= v_hoje and coalesce(i.responsavel_id, p.responsavel_id) = u.id),
      'desligamentos_para_aprovar', case when u.is_diretor then (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia,
              'texto', 'desligamento sugerido aguarda decisão')), '[]')
          from public.fluxos_desligamento f join public.parceiros p on p.id = f.parceiro_id where f.estado = 'sugerido') else '[]'::jsonb end
    );
    -- Preferências: tipos desativados não entram, exceto obrigatórios do Diretor
    foreach k in array u.alertas_desativados loop
      if not (k in ('aprovacoes_pendentes', 'desligamentos_para_aprovar') and u.is_diretor) then
        itens := itens - k;
      end if;
    end loop;
    select bool_and(jsonb_array_length(v) = 0) into vazio from jsonb_each(itens) as t(k2, v);
    if not coalesce(vazio, true) then
      res := res || jsonb_build_object('usuario_id', u.id, 'email', u.email, 'nome', u.nome, 'itens', itens);
    end if;
  end loop;
  return res;
end $function$;

-- Onboarding: prazos dos marcos vêm de marcos_onboarding_config
CREATE OR REPLACE FUNCTION public.iniciar_onboarding(p_parceiro uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p public.parceiros;
  v_tarefas jsonb;
  t jsonb;
  v_hoje date := public.hoje();
  v_prazo date := public.add_dias_uteis(v_hoje, 2);
  v_dias int := public.config_int('onboarding_dias', 90);
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.tipo_parceria = 'comercial' then
    select tarefas_onboarding into v_tarefas from public.pacotes where codigo = p.pacote;
  else
    v_tarefas := public.config('tarefas_onboarding_institucional');
  end if;
  if not exists (select 1 from public.tarefas_onboarding where parceiro_id = p.id) then
    for t in select * from jsonb_array_elements(coalesce(v_tarefas, '[]'::jsonb)) loop
      insert into public.tarefas_onboarding (parceiro_id, descricao, prazo, responsavel_id)
      values (p.id, t #>> '{}', v_prazo, p.responsavel_id);
    end loop;
  end if;
  perform public.gerar_contrapartidas(p.id);
  perform public.gerar_acoes_wise(p.id);
  if p.pacote = 'A' and not exists (
    select 1 from public.ciclos_base_ativa where parceiro_id = p.id and estado in ('fila', 'em_ciclo')
  ) then
    insert into public.ciclos_base_ativa (parceiro_id) values (p.id);
  end if;

  -- Plano de 90 dias (Apêndice F): só parceria comercial
  if p.tipo_parceria = 'comercial' and not exists (select 1 from public.planos_onboarding where parceiro_id = p.id) then
    insert into public.planos_onboarding (parceiro_id, inicio, prazo_final) values (p.id, v_hoje, v_hoje + v_dias);
    insert into public.marcos_onboarding (parceiro_id, tipo, prazo)
      select p.id, mc.tipo, v_hoje + coalesce(mc.dias, v_dias) from public.marcos_onboarding_config mc order by mc.ordem;
  end if;
  if p.tipo_parceria = 'comercial' then
    perform public.garantir_link_indicacao(p.id);
  end if;
end $function$;

-- Contrapartidas: copia a meta estruturada do catálogo
CREATE OR REPLACE FUNCTION public.gerar_contrapartidas(p_parceiro uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p public.parceiros;
  c record;
  v_per text;
  v_data date;
  n int := 0;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.data_assinatura is null then return 0; end if;
  if p.tipo_parceria = 'comercial' and p.pacote is null then return 0; end if;

  for c in
    select * from public.catalogo_contrapartidas k
    where k.ativa and k.tipo_parceria = p.tipo_parceria
      and (p.tipo_parceria = 'institucional' or p.pacote = any (k.pacotes))
      and (k.niveis is null or p.nivel = any (k.niveis))
      and (k.natureza_juridica is null or p.natureza_juridica = any (k.natureza_juridica))
      and not exists (select 1 from public.contrapartidas x where x.parceiro_id = p.id and x.catalogo_id = k.id)
    order by k.ordem
  loop
    v_per := coalesce(c.periodicidade_por_pacote->>p.pacote, c.periodicidade);
    v_data := case
      when c.prazo_inicial_dias > 0 then p.data_assinatura + c.prazo_inicial_dias
      when v_per = 'na_assinatura' then p.data_assinatura
      when v_per in ('por_ciclo', 'por_acao') then null
      else public.proxima_data_periodo(p.data_assinatura, v_per) end;
    insert into public.contrapartidas (parceiro_id, catalogo_id, nome, periodicidade, comprovacao, meta, proxima_data,
                                       meta_quantidade, meta_unidade, meta_prazo_dias, meta_modo)
    values (p.id, c.id, c.nome, v_per, c.comprovacao, c.meta, v_data, c.meta_quantidade, c.meta_unidade, c.meta_prazo_dias, c.meta_modo);
    n := n + 1;
  end loop;
  return n;
end $function$;

-- ---------------------------------------------------------------------------
-- Marcos do onboarding: critérios lidos de marcos_onboarding_config.regra
-- (trilha_iniciada, responsavel_certificado, indicacoes, indicacoes_qualificadas).
-- O marco com "ativacao" é cumprido por ativar_parceiro.
-- ---------------------------------------------------------------------------
create or replace function public.verificar_marcos_onboarding(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_resp uuid;
  m record;
  v_ok boolean;
begin
  select pf.id into v_resp from public.perfis pf
   where pf.parceiro_id = p_parceiro and pf.ativo and pf.is_responsavel_parceiro limit 1;
  for m in
    select mc.tipo, mc.regra from public.marcos_onboarding_config mc
      join public.marcos_onboarding mo on mo.tipo = mc.tipo and mo.parceiro_id = p_parceiro and mo.cumprido_em is null
     where mc.regra <> '{}'::jsonb and not mc.regra ? 'ativacao'
  loop
    v_ok := true;
    if coalesce((m.regra->>'trilha_iniciada')::boolean, false) then
      v_ok := v_ok and exists (select 1 from public.trilha_progresso tp join public.trilha_modulos tm on tm.id = tp.modulo_id
                                 join public.trilhas t on t.id = tm.trilha_id
                                where tp.perfil_id = v_resp and t.chave = 'como_vender');
    end if;
    if coalesce((m.regra->>'responsavel_certificado')::boolean, false) then
      v_ok := v_ok and public.responsavel_certificado(p_parceiro);
    end if;
    if m.regra ? 'indicacoes' then
      v_ok := v_ok and (select count(*) from public.indicacoes i
                         where i.parceiro_id = p_parceiro and i.sentido = 'parceiro_para_grupo') >= (m.regra->>'indicacoes')::int;
    end if;
    if m.regra ? 'indicacoes_qualificadas' then
      v_ok := v_ok and (select count(*) from public.indicacoes i
                         where i.parceiro_id = p_parceiro and i.sentido = 'parceiro_para_grupo' and i.qualificada) >= (m.regra->>'indicacoes_qualificadas')::int;
    end if;
    if v_ok then
      update public.marcos_onboarding set cumprido_em = public.hoje()
       where parceiro_id = p_parceiro and tipo = m.tipo and cumprido_em is null;
    end if;
  end loop;
end $$;
revoke execute on function public.verificar_marcos_onboarding(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fase do programa: critérios vêm de criterios_fase. Critério sem indicador é marcado à mão.
-- ---------------------------------------------------------------------------
create or replace function public._valor_criterio(p_indicador text) returns numeric
language sql stable security definer set search_path = public as $$
  select case p_indicador
    when 'assinados' then (select count(*) from public.parceiros where data_assinatura is not null and not public.is_etapa_perda(etapa))
    when 'ativados' then (select count(*) from public.planos_onboarding where situacao = 'ativado')
    when 'clientes_icp' then (select count(*) from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa = 'fechada'
                              and coalesce(icp_confirmado, aderente_icp, false))
    when 'respostas_pesquisa' then (select count(*) from public.pesquisas_satisfacao)
    when 'clientes_ativos_6m_pct' then (select case when count(*) filter (where registrada_em is not null) > 0
                                          then round(count(*) filter (where cliente_ativo)::numeric * 100 / count(*) filter (where registrada_em is not null), 1) end
                                        from public.checagens_cliente where marco = '6m')
  end::numeric
$$;
revoke execute on function public._valor_criterio(text) from public, anon, authenticated;

create or replace function public.sugerir_fase() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_fase text := coalesce((select fase from public.fase_programa order by desde desc, created_at desc limit 1), 'experimentacao');
  v_prox text;
  v_crit jsonb;
begin
  if auth.uid() is not null and not (public.is_parcerias() or public.is_consultor()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  v_prox := case v_fase when 'experimentacao' then 'tracao' when 'tracao' then 'crescimento' when 'crescimento' then 'otimizacao' end;
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nome', c.descricao, 'indicador', c.indicador, 'atual', x.atual, 'meta', c.valor,
           'manual', c.indicador is null,
           'ok', case when c.indicador is null then c.atingido when x.atual is null then false else x.atual >= c.valor end) order by c.ordem), '[]')
    into v_crit
    from public.criterios_fase c cross join lateral (select public._valor_criterio(c.indicador) as atual) x
   where c.fase = v_fase;
  return jsonb_build_object('fase', v_fase, 'proxima', v_prox, 'criterios', v_crit,
    'pronta', v_prox is not null and jsonb_array_length(v_crit) > 0
              and not exists (select 1 from jsonb_array_elements(v_crit) e where not (e->>'ok')::boolean));
end $$;

-- ---------------------------------------------------------------------------
-- Funil reverso: quanto falta para a meta de assinados do trimestre e o que o funil atual projeta.
-- p_perfil: só os parceiros da pessoa e a meta dela.
-- ---------------------------------------------------------------------------
create or replace function public.funil_reverso(p_trimestre text default null, p_perfil uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tri text := coalesce(p_trimestre, to_char(public.hoje(), 'YYYY-"T"Q'));
  v_ini date; v_fim date;
  v_meta numeric; v_assin int; v_faltam numeric; v_proj numeric; v_lacuna numeric;
  v_etapas jsonb;
  v_ch_reun numeric := (select chance_assinatura from public.etapas_funil where codigo = 'reuniao_realizada');
  v_ch_cont numeric := (select chance_assinatura from public.etapas_funil where codigo = 'contato_feito');
begin
  if auth.uid() is not null and not public.is_interno() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_perfil is not null and auth.uid() is not null and not (public.is_admin() or p_perfil = auth.uid()) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select inicio, fim into v_ini, v_fim from public.trimestre_datas(v_tri);
  v_meta := case when p_perfil is null
    then (select valor from public.metas where indicador_chave = 'assinados' and periodo = v_tri)
    else (select valor from public.metas_pessoa where perfil_id = p_perfil and trimestre = v_tri and indicador = 'assinados') end;
  select count(*) into v_assin from public.parceiros p
   where p.data_assinatura between v_ini and v_fim and not public.is_etapa_perda(p.etapa)
     and (p_perfil is null or public.responsavel_em(p.id, p.data_assinatura) = p_perfil);
  select coalesce(jsonb_agg(jsonb_build_object('etapa', e.codigo, 'nome', e.nome, 'quantidade', x.n, 'chance', e.chance_assinatura,
           'projecao', round(x.n * e.chance_assinatura / 100, 2), 'prazo_dias_uteis', e.prazo_dias_uteis, 'paradas', x.paradas) order by e.ordem), '[]'),
         coalesce(sum(x.n * e.chance_assinatura / 100), 0)
    into v_etapas, v_proj
    from public.etapas_funil e
    cross join lateral (select count(*) as n, count(*) filter (where public.negociacao_parada(p.etapa, p.etapa_desde)) as paradas
                          from public.parceiros p
                         where p.etapa = e.codigo and p.data_assinatura is null
                           and (p_perfil is null or p.responsavel_id = p_perfil)) x
   where e.chance_assinatura is not null and not e.perda;
  v_faltam := case when v_meta is null then null else greatest(v_meta - v_assin, 0) end;
  v_lacuna := case when v_faltam is null then null else greatest(v_faltam - v_proj, 0) end;
  return jsonb_build_object(
    'trimestre', v_tri, 'inicio', v_ini, 'fim', v_fim,
    'dias_uteis_restantes', case when public.hoje() > v_fim then 0 else public.dias_uteis_entre(greatest(public.hoje(), v_ini), v_fim) end,
    'meta', v_meta, 'assinados', v_assin, 'faltam', v_faltam,
    'projecao', round(v_proj, 1), 'lacuna', round(v_lacuna, 1),
    'reunioes_necessarias', case when v_lacuna > 0 and v_ch_reun > 0 then ceil(v_lacuna * 100 / v_ch_reun) else 0 end,
    'contatos_necessarios', case when v_lacuna > 0 and v_ch_cont > 0 then ceil(v_lacuna * 100 / v_ch_cont) else 0 end,
    'etapas', v_etapas);
end $$;

-- ---------------------------------------------------------------------------
-- Metas do programa no trimestre: meta, realizado até hoje, ritmo e o ano (soma dos trimestres)
-- ---------------------------------------------------------------------------
create or replace function public.metas_trimestre(p_trimestre text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tri text := coalesce(p_trimestre, to_char(public.hoje(), 'YYYY-"T"Q'));
  v_ano int := split_part(v_tri, '-T', 1)::int;
  v_ini date; v_fim date; v_ate date;
  v_admin boolean := auth.uid() is null or public.is_admin();
  v_val jsonb := '{}';
  v_val_ano jsonb := '{}';
begin
  if auth.uid() is not null and not public.is_interno() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select inicio, fim into v_ini, v_fim from public.trimestre_datas(v_tri);
  v_ate := least(v_fim, public.hoje());
  if v_ate >= v_ini then v_val := public._indicadores_valores(v_ini, v_ate, v_admin); end if;
  if public.hoje() >= make_date(v_ano, 1, 1) then
    v_val_ano := public._indicadores_valores(make_date(v_ano, 1, 1), least(make_date(v_ano, 12, 31), public.hoje()), v_admin);
  end if;
  return jsonb_build_object(
    'trimestre', v_tri, 'inicio', v_ini, 'fim', v_fim,
    'dias_total', v_fim - v_ini + 1,
    'dias_passados', greatest(0, least(v_ate - v_ini + 1, v_fim - v_ini + 1)),
    'itens', (select coalesce(jsonb_agg(jsonb_build_object(
        'chave', i.chave, 'nome', i.nome, 'formato', i.formato, 'principal', i.principal, 'frente', i.etapa,
        'meta', m.valor, 'realizado', v_val -> i.chave,
        'somavel', i.formato in ('numero', 'moeda') and i.chave <> 'nps',
        'meta_ano', case when i.formato in ('numero', 'moeda') and i.chave <> 'nps' then
                      (select sum(x.valor) from public.metas x where x.indicador_chave = i.chave and x.periodo like v_ano || '-T%') end,
        'realizado_ano', case when i.formato in ('numero', 'moeda') and i.chave <> 'nps' then v_val_ano -> i.chave end,
        'trimestres_com_meta', (select count(*) from public.metas x where x.indicador_chave = i.chave and x.periodo like v_ano || '-T%'),
        'acumulado', case when i.chave in ('assinados', 'ativados', 'clientes_icp') then public._valor_criterio(i.chave) end)
        order by i.principal desc, i.ordem), '[]')
      from public.indicadores i left join public.metas m on m.indicador_chave = i.chave and m.periodo = v_tri
      where i.ativo and i.aceita_meta and (v_admin or not i.so_admin)),
    'funil', public.funil_reverso(v_tri));
end $$;

-- ---------------------------------------------------------------------------
-- Meu painel: realizado do trimestre nos indicadores da meta por pessoa e funil reverso da carteira.
-- Crédito: responsável pelo parceiro na data do evento.
-- reunioes: possíveis parceiros com reunião no trimestre (contato do tipo reunião ou passagem para "Reunião realizada").
-- regua_em_dia: retrato de hoje, em % dos parceiros da pessoa em que a régua se aplica.
-- ---------------------------------------------------------------------------
create or replace function public.painel_pessoal(p_perfil uuid default null, p_trimestre text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_perfil uuid := coalesce(p_perfil, auth.uid());
  v_tri text := coalesce(p_trimestre, to_char(public.hoje(), 'YYYY-"T"Q'));
  v_ini date; v_fim date;
  v_reg int; v_reg_ok int;
  v_real jsonb;
begin
  if not (public.is_admin() or (public.is_parcerias() and v_perfil = auth.uid())) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select inicio, fim into v_ini, v_fim from public.trimestre_datas(v_tri);
  select count(*), count(*) filter (where not (s.v->>'atrasada')::boolean) into v_reg, v_reg_ok
    from public.parceiros p cross join lateral (select public.regua_status(p.id) v) s
   where p.responsavel_id = v_perfil and coalesce((s.v->>'aplica')::boolean, false);
  v_real := jsonb_build_object(
    'assinados', (select count(*) from public.parceiros p where p.data_assinatura between v_ini and v_fim
                   and not public.is_etapa_perda(p.etapa) and public.responsavel_em(p.id, p.data_assinatura) = v_perfil),
    'ativados', (select count(*) from public.planos_onboarding pl where pl.ativado_em between v_ini and v_fim
                   and public.responsavel_em(pl.parceiro_id, pl.ativado_em) = v_perfil),
    'clientes_icp', (select count(*) from public.indicacoes i where i.sentido = 'parceiro_para_grupo' and i.etapa = 'fechada'
                   and coalesce(i.icp_confirmado, i.aderente_icp, false) and i.data_fechamento between v_ini and v_fim
                   and public.responsavel_em(i.parceiro_id, i.data_fechamento) = v_perfil),
    'reunioes', (select count(distinct x.parceiro_id) from (
                   select pc.parceiro_id, (pc.data at time zone 'America/Sao_Paulo')::date as d from public.pontos_contato pc
                    where pc.tipo in ('reuniao_presencial', 'reuniao_online')
                   union all
                   select h.registro_id, (h.created_at at time zone 'America/Sao_Paulo')::date from public.historico h
                    where h.tabela = 'parceiros' and h.campo = 'etapa' and h.valor_novo = 'reuniao_realizada') x
                   join public.parceiros p on p.id = x.parceiro_id
                  where x.d between v_ini and v_fim and (p.data_assinatura is null or p.data_assinatura >= x.d)
                    and public.responsavel_em(p.id, x.d) = v_perfil),
    'regua_em_dia', case when v_reg > 0 then round(v_reg_ok::numeric * 100 / v_reg, 1) end);
  return jsonb_build_object(
    'trimestre', v_tri, 'inicio', v_ini, 'fim', v_fim, 'realizado', v_real,
    'metas', (select coalesce(jsonb_object_agg(indicador, valor), '{}') from public.metas_pessoa where perfil_id = v_perfil and trimestre = v_tri),
    'funil', public.funil_reverso(v_tri, v_perfil),
    'horas', (select round(coalesce(sum(minutos), 0) / 60.0, 1) from public.atividades where pessoa_id = v_perfil and data between v_ini and v_fim),
    'carteira', (select coalesce(jsonb_agg(jsonb_build_object('parceiro_id', p.id, 'parceiro', p.nome_fantasia, 'etapa', p.etapa,
                   'nivel', p.nivel, 'status', p.status_atividade, 'regua', public.regua_status(p.id)) order by p.nome_fantasia), '[]')
                 from public.parceiros p where p.responsavel_id = v_perfil and not public.is_etapa_perda(p.etapa)));
end $$;

-- ---------------------------------------------------------------------------
-- Nível do parceiro: inclui o resultado na janela do requisito e no trimestre
-- ---------------------------------------------------------------------------
create or replace function public.meu_nivel() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  p public.parceiros;
  v_acima text;
  v_jan int := public.config_int('janela_resultado_dias', 180);
  v_tri text := to_char(public.hoje(), 'YYYY-"T"Q');
  v_ini date;
begin
  select * into p from public.parceiros where id = coalesce(public.parceiro_atual(), null);
  if p.id is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  v_acima := case p.nivel when 'C' then 'B' when 'B' then 'A' else null end;
  select inicio into v_ini from public.trimestre_datas(v_tri);
  return jsonb_build_object(
    'nivel', p.nivel, 'tipo', p.tipo_parceria, 'pacote', p.pacote,
    'pacote_pendente', p.pacote_pendente, 'pacote_pendente_em', p.pacote_pendente_em,
    'em_observacao_ate', p.em_observacao_ate,
    'atual', case when p.nivel is not null and p.tipo_parceria = 'comercial' then public.cumpre_nivel(p.id, p.nivel) end,
    'acima', case when v_acima is not null and p.tipo_parceria = 'comercial' then public.cumpre_nivel(p.id, v_acima) end,
    'resultado', (select jsonb_build_object(
        'janela_dias', v_jan, 'trimestre', v_tri,
        'qualificadas_janela', count(*) filter (where i.qualificada and i.data >= public.hoje() - v_jan),
        'clientes_janela', count(*) filter (where i.etapa = 'fechada' and coalesce(i.icp_confirmado, i.aderente_icp, false)
                                             and i.data_fechamento >= public.hoje() - v_jan),
        'qualificadas_trimestre', count(*) filter (where i.qualificada and i.data >= v_ini),
        'clientes_trimestre', count(*) filter (where i.etapa = 'fechada' and coalesce(i.icp_confirmado, i.aderente_icp, false)
                                                and i.data_fechamento >= v_ini))
      from public.indicacoes i where i.parceiro_id = p.id and i.sentido = 'parceiro_para_grupo'));
end $$;

-- Relatório semanal: metas do trimestre e funil reverso
CREATE OR REPLACE FUNCTION public.relatorio_semanal_v2(p_inicio date, p_fim date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tri date := date_trunc('quarter', p_fim)::date;
  v_sem jsonb := public._indicadores_valores(p_inicio, p_fim, true);
  v_res jsonb := public._metricas_canal((select coalesce(jsonb_agg(to_jsonb(x)), '[]') from public._planilha_custos(v_tri, p_fim) x),
                                        public.config_num('margem_contribuicao_pct', 100) / 100);
begin
  return jsonb_build_object(
    'clientes_icp_semana', v_sem->'clientes_icp',
    'clientes_icp_trimestre', v_res->'clientes_icp',
    'roi_trimestre', v_res->'roi',
    'custo_trimestre', v_res->'custo_total',
    'receita_trimestre', v_res->'receita_atribuida',
    'fase', (select fase from public.fase_programa order by desde desc, created_at desc limit 1),
    'metas', public.metas_trimestre(null),
    'destaques', (select coalesce(jsonb_agg(jsonb_build_object('chave', i.chave, 'etapa', i.etapa, 'nome', i.nome, 'formato', i.formato,
                    'valor', v_sem->i.chave) order by i.ordem), '[]')
                  from public.indicadores i where i.ativo and i.destaque));
end $function$;
