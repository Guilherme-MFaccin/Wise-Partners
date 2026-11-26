-- Hierarquia antiga fora do portal (26/11/2026): os pacotes C · Prateleira, B · Formação e A · Base Ativa saem.
-- Decisão do FO-19 (to-be v15), "os pacotes saem e os benefícios seguem o nível": entregas da Wise, tarefas de onboarding,
-- Wise Hub, contrapartidas, ações da Wise e cadência da régua passam a depender do nível (Select, Premium, Elite).
-- Mesma correspondência de antes: o que era do pacote C vale para o Select, do B para o Premium e do A para o Elite.

-- 1. Benefícios no nível
alter table public.niveis add column if not exists entregas jsonb not null default '[]';
alter table public.niveis add column if not exists tarefas_onboarding jsonb not null default '[]';
alter table public.niveis add column if not exists wise_hub boolean not null default false;
comment on column public.niveis.entregas is 'Entregas da Wise ao parceiro neste nível';
comment on column public.niveis.tarefas_onboarding is 'Tarefas do onboarding criadas na assinatura para este nível';
comment on column public.niveis.wise_hub is 'O nível dá acesso ao Wise Hub';
update public.niveis n set entregas = x.entregas, tarefas_onboarding = x.tarefas_onboarding, wise_hub = x.wise_hub
  from public.pacotes x where n.tipo_parceria = 'comercial' and x.codigo = n.codigo;

-- 2. Catálogos por nível
update public.catalogo_contrapartidas
   set niveis = case when niveis is null then pacotes else array(select unnest(niveis) intersect select unnest(pacotes) order by 1) end
 where tipo_parceria = 'comercial';
alter table public.catalogo_contrapartidas rename column periodicidade_por_pacote to periodicidade_por_nivel;
alter table public.catalogo_contrapartidas drop column pacotes;
alter table public.catalogo_acoes_wise rename column pacotes to niveis;
alter table public.catalogo_acoes_wise rename column periodicidade_por_pacote to periodicidade_por_nivel;
comment on column public.catalogo_contrapartidas.niveis is 'Níveis em que a contrapartida vale (parceria comercial); vazio na institucional';
comment on column public.catalogo_acoes_wise.niveis is 'Níveis em que a ação da Wise vale';

-- 3. Régua de atendimento por nível
update public.regua_atendimento set chave = 'nivel:C', descricao = 'Select: reunião de acompanhamento trimestral, 30 min' where chave = 'pacote:C';
update public.regua_atendimento set chave = 'nivel:B', descricao = 'Premium: reunião de acompanhamento mensal, 45 min' where chave = 'pacote:B';
update public.regua_atendimento set chave = 'nivel:A', descricao = 'Elite: reunião mensal fora do ciclo do Base Ativa' where chave = 'pacote:A';
update public.regua_atendimento set chave = 'nivel:A:ciclo', descricao = 'Elite: reunião quinzenal durante o ciclo do Base Ativa' where chave = 'pacote:A:ciclo';
update public.regua_atendimento set descricao = replace(descricao, 'cadência do pacote', 'cadência do nível') where chave = 'faixa:base';

-- 4. Textos e retratos que citavam os pacotes
update public.configuracoes set descricao = 'Endereço do Wise Hub (botão no portal do parceiro, níveis Premium e Elite)' where chave = 'wise_hub_url';
update public.comunicados set recorte = recorte - 'pacotes' where recorte ? 'pacotes';
update public.catalogo_contrapartidas set meta = replace(meta, 'Pacote A:', 'Elite:') where meta like '%Pacote A:%';
update public.contrapartidas set meta = replace(meta, 'Pacote A:', 'Elite:') where meta like '%Pacote A:%';
update public.tipos_atividade set nome = 'Tarefas de implantação do nível', chave = 'implantacao_nivel' where chave = 'implantacao_pacote';
update public.textos_email set corpo = replace(corpo, 'O pacote só muda se vocês escolherem um pacote superior.', 'As entregas da Wise passam a ser as deste nível.')
 where chave = 'nivel_subida';
update public.textos_email set corpo = replace(corpo, 'O pacote novo vale a partir de {{data}}.', 'As entregas e as contrapartidas passam a ser as deste nível.')
 where chave = 'nivel_rebaixamento_confirmado';

-- 5. Funções sem pacote (texto a partir das definições em produção)
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
  if p.tipo_parceria = 'comercial' and p.nivel is null then return 0; end if;

  for c in
    select * from public.catalogo_contrapartidas k
    where k.ativa and k.tipo_parceria = p.tipo_parceria
      and (k.niveis is null or p.nivel = any (k.niveis))
      and (k.natureza_juridica is null or p.natureza_juridica = any (k.natureza_juridica))
      and not exists (select 1 from public.contrapartidas x where x.parceiro_id = p.id and x.catalogo_id = k.id)
    order by k.ordem
  loop
    v_per := coalesce(c.periodicidade_por_nivel->>p.nivel, c.periodicidade);
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

