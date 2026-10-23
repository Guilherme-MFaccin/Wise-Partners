-- Portal Wise Partners: regras do programa aplicadas no banco (gatilhos e funções)

-- ---------------------------------------------------------------------------
-- Histórico (princípio VI) e notificações
-- ---------------------------------------------------------------------------
create or replace function public.registrar_historico(
  p_tabela text, p_registro uuid, p_parceiro uuid, p_campo text, p_anterior text, p_novo text
) returns void
language sql security definer set search_path = public as $$
  insert into public.historico (tabela, registro_id, parceiro_id, campo, valor_anterior, valor_novo, autor_id)
  values (p_tabela, p_registro, p_parceiro, p_campo, p_anterior, p_novo, auth.uid());
$$;

-- Gatilho genérico: TG_ARGV lista as colunas acompanhadas.
create or replace function public.trg_historico() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  col text;
  v_old jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_new jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  v_reg jsonb := case when tg_op = 'DELETE' then v_old else v_new end;
  v_parceiro uuid;
begin
  v_parceiro := case
    when tg_table_name = 'parceiros' then (v_reg->>'id')::uuid
    when v_reg ? 'parceiro_id' then nullif(v_reg->>'parceiro_id', '')::uuid
    else null end;
  if tg_op = 'INSERT' then
    perform public.registrar_historico(tg_table_name, (v_reg->>'id')::uuid, v_parceiro, 'criado', null, coalesce(v_new->>tg_argv[0], 'registro criado'));
  elsif tg_op = 'DELETE' then
    perform public.registrar_historico(tg_table_name, (v_reg->>'id')::uuid, v_parceiro, 'excluido', coalesce(v_old->>tg_argv[0], 'registro'), null);
  else
    foreach col in array tg_argv loop
      if (v_old->col) is distinct from (v_new->col) then
        perform public.registrar_historico(tg_table_name, (v_reg->>'id')::uuid, v_parceiro, col, v_old->>col, v_new->>col);
      end if;
    end loop;
  end if;
  return null;
end $$;

