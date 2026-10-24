-- Portal Wise Partners 2.0: rotinas diária e trimestral, pendências, painel da v1 com 15 dias,
-- ajustes de políticas e funções da v1 (seções 4.1 e 6 do briefing)

-- Controle de alertas já enviados pelas rotinas (para avisar uma vez só por ocorrência).
-- Sem políticas: só as funções security definer leem e escrevem.
create table public.alertas_rotina (
  tipo text not null,
  referencia_id uuid not null,
  chave text not null,
  enviado_em timestamptz not null default now(),
  primary key (tipo, referencia_id, chave)
);
select public._proteger_tabela('alertas_rotina');
revoke all on public.alertas_rotina from authenticated;

-- Registra o alerta e devolve true se ainda não tinha sido enviado
create or replace function public.alerta_novo(p_tipo text, p_ref uuid, p_chave text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into public.alertas_rotina (tipo, referencia_id, chave) values (p_tipo, p_ref, coalesce(p_chave, ''))
  on conflict do nothing;
  return found;
end $$;
revoke execute on function public.alerta_novo(text, uuid, text) from public, anon, authenticated;

-- Atividade automática pelo tipo (Apêndice N), usada pelos fluxos que geram esforço
create or replace function public.registrar_atividade_auto(p_parceiro uuid, p_chave_tipo text, p_referencia text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t public.tipos_atividade;
  v uuid;
begin
  select * into t from public.tipos_atividade where chave = p_chave_tipo and ativo;
  if t.id is null or auth.uid() is null then return null; end if;
  insert into public.atividades (parceiro_id, tipo_atividade_id, data, minutos, pessoa_id, descricao)
  values (p_parceiro, t.id, public.hoje(), t.minutos, auth.uid(), coalesce(p_referencia, t.nome))
  returning id into v;
  return v;
end $$;
revoke execute on function public.registrar_atividade_auto(uuid, text, text) from public, anon, authenticated;

-- Parceiro avisado do desligamento não recebe RFP (seção 4.1)
create or replace function public.elegivel_rfp(p_parceiro uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.parceiro_assinado(p_parceiro)
     and coalesce(btrim(public.valor_campo(p_parceiro, 'o_que_faz') #>> '{}'), '') <> ''
     and not exists (select 1 from public.fluxos_desligamento f where f.parceiro_id = p_parceiro and f.estado = 'avisado')
$$;

-- Parâmetros: o parceiro lê também as chaves públicas novas
drop policy cfg_ler on public.configuracoes;
create policy cfg_ler on public.configuracoes for select to authenticated
  using (public.is_parcerias()
         or (public.is_interno() and chave not in ('email_financeiro'))
         or (public.papel_atual() = 'parceiro' and chave in ('wise_hub_url', 'calendario_mentoria', 'calendario_eventos',
             'materiais_parceiro', 'regras_publicadas', 'link_indicacao_texto', 'termo_cruzamento_texto', 'termo_cruzamento_versao')));

-- ---------------------------------------------------------------------------
-- Marcos do onboarding (Apêndice F): 30 dias (trilha iniciada e 1 indicação) e 60 dias
-- (responsável certificado e 1 indicação qualificada). O de 90 é a ativação.
-- ---------------------------------------------------------------------------
create or replace function public.verificar_marcos_onboarding(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_resp uuid;
begin
  select pf.id into v_resp from public.perfis pf
   where pf.parceiro_id = p_parceiro and pf.ativo and pf.is_responsavel_parceiro limit 1;
  update public.marcos_onboarding m set cumprido_em = public.hoje()
   where m.parceiro_id = p_parceiro and m.tipo = 'marco_30' and m.cumprido_em is null
     and exists (select 1 from public.trilha_progresso tp join public.trilha_modulos tm on tm.id = tp.modulo_id
                   join public.trilhas t on t.id = tm.trilha_id
                  where tp.perfil_id = v_resp and t.chave = 'como_vender')
     and exists (select 1 from public.indicacoes i where i.parceiro_id = p_parceiro and i.sentido = 'parceiro_para_grupo');
  update public.marcos_onboarding m set cumprido_em = public.hoje()
   where m.parceiro_id = p_parceiro and m.tipo = 'marco_60' and m.cumprido_em is null
     and public.responsavel_certificado(p_parceiro)
     and exists (select 1 from public.indicacoes i where i.parceiro_id = p_parceiro and i.sentido = 'parceiro_para_grupo' and i.qualificada);
end $$;
revoke execute on function public.verificar_marcos_onboarding(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Rotina diária v2 (pg_cron, 6h30): itens da v1 e os novos da seção 4.1
-- ---------------------------------------------------------------------------
create or replace function public.rotina_diaria() returns jsonb
language plpgsql security definer set search_path = public as $$
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
  n_pacotes int;
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
  for r in select p.id, p.nome_fantasia, p.etapa_antes_nutricao, p.responsavel_id from public.parceiros p
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
   where p.status_atividade is distinct from public.calcular_status(p.tipo_parceria, p.nivel, p.ultimo_contato, p.pausado_ate, p.created_at::date)
      or (p.pausado_ate is not null and p.pausado_ate < v_hoje);
  get diagnostics n_status = row_count;

  update public.proximos_passos set estado = 'vencido' where estado = 'aberto' and data < v_hoje;
  get diagnostics n_passos = row_count;

  update public.contrapartidas set estado = 'atrasada'
   where ativa and estado in ('pendente', 'validada', 'recusada') and proxima_data is not null and proxima_data < v_hoje;
  get diagnostics n_contra = row_count;

  for r in select id from public.parceiros loop
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
  for r in select p.id, p.nome_fantasia from public.parceiros p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa) loop
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
  for r in select pl.*, p.nome_fantasia, p.responsavel_id from public.planos_onboarding pl join public.parceiros p on p.id = pl.parceiro_id
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

  -- Subida de nível por resultado (imediata) e pacotes agendados (FR-123)
  for r in select id from public.parceiros where data_assinatura is not null and not public.is_etapa_perda(etapa) and tipo_parceria = 'comercial' loop
    if public.verificar_subida_nivel(r.id) is not null then n_subida := n_subida + 1; end if;
  end loop;
  n_pacotes := public.aplicar_pacotes_pendentes();

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
    'onboarding', n_onb, 'subidas', n_subida, 'pacotes', n_pacotes, 'faixas', n_faixas, 'desligamentos', n_desl,
    'checagens', n_check, 'purga_cruzamento', n_purga);
end $$;
revoke execute on function public.rotina_diaria() from public, anon, authenticated;

-- Primeiro dia útil do trimestre da data
create or replace function public.primeiro_dia_util_trimestre(p_data date) returns date
language sql stable security definer set search_path = public as $$
  select public.add_dias_uteis(date_trunc('quarter', p_data)::date - 1, 1)
$$;

-- Rotina trimestral (pg_cron diário 6h45; só age no primeiro dia útil do trimestre)
create or replace function public.rotina_trimestral(p_forcar boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hoje date := public.hoje();
  n_rev int;
  n_faixas int;
  n_pesq int;
  v_fase jsonb;
begin
  if not p_forcar and v_hoje <> public.primeiro_dia_util_trimestre(v_hoje) then
    return jsonb_build_object('executada', false);
  end if;
  if not public.alerta_novo('rotina_trimestral', '00000000-0000-0000-0000-000000000000'::uuid, date_trunc('quarter', v_hoje)::date::text)
     and not p_forcar then
    return jsonb_build_object('executada', false, 'motivo', 'já executada neste trimestre');
  end if;
  n_rev := public.revisao_trimestral(v_hoje);
  n_faixas := public.calcular_faixas();
  n_pesq := public.enviar_pesquisa_trimestral();
  v_fase := public.sugerir_fase();
  return jsonb_build_object('executada', true, 'revisoes', n_rev, 'faixas', n_faixas, 'pesquisas', n_pesq, 'fase', v_fase);
end $$;
revoke execute on function public.rotina_trimestral(boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pendências por responsável v2 (e-mail diário). Só a Edge Function (service_role) chama.
-- Indicação parada passa a ser 15 dias (config indicacao_parada_dias).
-- ---------------------------------------------------------------------------
create or replace function public.pendencias_diarias() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_cf int := public.config_int('parada_contato_feito_dias_uteis', 4);
  v_pd int := public.config_int('parada_proposta_dias', 7);
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
            and ((p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, v_hoje) >= v_cf)
              or (p.etapa = 'proposta_decisor' and v_hoje - p.etapa_desde::date >= v_pd))),
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
end $$;

-- ---------------------------------------------------------------------------
-- Painel da v1 (aba "lista completa"), recriado com indicação parada em 15 dias
-- ---------------------------------------------------------------------------
create or replace function public.painel_semanal(p_inicio date default null, p_fim date default null) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare
  v_ini date := coalesce(p_inicio, public.hoje() - 7);
  v_fim date := coalesce(p_fim, public.hoje());
  v_cf int := public.config_int('parada_contato_feito_dias_uteis', 4);
  v_pd int := public.config_int('parada_proposta_dias', 7);
  res jsonb;
begin
  select jsonb_build_object(
    'periodo', jsonb_build_object('inicio', v_ini, 'fim', v_fim),
    'meta_assinados', public.config_int('meta_assinados', 100),
    'assinados', (select count(*) from public.parceiros p where p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)),
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
              where (p.etapa = 'contato_feito' and public.dias_uteis_entre(p.etapa_desde::date, public.hoje()) >= v_cf)
                 or (p.etapa = 'proposta_decisor' and public.hoje() - p.etapa_desde::date >= v_pd)),
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
end $$;

-- ---------------------------------------------------------------------------
-- Funções auxiliares da v2 usadas só dentro de outras funções: sem execução direta
-- (custo-hora, requisitos e SLA não podem ser consultados por quem não tem acesso aos dados)
-- ---------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array['_proteger_tabela(text)', 'calcular_sla(public.indicacoes)', 'sla_vencidos(public.indicacoes)',
    'cumpre_nivel(uuid, text, date)', 'custo_hora_em(uuid, date)', 'custos_diretos_expandidos(date, date)',
    'garantir_link_indicacao(uuid)', 'pessoas_certificadas(uuid, text)', 'responsavel_certificado(uuid)', 'regua_status(uuid)',
    'requisito_vigente(text, text, date)', 'scorecard_vigente(uuid)', 'ultima_interacao_cliente(uuid)', 'nivel_entrada_calc(int, numeric)',
    'primeiro_dia_util_trimestre(date)', 'quadrante_cruzamento(text, text)', 'acao_sugerida_quadrante(text)'] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Dados do relatório semanal do Diretor (FR-141): número principal, ROI do trimestre e destaques.
-- Só a Edge Function relatorio-semanal (service_role) chama.
-- ---------------------------------------------------------------------------
create or replace function public.relatorio_semanal_v2(p_inicio date, p_fim date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
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
    'destaques', (select coalesce(jsonb_agg(jsonb_build_object('chave', i.chave, 'etapa', i.etapa, 'nome', i.nome, 'formato', i.formato,
                    'valor', v_sem->i.chave) order by i.ordem), '[]')
                  from public.indicadores i where i.ativo and i.destaque));
end $$;
revoke execute on function public.relatorio_semanal_v2(date, date) from public, anon, authenticated;
grant execute on function public.relatorio_semanal_v2(date, date) to service_role;