CREATE OR REPLACE FUNCTION public.gerar_acoes_wise(p_parceiro uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p public.parceiros;
  c record;
  v_per text;
  n int := 0;
begin
  select * into p from public.parceiros where id = p_parceiro;
  if p.data_assinatura is null or p.tipo_parceria <> 'comercial' or p.nivel is null then return 0; end if;
  for c in
    select * from public.catalogo_acoes_wise k
    where k.ativa and p.nivel = any (k.niveis)
      and not exists (select 1 from public.acoes_wise x where x.parceiro_id = p.id and x.catalogo_id = k.id)
    order by k.ordem
  loop
    v_per := coalesce(c.periodicidade_por_nivel->>p.nivel, c.periodicidade);
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
end $function$;

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
    select tarefas_onboarding into v_tarefas from public.niveis where tipo_parceria = 'comercial' and codigo = p.nivel;
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
  if p.tipo_parceria = 'comercial' and p.nivel = 'A' and not exists (
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

CREATE OR REPLACE FUNCTION public.decidir_rebaixamento(p_revisao uuid, p_confirmar boolean, p_motivo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rv public.revisoes_nivel;
  p public.parceiros;
  v_novo text;
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
  update public.parceiros set nivel = v_novo, nivel_ajuste_motivo = 'Rebaixamento confirmado: ' || p_motivo, em_observacao_ate = null
   where id = p.id;
  update public.revisoes_nivel set decisao = 'confirmado', decidido_por = auth.uid(), decidido_em = now(), motivo = p_motivo
   where id = rv.id;
  perform public.notificar_parceiro(p.id, 'nivel_rebaixamento_confirmado', 'Mudança de nível',
    format('Depois de um trimestre em observação, o nível da parceria passou para %s. As entregas e as contrapartidas passam a ser as deste nível.',
      case v_novo when 'B' then 'Premium' else 'Select' end),
    '/parceiro/nivel');
end $function$;

CREATE OR REPLACE FUNCTION public.regua_status(p_parceiro uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  if p.id is null or not public.parceiro_assinado(p.id) or p.status_atividade = 'pausado' or p.tipo_parceria <> 'comercial' or p.nivel is null then
    return jsonb_build_object('aplica', false);
  end if;
  v_ciclo := exists (select 1 from public.ciclos_base_ativa c where c.parceiro_id = p.id and c.estado = 'em_ciclo');
  for r in select * from public.regua_atendimento
           where chave in ('nivel:' || p.nivel || case when p.nivel = 'A' and v_ciclo then ':ciclo' else '' end,
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
end $function$;

CREATE OR REPLACE FUNCTION public.meu_nivel()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'nivel', p.nivel, 'tipo', p.tipo_parceria,
    'entregas', (select n.entregas from public.niveis n where n.tipo_parceria = 'comercial' and n.codigo = p.nivel and p.tipo_parceria = 'comercial'),
    'wise_hub', coalesce((select n.wise_hub from public.niveis n where n.tipo_parceria = 'comercial' and n.codigo = p.nivel and p.tipo_parceria = 'comercial'), false),
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
end $function$;

CREATE OR REPLACE FUNCTION public.situacao_nivel(p_parceiro uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.parceiros;
begin
  if not (public.is_parcerias() or public.is_consultor()) then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into p from public.parceiros where id = p_parceiro;
  return jsonb_build_object(
    'nivel', p.nivel, 'nivel_entrada', p.nivel_entrada, 'em_observacao_ate', p.em_observacao_ate,
    'niveis', jsonb_build_object('C', public.cumpre_nivel(p.id, 'C'), 'B', public.cumpre_nivel(p.id, 'B'), 'A', public.cumpre_nivel(p.id, 'A')),
    'regua', public.regua_status(p.id),
    'faixa', (select to_jsonb(f) from public.faixas f where f.parceiro_id = p.id));
end $function$;

CREATE OR REPLACE FUNCTION public.verificar_subida_nivel(p_parceiro uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    format('Parabéns! Vocês cumpriram os requisitos e passaram para o nível %s. As entregas da Wise passam a ser as deste nível.', v_nome),
    '/parceiro/nivel');
  perform public.notificar_responsavel(p.id, 'nivel_subida', 'Subida de nível por resultado',
    format('%s passou para %s por resultado.', p.nome_fantasia, v_nome), '/app/parceiros/' || p.id || '?aba=nivel');
  return v_alvo;
end $function$;

CREATE OR REPLACE FUNCTION public.enviar_comunicado(p_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c public.comunicados;
  r record;
  n int := 0;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.comunicados where id = p_id;
  if c.enviado_em is not null then raise exception 'Comunicado já enviado.' using errcode = 'P0001'; end if;
  for r in
    select pf.id as perfil_id, p.id as parceiro_id from public.perfis pf join public.parceiros_visiveis() p on p.id = pf.parceiro_id
    where pf.ativo and pf.papel = 'parceiro' and public.parceiro_assinado(p.id)
      and (coalesce(jsonb_array_length(c.recorte->'niveis'), 0) = 0 or p.nivel in (select jsonb_array_elements_text(c.recorte->'niveis')))
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
end $function$;

CREATE OR REPLACE FUNCTION public.regras_retrato()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'niveis', (select jsonb_agg(jsonb_build_object('codigo', n.codigo, 'nome', n.nome, 'faixa_min', n.faixa_min, 'faixa_max', n.faixa_max,
                 'requisitos', (select jsonb_agg(jsonb_build_object('grupo', r.grupo, 'descricao', r.descricao) order by r.grupo)
                                from public.requisitos_nivel r where r.nivel = n.codigo
                                  and r.vigente_desde = (select max(vigente_desde) from public.requisitos_nivel r2
                                                         where r2.nivel = r.nivel and r2.grupo = r.grupo and r2.vigente_desde <= public.hoje())))
                 order by n.codigo desc) from public.niveis n where n.tipo_parceria = 'comercial'),
    'beneficios', (select jsonb_agg(jsonb_build_object('codigo', codigo, 'nome', nome, 'entregas', entregas) order by codigo desc) from public.niveis where tipo_parceria = 'comercial'),
    -- Wise com duas linhas (proposta comercial de 26/11/2026): venda pontual e contrato contínuo
    'comissoes', (select jsonb_agg(x.j order by x.o, x.k) from (
                    select ordem o, 1 k, jsonb_build_object('empresa', nome, 'base', base_calculo, 'percentual_parceiro', pct_parceiro) j from public.empresas_grupo
                    union all
                    select ordem, 0, jsonb_build_object('empresa', nome, 'base', base_calculo_pontual, 'percentual_parceiro', pct_parceiro_pontual)
                      from public.empresas_grupo where pct_parceiro_pontual is not null) x),
    'protecao_dias', public.config_int('protecao_indicacao_dias', 180),
    'sla', jsonb_build_object('validacao_dias_uteis', public.config_int('sla_validacao_dias_uteis', 2),
      'retorno_parceiro_dias_uteis', public.config_int('sla_retorno_parceiro_dias_uteis', 5),
      'atualizacao_dias', public.config_int('sla_atualizacao_dias', 15),
      'parceiro_contato_dias_uteis', public.config_int('sla_parceiro_contato_dias_uteis', 2),
      'parceiro_atualizacao_dias_uteis', public.config_int('sla_parceiro_atualizacao_dias_uteis', 5)),
    'regua', (select jsonb_agg(jsonb_build_object('chave', chave, 'descricao', descricao) order by chave) from public.regua_atendimento where chave like 'nivel:%'),
    'desligamento', jsonb_build_object('dias_assinatura', public.config_int('risco_dias_assinatura', 180),
      'janela_dias', public.config_int('risco_janela_dias', 180), 'intervalo_tentativas', public.config_int('retomada_intervalo_dias', 15),
      'espera_dias', public.config_int('retomada_espera_dias', 30), 'aviso_dias', public.config_int('aviso_desligamento_dias', 30)),
    'ranking', public.config('pontos_ranking'),
    'premiacao', public.config('categorias_premiacao'),
    'revisao', jsonb_build_object('janela_dias', public.config_int('janela_resultado_dias', 180), 'isencao_dias', public.config_int('isencao_revisao_dias', 180)))
$function$;

CREATE OR REPLACE FUNCTION public.trg_parceiros_antes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sc public.scorecards;
  v_nivel_tocado boolean := tg_op = 'INSERT' or new.nivel is distinct from old.nivel;
begin
  -- Nível de entrada: faixa da base no ICP ajustada pela qualidade do scorecard (FR-114)
  if new.tipo_parceria = 'comercial' then
    v_sc := public.scorecard_vigente(new.id);
    new.nivel_entrada := public.nivel_entrada_calc(new.carteira_icp, case when v_sc.completo then v_sc.nota_qualidade end);
    new.nivel_sugerido := new.nivel_entrada;
    if new.nivel is null then
      new.nivel := new.nivel_sugerido;
    elsif not v_nivel_tocado and new.data_assinatura is null and coalesce(btrim(new.nivel_ajuste_motivo), '') = ''
          and new.nivel_sugerido is not null then
      -- Antes da assinatura, sem ajuste manual, o nível acompanha o nível de entrada
      new.nivel := new.nivel_sugerido;
    end if;
    if new.nivel is not null and new.nivel_sugerido is not null and new.nivel <> new.nivel_sugerido
       and v_nivel_tocado and coalesce(btrim(new.nivel_ajuste_motivo), '') = '' then
      raise exception 'Ajuste manual de nível exige motivo (nível sugerido: %).', new.nivel_sugerido
        using errcode = 'P0001';
    end if;
    if new.nivel = new.nivel_sugerido and v_nivel_tocado then
      new.nivel_ajuste_motivo := null;
    end if;
  else
    new.nivel_sugerido := null;
    new.nivel_entrada := null;
  end if;

  -- Funil
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    new.etapa_desde := now();
    if new.etapa = 'fechamento' and not public.tem_aprovacao_assinatura(new.id) then
      raise exception 'A passagem para fechamento exige a aprovação do Diretor registrada no portal.' using errcode = 'P0001';
    end if;
    if new.etapa = 'onboarding' then
      if not public.tem_aprovacao_assinatura(new.id) then
        raise exception 'A passagem para onboarding exige a aprovação do Diretor.' using errcode = 'P0001';
      end if;
      if new.data_assinatura is null then
        raise exception 'Anexe o contrato assinado e informe a data de assinatura antes do onboarding.' using errcode = 'P0001';
      end if;
    end if;
    if new.etapa = 'parceria_ativa' and new.data_assinatura is null then
      raise exception 'Parceria ativa exige contrato assinado.' using errcode = 'P0001';
    end if;
    -- Scorecard completo antes da proposta (FR-116), em mudanças feitas por pessoas no portal
    if tg_op = 'UPDATE' and new.etapa = 'proposta_decisor' and new.tipo_parceria = 'comercial' and auth.uid() is not null then
      v_sc := public.scorecard_vigente(new.id);
      if v_sc.id is null or not v_sc.completo then
        raise exception 'Preencha o scorecard completo antes da proposta com o decisor. Faltam: %.',
          coalesce(array_to_string(v_sc.faltantes, ', '), 'todos os critérios') using errcode = 'P0001';
      end if;
      if v_sc.nao_elegivel_sugerido and (not public.is_admin() or coalesce(btrim(new.elegibilidade_motivo), '') = '') then
        raise exception 'O scorecard sugere "não elegível". Só um administrador segue com a negociação, registrando o motivo.'
          using errcode = 'P0001';
      end if;
    end if;
    -- Nutrição: pausa com data de retomada, sem morno nem dormente (FR-149)
    if new.etapa = 'nutricao' then
      if new.nutricao_ate is null or new.nutricao_ate < public.hoje() then
        raise exception 'Informe a data de retomada da nutrição.' using errcode = 'P0001';
      end if;
      if tg_op = 'UPDATE' and old.etapa <> 'nutricao' then
        new.etapa_antes_nutricao := old.etapa;
      end if;
      new.nutricao_cadencia_dias := coalesce(new.nutricao_cadencia_dias, public.config_int('nutricao_cadencia_dias', 30));
      new.pausado_ate := new.nutricao_ate;
    elsif tg_op = 'UPDATE' and old.etapa = 'nutricao' then
      if new.pausado_ate is not distinct from old.nutricao_ate then
        new.pausado_ate := null;
      end if;
      new.nutricao_ate := null;
    end if;
    if new.etapa = 'parceria_encerrada' and new.data_encerramento is null then
      new.data_encerramento := public.hoje();
    end if;
  elsif new.etapa = 'nutricao' and new.nutricao_ate is distinct from old.nutricao_ate then
    new.pausado_ate := new.nutricao_ate;
  end if;

  -- Status de atividade calculado (nunca muda o nível)
  if new.pausado_ate is not null and new.pausado_ate < public.hoje() then
    new.pausado_ate := null;
  end if;
  new.status_atividade := public.calcular_status(
    new.tipo_parceria, new.nivel, new.ultimo_contato, new.pausado_ate,
    coalesce(new.created_at, now())::date);
  if new.status_atividade = 'ativo' then
    new.motivo_inatividade := null;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.trg_parceiros_depois()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_diretor record;
  v_data date;
begin
  if tg_op = 'INSERT' then
    insert into public.parceiros_interno (parceiro_id) values (new.id) on conflict do nothing;
    insert into public.parceiros_instrumento (parceiro_id) values (new.id) on conflict do nothing;
  end if;

  if tg_op = 'INSERT' or new.carteira_icp is distinct from old.carteira_icp then
    perform public.atualizar_estrategico_sugerido(new.id);
  end if;

  if tg_op = 'UPDATE' and new.etapa is distinct from old.etapa then
    if new.etapa = 'onboarding' then
      perform public.iniciar_onboarding(new.id);
    end if;
    if new.etapa = 'proposta_decisor' and not public.tem_aprovacao_assinatura(new.id) then
      for v_diretor in select id from public.perfis where is_diretor and ativo loop
        perform public.notificar(v_diretor.id, 'aprovacao_pendente', 'Aprovação de assinatura pendente',
          format('%s está em proposta com o decisor e aguarda a sua aprovação.', new.nome_fantasia),
          '/app/parceiros/' || new.id, '{}'::jsonb, true);
      end loop;
    end if;
    if new.etapa = 'parceria_encerrada' then
      update public.contrapartidas set ativa = false where parceiro_id = new.id;
      update public.acoes_wise set ativa = false where parceiro_id = new.id and estado in ('planejada', 'atrasada');
      update public.links_indicacao set ativo = false, revogado_em = now() where parceiro_id = new.id and ativo;
    end if;
    if new.etapa = 'nutricao' then
      v_data := least(new.nutricao_ate, public.hoje() + new.nutricao_cadencia_dias);
      insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id)
      values (new.id, 'Contato de nutrição', v_data, new.responsavel_id);
    end if;
  end if;

  -- Entregas e contrapartidas seguem o nível: na mudança de nível, sai o que não vale para o novo e entra o que falta
  if tg_op = 'UPDATE' and new.data_assinatura is not null and new.tipo_parceria = 'comercial' and old.data_assinatura is not null
     and new.nivel is distinct from old.nivel then
    update public.contrapartidas c set ativa = false
      from public.catalogo_contrapartidas k
     where c.catalogo_id = k.id and c.parceiro_id = new.id and c.ativa and k.niveis is not null and not (new.nivel = any (k.niveis));
    update public.acoes_wise a set ativa = false, estado = case when a.estado in ('planejada', 'atrasada') then 'cancelada' else a.estado end
      from public.catalogo_acoes_wise k
     where a.catalogo_id = k.id and a.parceiro_id = new.id and a.ativa and not (new.nivel = any (k.niveis));
  end if;
  if tg_op = 'UPDATE' and new.data_assinatura is not null
     and (old.data_assinatura is null or new.nivel is distinct from old.nivel) then
    perform public.gerar_contrapartidas(new.id);
    perform public.gerar_acoes_wise(new.id);
  end if;

  -- Base no ICP atualizada depois da assinatura levando a nível de entrada acima do atual: sugere subida
  if tg_op = 'UPDATE' and new.data_assinatura is not null and new.carteira_icp is distinct from old.carteira_icp
     and new.nivel_entrada is not null and new.nivel is not null and new.nivel_entrada < new.nivel then
    perform public.notificar_responsavel(new.id, 'nivel_subida_sugerida', 'Subida de nível sugerida',
      format('A base no ICP de %s indica o nível de entrada %s. Confirme a subida por escrito, se for o caso.',
             new.nome_fantasia, case new.nivel_entrada when 'A' then 'Elite' when 'B' then 'Premium' else 'Select' end),
      '/app/parceiros/' || new.id || '?aba=nivel');
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.rotina_diaria()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n_status int;
  n_passos int;
  n_contra int;
  n_nutricao int := 0;
  n_sla int := 0;
  n_regua int := 0;
  n_acoes int;
  n_onb int := 0;
  n_subida int := 0;
  n_faixas int;
  n_desl int;
  n_check int := 0;
  n_protecao int := 0;
  n_purga int;
  r record;
  i public.indicacoes;
  k text;
  s jsonb;
  v_hoje date := public.hoje();
  v_ext int := public.config_int('onboarding_extensao_dias', 120);
begin
  -- Nutrição vencida: volta à etapa anterior (FR-118)
  for r in select p.id, p.nome_fantasia, p.etapa_antes_nutricao, p.responsavel_id from public.parceiros_visiveis() p
           where p.etapa = 'nutricao' and p.nutricao_ate < v_hoje loop
    begin
      update public.parceiros set etapa = coalesce(r.etapa_antes_nutricao, 'contato_feito') where id = r.id;
      n_nutricao := n_nutricao + 1;
      perform public.notificar_responsavel(r.id, 'nutricao_fim', 'Nutrição terminou',
        format('%s voltou para o funil. Retome o contato.', r.nome_fantasia), '/app/parceiros/' || r.id);
    exception when others then
      perform public.notificar_responsavel(r.id, 'nutricao_fim', 'Nutrição terminou',
        format('%s terminou a nutrição, mas não voltou sozinho para a etapa anterior: %s', r.nome_fantasia, sqlerrm),
        '/app/parceiros/' || r.id);
    end;
  end loop;

  -- v1: status de atividade, próximos passos, contrapartidas e estratégico
  update public.parceiros p
     set status_atividade = public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
   where not p.demonstracao and (p.status_atividade is distinct from public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
      or (p.pausado_ate is not null and p.pausado_ate < v_hoje));
  get diagnostics n_status = row_count;

  update public.proximos_passos set estado = 'vencido' where estado = 'aberto' and data < v_hoje;
  get diagnostics n_passos = row_count;

  update public.contrapartidas set estado = 'atrasada'
   where ativa and estado in ('pendente', 'validada', 'recusada') and proxima_data is not null and proxima_data < v_hoje;
  get diagnostics n_contra = row_count;

  for r in select id from public.parceiros_visiveis() loop
    perform public.atualizar_estrategico_sugerido(r.id);
  end loop;

  -- SLA das indicações (FR-134): um aviso por prazo vencido
  for i in select * from public.indicacoes where etapa not in ('fechada', 'perdida') and sla <> '{}'::jsonb loop
    foreach k in array public.sla_vencidos(i) loop
      if public.alerta_novo('sla', i.id, k || ':' || coalesce((i.ultima_atualizacao at time zone 'America/Sao_Paulo')::date::text, '')) then
        n_sla := n_sla + 1;
        if i.sentido = 'parceiro_para_grupo' then
          if i.responsavel_id is not null then
            perform public.notificar(i.responsavel_id, 'sla_vencido', 'Prazo de indicação vencido',
              format('Indicação com prazo vencido: %s.', replace(k, '_', ' ')), '/app/indicacoes/' || i.id,
              jsonb_build_object('indicacao_id', i.id, 'prazo', k));
          else
            perform public.notificar_responsavel(i.parceiro_id, 'sla_vencido', 'Prazo de indicação vencido',
              format('Indicação com prazo vencido: %s.', replace(k, '_', ' ')), '/app/indicacoes/' || i.id,
              jsonb_build_object('indicacao_id', i.id, 'prazo', k));
          end if;
        else
          perform public.notificar_parceiro(i.parceiro_id, 'sla_vencido', 'Atualize a indicação da Wise',
            'Uma indicação que a Wise fez para vocês está esperando contato ou atualização.', '/parceiro/indicacoes',
            jsonb_build_object('indicacao_id', i.id, 'prazo', k));
          perform public.notificar_responsavel(i.parceiro_id, 'sla_vencido', 'Parceiro com prazo vencido',
            format('O parceiro não cumpriu o prazo de %s de uma indicação da Wise.', replace(k, '_', ' ')),
            '/app/indicacoes/' || i.id, jsonb_build_object('indicacao_id', i.id, 'prazo', k));
        end if;
      end if;
    end loop;
  end loop;

  -- Proteção de 180 dias vencida (FR-133): avisa parceiro e responsável uma vez
  for i in select * from public.indicacoes where sentido = 'parceiro_para_grupo' and etapa not in ('fechada', 'perdida')
             and protecao_ate is not null and protecao_ate < v_hoje and not protecao_expirada loop
    if public.alerta_novo('protecao', i.id, i.protecao_ate::text) then
      n_protecao := n_protecao + 1;
      perform public.notificar_parceiro(i.parceiro_id, 'protecao_vencendo', 'Proteção de indicação vencida',
        'Uma indicação de vocês ficou 180 dias sem interação e perdeu a proteção. Se ainda houver oportunidade, atualize com a Wise.',
        '/parceiro/indicacoes', jsonb_build_object('indicacao_id', i.id));
      perform public.notificar_responsavel(i.parceiro_id, 'protecao_vencendo', 'Proteção de indicação vencida',
        'Indicação sem interação há 180 dias: a proteção venceu.', '/app/indicacoes/' || i.id, jsonb_build_object('indicacao_id', i.id));
    end if;
  end loop;

  -- Régua de atendimento (FR-163)
  for r in select p.id, p.nome_fantasia from public.parceiros_visiveis() p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa) loop
    s := public.regua_status(r.id);
    if coalesce((s->>'atrasada')::boolean, false) and public.alerta_novo('regua', r.id, s->>'proxima_ate') then
      n_regua := n_regua + 1;
      perform public.notificar_responsavel(r.id, 'regua_atrasada', 'Reunião da régua atrasada',
        format('%s está sem reunião desde %s (cadência de %s dias).', r.nome_fantasia,
               coalesce(to_char((s->>'ultima_reuniao')::date, 'DD/MM/YYYY'), 'a assinatura'), s->>'cadencia_dias'),
        '/app/parceiros/' || r.id);
    end if;
  end loop;

  -- Ações da Wise atrasadas (FR-160)
  update public.acoes_wise set estado = 'atrasada'
   where ativa and estado = 'planejada' and data_prevista is not null and data_prevista < v_hoje;
  get diagnostics n_acoes = row_count;
  for r in select a.id, a.nome, a.parceiro_id, a.responsavel_id from public.acoes_wise a
           where a.ativa and a.estado = 'atrasada' and not a.alertada loop
    if r.responsavel_id is not null then
      perform public.notificar(r.responsavel_id, 'acao_wise_atrasada', 'Ação da Wise atrasada',
        format('A ação "%s" passou da data prevista.', r.nome), '/app/parceiros/' || r.parceiro_id);
    else
      perform public.notificar_responsavel(r.parceiro_id, 'acao_wise_atrasada', 'Ação da Wise atrasada',
        format('A ação "%s" passou da data prevista.', r.nome), '/app/parceiros/' || r.parceiro_id);
    end if;
    update public.acoes_wise set alertada = true where id = r.id;
  end loop;

  -- Onboarding: ativação por reunião que chegou, marcos, 90 e 120 dias (FR-125 a FR-127)
  for r in select pl.*, p.nome_fantasia, p.responsavel_id from public.planos_onboarding pl join public.parceiros_visiveis() p on p.id = pl.parceiro_id
           where pl.situacao = 'em_andamento' loop
    perform public.verificar_ativacao(r.parceiro_id);
    perform public.verificar_marcos_onboarding(r.parceiro_id);
    if exists (select 1 from public.planos_onboarding where parceiro_id = r.parceiro_id and situacao = 'ativado') then
      n_onb := n_onb + 1;
      continue;
    end if;
    if r.estendido_ate is null and v_hoje >= r.prazo_final and not r.alertado_90 then
      update public.planos_onboarding set estendido_ate = r.inicio + v_ext, alertado_90 = true where parceiro_id = r.parceiro_id;
      insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id, created_by)
      values (r.parceiro_id, 'Onboarding sem ativação em 90 dias: combinar plano de recuperação', public.add_dias_uteis(v_hoje, 2),
              r.responsavel_id, null);
      perform public.notificar_responsavel(r.parceiro_id, 'onboarding_sem_ativacao', 'Onboarding sem ativação',
        format('%s chegou aos 90 dias sem ativação. O prazo foi estendido até %s.', r.nome_fantasia,
               to_char(r.inicio + v_ext, 'DD/MM/YYYY')), '/app/parceiros/' || r.parceiro_id);
      n_onb := n_onb + 1;
    elsif r.estendido_ate is not null and v_hoje > r.estendido_ate then
      update public.planos_onboarding set situacao = 'nao_ativado' where parceiro_id = r.parceiro_id;
      perform public.notificar_responsavel(r.parceiro_id, 'onboarding_sem_ativacao', 'Onboarding encerrado sem ativação',
        format('%s não foi ativado em %s dias. Avalie o próximo passo com o parceiro.', r.nome_fantasia, v_ext),
        '/app/parceiros/' || r.parceiro_id);
      n_onb := n_onb + 1;
    end if;
  end loop;
  -- Encontros e marcos vencidos sem registro: um aviso por marco
  for r in select m.id, m.parceiro_id, m.tipo from public.marcos_onboarding m join public.planos_onboarding pl on pl.parceiro_id = m.parceiro_id
           where pl.situacao = 'em_andamento' and m.cumprido_em is null and m.prazo < v_hoje and m.tipo <> 'marco_90' loop
    if public.alerta_novo('marco_onboarding', r.id, '') then
      perform public.notificar_responsavel(r.parceiro_id, 'marco_onboarding', 'Marco do onboarding vencido',
        format('O item "%s" do onboarding passou do prazo.', replace(r.tipo, '_', ' ')), '/app/parceiros/' || r.parceiro_id);
    end if;
  end loop;

  -- Subida de nível por resultado (imediata)
  for r in select id from public.parceiros_visiveis() where data_assinatura is not null and not public.is_etapa_perda(etapa) and tipo_parceria = 'comercial' loop
    if public.verificar_subida_nivel(r.id) is not null then n_subida := n_subida + 1; end if;
  end loop;

  -- Faixas e fluxo de desligamento
  n_faixas := public.calcular_faixas();
  n_desl := public.avaliar_desligamentos();

  -- Checagens do cliente aos 6 e 12 meses (FR-137)
  for r in select c.id, c.parceiro_id, c.marco, cl.razao_social, ind.responsavel_id from public.checagens_cliente c
           join public.indicacoes ind on ind.id = c.indicacao_id join public.clientes cl on cl.id = ind.cliente_id
           where c.registrada_em is null and c.prevista_para <= v_hoje loop
    if public.alerta_novo('checagem', r.id, '') then
      n_check := n_check + 1;
      if r.responsavel_id is not null then
        perform public.notificar(r.responsavel_id, 'checagem_cliente', 'Checagem do cliente indicado',
          format('Confira como está %s (%s depois do fechamento).', r.razao_social, r.marco), '/app/parceiros/' || r.parceiro_id);
      else
        perform public.notificar_responsavel(r.parceiro_id, 'checagem_cliente', 'Checagem do cliente indicado',
          format('Confira como está %s (%s depois do fechamento).', r.razao_social, r.marco), '/app/parceiros/' || r.parceiro_id);
      end if;
    end if;
  end loop;

  -- Cruzamento: purga das coincidências vencidas; limpeza do controle de envios do link
  n_purga := public.purgar_cruzamentos();
  delete from public.envios_link_limite where janela < now() - interval '2 days';

  return jsonb_build_object('status', n_status, 'proximos_passos', n_passos, 'contrapartidas', n_contra,
    'nutricao', n_nutricao, 'sla', n_sla, 'protecao', n_protecao, 'regua', n_regua, 'acoes_wise', n_acoes,
    'onboarding', n_onb, 'subidas', n_subida, 'faixas', n_faixas, 'desligamentos', n_desl,
    'checagens', n_check, 'purga_cruzamento', n_purga);
end $function$;

CREATE OR REPLACE FUNCTION public.aprovar_cadastro_landing(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c public.cadastros_landing;
  v_parceiro uuid;
  v_contato uuid;
  v_existente public.parceiros;
  v_tipo text;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into c from public.cadastros_landing where id = p_id for update;
  if c.id is null then raise exception 'Cadastro não encontrado.' using errcode = 'P0001'; end if;
  if c.status not in ('fila', 'contatado', 'reuniao_marcada') then
    raise exception 'Este cadastro não está na fila.' using errcode = 'P0001';
  end if;
  select * into v_existente from public.parceiros where public.somente_digitos(cnpj) = c.cnpj limit 1;
  if v_existente.id is not null and v_existente.tipo_parceria <> 'cliente' then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  select case when tipo = 'institucional' then 'institucional' else 'comercial' end into v_tipo from public.categorias where id = c.categoria_id;
  v_tipo := coalesce(v_tipo, 'comercial');

  if v_existente.id is not null then
    -- Empresa da comunidade (cliente do grupo ou membro): o mesmo registro passa a ser parceiro
    v_parceiro := v_existente.id;
    update public.parceiros set tipo_parceria = v_tipo, etapa = 'qualificacao' where id = v_parceiro;
    if c.categoria_id is not null and not exists (select 1 from public.parceiro_categorias where parceiro_id = v_parceiro and categoria_id = c.categoria_id) then
      insert into public.parceiro_categorias (parceiro_id, categoria_id, principal)
      values (v_parceiro, c.categoria_id, not exists (select 1 from public.parceiro_categorias where parceiro_id = v_parceiro and principal));
    end if;
    update public.parceiro_contatos set papeis = (select array_agg(distinct x) from unnest(papeis || array['responsavel_parceria']) x)
     where parceiro_id = v_parceiro and principal;
  else
    insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by)
    values (c.empresa, c.cnpj, c.site, v_tipo, 'landing_saas', 'qualificacao', auth.uid())
    returning id into v_parceiro;
    if c.categoria_id is not null then
      insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, c.categoria_id, true);
    end if;
    insert into public.contatos (nome, cargo, email, whatsapp) values (c.nome, c.cargo, c.email, c.whatsapp) returning id into v_contato;
    insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
    values (v_parceiro, v_contato, '{responsavel_parceria,decisor}', true);
  end if;

  insert into public.aprovacoes (parceiro_id, tipo, aprovado_por, observacao)
  values (v_parceiro, 'aceite_eletronico', null,
    format('Termo padrão versão %s aceito %s em %s; aprovado da fila.', c.termo_versao,
           case c.origem when 'comunidade' then 'no cadastro da Comunidade Wise Partners' else 'na landing page' end,
           to_char(c.aceite_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')));
  update public.parceiros
     set nivel = 'C', nivel_ajuste_motivo = 'Cadastro pela página: nível a confirmar pela carteira no ICP.',
         data_assinatura = public.hoje(), etapa = 'onboarding'
   where id = v_parceiro;

  update public.cadastros_landing set parceiro_id = v_parceiro, status = 'aprovado', aprovado_em = now(), atualizado_em = now() where id = p_id;
  return jsonb_build_object('parceiro_id', v_parceiro, 'email', c.email, 'nome', c.nome, 'empresa', c.empresa,
    'ja_tem_acesso', exists (select 1 from public.perfis where parceiro_id = v_parceiro and ativo));
end $function$;

CREATE OR REPLACE FUNCTION public.cadastrar_parceiro_landing(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cfg public.config_landing;
  v_email text := lower(btrim(p->>'email'));
  v_cnpj text := public.somente_digitos(p->>'cnpj');
  v_cat public.categorias;
  v_parceiro uuid;
  v_contato uuid;
  v_cadastro uuid;
begin
  select * into v_cfg from public.config_landing where id = 1;
  if v_cfg.id is null or not v_cfg.publicada then
    raise exception 'O cadastro pela página está fechado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p->>'nome'), '') = '' or coalesce(btrim(p->>'empresa'), '') = '' or coalesce(btrim(p->>'whatsapp'), '') = '' then
    raise exception 'Preencha nome, empresa e WhatsApp.' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.' using errcode = 'P0001';
  end if;
  if length(v_cnpj) <> 14 then
    raise exception 'CNPJ inválido.' using errcode = 'P0001';
  end if;
  if coalesce((p->>'aceite_termo')::boolean, false) is not true or coalesce((p->>'aceite_privacidade')::boolean, false) is not true then
    raise exception 'É preciso aceitar o termo e a política de privacidade.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.perfis where lower(email) = v_email) or exists (select 1 from public.convites where lower(email) = v_email) then
    raise exception 'Este e-mail já tem acesso ao portal.' using errcode = '23505';
  end if;
  if exists (select 1 from public.parceiros where public.somente_digitos(cnpj) = v_cnpj) then
    raise exception 'Esta empresa já está cadastrada no programa.' using errcode = '23505';
  end if;
  select * into v_cat from public.categorias
   where id = nullif(p->>'categoria_id', '')::uuid and tipo in ('comercial', 'institucional') and ativa;
  if v_cat.id is null then
    raise exception 'Escolha a categoria da sua empresa.' using errcode = 'P0001';
  end if;

  insert into public.parceiros (nome_fantasia, cnpj, site, tipo_parceria, origem, etapa, created_by)
  values (btrim(p->>'empresa'), v_cnpj, nullif(btrim(p->>'site'), ''), 'comercial', 'landing_saas', 'qualificacao', null)
  returning id into v_parceiro;

  insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values (v_parceiro, v_cat.id, true);

  insert into public.contatos (nome, cargo, email, whatsapp)
  values (btrim(p->>'nome'), nullif(btrim(p->>'cargo'), ''), v_email, btrim(p->>'whatsapp'))
  returning id into v_contato;
  insert into public.parceiro_contatos (parceiro_id, contato_id, papeis, principal)
  values (v_parceiro, v_contato, '{responsavel_parceria,decisor}', true);

  insert into public.aprovacoes (parceiro_id, tipo, aprovado_por, observacao)
  values (v_parceiro, 'aceite_eletronico', null, format('Termo padrão versão %s aceito na landing page.', v_cfg.termo_versao));
  update public.parceiros
     set nivel = 'C', nivel_ajuste_motivo = 'Cadastro pela landing page: nível a confirmar pela carteira no ICP.',
         data_assinatura = public.hoje(), etapa = 'onboarding'
   where id = v_parceiro;

  insert into public.convites (email, nome, papel, parceiro_id, is_responsavel_parceiro)
  values (v_email, btrim(p->>'nome'), 'parceiro', v_parceiro, true);

  insert into public.cadastros_landing (
    parceiro_id, nome, email, whatsapp, empresa, cnpj, categoria_id, categoria_nome, clientes_ativos, site, cargo,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, referencia, termo_versao, privacidade_versao)
  values (
    v_parceiro, btrim(p->>'nome'), v_email, btrim(p->>'whatsapp'), btrim(p->>'empresa'), v_cnpj, v_cat.id, v_cat.nome,
    nullif(p->>'clientes_ativos', '')::int, nullif(btrim(p->>'site'), ''), nullif(btrim(p->>'cargo'), ''),
    left(p->>'utm_source', 120), left(p->>'utm_medium', 120), left(p->>'utm_campaign', 120), left(p->>'utm_content', 120),
    left(p->>'utm_term', 120), left(p->>'fbclid', 300), left(p->>'referencia', 300), v_cfg.termo_versao, v_cfg.privacidade_versao)
  returning id into v_cadastro;

  return jsonb_build_object('parceiro_id', v_parceiro, 'cadastro_id', v_cadastro, 'email', v_email);
end $function$;

-- O retrato das regras publicadas passa a mostrar os benefícios por nível (mesmo conteúdo, sem os pacotes)
update public.versoes_regras v set conteudo = (v.conteudo - 'pacotes')
    || jsonb_build_object('beneficios', public.regras_retrato()->'beneficios', 'regua', public.regras_retrato()->'regua')
 where v.conteudo ? 'pacotes';

-- 6. Fora do banco: pacote agendado, colunas e tabela
drop function if exists public.aplicar_pacotes_pendentes();
drop trigger if exists t_hist on public.parceiros;
create trigger t_hist after insert or update on public.parceiros for each row execute function public.trg_historico(
  'nome_fantasia', 'etapa', 'nivel', 'nivel_ajuste_motivo', 'status_atividade', 'motivo_inatividade', 'pausado_ate', 'responsavel_id',
  'carteira_icp', 'data_assinatura', 'motivo_perda', 'tipo_parceria', 'cnpj', 'razao_social');
drop trigger if exists t_hist2 on public.parceiros;
create trigger t_hist2 after update on public.parceiros for each row execute function public.trg_historico(
  'nivel_entrada', 'em_observacao_ate', 'nutricao_ate', 'origem_tipo', 'modelos_atuacao', 'elegibilidade_motivo',
  'aceita_cruzamento_contrato', 'anonimo_ranking');
alter table public.parceiros drop column pacote, drop column pacote_pendente, drop column pacote_pendente_em, drop column pacote_pendente_motivo;
alter table public.revisoes_nivel drop column if exists pacote_novo, drop column if exists pacote_efetivo_em;
drop table public.pacotes;