-- Cria notificação no portal (e e-mail, conforme preferências). Alertas obrigatórios
-- do papel ignoram as preferências.
create or replace function public.notificar(
  p_usuario uuid, p_tipo text, p_titulo text, p_mensagem text, p_link text,
  p_dados jsonb default '{}', p_obrigatorio boolean default false
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_perfil public.perfis;
begin
  if p_usuario is null then return; end if;
  select * into v_perfil from public.perfis where id = p_usuario and ativo;
  if not found then return; end if;
  insert into public.notificacoes (usuario_id, tipo, titulo, mensagem, link, dados, enviar_email)
  values (p_usuario, p_tipo, p_titulo, p_mensagem, p_link, coalesce(p_dados, '{}'),
          p_obrigatorio or not (p_tipo = any (v_perfil.alertas_desativados)));
end $$;

-- Notifica todos os usuários ativos de um parceiro.
create or replace function public.notificar_parceiro(
  p_parceiro uuid, p_tipo text, p_titulo text, p_mensagem text, p_link text, p_dados jsonb default '{}'
) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.perfis where parceiro_id = p_parceiro and ativo loop
    perform public.notificar(r.id, p_tipo, p_titulo, p_mensagem, p_link, p_dados);
  end loop;
end $$;

-- Responsável Wise do parceiro (ou, sem responsável, os administradores).
create or replace function public.notificar_responsavel(
  p_parceiro uuid, p_tipo text, p_titulo text, p_mensagem text, p_link text, p_dados jsonb default '{}'
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_resp uuid;
  r record;
begin
  select responsavel_id into v_resp from public.parceiros where id = p_parceiro;
  if v_resp is not null and exists (select 1 from public.perfis where id = v_resp and ativo) then
    perform public.notificar(v_resp, p_tipo, p_titulo, p_mensagem, p_link, p_dados);
  else
    for r in select id from public.perfis where papel = 'admin' and ativo loop
      perform public.notificar(r.id, p_tipo, p_titulo, p_mensagem, p_link, p_dados);
    end loop;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Parceiros: nível, pacote, status de atividade e funil
-- ---------------------------------------------------------------------------
create or replace function public.nivel_sugerido(p_tipo text, p_carteira int) returns text
language sql stable security definer set search_path = public as $$
  select codigo from public.niveis
  where tipo_parceria = 'comercial' and p_tipo = 'comercial' and p_carteira is not null
    and p_carteira >= coalesce(faixa_min, 0) and (faixa_max is null or p_carteira <= faixa_max)
  order by faixa_min desc nulls last limit 1
$$;

-- Status de atividade por prazos do nível (Apêndice A). Nunca altera o nível.
create or replace function public.calcular_status(
  p_tipo text, p_nivel text, p_ultimo date, p_pausado_ate date, p_criado date, p_ref date default null
) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v_ref date := coalesce(p_ref, public.hoje());
  v_base date := coalesce(p_ultimo, p_criado, v_ref);
  v_morno int;
  v_dormente int;
  v_dias int;
begin
  if p_pausado_ate is not null and p_pausado_ate >= v_ref then
    return 'pausado';
  end if;
  select dias_morno, dias_dormente into v_morno, v_dormente
  from public.niveis where tipo_parceria = coalesce(p_tipo, 'comercial') and codigo = coalesce(p_nivel, 'C');
  v_morno := coalesce(v_morno, 90);
  v_dormente := coalesce(v_dormente, 180);
  v_dias := v_ref - v_base;
  if v_dias > v_dormente then return 'dormente';
  elsif v_dias > v_morno then return 'morno';
  else return 'ativo';
  end if;
end $$;

create or replace function public.is_etapa_perda(p_etapa text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select perda from public.etapas_funil where codigo = p_etapa), false)
$$;

create or replace function public.parceiro_assinado(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parceiros p
    where p.id = p_id and p.data_assinatura is not null and not public.is_etapa_perda(p.etapa)
  )
$$;

create or replace function public.tem_aprovacao_assinatura(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.aprovacoes a where a.parceiro_id = p_id and a.tipo = 'assinatura')
$$;

create or replace function public.trg_parceiros_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_permitidos text[];
begin
  -- Nível sugerido pela carteira no ICP (só parceria comercial)
  if new.tipo_parceria = 'comercial' then
    new.nivel_sugerido := public.nivel_sugerido('comercial', new.carteira_icp);
    if new.nivel is null then
      new.nivel := new.nivel_sugerido;
    end if;
    if new.nivel is not null and new.nivel_sugerido is not null and new.nivel <> new.nivel_sugerido
       and (tg_op = 'INSERT' or new.nivel is distinct from old.nivel)
       and coalesce(btrim(new.nivel_ajuste_motivo), '') = '' then
      raise exception 'Ajuste manual de nível exige motivo (nível sugerido: %).', new.nivel_sugerido
        using errcode = 'P0001';
    end if;
    if new.nivel = new.nivel_sugerido and (tg_op = 'INSERT' or new.nivel is distinct from old.nivel) then
      new.nivel_ajuste_motivo := null;
    end if;
  else
    new.nivel_sugerido := null;
    new.pacote := null;
  end if;

  -- Pacote restrito ao nível
  if new.pacote is not null then
    select niveis_permitidos into v_permitidos from public.pacotes where codigo = new.pacote;
    if new.nivel is null or not (new.nivel = any (v_permitidos)) then
      raise exception 'O pacote % não está disponível para o nível do parceiro.', new.pacote using errcode = 'P0001';
    end if;
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
    if new.etapa = 'parceria_encerrada' and new.data_encerramento is null then
      new.data_encerramento := public.hoje();
    end if;
  end if;

  -- Status de atividade calculado
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
end $$;

create trigger t_parceiros_antes before insert or update on public.parceiros
for each row execute function public.trg_parceiros_antes();

-- Contrapartidas do pacote (Apêndice D), com próximas datas a partir da assinatura.
create or replace function public.proxima_data_periodo(p_base date, p_periodicidade text) returns date
language sql immutable as $$
  select case p_periodicidade
    when 'quinzenal' then p_base + 15
    when 'mensal' then (p_base + interval '1 month')::date
    when 'bimestral' then (p_base + interval '2 months')::date
    when 'trimestral' then (p_base + interval '3 months')::date
    when 'continua' then (p_base + interval '3 months')::date
    else null end
$$;

create or replace function public.gerar_contrapartidas(p_parceiro uuid) returns int
language plpgsql security definer set search_path = public as $$
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
    insert into public.contrapartidas (parceiro_id, catalogo_id, nome, periodicidade, comprovacao, meta, proxima_data)
    values (p.id, c.id, c.nome, v_per, c.comprovacao, c.meta, v_data);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.iniciar_onboarding(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.parceiros;
  v_tarefas jsonb;
  t jsonb;
  v_prazo date := public.add_dias_uteis(public.hoje(), 2);
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
  if p.pacote = 'A' and not exists (
    select 1 from public.ciclos_base_ativa where parceiro_id = p.id and estado in ('fila', 'em_ciclo')
  ) then
    insert into public.ciclos_base_ativa (parceiro_id) values (p.id);
  end if;
end $$;

create or replace function public.atualizar_estrategico_sugerido(p_parceiro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_carteira int;
  v_reunioes int;
  v_min_carteira int := public.config_int('estrategico_carteira_minima', 100);
  v_min_reunioes int := public.config_int('estrategico_reunioes', 3);
  v_dias int := public.config_int('estrategico_janela_dias', 90);
  v_sug boolean;
  v_motivo text;
begin
  select carteira_icp into v_carteira from public.parceiros where id = p_parceiro;
  select count(*) into v_reunioes from public.indicacoes
  where parceiro_id = p_parceiro and sentido = 'parceiro_para_grupo'
    and data_reuniao is not null and data_reuniao >= public.hoje() - v_dias;
  v_sug := coalesce(v_carteira, 0) > v_min_carteira or v_reunioes >= v_min_reunioes;
  v_motivo := case
    when coalesce(v_carteira, 0) > v_min_carteira then format('Carteira no ICP de %s clientes', v_carteira)
    when v_reunioes >= v_min_reunioes then format('%s indicações que viraram reunião em %s dias', v_reunioes, v_dias)
    else null end;
  update public.parceiros_interno
     set estrategico_sugerido = v_sug, estrategico_motivo = v_motivo
   where parceiro_id = p_parceiro
     and (estrategico_sugerido is distinct from v_sug or estrategico_motivo is distinct from v_motivo);
end $$;

create or replace function public.trg_parceiros_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_diretor record;
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
      -- Sai das recomendações na hora; contrapartidas deixam de ser cobradas.
      update public.contrapartidas set ativa = false where parceiro_id = new.id;
    end if;
  end if;

  if tg_op = 'UPDATE' and new.data_assinatura is not null
     and (old.data_assinatura is null or new.pacote is distinct from old.pacote) then
    perform public.gerar_contrapartidas(new.id);
  end if;
  return null;
end $$;

create trigger t_parceiros_depois after insert or update on public.parceiros
for each row execute function public.trg_parceiros_depois();

create trigger t_hist after insert or update on public.parceiros
for each row execute function public.trg_historico('nome_fantasia', 'etapa', 'nivel', 'nivel_ajuste_motivo', 'pacote', 'status_atividade',
  'motivo_inatividade', 'pausado_ate', 'responsavel_id', 'carteira_icp', 'data_assinatura', 'motivo_perda', 'tipo_parceria', 'cnpj', 'razao_social');
create trigger t_hist after update on public.parceiros_interno
for each row execute function public.trg_historico('estrategico', 'estrategico_sugerido');
create trigger t_hist after update on public.parceiros_instrumento
for each row execute function public.trg_historico('programa_proprio', 'instrumento_nome', 'comissao_pct', 'comissao_base', 'comissao_condicao');

-- ---------------------------------------------------------------------------
-- Pontos de contato, atividades e próximos passos
-- ---------------------------------------------------------------------------
create or replace function public.trg_ponto_contato() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_min int;
begin
  update public.parceiros
     set ultimo_contato = greatest(coalesce(ultimo_contato, '1900-01-01'), (new.data at time zone 'America/Sao_Paulo')::date)
   where id = new.parceiro_id;
  if new.tipo_atividade_id is not null then
    select minutos into v_min from public.tipos_atividade where id = new.tipo_atividade_id;
    insert into public.atividades (parceiro_id, tipo_atividade_id, data, minutos, pessoa_id, descricao, ponto_contato_id)
    values (new.parceiro_id, new.tipo_atividade_id, (new.data at time zone 'America/Sao_Paulo')::date,
            coalesce(new.minutos, v_min), new.autor_id, left(coalesce(new.texto, ''), 200), new.id);
  end if;
  return null;
end $$;

create trigger t_ponto_contato after insert on public.pontos_contato
for each row execute function public.trg_ponto_contato();

-- Um próximo passo ativo por parceiro: o novo substitui o anterior.
create or replace function public.trg_proximo_passo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'aberto' then
    update public.proximos_passos set estado = 'substituido'
     where parceiro_id = new.parceiro_id and estado in ('aberto', 'vencido') and id <> new.id;
    if new.data < public.hoje() then
      new.estado := 'vencido';
    end if;
  end if;
  if new.estado = 'feito' and new.concluido_em is null then
    new.concluido_em := now();
  end if;
  if new.responsavel_id is null then
    select responsavel_id into new.responsavel_id from public.parceiros where id = new.parceiro_id;
  end if;
  return new;
end $$;

create trigger t_proximo_passo before insert or update of estado, data on public.proximos_passos
for each row execute function public.trg_proximo_passo();

-- ---------------------------------------------------------------------------
-- Contrapartidas e comprovações (atraso só gera alerta: princípio IV.8)
-- ---------------------------------------------------------------------------
create or replace function public.trg_comprovacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.contrapartidas;
  v_nome text;
begin
  select * into c from public.contrapartidas where id = new.contrapartida_id;
  if tg_op = 'INSERT' then
    if c.parceiro_id <> new.parceiro_id then
      raise exception 'Comprovação de outro parceiro.' using errcode = '42501';
    end if;
    update public.contrapartidas set estado = 'enviada' where id = c.id;
    select nome_fantasia into v_nome from public.parceiros where id = c.parceiro_id;
    perform public.notificar_responsavel(c.parceiro_id, 'comprovacao_enviada', 'Comprovação enviada',
      format('%s enviou comprovação de "%s".', v_nome, c.nome), '/app/parceiros/' || c.parceiro_id || '?aba=contrapartidas');
  elsif new.estado is distinct from old.estado then
    if new.estado = 'validada' then
      new.validada_por := auth.uid();
      new.validada_em := now();
      update public.contrapartidas
         set estado = 'validada',
             proxima_data = case when periodicidade in ('na_assinatura', 'unica', 'por_ciclo', 'por_acao') then null
                                 else public.proxima_data_periodo(greatest(coalesce(proxima_data, public.hoje()), public.hoje()), periodicidade) end
       where id = c.id;
    elsif new.estado = 'recusada' then
      if coalesce(btrim(new.motivo_recusa), '') = '' then
        raise exception 'Informe o motivo da recusa.' using errcode = 'P0001';
      end if;
      new.validada_por := auth.uid();
      new.validada_em := now();
      update public.contrapartidas set estado = 'pendente' where id = c.id;
      perform public.notificar_parceiro(c.parceiro_id, 'comprovacao_recusada', 'Comprovação recusada',
        format('A comprovação de "%s" foi recusada: %s', c.nome, new.motivo_recusa), '/parceiro/contrapartidas');
    end if;
  end if;
  return new;
end $$;

create trigger t_comprovacao before insert or update on public.comprovacoes
for each row execute function public.trg_comprovacao();

create trigger t_hist after insert or update on public.contrapartidas
for each row execute function public.trg_historico('nome', 'estado', 'proxima_data', 'ativa');
create trigger t_hist after insert or update on public.comprovacoes
for each row execute function public.trg_historico('estado', 'motivo_recusa');

-- ---------------------------------------------------------------------------
-- Indicações e comissões
-- ---------------------------------------------------------------------------
create or replace function public.trg_indicacao_antes() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_ok int;
begin
  select count(*), count(*) filter (where (new.aderencia_icp ->> c.chave)::boolean)
    into v_total, v_ok
  from public.criterios_icp c where c.ativo;
  if new.aderencia_icp is null or new.aderencia_icp = '{}'::jsonb then
    new.aderente_icp := null;
  else
    new.aderente_icp := v_total > 0 and v_ok = v_total;
  end if;
  if new.etapa = 'reuniao' and new.data_reuniao is null then new.data_reuniao := public.hoje(); end if;
  if new.etapa = 'fechada' and new.data_fechamento is null then new.data_fechamento := public.hoje(); end if;
  if tg_op = 'UPDATE' and (new.etapa, new.valor_base, new.data_reuniao, new.data_fechamento, new.data_compensacao, new.observacoes)
     is distinct from (old.etapa, old.valor_base, old.data_reuniao, old.data_fechamento, old.data_compensacao, old.observacoes) then
    new.ultima_atualizacao := now();
  end if;
  if new.responsavel_id is null then
    select responsavel_id into new.responsavel_id from public.parceiros where id = new.parceiro_id;
  end if;
  return new;
end $$;

create trigger t_indicacao_antes before insert or update on public.indicacoes
for each row execute function public.trg_indicacao_antes();

-- Cria e atualiza as comissões conforme a regra da empresa vigente na criação.
create or replace function public.sincronizar_comissoes(p_indicacao uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  i public.indicacoes;
  p public.parceiros;
  e public.empresas_grupo;
  ins public.parceiros_instrumento;
  r public.comissoes;
  v_estado text;
  v_fin record;
  v_email_fin text;
  v_sem_comissao boolean;
begin
  select * into i from public.indicacoes where id = p_indicacao;
  select * into p from public.parceiros where id = i.parceiro_id;
  select * into e from public.empresas_grupo where id = i.empresa_grupo_id;

  -- Instituição pública: sem comissão em nenhuma direção. Cliente existente: sem comissão, salvo exceção.
  v_sem_comissao := (p.tipo_parceria = 'institucional' and p.natureza_juridica = 'publica')
                    or (i.cliente_existente and coalesce(btrim(i.excecao_duplicidade), '') = '');

  if not exists (select 1 from public.comissoes where indicacao_id = i.id) then
    if v_sem_comissao then return; end if;
    if i.sentido = 'parceiro_para_grupo' then
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, percentual, base_descricao)
      values (i.id, i.parceiro_id, 'parceiro', e.pct_parceiro, e.base_calculo);
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, responsavel_perfil_id, percentual, base_descricao)
      values (i.id, i.parceiro_id, 'responsavel', p.responsavel_id, e.pct_responsavel, e.base_calculo);
    else
      select * into ins from public.parceiros_instrumento where parceiro_id = i.parceiro_id;
      insert into public.comissoes (indicacao_id, parceiro_id, beneficiario, percentual, base_descricao, observacao)
      values (i.id, i.parceiro_id, 'grupo', ins.comissao_pct,
              coalesce(ins.comissao_base, 'Conforme instrumento do parceiro'),
              case when ins.programa_proprio then 'Instrumento: ' || coalesce(ins.instrumento_nome, 'programa do parceiro') end);
    end if;
  end if;

  for r in select * from public.comissoes where indicacao_id = i.id and estado not in ('paga', 'nf_recebida') loop
    if i.etapa = 'perdida' then
      v_estado := 'cancelada';
    elsif i.etapa = 'fechada' and i.valor_base is not null then
      v_estado := case when i.data_compensacao is not null then 'a_pagar' else 'aguardando_compensacao' end;
    else
      v_estado := 'aguardando_fechamento';
    end if;
    -- "a pagar" já registrado não volta atrás por edição da indicação
    if r.estado = 'a_pagar' and v_estado <> 'cancelada' then v_estado := 'a_pagar'; end if;

    update public.comissoes
       set base_valor = i.valor_base,
           valor = case when i.valor_base is not null and r.percentual is not null
                        then round(i.valor_base * r.percentual / 100, 2) end,
           estado = v_estado,
           a_pagar_em = case when v_estado = 'a_pagar' then coalesce(r.a_pagar_em, now()) else r.a_pagar_em end
     where id = r.id;

    if v_estado = 'a_pagar' and r.estado <> 'a_pagar' and r.beneficiario in ('parceiro', 'responsavel') then
      for v_fin in select id from public.perfis where papel = 'financeiro' and ativo loop
        perform public.notificar(v_fin.id, 'comissao_a_pagar', 'Comissão a pagar',
          format('%s: comissão de %s sobre o cliente indicado para %s.', p.nome_fantasia,
                 case r.beneficiario when 'parceiro' then 'parceiro' else 'responsável pela parceria' end, e.nome),
          '/app/comissoes', jsonb_build_object('comissao_id', r.id), true);
      end loop;
      v_email_fin := public.config('email_financeiro') #>> '{}';
      if coalesce(v_email_fin, '') <> '' and not exists (select 1 from public.perfis where papel = 'financeiro' and ativo and lower(email) = lower(v_email_fin)) then
        insert into public.notificacoes (email_destino, tipo, titulo, mensagem, link, dados)
        values (v_email_fin, 'comissao_a_pagar', 'Comissão a pagar',
                format('%s: comissão de %s sobre o cliente indicado para %s.', p.nome_fantasia,
                       case r.beneficiario when 'parceiro' then 'parceiro' else 'responsável pela parceria' end, e.nome),
                '/app/comissoes', jsonb_build_object('comissao_id', r.id));
      end if;
    end if;
  end loop;
end $$;

create or replace function public.trg_indicacao_depois() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.sincronizar_comissoes(new.id);
  if tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    update public.parceiros
       set ultimo_contato = greatest(coalesce(ultimo_contato, '1900-01-01'), public.hoje())
     where id = new.parceiro_id;
    update public.clientes set ultima_interacao = public.hoje() where id = new.cliente_id;
  end if;
  if tg_op = 'INSERT' or new.data_reuniao is distinct from old.data_reuniao then
    perform public.atualizar_estrategico_sugerido(new.parceiro_id);
  end if;
  return null;
end $$;

create trigger t_indicacao_depois after insert or update on public.indicacoes
for each row execute function public.trg_indicacao_depois();

create trigger t_hist after insert or update on public.indicacoes
for each row execute function public.trg_historico('etapa', 'valor_base', 'data_reuniao', 'data_fechamento', 'data_compensacao',
  'cliente_existente', 'excecao_duplicidade', 'atualizacao_pendente', 'responsavel_id');
create trigger t_hist after insert or update on public.comissoes
for each row execute function public.trg_historico('estado', 'valor', 'percentual');

-- Registro de indicação: única porta de entrada (primeiro registro, consentimento, papéis).
create or replace function public.registrar_indicacao(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_papel text := public.papel_atual();
  v_parceiro uuid;
  v_sentido text := coalesce(p->>'sentido', 'parceiro_para_grupo');
  v_empresa uuid := (p->>'empresa_grupo_id')::uuid;
  v_cliente public.clientes;
  v_cnpj text := public.somente_digitos(p->>'cliente_cnpj');
  v_razao text := btrim(coalesce(p->>'cliente_razao_social', ''));
  v_pessoal boolean;
  v_consent boolean := coalesce((p->>'consentimento')::boolean, false);
  v_existente record;
  v_ultima date;
  v_excecao text := nullif(btrim(coalesce(p->>'excecao_justificativa', '')), '');
  v_origem text := coalesce(p->>'origem', 'outra');
  v_id uuid;
  v_nome_parceiro text;
begin
  if v_papel is null or v_papel = 'financeiro' then
    raise exception 'Sem permissão para registrar indicações.' using errcode = '42501';
  end if;
  if v_papel = 'parceiro' then
    v_parceiro := public.parceiro_atual();
    v_sentido := 'parceiro_para_grupo';
    v_origem := 'portal_parceiro';
    v_excecao := null;
  else
    v_parceiro := (p->>'parceiro_id')::uuid;
  end if;
  if v_parceiro is null or v_empresa is null or v_razao = '' then
    raise exception 'Informe parceiro, empresa do grupo e cliente.' using errcode = 'P0001';
  end if;
  if v_sentido not in ('parceiro_para_grupo', 'grupo_para_parceiro') then
    raise exception 'Sentido inválido.' using errcode = 'P0001';
  end if;

  v_pessoal := coalesce(btrim(p->>'contato_nome'), '') <> '' or coalesce(btrim(p->>'contato_email'), '') <> ''
               or coalesce(btrim(p->>'contato_telefone'), '') <> '';
  if v_pessoal and not v_consent then
    raise exception 'Declare o consentimento para compartilhar os dados pessoais do contato do cliente.' using errcode = 'P0001';
  end if;

  select * into v_cliente from public.clientes c
   where (v_cnpj is not null and c.cnpj_digitos = v_cnpj)
      or (c.razao_normalizada = public.normalizar_texto(v_razao))
   order by (v_cnpj is not null and c.cnpj_digitos = v_cnpj) desc, c.created_at
   limit 1;

  -- Primeiro registro (cláusula 9): mesmo cliente para a mesma empresa do grupo
  if v_cliente.id is not null and v_sentido = 'parceiro_para_grupo' then
    select i.*, pa.nome_fantasia into v_existente
      from public.indicacoes i join public.parceiros pa on pa.id = i.parceiro_id
     where i.cliente_id = v_cliente.id and i.sentido = 'parceiro_para_grupo' and i.empresa_grupo_id = v_empresa
     order by i.created_at limit 1;
    if v_existente.id is not null then
      v_ultima := greatest(coalesce(v_cliente.ultima_interacao, v_existente.data), (v_existente.ultima_atualizacao at time zone 'America/Sao_Paulo')::date);
      if v_excecao is null then
        if v_papel = 'parceiro' then
          raise exception 'Este cliente já foi indicado anteriormente. Vale o primeiro registro.' using errcode = 'P0001';
        end if;
        raise exception 'Cliente já indicado por % em %. Vale o primeiro registro.', v_existente.nome_fantasia, to_char(v_existente.data, 'DD/MM/YYYY')
          using errcode = 'P0001', hint = 'duplicado';
      end if;
      if v_papel <> 'admin' then
        raise exception 'Somente administradores podem registrar exceção ao primeiro registro.' using errcode = '42501';
      end if;
      if v_ultima > public.hoje() - interval '6 months' then
        raise exception 'A exceção só vale para contato sem interação há 6 meses ou mais (última interação em %).', to_char(v_ultima, 'DD/MM/YYYY')
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  if v_cliente.id is null then
    insert into public.clientes (razao_social, cnpj, contato_nome, email, telefone, consentimento, consentimento_por, consentimento_em)
    values (v_razao, nullif(p->>'cliente_cnpj', ''), nullif(btrim(p->>'contato_nome'), ''), nullif(btrim(p->>'contato_email'), ''),
            nullif(btrim(p->>'contato_telefone'), ''), v_consent, case when v_consent then auth.uid() end,
            case when v_consent then now() end)
    returning * into v_cliente;
  elsif v_pessoal then
    update public.clientes
       set contato_nome = coalesce(nullif(btrim(p->>'contato_nome'), ''), contato_nome),
           email = coalesce(nullif(btrim(p->>'contato_email'), ''), email),
           telefone = coalesce(nullif(btrim(p->>'contato_telefone'), ''), telefone),
           consentimento = true, consentimento_por = auth.uid(), consentimento_em = now()
     where id = v_cliente.id;
  end if;

  insert into public.indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem, origem_detalhe, data,
    responsavel_id, aderencia_icp, cliente_existente, observacoes, excecao_duplicidade, excecao_por, pedido_rfp_id)
  values (v_sentido, v_parceiro, v_empresa, v_cliente.id, v_origem, nullif(p->>'origem_detalhe', ''),
    coalesce((p->>'data')::date, public.hoje()), nullif(p->>'responsavel_id', '')::uuid,
    coalesce(p->'aderencia_icp', '{}'::jsonb), coalesce((p->>'cliente_existente')::boolean, false),
    nullif(p->>'observacoes', ''), v_excecao, case when v_excecao is not null then auth.uid() end,
    nullif(p->>'pedido_rfp_id', '')::uuid)
  returning id into v_id;

  if v_papel = 'parceiro' then
    select nome_fantasia into v_nome_parceiro from public.parceiros where id = v_parceiro;
    perform public.notificar_responsavel(v_parceiro, 'indicacao_nova', 'Nova indicação pelo portal',
      format('%s indicou %s.', v_nome_parceiro, v_razao), '/app/indicacoes?id=' || v_id);
  end if;
  return v_id;
end $$;

-- Parceiro atualiza o resultado de indicação recebida: fica pendente de confirmação da Wise.
create or replace function public.parceiro_atualizar_indicacao(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  i public.indicacoes;
  v_nome text;
begin
  select * into i from public.indicacoes where id = p_id;
  if i.id is null or i.parceiro_id is distinct from public.parceiro_atual() or i.sentido <> 'grupo_para_parceiro' then
    raise exception 'Indicação não encontrada.' using errcode = '42501';
  end if;
  if coalesce(p->>'etapa', 'nova') not in ('nova', 'em_contato', 'reuniao', 'proposta', 'fechada', 'perdida') then
    raise exception 'Etapa inválida.' using errcode = 'P0001';
  end if;
  update public.indicacoes
     set atualizacao_pendente = jsonb_strip_nulls(jsonb_build_object(
           'etapa', p->>'etapa', 'valor_base', p->'valor_base', 'data_reuniao', p->>'data_reuniao',
           'observacao', p->>'observacao')),
         atualizacao_por = auth.uid(), atualizacao_em = now()
   where id = p_id;
  select nome_fantasia into v_nome from public.parceiros where id = i.parceiro_id;
  perform public.notificar_responsavel(i.parceiro_id, 'indicacao_atualizada', 'Atualização de indicação para confirmar',
    format('%s atualizou o resultado de uma indicação recebida.', v_nome), '/app/indicacoes?id=' || p_id);
end $$;

create or replace function public.confirmar_atualizacao_indicacao(p_id uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  i public.indicacoes;
  u jsonb;
begin
  if not public.is_parcerias() then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select * into i from public.indicacoes where id = p_id;
  u := i.atualizacao_pendente;
  if u is null then return; end if;
  if p_aceitar then
    update public.indicacoes
       set etapa = coalesce(u->>'etapa', etapa),
           valor_base = coalesce((u->>'valor_base')::numeric, valor_base),
           data_reuniao = coalesce((u->>'data_reuniao')::date, data_reuniao),
           observacoes = concat_ws(E'\n', observacoes, nullif('Parceiro: ' || (u->>'observacao'), 'Parceiro: ')),
           atualizacao_pendente = null
     where id = p_id;
  else
    update public.indicacoes set atualizacao_pendente = null where id = p_id;
  end if;
end $$;

-- Financeiro marca nota fiscal e pagamento; parcerias pode mudar qualquer estado.
create or replace function public.atualizar_estado_comissao(p_id uuid, p_estado text, p_observacao text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.comissoes;
begin
  select * into c from public.comissoes where id = p_id;
  if c.id is null then raise exception 'Comissão não encontrada.' using errcode = 'P0001'; end if;
  if public.is_parcerias() then
    null;
  elsif public.is_financeiro() then
    if c.beneficiario = 'grupo' or c.estado not in ('a_pagar', 'nf_recebida') or p_estado not in ('nf_recebida', 'paga') then
      raise exception 'O financeiro só registra nota fiscal e pagamento de comissões a pagar.' using errcode = '42501';
    end if;
  else
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  update public.comissoes
     set estado = p_estado,
         nf_recebida_em = case when p_estado = 'nf_recebida' then now() else nf_recebida_em end,
         paga_em = case when p_estado = 'paga' then now() else paga_em end,
         observacao = coalesce(p_observacao, observacao)
   where id = p_id;
end $$;

-- ---------------------------------------------------------------------------
-- Ficha de apresentação: propostas do parceiro com validação da Wise
-- ---------------------------------------------------------------------------
create or replace function public.trg_proposta_ficha() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text;
  v_nome text;
begin
  if tg_op = 'INSERT' then
    for k in select jsonb_object_keys(new.valores) loop
      if not exists (select 1 from public.campos_categoria c where c.id::text = k and c.ativo and not c.interno and c.parceiro_edita) then
        raise exception 'Campo % não pode ser alterado pelo parceiro.', k using errcode = '42501';
      end if;
    end loop;
    update public.propostas_ficha set estado = 'substituida'
     where parceiro_id = new.parceiro_id and estado = 'pendente';
    new.proposta_por := coalesce(new.proposta_por, auth.uid());
  end if;
  return new;
end $$;

create trigger t_proposta_ficha before insert on public.propostas_ficha
for each row execute function public.trg_proposta_ficha();

create or replace function public.trg_proposta_ficha_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  select nome_fantasia into v_nome from public.parceiros where id = new.parceiro_id;
  perform public.notificar_responsavel(new.parceiro_id, 'proposta_ficha', 'Proposta de alteração da ficha',
    format('%s propôs alterações na ficha de apresentação.', v_nome), '/app/parceiros/' || new.parceiro_id || '?aba=ficha');
  return null;
end $$;

create trigger t_proposta_ficha_depois after insert on public.propostas_ficha
for each row execute function public.trg_proposta_ficha_depois();

create trigger t_hist after insert or update on public.propostas_ficha
for each row execute function public.trg_historico('estado', 'motivo_recusa');

create or replace function public.revisar_proposta_ficha(p_id uuid, p_aprovar boolean, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  pr public.propostas_ficha;
  k text;
begin
  if not public.is_parcerias() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into pr from public.propostas_ficha where id = p_id and estado = 'pendente';
  if pr.id is null then raise exception 'Proposta não encontrada ou já revisada.' using errcode = 'P0001'; end if;
  if p_aprovar then
    for k in select jsonb_object_keys(pr.valores) loop
      insert into public.parceiro_campos (parceiro_id, campo_id, valor, versao, updated_by, updated_at)
      values (pr.parceiro_id, k::uuid, pr.valores->k, 1, auth.uid(), now())
      on conflict (parceiro_id, campo_id) do update
        set valor = excluded.valor, versao = public.parceiro_campos.versao + 1, updated_by = auth.uid(), updated_at = now();
    end loop;
    update public.propostas_ficha set estado = 'aprovada', revisada_por = auth.uid(), revisada_em = now() where id = p_id;
    perform public.notificar_parceiro(pr.parceiro_id, 'proposta_ficha_aprovada', 'Ficha atualizada',
      'A Wise validou a sua proposta e a nova versão da ficha já está valendo.', '/parceiro/ficha');
  else
    if coalesce(btrim(p_motivo), '') = '' then raise exception 'Informe o motivo da recusa.' using errcode = 'P0001'; end if;
    update public.propostas_ficha set estado = 'recusada', motivo_recusa = p_motivo, revisada_por = auth.uid(), revisada_em = now() where id = p_id;
    perform public.notificar_parceiro(pr.parceiro_id, 'proposta_ficha_recusada', 'Proposta de ficha não aprovada',
      p_motivo, '/parceiro/ficha');
  end if;
end $$;

-- Histórico de campos da ficha
create or replace function public.trg_parceiro_campos_hist() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_rotulo text;
begin
  if tg_op = 'UPDATE' and new.valor is not distinct from old.valor then return null; end if;
  select rotulo into v_rotulo from public.campos_categoria where id = new.campo_id;
  perform public.registrar_historico('parceiro_campos', new.campo_id, new.parceiro_id, 'ficha: ' || coalesce(v_rotulo, ''),
    case when tg_op = 'UPDATE' then left(old.valor::text, 500) end, left(new.valor::text, 500));
  return null;
end $$;

create trigger t_hist after insert or update on public.parceiro_campos
for each row execute function public.trg_parceiro_campos_hist();

-- ---------------------------------------------------------------------------
-- Aprovações, documentos, contratos e acessos
-- ---------------------------------------------------------------------------
create or replace function public.trg_aprovacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  select nome_fantasia into v_nome from public.parceiros where id = new.parceiro_id;
  perform public.notificar_responsavel(new.parceiro_id, 'aprovacao_registrada', 'Assinatura aprovada pelo Diretor',
    format('A assinatura de %s foi aprovada. O parceiro pode seguir para fechamento.', v_nome), '/app/parceiros/' || new.parceiro_id);
  return null;
end $$;

create trigger t_aprovacao after insert on public.aprovacoes for each row execute function public.trg_aprovacao();
create trigger t_hist after insert on public.aprovacoes for each row execute function public.trg_historico('tipo');
create trigger t_hist after insert on public.contratos_gerados for each row execute function public.trg_historico('caminho_docx');
create trigger t_hist after insert or delete on public.documentos for each row execute function public.trg_historico('nome');
create trigger t_hist after insert or update on public.quadros_identificacao for each row execute function public.trg_historico('versao');
create trigger t_hist after insert or update on public.perfis
for each row execute function public.trg_historico('email', 'papel', 'ativo', 'is_diretor', 'is_responsavel_parceiro', 'parceiro_id');
create trigger t_hist after insert or update on public.parceiro_categorias
for each row execute function public.trg_historico('principal');

-- Perfis: só administrador muda papel, vínculo, diretor e ativo (parceiro responsável usa função própria).
create or replace function public.trg_perfis_protege() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() or current_setting('wise.bypass_perfil', true) = 'on' then
    return new;
  end if;
  if (new.papel, new.empresa_grupo_id, new.parceiro_id, new.is_diretor, new.is_responsavel_parceiro, new.ativo, new.email)
     is distinct from (old.papel, old.empresa_grupo_id, old.parceiro_id, old.is_diretor, old.is_responsavel_parceiro, old.ativo, old.email) then
    raise exception 'Somente administradores alteram papel e acesso.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger t_perfis_protege before update on public.perfis for each row execute function public.trg_perfis_protege();

-- Responsável do parceiro desativa ou reativa usuário da própria empresa (FR-072).
create or replace function public.definir_acesso_usuario_parceiro(p_perfil uuid, p_ativo boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v public.perfis;
begin
  select * into v from public.perfis where id = p_perfil;
  if v.id is null or v.papel <> 'parceiro' then raise exception 'Usuário não encontrado.' using errcode = 'P0001'; end if;
  if not (public.is_parcerias() or (public.is_responsavel_parceiro() and v.parceiro_id = public.parceiro_atual())) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if v.id = auth.uid() and not p_ativo then
    raise exception 'Você não pode desativar o próprio acesso.' using errcode = 'P0001';
  end if;
  perform set_config('wise.bypass_perfil', 'on', true);
  update public.perfis set ativo = p_ativo where id = p_perfil;
  perform set_config('wise.bypass_perfil', 'off', true);
end $$;

-- Novo usuário do Auth: cria o perfil a partir do convite (sem convite, sem acesso).
create or replace function public.trg_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare c public.convites;
begin
  select * into c from public.convites where lower(email) = lower(new.email);
  if c.email is not null then
    insert into public.perfis (id, nome, email, papel, empresa_grupo_id, parceiro_id, is_diretor, is_responsavel_parceiro)
    values (new.id, coalesce(c.nome, split_part(new.email, '@', 1)), lower(new.email), c.papel, c.empresa_grupo_id,
            c.parceiro_id, c.is_diretor, c.is_responsavel_parceiro)
    on conflict (id) do nothing;
    delete from public.convites where email = c.email;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.trg_novo_usuario();

-- ---------------------------------------------------------------------------
-- Base Ativa
-- ---------------------------------------------------------------------------
create or replace function public.trg_ciclo_base_ativa() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  i int;
  v_resp text;
begin
  if tg_op = 'UPDATE' and new.estado = 'em_ciclo' and old.estado <> 'em_ciclo' then
    if not public.is_admin() and auth.uid() is not null then
      raise exception 'Somente administradores iniciam ciclos do Base Ativa.' using errcode = '42501';
    end if;
    new.inicio := coalesce(new.inicio, public.hoje());
  end if;
  if tg_op = 'UPDATE' and new.evento_data is not null and old.evento_data is null and new.estado = 'em_ciclo' then
    new.estado := 'concluido';
    new.concluido_em := public.hoje();
    new.certificado_em := public.hoje();
    new.revisao_em := (public.hoje() + interval '6 months')::date;
    if new.certificado_responsavel is null then
      select c.nome into v_resp from public.parceiro_contatos pc join public.contatos c on c.id = pc.contato_id
       where pc.parceiro_id = new.parceiro_id and 'responsavel_parceria' = any (pc.papeis) limit 1;
      new.certificado_responsavel := v_resp;
    end if;
  end if;
  return new;
end $$;

create trigger t_ciclo before update on public.ciclos_base_ativa for each row execute function public.trg_ciclo_base_ativa();

create or replace function public.trg_ciclo_depois() returns trigger
language plpgsql security definer set search_path = public as $$
declare i int;
begin
  if new.estado = 'em_ciclo' and old.estado <> 'em_ciclo'
     and not exists (select 1 from public.base_ativa_encontros where ciclo_id = new.id) then
    for i in 1..6 loop
      insert into public.base_ativa_encontros (ciclo_id, numero, data) values (new.id, i, new.inicio + (i - 1) * 14);
    end loop;
  end if;
  return null;
end $$;

create trigger t_ciclo_depois after update on public.ciclos_base_ativa for each row execute function public.trg_ciclo_depois();
create trigger t_hist after insert or update on public.ciclos_base_ativa
for each row execute function public.trg_historico('estado', 'inicio', 'evento_data', 'revisao_em');

-- Dois encontros seguidos não realizados por indisponibilidade do parceiro: ciclo suspenso.
create or replace function public.trg_encontro() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ciclo public.ciclos_base_ativa;
  v_ant public.base_ativa_encontros;
  v_nome text;
begin
  if new.realizado is false and new.motivo_nao_realizado = 'indisponibilidade_parceiro' then
    select * into v_ant from public.base_ativa_encontros
     where ciclo_id = new.ciclo_id and numero = new.numero - 1;
    if v_ant.realizado is false and v_ant.motivo_nao_realizado = 'indisponibilidade_parceiro' then
      update public.ciclos_base_ativa set estado = 'suspenso' where id = new.ciclo_id and estado = 'em_ciclo'
      returning * into v_ciclo;
      if v_ciclo.id is not null then
        select nome_fantasia into v_nome from public.parceiros where id = v_ciclo.parceiro_id;
        perform public.notificar_responsavel(v_ciclo.parceiro_id, 'base_ativa_suspensa', 'Ciclo do Base Ativa suspenso',
          format('%s teve dois encontros seguidos não realizados por indisponibilidade. O ciclo foi suspenso.', v_nome),
          '/app/base-ativa');
      end if;
    end if;
  end if;
  return null;
end $$;

create trigger t_encontro after insert or update on public.base_ativa_encontros
for each row execute function public.trg_encontro();

-- Fila do Base Ativa: estratégicos à frente, depois ordem de assinatura.
create or replace view public.v_fila_base_ativa with (security_invoker = true) as
select c.id as ciclo_id, c.parceiro_id, p.nome_fantasia, p.data_assinatura, c.entrou_fila_em, c.previsao_inicio,
       coalesce(pi.estrategico, false) as estrategico,
       row_number() over (order by coalesce(pi.estrategico, false) desc, p.data_assinatura nulls last, c.entrou_fila_em) as posicao
from public.ciclos_base_ativa c
join public.parceiros p on p.id = c.parceiro_id
left join public.parceiros_interno pi on pi.parceiro_id = p.id
where c.estado = 'fila';
